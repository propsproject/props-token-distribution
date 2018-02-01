const helpers = require('./helpers');
const ProofOfOwnership = artifacts.require('./wallet/WalletOwnership.sol')
const saveConfig = require('./helpers').saveConfig;

module.exports = async() => {
    const luna = "0xff32622d83bbE587d6498f10CC9890EC2CAD28A3";

    const contract = await ProofOfOwnership.new({
        from: luna
    });

    const log = `ProofOfOwnership deployed at address ${contract.address}.`
    console.log(`✔︎ ${log}`);
    saveConfig({
        luna: luna,
        proofOfOwnership: contract.address,
        transactions: [log]
    });
}