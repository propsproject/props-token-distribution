# Props Token Contracts and Distribution

![Props Token](./props-logo.png?raw=true)

Props is a cryptocurrency built on top of the [Ethereum][ethereum] blockchain.
For more information visit [Props Project Website](https://propsproject.com/)

## Contracts

Please see the [contracts/](contracts) directory.

## Develop

Contracts are written in [Solidity][solidity] using [ZeppelinOS](https://github.com/zeppelinos/zos) [OpenZeppelin-eth](https://github.com/OpenZeppelin/openzeppelin-eth) and tested using [Truffle][truffle].

### Depenencies

```bash
# Install Zos globally:
$ npm install --global zos

# Install Zos globally:
$ npm install --global ganache-cli

# Install local node dependencies:
$ npm install
```

```bash
# Initialize zos and add the relevant contracts
$ zos init
$ zos add PropsToken
$ zos add TokenVesting
```
### Test

```bash
# Run contracts test suite
$ npm run test
```

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

```

```bash
# Deploy token, and initialize it
$ node scripts/distribution/0_deploy_token.js {test/rinkeby/mainnet} {timestamp-from-which-transfers-are-available}

# Distribute to participants
# CSV file should be built as: 
# Address,Tokens,Vesting Duration,Vesting Cliff,Percentage Vested
# Step should be repeated for every group (csv file)
$ node scripts/distribution/1_allocate_to_{group}.js {test/rinkeby/mainnet} {path-to-csv-file}

# Validate distribution
$ node scripts/distribution/5_validate_distribution.js {test/rinkeby/mainnet} group1,group2,...,groupN

# Finish distrubtion
# The owner of the contract is moved to a designated multisig wallet and so do all props not distributed
$ node scripts/distribution/6_finish_distribution.js {test/rinkeby/mainnet} {multisig-address-remaining-props} {multisig-address-contract-owner}
```
### Contract Upgrades

Located under [scripts/upgrade](scripts/upgrade) directory.
Compile and deploy the new logic contract using ```bash zos push```

```bash
# Send upgrade request to contract multisig
$ node scripts/upgrade/0_upgrade_via_multisig.js {test/rinkeby/mainnet} {multisig-address-contract-owner}
```
Once enough multisig participants accept the upgrade the contract will be upgraded.

### Adjusting Gas Price and Gas Limits

Located as gasPrice and gasLimit function in [scripts-utils/utils.js](scripts-utils/utils.js)

[ethereum]: https://www.ethereum.org/

[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
