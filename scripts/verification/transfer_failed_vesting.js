/* eslint-disable prefer-destructuring */
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const fs = require('fs');
const path = require('path');
// eslint-disable-next-line prefer-destructuring
const execSync = require('child_process').execSync;
const connectionConfig = require('../../truffle');
const utils = require('../../scripts_utils/utils');

const networkProvider = process.argv[2];
const distOutputJSON = process.argv[3];
let dryRun = process.argv[4];
let networkInUse;
let addressInUse;
let cmd;
let web3;
let countWallets = 0;
let totalTransferred = new BigNumber(0);
let totalTransferredToVestingContracts = new BigNumber(0);
let countMissing = 0;
const startTime = Math.floor(Date.now()/1000);
const nonces = {};


// validate network
if (typeof (networkProvider) === 'undefined') {
  console.warn('Must supply networkProvider');
  process.exit(0);
}

// validate output file passed
if (typeof (distOutputJSON) === 'undefined') {
  console.warn('Must supply path to JSON');
  process.exit(0);
}

if (typeof (dryRun) === 'undefined' || dryRun === 'false') {
  dryRun = true;
} else {
  dryRun = false;
}

const newOutputJSON = path.basename(distOutputJSON, '.json') + `-${Math.floor(Date.now()/1000)}`;
const timestamp = Math.round((new Date()).getTime() / 1000);
let distributionData;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  distributionData = require(`../../${distOutputJSON}`);
} catch (error) {
  console.warn('Could not read in distribution data');
  process.exit(0);
}

const fileNetworkName = networkProvider === 'test' ? 'dev-1551288652415' : networkProvider;
const zosData = JSON.parse(fs.readFileSync(`zos.${fileNetworkName}.json`, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;
const propsContractABI = require('../../build/contracts/PropsToken.json');

let accounts;
async function main() {
  // instantiate propstoken
  let providerOwner;
  networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}2`;
  if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
    providerOwner = connectionConfig.networks[networkInUse].provider();
    web3 = new Web3(providerOwner);
  }
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${connectionConfig.networks[networkInUse].host}:${connectionConfig.networks[networkInUse].port}`));
    accounts = await web3.eth.getAccounts();
    addressInUse = accounts[2];
  } else {
    addressInUse = connectionConfig.networks[networkInUse].wallet_address;
  }

  BigNumber.config({ EXPONENTIAL_AT: 1e+9 });
  const tokenHolderAddress = addressInUse;
  const propsContractInstance = new web3.eth.Contract(propsContractABI.abi, PropsTokenContractAddress);
  nonces[tokenHolderAddress] = await web3.eth.getTransactionCount(tokenHolderAddress);
  const tokenHolderEthBalance = new BigNumber(await web3.eth.getBalance(tokenHolderAddress));

  let countVestingErrors = 0;
  let countTotal = 0;
  let totalToTransfer = new BigNumber(0);
  
  for (let j = 0; j < distributionData.allocations.length; j += 1) {
    const allocationRow = distributionData.allocations[j];
    if (Number(allocationRow.tokensToVest)>0 && !('vestingContractAddress' in allocationRow)) {
        countVestingErrors += 1;        
        console.log(`Working on row ${countVestingErrors} --> ${JSON.stringify(allocationRow)}`);
        const tokensToVest = new BigNumber(allocationRow.tokensToVest);
        const duration = new BigNumber(allocationRow.vestingDuration);
        const cliff = new BigNumber(allocationRow.cliffDuration);
        // deploy proxy contract per address
        networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}1`;
        if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
          addressInUse = accounts[1];
        } else {
          addressInUse = connectionConfig.networks[networkInUse].wallet_address;
        }

        const start = (timestamp) + utils.duration.minutes(1);
        const cliffDuration = utils.duration.days(cliff);
        const vestingDuration = utils.duration.days(duration);
        const recovable = 'false';
        const beneficiary = allocationRow.beneficiary;
        cmd = `zos create openzeppelin-eth/TokenVesting -v --init initialize \
        --args ${beneficiary},${start},${cliffDuration},${vestingDuration},${recovable},${addressInUse} \
        --network ${networkInUse} --from ${addressInUse}`;
        try {
          // create token vesting contract
          const fakeTxHash = `${Date.now()}-${j}`;
          console.log(`Executing ${cmd}`);
          let tokenVestingProxyContractAddress;
          if (dryRun) {
            tokenVestingProxyContractAddress = `${fakeTxHash}-vc`;
          } else {
            tokenVestingProxyContractAddress = execSync(cmd).toString().replace(/\n$/, '');
          }
          
          distributionData.allocations[j]['vestingContractAddress'] = tokenVestingProxyContractAddress;          

          // transfer to vesting contract
          console.log(`Transferring ${tokensToVest.toString()} to vesting contract from ${tokenHolderAddress}`);
          if (dryRun) {
            distributionData.allocations[j].vestingTransferTx = `${fakeTxHash}-tx`
            totalToTransfer = totalToTransfer.plus(tokensToVest);
          } else {
            // eslint-disable-next-line no-await-in-loop
            await propsContractInstance.methods.transfer(
              tokenVestingProxyContractAddress,
              web3.utils.toWei(tokensToVest.toString()),
            ).send({
              from: tokenHolderAddress,
              gas: utils.gasLimit('transfer'),
              gasPrice: utils.gasPrice(),
              nonce: utils.getAndIncrementNonce(nonces, tokenHolderAddress),
            // eslint-disable-next-line no-loop-func
            }).then((receipt) => {
              distributionData.allocations[j]['vestingTransferTx'] = receipt.transactionHash;
              totalToTransfer = totalToTransfer.plus(tokensToVest);
              console.log(`Transferred ${tokensToVest.toString()} to vesting contract from ${tokenHolderAddress} (tx=${receipt.transactionHash})`);
            }).catch((error) => {
              console.warn(`Error transferring ${tokensToVest.toString()} to vesting contract from ${tokenHolderAddress}:${error}`);
            });
          }          
        } catch (err) {
          console.warn(err);
        }
    }     
  }
  fs.writeFile(
    `output/${newOutputJSON}.json`,
    JSON.stringify(distributionData),
    { flag: 'w' },
    (err2) => {
      if (err2) {
        console.error(err2);
        process.exit(1);
      }
      console.log(`metadata written to ${`output/${newOutputJSON}`}`);
      if (!dryRun) console.log(JSON.stringify(distributionData, null, 2));
      console.log(`total transferred to new vesting contracts = ${totalToTransfer}`);
      console.log(`total missing = ${countVestingErrors}`);
      process.exit(0);
    },
  );  
}

try {
  main();
} catch (err) {
  console.warn(err);
}
