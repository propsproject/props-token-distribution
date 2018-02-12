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
const hashedTightPacked = (args) => {
  return ethUtil.sha3(Buffer.concat(args));
};

contract('PropsToken', ([
  alice,
  bob,
  charlie,
  damiens,
  owner
]) => {

  before(async () => {
    await advanceBlock()
  })

  beforeEach(async () => {
    this.token = await PropsToken.new({from: owner});
  });

  describe(`When considering pre-paid transfers,`, () => {
    beforeEach(async () => {
      await this.token.mint(alice, 1200, {from: owner});
    });

    describe(`if Charlie performs a transaction T, transfering 100 tokens from Alice to Bob, taking 10 in fees`, () => {
      beforeEach(async () => {
        const nonce = 32;
        const from = alice;
        const to = bob;
        const delegate = charlie;
        const fee = 10;
        const amount = 100;
        const alicePrivateKey = Buffer.from('c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', 'hex');

        const components = [
          Buffer.from('48664c16', 'hex'),
          formattedAddress(this.token.address),
          formattedAddress(to),
          formattedInt(amount),
          formattedInt(fee),
          formattedInt(nonce)
        ];
        const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
        const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
        await this.token.transferPreSigned(
          sig,
          to,
          amount,
          fee,
          nonce
          , {from: charlie}).should.be.fulfilled;
      });

      describe(`it should:`, () => {
        it('decrements Alice balance of 1090', async () => {
          let balance = (await this.token.balanceOf(alice)).toNumber();
          balance.should.be.equal(1090);
        });
        it('increments Bob balance of 100', async () => {
          let balance = (await this.token.balanceOf(bob)).toNumber();
          balance.should.be.equal(100);
        });
        it('increments Charlie balance of 10', async () => {
          let balance = (await this.token.balanceOf(charlie)).toNumber();
          balance.should.be.equal(10);
        });
        it('fails if Damiens tries to replay the same transaction', async () => {
          const nonce = 32;
          const from = alice;
          const to = bob;
          const delegate = charlie;
          const fee = 10;
          const amount = 100;
          const alicePrivateKey = Buffer.from('c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3', 'hex');

          const components = [
            Buffer.from('48664c16', 'hex'),
            formattedAddress(this.token.address),
            formattedAddress(to),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce)
          ];
          const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
          const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
          const tx = await this.token.transferPreSigned(
            sig,
            to,
            amount,
            fee,
            nonce
            , {from: charlie});
          tx.receipt.status.should.be.equal('0x00');
        });
      });
    });
  });
});
