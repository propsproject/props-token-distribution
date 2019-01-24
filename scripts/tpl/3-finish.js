/**
 * @apiDescription Transfer ownership of Jurisdiction contract
 * @apiGroup PROPS Jurisdiction
 * @apiName Transfer ownership of Jurisdiction Contract 
 * @api {node} scripts/deploy/3-finish finish
 * @apiParam {String} TPLType TPL Type "basic" or "extended"
 * @apiParam {String} OwnerPrivateKey Private key of Jurisdiction Contract Owner
 * @apiParam {String} Address New owner of the Jurisdiction contract
 * @apiParam {String} Network Ethereum Network to use (default development)
 * @apiParamExample {text} Request-Example:
 *     node scripts/deploy/3-finish.js basic 02bd8464361b9368457a62753501005d77ca48c1a766bb73a68d02ab3ce1913b 0xd9f880f8633cd0b807d2d7bb3ced7488c08237be development
 * 
 *
 * @apiSuccessExample {json} Success-Output(i.e. participate):
 * setting up basic jurisdiction to development network...
  jurisdiction: 0xe1efbB0C32e05aaecE934bec5e5c88ae8796Cb5e
metadata written to build/contractOwnership.json
{
  "address": "0xd9f880f8633cd0b807d2d7bb3ced7488c08237be"
}
*/
var fs = require('fs');
const applicationConfig = require('../../config.js')
const connectionConfig = require('../../truffle.js')

let newOwnerAddress = process.argv[4];

if (typeof(newOwnerAddress) === 'undefined') {
  console.error('must supply new owner address to transfer to')
  process.exit(1)
}


let networkName = process.argv[5]; // Provide if you'd like to dump accounts
if (typeof(networkName) === 'undefined') {
  networkName = 'development';
}
console.log("networkName="+networkName);
const connection = connectionConfig.networks[applicationConfig.networks[networkName].network]
var ownerAccount;
const deployMetadataFilename = 'build/contractDeploymentAddresses-'+networkName+'.json'
const ownershipMetadataFilename = 'build/contractOwnership-'+networkName+'.json'

let deployAddresses;
let ownershipAddress;
try {
  deployAddresses = require(`../../${deployMetadataFilename}`)  
} catch(error) {
  deployAddresses = {}  
}

try {
  ownershipAddress = require(`../../${ownershipMetadataFilename}`)
} catch(error) {
  ownershipAddress = {}
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
  console.error('must supply private key of jurisdiction account owner')
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
console.log(`deployAddresses.jurisdiction=${deployAddresses.jurisdiction}`);
async function main() {
  console.log(
    `setting up ${
      deployType
    } jurisdiction to ${
      applicationConfig.networks[networkName].network
    } network...`
  )
  
  ownerAccount = web3.eth.accounts.privateKeyToAccount('0x'+pk);  
  
  
  const account = ownerAccount;
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;    
  
  await ContractInstance.methods.owner()
      .call()
      .then((val) => {
        console.log(`current owner is ${val}`);
      });
  
  try {
    console.log(`calling transferOwnership with ${newOwnerAddress} from ${account.address}`);
    await ContractInstance.methods.transferOwnership(
      newOwnerAddress,    
    ).send({
      from: account.address,
      gas: 40000,
      gasPrice: 10 ** 9
    }).then((receipt) => {
      ownershipAddress.txHash = receipt.transactionHash;
    }).catch(error => {
      console.log(error);    
    })
  } catch (err) {
    console.log(err);    
  }
  

  ownershipAddress.address = newOwnerAddress;  
  
  fs.writeFile(
    ownershipMetadataFilename,
    JSON.stringify(ownershipAddress),
    {flag: 'w'},
    err => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log(`metadata written to ${ownershipMetadataFilename}`)
      console.log(JSON.stringify(ownershipAddress, null, 2))      
      process.exit(0)
    }
  )
}

main()
