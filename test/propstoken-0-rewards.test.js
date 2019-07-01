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
const calcRewardsDay = require('../scripts/tests/index.js').calcRewardsDay;
const utils = require('../scripts_utils/utils');
const { soliditySha3 } = require('web3-utils');

let newControllerAddress;
let txRes;
let instance;
const secondsBetweenDailyRewards = global.secondsBetweenDailyRewards = 15;
const gasUsedStats = {};
const logGasUsed = function(name, value) {  
  // console.log(JSON.stringify(name)+'=>'+JSON.stringify(value));
  if (!(name in gasUsedStats)) {
    gasUsedStats[name] = new Array();    
  }
  gasUsedStats[name].push(value);
}
const arrStats = function(arr) {
  let sum = 0;
  let max = 0;
  let min = 0;
  for (i = 0; i < arr.length; ++i) {
    sum += arr[i];
    if (arr[i] > max) {
      max = arr[i];
    }
    if (arr[i] < min || min == 0) {
      min = arr[i];
    }
  }
  const avg = sum / arr.length;
  return {avg, max, min, count: arr.length};
}
const gasSummary = function() {
  for (name in gasUsedStats) {
    console.log(name+'=>'+JSON.stringify(arrStats(gasUsedStats[name])));
  }
}

let maxTotalSupply;
let currentTotalSupply;
let rewardsDayInfo


