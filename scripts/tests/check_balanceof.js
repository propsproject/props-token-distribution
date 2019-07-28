const Web3 = require('web3');
const zos = require('zos-lib');
const BigNumber = require('bignumber.js');
const fs = require('fs');
// eslint-disable-next-line prefer-destructuring
const propsTokenContractABI = require('../../build/contracts/PropsToken.json');
const connectionConfig = require('../../truffle');
const utils = require('../../scripts_utils/utils');

const networkProvider = process.argv[2];
const wallet = process.argv[3];
const blockNumber = process.argv[4];
let networkInUse;
let web3;

if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}


const zosDataFileName = networkProvider === 'test' ? 'zos.dev-5777.json' : `zos.${networkProvider}.json`;
const zosData = JSON.parse(fs.readFileSync(zosDataFileName, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;


async function main() {
  // instantiate multisig wallet
  let providerDevOps1;
  let DevOps1MultiSigOwnerAddress;
  networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}1`;
    if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
      providerDevOps1 = connectionConfig.networks[networkInUse].provider();
      web3 = new Web3(providerDevOps1);
    }
    if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
      web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${connectionConfig.networks[networkInUse].host}:${connectionConfig.networks[networkInUse].port}`));
      accounts = await web3.eth.getAccounts();
      // eslint-disable-next-line prefer-destructuring
      DevOps1MultiSigOwnerAddress = accounts[2];
    } else {
      DevOps1MultiSigOwnerAddress = connectionConfig.networks[networkInUse].wallet_address;
    }

  const propsContractInstance = new web3.eth.Contract(propsTokenContractABI.abi, PropsTokenContractAddress);
  
  
  await propsContractInstance.methods.balanceOf(wallet).call({},blockNumber).then((bal) => {    
    console.log(`Got balance ${bal}`);
  }).catch((error) => {
    console.warn(`Error :${error}`);
  });
}

try {
  main();
} catch (err) {
  console.warn(err);
}
