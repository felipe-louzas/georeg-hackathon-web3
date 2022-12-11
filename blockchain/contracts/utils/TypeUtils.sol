// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @author Felipe Louzas
 * @notice Biblioteca de utilitários para conversão de dados.
 */

abstract contract TypeUtils {
    uint8 private constant HEX_0 = uint8(bytes1("0"));
    uint8 private constant HEX_A = uint8(bytes1("A"));
    uint8 private constant HEX_a = uint8(bytes1("a"));

    function hexDigitToUint8(bytes1 b) private pure returns (uint8) {
        uint8 bVal = uint8(b);

        if (b >= "0" && b <= "9") {
            return bVal - HEX_0;
        } else if (b >= "A" && b <= "F") {
            return 10 + bVal - HEX_A;
        } else if (b >= "a" && b <= "f") {
            return 10 + bVal - HEX_a;
        }

        revert("Invalid hex value provided");
    }

    function hexStrToUint256(string memory str)
        public
        pure
        returns (uint256 value)
    {
        bytes memory bArr = bytes(str);
        uint256 number = 0;
        for (uint256 idx = 0; idx < bArr.length; idx++) {
            number = number << 4;
            number |= hexDigitToUint8(bArr[idx]);
        }
        return number;
    }
}
