/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
// Required by zos-lib when running from truffle
async function main() {
  global.artifacts = artifacts;
  global.web3 = web3;
  global.timestamp = Math.floor(Date.now / 1000);
  const { Contracts, SimpleProject, ZWeb3 } = require('zos-lib');
  ZWeb3.initialize(web3.currentProvider)
  const PropsToken = Contracts.getFromLocal('PropsToken');
  const creatorAddress = web3.eth.accounts[1];
  const tokenHolderAddress = web3.eth.accounts[3];
  const myProject = new SimpleProject('PropsToken', { from: creatorAddress });
  const instance = await myProject.createProxy(PropsToken, { initArgs: [tokenHolderAddress, global.timestamp, creatorAddress] });
  console.log(JSON.stringify(instance.methods));
}

main();