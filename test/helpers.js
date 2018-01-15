// @flow

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

// type RPCParams = {
//   method: string,
//   params?: Array<mixed>
// }

// function rpcCall (call: RPCParams) {
//   const payload: any = Object.assign({}, {
//     jsonrpc: '2.0',
//     id: Date.now()
//   }, call)
//
//   return new Promise((resolve, reject) => {
//     web3.currentProvider.sendAsync(payload, (err, res) => {
//       return err ? reject(err) : resolve(res)
//     })
//   })
// }

var advanceBlock = function() {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: Date.now(),
    }, (err, res) => {
      return err ? reject(err) : resolve(res)
    })
  })
}

// Advances the block number so that the last mined block is `number`.
var advanceToBlock = async function(number) {
  if (web3.eth.blockNumber > number) {
    throw Error(`block number ${number} is in the past (current is ${web3.eth.blockNumber})`)
  }

  while (web3.eth.blockNumber < number) {
    await advanceBlock()
  }
}

const latestTime = function() {
  return web3.eth.getBlock('latest').timestamp;
}

// Increases testrpc time by the passed duration in seconds
var increaseTime = function(duration) {
  const id = Date.now()

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [duration],
      id: id,
    }, err1 => {
      if (err1) return reject(err1)

      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id+1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res)
      })
    })
  })
}

/**
 * Beware that due to the need of calling two separate testrpc methods and rpc calls overhead
 * it's hard to increase time precisely to a target point so design your test to tolerate
 * small fluctuations from time to time.
 *
 * @param target time in seconds
 */
 var timeTravelTo = function(target) {
  let now = latestTime();
  if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
  let diff = target - now;
  return increaseTime(diff);
}

const duration = {
    seconds: function(val) { return val},
    minutes: function(val) { return val * this.seconds(60) },
    hours:   function(val) { return val * this.minutes(60) },
    days:    function(val) { return val * this.hours(24) },
    weeks:   function(val) { return val * this.days(7) },
    years:   function(val) { return val * this.days(365)}
}

const ether = function ether(n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'))
}

const EVMThrow = 'invalid opcode'

const assertJump = function(error) {
  assert.isAbove(error.message.search('invalid opcode'), -1, 'Invalid opcode error must be returned');
}

const awaitEvent = function(event, handler) {
  return new Promise((resolve, reject) => {
    function wrappedHandler(...args) {
      Promise.resolve(handler(...args)).then(resolve).catch(reject);
    }

    event.watch(wrappedHandler);
  });
}

const buyTokens = function(crowdsale, user, amount) {
  return crowdsale.buyTokens(
    user,
    {
      value: ether(amount),
      from: user
    }
  );
}

exports.increaseTime = increaseTime;
exports.timeTravelTo = timeTravelTo;
exports.duration = duration;
exports.latestTime = latestTime;
exports.ether = ether;
exports.advanceBlock = advanceBlock;
exports.advanceToBlock = advanceToBlock;
exports.awaitEvent = awaitEvent;
exports.should = should;
exports.BigNumber = BigNumber
exports.EVMThrow = EVMThrow;
exports.assertJump = assertJump;
exports.buyTokens = buyTokens;
