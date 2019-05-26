const Web3 = require('web3');
const zos = require('zos-lib');
const BigNumber = require('bignumber.js');
const fs = require('fs');
// eslint-disable-next-line prefer-destructuring
const propsTokenContractABI = require('../../build/contracts/PropsToken.json');
const connectionConfig = require('../../truffle');
const utils = require('../../scripts_utils/utils');

const networkProvider = process.argv[2];
const multisigWalletForPropsTokenProxy = process.argv[3];
const minSecondsBetweenDailySubmissions = process.argv[4];
const rewardsStartTimestamp = process.argv[5];
let networkInUse;
let web3;

if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

if (typeof (multisigWalletForPropsTokenProxy) === 'undefined') {
  console.log('Must supply multisigWalletForPropsTokenProxy');
  process.exit(0);
}

if (typeof (minSecondsBetweenDailySubmissions) === 'undefined') {
  console.log('Must supply minSecondsBetweenDailySubmissions');
  process.exit(0);
}

if (typeof (rewardsStartTimestamp) === 'undefined') {
  console.log('Must supply rewardsStartTimestamp');
  process.exit(0);
}


const zosDataFileName = networkProvider === 'test' ? 'zos.dev-5777.json' : `zos.${networkProvider}.json`;
const zosData = JSON.parse(fs.readFileSync(zosDataFileName, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;

const upgradeMetadataFilename = `output/upgrades-${networkProvider}.json`;
let upgradeData;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  upgradeData = require(`../../${upgradeMetadataFilename}`);
} catch (error) {
  upgradeData = {};
}

if (typeof (upgradeData.upgrades) === 'undefined') {
  upgradeData.upgrades = [];
}

const upgradeDataEntry = {
  date: utils.timeStamp(),
};

async function main() {
  // instantiate multisig wallet
  let providerDevOps1;
  let DevOps1MultiSigOwnerAddress;
  networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}1`;
    if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
      providerDevOps1 = connectionConfig.networks[networkInUse].provider();
      web3 = new Web3(providerTransferrer);
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
  
  await propsContractInstance.methods.initializePostRewardsUpgrade1(
    multisigWalletForPropsTokenProxy,
    minSecondsBetweenDailySubmissions,
    rewardsStartTimestamp,
  ).send({
    from: DevOps1MultiSigOwnerAddress,
    gas: utils.gasLimit('deployJurisdiction'),
    gasPrice: utils.gasPrice(),
    // eslint-disable-next-line no-loop-func
  }).then((receipt) => {
    upgradeDataEntry.initializeData = [multisigWalletForPropsTokenProxy,minSecondsBetweenDailySubmissions,rewardsStartTimestamp];
    upgradeDataEntry.initializeTx = receipt.transactionHash;
    console.log('Initialized rewards upgrade contract');
  }).catch((error) => {
    console.warn(`Error initializing rewards upgrade:${error}`);
  });

  
  upgradeData.upgrades.push(upgradeDataEntry);
  fs.writeFile(
    upgradeMetadataFilename,
    JSON.stringify(upgradeData),
    { flag: 'w' },
    (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`metadata written to ${upgradeMetadataFilename}`);
      console.log(JSON.stringify(upgradeData, null, 2));
      process.exit(0);
    },
  );

  await propsContractInstance.methods.maxTotalSupply().call().then((bal) => {
    const maxSupply = new BigNumber(bal);
    console.log(`Got maxTotalSupply ${maxSupply.toString()}=${bal}`);
  }).catch((error) => {
    console.warn(`Error getting maxTotalSupply:${error}`);
  });
  await propsContractInstance.methods.rewardsStartTimestamp().call().then((bal) => {
    const rewardsStartTimestamp = new BigNumber(bal);
    console.log(`Got rewardsStartTimestamp ${rewardsStartTimestamp.toString()}=${bal}`);
  }).catch((error) => {
    console.warn(`Error getting rewardsStartTimestamp:${error}`);
  });
  await propsContractInstance.methods.controller().call().then((bal) => {
    const controller = bal;
    console.log(`Got controller ${controller.toString()}=${controller}`);
  }).catch((error) => {
    console.warn(`Error getting controller:${error}`);
  });
  
}

try {
  main();
} catch (err) {
  console.warn(err);
}
