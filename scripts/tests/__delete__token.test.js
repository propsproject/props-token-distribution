/* eslint-disable func-names */
/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
// Required by zos-lib when running from truffle
import { TestHelper } from 'zos';

global.artifacts = artifacts;
global.web3 = web3;

const PropsToken = artifacts.require('PropsToken');
const creatorAddress = web3.eth.accounts[1];
const initializerAddress = web3.eth.accounts[2];
const tokenHolderAddress = web3.eth.accounts[3];
const timestamp = Math.floor(Date.now() / 1000);

contract('PropsToken', ([_, owner]) => {
  beforeEach(async function () {
    this.project = await TestHelper({ from: owner });
  });

  it('should create a proxy', async function () {
    const proxy = await this.project.createProxy(PropsToken, { initArgs: [tokenHolderAddress, timestamp] });
    const result = await proxy.name();
    result.should.eq('DEV_Token');
  });
});
