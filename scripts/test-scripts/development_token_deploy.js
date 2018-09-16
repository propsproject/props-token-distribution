const PropsToken = artifacts.require('./PropsToken.sol')

module.exports = async() => {
    const owner = PropsToken.web3.eth.accounts[0];
    console.log(owner)
    try {
        const token = await PropsToken.new({from: owner, gas: 5912388});
        console.log(token.address)
        await token.mint(owner, 5000000, {from:owner})
        await token.whitelistUserForTransfers(owner, {from:owner})
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}