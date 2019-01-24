/**
 * @apiDescription Add Validator to the props jurisdiction contract
 * @apiGroup PROPS Jurisdiction
 * @apiName Validate List of Addresses
 * @api {node} scripts/deploy/2-validate-addresses validate_addresses
 * @apiParam {String} TPLType TPL Type "basic" or "extended"
 * @apiParam {String} ValidatorPrivateKey Private key of Validator
 * @apiParam {String} CSVAddresses CSV List of addresses to validate
 * @apiParam {String} Network Ethereum Network to use (default development)
 * @apiParamExample {text} Request-Example:
 *     node scripts/deploy/2-validate-addresses.js basic 5d7ffcdda88966eeea56fef8106805f83a4f9d3efd152e8f2972118d87c19c1e csv/kyc/adderesses.csv development
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
var fs = require('fs');
const csv = require('fast-csv')
const applicationConfig = require('../../config.js')
const connectionConfig = require('../../truffle.js')
var count = -1;
let addressesCSVPath = process.argv[4];
if (typeof(addressesCSVPath) === 'undefined') {
  console.error('must supply addresses csv')
  process.exit(1)
}

if (typeof(validatorDescription) === 'undefined') {
  validatorDescription = 'Validator'
}

let networkName = process.argv[5]; // Provide if you'd like to dump accounts
if (typeof(networkName) === 'undefined') {
  networkName = 'development';
}
console.log("networkName="+networkName);
const connection = connectionConfig.networks[applicationConfig.networks[networkName].network]
var validatorAccount;
const deployMetadataFilename = 'build/contractDeploymentAddresses-'+networkName+'.json'
const validatedAdderssesMetadataFilename = 'build/contractValidatedAddresses-'+networkName+'.json'

let deployAddresses;
let validatedAddresses;
try {
  deployAddresses = require(`../../${deployMetadataFilename}`)  
} catch(error) {
  deployAddresses = {}  
}

try {
  validatedAddresses = require(`../../${validatedAdderssesMetadataFilename}`)
} catch(error) {
  validatedAddresses = {}
}

let deployType = process.argv[2] // Provide Basic or Extended jurisdiction type
if (typeof(deployType) === 'undefined') {
  console.error('must supply contract type')
  process.exit(1)
} else {
  deployType = deployType.toLowerCase()
}

let pk = process.argv[3] // Provide if you'd like to dump accounts
if (typeof(pk) === 'undefined') {
  console.error('must supply private key of validator')
  process.exit(1)
}




args = []

let contractImportLocation
if (deployType === 'basic') {
  contractImportLocation = '../../build/contracts/BasicJurisdiction.json'
} else if (deployType === 'extended') {
  contractImportLocation = '../../build/contracts/ExtendedJurisdiction.json'
}

const ContractData = require(contractImportLocation)

let web3 = connection.provider
const ContractInstance = new web3.eth.Contract(ContractData.abi, deployAddresses.jurisdiction)

async function main() {
  console.log(
    `validating addresses ${
      deployType
    } jurisdiction to ${
      applicationConfig.networks[networkName].network
    } network...`
  )
  
  validatorAccount = web3.eth.accounts.privateKeyToAccount('0x'+pk);  
  
  
  const account = validatorAccount;
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;  
  console.log("addressesCSVPath="+addressesCSVPath);


  await ContractInstance.methods.getValidators(
    ).call({
      from: account.address,
      gas: 5000000,
      gasPrice: 10 ** 9
    }).then(validators => {      
      console.log("Validators:"+JSON.stringify(validators));
      
    })  
    await ContractInstance.methods.canIssueAttributeType(account.address, deployAddresses.attributeId
      ).call({
        from: account.address,
        gas: 5000000,
        gasPrice: 10 ** 9
      }).then(canIssue => {              
        if (!canIssue) {
          console.log("canIssue="+JSON.stringify(canIssue)+" --> abort can't issueAttribute");
          process.exit(0);          
        }
      })    
  
  var addressesContents = fs.readFileSync(addressesCSVPath, 'utf8');  
  addressesArray = addressesContents.split(/\r?\n/)
  console.log(JSON.stringify(addressesArray));
  for (let i = 0; i < addressesArray.length; ++i) {
    if (i > 0) {
      // console.log("issueAttribute details: "+deployAddresses.jurisdiction+", "+addressesArray[i]+", " + deployAddresses.attributeId+", "+account.address);
      // process.exit(0);
      await ContractInstance.methods.issueAttribute(
        addressesArray[i],
        deployAddresses.attributeId,
        0
      ).send({
        from: account.address,
        gas: 6000000,
        gasPrice: 10 ** 9
      }).then(function(receipt){
        if (typeof(validatedAddresses.addresses)==='undefined'){   
          validatedAddresses.addresses = [];    
        }
        validatedAddresses.addresses.push({'address': addressesArray[i], 'receipt': receipt});        
        console.log('receipt='+JSON.stringify(receipt));
      }).catch((error) => {        
        console.log("error="+error);    
      })      
    }
  }  
  
  fs.writeFile(
    validatedAdderssesMetadataFilename,
    JSON.stringify(validatedAddresses),
    {flag: 'w'},
    err => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log(`metadata written to ${validatedAdderssesMetadataFilename}`)
      console.log(JSON.stringify(validatedAddresses, null, 2))      
      process.exit(0)
    }
  )
}

async function validateAddress(address, account, count) {  
    if (true) { // TODO address check            
      await ContractInstance.methods.issueAttribute(
        address,
        deployAddresses.attributeId,
        1,
      ).send({
        from: account.address,
        gas: 6000000,
        gasPrice: 10 ** 9
      }).then(function(receipt){
        if (typeof(validatedAddresses.addresses)==='undefined'){   
          validatedAddresses.addresses = [];    
        }
        validatedAddresses.validators.push({'address': addressData.address, 'receipt': receipt});        
        console.log('receipt='+JSON.stringify(receipt));
      }).catch((error) => {        
        console.log("error="+error);    
      })
    }  
}

main();