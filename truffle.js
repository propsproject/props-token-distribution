module.exports = {
  networks: {
    test: {
      host: "localhost",
      port: 9545,
      network_id: "*",
      gas: 4712388
    },
    production: {
      host: "localhost",
      port: 8545,
      gasPrice: 5000000000,
      gas: 3000000,
      network_id: '1'
    },
    development: {
      host: "localhost",
      port: 9545,
      network_id: "4",
      gas: 4e6,
      gasPrice: 2e10
    }
  },
  mocha: {
    ui: "bdd",
    reporter: "mocha-multi",
    reporterOptions: {
      'mocha-osx-reporter': '-',
      'spec': '-'
    }
  }
};
