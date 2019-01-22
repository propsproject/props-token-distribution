const { execSync } = require('child_process').execSync;
const connectionConfig = require('../../truffle');

const networkProvider = process.argv[2];
const jurisdictionContractAddress = process.argv[3];
let networkInUse;
let addressInUse;
let cmd;

if (typeof (networkProvider) === 'undefined') {
  console.log('Must supply networkProvider');
  process.exit(0);
}

if (typeof (jurisdictionContractAddress) === 'undefined') {
  console.log('Must supply jurisdictionContractAddress');
  process.exit(0);
}

async function main() {
  // compile/deploy logic contract
  networkInUse = `${networkProvider}0`;
  addressInUse = connectionConfig.networks[networkInUse].wallet_address;
  cmd = `zos push -v --network ${networkInUse} --from ${addressInUse}`;
  try {
    console.log(`Executing ${cmd}`);
    const cmdOutput = execSync(cmd).toString();
    console.log(`${cmd} returned => ${cmdOutput}`);
  } catch (err) {
    console.warn(err);
  }

  // deploy proxy contract
  networkInUse = `${networkProvider}1`;
  addressInUse = connectionConfig.networks[networkInUse].wallet_address;
  const addressPropsHolder = connectionConfig.networks[`${networkProvider}2`].wallet_address;
  cmd = `zos create PropsToken -v --init initialize --args ${addressPropsHolder},${jurisdictionContractAddress},1 --network ${networkInUse} --from ${addressInUse}`;
  try {
    console.log(`Executing ${cmd}`);
    const cmdOutput = execSync(cmd).toString();
    console.log(`${cmd} returned => ${cmdOutput}`);
  } catch (err) {
    console.warn(err);
  }
}

try {
  main();
} catch (err) {
  console.warn(err);
}
