const PropsToken = artifacts.require('./build/contracts/token/PropsToken.sol')

module.exports = async() => {
    const owner = PropsToken.web3.eth.accounts[0];
    const rec = "0x99feebb064fd24fa4e274322144a3771fa423196"
    try {
        const token = await PropsToken.at("0x680880f757010083ed7ec748cfbce621b6caabdd");
        await token.transfer(rec, 10, {from:owner})
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}