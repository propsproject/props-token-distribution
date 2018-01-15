const TokenDistributionCoordinator = artifacts.require("./TokenDistributionCoordinator.sol");
const helpers = require('./helpers');
const PropsCrowdsale = artifacts.require('./crowdsale/PropsCrowdsale.sol')
const MultiSigWallet = artifacts.require('./wallet/MultiSigWallet.sol')
const submitMultiSigTransaction = helpers.submitMultiSigTransaction;
const network = helpers.network;
const rateWeiToAttoPROPS = helpers.rateWeiToAttoPROPS;
const usdToWei = helpers.usdToWei;
const duration = helpers.duration;
const loadConfig = helpers.loadConfig;
const saveConfig = helpers.saveConfig;

module.exports = async() => {
  const config = loadConfig();

  var coordinator = TokenDistributionCoordinator.at(config.coordinator);

  events = coordinator.SAFTAllocation({}, {
    fromBlock: 0,
    toBlock: 'latest'
  })
  console.log(`Beneficiary, Vesting contract`);

  events.watch((err, res) => {
    if (res.args.vestingContract != "0x0000000000000000000000000000000000000000") {
      const log = `${res.args.beneficiary}, ${res.args.vestingContract}`
      console.log(`${log}`);
    }
  })
}
