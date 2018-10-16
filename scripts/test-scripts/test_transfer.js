const PropsToken = artifacts.require('./build/contracts/token/PropsToken.sol')

module.exports = async() => {
    const owner = PropsToken.web3.eth.accounts[0];
    const rec = "0x118eebb064fd24fa4e274322144a3771fa423197"
    try {
        const token = await PropsToken.at("0x81172bdb7cf915d5753e9742ac4d56ea9713d661");
        await token.transfer(rec, 1000, {from:owner})
        await token.transfer(rec, 1000, {from:owner})

        console.log(rec, owner)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}