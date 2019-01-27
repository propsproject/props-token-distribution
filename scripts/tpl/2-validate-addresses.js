/* eslint-disable prefer-destructuring */
/* eslint-disable import/no-dynamic-require */
/**
 * @apiDescription Add Validator to the props jurisdiction contract
 * @apiGroup PROPS Jurisdiction
 * @apiName Validate List of Addresses
 * @api {node} scripts/deploy/2-validate-addresses validate_addresses
 * @apiParam {String} TPLType TPL Type "basic" or "extended"
 * @apiParam {String} CSVAddresses CSV List of addresses to validate
 * @apiParam {String} Network Ethereum Network to use (default development)
 * @apiParamExample {text} Request-Example:
 *     node scripts/deploy/2-validate-addresses.js basic csv/kyc/adderesses.csv development
 *
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
const connectionConfig = require('../../truffle.js');
const utils = require('../../scripts_utils/utils');

let deployType = process.argv[2]; // Provide Basic or Extended jurisdiction type
if (typeof (deployType) === 'undefined') {
  console.error('must supply contract type');
  process.exit(1);
} else {
  deployType = deployType.toLowerCase();
}

const addressesCSVPath = process.argv[3];
if (typeof (addressesCSVPath) === 'undefined') {
  console.error('must supply addresses csv');
  process.exit(1);
}

const networkProvider = process.argv[5];
if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

const deployMetadataFilename = `output/jurisdictionDeployment-${networkProvider}.json`;
const validatedAdderssesMetadataFilename = `output/juridictionValidatedAddresses-${networkProvider}.json`;

let deployAddresses;
let validatedAddresses;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  deployAddresses = require(`../../${deployMetadataFilename}`);
} catch (error) {
  deployAddresses = {};
}

try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  validatedAddresses = require(`../../${validatedAdderssesMetadataFilename}`);
} catch (error) {
  validatedAddresses = {};
}


let contractImportLocation;
if (deployType === 'basic') {
  contractImportLocation = '../../build/contracts/BasicJurisdiction.json';
} else if (deployType === 'extended') {
  contractImportLocation = '../../build/contracts/ExtendedJurisdiction.json';
}

const ContractData = require(contractImportLocation);

const networkInUse = `${networkProvider}0`;
const providerOwner = connectionConfig.networks[networkInUse].provider();
const web3 = new Web3(providerOwner);
const ContractInstance = new web3.eth.Contract(ContractData.abi, deployAddresses.jurisdiction);

async function main() {
  console.log(
    `validating addresses ${deployType} jurisdiction to ${networkProvider} network...`,
  );
  let ownerAddress;
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    const accounts = await web3.eth.getAccounts();
    ownerAddress = accounts[3];
  } else {
    ownerAddress = connectionConfig.networks[networkInUse].wallet_address;
  }

  await ContractInstance.methods.canIssueAttributeType(ownerAddress, deployAddresses.attributeId).call({
    from: ownerAddress,
  }).then((canIssue) => {
    if (!canIssue) {
      console.log(`canIssue=${JSON.stringify(canIssue)} --> abort can't issueAttribute`);
      process.exit(0);
    }
  });

  const addressesContents = fs.readFileSync(addressesCSVPath, 'utf8');
  const addressesArray = addressesContents.split(/\r?\n/);
  console.log(JSON.stringify(addressesArray));
  for (let i = 0; i < addressesArray.length; i += 1) {
    if (i > 0) {
      // console.log("issueAttribute details: "+deployAddresses.jurisdiction+", "+addressesArray[i]+", " + deployAddresses.attributeId+", "+account.address);
      // process.exit(0);
      // eslint-disable-next-line no-await-in-loop
      await ContractInstance.methods.issueAttribute(
        addressesArray[i],
        deployAddresses.attributeId,
        0,
      ).send({
        from: ownerAddress,
        gas: utils.gasLimit('validateAddress'),
        gasPrice: utils.gasPrice(),
      }).then((receipt) => {
        if (typeof (validatedAddresses.addresses) === 'undefined') {
          validatedAddresses.addresses = [];
        }
        validatedAddresses.addresses.push({ address: addressesArray[i], tx: receipt.transactionHash });
      }).catch((error) => {
        console.log(`error=${error}`);
      });
    }
  }

  fs.writeFile(
    validatedAdderssesMetadataFilename,
    JSON.stringify(validatedAddresses),
    { flag: 'w' },
    (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`metadata written to ${validatedAdderssesMetadataFilename}`);
      console.log(JSON.stringify(validatedAddresses, null, 2));
      process.exit(0);
    },
  );
}

main();
