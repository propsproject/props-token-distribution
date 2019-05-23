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


const zosData = JSON.parse(fs.readFileSync(`zos.${networkProvider}.json`, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;

const multisigWalletABI = require('../../build/contracts/MultiSigWallet.json');

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
  networkInUse = `${networkProvider}1`;
  const DevOps1MultiSigOwnerAddress = connectionConfig.networks[networkInUse].wallet_address;
  const providerDevOps1 = connectionConfig.networks[networkInUse].provider();
  web3 = new Web3(providerDevOps1);
  const multiSigContractInstance = new web3.eth.Contract(multisigWalletABI.abi, multisigWalletForPropsTokenProxy);
  // const propsContractInstance = new web3.eth.Contract(proxyContractABI.abi, PropsTokenContractAddress);
  const propsContractInstance = new web3.eth.Contract(propsTokenContractABI.abi, PropsTokenContractAddress);  
  // const upgradeToEncoded = await propsContractInstance.methods.upgradeTo(NewPropsTokenLogicContractAddress)encodeABI();
  //initializePostRewardsUpgrade1(address _controller, uint256 _minSecondsBetweenDays, uint256 _maxRewardsStorageDays)
  const initializeToEncoded = zos.encodeCall('initializePostRewardsUpgrade1', ['address','uint256','uint256'], [multisigWalletForPropsTokenProxy,minSecondsBetweenDailySubmissions,rewardsStartTimestamp]);
  console.log(`initializeToEncoded=${initializeToEncoded}`);  
  console.log(`Issuing initializePostRewardsUpgrade1 to ${NewPropsTokenLogicContractAddress} via multisig wallet ${multisigWalletForPropsTokenProxy}`);
  // eslint-disable-next-line no-await-in-loop
  await multiSigContractInstance.methods.submitTransaction(
    PropsTokenContractAddress,
    0,
    initializeToEncoded,
  ).send({
    from: DevOps1MultiSigOwnerAddress,
    gas: utils.gasLimit('multisig'),
    gasPrice: utils.gasPrice(),
    // eslint-disable-next-line no-loop-func
  }).then((receipt) => {
    upgradeDataEntry.initializeData = [multisigWalletForPropsTokenProxy,minSecondsBetweenDailySubmissions,rewardsStartTimestamp];
    upgradeDataEntry.multisigTx = receipt.transactionHash;
    console.log('Multisig transaction for initialization sent');
  }).catch((error) => {
    console.warn(`Error sending multisig transaction:${error}`);
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
}

try {
  main();
} catch (err) {
  console.warn(err);
}
