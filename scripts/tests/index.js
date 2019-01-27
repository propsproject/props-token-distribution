/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;

const { Contracts, SimpleProject } = require('zos-lib');

const PropsToken = Contracts.getFromLocal('PropsToken');

async function main() {
  const creatorAddress = web3.eth.accounts[1];
  const initializerAddress = web3.eth.accounts[2];
  const tokenHolderAddress = web3.eth.accounts[3];
  const myProject = new SimpleProject('PropsToken', { from: creatorAddress });
  log('Creating an upgradeable instance of PropsToken...');
  const instance = await myProject.createProxy(PropsToken, { initArgs: [tokenHolderAddress, global.timestamp] });
  // log(`Contract's storage value: ${(await instance.value()).toString()}\n`);

  // log('Upgrading to v1...');
  // await myProject.upgradeProxy(instance, MyContract_v1, { initMethod: 'add', initArgs: [1], initFrom: initializerAddress });
  // log(`Contract's storage new value: ${(await instance.value()).toString()}\n`);

  // log('Wohoo! We\'ve upgraded our contract\'s behavior while preserving its storage, thus obtaining 43.');
  return instance;
}

// For truffle exec
module.exports = function (callback) {
  main().then(() => callback()).catch(err => callback(err));
};

// Logging
function log() {
  if (process.env.NODE_ENV !== 'test') {
    console.log.apply(this, arguments);
  }
}

// Testing
module.exports.main = main;
