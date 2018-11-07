const PropsToken = artifacts.require('./build/contracts/token/PropsToken.sol')

module.exports = async () => {
    const owner = PropsToken.web3.eth.accounts[0];
    const rec = "0x42EB768f2244C8811C63729A21A3569731535f06"
    try {
        const token = await PropsToken.at("0x65740161427f5959e0bc69e99b3277f229f7f229");
        let ownerBalance = await token.balanceOf(owner);
        let recBalance = await token.balanceOf(rec);
        console.log(`PREV OWNER BALANCE: ${ownerBalance} \t PREV REC BALANCE: ${recBalance}`)
        await token.settle(rec, 5000, {from:owner});
        ownerBalance = await token.balanceOf(owner);
        recBalance = await token.balanceOf(rec);
        console.log(`NEW OWNER BALANCE: ${ownerBalance} \t NEW REC BALANCE: ${recBalance}`)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

//0xc77309d5f48170716730111dd73d5c44ad3d4329804d88c4f8528f693c131a27