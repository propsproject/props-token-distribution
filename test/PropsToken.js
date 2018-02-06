const helpers = require('./helpers');
const ethUtil = require('ethereumjs-util')
const should =  helpers.should;
const duration = helpers.duration;
const latestTime = helpers.latestTime;
const BigNumber = helpers.BigNumber;
const timeTravelTo = helpers.timeTravelTo;
const EVMThrow = helpers.EVMThrow;
const ether = helpers.ether;
const buyTokens = helpers.buyTokens;
const advanceBlock = helpers.advanceBlock;

const PropsToken = artifacts.require('./helpers/PropsTokenImpl.sol')

const formattedAddress = (address) => {
  return  Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
};
const formattedInt = (int) => {
  return ethUtil.setLengthLeft(int, 32);
};
const formattedBytes32 = (bytes) => {
  return ethUtil.addHexPrefix(bytes.toString('hex'));
};

contract('PropsToken', ([
  alice,
  bob,
  charlie,
  owner
]) => {

  before(async () => {
    await advanceBlock()
  })

  beforeEach(async () => {
    this.token = await PropsToken.new({from: owner});
  });

  describe('Delegated transfers', () => {
    beforeEach(async () => {
      await this.token.mint(alice, 1500000, {from: owner});
    });

    it('Charlie performs a transfer of 100 tokens from Alice to Bob, taking 10 in fees', async () => {
      const nonce = 32;
      const from = alice;
      const to = bob;
      const delegate = charlie;
      const gasPrice = 1;
      const amount = 100;
      const alicePrivateKey = Buffer.from('c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', 'hex');

      const components = [
        Buffer.from('48664c16', 'hex'),
        formattedAddress(this.token.address),
        formattedAddress(to),
        formattedInt(amount),
        formattedInt(gasPrice),
        formattedInt(nonce)
      ];

      const tightPack = Buffer.concat(components);

      const hashedTightPack = ethUtil.sha3(tightPack);

      const vrs = ethUtil.ecsign(hashedTightPack, alicePrivateKey)
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s)

      const tx = await this.token.transferPreSigned(
        sig,
        to,
        amount,
        gasPrice,
        nonce
        , {from: charlie});

      console.log(tx);
      console.log(tx.logs[3].args);
    });
  });
});


/*
const fee = 10;
const amount = 100;
const token = this.token.address;
const from = alice;
const to = bob;
const delegate = charlie;
const nonce = 32;
const alicePrivateKey = Buffer.from('c88b703fb08cbea894b6aeff5a544fb92e78a18e19814cd85da83b71f772aa6c', 'hex');

const tightPack = (await this.token.delegatedTransferHash.request(token, nonce, from, to, delegate, amount, fee)).params[0].data;
const hashedTightPack = ethUtil.sha3(tightPack);
const sig = ethUtil.ecsign(hashedTightPack, alicePrivateKey)
const tx = await this.token.delegatedTransfer(
  nonce,
  from,
  to,
  amount,
  fee,
  sig.v,
  ethUtil.addHexPrefix(sig.r.toString('hex')),
  ethUtil.addHexPrefix(sig.s.toString('hex')),
  {from: charlie});
*/
