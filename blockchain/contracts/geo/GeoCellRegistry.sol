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
     * - [prefix length (6 bits)][prefix][cell length (6 bits)][cell][cell length (6 bits)][cell]...
     */
    function _claimLand(uint256 _propId, bytes memory _cellData) internal {
        require(_propId > 0, "ID da propriedade deve ser maior que 0");

        uint8 prefixLen = _read8(_cellData, 0, 6);
        require(
            prefixLen >= 3 && prefixLen % 2 == 1,
            "Tamanho do prefixo invalido"
        );
        uint64 prefix = _read64(_cellData, 6, prefixLen);

        GeoCellNode storage commonNode = _getCommonNode(prefixLen, prefix);

        uint256 dataIdx = prefixLen + 6;
        while (dataIdx < _cellData.length) {
            uint8 blockLen = _read8(_cellData, dataIdx, 6);
            dataIdx += 6;

            require(
                blockLen > 0 && blockLen % 2 == 0,
                "Tamanho do bloco invalido"
            );
            uint64 cellId = _read64(_cellData, dataIdx, blockLen);
            dataIdx += blockLen;

            _claimCell(_propId, commonNode, blockLen, cellId);
        }
    }

    function _getCommonNode(uint8 prefixLen, uint64 prefix)
        internal
        returns (GeoCellNode storage)
    {
        uint8 commonLen = prefixLen - 3;
        uint8 faceId = uint8(prefix >> commonLen);

        GeoCellNode storage commonNode = _registeredLand[faceId]; // set commonNode to face cell
        // it´s not possible to register the whole face cell, so no need for propId check;

        for (uint8 idx = 0; idx < commonLen; idx += 2) {
            uint8 quadKey = uint8((prefix >> (commonLen - idx - 2)) & 0x3);

            if (commonNode.cells[quadKey]) {
                // mapping for this quadKey already exists
                commonNode = commonNode.children[quadKey];
            } else {
                // mapping for this quadKey does not yet exist, so create it
                GeoCellNode storage newNode = GeoCellNode();
                commonNode.children[quadKey] = newNode;
                commonNode.cells[quadKey] = true;
                commonNode = newNode;
            }

            require(commonNode.propId == 0, "Area ja registrada");
        }

        return commonNode;
    }

    function _claimCell(
        uint256 _propId,
        GeoCellNode memory commonNode,
        uint8 blockLen,
        uint64 cellId
    ) internal {
        for (uint8 idx = 0; idx < blockLen; idx += 2) {
            uint8 quadKey = (cellId >> (blockLen - idx - 2)) & 0x3;

            if (commonNode.cells[quadKey]) {
                // mapping for this quadKey already exists
                commonNode = commonNode.children[quadKey];
            } else {
                // mapping for this quadKey does not yet exist, so create it
                GeoCellNode memory newNode = new GeoCellNode();
                commonNode.children[quadKey] = newNode;
                commonNode.cells[quadKey] = true;
                commonNode = newNode;
            }

            require(commonNode.propId == 0, "Area ja registrada");
        }
    }

    function _read8(
        bytes memory _data,
        uint256 _start,
        uint8 _len
    ) internal pure returns (uint8) {
        require(_len <= 8, "invalid length");
        require(((_start + _len) / 8) < _data.length, "out of bounds");

        if (_len == 0) return 0;

        bytes1 b1 = _data[_start / 8];
        bytes1 b2 = _data[(_start + _len - 1) / 8];

        uint16 frame = uint16((b1 << 8) + b2);

        uint8 discard_upper = _start % 8;
        uint8 discard_lower = 16 - discard_upper;

        frame = frame << discard_upper;
        frame = frame >> discard_lower;

        return uint8(frame);
    }

    function _read64(
        bytes memory _data,
        uint256 _start,
        uint8 _len
    ) internal pure returns (uint64) {
        require(_len <= 64, "invalid length");
        require(((_start + _len) / 8) < _data.length, "out of bounds");

        if (_len == 0) return 0;

        uint72 frame = 0;
        for (uint8 idx = _start / 8; idx <= (_start + _len - 1) / 8; idx++) {
            frame = (frame << 8) | _data[idx];
        }

        uint8 discard_upper = _start % 8;
        uint8 discard_lower = 64 - discard_upper;

        frame = frame << discard_upper;
        frame = frame >> discard_lower;

        return uint64(frame);
    }
}
