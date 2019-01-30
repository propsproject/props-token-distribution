/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;

const { Contracts, SimpleProject } = require('zos-lib');

const PropsToken = Contracts.getFromLocal('PropsToken');

async function main() {
  const creatorAddress = web3.eth.accounts[1];
  // const initializerAddress = web3.eth.accounts[2];
  const tokenHolderAddress = web3.eth.accounts[3];
  const myProject = new SimpleProject('PropsToken', { from: creatorAddress });
  console.log('Creating an upgradeable instance of PropsToken...');
  try {
    const instance = await myProject.createProxy(PropsToken, { initArgs: [tokenHolderAddress, global.timestamp] });
    // for (a in instance) {
    //   console.log(`${a}=>${typeof(instance[a])}`);
    // }
    // console.log('-------');
    // for (a in instance.contract) {
    //   console.log(`${a}=>${typeof(instance.contract[a])}`);
    // }
    // process.exit(1);
    // console.log(`instance.address=${instance.address}`);
    // process.exit(1);
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
