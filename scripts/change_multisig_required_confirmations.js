
module.exports = async () => {
  var MultiSigWallet = artifacts.require("./wallet/MultiSigWallet.sol");

  const multisig = process.argv[4];
  const required = process.argv[5];
  const from = process.argv[6];

  var wallet = MultiSigWallet.at(multisig);
  var payload = wallet.changeRequirement.request(required).params[0].data;

  await wallet.submitTransaction(wallet.address, 0, payload, { from });

  console.log(`Changing MultiSig Wallet (${multisig}) required confirmations to ${required} (using owner ${from}).`);
}
