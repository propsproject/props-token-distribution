const helpers = require('./helpers');
const PropsToken = artifacts.require('./token/PropsToken.sol')
const submitMultiSigTransaction = helpers.submitMultiSigTransaction;
const saveConfig = helpers.saveConfig;
const loadConfig = helpers.loadConfig;

module.exports = async() => {
  const config = loadConfig();

  const token = await PropsToken.new({from: config.luna});
  await token.transferOwnership(config.coordinator, {from: config.luna});
  config.token = token.address;

  const tx = await submitMultiSigTransaction(artifacts, {
    wallet: config.wallet,
    coordinator: config.coordinator,
    transaction: coordinator => coordinator
      .injectToken
      .request(token.address),
    from: config.luna
  });

  const log = `Injecting token ${token.address} into coordinator ${config.coordinator}.`
  console.log(`✔︎ ${log}`);
  config
    .transactions
    .push({payload: tx.payload, log: log});
  saveConfig(config);
}
