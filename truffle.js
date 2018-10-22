module.exports = {
  networks: {
    test: {
      host: "0.0.0.0",
      port: 8545,
      network_id: "4000"
    },
    production: {
      host: "localhost",
      port: 8545,
      gasPrice: 5000000000,
      gas: 3000000,
      network_id: '1'
    },
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: "*"
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
  }
};

