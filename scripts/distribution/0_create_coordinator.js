const TokenDistributionCoordinator = artifacts.require("./TokenDistributionCoordinator.sol");
const saveConfig = require('./helpers').saveConfig;

module.exports = async() => {
  const luna = "0xff32622d83bbE587d6498f10CC9890EC2CAD28A3";
  const walletAddress = "0x32164db7a8fe14db4953eaf9b307ed2696ec7709";

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