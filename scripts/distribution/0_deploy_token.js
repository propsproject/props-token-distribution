/* eslint-disable prefer-destructuring */
// eslint-disable-next-line prefer-destructuring
const execSync = require('child_process').execSync;
const Web3 = require('web3');
const connectionConfig = require('../../truffle');

const networkProvider = process.argv[2];
const transferStartTime = process.argv[3];
const minSecondsBetweenDailySubmissions = process.argv[4];
const rewardsStartTimestamp = process.argv[5];
let networkInUse;
let addressInUse;
let cmd;

if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

if (typeof (transferStartTime) === 'undefined') {
  console.log('Must supply transfer start time');
  process.exit(0);
}

if (typeof (minSecondsBetweenDailySubmissions) === 'undefined') {
  console.log('Must supply minSecondsBetweenDailySubmissions');
  process.exit(0);
}

if (typeof (rewardsStartTimestamp) === 'undefined') {
  console.log('Must supply rewardsStartTimestamp');
  process.exit(0);
}

async function main() {
  // compile/deploy logic contract
  let web3;
  let providerOwner;
  networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}0`;
  if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
    providerOwner = connectionConfig.networks[networkInUse].provider();
    web3 = new Web3(providerOwner);
  }
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${connectionConfig.networks[networkInUse].host}:${connectionConfig.networks[networkInUse].port}`));
    const accounts = await web3.eth.getAccounts();
    addressInUse = accounts[0];
  } else {
    addressInUse = connectionConfig.networks[networkInUse].wallet_address;
  }

  cmd = `zos push -v --deploy-dependencies --network ${networkInUse} --from ${addressInUse}`;
  try {
    console.log(`Executing ${cmd}`);
    const cmdOutput = execSync(cmd).toString();
    console.log(`${cmd} returned => ${cmdOutput}`);
  } catch (err) {
    console.warn(err);
  }

  // deploy proxy contract
  let addressPropsHolder;
  networkInUse = networkProvider === 'test' ? networkProvider : `${networkProvider}1`;
  if (typeof connectionConfig.networks[networkInUse].provider === 'function') {
    providerOwner = connectionConfig.networks[networkInUse].provider();
    web3 = new Web3(providerOwner);
  }
  if (typeof (connectionConfig.networks[networkInUse].wallet_address) === 'undefined') {
    web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${connectionConfig.networks[networkInUse].host}:${connectionConfig.networks[networkInUse].port}`));
    const accounts = await web3.eth.getAccounts();
    addressInUse = accounts[1];
    addressPropsHolder = accounts[2];
  } else {
    addressInUse = connectionConfig.networks[networkInUse].wallet_address;
    addressPropsHolder = connectionConfig.networks[`${networkProvider}2`].wallet_address;
  }

  cmd = `zos create PropsToken -v --init initialize --args ${addressPropsHolder},${addressPropsHolder},${minSecondsBetweenDailySubmissions},${rewardsStartTimestamp} --network ${networkInUse} --from ${addressInUse}`;
  try {
    console.log(`Executing ${cmd}`);
    const cmdOutput = execSync(cmd).toString();
    console.log(`${cmd} returned => ${cmdOutput}`);
    process.exit(0);
  } catch (err) {
    console.warn(err);
  }
}

try {
  main();
} catch (err) {
  console.warn(err);
}
