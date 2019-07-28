/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;
const { Contracts, SimpleProject, ZWeb3 } = require('zos-lib');
ZWeb3.initialize(web3.currentProvider)
const PropsToken = Contracts.getFromLocal('PropsToken');
const waitUntil = require('async-wait-until');

const secondsDiffBetweenDays = global.secondsBetweenDailyRewards > 0 ? global.secondsBetweenDailyRewards : 15; // 5 seconds for testing purposes on the production contract itself should be around 86400 (24 hours)
let currentTimestamp = Math.floor(Date.now()/1000);
const rewardsStartTimestamp = global.rewardsStartTimestamp = (currentTimestamp - (currentTimestamp % secondsDiffBetweenDays) + secondsDiffBetweenDays); // in production this will be 24 hours (86400 seconds) per day

const calcRewardsDay = function() {  
  currentTimestamp = Math.floor(Date.now()/1000);
  const secondsLeft = currentTimestamp > rewardsStartTimestamp ?
  secondsDiffBetweenDays - ((currentTimestamp - rewardsStartTimestamp) % secondsDiffBetweenDays) :
  -currentTimestamp + rewardsStartTimestamp;
  $ret =  {
    rewardsDay: (((currentTimestamp - (currentTimestamp % secondsDiffBetweenDays)) - rewardsStartTimestamp) / secondsDiffBetweenDays)+1,
    secondsLeft
  }
  
  // process.stdout.write('.');
  // process.stdout.clearLine();
  //process.stdout.cursorTo(0);
  // process.stdout.write("\n"); // end the line
  console.log(JSON.stringify($ret));
  return $ret;
}

async function main(isRewardsTest) {  
  // web3.setProvider(ganache.provider({ mnemonic: 'asset member awake bring mosquito lab sustain muscle elephant equip someone obvious' }));
  const creatorAddress = web3.eth.accounts[1];
  const controllerAddress = web3.eth.accounts[2];
  // const initializerAddress = web3.eth.accounts[2];
  const tokenHolderAddress = web3.eth.accounts[3];
  const myProject = new SimpleProject('PropsToken', { from: creatorAddress });
  
  console.log('Creating an upgradeable instance of PropsToken...');
  try {
    MyLibrary = Contracts.getFromLocal("PropsRewardsLib")
    const lib = await myProject.setImplementation(MyLibrary, "PropsRewardsLib");
    PropsToken.link({ "PropsRewardsLib": lib.address });
    // console.log(`initializing contract ${global.timestamp}, ${controllerAddress}, ${secondsDiffBetweenDays}, ${rewardsStartTimestamp}`)
    if (isRewardsTest) {
      let rewardsDayInfo = calcRewardsDay();
      console.log(`will wait for day 1 to begin`);
      let result = await waitUntil(() => {
        rewardsDayInfo = calcRewardsDay();
        return rewardsDayInfo.rewardsDay == 1;
      }, 90000, 1000);
    }
    // process.stdout.clearLine();
    // process.stdout.cursorTo(0);
    const instance = await myProject.createProxy(PropsToken, { initArgs: [tokenHolderAddress, controllerAddress, secondsDiffBetweenDays, rewardsStartTimestamp] });          
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
