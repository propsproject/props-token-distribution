/*
------------------------------------------------------------------
This file tests the following propstoken contract functionalities:
1. Application Management
2. Validator Management
3. Parameter Management
4. Rewards Standard Case
5. Rewards Late Validator Case
------------------------------------------------------------------
*/
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
global.dontCreateProxy = true;
let newControllerAddress;
let txRes;
let instance;
const now = Math.floor(Date.now()/1000);
const dailyTimestamp1 = now - (now % 86400) + 86400; //today
const dailyTimestamp2 = dailyTimestamp1 + (86400); //tomorrow
const dailyTimestamp3 = dailyTimestamp1 - (86400); //yesterday
const application1 = {
  account: web3.eth.accounts[11],
  name: "application1",
  rewardsAddress: web3.eth.accounts[12],
  sidechainAddress: web3.eth.accounts[13],
  updatedName: "application1-update"
}

const application2 = {
  account: web3.eth.accounts[14],
  name: "application2",
  rewardsAddress: web3.eth.accounts[15],
  sidechainAddress: web3.eth.accounts[16],
}        

const application3 = {
  account: web3.eth.accounts[17],
  name: "application3",
  rewardsAddress: web3.eth.accounts[18],
  sidechainAddress: web3.eth.accounts[19],
}

const application4 = {
  account: web3.eth.accounts[20],
  name: "application4",
  rewardsAddress: web3.eth.accounts[21],
  sidechainAddress: web3.eth.accounts[22],
}

const application5 = {
  account: web3.eth.accounts[23],
  name: "application5",
  rewardsAddress: web3.eth.accounts[24],
  sidechainAddress: web3.eth.accounts[25],
}

const validator1 = {
  account: web3.eth.accounts[30],
  name: "validator1",
  rewardsAddress: web3.eth.accounts[31],
  sidechainAddress: web3.eth.accounts[32],
  updatedName: "validator1-update"
}

const validator2 = {
  account: web3.eth.accounts[33],
  name: "validator2",
  rewardsAddress: web3.eth.accounts[34],
  sidechainAddress: web3.eth.accounts[35],
}        

const validator3 = {
  account: web3.eth.accounts[36],
  name: "validator3",
  rewardsAddress: web3.eth.accounts[37],
  sidechainAddress: web3.eth.accounts[38],
}

const validator4 = {
  account: web3.eth.accounts[39],
  name: "validator4",
  rewardsAddress: web3.eth.accounts[40],
  sidechainAddress: web3.eth.accounts[41],
}

const validator5 = {
  account: web3.eth.accounts[42],
  name: "validator5",
  rewardsAddress: web3.eth.accounts[43],
  sidechainAddress: web3.eth.accounts[44],
}


