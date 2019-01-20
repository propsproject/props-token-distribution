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

// parity --force-ui --chain kovan  --rpcapi "eth,net,web3,personal,parity"
// --unlock "0x0085Fed0C3BA54Ca352C0E81d2BddF0ee5A791fB" --password
// ./password.txt

module.exports = async() => {
  const config = loadConfig();

  var count = -1;
  var coordinator = await TokenDistributionCoordinator.at(config.coordinator);

  csv
    .fromPath(`csv/saft/${network}.csv`)
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

            setTimeout(async() => {
              const submitMultiSigTransaction = helpers.submitMultiSigTransaction;

              try {
                const tx = await submitMultiSigTransaction(artifacts, {
                  wallet: config.wallet,
                  coordinator: config.coordinator,
                  transaction: coordinator => coordinator
                    .allocateTokensToSAFTInvestor
                    .request(allocation.investor, allocation.tokenVolume, allocation.vestingDuration, allocation.vestingCliff, allocation.percentageVested,),
                  from: config.luna
                });

                if (tx.transaction.logs.find(log => log.event === 'Execution')) {

                  const log = `SAFT Allocation for ${allocation.investor} on line #${count}, buying ${allocation.tokenVolume}.`
                  console.log(`✔︎ ${log}`);
                  config
                    .transactions
                    .push({payload: tx.payload, log: log});
                  saveConfig(config);
                } else {
                  console.log(`Error/Warning: #${allocation.investor}, execution failed for investor (line #${count})`);
                }
              } catch (e) {
                console.log(`Error/Warning: #${allocation.investor}, (${e}) (line #${count})`);
              }
            }, count * 2000);

          } else {
            console.log(`Error: invalid investor / volume on line #${count}`);
          }
        } catch (error) {
          console.log(`Error: line #${count} failed with ${error}`);
        }
      }
    });

}
