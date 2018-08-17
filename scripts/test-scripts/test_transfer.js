const PropsToken = artifacts.require('./build/contracts/token/PropsToken.sol')

module.exports = async() => {
    const owner = PropsToken.web3.eth.accounts[0];
    const rec = "0x118eebb064fd24fa4e274322144a3771fa423197"
    try {
        const token = await PropsToken.at("0xb1dc23df3aa2f7702e7b9280737d60228dd9dd9d");
        await token.transfer(rec, 1000, {from:owner})
    } catch (error) {.8208
        console.error(error)
        process.exit(1)
    }
}