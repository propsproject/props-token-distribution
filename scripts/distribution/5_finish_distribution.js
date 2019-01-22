const Web3 = require('web3');
// const BigNumber = require('bignumber.js');
const fs = require('fs');
const { execSync } = require('child_process').execSync;
const connectionConfig = require('../../truffle');
const utils = require('../../scripts_utils/utils');

const networkProvider = process.argv[2];
const multisigWalletForRemaningProps = process.argv[3];
const multisigWalletForPropsTokenProxy = process.argv[4];
let networkInUse;
let addressInUse;
let cmd;
let web3;

if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

if (typeof (multisigWalletForRemaningProps) === 'undefined') {
  console.log('Must supply multisigWalletForRemaningProps');
  process.exit(0);
}

if (typeof (multisigWalletForPropsTokenProxy) === 'undefined') {
  console.log('Must supply multisigWalletForPropsTokenProxy');
  process.exit(0);
}

const zosData = JSON.parse(fs.readFileSync(`zos.${networkProvider}.json`, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;
const propsContractABI = require('../../build/contracts/PropsToken.json');

const distributionMetadataFilename = `output/distribution-summary-${networkProvider}.json`;
let distributionData;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  distributionData = require(`../../${distributionMetadataFilename}`);
} catch (error) {
  distributionData = {};
}

if (typeof (distributionData.steps) === 'undefined') {
  distributionData.steps = [];
}

const stepData = {
  name: 'finish',
};

async function main() {
  // get balance of remaining props in props holder account
  networkInUse = `${networkProvider}2`;
  addressInUse = connectionConfig.networks[networkInUse].wallet_address;
  const tokenHolderAddress = connectionConfig.networks[networkInUse].wallet_address;
  const providerTransferrer = connectionConfig.networks[networkInUse].provider();
  web3 = new Web3(providerTransferrer);
  const propsContractInstance = new web3.eth.Contract(propsContractABI.abi, PropsTokenContractAddress);  
  let remainingProps;
  // eslint-disable-next-line no-await-in-loop
  await propsContractInstance.methods.balanceOf(tokenHolderAddress)
    .call()
    .then((val) => {
      remainingProps = val;
    });

  const remainingPropsG = web3.utils.fromWei(remainingProps);
  if (remainingProps > 0) {
    // transfer remaining props to multisig wallet
    console.log(`${tokenHolderAddress} has ${remainingPropsG} props remaining`);
    await propsContractInstance.methods.transfer(
      multisigWalletForRemaningProps,
      remainingProps,
    ).send({
      from: tokenHolderAddress,
      gas: utils.gasLimit('transfer'),
      gasPrice: utils.gasPrice(),
    }).then((receipt) => {      
      stepData.remainingPropsTransfer = { total: remainingPropsG, to: multisigWalletForRemaningProps, tx: receipt.transactionHash };
      console.log(`Transferred ${remainingPropsG} to multisig wallet ${multisigWalletForRemaningProps} from ${tokenHolderAddress} (tx=${receipt.transactionHash})`);
    }).catch((error) => {
      console.warn(`Error transferring ${remainingPropsG} multisig wallet ${multisigWalletForRemaningProps} from ${tokenHolderAddress}:${error}`);
    });
  }

  // transfer ownership of props token proxy contract to multisig wallet
  // deploy proxy contract
  networkInUse = `${networkProvider}1`;
  addressInUse = connectionConfig.networks[networkInUse].wallet_address;
  cmd = `zos set-admin ${addressInUse} ${multisigWalletForPropsTokenProxy} -y --network ${networkInUse} --from ${addressInUse}`;  
  try {
    console.log(`Executing ${cmd}`);
    const cmdOutput = execSync(cmd).toString();
    console.log(`${cmd} returned => ${cmdOutput}`);
    stepData.newPropsTokenProxyOwner = multisigWalletForPropsTokenProxy;
  } catch (err) {
    console.warn(err);
  }

  distributionData.steps.push(stepData);
  fs.writeFile(
    distributionMetadataFilename,
    JSON.stringify(distributionData),
    { flag: 'w' },
    (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`metadata written to ${distributionMetadataFilename}`);
      console.log(JSON.stringify(distributionData, null, 2));
      process.exit(0);
    },
  );
}

try {
  main();
} catch (err) {
  console.warn(err);
}
