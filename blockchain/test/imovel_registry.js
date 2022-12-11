const ImovelRegistry = artifacts.require("ImovelRegistry");

const URI1 = 'bafybeidi6mtwtmm6vrncytqiliiofyhxq5ys476dl7sdpwcfxmuphnus3i';

const TRANSFER_EVENT = web3.utils.soliditySha3('Transfer(address,address,uint256)');


contract("ImovelRegistry", (accounts) => {
    it("deve iniciar com saldo zerado", async () => {
        const instance = await ImovelRegistry.deployed();
        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance, 0, "saldo não está zerado");
    });

    it("deve registrar um imóvel", async () => {
        const instance = await ImovelRegistry.deployed();

        const claimTx = await instance.claim(accounts[0], URI1);
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