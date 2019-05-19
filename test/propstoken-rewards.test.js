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
const { soliditySha3 } = require('web3-utils');

let newControllerAddress;
let txRes;
let instance;
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

let maxTotalSupply;
let currentTotalSupply;


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
      maxTotalSupply = (await instance.methods.maxTotalSupply().call());
      assert.equal(String(web3.fromWei(maxTotalSupply)), "1000000000");
    });
    
    // enum ParameterName { ApplicationRewardsPercent, ApplicationRewardsMaxVariationPercent, ValidatorMajorityPercent, ValidatorRewardsPercent}
    it('Parameter ApplicationRewardsPercent is properly set', async () => {          
      const value = await instance.methods.getParameter(0, 0).call();      
      assert.equal(value, 34750); //pphm
    });

    it('Parameter ApplicationRewardsMaxVariationPercent is properly set', async () => {      
      const value = await instance.methods.getParameter(1, 0).call();      
      assert.equal(value, 150000000); //pphm
    });

    it('Parameter ValidatorMajorityPercent is properly set', async () => {      
      const value = await instance.methods.getParameter(2, 0).call();      
      assert.equal(value, 50000000); //pphm
    });

    it('Parameter ValidatorRewardsPercent is properly set', async () => {      
      const value = await instance.methods.getParameter(3, 0).call();      
      assert.equal(value, 1829); //pphm
    });
  });

  describe('Parameter Management Tests', async () => {        
    // enum ParameterName { ApplicationRewardsPercent, ApplicationRewardsMaxVariationPercent, ValidatorMajorityPercent, ValidatorRewardsPercent}
    it('Can update a parameter value and read both values', async () => {  
      txRes = await instance.methods.updateParameter(3, 1830, 1).send({ from: newControllerAddress });    
      let value = await instance.methods.getParameter(3, 0).call();      
      assert.equal(value, 1829); //pphm
      value = await instance.methods.getParameter(3, 1).call();
      assert.equal(value, 1830); //pphm      
    });

    it('ParameterUpdated event was emitted', async () => {  
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['0']).toLowerCase(),String('3'));
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['1']).toLowerCase(),String('1830').toLowerCase());
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['2']).toLowerCase(),String('1829').toLowerCase());
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['3']).toLowerCase(),String('1').toLowerCase());

    });

    it('Updating a parameter before the previous update took place', async () => {  
      await instance.methods.updateParameter(0, 34752, 1).send({ from: newControllerAddress });    
      let value = await instance.methods.getParameter(0, 0).call();      
      assert.equal(value, 34750); //pphm
      value = await instance.methods.getParameter(0, 1).call();      
      assert.equal(value, 34752); //pphm      
    });    
  });

  describe('Application Management Tests', async () => {
    it('Application can add itself', async () => {
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application1.updatedName), application1.rewardsAddress, application1.sidechainAddress).send({ from: application1.account, gas: 500000 });
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['0']).toLowerCase(),String(application1.account).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['1']).toLowerCase(),String('0').toLowerCase());
      assert.equal(web3.toUtf8(String(txRes.events['EntityUpdated'].returnValues['2']).toLowerCase()),String(application1.updatedName).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['3']).toLowerCase(),String(application1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['4']).toLowerCase(),String(application1.sidechainAddress).toLowerCase());

      //add the other applications needed for testing
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application2.name), application2.rewardsAddress, application2.sidechainAddress).send({ from: application2.account, gas: 500000 });
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application3.name), application3.rewardsAddress, application3.sidechainAddress).send({ from: application3.account, gas: 500000 });
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application4.name), application4.rewardsAddress, application4.sidechainAddress).send({ from: application4.account, gas: 500000 });
    });
    
    it('Application must have valid addresses', async () => {
      try {
        expect(await instance.methods.updateEntity(0,web3.fromAscii(application2.name), '0x0', application2.sidechainAddress).send({ from: application2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }

      try {
        expect(await instance.methods.updateEntity(0,web3.fromAscii(application2.name),  application2.rewardsAddress, '0x0').send({ from: application2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Application can update itself', async () => {
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application1.name), application1.rewardsAddress, application1.sidechainAddress).send({ from: application1.account, gas: 500000 });
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['0']).toLowerCase(),String(application1.account).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['1']).toLowerCase(),String('0').toLowerCase());
      assert.equal(web3.toUtf8(String(txRes.events['EntityUpdated'].returnValues['2']).toLowerCase()),String(application1.name).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['3']).toLowerCase(),String(application1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['4']).toLowerCase(),String(application1.sidechainAddress).toLowerCase());
    });

    it('Active applications list cannot be updated by non-controller', async () => {
      try {        
        expect(await instance.methods.setApplications(0, [application1.account, application2.account]).send({ from: application2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });

    it('Active applications list will fail if an app does not yet exist', async () => {
      try {        
        expect(await instance.methods.setApplications(0, [application1.account, application2.account, application5.account]).send({ from: newControllerAddress, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Active applications list can be updated by controller', async () => {
      txRes = await instance.methods.setApplications(0, [application1.account, application2.account, application3.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account, application3.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),String('0').toLowerCase());      
    });

    it('Active applications list can be updated for next day by controller', async () => {
      txRes = await instance.methods.setApplications(1, [application1.account, application2.account, application4.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account, application4.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),String('1').toLowerCase());      
    });

    it('Correctly retrieve applications list based on rewards day', async () => {        
      let value = await instance.methods.getEntities(0, 0).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application3.account]);
      value = await instance.methods.getEntities(0, 1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application4.account]);
    });

    it('Active applications list can be updated for next day again with different count of applications by controller', async () => {
      txRes = await instance.methods.setApplications(1, [application1.account, application2.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),String('1').toLowerCase());      
    });

    it('Correctly retrieve applications list based on rewards day after second update', async () => {        
      let value = await instance.methods.getEntities(0, 0).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application3.account]);
      value = await instance.methods.getEntities(0, 1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account]);
    });
  });

  describe('Validator Management Tests', async () => {
    it('Validator can add itself', async () => {
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator1.updatedName), validator1.rewardsAddress, validator1.sidechainAddress).send({ from: validator1.account, gas: 500000 });
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['0']).toLowerCase(),String(validator1.account).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['1']).toLowerCase(),String('1').toLowerCase());
      assert.equal(web3.toUtf8(String(txRes.events['EntityUpdated'].returnValues['2']).toLowerCase()),String(validator1.updatedName).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['3']).toLowerCase(),String(validator1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['4']).toLowerCase(),String(validator1.sidechainAddress).toLowerCase());
      //add the other validators needed for testing
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator2.name), validator2.rewardsAddress, validator2.sidechainAddress).send({ from: validator2.account, gas: 500000 });
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator3.name), validator3.rewardsAddress, validator3.sidechainAddress).send({ from: validator3.account, gas: 500000 });
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator4.name), validator4.rewardsAddress, validator4.sidechainAddress).send({ from: validator4.account, gas: 500000 });
    });
    
    it('Validator must have valid addresses', async () => {
      try {
        expect(await instance.methods.updateEntity(1,web3.fromAscii(validator2.name), '0x0', validator2.sidechainAddress).send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }

      try {
        expect(await instance.methods.updateEntity(1,web3.fromAscii(validator2.name),  validator2.rewardsAddress, '0x0').send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Validator can update itself', async () => {
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator1.name), validator1.rewardsAddress, validator1.sidechainAddress).send({ from: validator1.account, gas: 500000 });
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['0']).toLowerCase(),String(validator1.account).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['1']).toLowerCase(),String('1').toLowerCase());
      assert.equal(web3.toUtf8(String(txRes.events['EntityUpdated'].returnValues['2']).toLowerCase()),String(validator1.name).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['3']).toLowerCase(),String(validator1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['4']).toLowerCase(),String(validator1.sidechainAddress).toLowerCase());
    });

    it('Active validators list cannot be updated by non-controller', async () => {
      try {        
        expect(await instance.methods.setValidators(0, [validator1.account, validator2.account]).send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });

    it('Active validators list will fail if an app does not yet exist', async () => {
      try {
        
        expect(await instance.methods.setValidators(0, [validator1.account, validator2.account, validator5.account]).send({ from: newControllerAddress, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Active validators list can be updated by controller', async () => {
      txRes = await instance.methods.setValidators(0, [validator1.account, validator2.account, validator3.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account, validator3.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),String('0').toLowerCase());      
    });

    it('Active validators list can be updated for next day by controller', async () => {
      txRes = await instance.methods.setValidators(1, [validator1.account, validator2.account, validator4.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account, validator4.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),String('1').toLowerCase());      
    });

    it('Correctly retrieve validators list based on rewards day', async () => {        
      let value = await instance.methods.getEntities(1, 0).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator3.account]);
      value = await instance.methods.getEntities(1, 1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator4.account]);
    });

    it('Active validators list can be updated for next day again with different count of validators by controller', async () => {
      txRes = await instance.methods.setValidators(1, [validator1.account, validator2.account, validator3.account, validator4.account]).send({ from: newControllerAddress, gas: 500000 });
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account, validator3.account, validator4.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),String('1').toLowerCase());      
    });

    it('Correctly retrieve validators list based on rewards day after second update', async () => {        
      let value = await instance.methods.getEntities(1, 0).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator3.account]);
      value = await instance.methods.getEntities(1, 1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator3.account, validator4.account]);
    });
  });
  describe('Submissions and Rewards Tests', async () => {    
    const formatArrayForSha3 = function(arr, type) {      
      return { type, value: arr};
    }
    BigNumber.config({ EXPONENTIAL_AT: 1e+9 })
    
    const validApplicationRewards = {
      applications: [application1.account, application2.account, application3.account],
      amounts: [web3.toWei(100000), web3.toWei(72000), web3.toWei(36000)]
    }
    const exceedMaxApplicationRewards = {
      applications: [application1.account, application2.account, application3.account],
      amounts: [web3.toWei(120000), web3.toWei(72000), web3.toWei(36000)]
    }
    const nonExistentAppApplicationRewards = {
      applications: [application1.account, application2.account, application5.account],
      amounts: [web3.toWei(120000), web3.toWei(72000), web3.toWei(36000)]
    }
    const appExistsButNotInListApplicationRewards = {
      applications: [application1.account, application2.account, application4.account],
      amounts: [web3.toWei(120000), web3.toWei(72000), web3.toWei(36000)]
    }

    const day0SelectedValidators = [validator1, validator2, validator3];    
    const day0ValidApplicationRewardsHash = soliditySha3(0, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const day1ValidApplicationRewardsHash = soliditySha3(1, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const day2ValidApplicationRewardsHash = soliditySha3(2, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const exceedMaxApplicationRewardsHash = soliditySha3(0, formatArrayForSha3(exceedMaxApplicationRewards.applications, 'address'), formatArrayForSha3(exceedMaxApplicationRewards.amounts, 'uint256'));
    const nonExistentAppApplicationRewardsHash = soliditySha3(0, formatArrayForSha3(nonExistentAppApplicationRewards.applications, 'address'), formatArrayForSha3(nonExistentAppApplicationRewards.amounts, 'uint256'));
    const appExistsButNotInListApplicationRewardsHash = soliditySha3(0, formatArrayForSha3(appExistsButNotInListApplicationRewards.applications, 'address'), formatArrayForSha3(appExistsButNotInListApplicationRewards.amounts, 'uint256'));
    
    it('Reward hash must match submitted data', async () => {  
      try {
        
        expect(await instance.methods.submitDailyRewards(0, exceedMaxApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Validator on the list can submit valid data', async() => {
      txRes = await instance.methods.submitDailyRewards(0, day0ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 });
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),String('0').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),String(day0ValidApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator1.account).toLowerCase());      
    });

    it('Validator not on the list cannot submit', async () => {  
      try {
        
        expect(await instance.methods.submitDailyRewards(0, day0ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator4.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Validator cannot submit more than once', async () => {  
      try {
        
        expect(await instance.methods.submitDailyRewards(0, day0ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Reaching Validator majority with non existent application is rejected', async() => {
      // get current props balances for rewarded applications      
      txRes = await instance.methods.submitDailyRewards(0, nonExistentAppApplicationRewardsHash, nonExistentAppApplicationRewards.applications, nonExistentAppApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 });
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),String('0').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),String(nonExistentAppApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator1.account).toLowerCase());
      try {
        expect(txRes = await instance.methods.submitDailyRewards(0, nonExistentAppApplicationRewardsHash, nonExistentAppApplicationRewards.applications, nonExistentAppApplicationRewards.amounts).send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error)
      }
      catch (error) {
        //
      }      
       
    });

    it('Reaching Validator majority with existing application but not on list is rejected', async() => {
      // get current props balances for rewarded applications      
      txRes = await instance.methods.submitDailyRewards(0, appExistsButNotInListApplicationRewardsHash, appExistsButNotInListApplicationRewards.applications, appExistsButNotInListApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 });
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),String('0').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),String(appExistsButNotInListApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator1.account).toLowerCase());
      try {
        expect(txRes = await instance.methods.submitDailyRewards(0, appExistsButNotInListApplicationRewardsHash, appExistsButNotInListApplicationRewards.applications, appExistsButNotInListApplicationRewards.amounts).send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error)
      }
      catch (error) {
        //
      }             
    });

    it('Reaching Validator majority with amount that exceeds allowed is rejected', async() => {
      txRes = await instance.methods.submitDailyRewards(0, exceedMaxApplicationRewardsHash, exceedMaxApplicationRewards.applications, exceedMaxApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 });
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),String('0').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),String(exceedMaxApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator1.account).toLowerCase());
      try {
        expect(txRes = await instance.methods.submitDailyRewards(0, exceedMaxApplicationRewardsHash, exceedMaxApplicationRewards.applications, exceedMaxApplicationRewards.amounts).send({ from: validator2.account, gas: 500000 })).to.be.rejectedWith(Error)
      }
      catch (error) {
        //
      }             
    });

    it('Reaching Validator majority mints rewards for apps and no validator rewards', async() => {
      // get current total supply before minting
      currentTotalSupply = await instance.methods.totalSupply().call();
      // get current props balances for rewarded applications
      const application1Balance = (await instance.methods.balanceOf(application1.rewardsAddress).call());
      const application2Balance = (await instance.methods.balanceOf(application2.rewardsAddress).call());
      const application3Balance = (await instance.methods.balanceOf(application3.rewardsAddress).call());
      txRes = await instance.methods.submitDailyRewards(0, day0ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator2.account, gas: 500000 });
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),String('0').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),String(day0ValidApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator2.account).toLowerCase());
      // expect DailyRewardsApplicationsMinted
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['0']).toLowerCase(),String('0').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['1']).toLowerCase(),String(day0ValidApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['2']).toLowerCase(),String(validApplicationRewards.applications.length).toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['3']).toLowerCase(),String(BigNumber.sum.apply(null, validApplicationRewards.amounts).toString()).toLowerCase());
      // expect no DailyRewardsValidatorsMinted event        
      assert.equal('DailyRewardsValidatorsMinted' in txRes.events, false);      
      // expect application balances to change
      const newApplication1Balance = (await instance.methods.balanceOf(application1.rewardsAddress).call());
      const newApplication2Balance = (await instance.methods.balanceOf(application2.rewardsAddress).call());
      const newApplication3Balance = (await instance.methods.balanceOf(application3.rewardsAddress).call());
      assert.equal(newApplication1Balance, BigNumber.sum(application1Balance, validApplicationRewards.amounts[0]));
      assert.equal(newApplication2Balance, BigNumber.sum(application2Balance, validApplicationRewards.amounts[1]));
      assert.equal(newApplication3Balance, BigNumber.sum(application3Balance, validApplicationRewards.amounts[2]));    
    });

    it('Reaching All Validators submitted mints rewards for validators and increments rewardsDay', async() => {      
      const expectedValidatorRewardsAmountPerValidator = BigNumber.sum(maxTotalSupply, -currentTotalSupply).times(0.001829).div(100).div(day0SelectedValidators.length).integerValue(BigNumber.ROUND_DOWN);
      const expectedValidatorRewardsAmountSum = expectedValidatorRewardsAmountPerValidator.times(day0SelectedValidators.length);
      const validator1Balance = (await instance.methods.balanceOf(validator1.rewardsAddress).call());
      const validator2Balance = (await instance.methods.balanceOf(validator2.rewardsAddress).call());
      const validator3Balance = (await instance.methods.balanceOf(validator3.rewardsAddress).call());      
      txRes = await instance.methods.submitDailyRewards(0, day0ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator3.account, gas: 500000 });      
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),String('0').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),String(day0ValidApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator3.account).toLowerCase());
      // expect no DailyRewardsApplicationsMinted event
      assert.equal('DailyRewardsApplicationsMinted' in txRes.events, false);      
      // expect DailyRewardsValidatorsMinted
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['0']).toLowerCase(),String('0').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['1']).toLowerCase(),String(day0ValidApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['2']).toLowerCase(),String(day0SelectedValidators.length).toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['3']).toLowerCase(),String(expectedValidatorRewardsAmountSum.toString()).toLowerCase());
      // expect the current day to increase after application rewards were minted
      const rewardsDay = await instance.methods.rewardsDay().call();
      assert.equal(rewardsDay, 1);
      // expect validators balances to change
      const newValidator1Balance = (await instance.methods.balanceOf(validator1.rewardsAddress).call());
      const newValidator2Balance = (await instance.methods.balanceOf(validator2.rewardsAddress).call());
      const newValidator3Balance = (await instance.methods.balanceOf(validator3.rewardsAddress).call());
      assert.equal(newValidator1Balance, BigNumber.sum(validator1Balance, expectedValidatorRewardsAmountPerValidator));
      assert.equal(newValidator2Balance, BigNumber.sum(validator2Balance, expectedValidatorRewardsAmountPerValidator));
      assert.equal(newValidator3Balance, BigNumber.sum(validator3Balance, expectedValidatorRewardsAmountPerValidator));
    });

    it('Submitting next day rewards before 24 hours (using 10 seconds in test) is rejected', async() => {      
      try {
        expect(txRes = await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 })).to.be.rejectedWith(Error)
      }
      catch (error) {
        //
      }             
    });

    it('Submitting next day rewards when not all validators submitted will give the submitting validators from yesterdays their rewards using the new validator reward percent param', async() => {
      let timestamp = Math.floor(Date.now() / 1000) + 10; // wait for 10 seconds
      console.log(`will wait for ${timestamp - Math.floor(Date.now() / 1000)} seconds before submitting day 1`);
      let result = await waitUntil(() => {
      let timePassed = timestamp - Math.floor(Date.now() / 1000);
        return timePassed < 0;
      }, 90000, 1000);

      // get current total supply before minting tomorrow
      currentTotalSupply = await instance.methods.totalSupply().call();
      
      txRes = await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 });
      txRes = await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator2.account, gas: 500000 });
      txRes = await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator3.account, gas: 500000 });
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['0']).toLowerCase(),String('1').toLowerCase());
      // expect no DailyRewardsValidatorsMinted event        
      assert.equal('DailyRewardsValidatorsMinted' in txRes.events, false);
      // application rewards were given here now submit for next day
      timestamp = Math.floor(Date.now() / 1000) + 10; // wait for 10 seconds
      console.log(`Submitted for day 1 will wait for ${timestamp - Math.floor(Date.now() / 1000)} seconds beofre day 2`);
      result = await waitUntil(() => {
        timePassed = timestamp - Math.floor(Date.now() / 1000);
        return timePassed < 0;
      }, 90000, 1000);

      txRes = await instance.methods.submitDailyRewards(2, day2ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: 500000 });      
      // expect no DailyRewardsApplicationsMinted event
      assert.equal('DailyRewardsApplicationsMinted' in txRes.events, false);
      assert.equal('DailyRewardsValidatorsMinted' in txRes.events, true);
      // expect DailyRewardsValidatorsMinted for tomorrowTimestamp for only 3 validators out of 4
      const expectedValidatorRewardsAmountPerValidator = BigNumber.sum(maxTotalSupply, -currentTotalSupply).times(0.001830).div(100).div(3).integerValue(BigNumber.ROUND_DOWN);
      const expectedValidatorRewardsAmountSum = expectedValidatorRewardsAmountPerValidator.times(3);      
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['0']).toLowerCase(),String('1').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['1']).toLowerCase(),String(day1ValidApplicationRewardsHash).toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['2']).toLowerCase(),String('3').toLowerCase());
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['3']).toLowerCase(),String(expectedValidatorRewardsAmountSum.toString()).toLowerCase());         
    });
  });
});

 