contract('main', (_accounts) => {
  before(async () => {
    instance = await main();
  });

  describe('Initialization values are correct and generic controller function', async () => {    
    const controllerAddress = web3.eth.accounts[2];
    newControllerAddress = web3.eth.accounts[4];    
    it('Controller is properly set', async () => {      
      const currentController = await instance.methods.controller().call();
      assert.equal(currentController.toLowerCase(), controllerAddress.toLowerCase());
    });
    it('Controller can be changed by controller', async () => {
      txRes = await instance.methods.updateController(newControllerAddress).send({ from: controllerAddress });
      const currentController = await instance.methods.controller().call();
      assert.equal(currentController.toLowerCase(), newControllerAddress.toLowerCase());
    });
    it('ControllerUpdated Event Emitted', async () => {
      assert.equal(String(txRes.events['ControllerUpdated'].returnValues['0']).toLowerCase(),String(newControllerAddress).toLowerCase());      
    });
    it('Controller cannot be changed by non controller', async () => {
      try {
        expect(await instance.methods.updateController(controllerAddress).send({ from: controllerAddress })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });    
    it('Max Supply is properly set', async () => {      
      const maxSupply = await instance.methods.maxTotalSupply().call();      
      assert.equal(String(maxSupply), "1000000000000000000000000000");
    });
    // enum ParameterName { ApplicationRewardsPercent, ApplicationRewardsMaxVariationPercent, ValidatorMajorityPercent, ValidatorRewardsPercent}
    it('Parameter ApplicationRewardsPercent is properly set', async () => {          
      const value = await instance.methods.getParameter(0, dailyTimestamp1).call();      
      assert.equal(value, 34750); //pphm
    });
    it('Parameter ApplicationRewardsMaxVariationPercent is properly set', async () => {      
      const value = await instance.methods.getParameter(1, dailyTimestamp1).call();      
      assert.equal(value, 150000000); //pphm
    });
    it('Parameter ValidatorMajorityPercent is properly set', async () => {      
      const value = await instance.methods.getParameter(2, dailyTimestamp1).call();      
      assert.equal(value, 50000000); //pphm
    });
    it('Parameter ValidatorRewardsPercent is properly set', async () => {      
      const value = await instance.methods.getParameter(3, dailyTimestamp1).call();      
      assert.equal(value, 1829); //pphm
    });
  });

  describe('Parameter Management Tests', async () => {        
    // enum ParameterName { ApplicationRewardsPercent, ApplicationRewardsMaxVariationPercent, ValidatorMajorityPercent, ValidatorRewardsPercent}
    it('Can update a parameter value and read both values', async () => {  
      txRes = await instance.methods.updateParameter(3, 1830, dailyTimestamp2).send({ from: newControllerAddress });    
      let value = await instance.methods.getParameter(3, dailyTimestamp1).call();      
      assert.equal(value, 1829); //pphm
      value = await instance.methods.getParameter(3, dailyTimestamp2).call();      
      assert.equal(value, 1830); //pphm      
    });
    it('ParameterUpdated event was emitted', async () => {  
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['0']).toLowerCase(),String('3'));
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['1']).toLowerCase(),String('1830').toLowerCase());
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['2']).toLowerCase(),String('1829').toLowerCase());
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['3']).toLowerCase(),String(dailyTimestamp2).toLowerCase());

    });
    it('Updating a parameter before the previous update took place', async () => {  
      await instance.methods.updateParameter(0, 34752, dailyTimestamp2).send({ from: newControllerAddress });    
      let value = await instance.methods.getParameter(0, dailyTimestamp1).call();      
      assert.equal(value, 34750); //pphm
      value = await instance.methods.getParameter(0, dailyTimestamp2).call();      
      assert.equal(value, 34752); //pphm      
    });    
  });
  describe('Application Management Tests', async () => {
    

    it('Application can add itself', async () => {
      txRes = await instance.methods.updateApplication(web3.fromAscii(application1.updatedName), application1.rewardsAddress, application1.sidechainAddress).send({ from: application1.account, gas: 500000 });
      assert.equal(String(txRes.events['ApplicationUpdated'].returnValues['0']).toLowerCase(),String(application1.account).toLowerCase());
      assert.equal(web3.toUtf8(String(txRes.events['ApplicationUpdated'].returnValues['1']).toLowerCase()),String(application1.updatedName).toLowerCase());
      assert.equal(String(txRes.events['ApplicationUpdated'].returnValues['2']).toLowerCase(),String(application1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['ApplicationUpdated'].returnValues['3']).toLowerCase(),String(application1.sidechainAddress).toLowerCase());

      //add the other applications needed for testing
      txRes = await instance.methods.updateApplication(web3.fromAscii(application2.name), application2.rewardsAddress, application2.sidechainAddress).send({ from: application2.account, gas: 500000 });
      txRes = await instance.methods.updateApplication(web3.fromAscii(application3.name), application3.rewardsAddress, application3.sidechainAddress).send({ from: application3.account, gas: 500000 });
      txRes = await instance.methods.updateApplication(web3.fromAscii(application4.name), application4.rewardsAddress, application4.sidechainAddress).send({ from: application4.account, gas: 500000 });

    });
    
    it('Application must have valid addresses', async () => {
      try {
        expect(await instance.methods.updateApplication(web3.fromAscii(application2.name), '0x0', application2.sidechainAddress).send({ from: application2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }

      try {
        expect(await instance.methods.updateApplication(web3.fromAscii(application2.name),  application2.rewardsAddress, '0x0').send({ from: application2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });
    it('Application can update itself', async () => {
      txRes = await instance.methods.updateApplication(web3.fromAscii(application1.name), application1.rewardsAddress, application1.sidechainAddress).send({ from: application1.account, gas: 500000 });
      assert.equal(String(txRes.events['ApplicationUpdated'].returnValues['0']).toLowerCase(),String(application1.account).toLowerCase());
      assert.equal(web3.toUtf8(String(txRes.events['ApplicationUpdated'].returnValues['1']).toLowerCase()),String(application1.name).toLowerCase());
      assert.equal(String(txRes.events['ApplicationUpdated'].returnValues['2']).toLowerCase(),String(application1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['ApplicationUpdated'].returnValues['3']).toLowerCase(),String(application1.sidechainAddress).toLowerCase());
    });
    it('Active applications list cannot be updated by non-controller', async () => {
      try {        
        expect(await instance.methods.setApplications(dailyTimestamp1, [application1.account, application2.account]).send({ from: application2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });
    it('Active applications list will fail if an app does not yet exist', async () => {
      try {        
        expect(await instance.methods.setApplications(dailyTimestamp1, [application1.account, application2.account, application5.account]).send({ from: newControllerAddress, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });
    it('Active applications list can be updated by controller', async () => {
      txRes = await instance.methods.setApplications(dailyTimestamp1, [application1.account, application2.account, application3.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account, application3.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),String(dailyTimestamp1).toLowerCase());      
    });
    it('Active applications list can be updated for next day by controller', async () => {
      txRes = await instance.methods.setApplications(dailyTimestamp2, [application1.account, application2.account, application4.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account, application4.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),String(dailyTimestamp2).toLowerCase());      
    });
    it('Correctly retrieve applications list based on timestamp', async () => {        
      let value = await instance.methods.getEntities(0, dailyTimestamp1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application3.account]);
      value = await instance.methods.getEntities(0, dailyTimestamp2).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application4.account]);
    });
    it('Active applications list can be updated for next day again with different count of applications by controller', async () => {
      txRes = await instance.methods.setApplications(dailyTimestamp2, [application1.account, application2.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),String(dailyTimestamp2).toLowerCase());      
    });
    it('Correctly retrieve applications list based on timestamp after second update', async () => {        
      let value = await instance.methods.getEntities(0, dailyTimestamp1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application3.account]);
      value = await instance.methods.getEntities(0, dailyTimestamp2).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account]);
    });

  });

  describe('Validator Management Tests', async () => {
  
    it('Validator can add itself', async () => {
      txRes = await instance.methods.updateValidator(web3.fromAscii(validator1.updatedName), validator1.rewardsAddress, validator1.sidechainAddress).send({ from: validator1.account, gas: 500000 });
      assert.equal(String(txRes.events['ValidatorUpdated'].returnValues['0']).toLowerCase(),String(validator1.account).toLowerCase());
      assert.equal(web3.toUtf8(String(txRes.events['ValidatorUpdated'].returnValues['1']).toLowerCase()),String(validator1.updatedName).toLowerCase());
      assert.equal(String(txRes.events['ValidatorUpdated'].returnValues['2']).toLowerCase(),String(validator1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['ValidatorUpdated'].returnValues['3']).toLowerCase(),String(validator1.sidechainAddress).toLowerCase());

      //add the other validators needed for testing
      txRes = await instance.methods.updateValidator(web3.fromAscii(validator2.name), validator2.rewardsAddress, validator2.sidechainAddress).send({ from: validator2.account, gas: 500000 });
      txRes = await instance.methods.updateValidator(web3.fromAscii(validator3.name), validator3.rewardsAddress, validator3.sidechainAddress).send({ from: validator3.account, gas: 500000 });
      txRes = await instance.methods.updateValidator(web3.fromAscii(validator4.name), validator4.rewardsAddress, validator4.sidechainAddress).send({ from: validator4.account, gas: 500000 });
    });
    
    it('Validator must have valid addresses', async () => {
      try {
        expect(await instance.methods.updateValidator(web3.fromAscii(validator2.name), '0x0', validator2.sidechainAddress).send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }

      try {
        expect(await instance.methods.updateValidator(web3.fromAscii(validator2.name),  validator2.rewardsAddress, '0x0').send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });
    it('Validator can update itself', async () => {
      txRes = await instance.methods.updateValidator(web3.fromAscii(validator1.name), validator1.rewardsAddress, validator1.sidechainAddress).send({ from: validator1.account, gas: 500000 });
      assert.equal(String(txRes.events['ValidatorUpdated'].returnValues['0']).toLowerCase(),String(validator1.account).toLowerCase());
      assert.equal(web3.toUtf8(String(txRes.events['ValidatorUpdated'].returnValues['1']).toLowerCase()),String(validator1.name).toLowerCase());
      assert.equal(String(txRes.events['ValidatorUpdated'].returnValues['2']).toLowerCase(),String(validator1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['ValidatorUpdated'].returnValues['3']).toLowerCase(),String(validator1.sidechainAddress).toLowerCase());
    });
    it('Active validators list cannot be updated by non-controller', async () => {
      try {        
        expect(await instance.methods.setValidators(dailyTimestamp1, [validator1.account, validator2.account]).send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });
    it('Active validators list will fail if an app does not yet exist', async () => {
      try {
        
        expect(await instance.methods.setValidators(dailyTimestamp1, [validator1.account, validator2.account, validator5.account]).send({ from: newControllerAddress, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });
    it('Active validators list can be updated by controller', async () => {
      txRes = await instance.methods.setValidators(dailyTimestamp1, [validator1.account, validator2.account, validator3.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account, validator3.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),String(dailyTimestamp1).toLowerCase());      
    });
    it('Active validators list can be updated for next day by controller', async () => {
      txRes = await instance.methods.setValidators(dailyTimestamp2, [validator1.account, validator2.account, validator4.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account, validator4.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),String(dailyTimestamp2).toLowerCase());      
    });
    it('Correctly retrieve validators list based on timestamp', async () => {        
      let value = await instance.methods.getEntities(1, dailyTimestamp1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator3.account]);
      value = await instance.methods.getEntities(1, dailyTimestamp2).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator4.account]);
    });
    it('Active validators list can be updated for next day again with different count of validators by controller', async () => {
      txRes = await instance.methods.setValidators(dailyTimestamp2, [validator1.account, validator2.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),String(dailyTimestamp2).toLowerCase());      
    });
    it('Correctly retrieve validators list based on timestamp after second update', async () => {        
      let value = await instance.methods.getEntities(1, dailyTimestamp1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator3.account]);
      value = await instance.methods.getEntities(1, dailyTimestamp2).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account]);
    });

  });

    // it('Application can add itself', async () => {
    //   // const res = await instance.methods.updateApplication(application1.name, application1.rewardsAddress, application1.sidechainAddress)
    //   // .send({ from: application1.account});
    //   const res = await instance.methods.updateController('0x5B0Da644CCFc3794d60d33b17975867A5C5dd1aC')
    //   .send({ from: application1.account});
    //   // const applications = await instance.applications().call();
    //   // console.log(applications);
    //   process.exit(1);
    //   const transferrerBalance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
    //   const receiverBalance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[4]).call());
    //   transferResult = await instance.methods.transfer(web3.eth.accounts[4], web3.toWei(amount)).send({ from: web3.eth.accounts[3] });      
    //   newTransferrerBalance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
    //   newReceiverBalance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[4]).call());
    //   assert.equal(Number(newTransferrerBalance), Number(transferrerBalance) - Number(amount));
    //   assert.equal(Number(newReceiverBalance), Number(receiverBalance) + Number(amount));
    // });

    // it('Transfer Event Emitted', async () => {
    //   assert.equal(String(transferResult.events['Transfer'].returnValues['1']).toLowerCase(),String(web3.eth.accounts[4]).toLowerCase());
    //   assert.equal(String(transferResult.events['Transfer'].returnValues['0']).toLowerCase(),String(web3.eth.accounts[3]).toLowerCase());
    //   assert.equal(Number(web3.fromWei(transferResult.events['Transfer'].returnValues['2'])), amount);      
    // });
  });

  // describe('Timebase transfer logic', async () => {
  //   let newAccount3Balance;
  //   let newAccount4Balance;
  //   it('transfer fails if non holder account before transfer start time', async () => {
  //     const amount = 10;
  //     try {
  //       expect(await instance.methods.transfer(web3.eth.accounts[3], web3.toWei(amount)).send({ from: web3.eth.accounts[4] })).to.be.rejectedWith(Error);
  //     } catch (error) {
  //       //
  //     }
  //   });

  //   it('transfer succeeds with holder account before transfer start time', async () => {
  //     const amount = 10;
  //     const account3Balance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
  //     const account4Balance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[4]).call());
  //     const result = await instance.methods.transfer(web3.eth.accounts[4], web3.toWei(amount)).send({ from: web3.eth.accounts[3] });
  //     newAccount3Balance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
  //     newAccount4Balance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[4]).call());
  //     assert.equal(Number(newAccount3Balance), Number(account3Balance) - Number(amount));
  //     assert.equal(Number(newAccount4Balance), Number(account4Balance) + Number(amount));
  //   });

  //   it('transfer succeeds with non holder accoutn after after tranfer start time', async () => {
  //     // Wait for some async operation to end
  //     try {
  //       console.log(`will wait for ${global.timestamp - Math.floor(Date.now() / 1000)} seconds...`);
  //       const result = await waitUntil(() => {
  //         const timePassed = global.timestamp - Math.floor(Date.now() / 1000);
  //         return timePassed < 0;
  //       }, 90000, 1000);

  //       // Here are the operations to be done after predicate
  //       const amount = 10;
  //       const account3Balance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
  //       const account4Balance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[4]).call());
  //       const res = await instance.methods.transfer(web3.eth.accounts[3], web3.toWei(amount)).send({ from: web3.eth.accounts[4] });
  //       newAccount3Balance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
  //       newAccount4Balance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[4]).call());
  //       assert.equal(Number(newAccount3Balance), Number(account3Balance) + Number(amount));
  //       assert.equal(Number(newAccount4Balance), Number(account4Balance) - Number(amount));
  //     } catch (error) {
  //     // Here are the operations to be done if predicate didn't succeed in the timeout
  //       console.log('Async operation failed: ', error);
  //     }
  //   });
  // });

  // const alice = { address: '0x1c77BCe3fAc2d7023aB3f9A6369c100FB8B6c7B5', pk: 'c79b0f20fac88d078d1ab0908fcafb31708e83a46fabfe7601d5b0d7bd5b2974' };
  // const bob = { address: web3.eth.accounts[8], pk: 'f34381274ac5cca8a465209bdeafeed0274ddcf7ba1df080df772b73ccad032a' };
  // const charlie = { address: web3.eth.accounts[9], pk: '5027f6ea1ab6cd9fe2bc5c2bbb07d5ec77524529964aafe0d02a76aabaa4917f' };
  // const damien = { address: web3.eth.accounts[7], pk: 'c79b0f20fac88d078d1ab0908fcafb31708e83a46fabfe7601d5b0d7bd5b2974' };
  // const to = bob.address;
  // const delegate = charlie.address;
  // const fee = 10;
  // const amount = 100;
  // const propsInWallet = 5000;
  // const alicePrivateKey = Buffer.from(alice.pk, 'hex');
  // let components;
  // let nonce;
  // describe('ERC865 compatible logic', async () => {
  //   it('Charlie transfers 100 tokens from Alice to Bob (fee=10)', async () => {
  //     // give alice some props
      
  //     await instance.methods.transfer(alice.address, propsInWallet).send( { from: web3.eth.accounts[3] });
      
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

  //     components = [
  //       Buffer.from('0d98dcb1', 'hex'),
  //       formattedAddress(instance._address),
  //       formattedAddress(to),
  //       formattedInt(amount),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];

  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);      
  //     await instance.methods.transferPreSigned(sig,to,amount,fee,nonce).send({ from: charlie.address, gas:1000000});

  //     aliceBalance = await instance.methods.balanceOf(alice.address).call();
  //     bobBalance = await instance.methods.balanceOf(bob.address).call();
  //     charlieBalance = await instance.methods.balanceOf(charlie.address).call();
      
  //     assert.equal(Number(aliceBalance), propsInWallet - (amount + fee));
  //     assert.equal(Number(bobBalance), amount);
  //     assert.equal(Number(charlieBalance), fee);
  //   });

  //   it('Damien tries to replay transfer and fails', async () => {
  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
  //     try {
  //       const tx = await instance.methods.transferPreSigned(
  //         sig,
  //         to,
  //         amount,
  //         fee,
  //         nonce).send(
  //         { from: charlie.address, gas:1000000 }
  //       );
  //       assert.equal(tx.receipt.status, '0x00');
  //     } catch (error) {
  //       // console.log(`error:${error}`);
  //     }
  //   });    

  //   it('Charlie approves Damien to spend 100 tokens on behalf of Alice to Bob (fee=10)', async () => {
  //     // give alice some props
  //     // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
  //     const oldAliceBalance = aliceBalance;
  //     const oldCharlieBalance = charlieBalance;
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

  //     components = [
  //       Buffer.from('79250dcf', 'hex'),
  //       formattedAddress(instance.address),
  //       formattedAddress(damien.address),
  //       formattedInt(amount),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];

  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
  //     // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
  //     await instance.methods.approvePreSigned(
  //       sig,
  //       damien.address,
  //       amount,
  //       fee,
  //       nonce).send(
  //       { from: charlie.address , gas:1000000}
  //     );

  //     aliceBalance = await instance.methods.balanceOf(alice.address).call();
  //     charlieBalance = await instance.methods.balanceOf(charlie.address).call();
  //     // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
  //     assert.equal(Number(aliceBalance), Number(oldAliceBalance) - fee);
  //     assert.equal(Number(charlieBalance), Number(oldCharlieBalance) + fee);
  //   });

  //   it('Damien transfers half of approved tokens from Alice to Bob', async () => {
  //     const oldAliceBalance = aliceBalance;
  //     const oldBobBalance = bobBalance;
  //     await instance.methods.transferFrom(alice.address, bob.address, amount / 2).send({ from: damien.address });
  //     aliceBalance = await instance.methods.balanceOf(alice.address).call();
  //     bobBalance = await instance.methods.balanceOf(bob.address).call();
  //     assert.equal(Number(aliceBalance), Number(oldAliceBalance) - (amount / 2));
  //     assert.equal(Number(bobBalance), Number(oldBobBalance) + (amount / 2));
  //   });

  //   it('Charlie performs transferFrom of 50 tokens on behalf of damien from Alice to Bob (fee=10)', async () => {
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     const oldAliceBalance = aliceBalance;
  //     const oldBobBalance = bobBalance;
  //     const oldCharlieBalance = charlieBalance;
  //     const oldDamienBalance = await instance.methods.balanceOf(damien.address).call();
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[7]);
  //     components = [
  //       Buffer.from('a70c41b4', 'hex'),
  //       formattedAddress(instance.address),
  //       formattedAddress(alice.address),
  //       formattedAddress(bob.address),
  //       formattedInt(amount / 2),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];
  //     // console.log(`components instance.address=${instance.address}, alice.address=${alice.address}, `)
  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), Buffer.from(damien.pk, 'hex'));
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
  //     await instance.methods.transferFromPreSigned(
  //       sig,
  //       alice.address,
  //       bob.address,
  //       amount / 2,
  //       fee,
  //       nonce).send(
  //       { from: charlie.address, gas:1000000 }
  //     );

  //     aliceBalance = await instance.methods.balanceOf(alice.address).call();
  //     bobBalance = await instance.methods.balanceOf(bob.address).call();
  //     charlieBalance = await instance.methods.balanceOf(charlie.address).call();
  //     damienBalance = await instance.methods.balanceOf(damien.address).call();

  //     assert.equal(Number(aliceBalance), Number(oldAliceBalance) - ((amount / 2) + fee));
  //     assert.equal(Number(bobBalance), Number(oldBobBalance) + (amount / 2));
  //     assert.equal(Number(charlieBalance), Number(oldCharlieBalance) + fee);
  //   });

  //   it('Charlie increase allowance of Damien to spend 100 tokens on behalf of Alice to Bob (fee=10)', async () => {
  //     // give alice some props
  //     // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
  //     const oldAliceBalance = aliceBalance;
  //     const oldCharlieBalance = charlieBalance;
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

  //     components = [
  //       Buffer.from('138e8da1', 'hex'),
  //       formattedAddress(instance.address),
  //       formattedAddress(damien.address),
  //       formattedInt(amount),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];

  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
  //     // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
  //     await instance.methods.increaseAllowancePreSigned(
  //       sig,
  //       damien.address,
  //       amount,
  //       fee,
  //       nonce).send(
  //       { from: charlie.address, gas:1000000 }
  //     );

  //     aliceBalance = await instance.methods.balanceOf(alice.address).call();
  //     charlieBalance = await instance.methods.balanceOf(charlie.address).call();
  //     // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
  //     assert.equal(Number(aliceBalance), Number(oldAliceBalance) - fee);
  //     assert.equal(Number(charlieBalance), Number(oldCharlieBalance) + fee);
  //     const allowance = await instance.methods.allowance(alice.address, damien.address).call();
  //     assert.equal(Number(allowance), amount);
  //   });

  //   it('Charlie decreases allowance of Damien to spend 50 tokens on behalf of Alice to Bob (fee=10)', async () => {
  //     // give alice some props
  //     // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
  //     const oldAliceBalance = aliceBalance;
  //     const oldCharlieBalance = charlieBalance;
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

  //     components = [
  //       Buffer.from('5229c56f', 'hex'),
  //       formattedAddress(instance.address),
  //       formattedAddress(damien.address),
  //       formattedInt(amount / 2),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];

  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
  //     // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
  //     await instance.methods.decreaseAllowancePreSigned(
  //       sig,
  //       damien.address,
  //       amount / 2,
  //       fee,
  //       nonce).send(
  //       { from: charlie.address, gas:1000000 }
  //     );

  //     aliceBalance = await instance.methods.balanceOf(alice.address).call();
  //     charlieBalance = await instance.methods.balanceOf(charlie.address).call();
  //     // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
  //     assert.equal(Number(aliceBalance), Number(oldAliceBalance) - fee);
  //     assert.equal(Number(charlieBalance), Number(oldCharlieBalance) + fee);
  //     const allowance = await instance.methods.allowance(alice.address, damien.address).call();
  //     assert.equal(Number(allowance), amount / 2);
  //   });

  //   it('Charlie decreases allowance of Damien by 100 when only 50 are allowed is rejected', async () => {
  //     // give alice some props
  //     // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
  //     const oldAliceBalance = aliceBalance;
  //     const oldCharlieBalance = charlieBalance;
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

  //     components = [
  //       Buffer.from('5229c56f', 'hex'),
  //       formattedAddress(instance.address),
  //       formattedAddress(damien.address),
  //       formattedInt(amount),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];

  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
  //     // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
  //     try {
  //       expect(await instance.methods.decreaseAllowancePreSigned(
  //         sig,
  //         damien.address,
  //         amount,
  //         fee,
  //         nonce).send(
  //         { from: charlie.address, gas:1000000 }
  //       )).to.be.rejectedWith(Error);
  //     } catch (error) {
  //       //
  //     }
  //   });
  //   it('Charlie tries to transfer more tokens than alice has to Bob (fee=10)', async () => {
      
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

  //     components = [
  //       Buffer.from('0d98dcb1', 'hex'),
  //       formattedAddress(instance._address),
  //       formattedAddress(to),
  //       formattedInt(amount*1000000),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];

  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);      
  //     try {
  //       const tx = await instance.methods.transferPreSigned(sig,to,amount,fee,nonce).send({ from: charlie.address, gas:1000000});
  //       assert.equal(tx.receipt.status, '0x00');
  //     } catch (error) {
  //       // console.log(`error:${error}`);
  //     }
  //   });

  //   it('Charlie tries to transfer tokens from alice has to no-one', async () => {
      
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

  //     components = [
  //       Buffer.from('0d98dcb1', 'hex'),
  //       formattedAddress(instance._address),
  //       formattedAddress('0x0'),
  //       formattedInt(amount),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];

  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);      
  //     try {
  //       const tx = await instance.methods.transferPreSigned(sig,to,amount,fee,nonce).send({ from: charlie.address, gas:1000000});
  //       assert.equal(tx.receipt.status, '0x00');
  //     } catch (error) {
  //       // console.log(`error:${error}`);
  //     }
  //   });

  //   it('Charlie tries to transfer tokens with bad signature from alice to bob', async () => {
      
  //     // nonce = await web3.eth.getTransactionCount(alice.address);
  //     nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);

  //     components = [
  //       Buffer.from('0d98dcb1', 'hex'),
  //       formattedAddress(instance._address),
  //       formattedAddress(to),
  //       formattedInt(amount),
  //       formattedInt(fee),
  //       formattedInt(nonce),
  //     ];

  //     const vrs = ethUtil.ecsign(hashedTightPacked(components), Buffer.from(alice.pk, 'hex'));
  //     const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);      
  //     try {
  //       const tx = await instance.methods.transferPreSigned(sig,to,amount,fee,nonce).send({ from: charlie.address, gas:1000000});
  //       assert.equal(tx.receipt.status, '0x00');
  //     } catch (error) {
  //       // console.log(`error:${error}`);
  //     }
  //   });
  // });
// });
