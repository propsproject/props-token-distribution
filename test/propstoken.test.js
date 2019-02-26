/* eslint-disable no-mixed-operators */
/* eslint-disable no-unused-vars */
/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable prefer-destructuring */
global.timestamp = Math.floor(Date.now() / 1000) + 10; // now + 60 seconds to allow for further testing when not allowed
const BigNumber = require('bignumber.js');
const waitUntil = require('async-wait-until');
const ethUtil = require('ethereumjs-util');
const main = require('../scripts/tests/index.js').main;
const utils = require('../scripts_utils/utils');

const formattedAddress = address => Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
const formattedInt = int => ethUtil.setLengthLeft(int, 32);
const formattedBytes32 = bytes => ethUtil.addHexPrefix(bytes.toString('hex'));
const hashedTightPacked = args => ethUtil.sha3(Buffer.concat(args));


let instance;
contract('main', (_accounts) => {
  before(async () => {
    instance = await main();
  });

  describe('Basic Setup Test', async () => {    
    it('Name should be correct', async () => {
      const name = await instance.name();
      assert.equal(name, 'PROPS_Token');
    });

    it('Symbol should be correct', async () => {
      const symbol = await instance.symbol();
      assert.equal(symbol, 'PROPS_TOKEN');
    });

    it('Decimals is correct', async () => {
      const decimals = await instance.decimals();
      assert.equal(decimals, 18);
    });

    it('Total Supply is correct', async () => {
      const totalSupply = new BigNumber(await instance.totalSupply());
      const expectedTotalSupply = new BigNumber(0.6 * (10 ** 9) * (1 * 10 ** 18));
      // console.log(`totalSupply=${totalSupply.toString()} expectedTotalSupply=${expectedTotalSupply.toString()}`);
      const isEqual = totalSupply.isEqualTo(expectedTotalSupply);
      assert.equal(isEqual, true);
    });

    it('Total Supply owned by tokenHolder', async () => {
      const totalSupply = new BigNumber(await instance.totalSupply());
      const tokenHolderBalance = await instance.balanceOf(web3.eth.accounts[3]);
      const isEqual = totalSupply.isEqualTo(tokenHolderBalance);
      assert.equal(isEqual, true);
    });

    it('Transfer start time is correct', async () => {
      const transferStartTime = await instance.transfersStartTime();
      assert.equal(transferStartTime, global.timestamp);
    });

    it('Transfer start time exception address is correct', async () => {
      const canTransferExceptionAddress = await instance.canTransferBeforeStartTime();
      assert.equal(canTransferExceptionAddress, web3.eth.accounts[3]);
    });
  });

  describe('ERC20 Tests', async () => {
    const amount = 100000;
    let newTransferrerBalance;
    let newReceiverBalance;
    it('Transfer works', async () => {
      const transferrerBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
      const receiverBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
      const result = await instance.transfer(web3.eth.accounts[4], web3.toWei(amount), { from: web3.eth.accounts[3] });
      newTransferrerBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
      newReceiverBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
      assert.equal(newTransferrerBalance, transferrerBalance - amount);
      assert.equal(newReceiverBalance, receiverBalance + amount);
    });

    it('Transfer Event Emitted', async () => {
      const transferLogs = await utils.getEventData(instance, 'Transfer');
      assert.equal(transferLogs[0].args.from, web3.eth.accounts[3]);
      assert.equal(transferLogs[0].args.to, web3.eth.accounts[4]);
      assert.equal(transferLogs[0].args.value, (new BigNumber(web3.toWei(amount)).toString()));
    });
  });

  describe('Timebase transfer logic', async () => {
    let newAccount3Balance;
    let newAccount4Balance;
    it('transfer fails if non holder account before transfer start time', async () => {
      const amount = 10;
      try {
        expect(await instance.transfer(web3.eth.accounts[3], web3.toWei(amount), { from: web3.eth.accounts[4] })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });

    it('transfer succeeds with holder account before transfer start time', async () => {
      const amount = 10;
      const account3Balance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
      const account4Balance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
      const result = await instance.transfer(web3.eth.accounts[4], web3.toWei(amount), { from: web3.eth.accounts[3] });
      newAccount3Balance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
      newAccount4Balance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
      assert.equal(newAccount3Balance, account3Balance - amount);
      assert.equal(newAccount4Balance, account4Balance + amount);
    });

    it('transfer succeeds with non holder accoutn after after tranfer start time', async () => {
      // Wait for some async operation to end
      try {
        console.log(`will wait for ${global.timestamp - Math.floor(Date.now() / 1000)} seconds...`);
        const result = await waitUntil(() => {
          const timePassed = global.timestamp - Math.floor(Date.now() / 1000);
          return timePassed < 0;
        }, 90000, 1000);

        // Here are the operations to be done after predicate
        const amount = 10;
        const account3Balance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
        const account4Balance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();        
        const res = await instance.transfer(web3.eth.accounts[3], web3.toWei(amount), { from: web3.eth.accounts[4] });
        newAccount3Balance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
        newAccount4Balance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
        assert.equal(newAccount3Balance, account3Balance + amount);
        assert.equal(newAccount4Balance, account4Balance - amount);
      } catch (error) {
      // Here are the operations to be done if predicate didn't succeed in the timeout
        console.log('Async operation failed: ', error);
      }
    });
  });

  const alice = { address: '0x1c77BCe3fAc2d7023aB3f9A6369c100FB8B6c7B5', pk: 'c79b0f20fac88d078d1ab0908fcafb31708e83a46fabfe7601d5b0d7bd5b2974' };
  const bob = { address: web3.eth.accounts[8], pk: 'f34381274ac5cca8a465209bdeafeed0274ddcf7ba1df080df772b73ccad032a' };
  const charlie = { address: web3.eth.accounts[9], pk: '5027f6ea1ab6cd9fe2bc5c2bbb07d5ec77524529964aafe0d02a76aabaa4917f' };
  const damien = { address: web3.eth.accounts[7], pk: 'c79b0f20fac88d078d1ab0908fcafb31708e83a46fabfe7601d5b0d7bd5b2974' };
  const to = bob.address;
  const delegate = charlie.address;
  const fee = 10;
  const amount = 100;
  const propsInWallet = 5000;
  const alicePrivateKey = Buffer.from(alice.pk, 'hex');
  let components;
  let nonce;
  describe('ERC865 compatible logic', async () => {
    it('Charlie transfers 100 tokens from Alice to Bob (fee=10)', async () => {
      // give alice some props
      await instance.transfer(alice.address, propsInWallet, { from: web3.eth.accounts[3] });
      // nonce = await web3.eth.getTransactionCount(alice.address);
      nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

      components = [
        Buffer.from('0d98dcb1', 'hex'),
        formattedAddress(instance.address),
        formattedAddress(to),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce),
      ];

      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
      // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
      await instance.transferPreSigned(
        sig,
        to,
        amount,
        fee,
        nonce,
        { from: charlie.address },
      );

      aliceBalance = await instance.balanceOf(alice.address);
      bobBalance = await instance.balanceOf(bob.address);
      charlieBalance = await instance.balanceOf(charlie.address);
      // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
      assert.equal(aliceBalance.toNumber(), propsInWallet - (amount + fee));
      assert.equal(bobBalance.toNumber(), amount);
      assert.equal(charlieBalance.toNumber(), fee);
    });

    it('Damien tries to replay transfer and fails', async () => {
      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
      try {
        const tx = await instance.transferPreSigned(
          sig,
          to,
          amount,
          fee,
          nonce,
          { from: charlie.address },
        );
        assert.equal(tx.receipt.status, '0x00');
      } catch (error) {
        // console.log(`error:${error}`);
      }
    });

    it('Charlie approves Damien to spend 100 tokens on behalf of Alice to Bob (fee=10)', async () => {
      // give alice some props
      // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
      const oldAliceBalance = aliceBalance;
      const oldCharlieBalance = charlieBalance;
      // nonce = await web3.eth.getTransactionCount(alice.address);
      nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

      components = [
        Buffer.from('79250dcf', 'hex'),
        formattedAddress(instance.address),
        formattedAddress(damien.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce),
      ];

      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
      // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
      await instance.approvePreSigned(
        sig,
        damien.address,
        amount,
        fee,
        nonce,
        { from: charlie.address },
      );

      aliceBalance = await instance.balanceOf(alice.address);
      charlieBalance = await instance.balanceOf(charlie.address);
      // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
      assert.equal(aliceBalance.toNumber(), oldAliceBalance.toNumber() - fee);
      assert.equal(charlieBalance.toNumber(), oldCharlieBalance.toNumber() + fee);
    });

    it('Damien transfers half of approved tokens from Alice to Bob', async () => {
      const oldAliceBalance = aliceBalance;
      const oldBobBalance = bobBalance;
      await instance.transferFrom(alice.address, bob.address, amount / 2, { from: damien.address });
      aliceBalance = await instance.balanceOf(alice.address);
      bobBalance = await instance.balanceOf(bob.address);
      assert.equal(aliceBalance.toNumber(), oldAliceBalance.toNumber() - (amount / 2));
      assert.equal(bobBalance.toNumber(), oldBobBalance.toNumber() + (amount / 2));      
    });

    it('Charlie performs transferFrom of 50 tokens on behalf of damien from Alice to Bob (fee=10)', async () => {
      // nonce = await web3.eth.getTransactionCount(alice.address);
      const oldAliceBalance = aliceBalance;
      const oldBobBalance = bobBalance;
      const oldCharlieBalance = charlieBalance;
      const oldDamienBalance = await instance.balanceOf(damien.address);
      nonce = await web3.eth.getTransactionCount(web3.eth.accounts[7]);      
      components = [
        Buffer.from('a70c41b4', 'hex'),
        formattedAddress(instance.address),
        formattedAddress(alice.address),
        formattedAddress(bob.address),
        formattedInt(amount / 2),
        formattedInt(fee),
        formattedInt(nonce),
      ];
      // console.log(`components instance.address=${instance.address}, alice.address=${alice.address}, `)
      const vrs = ethUtil.ecsign(hashedTightPacked(components), Buffer.from(damien.pk, 'hex'));
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
      await instance.transferFromPreSigned(
        sig,
        alice.address,
        bob.address,
        amount / 2,
        fee,
        nonce,
        { from: charlie.address },
      );

      aliceBalance = await instance.balanceOf(alice.address);
      bobBalance = await instance.balanceOf(bob.address);
      charlieBalance = await instance.balanceOf(charlie.address);
      damienBalance = await instance.balanceOf(damien.address);

      assert.equal(aliceBalance.toNumber(), oldAliceBalance.toNumber() - ((amount / 2) + fee));
      assert.equal(bobBalance.toNumber(), oldBobBalance.toNumber() + (amount / 2));
      assert.equal(charlieBalance.toNumber(), oldCharlieBalance.toNumber() + fee);
    });

    it('Charlie increase allowance of Damien to spend 100 tokens on behalf of Alice to Bob (fee=10)', async () => {
      // give alice some props
      // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
      const oldAliceBalance = aliceBalance;
      const oldCharlieBalance = charlieBalance;
      // nonce = await web3.eth.getTransactionCount(alice.address);
      nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

      components = [
        Buffer.from('138e8da1', 'hex'),
        formattedAddress(instance.address),
        formattedAddress(damien.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce),
      ];

      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
      // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
      await instance.increaseAllowancePreSigned(
        sig,
        damien.address,
        amount,
        fee,
        nonce,
        { from: charlie.address },
      );

      aliceBalance = await instance.balanceOf(alice.address);
      charlieBalance = await instance.balanceOf(charlie.address);
      // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
      assert.equal(aliceBalance.toNumber(), oldAliceBalance.toNumber() - fee);
      assert.equal(charlieBalance.toNumber(), oldCharlieBalance.toNumber() + fee);
      const allowance = await instance.allowance(alice.address, damien.address);
      assert.equal(allowance.toNumber(), amount);
    });

    it('Charlie decreases allowance of Damien to spend 50 tokens on behalf of Alice to Bob (fee=10)', async () => {
      // give alice some props
      // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
      const oldAliceBalance = aliceBalance;
      const oldCharlieBalance = charlieBalance;
      // nonce = await web3.eth.getTransactionCount(alice.address);
      nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

      components = [
        Buffer.from('5229c56f', 'hex'),
        formattedAddress(instance.address),
        formattedAddress(damien.address),
        formattedInt(amount / 2),
        formattedInt(fee),
        formattedInt(nonce),
      ];

      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
      // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
      await instance.decreaseAllowancePreSigned(
        sig,
        damien.address,
        amount / 2,
        fee,
        nonce,
        { from: charlie.address },
      );

      aliceBalance = await instance.balanceOf(alice.address);
      charlieBalance = await instance.balanceOf(charlie.address);
      // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
      assert.equal(aliceBalance.toNumber(), oldAliceBalance.toNumber() - fee);
      assert.equal(charlieBalance.toNumber(), oldCharlieBalance.toNumber() + fee);
      const allowance = await instance.allowance(alice.address, damien.address);
      assert.equal(allowance.toNumber(), amount / 2);
    });

    it('Charlie decreases allowance of Damien by 100 when only 50 are allowed is rejected', async () => {
      // give alice some props
      // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
      const oldAliceBalance = aliceBalance;
      const oldCharlieBalance = charlieBalance;
      // nonce = await web3.eth.getTransactionCount(alice.address);
      nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

      components = [
        Buffer.from('5229c56f', 'hex'),
        formattedAddress(instance.address),
        formattedAddress(damien.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce),
      ];

      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
      // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
      try {
        expect(await instance.decreaseAllowancePreSigned(
          sig,
          damien.address,
          amount,
          fee,
          nonce,
          { from: charlie.address },
        )).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });
  });
});
