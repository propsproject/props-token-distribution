const fs = require('fs');
const BigNumber = require('bignumber.js');

const submitMultiSigTransaction = async function (artifacts, opts) {
  var TokenDistributionCoordinator = artifacts.require("./TokenDistributionCoordinator.sol");
  var MultiSigWallet = artifacts.require("./wallet/MultiSigWallet.sol");
  var coordinator = await TokenDistributionCoordinator.at(opts.coordinator);
  var payload = opts
    .transaction(coordinator)
    .params[0]
    .data;
  var wallet = MultiSigWallet.at(opts.wallet);
  var tx = await wallet.submitTransaction(coordinator.address, 0, payload, {from: opts.from});
  return {transaction: tx, payload: payload};
}

const detectNetwork = function () {
  let network = 'development';
  const networkIndex = process
    .argv
    .indexOf('--network') + 1;
  if (networkIndex > 0) {
    network = process.argv[networkIndex];
  }
  return network;
}

const loadConfig = function () {
  return require(`./config.${detectNetwork()}.json`);
}

const saveConfig = function (keys) {
  const config = JSON.stringify(keys, null, "\t");

  fs.writeFile(`./scripts/coordinator/config.${detectNetwork()}.json`, config, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
  });
}

const rateWeiToAttoPROPS = function (opts) {
  const ETH_WEI = 1 * 10 ** 18;
  const PROPS_ATTOPROPS = 1 * 10 ** 18
  return PROPS_ATTOPROPS / (opts.props_usd * ETH_WEI / opts.eth_usd);
}

const usdToWei = function (amount, rate) {
  var a = new BigNumber(amount);
  var r = new BigNumber(rate);
  var c = new BigNumber(1 * 10 ** 18);
  return a
    .div(r)
    .mul(c);
}

const duration = {
  seconds: function (val) {
    return val
  },
  minutes: function (val) {
    return val * this.seconds(60)
  },
  hours: function (val) {
    return val * this.minutes(60)
  },
  days: function (val) {
    return val * this.hours(24)
  },
  weeks: function (val) {
    return val * this.days(7)
  },
  years: function (val) {
    return val * this.days(365)
  }
}

const awaitEvent = function (event, handler) {
  return new Promise((resolve, reject) => {
    function wrappedHandler(...args) {
      Promise
        .resolve(handler(...args))
        .then(resolve)
        .catch(reject);
    }

    event.watch(wrappedHandler);
  });
}

exports.awaitEvent = awaitEvent;
exports.network = detectNetwork();
exports.submitMultiSigTransaction = submitMultiSigTransaction;
exports.saveConfig = saveConfig;
exports.loadConfig = loadConfig;
exports.rateWeiToAttoPROPS = rateWeiToAttoPROPS;
exports.usdToWei = usdToWei;
exports.duration = duration;
