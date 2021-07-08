// Must set three networks for each deployed network
// See examples below for rinkeby0,1,2
// 0 - Deployer/Owner of Logic contract, Deployer/Owner of vesting contracts, Deployer/Owner(temp) of TPL contract
// 1 - Deployer/Owner(temp) of Proxy contract
// 2 - Owner(temp) of all props, Handling allocations
// 3 - Valid Validator
const Web3 = require('web3');
const PrivateKeyProvider = require('truffle-privatekey-provider');
const utils = require('./scripts_utils/utils');

// eslint-disable-next-line no-unused-vars
const web3 = new Web3();
module.exports = {
  networks: {
    test: {
      host: 'localhost',
      port: 8545,
      network_id: '5777',      
    },
    
    rinkeby0: {
      provider() {
        if (!process.env.DEVOPS_PK0 || !process.env.DEVOPS_WALLET0) {
          console.log('Must provide environment variable DEVOPS_PK0 and DEVOPS_WALLET0 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK0;
          return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/dac11f4ffdaa4089b7a945654082298a');
        }
        return false;
      },
      network_id: '4',
      wallet_address: process.env.DEVOPS_WALLET0,
      gas: utils.gasLimit('deployJurisdiction'),
      gasPrice: utils.gasPrice(),
    },
    rinkeby1: {
      provider() {
        if (!process.env.DEVOPS_PK1 || !process.env.DEVOPS_WALLET1) {
          console.log('Must provide environment variable DEVOPS_PK1 and DEVOPS_WALLET1 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK1;
          return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/dac11f4ffdaa4089b7a945654082298a');
        }
        return false;
      },
      network_id: '4',
      wallet_address: process.env.DEVOPS_WALLET1,
      gas: utils.gasLimit('deployJurisdiction'),
      gasPrice: utils.gasPrice(),
    },
    rinkeby2: {
      provider() {
        if (!process.env.DEVOPS_PK2 || !process.env.DEVOPS_WALLET2) {
          console.log('Must provide environment variable DEVOPS_PK2 and DEVOPS_WALLET2 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK2;
          return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/dac11f4ffdaa4089b7a945654082298a');
        }
        return false;
      },
      network_id: '4',
      wallet_address: process.env.DEVOPS_WALLET2,
    },
    mainnet0: {
      provider() {
        if (!process.env.DEVOPS_PK0 || !process.env.DEVOPS_WALLET0) {
          console.log('Must provide environment variable DEVOPS_PK0 and DEVOPS_WALLET0 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK0;
          return new PrivateKeyProvider(pk, `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
        }
        return false;
      },
      network_id: '1',
      wallet_address: process.env.DEVOPS_WALLET0,
      gas: utils.gasLimit('deployJurisdiction'),
      gasPrice: utils.gasPrice(),      
    },
    mainnet: {
      provider() {
        if (!process.env.DEVOPS_PK1 || !process.env.DEVOPS_WALLET1) {
          console.log('Must provide environment variable DEVOPS_PK1 and DEVOPS_WALLET1 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK1;
          return new PrivateKeyProvider(pk, `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
        }
        return false;
      },
      network_id: '1',
      wallet_address: process.env.DEVOPS_WALLET1,
      gas: utils.gasLimit('vestingContract'),
      gasPrice: utils.gasPrice(),      
    },
    mainnet1: {
      provider() {
        if (!process.env.DEVOPS_PK1 || !process.env.DEVOPS_WALLET1) {
          console.log('Must provide environment variable DEVOPS_PK1 and DEVOPS_WALLET1 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK1;
          return new PrivateKeyProvider(pk, `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
        }
        return false;
      },
      network_id: '1',
      wallet_address: process.env.DEVOPS_WALLET1,
      gas: utils.gasLimit('vestingContract'),
      gasPrice: utils.gasPrice(),      
    },
    mainnet2: {
      provider() {
        if (!process.env.DEVOPS_PK2 || !process.env.DEVOPS_WALLET2) {
          console.log('Must provide environment variable DEVOPS_PK2 and DEVOPS_WALLET2 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK2;
          return new PrivateKeyProvider(pk, `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
        }
        return false;
      },
      network_id: '1',
      wallet_address: process.env.DEVOPS_WALLET2,
      gas: utils.gasLimit('deployJurisdiction'),
      gasPrice: utils.gasPrice(),      
    },
    poastaging0: {
      provider() {
        if (!process.env.DEVOPS_PK0 || !process.env.DEVOPS_WALLET0) {
          console.log('Must provide environment variable DEVOPS_PK0 and DEVOPS_WALLET0 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK0;
          return new PrivateKeyProvider(pk, 'http://54.145.137.146:8540');
        }
        return false;
      },
      network_id: '8995',
      wallet_address: process.env.DEVOPS_WALLET0,
    },
    poastaging1: {
      provider() {
        if (!process.env.DEVOPS_PK1 || !process.env.DEVOPS_WALLET1) {
          console.log('Must provide environment variable DEVOPS_PK1 and DEVOPS_WALLET1 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK1;
          return new PrivateKeyProvider(pk, 'http://54.145.137.146:8540');
        }
        return false;
      },
      network_id: '8995',
      wallet_address: process.env.DEVOPS_WALLET1,
    },
    poastaging2: {
      provider() {
        if (!process.env.DEVOPS_PK2 || !process.env.DEVOPS_WALLET2) {
          console.log('Must provide environment variable DEVOPS_PK2 and DEVOPS_WALLET2 when running in this network');
          process.exit(1);
        } else {
          const pk = process.env.DEVOPS_PK2;
          return new PrivateKeyProvider(pk, 'http://54.145.137.146:8540');
        }
        return false;
      },
      network_id: '8995',
      wallet_address: process.env.DEVOPS_WALLET2,
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
  },
  compilers: {
    solc: {
      version: '0.5.16',
      optimizer: {
        enabled: false,
        runs: 500,
      },
      evmVersion: 'istanbul',
      settings: {
        optimizer: {
          enabled: false,
          runs: 500,
        },
        evmVersion: 'istanbul',
      }
    },
  },
};
