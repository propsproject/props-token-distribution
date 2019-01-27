/* eslint-disable no-mixed-operators */
/* eslint-disable no-unused-vars */
/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable prefer-destructuring */
global.timestamp = Math.floor(Date.now() / 1000) + 15; // now + 60 seconds to allow for further testing when not allowed
const BigNumber = require('bignumber.js');
const waitUntil = require('async-wait-until');
const main = require('./index.js').main;


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

  describe('Timebase transfer logic', async () => {
    it('canTransfer is false with non holder account before transfer start time', async () => {
      const result = await instance.canTransfer(web3.eth.accounts[4]);
      assert.equal(result, false);
    });

    it('canTransfer is true with holder account before transfer start time', async () => {
      const result = await instance.canTransfer(web3.eth.accounts[3]);
      assert.equal(result, true);
    });
    it('Transfer after time to transfer time had passed works', async () => {
      // Wait for some async operation to end
      try {
        const result = await waitUntil(() => {
          const timePassed = global.timestamp - Math.floor(Date.now() / 1000);
          console.log(`timePassed=${timePassed}`);
          return timePassed < 0;
        }, 90000, 1000);

        // Here are the operations to be done after predicate
        console.log('time passed...');
      } catch (error) {
      // Here are the operations to be done if predicate didn't succeed in the timeout
        console.log('Async operation failed: ', error);
      }
      const result = await instance.canTransfer(web3.eth.accounts[3]);
      assert.equal(result, true);
    });
  });
});
