const fs = require('fs');
const { exec } = require('child_process');
const getTestPayload = require('./scripts').getTestPayload;
const PropsToken = artifacts.require('../build/contracts/PropsToken.sol')

module.exports = async() => {
    const owner = PropsToken.web3.eth.accounts[0];
    try {
        const token = await PropsToken.new({from: owner});
        await token.mint(owner, 5000000, {from:owner})
        fs.writeFile('/tmp/token-address.json', JSON.stringify({address: token.address}), 'utf8', (err, d) => {
            if(err){
                throw new Error(err)
            }
        });
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}