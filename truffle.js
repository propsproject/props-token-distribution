module.exports = {
  networks: {
    test: {
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
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: "*",      
    }, 
    docker: {
        host: "localhost",
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

