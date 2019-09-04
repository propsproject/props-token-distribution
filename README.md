# Props Token Contracts and Distribution

![Props Token](./props-logo.png?raw=true)

Props is a cryptocurrency built on top of the [Ethereum][ethereum] blockchain.
For more information visit [Props Project Website](https://propsproject.com/)

## Contracts

Please see the [contracts/](contracts) directory.

## Develop

Contracts are written in [Solidity][solidity] using [ZeppelinOS](https://github.com/zeppelinos/zos) [OpenZeppelin-eth](https://github.com/OpenZeppelin/openzeppelin-eth) and tested using [Truffle][truffle].

### Depenencies

Use node version v8.11.1

```bash
# Install Zos globally:
$ npm install --global zos

# Install Ganache-cli globally:
$ npm install --global ganache-cli@v6.4.1

# Install Truffle globally:
$ npm install --global truffle@v4.1.12

# Install local node dependencies:
$ npm install
```

```bash
# (Only for new project if zos.json does not exist) 
# Initialize zos and add the relevant contracts
$ zos init
$ zos add PropsToken
```
### Test

```bash

# Compile contracts
$ npm run compile

# Run ganache-cli
$ npm run ganache-cli

# Run contracts test suite
$ npm run test
# If fails to bind due to mismatch versions run directly:
$ NODE_ENV=test truffle test ./test/propstoken-0-rewards.test.js --network test
$ NODE_ENV=test truffle test ./test/propstoken-1-main.test.js --network test
```

### [Test Coverage](https://htmlpreview.github.io/?https://raw.githubusercontent.com/propsproject/props-token-distribution/feature/rewards-contracts/coverage/token/index.html)


### Deployment and Distribution

Located under [scripts/distribution](scripts/distribution) directory and should be executed in order.

The following envrionment variables need to be set:
```bash
DEVOPS_PK0={private-key-of-logic-contract-deployer}
DEVOPS_WALLET0={wallet-of-logic-contract-deployer}
DEVOPS_PK1={private-key-of-proxy-contract-deployer-temp-owner}
DEVOPS_WALLET1={wallet-of-proxy-contract-deployer-temp-owner}
DEVOPS_PK2={private-key-of-temp-props-holder-until-distribution-finishes}
DEVOPS_WALLET2={wallet-of-temp-props-holder-until-distribution-finishes}
# For mainnet also 
INFURA_KEY={infura-key-of-mainnet-account}
```

```bash
# Deploy token, and initialize it
$ node scripts/distribution/0_deploy_token.js {test/rinkeby/mainnet} 0 {secondsInDay} {rewardsBeginTimestamp}

# Distribute to participants
# CSV file should be built as: 
# Address,Tokens,Vesting Duration,Vesting Cliff,Percentage Vested
# Step should be repeated for every group (csv file)
# CSV File format (// wallet address,tokens,vesting duration,vesting cliff,vesting percentage,type,name,email address,first name,invested amount,invested discount)
$ node scripts/distribution/1_allocate.js {test/rinkeby/mainnet} {path-to-csv-file}

# Validate distribution
$ node scripts/distribution/5_validate_distribution.js {test/rinkeby/mainnet} group1,group2,...,groupN

# Finish distrubtion
# The owner of the contract is moved to a designated multisig wallet and so do all props not distributed
$ node scripts/distribution/3_finish_distribution.js {test/rinkeby/mainnet} {multisig-address-remaining-props} {multisig-address-contract-owner}
```
### Contract Upgrades

Located under [scripts/upgrade](scripts/upgrade) directory.
Compile and deploy the new logic contract using ```bash zos push```

```bash
# Send upgrade request to contract multisig
$ node scripts/upgrade/0_upgrade_via_multisig.js {test/rinkeby/mainnet} {multisig-address-contract-owner}
```
Once enough multisig participants accept the upgrade the contract will be upgraded.

### Rewards Contract Setup

Located under [scripts/setup](scripts/setup) directory.
Should be run from the controller or if controller is a multisig wallet as one of the participants in the multisig wallet.

## setValidators
Only after each validator has set themselves up using updateEntity method of the contract manually or by using [props-ethsync:setup-validator](https://github.com/propsproject/props-ethsync#validator-setup)
```bash
# Setting the active validators for next day using a multisig wallet (use multisig-wallet-address = none if the account running is the controller)
$ node scripts/setup/0_set_validators.js {test/rinkeby/mainnet} {multisig-wallet-address} {validator1},{validator2},{validator3} {contract-address}
```
Once enough multisig participants accept the transactions the contract will be updated with new set of validators (per contract logic).

## setApplications
Only after each application has set themselves up using updateEntity method of the contract manually or by using [props-ethsync:setup-application](https://github.com/propsproject/props-ethsync/blob/master/lib/services/application_setup.ts)
```bash
# Setting the active applications for next day using a multisig wallet (use multisig-wallet-address = none if the account running is the controller)
$ node scripts/setup/1_set_applications.js {test/rinkeby/mainnet} {multisig-wallet-address} {application1},{application2},{application3} {contract-address}
```
Once enough multisig participants accept the transactions the contract will be updated with new set of applications (per contract logic).


### Adjusting Gas Price and Gas Limits

Located as gasPrice and gasLimit function in [scripts-utils/utils.js](scripts-utils/utils.js)

[ethereum]: https://www.ethereum.org/

[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
