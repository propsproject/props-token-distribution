// Must set three networks for each deployed network
// See examples below for rinkeby0,1,2
// 0 - Deployer/Owner of Logic contract, Deployer/Owner of vesting contracts, Deployer/Owner(temp) of TPL contract
// 1 - Deployer/Owner(temp) of Proxy contract
// 2 - Owner(temp) of all props, Handling allocations
// 3 - Valid Validator
const Web3 = require('web3');
const PrivateKeyProvider = require('truffle-privatekey-provider');
const fs = require('fs');

const web3 = new Web3();
module.exports = {
  networks: {
    test0: {
      provider() {
        return new web3.providers.HttpProvider('http://localhost:9545');
      },
      network_id: '*',
    },
    test1: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
    },
    test2: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
    },
    testValidator: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
    },
    test: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
    },
    local: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
    },
    production: {
      host: 'localhost',
      port: 9545,
      gasPrice: 5000000000,
      gas: 3000000,
      network_id: '1',
    },
    rinkeby0: {
      provider() {
        const pk = fs.readFileSync('/Users/jretina/DevDevOps-PK0.txt', 'utf8');
        return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/bc1b11176a1e4aa98b607fea38eb4d43');
      },
      network_id: '4',
      wallet_address: '0x5338d6E393bdB6Da8649bCDc6afA27426e71c5C0',
    },
    rinkeby1: {
      provider() {
        const pk = fs.readFileSync('/Users/jretina/DevDevOps-PK1.txt', 'utf8');
        return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/bc1b11176a1e4aa98b607fea38eb4d43');
      },
      network_id: '4',
      wallet_address: '0x87A617cD45D94D2eAb958940d29313F3A7d7dF46',
    },
    rinkeby2: {
      provider() {
        const pk = fs.readFileSync('/Users/jretina/DevDevOps-PK2.txt', 'utf8');
        return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/bc1b11176a1e4aa98b607fea38eb4d43');
      },
      network_id: '4',
      wallet_address: '0xA80a6946f8Af393D422cd6FEee9040C25121a3B8',
    },
    rinkebyValidator: {
      provider() {
        const pk = fs.readFileSync('/Users/jretina/DevValidator-PK.txt', 'utf8');
        return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/bc1b11176a1e4aa98b607fea38eb4d43');
      },
      network_id: '4',
      wallet_address: '0xA80a6946f8Af393D422cd6FEee9040C25121a3B8',
    },
    rinkebydev: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
    docker: {
      host: '127.0.0.1',
      port: 9000,
      network_id: '8000',
    },
  },
  mocha: {
    ui: 'bdd',
    reporter: 'mocha-multi',
    reporterOptions: {
      'mocha-osx-reporter': '-',
      spec: '-',
    },
  },
  solc: {
    version: '0.4.24',
    optimizer: {
      enabled: true,
      runs: 500,
    },
  },
};
