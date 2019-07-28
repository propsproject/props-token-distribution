const Web3 = require('web3');
const zos = require('zos-lib');
// const BigNumber = require('bignumber.js');
const fs = require('fs');
// eslint-disable-next-line prefer-destructuring
const proxyContractABI = require('zos-lib/build/contracts/AdminUpgradeabilityProxy.json');
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
const OldPropsTokenLogicContractAddress = zosData.proxies['PropsToken/PropsToken'][0].implementation;
const NewPropsTokenLogicContractAddress = zosData.contracts.PropsToken.address;
if (OldPropsTokenLogicContractAddress === NewPropsTokenLogicContractAddress) {
  console.warn('New logic contract must be deployed first using zos push');
  process.exit(0);
}

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
    DevOps1MultiSigOwnerAddress = accounts[1];
  } else {
    DevOps1MultiSigOwnerAddress = connectionConfig.networks[networkInUse].wallet_address;
  }
  
  const propsContractInstance = new web3.eth.Contract(proxyContractABI.abi, PropsTokenContractAddress);  
  // const admin = await propsContractInstance.methods.admin().call({from: web3.eth.accounts[0]});
  // console.log(`admin=${JSON.stringify(admin)}`);
  // process.exit(1);
  // const upgradeToEncoded = await propsContractInstance.methods.upgradeTo(NewPropsTokenLogicContractAddress)encodeABI();
  const upgradeToEncoded = zos.encodeCall('upgradeTo', ['address'], [NewPropsTokenLogicContractAddress]);
  // console.log(`upgradeToEncoded=${upgradeToEncoded}`);
  console.log(`NewPropsTokenLogicContractAddress=${NewPropsTokenLogicContractAddress}`);
  // console.log(`Issuing upgradeTo to ${NewPropsTokenLogicContractAddress} via multisig wallet ${multisigWalletForPropsTokenProxy}`);
  // eslint-disable-next-line no-await-in-loop
  await propsContractInstance.methods.upgradeTo(
    NewPropsTokenLogicContractAddress
  ).send({
    from: DevOps1MultiSigOwnerAddress,
    gas: utils.gasLimit('multisig'),
    gasPrice: utils.gasPrice(),
    // eslint-disable-next-line no-loop-func
  }).then((receipt) => {
    upgradeDataEntry.newLogicContract = NewPropsTokenLogicContractAddress;
    upgradeDataEntry.multisigTx = receipt.transactionHash;
    console.log('Upgrade done');
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
