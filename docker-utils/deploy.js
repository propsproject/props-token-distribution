const fs = require('fs');
const { exec } = require('child_process');
const getTestPayload = require('./scripts').getTestPayload;
const PropsToken = artifacts.require('PropsToken.sol')
const  sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
    
module.exports = async() => {
    await sleep(20);
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