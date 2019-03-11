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
const addressesCSV = process.argv[3];
let networkInUse;
let addressInUse;
let cmd;
let web3;
let countWallets = 0;
let countDistinctWallets = 0;
let countInvalidWallets = 0;
let countVesting = 0;
let wallets = [];
let totalDistributed = new BigNumber(0);
let totalVesting = new BigNumber(0);
let invalidWallets = {};

// validate network
if (typeof (networkProvider) === 'undefined') {
  console.warn('Must supply networkProvider');
  process.exit(0);
}

// validate csv file passed
if (typeof (addressesCSV) === 'undefined') {
  console.warn('Must supply path to CSV');
  process.exit(0);
}

// eslint-disable-next-line no-undef
const allocateTo = path.basename(addressesCSV, '.csv');

const timestamp = Math.round((new Date()).getTime() / 1000);
const verificationMetadataFilename = `output/verficiation-${allocateTo}-${networkProvider}.json`;
let verificationData;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  verificationData = require(`../../${verificationMetadataFilename}`);
} catch (error) {
  verificationData = {};
}

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
  // read csv
  const allocationArray = await utils.getCSVData(addressesCSV);
  
  for (let i = 1; i < allocationArray.length; i += 1) {
    console.log(`Working on row:${allocationArray[i]}`);
    const allocationData = allocationArray[i];
    // wallet address,tokens,vesting duration,vesting cliff,vesting percentage,type,name,email address,first name,invested amount,invested discount
    const address = allocationData[0];
    if (address.length > 0) {
      const totalTokens = new BigNumber(allocationData[1]);      
      const duration = Number(allocationData[2]);
      const cliff = Number(allocationData[3]);
      const percent = new BigNumber(allocationData[4]);
      const type = allocationData[5];
      const name = allocationData[6];
      const email = allocationData[7];
      const firstName = allocationData[8];
      const investedAmount = allocationData[9];
      const investedDiscount = allocationData[10];

      if (!(address in wallets)) {
        wallets[address] = address
        countDistinctWallets+=1;
      }
      countWallets+=1;
      if (!web3.utils.isAddress(address)) {
        invalidWallets[address] = allocationData;
        countInvalidWallets += 1;
      }

      const tokensToVest = totalTokens.multipliedBy(percent).dividedBy(100);
      if (tokensToVest>0) {
        countVesting+=1;
      }
      const tokensToGrant = totalTokens.minus(tokensToVest);

      totalDistributed = totalDistributed.plus(totalTokens);
      totalVesting = totalVesting.plus(tokensToVest);
    }
  }

  verificationData.countWallets = countWallets;
  verificationData.countDistinctWallets = countDistinctWallets;
  verificationData.countInvalidWallets = countInvalidWallets;
  verificationData.invalidWallets = invalidWallets;
  verificationData.totalDistributed = totalDistributed;
  verificationData.totalVesting = totalVesting;
  verificationData.countVesting = countVesting;
  

  
  fs.writeFile(
    verificationMetadataFilename,
    JSON.stringify(verificationData),
    { flag: 'w' },
    (err2) => {
      if (err2) {
        console.error(err2);
        process.exit(1);
      }
      console.log(`metadata written to ${verificationMetadataFilename}`);
      console.log(JSON.stringify(verificationData, null, 2));
      process.exit(0);
    },
  );
}

try {
  main();
} catch (err) {
  console.warn(err);
}
