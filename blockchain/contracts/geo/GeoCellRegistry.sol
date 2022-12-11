// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @author Felipe Louzas
 * @notice Implementa registro de celulas geoindexadas associadas a imoveis.
 */
abstract contract GeoCellRegistry {
    /**
     * @notice Nome descritivo do registro
     */
    string public desc;

    /**
     * @notice Código EPSG do Sistema de Referência Geospacial
     */
    uint16 public srid;

    struct GeoCellNode {
        uint256 propId;
        bool[4] cells;
        mapping(uint8 => GeoCellNode) children;
    }

    GeoCellNode[6] private _registeredLand;

    constructor(string memory _desc, uint16 _srid) {
        require(
            (_srid >= 1024 && _srid <= 32767),
            "Codigo EPSG deve estar entre 1024 e 32767"
        );
        require(bytes(_desc)[0] != 0, "Descritivo vazio");

        desc = _desc;
        srid = _srid;
    }

    /**
     * Cell data structure:
     * == 89C2598B58C = 100 01001110000100101100110001 011010110001 10000000000000000000000
     * == 89C2598C97  = 100 01001110000100101100110001 1001001011 1000000000000000000000000
     * - remove lsb + sentinel
     * - add zero bit to msb
     * == 89C2598B58C = 0100 01001110000100101100110001 011010110001
     * == 89C2598C97  = 0100 01001110000100101100110001 1001001011
     * - encode prefix and cells into byte array, prepend bit length in first byte
     * == [prefix len (30)][0100 0100][11100001][00101100][110001--][cell0 len (12)][01101011][0001----][cell1 len (10)][10010010][11------]
     */
    function _claimLand(uint256 _propId, bytes memory _cellData) internal {
        require(_propId > 0, "ID da propriedade deve ser maior que 0");

        uint8 prefixBits = uint8(_cellData[0]);
        require(prefixBits % 2 == 0, "Tamanho do prefixo invalido");

        if (prefixBits == 0) {
            uint256 pos = 0;

            while (pos < _cellData.length) {
                uint8 blockLen = uint8(_cellData[pos]);
                pos += 1;

                require(
                    blockLen > 0 && blockLen % 2 == 0,
                    "Tamanho do bloco invalido"
                );

                _claimCell(_propId, pos, blockLen, _cellData);
                pos += ((blockLen - 1) / 8) + 1;
            }
        } else {
            GeoCellNode storage commonNode = _getCommonNode(
                prefixBits,
                _cellData
            );

            uint256 pos = ((prefixBits - 1) / 8) + 2;
            while (pos < _cellData.length) {
                uint8 blockLen = uint8(_cellData[pos]);
                pos += 1;

                require(
                    blockLen > 0 && blockLen % 2 == 0,
                    "Tamanho do bloco invalido"
                );

                _claimCell(_propId, commonNode, pos, blockLen, 0, _cellData);
                pos += ((blockLen - 1) / 8) + 1;
            }
        }
    }

    function _getCommonNode(uint8 prefixBits, bytes memory _cellData)
        internal
        returns (GeoCellNode storage)
    {
        uint8 faceId = (uint8(_cellData[1]) >> 4) & 0x7;
        GeoCellNode storage commonNode = _registeredLand[faceId]; // set commonNode to face cell
        // it´s not possible to register the whole face cell, so no need for propId check;

        for (uint8 bit = 4; bit < prefixBits; bit += 2) {
            uint8 quadKey = _getQuadKey(_cellData, 1, bit);

            if (commonNode.cells[quadKey]) {
                // mapping for this quadKey already exists
                commonNode = commonNode.children[quadKey];
            } else {
                // mapping for this quadKey does not yet exist, so create it
                commonNode.cells[quadKey] = true;
                commonNode = commonNode.children[quadKey];
            }

            require(
                commonNode.propId == 0,
                "Registro dentro de area ja registrada"
            );
        }

        return commonNode;
    }

    function _claimCell(
        uint256 _propId,
        uint256 _pos,
        uint8 _blockLen,
        bytes memory _cellData
    ) internal {
        uint8 faceId = (uint8(_cellData[_pos]) >> 4) & 0x7;
        GeoCellNode storage commonNode = _registeredLand[faceId];
        _claimCell(_propId, commonNode, _pos, _blockLen, 4, _cellData);
    }

    function _claimCell(
        uint256 _propId,
        GeoCellNode storage _commonNode,
        uint256 _pos,
        uint8 _blockLen,
        uint8 _offset,
        bytes memory _cellData
    ) internal {
        GeoCellNode storage currentNode = _commonNode;

        for (uint8 bit = _offset; bit < _blockLen; bit += 2) {
            uint8 quadKey = _getQuadKey(_cellData, _pos, bit);

            if (currentNode.cells[quadKey]) {
                // mapping for this quadKey already exists
                currentNode = currentNode.children[quadKey];
            } else {
                // mapping for this quadKey does not yet exist, so create it
                currentNode.cells[quadKey] = true;
                currentNode = currentNode.children[quadKey];
            }

            require(
                currentNode.propId == 0,
                "Registro dentro de area ja registrada"
            );
        }

        // currentNode can be registered if no children nodes exist
        for (uint8 quadKey = 0; quadKey < 4; quadKey++) {
            require(
                currentNode.cells[quadKey] == false,
                "Registro sobrepoe area registrada"
            );
        }

        currentNode.propId = _propId;
    }

    function _getQuadKey(
        bytes memory _cellData,
        uint256 _byteOffset,
        uint8 _bitOffset
    ) internal pure returns (uint8 quadKey) {
        return
            (uint8(_cellData[_bitOffset / 8 + _byteOffset]) >>
                (6 - (_bitOffset % 8))) & 0x3;
    }

    function registeredCells(bytes memory _parentCell)
        public
        view
        returns (uint8 ret)
    {
        GeoCellNode storage currentNode = _getNode(_parentCell);
        bool[4] memory cells = currentNode.cells;
        return
            (cells[0] ? 8 : 0) +
            (cells[1] ? 4 : 0) +
            (cells[2] ? 2 : 0) +
            (cells[3] ? 1 : 0);
    }

    function propertyOf(bytes memory _parentCell)
        public
        view
        returns (uint256 propId)
    {
        GeoCellNode storage currentNode = _getNode(_parentCell);
        return currentNode.propId;
    }

    function _getNode(bytes memory _cell)
        internal
        view
        returns (GeoCellNode storage node)
    {
        uint8 blockLen = uint8(_cell[0]);

        uint8 faceId = (uint8(_cell[1]) >> 4) & 0x7;
        GeoCellNode storage currentNode = _registeredLand[faceId];

        for (uint8 bit = 4; bit < blockLen; bit += 2) {
            uint8 quadKey = _getQuadKey(_cell, 1, bit);
            currentNode = currentNode.children[quadKey];
        }

        return currentNode;
    }
}
