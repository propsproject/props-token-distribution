const TokenDistributionCoordinator = artifacts.require("./TokenDistributionCoordinator.sol");
const saveConfig = require('./helpers').saveConfig;

module.exports = async() => {
  const luna = "0x0085Fed0C3BA54Ca352C0E81d2BddF0ee5A791fB";
  const walletAddress = "0xc3ad6c9c5dd5dc5e3b0f20e71569a5d6e9153280";

  const coordinator = await TokenDistributionCoordinator.new();
  coordinator.transferOwnership(walletAddress);
  saveConfig({coordinator: coordinator.address, wallet: walletAddress, luna: luna, transactions: []});
}
