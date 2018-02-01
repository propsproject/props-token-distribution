const helpers = require('./helpers');
const submitMultiSigTransaction = helpers.submitMultiSigTransaction;
const network = helpers.network;
const usdToWei = helpers.usdToWei;
const loadConfig = helpers.loadConfig;
const saveConfig = helpers.saveConfig;

module.exports = async() => {
  const config = loadConfig();

  const tx = await submitMultiSigTransaction(artifacts, {
    wallet: config.wallet,
    coordinator: config.coordinator,
    transaction: coordinator => coordinator
      .closeMinting
      .request(),
    from: config.luna
  });

  const log = `Closing minting for token ${config.token}`
  console.log(`✔︎ ${log}`);
  config
    .transactions
    .push({
      payload: tx.payload,
      log: log
    });
  saveConfig(config);
}