const csv = require('fast-csv')
const BigNumber = require('bignumber.js');
const helpers = require('./helpers');
const TokenDistributionCoordinator = artifacts.require("./TokenDistributionCoordinator.sol");
const submitMultiSigTransaction = helpers.submitMultiSigTransaction;
const network = helpers.network;
const rateWeiToAttoPROPS = helpers.rateWeiToAttoPROPS;
const duration = helpers.duration;
const loadConfig = helpers.loadConfig;
const saveConfig = helpers.saveConfig;
const awaitEvent = helpers.awaitEvent;

module.exports = async() => {
  const config = loadConfig();

  var count = -1;
  var coordinator = await TokenDistributionCoordinator.at(config.coordinator);

  csv
    .fromPath(`csv/company/${network}.csv`)
    .on("data", async(row) => {

      // Format: address, volume, vesting duration (months), vesting cliff (month),
      // percentage vested. 1st row will be ignored
      count += 1;
      if (count > 0) {
        var allocation = null;

        try {
          allocation = {
            investor: row[0],
            tokenVolume: (new BigNumber(row[1])).mul(new BigNumber(1 * 10 ** 18)),
            vestingDuration: new BigNumber(row[2]),
            vestingCliff: new BigNumber(row[3]),
            percentageVested: new BigNumber(row[4])
          };

          if (web3.isAddress(allocation.investor) && allocation.tokenVolume.greaterThan(0)) {
            const tx = await submitMultiSigTransaction(artifacts, {
              wallet: config.wallet,
              coordinator: config.coordinator,
              transaction: coordinator => coordinator
                .allocateTokensToCompany
                .request(allocation.investor, allocation.tokenVolume, allocation.vestingDuration, allocation.vestingCliff, allocation.percentageVested,),
              from: config.luna
            });

            if (tx.transaction.logs.find(log => log.event === 'Execution')) {

              const log = `Company Allocation for ${allocation.investor} on line #${count}, buying ${allocation.tokenVolume}.`
              console.log(`✔︎ ${log}`);
              config
                .transactions
                .push({payload: tx.payload, log: log});
              saveConfig(config);
            } else {
              console.log(`Error: Execution failed on line #${count}`);
            }
          } else {
            console.log(`Error: invalid investor / volume on line #${count}`);
          }
        } catch (error) {
          console.log(`Error: line #${count} failed with ${error}`);
        }
      }
    });

}
