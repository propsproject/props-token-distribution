/* eslint-disable prefer-destructuring */
/**
 * @apiDescription Deploy the props jurisdiction contract with the KYC attribuetId
 * @apiGroup PROPS Jurisdiction
 * @apiName Deploy Jurisdiction Contract
 * @api {node} scripts/deploy/0-deploy-props-jurisdiction deploy
 * @apiParam {String} TPLType TPL Type "basic" or "extended" (default Basic)
 * @apiParam {String} Network Ethereum Network to use
 * @apiParamExample {text} Request-Example:
 *     node scripts/deploy/0-deploy-props-jurisdiction.js basic rinkeby

 *
 *
 * @apiSuccessExample {json} Success-Output(i.e. participate):
 *    deploying basic jurisdiction to development network...
 *    deployed by: {"address":"0x60372F979Ab774B3A4BdF7c7d0D0cF8534ef04c6","privateKey":"0x02bd8464361b9368457a62753501005d77ca48c1a766bb73a68d02ab3ce1913b"}
 *    jurisdiction: 0x40bb136E4431296B836d05a53F7dCE851E7a63A7
 *    metadata written to build/contractDeploymentAddresses.json
 *    {
 *      "jurisdictionOwner": "0x60372F979Ab774B3A4BdF7c7d0D0cF8534ef04c6",
 *      "jurisdiction": "0x40bb136E4431296B836d05a53F7dCE851E7a63A7"
 *    }
 *
*/
const Web3 = require('web3');
const fs = require('fs');
const connectionConfig = require('../../truffle.js');
const utils = require('../../scripts_utils/utils');

// initialization
const attributeId = 1;
const attributeDescription = 'Wallet has been KYCed';
let deployAddresses;

// deal with the args

let deployType = process.argv[2]; // Provide Basic or Extended jurisdiction type
if (typeof (deployType) === 'undefined') {
  deployType = 'extended';
} else {
  deployType = deployType.toLowerCase();
}

const networkProvider = process.argv[3];
if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

const deployMetadataFilename = `output/jurisdictionDeployment-${networkProvider}.json`;

try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  deployAddresses = require(`../../${deployMetadataFilename}`);
} catch (error) {
  deployAddresses = {};
}


const deployTypeOptions = new Set(['basic', 'extended']);
if (!deployTypeOptions.has(deployType)) {
  console.error('must supply "Basic" or "Extended" as the target!');
  process.exit(1);
}

const args = [];

let contractImportLocation;
if (deployType === 'basic') {
  contractImportLocation = '../../build/contracts/BasicJurisdiction.json';
} else if (deployType === 'extended') {
  contractImportLocation = '../../build/contracts/ExtendedJurisdiction.json';
}

// eslint-disable-next-line import/no-dynamic-require
const jurisdictionContractABI = require(contractImportLocation);
// instantiate jurisdiction
const networkInUse = `${networkProvider}0`;
// console.log(`networkInUse=${networkInUse}`);
// console.log(`connectionConfig=${JSON.stringify(connectionConfig)}`);
const providerOwner = connectionConfig.networks[networkInUse].provider();
const web3 = new Web3(providerOwner);

const jurisdictionContractInstance = new web3.eth.Contract(jurisdictionContractABI.abi);

async function main() {
  let ownerAddress;
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    const accounts = await web3.eth.getAccounts();
    ownerAddress = accounts[0];
  } else {
    ownerAddress = connectionConfig.networks[networkInUse].wallet_address;
  }

  console.log(`deploying ${deployType} jurisdiction to ${networkProvider} network...`);
  deployAddresses.jurisdictionOwner = ownerAddress;
  console.log(`deployed by: ${JSON.stringify(ownerAddress)}`);

  const ContractInstance = await jurisdictionContractInstance.deploy({
    data: jurisdictionContractABI.bytecode,
    arguments: args,
  }).send({
    from: ownerAddress,
    gas: utils.gasLimit('deployJurisdiction'),
    gasPrice: utils.gasPrice(),
  });

  const deployedAddress = ContractInstance.options.address;
  deployAddresses.jurisdiction = deployedAddress;
  console.log(`jurisdiction: ${deployedAddress}`);

  // add the kyc attribute
  await ContractInstance.methods.addAttributeType(
    attributeId,
    attributeDescription,
  ).send({
    from: ownerAddress,
    gas: utils.gasLimit('addAttribute'),
    gasPrice: utils.gasPrice(),
  }).then((receipt) => {
    deployAddresses.attributeId = attributeId;
    deployAddresses.attributeDescription = attributeDescription;
    deployAddresses.addAttributeTx = receipt.transactionHash;
  }).catch((error) => {
    console.log(error);
  });

  fs.writeFile(
    deployMetadataFilename,
    JSON.stringify(deployAddresses),
    { flag: 'w' },
    (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`metadata written to ${deployMetadataFilename}`);
      console.log(JSON.stringify(deployAddresses, null, 2));
      process.exit(0);
    },
  );
}

main();
