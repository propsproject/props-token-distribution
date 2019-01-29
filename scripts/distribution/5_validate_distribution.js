/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
const Web3 = require('web3');
// const BigNumber = require('bignumber.js');
const fs = require('fs');
// eslint-disable-next-line prefer-destructuring
// const execSync = require('child_process').execSync;
const connectionConfig = require('../../truffle');
// const utils = require('../../scripts_utils/utils');

const networkProvider = process.argv[2];
const allocationTypesStr = process.argv[3]; // comma delimited distributions made
let allocationTypes;
let networkInUse;
// let addressInUse;
// let cmd;
let web3;

if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

if (typeof (allocationTypesStr) === 'undefined') {
  console.log('Must supply multisigWalletForRemaningProps');
  process.exit(0);
} else {
  allocationTypes = allocationTypesStr.split(',');
}

const fileNetworkName = networkProvider === 'test' ? 'dev-5777' : networkProvider;
const zosData = JSON.parse(fs.readFileSync(`zos.${fileNetworkName}.json`, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;
const propsContractABI = require('../../build/contracts/PropsToken.json');

// const allocationMetadataFilename = `output/allocation-${allocateTo}-${networkProvider}.json`;

let accounts;
async function main() {
  // instantiate propstoken
  networkInUse = `${networkProvider}2`;
  let tokenHolderAddress;
  if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
    const providerTransferrer = connectionConfig.networks[networkInUse].provider();
    web3 = new Web3(providerTransferrer);
  }
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${connectionConfig.networks[networkInUse].host}:${connectionConfig.networks[networkInUse].port}`));
    accounts = await web3.eth.getAccounts();
    // eslint-disable-next-line prefer-destructuring
    tokenHolderAddress = accounts[2];
  } else {
    tokenHolderAddress = connectionConfig.networks[networkInUse].wallet_address;
  }

  // addressInUse = connectionConfig.networks[networkInUse].wallet_address;
  const propsContractInstance = new web3.eth.Contract(propsContractABI.abi, PropsTokenContractAddress);

  // get balance of remaining props in props holder account
  let remainingProps;
  let totalSupply;
  let totalTransferred = 0;
  // eslint-disable-next-line no-await-in-loop
  await propsContractInstance.methods.balanceOf(tokenHolderAddress)
    .call()
    .then((val) => {
      remainingProps = web3.utils.fromWei(val);
    });

  await propsContractInstance.methods.totalSupply()
    .call()
    .then((val) => {
      totalSupply = web3.utils.fromWei(val);
    });

  for (let i = 0; i < allocationTypes.length; i += 1) {
    const allocationMetadataFilename = `output/allocation-${allocationTypes[i]}-${networkProvider}.json`;
    let allocationData;
    try {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      allocationData = require(`../../${allocationMetadataFilename}`);
    } catch (error) {
      console.warn(`file ${allocationMetadataFilename} does not exist - did you mispell the distribution types?`);
      process.exit(0);
    }
    for (let j = 0; j < allocationData.allocations.length; j += 1) {
      if (typeof (allocationData.allocations[j].vestingContractAddress) !== 'undefined') {
        await propsContractInstance.methods.balanceOf(allocationData.allocations[j].vestingContractAddress)
          .call()
          .then((val) => {
            totalTransferred += Number(web3.utils.fromWei(val));
          });
      }
      if (typeof (allocationData.allocations[j].beneficiary) !== 'undefined') {
        await propsContractInstance.methods.balanceOf(allocationData.allocations[j].beneficiary)
          .call()
          .then((val) => {
            totalTransferred += Number(web3.utils.fromWei(val));
          });
      }
    }
  }

  if (Number(totalSupply) === (Number(remainingProps) + Number(totalTransferred))) {
    console.log(`Validation passed ${totalSupply} == (${remainingProps} + ${totalTransferred})`);
  } else {
    console.warn(`!!!!! Validation failed ${totalSupply} != (${remainingProps} + ${totalTransferred})`);
  }
  process.exit(0);
}

try {
  main();
} catch (err) {
  console.warn(err);
}
