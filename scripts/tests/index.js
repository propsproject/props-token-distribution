/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;
const { Contracts, SimpleProject, ZWeb3 } = require('zos-lib');
ZWeb3.initialize(web3.currentProvider)
const PropsToken = Contracts.getFromLocal('PropsToken');

async function main() {  
  // web3.setProvider(ganache.provider({ mnemonic: 'asset member awake bring mosquito lab sustain muscle elephant equip someone obvious' }));
  const creatorAddress = web3.eth.accounts[1];
  const controllerAddress = web3.eth.accounts[2];
  // const initializerAddress = web3.eth.accounts[2];
  const tokenHolderAddress = web3.eth.accounts[3];
  const secondsDiffBetweenDays = global.secondsBetweenDailyRewards > 0 ? global.secondsBetweenDailyRewards : 5; // 5 seconds for testing purposes on the production contract itself should be around 86400 (24 hours)
  const maxRewardEntriesToHold = 3; // 3 entries for testing purposes on the production contract it will be 7 (days)
  const myProject = new SimpleProject('PropsToken', { from: creatorAddress });
  
  console.log('Creating an upgradeable instance of PropsToken...');
  try {
    MyLibrary = Contracts.getFromLocal("PropsRewardsLib")
    const lib = await myProject.setImplementation(MyLibrary, "PropsRewardsLib");
    PropsToken.link({ "PropsRewardsLib": lib.address });
    const instance = await myProject.createProxy(PropsToken, { initArgs: [tokenHolderAddress, global.timestamp, controllerAddress, secondsDiffBetweenDays, maxRewardEntriesToHold] });          
    return instance;
  } catch (error) {
    console.warn(`error=${error}`);
    process.exit(0);
  }
  return null;  
}

// For truffle exec
// eslint-disable-next-line func-names
module.exports = function (callback) {
  main().then(() => callback()).catch(err => callback(err));
};


// Testing
module.exports.main = main;
