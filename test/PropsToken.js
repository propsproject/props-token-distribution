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

contract('PropsToken', ([
  _,
  owner,
  attacker,
  alice,
  bob,
  charlie
]) => {

  before(async () => {
    await advanceBlock()
  })

  beforeEach(async () => {
    this.token = await PropsToken.new({from: owner});
  });

  describe('Delegated transfers', () => {
    beforeEach(async () => {
      await this.token.mint(alice, 150, {from: owner});
    });

    it('Charlie performs a transfer of 100 tokens from Alice to Bob, taking 10 in fees', async () => {
      const fee = 10;
      const amount = 100;
      const token = this.token.address;
      const from = alice;
      const to = bob;
      const delegate = charlie;
      const nonce = 32;

      const bufferedAddress = (address) => {
        return  Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
      };
      const bufferedInt = (int) => {
        return ethUtil.setLengthLeft(int, 32);
      };
      const formattedByte32 = (bytes) => {
        return ethUtil.addHexPrefix(bytes.toString('hex'));
      };

      const components = [
        bufferedAddress(delegate),
        bufferedAddress(token),
        bufferedInt(nonce),
        bufferedAddress(from),
        bufferedAddress(to),
        bufferedInt(amount),
        bufferedInt(fee)
      ];

      const tightPack = Buffer.concat(components);

      const hashedTightPack = ethUtil.sha3(tightPack);

      const alicePrivateKey = Buffer.from('c88b703fb08cbea894b6aeff5a544fb92e78a18e19814cd85da83b71f772aa6c', 'hex');

      const sig = ethUtil.ecsign(hashedTightPack, alicePrivateKey)

      const pubkey = ethUtil.ecrecover(hashedTightPack, sig.v, sig.r, sig.s)
      const address = ethUtil.publicToAddress(pubkey)

      const tx = await this.token.delegatedTransfer(
        nonce,
        from,
        to,
        amount,
        fee,
        sig.v,
        formattedByte32(sig.r),
        formattedByte32(sig.s), {from: charlie});

      console.log(tx.logs[0].args);
    });
  });

});
