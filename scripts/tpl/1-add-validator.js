/* eslint-disable prefer-destructuring */
/**
 * @apiDescription Add Validator to the props jurisdiction contract
 * @apiGroup PROPS Jurisdiction
 * @apiName Add Validator to Jurisdiction Contract
 * @api {node} scripts/deploy/1-add-validator add_validator
 * @apiParam {String} TPLType TPL Type "basic" or "extended"
 * @apiParam {String} Address Validator Ethereum Address
 * @apiParam {String} Description Validator Description (default "Validator")
 * @apiParam {String} Network Ethereum Network to use
 * @apiParamExample {text} Request-Example:
 *     node scripts/deploy/1-add-validator.js basic 0xAe9cda73C9B2208eE2edbDb18Ec14E7DF862d592 Validator1 rinkeby
 *
 * @apiSuccessExample {json} Success-Output(i.e. participate):
 * setting up basic jurisdiction to development network...
  jurisdiction: 0xe1efbB0C32e05aaecE934bec5e5c88ae8796Cb5e
metadata written to build/contractValidatorsAddresses.json
{
  "validators": [
    {
      "address": "0xAe9cda73C9B2208eE2edbDb18Ec14E7DF862d592",
      "description": "Validator1"
    },
    {
      "address": "0xe64F6fd8663674946E7527e11491e46b140A9890",
      "description": "Validator2"
    }
  ]
}
*/
const Web3 = require('web3');
const fs = require('fs');
const utils = require('../../scripts_utils/utils');
const connectionConfig = require('../../truffle.js');

const validatorAddress = process.argv[3];
let validatorDescription = process.argv[4];
if (typeof (validatorAddress) === 'undefined') {
  console.error('must supply validator address to add');
  process.exit(1);
}

if (typeof (validatorDescription) === 'undefined') {
  validatorDescription = 'Validator';
}

const networkProvider = process.argv[5];
if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

const deployMetadataFilename = `output/jurisdictionDeployment-${networkProvider}.json`;
const validatorsMetadataFilename = `output/juridictionValidatorsAddresses-${networkProvider}.json`;

let deployAddresses;
let validatorAddresses;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  deployAddresses = require(`../../${deployMetadataFilename}`);
} catch (error) {
  deployAddresses = {};
}

try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  validatorAddresses = require(`../../${validatorsMetadataFilename}`);
} catch (error) {
  validatorAddresses = {};
}

let deployType = process.argv[2]; // Provide Basic or Extended jurisdiction type
if (typeof (deployType) === 'undefined') {
  console.error('must supply contract type');
  process.exit(1);
} else {
  deployType = deployType.toLowerCase();
}

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
const providerOwner = connectionConfig.networks[networkInUse].provider();
const web3 = new Web3(providerOwner);

const jurisdictionContractInstance = new web3.eth.Contract(jurisdictionContractABI.abi, deployAddresses.jurisdiction);

async function main() {
  let ownerAddress;
  const validatorData = {};
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    const accounts = await web3.eth.getAccounts();
    ownerAddress = accounts[0];
  } else {
    ownerAddress = connectionConfig.networks[networkInUse].wallet_address;
  }
  console.log(
    `adding validator ${deployType} jurisdiction to ${networkProvider} network...`,
  );

  await jurisdictionContractInstance.methods.addValidator(
    validatorAddress,
    validatorDescription,
  ).send({
    from: ownerAddress,
    gas: utils.gasLimit('addValidator'),
    gasPrice: utils.gasPrice(),
  }).then((receipt) => {
    validatorData.address = validatorAddress;
    validatorData.description = validatorDescription;
    validatorData.addValidatorTxHash = receipt.transactionHash;
  }).catch((error) => {
    console.log(error);
  });

  await jurisdictionContractInstance.methods.addValidatorApproval(
    validatorAddress,
    deployAddresses.attributeId,
  ).send({
    from: ownerAddress,
    gas: utils.gasLimit('allowValidatorAttribute'),
    gasPrice: utils.gasPrice(),
  }).then((receipt) => {
    validatorData.addValidatorApprovalTxHash = receipt.transactionHash;
  }).catch((error) => {
    console.log(error);
  });

  if (typeof (validatorAddresses.validators) === 'undefined') {
    validatorAddresses.validators = [];
  }
  validatorAddresses.validators.push(validatorData);

  fs.writeFile(
    validatorsMetadataFilename,
    JSON.stringify(validatorAddresses),
    { flag: 'w' },
    (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`metadata written to ${validatorsMetadataFilename}`);
      console.log(JSON.stringify(validatorAddresses, null, 2));
      process.exit(0);
    },
  );
}

main();
