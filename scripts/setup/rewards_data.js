const Web3 = require('web3');
const zos = require('zos-lib');
// const BigNumber = require('bignumber.js');
const fs = require('fs');
// eslint-disable-next-line prefer-destructuring
const proxyContractABI = require('zos-lib/build/contracts/AdminUpgradeabilityProxy.json');
const propsTokenContractABI = require('../../build/contracts/PropsToken.json');
const connectionConfig = require('../../truffle');
const utils = require('../../scripts_utils/utils');

const networkProvider = process.argv[2];

let networkInUse;
let web3;

if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}
const zosDataFileName = networkProvider === 'test' ? 'zos.dev-5777.json' : `zos.${networkProvider}.json`;
const zosData = JSON.parse(fs.readFileSync(zosDataFileName, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;

const multisigWalletABI = require('./MultiSigWallet.json');

const setupMetadataFilename = `output/setup-${networkProvider}.json`;
let setupData;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  setupData = require(`../../${setupMetadataFilename}`);
} catch (error) {
  setupData = {};
}

if (typeof (setupData.steps) === 'undefined') {
  setupData.steps = [];
}

const setupDataEntry = {
  date: utils.timeStamp(),
};

async function main() {
  // instantiate multisig wallet
  let providerDevOps1;
  let DevOps1MultiSigOwnerAddress;
  networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}1`;
  if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
    providerDevOps1 = connectionConfig.networks[networkInUse].provider();
    web3 = new Web3(providerDevOps1);
  }
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${connectionConfig.networks[networkInUse].host}:${connectionConfig.networks[networkInUse].port}`));
    accounts = await web3.eth.getAccounts();
    // eslint-disable-next-line prefer-destructuring
    DevOps1MultiSigOwnerAddress = accounts[2];
  } else {
    DevOps1MultiSigOwnerAddress = connectionConfig.networks[networkInUse].wallet_address;
  }  
  const propsContractInstance = new web3.eth.Contract(propsTokenContractABI.abi, PropsTokenContractAddress);
  // const propsContractInstance = new web3.eth.Contract(proxyContractABI.abi, PropsTokenContractAddress);
  //get current rewards day
  //const rewardsStartVal = (await instance.methods.rewardsStartTimestamp().call());
  const rewardsTimestamp = await propsContractInstance.methods.rewardsStartTimestamp().call();
  const secondsInDay = networkProvider == 'mainnet' ? 86400 : 3600;
  const currentTimestamp = Math.floor(Date.now()/1000);
  // return (block.timestamp.sub(_self.rewardsStartTimestamp)).div(_self.minSecondsBetweenDays).add(1);
  const rewardsDay = Math.floor((currentTimestamp - rewardsTimestamp) / secondsInDay) + 1;
  const controller = await propsContractInstance.methods.controller().call();
  const maxTotalSupply = await propsContractInstance.methods.maxTotalSupply().call();
  const validators = await propsContractInstance.methods.getEntities(1, rewardsDay).call();      
  const applications = await propsContractInstance.methods.getEntities(0, rewardsDay).call();      
  console.log(`Got rewardsTimestamp=${rewardsTimestamp}, secondsInDay=${secondsInDay}, currentTimestamp=${currentTimestamp}, rewardsDay=${rewardsDay}`);  
  console.log(`Got controller=${controller}, maxTotalSupply=${maxTotalSupply}`);  
  console.log(`Got validators=${JSON.stringify(validators)}`); 
  console.log(`Got applications=${JSON.stringify(applications)}`);  
  process.exit(0);
}

try {
  main();
} catch (err) {
  console.warn(err);
}
