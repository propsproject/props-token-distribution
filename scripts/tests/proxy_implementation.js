const Web3 = require('web3');
// const BigNumber = require('bignumber.js');
const fs = require('fs');
// eslint-disable-next-line prefer-destructuring
const proxyContractABI = require('zos-lib/build/contracts/AdminUpgradeabilityProxy.json');
const propsContractABI = require('../../build/contracts/PropsToken.json');
const connectionConfig = require('../../truffle');

const networkProvider = process.argv[2];
let networkInUse;
let web3;

if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

const zosData = JSON.parse(fs.readFileSync(`zos.${networkProvider}.json`, 'utf8'));
const PropsTokenContractAddress = zosData.proxies['PropsToken/PropsToken'][0].address;

async function main() {
  // instantiate multisig wallet
  networkInUse = `${networkProvider}0`;
  const providerDevOps1 = connectionConfig.networks[networkInUse].provider();
  web3 = new Web3(providerDevOps1);  
  const propsContractInstance = new web3.eth.Contract(proxyContractABI.abi, PropsTokenContractAddress);
  // await propsContractInstance.methods.balanceOf('0xA80a6946f8Af393D422cd6FEee9040C25121a3B8')
  //   .call()
  //   .then((val) => {
  //     console.log(`val:${val}`);
  //     process.exit(0);
  //   });

  console.log(await propsContractInstance.methods.admin().call());
    // .call()
    // .then((val) => {
    //   console.log(`Current implementation is:${val}`);
    //   process.exit(0);
    // });
}

try {
  main();
} catch (err) {
  console.warn(err);
}