contract('main', (_accounts) => {
  const application1 = {
    account: _accounts[11],
    name: "application1",
    rewardsAddress: _accounts[12],
    sidechainAddress: _accounts[13],
    updatedName: "application1-update"
  }
  
  const application2 = {
    account: _accounts[14],
    name: "application2",
    rewardsAddress: _accounts[15],
    sidechainAddress: _accounts[16],
  }        
  
  const application3 = {
    account: _accounts[17],
    name: "application3",
    rewardsAddress: _accounts[18],
    sidechainAddress: _accounts[19],
  }
  
  const application4 = {
    account: _accounts[20],
    name: "application4",
    rewardsAddress: _accounts[21],
    sidechainAddress: _accounts[22],
  }
  
  const application5 = {
    account: _accounts[23],
    name: "application5",
    rewardsAddress: _accounts[24],
    sidechainAddress: _accounts[25],
  }
  
  const validator1 = {
    account: _accounts[30],
    name: "validator1",
    rewardsAddress: _accounts[31],
    sidechainAddress: _accounts[32],
    updatedName: "validator1-update"
  }
  
  const validator2 = {
    account: _accounts[33],
    name: "validator2",
    rewardsAddress: _accounts[34],
    sidechainAddress: _accounts[35],
  }        
  
  const validator3 = {
    account: _accounts[36],
    name: "validator3",
    rewardsAddress: _accounts[37],
    sidechainAddress: _accounts[38],
  }
  
  const validator4 = {
    account: _accounts[39],
    name: "validator4",
    rewardsAddress: _accounts[40],
    sidechainAddress: _accounts[41],
  }
  
  const validator5 = {
    account: _accounts[42],
    name: "validator5",
    rewardsAddress: _accounts[43],
    sidechainAddress: _accounts[44],
  }
  before(async () => {
    instance = await main(true);
    rewardsDayInfo = calcRewardsDay();
    console.log(`will wait for day 1 to begin ${rewardsDayInfo.secondsLeft} left`);
    let result = await waitUntil(() => {
      rewardsDayInfo = calcRewardsDay();
      return rewardsDayInfo.rewardsDay == 1;
    }, 90000, 1000);
    // process.stdout.clearLine();
    // process.stdout.cursorTo(0);
  });

  describe('Initialization values are correct and generic controller function', async () => {    
    const controllerAddress = _accounts[2];
    newControllerAddress = _accounts[4];    
    it('Controller is properly set', async () => {      
      const currentController = await instance.methods.controller().call();
      assert.equal(currentController.toLowerCase(), controllerAddress.toLowerCase());
    });

    it('Controller can be changed by controller', async () => {
      txRes = await instance.methods.updateController(newControllerAddress).send({ from: controllerAddress });
      logGasUsed('updateController', txRes.gasUsed);      
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

    it('Rewards Start Timestamp is properly set', async () => {      
      const rewardsStartVal = (await instance.methods.rewardsStartTimestamp().call());
      assert.equal(String(rewardsStartVal), String(global.rewardsStartTimestamp));
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
      txRes = await instance.methods.updateParameter(3, 1830, 2).send({ from: newControllerAddress });
      logGasUsed('updateParameter', txRes.gasUsed);      
      let value = await instance.methods.getParameter(3, 1).call();      
      assert.equal(value, 1829); //pphm
      value = await instance.methods.getParameter(3, 2).call();
      assert.equal(value, 1830); //pphm      
    });

    it('ParameterUpdated event was emitted', async () => {  
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['0']),'3');
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['1']),'1830');
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['2']),'1829');
      assert.equal(String(txRes.events['ParameterUpdated'].returnValues['3']),'2');

    });

    it('Updating a parameter before the previous update took place', async () => {  
      txRes = await instance.methods.updateParameter(0, 34752, 2).send({ from: newControllerAddress });
      logGasUsed('updateParameter', txRes.gasUsed);
      let value = await instance.methods.getParameter(0, 1).call();      
      assert.equal(value, 34750); //pphm
      value = await instance.methods.getParameter(0, 2).call();      
      assert.equal(value, 34752); //pphm      
    });    
  });

  describe('Application Management Tests', async () => {
    it('Application can add itself', async () => {
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application1.updatedName), application1.rewardsAddress, application1.sidechainAddress).send({ from: application1.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['0']).toLowerCase(),String(application1.account).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['1']).toLowerCase(),'0');
      assert.equal(web3.toUtf8(String(txRes.events['EntityUpdated'].returnValues['2']).toLowerCase()),String(application1.updatedName).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['3']).toLowerCase(),String(application1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['4']).toLowerCase(),String(application1.sidechainAddress).toLowerCase());

      //add the other applications needed for testing
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application2.name), application2.rewardsAddress, application2.sidechainAddress).send({ from: application2.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application3.name), application3.rewardsAddress, application3.sidechainAddress).send({ from: application3.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application4.name), application4.rewardsAddress, application4.sidechainAddress).send({ from: application4.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
    });
    
    it('Application must have valid addresses', async () => {
      try {
        expect(await instance.methods.updateEntity(0,web3.fromAscii(application2.name), '0x0', application2.sidechainAddress).send({ from: application2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }

      try {
        expect(await instance.methods.updateEntity(0,web3.fromAscii(application2.name),  application2.rewardsAddress, '0x0').send({ from: application2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Application can update itself', async () => {
      txRes = await instance.methods.updateEntity(0,web3.fromAscii(application1.name), application1.rewardsAddress, application1.sidechainAddress).send({ from: application1.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['0']).toLowerCase(),String(application1.account).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['1']).toLowerCase(),'0');
      assert.equal(web3.toUtf8(String(txRes.events['EntityUpdated'].returnValues['2']).toLowerCase()),String(application1.name).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['3']).toLowerCase(),String(application1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['4']).toLowerCase(),String(application1.sidechainAddress).toLowerCase());
    });

    it('Active applications list cannot be updated by non-controller', async () => {
      try {        
        expect(await instance.methods.setApplications(1, [application1.account, application2.account]).send({ from: application2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });

    it('Active applications list will fail if an app does not yet exist', async () => {
      try {        
        expect(await instance.methods.setApplications(1, [application1.account, application2.account, application5.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Active applications list can be updated by controller', async () => {
      txRes = await instance.methods.setApplications(1, [application1.account, application2.account, application3.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') });
      logGasUsed('setApplications', txRes.gasUsed);
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account, application3.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),'1');      
    });

    it('Active applications list can be updated for next day by controller', async () => {
      txRes = await instance.methods.setApplications(2, [application1.account, application2.account, application4.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') });
      logGasUsed('setApplications', txRes.gasUsed);
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account, application4.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),'2');      
    });

    it('Correctly retrieve applications list based on rewards day', async () => {        
      let value = await instance.methods.getEntities(0, 1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application3.account]);
      value = await instance.methods.getEntities(0, 2).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application4.account]);
    });

    it('Active applications list can be updated for next day again with different count of applications by controller', async () => {
      txRes = await instance.methods.setApplications(2, [application1.account, application2.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') });
      logGasUsed('setApplications', txRes.gasUsed);
      assert.deepEqual(txRes.events['ApplicationsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[application1.account, application2.account]);
      assert.equal(String(txRes.events['ApplicationsListUpdated'].returnValues['1']).toLowerCase(),'2');      
    });

    it('Correctly retrieve applications list based on rewards day after second update', async () => {        
      let value = await instance.methods.getEntities(0, 1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account, application3.account]);
      value = await instance.methods.getEntities(0, 2).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [application1.account, application2.account]);
    });
  });

  describe('Validator Management Tests', async () => {
    it('Validator can add itself', async () => {
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator1.updatedName), validator1.rewardsAddress, validator1.sidechainAddress).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['0']).toLowerCase(),String(validator1.account).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['1']).toLowerCase(),'1');
      assert.equal(web3.toUtf8(String(txRes.events['EntityUpdated'].returnValues['2']).toLowerCase()),String(validator1.updatedName).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['3']).toLowerCase(),String(validator1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['4']).toLowerCase(),String(validator1.sidechainAddress).toLowerCase());
      //add the other validators needed for testing
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator2.name), validator2.rewardsAddress, validator2.sidechainAddress).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator3.name), validator3.rewardsAddress, validator3.sidechainAddress).send({ from: validator3.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator4.name), validator4.rewardsAddress, validator4.sidechainAddress).send({ from: validator4.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
    });
    
    it('Validator must have valid addresses', async () => {
      try {
        expect(await instance.methods.updateEntity(1,web3.fromAscii(validator2.name), '0x0', validator2.sidechainAddress).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }

      try {
        expect(await instance.methods.updateEntity(1,web3.fromAscii(validator2.name),  validator2.rewardsAddress, '0x0').send({ from: validator2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Validator can update itself', async () => {
      txRes = await instance.methods.updateEntity(1,web3.fromAscii(validator1.name), validator1.rewardsAddress, validator1.sidechainAddress).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('updateEntity', txRes.gasUsed);
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['0']).toLowerCase(),String(validator1.account).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['1']).toLowerCase(),'1');
      assert.equal(web3.toUtf8(String(txRes.events['EntityUpdated'].returnValues['2']).toLowerCase()),String(validator1.name).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['3']).toLowerCase(),String(validator1.rewardsAddress).toLowerCase());
      assert.equal(String(txRes.events['EntityUpdated'].returnValues['4']).toLowerCase(),String(validator1.sidechainAddress).toLowerCase());
    });

    it('Active validators list cannot be updated by non-controller', async () => {
      try {        
        expect(await instance.methods.setValidators(1, [validator1.account, validator2.account]).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });

    it('Active validators list will fail if an app does not yet exist', async () => {
      try {
        
        expect(await instance.methods.setValidators(1, [validator1.account, validator2.account, validator5.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Active validators list can be updated by controller', async () => {
      txRes = await instance.methods.setValidators(1, [validator1.account, validator2.account, validator3.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') });
      logGasUsed('setValidators', txRes.gasUsed);
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account, validator3.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),'1');      
    });

    it('Active validators list can be updated for next day by controller', async () => {
      txRes = await instance.methods.setValidators(2, [validator1.account, validator2.account, validator4.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') });
      logGasUsed('setValidators', txRes.gasUsed);
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account, validator4.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),'2');      
    });

    it('Correctly retrieve validators list based on rewards day', async () => {        
      let value = await instance.methods.getEntities(1, 1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator3.account]);
      value = await instance.methods.getEntities(1, 2).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator4.account]);
    });

    it('Active validators list can be updated for next day again with different count of validators by controller', async () => {
      txRes = await instance.methods.setValidators(2, [validator1.account, validator2.account, validator3.account, validator4.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') });
      logGasUsed('setValidators', txRes.gasUsed);
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account, validator2.account, validator3.account, validator4.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),'2');      
    });

    it('Correctly retrieve validators list based on rewards day after second update', async () => {        
      let value = await instance.methods.getEntities(1, 1).call();      
      assert.deepEqual(value.map(function(item) { return item.toLowerCase()}), [validator1.account, validator2.account, validator3.account]);
      value = await instance.methods.getEntities(1, 2).call();      
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

    const day1SelectedValidators = [validator1, validator2, validator3];    
    const day1ValidApplicationRewardsHash = soliditySha3(1, validApplicationRewards.applications.length, validApplicationRewards.amounts.length, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const day2ValidApplicationRewardsHash = soliditySha3(2, validApplicationRewards.applications.length, validApplicationRewards.amounts.length, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const day3ValidApplicationRewardsHash = soliditySha3(3, validApplicationRewards.applications.length, validApplicationRewards.amounts.length, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const day4ValidApplicationRewardsHash = soliditySha3(4, validApplicationRewards.applications.length, validApplicationRewards.amounts.length, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const day5ValidApplicationRewardsHash = soliditySha3(5, validApplicationRewards.applications.length, validApplicationRewards.amounts.length, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const day6ValidApplicationRewardsHash = soliditySha3(6, validApplicationRewards.applications.length, validApplicationRewards.amounts.length, formatArrayForSha3(validApplicationRewards.applications, 'address'), formatArrayForSha3(validApplicationRewards.amounts, 'uint256'));
    const exceedMaxApplicationRewardsHash = soliditySha3(1, exceedMaxApplicationRewards.applications.length, exceedMaxApplicationRewards.amounts.length, formatArrayForSha3(exceedMaxApplicationRewards.applications, 'address'), formatArrayForSha3(exceedMaxApplicationRewards.amounts, 'uint256'));
    const nonExistentAppApplicationRewardsHash = soliditySha3(1, nonExistentAppApplicationRewards.applications.length, nonExistentAppApplicationRewards.amounts.length, formatArrayForSha3(nonExistentAppApplicationRewards.applications, 'address'), formatArrayForSha3(nonExistentAppApplicationRewards.amounts, 'uint256'));
    const appExistsButNotInListApplicationRewardsHash = soliditySha3(1, appExistsButNotInListApplicationRewards.applications.length, appExistsButNotInListApplicationRewards.amounts.length, formatArrayForSha3(appExistsButNotInListApplicationRewards.applications, 'address'), formatArrayForSha3(appExistsButNotInListApplicationRewards.amounts, 'uint256'));

    it('Reward hash must match submitted data', async () => {  
      try {
        expect(await instance.methods.submitDailyRewards(1, exceedMaxApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Validator on the list cannot submit valid data if day has not ended', async() => {
      try {
        expect(await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }            
    });

    it('Validator on the list can submit valid data for yesterday', async() => {
      console.log(`will wait for ${rewardsDayInfo.secondsLeft} seconds before submitting day 1`);
      let result = await waitUntil(() => {
        rewardsDayInfo = calcRewardsDay();
        return rewardsDayInfo.rewardsDay == 2;
      }, 90000, 1000);
      txRes = await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),day1ValidApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator1.account).toLowerCase());      
    });

    it('Validator not on the list cannot submit', async () => {  
      try {
        
        expect(await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator4.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Validator cannot submit more than once', async () => {  
      try {
        
        expect(await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });

    it('Reaching Validator majority with non existent application is rejected', async() => {
      // get current props balances for rewarded applications      
      txRes = await instance.methods.submitDailyRewards(1, nonExistentAppApplicationRewardsHash, nonExistentAppApplicationRewards.applications, nonExistentAppApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),nonExistentAppApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator1.account).toLowerCase());
      try {
        expect(txRes = await instance.methods.submitDailyRewards(1, nonExistentAppApplicationRewardsHash, nonExistentAppApplicationRewards.applications, nonExistentAppApplicationRewards.amounts).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error)
      }
      catch (error) {
        //
      }      
       
    });

    it('Reaching Validator majority with existing application but not on list is rejected', async() => {
      // get current props balances for rewarded applications      
      txRes = await instance.methods.submitDailyRewards(1, appExistsButNotInListApplicationRewardsHash, appExistsButNotInListApplicationRewards.applications, appExistsButNotInListApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),appExistsButNotInListApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator1.account).toLowerCase());
      try {
        expect(txRes = await instance.methods.submitDailyRewards(1, appExistsButNotInListApplicationRewardsHash, appExistsButNotInListApplicationRewards.applications, appExistsButNotInListApplicationRewards.amounts).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error)
      }
      catch (error) {
        //
      }             
    });

    it('Reaching Validator majority with amount that exceeds allowed is rejected', async() => {
      txRes = await instance.methods.submitDailyRewards(1, exceedMaxApplicationRewardsHash, exceedMaxApplicationRewards.applications, exceedMaxApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });      
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),exceedMaxApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator1.account).toLowerCase());
      try {
        expect(txRes = await instance.methods.submitDailyRewards(1, exceedMaxApplicationRewardsHash, exceedMaxApplicationRewards.applications, exceedMaxApplicationRewards.amounts).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error)
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
      txRes = await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') });      
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),day1ValidApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator2.account).toLowerCase());
      // expect DailyRewardsApplicationsMinted
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['0']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['1']).toLowerCase(),day1ValidApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['2']).toLowerCase(),String(validApplicationRewards.applications.length));
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['3']).toLowerCase(),BigNumber.sum.apply(null, validApplicationRewards.amounts).toString());
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

    it('Reaching All Validators submitted mints rewards for validators', async() => {
      const expectedValidatorRewardsAmountPerValidator = (new BigNumber(maxTotalSupply)).minus(currentTotalSupply).times(1829).div(1e8).div(day1SelectedValidators.length).integerValue(BigNumber.ROUND_DOWN);      
      const expectedValidatorRewardsAmountSum = expectedValidatorRewardsAmountPerValidator.times(day1SelectedValidators.length);
      const validator1Balance = (await instance.methods.balanceOf(validator1.rewardsAddress).call());
      const validator2Balance = (await instance.methods.balanceOf(validator2.rewardsAddress).call());
      const validator3Balance = (await instance.methods.balanceOf(validator3.rewardsAddress).call());      
      txRes = await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator3.account, gas: utils.gasLimit('rewardtest') });      
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      // exepct DailyRewardsSubmitted
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['0']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['1']).toLowerCase(),day1ValidApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsSubmitted'].returnValues['2']).toLowerCase(),String(validator3.account).toLowerCase());
      // expect no DailyRewardsApplicationsMinted event
      assert.equal('DailyRewardsApplicationsMinted' in txRes.events, false);      
      // expect DailyRewardsValidatorsMinted
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['0']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['1']).toLowerCase(),day1ValidApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['2']).toLowerCase(),String(day1SelectedValidators.length));
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['3']).toLowerCase(),expectedValidatorRewardsAmountSum.toString());      
      // expect validators balances to change
      const newValidator1Balance = (await instance.methods.balanceOf(validator1.rewardsAddress).call());
      const newValidator2Balance = (await instance.methods.balanceOf(validator2.rewardsAddress).call());
      const newValidator3Balance = (await instance.methods.balanceOf(validator3.rewardsAddress).call());
      assert.equal(newValidator1Balance, BigNumber.sum(validator1Balance, expectedValidatorRewardsAmountPerValidator));
      assert.equal(newValidator2Balance, BigNumber.sum(validator2Balance, expectedValidatorRewardsAmountPerValidator));
      assert.equal(newValidator3Balance, BigNumber.sum(validator3Balance, expectedValidatorRewardsAmountPerValidator));
    });

    it('Trying to submit for the same day after daily rewards were reset by all validator', async() => {
      try {
        expect(txRes = await instance.methods.submitDailyRewards(1, day1ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error)
      }
      catch (error) {
        //
      }            
    });

    it(`Submitting next day rewards before 24 hours (using ${secondsBetweenDailyRewards} in test) is rejected`, async() => {      
      try {
        expect(txRes = await instance.methods.submitDailyRewards(2, day2ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') })).to.be.rejectedWith(Error)
      }
      catch (error) {
        //
      }             
    });

    it('Submitting next day rewards when not all validators submitted will give the submitting validators from yesterdays their rewards using the new validator reward percent param', async() => {
      rewardsDayInfo = calcRewardsDay();
      console.log(`will wait for ${rewardsDayInfo.secondsLeft} seconds before submitting day 2`);
      let result = await waitUntil(() => {
        rewardsDayInfo = calcRewardsDay();
        return rewardsDayInfo.rewardsDay == 3;
      }, 90000, 1000);
      // process.stdout.clearLine();
      // process.stdout.cursorTo(0);

      // get current total supply before minting tomorrow
      currentTotalSupply = await instance.methods.totalSupply().call();
      
      txRes = await instance.methods.submitDailyRewards(2, day2ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      txRes = await instance.methods.submitDailyRewards(2, day2ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      txRes = await instance.methods.submitDailyRewards(2, day2ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator3.account, gas: utils.gasLimit('rewardtest') });
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      assert.equal(String(txRes.events['DailyRewardsApplicationsMinted'].returnValues['0']).toLowerCase(),'2');
      // expect no DailyRewardsValidatorsMinted event        
      assert.equal('DailyRewardsValidatorsMinted' in txRes.events, false);
      // application rewards were given here now submit for next day
      rewardsDayInfo = calcRewardsDay();
      console.log(`Submitted for day 2 will wait for ${rewardsDayInfo.secondsLeft} seconds beofre day 3`);
      result = await waitUntil(() => {
        rewardsDayInfo = calcRewardsDay();
        return rewardsDayInfo.rewardsDay == 4;
      }, 90000, 1000);
      // process.stdout.clearLine();
      // process.stdout.cursorTo(0);

      txRes = await instance.methods.submitDailyRewards(3, day3ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });      
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      // expect no DailyRewardsApplicationsMinted event
      assert.equal('DailyRewardsApplicationsMinted' in txRes.events, false);
      assert.equal('DailyRewardsValidatorsMinted' in txRes.events, true);
      // expect DailyRewardsValidatorsMinted for tomorrowTimestamp for only 3 validators out of 4
      const expectedValidatorRewardsAmountPerValidator = (new BigNumber(maxTotalSupply)).minus(currentTotalSupply).times(1830).div(1e8).div(3).integerValue(BigNumber.ROUND_DOWN);      
      const expectedValidatorRewardsAmountSum = expectedValidatorRewardsAmountPerValidator.times(3);      
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['0']).toLowerCase(),'2');
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['1']).toLowerCase(),day2ValidApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['2']).toLowerCase(),'3');
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['3']).toLowerCase(),expectedValidatorRewardsAmountSum.toString());         
    });

    it('App rewards and validator rewards work with 1 validator', async() => {
      txRes = await instance.methods.setValidators(4, [validator1.account]).send({ from: newControllerAddress, gas: utils.gasLimit('rewardtest') });
      logGasUsed('setValidators', txRes.gasUsed);
      assert.deepEqual(txRes.events['ValidatorsListUpdated'].returnValues['0'].map(function(item) { return item.toLowerCase()}),[validator1.account]);
      assert.equal(String(txRes.events['ValidatorsListUpdated'].returnValues['1']).toLowerCase(),'4');      
      // finish day 2
      txRes = await instance.methods.submitDailyRewards(3, day3ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator2.account, gas: utils.gasLimit('rewardtest') });      
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      txRes = await instance.methods.submitDailyRewards(3, day3ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator3.account, gas: utils.gasLimit('rewardtest') });      
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      assert.equal('DailyRewardsApplicationsMinted' in txRes.events, true);
      txRes = await instance.methods.submitDailyRewards(3, day3ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator4.account, gas: utils.gasLimit('rewardtest') });      
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      assert.equal('DailyRewardsApplicationsMinted' in txRes.events, false);
      assert.equal('DailyRewardsValidatorsMinted' in txRes.events, true);
      currentTotalSupply = await instance.methods.totalSupply().call();
      console.log(`will wait for ${rewardsDayInfo.secondsLeft} seconds before submitting day 4`);      
      let result = await waitUntil(() => {
        rewardsDayInfo = calcRewardsDay();
        return rewardsDayInfo.rewardsDay == 5;
      }, 90000, 1000);
      // process.stdout.clearLine();
      // process.stdout.cursorTo(0);
      
      txRes = await instance.methods.submitDailyRewards(4, day4ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });      
      logGasUsed('submitDailyRewards', txRes.gasUsed);
      // expect both applications and validators to be minted
      assert.equal('DailyRewardsApplicationsMinted' in txRes.events, true);
      assert.equal('DailyRewardsValidatorsMinted' in txRes.events, true);            
      const expectedValidatorRewardsAmountSum = (new BigNumber(maxTotalSupply)).minus(currentTotalSupply).times(1830).div(1e8).integerValue(BigNumber.ROUND_DOWN);            
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['0']).toLowerCase(),'4');
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['1']).toLowerCase(),day4ValidApplicationRewardsHash.toLowerCase());      
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['2']).toLowerCase(),'1');
      assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['3']).toLowerCase(),expectedValidatorRewardsAmountSum.toString());        
    });

    // it('App rewards and validator rewards work after a gap in the days', async() => {      
    //   console.log(`will wait for ${rewardsDayInfo.secondsLeft*2} seconds before submitting day 6`);      
    //   let result = await waitUntil(() => {
    //     rewardsDayInfo = calcRewardsDay();
    //     return rewardsDayInfo.rewardsDay == 6;
    //   }, 90000, 1000);
    //   // process.stdout.clearLine();
    //   // process.stdout.cursorTo(0);
    //   currentTotalSupply = await instance.methods.totalSupply().call();
    //   txRes = await instance.methods.submitDailyRewards(6, day6ValidApplicationRewardsHash, validApplicationRewards.applications, validApplicationRewards.amounts).send({ from: validator1.account, gas: utils.gasLimit('rewardtest') });      
    //   logGasUsed('submitDailyRewards', txRes.gasUsed);
    //   // expect both applications and validators to be minted
    //   assert.equal('DailyRewardsApplicationsMinted' in txRes.events, true);
    //   assert.equal('DailyRewardsValidatorsMinted' in txRes.events, true);            
    //   const expectedValidatorRewardsAmountSum = (new BigNumber(maxTotalSupply)).minus(currentTotalSupply).times(1830).div(1e8).integerValue(BigNumber.ROUND_DOWN);            
    //   assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['0']).toLowerCase(),'6');
    //   assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['1']).toLowerCase(),day5ValidApplicationRewardsHash.toLowerCase());      
    //   assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['2']).toLowerCase(),'1');
    //   assert.equal(String(txRes.events['DailyRewardsValidatorsMinted'].returnValues['3']).toLowerCase(),expectedValidatorRewardsAmountSum.toString());        
    // });
  });
  after(async () => {
    gasSummary();
  });
  
});

 
