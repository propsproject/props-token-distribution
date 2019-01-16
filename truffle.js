var PrivateKeyProvider = require("truffle-privatekey-provider");
var fs = require('fs');

module.exports = {
  networks: {
    test: {
      host: "localhost",
      port: 9545,
      network_id: "*"
    },
    local: {
      host: "localhost",
      port: 9545,
      network_id: "*"
    },
    production: {
      host: "localhost",
      port: 9545,
      gasPrice: 5000000000,
      gas: 3000000,
      network_id: '1'
    },
    rinkeby0: {
      provider: function() {
        const pk = fs.readFileSync('/Users/jretina/DevDevOps-PK0.txt','utf8');
        return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/bc1b11176a1e4aa98b607fea38eb4d43');
      },
      network_id: "4",      
    }, 
    rinkeby1: {
      provider: function() {
        const pk = fs.readFileSync('/Users/jretina/DevDevOps-PK1.txt','utf8');
        return new PrivateKeyProvider(pk, 'https://rinkeby.infura.io/v3/bc1b11176a1e4aa98b607fea38eb4d43');
      },
      network_id: "4",      
    }, 
    rinkebydev: {
      host: "localhost",
      port: 8545,
      network_id: "*",      
    }, 
    docker: {
        host: "127.0.0.1",
        port: 9000,
        network_id: "8000"
    }
  },
  mocha: {
    ui: "bdd",
    reporter: "mocha-multi",
    reporterOptions: {
      'mocha-osx-reporter': '-',
      'spec': '-'
    }
  },
  solc: {
    version: "0.4.24",
    optimizer: {
      enabled: true,
      runs: 500
    }
  }
};

