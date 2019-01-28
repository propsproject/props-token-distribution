/* eslint-disable no-mixed-operators */
/* eslint-disable no-unused-vars */
/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable prefer-destructuring */
global.timestamp = Math.floor(Date.now() / 1000) + 10; // now + 60 seconds to allow for further testing when not allowed
const BigNumber = require('bignumber.js');
const waitUntil = require('async-wait-until');
const main = require('./index.js').main;
const utils = require('../../scripts_utils/utils');

let instance;
contract('main', (_accounts) => {
  before(async () => {
    instance = await main();
  });
  describe('Basic Setup Test', async () => {
    it('Name should be correct', async () => {
      const name = await instance.name();
      assert.equal(name, 'DEV_Token');
    });

    it('Symbol should be correct', async () => {
      const symbol = await instance.symbol();
      assert.equal(symbol, 'DEV_TOKEN');
    });

    it('Decimals is correct', async () => {
      const decimals = await instance.decimals();
      assert.equal(decimals, 18);
    });

    it('Total Supply is correct', async () => {
      const totalSupply = new BigNumber(await instance.totalSupply());
      const expectedTotalSupply = new BigNumber(10 ** 9 * (1 * 10 ** 18));
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
    it('Transfer works', async () => {
      const transferrerBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
      const receiverBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
      const amount = 100000;
      const result = await instance.transfer(web3.eth.accounts[4], web3.toWei(amount), { from: web3.eth.accounts[3] });
      const newTransferrerBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
      const newReceiverBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
      assert.equal(newTransferrerBalance, transferrerBalance - amount);
      assert.equal(newReceiverBalance, receiverBalance + amount);
      const transferLogs = await utils.getEventData(instance, 'Transfer');
      assert.equal(transferLogs[0].args.from, web3.eth.accounts[3]);
      assert.equal(transferLogs[0].args.to, web3.eth.accounts[4]);
      assert.equal(transferLogs[0].args.value, (new BigNumber(web3.toWei(amount)).toString()));
      const transferDetailsLogs = await utils.getEventData(instance, 'TransferDetails');
      assert.equal(transferDetailsLogs[0].args.from, web3.eth.accounts[3]);
      assert.equal(transferDetailsLogs[0].args.to, web3.eth.accounts[4]);
      assert.equal(transferDetailsLogs[0].args.amount, (new BigNumber(web3.toWei(amount)).toString()));
      assert.equal(transferDetailsLogs[0].args.fromBalance, (new BigNumber(web3.toWei(newTransferrerBalance)).toString()));
      assert.equal(transferDetailsLogs[0].args.toBalance, (new BigNumber(web3.toWei(newReceiverBalance)).toString()));
    });
  });

  describe('Timebase transfer logic', async () => {
    it('canTransfer is false with non holder account before transfer start time', async () => {
      const result = await instance.canTransfer(web3.eth.accounts[4]);
      assert.equal(result, false);
    });

    it('canTransfer is true with holder account before transfer start time', async () => {
      const result = await instance.canTransfer(web3.eth.accounts[3]);
      assert.equal(result, true);
    });

    it('canTransfer is true with non holder accoutn after after tranfer start time', async () => {
      // Wait for some async operation to end
      try {
        console.log(`will wait for ${global.timestamp - Math.floor(Date.now() / 1000)} seconds...`);
        const result = await waitUntil(() => {
          const timePassed = global.timestamp - Math.floor(Date.now() / 1000);
          return timePassed < 0;
        }, 90000, 1000);

        // Here are the operations to be done after predicate
        const res = await instance.canTransfer(web3.eth.accounts[4]);
        assert.equal(res, true);
      } catch (error) {
      // Here are the operations to be done if predicate didn't succeed in the timeout
        console.log('Async operation failed: ', error);
      }
      const result = await instance.canTransfer(web3.eth.accounts[3]);
      assert.equal(result, true);
    });
  });


  describe('Sidechain compatible logic', async () => {
    it('Settle works as transfers do with settle event', async () => {
      const transferrerBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
      const receiverBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
      const amount = 100000;
      const result = await instance.settle(web3.eth.accounts[4], web3.toWei(amount), { from: web3.eth.accounts[3] });
      const newTransferrerBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[3])).toNumber();
      const newReceiverBalance = web3.fromWei(await instance.balanceOf(web3.eth.accounts[4])).toNumber();
      assert.equal(newTransferrerBalance, transferrerBalance - amount);
      assert.equal(newReceiverBalance, receiverBalance + amount);
      const transferLogs = await utils.getEventData(instance, 'Transfer');
      assert.equal(transferLogs[0].args.from, web3.eth.accounts[3]);
      assert.equal(transferLogs[0].args.to, web3.eth.accounts[4]);
      assert.equal(transferLogs[0].args.value, (new BigNumber(web3.toWei(amount)).toString()));
      const transferDetailsLogs = await utils.getEventData(instance, 'TransferDetails');
      assert.equal(transferDetailsLogs[0].args.from, web3.eth.accounts[3]);
      assert.equal(transferDetailsLogs[0].args.to, web3.eth.accounts[4]);
      assert.equal(transferDetailsLogs[0].args.amount, (new BigNumber(web3.toWei(amount)).toString()));
      assert.equal(transferDetailsLogs[0].args.fromBalance, (new BigNumber(web3.toWei(newTransferrerBalance)).toString()));
      assert.equal(transferDetailsLogs[0].args.toBalance, (new BigNumber(web3.toWei(newReceiverBalance)).toString()));
      const settleLogs = await utils.getEventData(instance, 'Settlement');
      // console.log(`settleLogs=${JSON.stringify(settleLogs)}`);
      assert.equal(settleLogs[0].args.from, web3.eth.accounts[3]);
      assert.equal(settleLogs[0].args.recipient, web3.eth.accounts[4]);
      assert.equal(settleLogs[0].args.amount, (new BigNumber(web3.toWei(amount)).toString()));
      assert.isAtLeast(settleLogs[0].args.timestamp.toNumber(), global.timestamp);
    });
  });
});
