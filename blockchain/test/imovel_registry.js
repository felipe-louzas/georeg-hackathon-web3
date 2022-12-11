//const ImovelRegistry = artifacts.require("ImovelRegistry");

const URI1 = 'bafybeidi6mtwtmm6vrncytqiliiofyhxq5ys476dl7sdpwcfxmuphnus3i';

//const TRANSFER_EVENT = web3.utils.soliditySha3('Transfer(address,address,uint256)');

const REG = ["89c2598b57c", "89c2598b584", "89c2598b58c", "89c2598c97", "89c2598c99", "89c2598c9f", "89c2598ca4", "89c2598ca9", "89c2598caf", "89c2598cb04", "89c2598cbb", "89c2598cbd"];
const REG_NEIGHBOR = ["89c2598b55", "89c2598cab", "89c2598cad", "89c2598cb27", "89c2598cb29", "89c259f3514", "89c259f351c", "89c259f353", "89c259f355", "89c259f3564", "89c259f356c", "89c259f4a94", "89c259f4a9c", "89c259f4ab"];

const REG_LARGER = ["89c259"];
const REG_LARGER_NEIGHBOR = ["89c257"]

const REG_SMALLER = ["89c2598ca85", "89c2598ca8f", "89c2598ca91", "89c2598ca9b"];

const REG_MULTIFACE = ["077ffffffc", "0780000004", "92d5555554", "932aaaaaac"];

const REG_30 = ["89c2598ca846bd55", "89c2598ca846bd57", "89c2598ca846bd53"];

/*
contract("ImovelRegistry", (accounts) => {
    it("deve iniciar com saldo zerado", async () => {
        const instance = await ImovelRegistry.deployed();
        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance, 0, "saldo não está zerado");
    });

    it("deve registrar um imóvel", async () => {
        const instance = await ImovelRegistry.deployed();

        const claimTx = await instance.claimLand(accounts[0], URI1);
        const txReceipt = await web3.eth.getTransactionReceipt(claimTx.receipt.transactionHash);
        const transferEvent = txReceipt.logs.find(log => log.topics[0] == TRANSFER_EVENT);
        const tokenId = transferEvent.topics[3];

        const balance = await instance.balanceOf.call(accounts[0]);
        const owner = await instance.ownerOf.call(tokenId);
        const tokenURI = await instance.tokenURI.call(tokenId);

        assert.equal(balance, 1, "saldo da conta != 1 após mint");
        assert.equal(owner, accounts[0], "token não transferido corretamente");
        assert.equal(tokenURI, 'ipfs://' + URI1, "token URI incorreto");
    });

    it("deve preservar saldos de um teste para o outro", async () => {
        const instance = await ImovelRegistry.deployed();
        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance, 1, "saldos não preservados");
    });
});
*/

pack_cell_data(REG);
pack_cell_data(REG_30);
pack_cell_data(REG_MULTIFACE);

function pack_cell_data(cells) {
    // sort the arrays to find the common prefix, add to set to remove duplicates
    const cellInts = [...new Set(cells.map(c => BigInt('0x' + c.padEnd(16, '0'))))].sort();

    let prefixLen = 0;
    if (cellInts.length > 1) {
        const firstCell = cellInts[0];
        const lastCell = cellInts[cellInts.length - 1];

        if (firstCell >> 61n === lastCell >> 61n) {
            prefixLen = 3

            for (let idx = 59n; idx > 1n; idx = idx - 2n) {
                if (firstCell >> idx !== lastCell >> idx) break;
                prefixLen += 2;
            }
        }
    }

    const output = [];
    let pos = 0;

    pos = _writeData(output, prefixLen, pos, 6);

    if (prefixLen > 0) {
        const prefix = cellInts[0] >> (64n - BigInt(prefixLen))
        console.log('prefix', prefix.toString(2));
        pos = _writeData(output, prefix, pos, prefixLen);
    }

    const mask = (2n ** (64n - BigInt(prefixLen))) - 1n

    for (idx in cellInts) {
        let cellNoPrefix = cellInts[idx] & mask;

        // trim lsb zeros
        let trimmed = 0;
        while ((cellNoPrefix & 3n) == 0n) {
            cellNoPrefix = cellNoPrefix >> 2n;
            trimmed += 2;
        }

        // trim last bit
        cellNoPrefix = cellNoPrefix >> 1n;

        const cellLen = 64 - prefixLen - trimmed - 1;

        pos = _writeData(output, cellLen, pos, 6);
        pos = _writeData(output, cellNoPrefix, pos, cellLen);

        console.log(cellNoPrefix.toString(2), 'length', cellLen);
    }

    console.log(cellInts.map(c => c.toString(2).slice(0, prefixLen) + " " + c.toString(2).slice(prefixLen)));
}

function _writeData(output, data, start, lenBits) {

}