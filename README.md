# Props Token Contracts and Distribution

![Props Token](https://github.com/PROPSProject/props-token-distribution/blob/feature/http/docs/props-logo.png?raw=true)

Props is a cryptocurrency built on top of the [Ethereum][ethereum] blockchain.
For more information visit [Props Project Website](https://propsproject.com/)

## Contracts

Please see the [contracts/](contracts) directory.

## Develop

Contracts are written in [Solidity][solidity] using [ZeppelinOS](https://github.com/zeppelinos/zos) [OpenZeppelin-eth](https://github.com/OpenZeppelin/openzeppelin-eth) and tested using [Truffle][truffle].

### Depenencies

```bash
# Install Zos globally:
$ npm install -g npm install --global zos

# Install local node dependencies:
$ npm install
```
As the ERC20.sol contract has yet to be updated in the openzeppelin-eth version this project uses. After the above had installed replace the file:
node_modules/openzeppelin-eth/contracts/token/ERC20.sol with the contract located at [pending-contracts/openzeppelin-eth-modified](pending-contracts/openzeppelin-eth-modified)

```bash
# Initialize zos and add the relevant contracts
$ zos init
$ zos add PropsToken
$ zos add TokenVesting
```
### Test

```bash
# Compile contracts
zos push -v --network test --from {logic-contract-deployer-address}

# Run contracts test suite
$ npm run test
```

### Deployment and Distribution

Located under [scripts/distribution](scripts/distribution) directory and should be executed in order.

```bash
# Deploy token, and initialize it
$ node scripts/distribution/0_deploy_token.js {test/rinkeby/mainnet} {timestamp-from-which-transfers-are-available}

# Distribute to participants
# If TPL is not used leave tpl-jurisdiction-contract with 0
# CSV file should be built as: 
# Address,Tokens,Vesting Duration,Vesting Cliff,Percentage Vested
# Step should be repeated for every group (csv file)
$ node scripts/distribution/1_allocate_to_{group}.js {test/rinkeby/mainnet} {tpl-jurisdiction-contract} {path-to-csv-file}

# Validate distribution
$ node scripts/distribution/5_validate_distribution.js {test/rinkeby/mainnet} group1,group2,...,groupN

# Finish distrubtion
# The owner of the contract is moved to a designated multisig wallet and so do all props not distributed
# If TPL is not used leave tpl-jurisdiction-contract with 0
$ node scripts/distribution/6_finish_distribution.js {test/rinkeby/mainnet} {tpl-jurisdiction-contract} {multisig-address-remaining-props} {multisig-address-contract-owner}
```
### Contract Upgrades

Located under [scripts/upgrade](scripts/upgrade) directory.
Compile and deploy the new logic contract using ```bash zos push```

```bash
# Send upgrade request to contract multisig
$ node scripts/upgrade/0_upgrade_via_multisig.js {test/rinkeby/mainnet} {multisig-address-contract-owner}
```
Once enough multisig participants accept the upgrade the contract will be upgraded.

### Transaction Permission Layer (TPL)

A version that supports a TPL contract can be found under [pending-contracts/tpl](pending-contracts/tpl)
In order to use TPL you must move the files to the [contracts/](contracts) directory first, deploy and setup using the provided scripts under the  [scripts/tpl](scripts/tpl) directory
Once deployed and setup use the deployed contract address in the token deployment and distribution scripts and modify the following in [scripts-utils/utils.js](scripts-utils/utils.js) to true
```bash
const hasTPLContract = () => false;
```

### Adjusting Gas Price and Gas Limits

Located as gasPrice and gasLimit function in [scripts-utils/utils.js](scripts-utils/utils.js)

[ethereum]: https://www.ethereum.org/

[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/