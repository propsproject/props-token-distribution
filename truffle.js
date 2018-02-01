module.exports = {
  networks: {
    test: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 4712388
    },
    production: {
      host: "localhost",
      port: 8545,
      gas: 5000,
      network_id: '*'
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
