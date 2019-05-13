/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;
const { Contracts, SimpleProject, ZWeb3 } = require('zos-lib');
ZWeb3.initialize(web3.currentProvider)
const PropsToken = Contracts.getFromLocal('PropsToken');

async function main() {
  // web3.setProvider(ganache.provider({ mnemonic: 'asset member awake bring mosquito lab sustain muscle elephant equip someone obvious' }));
  const creatorAddress = web3.eth.accounts[1];
  // const initializerAddress = web3.eth.accounts[2];
  const tokenHolderAddress = web3.eth.accounts[3];
  const myProject = new SimpleProject('PropsToken', { from: creatorAddress });
  if (!global.dontCreateProxy) {
    console.log('Creating an upgradeable instance of PropsToken...');
    try {
      const instance = await myProject.createProxy(PropsToken, { initArgs: [tokenHolderAddress, global.timestamp, creatorAddress] });
      const name = await instance.methods.name().call();
      
      // for (a in instance) {
      //    console.log(`${a}=>${typeof(instance[a])}`);
      // }
      // console.log('------- '+instance._address);
      
      // process.exit(1);
      // console.log(`instance.address=${instance.address}`);
      // process.exit(1);
      return instance;
    } catch (error) {
      console.warn(`error=${error}`);
      process.exit(0);
    }
    return null;
  } else {    
    
    // console.log("web3.version="+JSON.stringify(web3.version));
    // const proxyContractJSON = require('/Users/jretina/Programming/PROPSProject/props-token-distribution/node_modules/zos-lib/build/contracts/ProxyAdmin.json');
    // const propsContractJSON = require('/Users/jretina/Programming/PROPSProject/props-token-distribution/build/contracts/PropsToken.json');
    // const instance = web3.eth.contract(proxyContractJSON.abi, '0x68671ecac0fffDcb0cCbebc67c4cE1b264364417');  
    const execSync = require('child_process').execSync;
    cmd = `zos push --deploy-dependencies --network test`;
  try {
    console.log(`Executing ${cmd}`);
    const cmdOutput = execSync(cmd).toString();
    console.log(`${cmd} returned => ${cmdOutput}`);
  } catch (err) {
    console.warn(err);
  }

  // deploy proxy contract
  let addressPropsHolder;
  networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}1`;
  if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
    providerOwner = connectionConfig.networks[networkInUse].provider();
    web3 = new Web3(providerOwner);
  }
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${connectionConfig.networks[networkInUse].host}:${connectionConfig.networks[networkInUse].port}`));
    const accounts = await web3.eth.getAccounts();
    addressInUse = accounts[1];
    addressPropsHolder = accounts[2];
  } else {
    addressInUse = connectionConfig.networks[networkInUse].wallet_address;
    addressPropsHolder = connectionConfig.networks[`${networkProvider}2`].wallet_address;
  }

  cmd = `zos create PropsToken -v --init initialize --args ${addressPropsHolder},${transferStartTime} --network ${networkInUse} --from ${addressInUse}`;
  try {
    console.log(`Executing ${cmd}`);
    const cmdOutput = execSync(cmd).toString();
    console.log(`${cmd} returned => ${cmdOutput}`);
    process.exit(0);
  } catch (err) {
    console.warn(err);
  }
    const _instance = await PropsToken.at('0xE72DCC16049206B2C6270ae5D81De76D33D8b980')
    
    // const token = artifacts.require("PropsToken");
    // console.log('---------------------');
    // console.log(JSON.stringify(propsContractJSON));
    // console.log('---------------------');
    // const instance = web3.eth.contract(propsContractJSON.abi, '0xE72DCC16049206B2C6270ae5D81De76D33D8b980');  
    const name = await _instance.methods.name().call();
    const controller = await _instance.methods.controller().call();
    // console.log('---------------------');
    console.log('name='+name+", controller="+controller);
    // console.log('---------------------');
    return _instance;
  }

  
}

// For truffle exec
// eslint-disable-next-line func-names
module.exports = function (callback) {
  main().then(() => callback()).catch(err => callback(err));
};


// Testing
module.exports.main = main;
