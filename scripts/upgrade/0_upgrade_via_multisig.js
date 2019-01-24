const Web3 = require('web3');
// const BigNumber = require('bignumber.js');
const fs = require('fs');
// eslint-disable-next-line prefer-destructuring
const proxyContractABI = require('zos-lib/build/contracts/AdminUpgradeabilityProxy.json');
const connectionConfig = require('../../truffle');
const utils = require('../../scripts_utils/utils');

const networkProvider = process.argv[2];
const multisigWalletForPropsTokenProxy = process.argv[3];
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


const zosData = JSON.parse(fs.readFileSync(`zos.${networkProvider}.json`, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;
const OldPropsTokenLogicContractAddress = zosData.proxies['PropsToken/PropsToken'][0].implementation;
const NewPropsTokenLogicContractAddress = zosData.contracts.PropsToken.address;
if (OldPropsTokenLogicContractAddress === NewPropsTokenLogicContractAddress) {
  console.warn('New logic contract must be deployed first using zos push');
  process.exit(0);
}

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
  const propsContractInstance = new web3.eth.Contract(proxyContractABI.abi, PropsTokenContractAddress);
  const upgradeToEncoded = await propsContractInstance.methods.upgradeTo(NewPropsTokenLogicContractAddress).encodeABI();
  console.log(`upgradeToEncoded=${upgradeToEncoded}`);
  // process.exit(0);


  // whitelist beneficianry
  console.log(`Issuing upgradeTo to ${NewPropsTokenLogicContractAddress} via multisig wallet ${multisigWalletForPropsTokenProxy}`);
  // eslint-disable-next-line no-await-in-loop
  await multiSigContractInstance.methods.submitTransaction(
    NewPropsTokenLogicContractAddress,
    0,
    upgradeToEncoded,
  ).send({
    from: DevOps1MultiSigOwnerAddress,
    gas: utils.gasLimit('multisig'),
    gasPrice: utils.gasPrice(),
    // eslint-disable-next-line no-loop-func
  }).then((receipt) => {
    upgradeDataEntry.newLogicContract = NewPropsTokenLogicContractAddress;
    upgradeDataEntry.multisigTx = receipt.transactionHash;
    console.log('Multisig transaction for upgrade sent');
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
