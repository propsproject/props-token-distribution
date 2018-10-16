const PropsToken = artifacts.require('./PropsToken.sol')

module.exports = async() => {
    try {
        const address = await PropsToken.deployed();
        console.log(address);
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}