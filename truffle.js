module.exports = {
  networks: {
    test: {
      host: "localhost",
      port: 7545,
      network_id: "*",
      gas: 4712388
    },
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
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
