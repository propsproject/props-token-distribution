/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;
const { Contracts, SimpleProject, ZWeb3 } = require('zos-lib');
ZWeb3.initialize(web3.currentProvider)
const PropsToken = Contracts.getFromLocal('PropsToken');
const waitUntil = require('async-wait-until');
const calcRewardsDay = function() {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const secondsLeft = currentTimestamp > global.secondsBetweenDailyRewards ?
  global.secondsBetweenDailyRewards - ((currentTimestamp - global.rewardsStartTimestamp) % global.secondsBetweenDailyRewards) :
  -currentTimestamp + global.rewardsStartTimestamp;
  $ret =  {
    rewardsDay: ((currentTimestamp - (currentTimestamp % global.secondsBetweenDailyRewards)) - global.rewardsStartTimestamp) / global.secondsBetweenDailyRewards,
    secondsLeft
  }
  // process.stdout.write('.');
  // process.stdout.clearLine();
  //process.stdout.cursorTo(0);
  // process.stdout.write("\n"); // end the line
  // console.log(JSON.stringify($ret));
  return $ret;
  
}

async function main() {  
  // web3.setProvider(ganache.provider({ mnemonic: 'asset member awake bring mosquito lab sustain muscle elephant equip someone obvious' }));
  const creatorAddress = web3.eth.accounts[1];
  const controllerAddress = web3.eth.accounts[2];
  // const initializerAddress = web3.eth.accounts[2];
  const tokenHolderAddress = web3.eth.accounts[3];
  const secondsDiffBetweenDays = global.secondsBetweenDailyRewards > 0 ? global.secondsBetweenDailyRewards : 60; // 5 seconds for testing purposes on the production contract itself should be around 86400 (24 hours)
  const currentTimestamp = Math.floor(Date.now()/1000);
  const rewardsStartTimestamp = global.rewardsStartTimestamp = (currentTimestamp - (currentTimestamp % secondsDiffBetweenDays) + secondsDiffBetweenDays); // in production this will be 24 hours (86400 seconds) per day
  // console.log(`debug ${global.rewardsStartTimestamp}, ${secondsDiffBetweenDays}, ${currentTimestamp}`);
  let rewardsDayInfo = calcRewardsDay();
    console.log(`will wait for day 0 to begin`);
    let result = await waitUntil(() => {
      rewardsDayInfo = calcRewardsDay();
      return rewardsDayInfo.rewardsDay == 0;
    }, 90000, 1000);    
    // process.stdout.clearLine();
    // process.stdout.cursorTo(0);
  const myProject = new SimpleProject('PropsToken', { from: creatorAddress });
  
  console.log('Creating an upgradeable instance of PropsToken...');
  try {
    MyLibrary = Contracts.getFromLocal("PropsRewardsLib")
    const lib = await myProject.setImplementation(MyLibrary, "PropsRewardsLib");
    PropsToken.link({ "PropsRewardsLib": lib.address });
    // console.log(`initializing contract ${global.timestamp}, ${controllerAddress}, ${secondsDiffBetweenDays}, ${rewardsStartTimestamp}`)
    const instance = await myProject.createProxy(PropsToken, { initArgs: [tokenHolderAddress, global.timestamp, controllerAddress, secondsDiffBetweenDays, rewardsStartTimestamp] });          
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
module.exports.calcRewardsDay = calcRewardsDay;
