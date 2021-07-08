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
let totalTransferred = new BigNumber(0);
let totalTransferredToVestingContracts = new BigNumber(0);
const startTime = Math.floor(Date.now()/1000);
const nonces = {};


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
const allocationMetadataFilename = `output/allocation-${allocateTo}-${networkProvider}.json`;
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

let allocationsData;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  allocationsData = require(`../../${allocationMetadataFilename}`);
} catch (error) {
  allocationsData = {};
}
if (typeof (allocationsData.allocations) === 'undefined') {
  allocationsData.allocations = [];
}

const fileNetworkName = networkProvider === 'test' ? 'dev-1551650219173' : networkProvider;
const zosData = JSON.parse(fs.readFileSync(`zos.${fileNetworkName}.json`, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;
const propsContractABI = require('../../build/contracts/PropsToken.json');

allocationsData.tokenContractAddress = PropsTokenContractAddress;
let accounts;
async function main() {
  // instantiate propstoken
  let providerOwner;
  networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}2`;
  if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
    providerOwner = connectionConfig.networks[networkInUse].provider();
    web3 = new Web3(providerOwner);
  }
  let proxyDeployerAddress;
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${connectionConfig.networks[networkInUse].host}:${connectionConfig.networks[networkInUse].port}`));
    accounts = await web3.eth.getAccounts();
    addressInUse = accounts[2];
    proxyDeployerAddress = accounts[1];
  } else {
    addressInUse = connectionConfig.networks[networkInUse].wallet_address;
    proxyDeployerAddress = connectionConfig.networks[`${networkProvider}1`].wallet_address;
  }

  BigNumber.config({ EXPONENTIAL_AT: 1e+9 });
  const tokenHolderAddress = addressInUse;
  const propsContractInstance = new web3.eth.Contract(propsContractABI.abi, PropsTokenContractAddress);
  nonces[tokenHolderAddress] = await web3.eth.getTransactionCount(tokenHolderAddress);  
  const tokenHolderEthBalance = new BigNumber(await web3.eth.getBalance(tokenHolderAddress));
  const proxyDeployerEthBalance = new BigNumber(await web3.eth.getBalance(proxyDeployerAddress));

  // read csv
  
  const allocationArray = await utils.getCSVData(addressesCSV);
  
  // do quick sum of all tokens and eth needed to succeed
  let tokensNeeded = new BigNumber(0);
  let gasNeeded = new BigNumber(0);
  let gasNeededProxy = new BigNumber(0);
  for (let i = 1; i < allocationArray.length; i += 1) {
    const allocationData = allocationArray[i];
    const tokensRead = new BigNumber(allocationData[1]);
    tokensNeeded = tokensNeeded.plus(tokensRead);
    gasNeeded = gasNeeded.plus(new BigNumber(utils.gasLimit('transfer')));
    if (parseInt(allocationData[4], 10) > 0) { // also has a vesting contract
      gasNeeded = gasNeeded.plus(new BigNumber(utils.gasLimit('transfer')));
      gasNeededProxy = gasNeededProxy.plus(new BigNumber(utils.gasLimit('vestingContract')));
    }
  }
  let tokenHolderBalance;
  await propsContractInstance.methods.balanceOf(tokenHolderAddress).call().then((bal) => {
    console.log(`Got props balance for ${tokenHolderAddress}=${bal}`);
    tokenHolderBalance = new BigNumber(bal);
  }).catch((error) => {
    console.warn(`Error getting props balance of ${tokenHolderAddress}:${error}`);
  });
  if (tokenHolderBalance.isLessThan(tokensNeeded)) {
    console.warn(`Not enough props tokens to make this distribtion balance=${tokenHolderBalance} needed=${tokensNeeded}`);
    process.exit(0);
  }

  const ethNeeded = gasNeeded.multipliedBy(new BigNumber(utils.gasPrice()));
  const ethNeededProxy = gasNeededProxy.multipliedBy(new BigNumber(utils.gasPrice()));
  if (tokenHolderEthBalance.isLessThan(ethNeeded)) {
    console.warn(`(Transferrer=${tokenHolderAddress}) Not enough eth to make this distribtion balance=${tokenHolderEthBalance} needed=${ethNeeded}`);
    process.exit(0);
  }

  if (proxyDeployerEthBalance.isLessThan(ethNeededProxy)) {
    console.warn(`(ProxyDeployer=${proxyDeployerAddress}) Not enough eth to make this distribtion balance=${proxyDeployerEthBalance} needed=${ethNeededProxy}`);
    process.exit(0);
  }

  for (let i = 1; i < allocationArray.length; i += 1) {
    let vestingContractFailed = false;
    console.log(`Working on row - ${i} (timepassed=${(Math.floor(Date.now()/1000) - timestamp)}):${allocationArray[i]}`);
    console.log(`--------------------------------------------`);
    const allocationData = allocationArray[i];
    // wallet address,tokens,vesting duration,vesting cliff,vesting percentage,type,name,email address,first name,invested amount,invested discount
    const address = allocationData[0];
    if (address.length > 0) {
      const totalTokens = allocationData[1];
      const tokensRead = new BigNumber(allocationData[1]);
      // const _tokensMultiplier = new BigNumber(1 * 10 ** 18);
      const tokens = tokensRead; // .multipliedBy(_tokensMultiplier);
      const duration = new BigNumber(allocationData[2]);
      const cliff = new BigNumber(allocationData[3]);
      const percent = new BigNumber(allocationData[4]);
      const type = allocationData[5];
      const name = allocationData[6];
      const email = allocationData[7];
      const firstName = allocationData[8];
      const investedAmount = allocationData[9];
      const investedDiscount = allocationData[10];
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
      const beneficiary = address;

      const tokensToVest = tokens.multipliedBy(percent).dividedBy(100);
      const tokensToGrant = tokens.minus(tokensToVest);

      const allocationOutput = {};
      allocationOutput.beneficiary = beneficiary;
      allocationOutput.start = start;
      allocationOutput.tokensToVest = tokensToVest;
      allocationOutput.tokensToGrant = tokensToGrant;
      allocationOutput.vestingDuration = duration;
      allocationOutput.cliffDuration = cliff;
      allocationOutput.type = type;
      allocationOutput.name = name;
      allocationOutput.email = email;
      allocationOutput.firstName = firstName;
      allocationOutput.investedAmount = investedAmount;
      allocationOutput.investedDiscount = investedDiscount;
      allocationOutput.totalTokens = totalTokens;


      if (tokensToVest > 0) {
        let retries = 0;
        let success = false;
        let throwErrorBeforeCreation = false;
        let throwErrorAfterCreation = false;        
        while (!success)
        {
          // const blockNumberBeforeCreate = await web3.eth.getBlockNumber();
          // const nonceAtContractCreation = utils.getNonce(nonces, addressInUse);
          cmd = `zos create openzeppelin-eth/TokenVesting -v --init initialize \
          --args ${beneficiary},${start},${cliffDuration},${vestingDuration},${recovable},${addressInUse} \
          --network ${networkInUse} --from ${addressInUse}`;
          try {
            // create token vesting contract
            console.log(`Executing ${cmd}`);            
            if (throwErrorBeforeCreation) {
              throw new Error('Testing a throw error before vesting contract creation');
            }
            let tokenVestingProxyContractAddress = await execSync(cmd).toString().replace(/\n$/, '');
            let regex1 = /.*(0x.*)/g;
            tokenVestingProxyContractAddress = tokenVestingProxyContractAddress.match(regex1)[0];            
            if (throwErrorAfterCreation) {
              throw new Error('Testing a throw error after vesting contract creation');              
            }            
            allocationOutput.vestingContractAddress = tokenVestingProxyContractAddress;
            success = true;
            // transfer to vesting contract
            console.log(`Transferring ${tokensToVest.toString()} to vesting contract ${tokenVestingProxyContractAddress} from ${tokenHolderAddress}`);
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
              allocationOutput.vestingTransferTx = receipt.transactionHash;
              totalTransferredToVestingContracts = totalTransferredToVestingContracts.plus(tokensToVest);
              totalTransferred = totalTransferred.plus(tokensToVest);            
              console.log(`Transferred ${tokensToVest.toString()} to vesting contract from ${tokenHolderAddress} (tx=${receipt.transactionHash})`);
            }).catch((error) => {
              console.warn(`Error transferring ${tokensToVest.toString()} to vesting contract from ${tokenHolderAddress}:${error}`);
            });
          } catch (err) {            
            console.warn(err.message);
            
            retries +=1;   
            if (retries >= utils.getMaxVestingContractCreationRetries()) {
              console.log(`************ Failed to create contract max retries reached (retry=${retries} of ${utils.getMaxVestingContractCreationRetries()}) skipping allocation ${JSON.stringify(allocationData)} `);              
              success = true;
              vestingContractFailed = true;
            } else {
              console.log(`Failed to create contract will retry (retry=${retries} of ${utils.getMaxVestingContractCreationRetries()}) -> ${cmd} `);
            }
          }
        }
        if (vestingContractFailed) continue;
      }

      if (tokensToGrant > 0) {
        try {
          // transfer to beneficiary
          console.log(`Transferring ${tokensToGrant.toString()} to beneficiary ${beneficiary} from ${tokenHolderAddress}`);
          // eslint-disable-next-line no-await-in-loop
          await propsContractInstance.methods.transfer(
            beneficiary,
            web3.utils.toWei(tokensToGrant.toString()),
          ).send({
            from: tokenHolderAddress,
            gas: utils.gasLimit('transfer'),
            gasPrice: utils.gasPrice(),
            nonce: utils.getAndIncrementNonce(nonces, tokenHolderAddress),
          // eslint-disable-next-line no-loop-func
          }).then((receipt) => {
            allocationOutput.beneficiaryTransferTx = receipt.transactionHash;
            totalTransferred = totalTransferred.plus(tokensToGrant);
            countWallets += 1;
            console.log(`Transferred ${tokensToGrant.toString()} to beneficiary ${beneficiary} from ${tokenHolderAddress} (tx=${receipt.transactionHash})`);
          }).catch((error) => {
            console.warn(`Error transferring ${tokensToGrant.toString()} to beneficiary ${beneficiary} from ${tokenHolderAddress}:${error}`);
          });
        } catch (err) {
          console.warn(err);
        }
      }
      console.log(`Pushing into allocationData.allocations ${JSON.stringify(allocationOutput)}`);
      allocationsData.allocations.push(allocationOutput);
    }
  }

  distributionData.steps.push({
    name: allocateTo,
    tokenAddress: PropsTokenContractAddress,
    countWallets,
    totalTransferred,
    totalTransferredToVestingContracts,
    date: utils.timeStamp(),
  });
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
      // console.log(JSON.stringify(distributionData, null, 2));
      fs.writeFile(
        allocationMetadataFilename,
        JSON.stringify(allocationsData),
        { flag: 'w' },
        (err2) => {
          if (err2) {
            console.error(err2);
            process.exit(1);
          }
          console.log(`metadata written to ${allocationMetadataFilename}`);
          // console.log(JSON.stringify(allocationsData, null, 2));
          process.exit(0);
        },
      );
    },
  );
}

try {
  main();
} catch (err) {
  console.warn(err);
}
