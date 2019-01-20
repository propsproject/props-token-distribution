const TokenDistributionCoordinator = artifacts.require("./TokenDistributionCoordinator.sol");
const saveConfig = require('./helpers').saveConfig;

module.exports = async() => {
  const luna = "0xF483941E3CF2ded6D9eB2b674D53e5a556e03081"; //devops account
  const walletAddress = "0xd9f880f8633cd0b807d2d7bb3ced7488c08237be"; //multisig wallet owning the contract(s)

  const coordinator = await TokenDistributionCoordinator.new({
    from: luna
  });
  coordinator.transferOwnership(walletAddress, {
    from: luna
  });
  saveConfig({
    coordinator: coordinator.address,
    wallet: walletAddress,
    luna: luna,
    transactions: []
  });
}