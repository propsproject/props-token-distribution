/*
------------------------------------------------------------------
This file tests the following propstoken contract functionalities:
1. ERC20 Basics
2. Transfer Start Time
3. ERC865
------------------------------------------------------------------
*/
/* eslint-disable no-mixed-operators */
/* eslint-disable no-unused-vars */
/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable prefer-destructuring */
global.timestamp = Math.floor(Date.now() / 1000) + 20; // now + 60 seconds to allow for further testing when not allowed
// const { default: BigNumber__ } = require('BigNumber.js');
const waitUntil = require('async-wait-until');
const ethUtil = require('ethereumjs-util');
const main = require('../scripts/tests/index.js').main;
const utils = require('../scripts_utils/utils');
const { assert } = require('chai');
//const { soliditySha3 } = require('web3-utils');
const { keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack, hexlify } = require('ethers').utils;
const { BigNumber } = require('ethers');
const { MaxUint256 } = require('ethers').constants;

const formattedAddress = address => Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
const formattedInt = int => ethUtil.setLengthLeft(int, 32);
const formattedBytes32 = bytes => ethUtil.addHexPrefix(bytes.toString('hex'));
const hashedTightPacked = args => ethUtil.sha3(Buffer.concat(args));


const getApprovalDigest = async (name, address, approvalObj, nonce, deadline, chainId) => {
  const DOMAIN_SEPARATOR = getDomainSeparator(name, address, chainId);
  const permitTypeHash = await instance.methods.PERMIT_TYPEHASH().call();
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [permitTypeHash, approvalObj.owner, approvalObj.spender, BigNumber.from(approvalObj.value), BigNumber.from(nonce), BigNumber.from(deadline)]
          )
        )
      ]
    )
  )
}


const getDomainSeparator = function (name, tokenAddress, chainId) {
  return keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
        keccak256(toUtf8Bytes(name)),
        keccak256(toUtf8Bytes('1')),
        chainId,
        tokenAddress
      ]
    )
  )
}

let instance;
contract('main', (_accounts) => {
  before(async () => {
    instance = await main();
  });

  describe('Basic Setup Test', async () => {
    const controllerAddress = _accounts[2];
    const newControllerAddress = _accounts[4];

    it('Name should be correct', async () => {
      const name = await instance.methods.name().call();
      assert.equal(name, 'Props Token');
    });

    it('Symbol should be correct', async () => {
      const symbol = await instance.methods.symbol().call();
      assert.equal(symbol, 'PROPS');
    });

    it('Decimals is correct', async () => {
      const decimals = await instance.methods.decimals().call();
      assert.equal(decimals, 18);
    });

    it('Total Supply is correct', async () => {
      const totalSupply = BigNumber.from(web3.fromWei(await instance.methods.totalSupply().call()));
      const expectedTotalSupply = BigNumber.from(0.6 * (10 ** 9));      
      assert.equal(totalSupply.toString(), expectedTotalSupply.toString());      
    });

    it('Total Supply owned by tokenHolder', async () => {
      const totalSupply = BigNumber.from(await instance.methods.totalSupply().call());
      const tokenHolderBalance = BigNumber.from(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
      assert.equal(totalSupply.toString(), tokenHolderBalance.toString());      
    });    

    it('Max Supply is properly set', async () => {      
      maxTotalSupply = (await instance.methods.maxTotalSupply().call());
      assert.equal(String(web3.fromWei(maxTotalSupply)), "1000000000");
    });  
  });

  describe('Controller Tests', async () => {
    const controllerAddress = _accounts[2];
    const newControllerAddress = _accounts[4];

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
  });


  describe('ERC20 Tests', async () => {
    const amount = 100000;
    let newTransferrerBalance;
    let newReceiverBalance;
    let transferResult;
    it('Transfer works and event is emitted', async () => {
      const transferrerBalance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
      const receiverBalance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[4]).call());
      transferResult = await instance.methods.transfer(web3.eth.accounts[4], web3.toWei(amount)).send({ from: web3.eth.accounts[3] });
      newTransferrerBalance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[3]).call());
      newReceiverBalance = web3.fromWei(await instance.methods.balanceOf(web3.eth.accounts[4]).call());
      assert.equal(Number(newTransferrerBalance), Number(transferrerBalance) - Number(amount));
      assert.equal(Number(newReceiverBalance), Number(receiverBalance) + Number(amount));
    });

    it('Transfer Event Emitted', async () => {
      assert.equal(String(transferResult.events['Transfer'].returnValues['1']).toLowerCase(),String(web3.eth.accounts[4]).toLowerCase());
      assert.equal(String(transferResult.events['Transfer'].returnValues['0']).toLowerCase(),String(web3.eth.accounts[3]).toLowerCase());
      assert.equal(Number(web3.fromWei(transferResult.events['Transfer'].returnValues['2'])), amount);      
    });
  });

  describe('Uniswap Permit Tests', async () => {

    let txRes, bobBalance, damienBalance, aliceBalance;
    const bob = { address: web3.eth.accounts[8], pk: 'f34381274ac5cca8a465209bdeafeed0274ddcf7ba1df080df772b73ccad032a' };      
    const damien = { address: web3.eth.accounts[7], pk: 'c79b0f20fac88d078d1ab0908fcafb31708e83a46fabfe7601d5b0d7bd5b2974' };
    const alice = { address: web3.eth.accounts[9], pk: '5027f6ea1ab6cd9fe2bc5c2bbb07d5ec77524529964aafe0d02a76aabaa4917f' };
    const amount = 1000;

    it('PERMIT_TYPEHASH is correct', async () => {
      const permitTypeHash = await instance.methods.PERMIT_TYPEHASH().call();
      assert.equal(permitTypeHash, keccak256(toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')));
    });

    it('DOMAIN_SEPARATOR is correct', async () => {
      const domainSeparator = await instance.methods.DOMAIN_SEPARATOR().call();
      const name = await instance.methods.name().call();
      const chainId = await instance.methods.MY_CHAIN_ID().call();      
      const expectedResult = getDomainSeparator(name, instance.address, chainId);      
      assert.equal(domainSeparator, expectedResult);
    });    

    // in this scenario we have damien and bob funded with 1000 tokens
    // damien is allowing bob to transfer half of this amount from his (damien) wallet
    it('Permit works', async () => {      
      const name = await instance.methods.name().call();
      const chainId = await instance.methods.MY_CHAIN_ID().call();      
      const tokenHolderAddress = web3.eth.accounts[3];      
      const nonce = await instance.methods.nonces(damien.address).call();      
      await instance.methods.transfer(bob.address, web3.toWei(amount)).send({ from:  tokenHolderAddress});
      await instance.methods.transfer(damien.address, web3.toWei(amount)).send({ from:  tokenHolderAddress});      
      const deadline = MaxUint256
      // console.log(`getApprovalDigest(${name}),${instance.address},{${damien.address},${bob.address},${web3.toWei(amount/2)}}, ${nonce}, ${deadline}`);
      const digest = await getApprovalDigest(name, instance.address, 
        { owner: damien.address, spender: bob.address, value: web3.toWei(amount / 2) },
        nonce,
        deadline,
        chainId
      )
  
      const { v, r, s } = ethUtil.ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(damien.pk, 'hex'))
      try {
        txRes = await instance.methods.permit(damien.address, bob.address, web3.toWei(amount / 2), deadline, v, hexlify(r), hexlify(s)).send({ from: damien.address});
      } catch (error) {
        console.log(`Permit tx failed:${error}`);
        //
      }
      // await expect(token.permit(damien.address, bob.address, amount/2, deadline, v, hexlify(r), hexlify(s)))
      //   .to.emit(token, 'Approval')
      //   .withArgs(wallet.address, other.address, TEST_AMOUNT)
      const allowanceDamien = web3.fromWei(await instance.methods.allowance(damien.address, bob.address).call());
      const nonceDamien = await instance.methods.nonces(damien.address).call();
      // console.log(`allowanceDamien:${allowanceDamien}`);
      // console.log(`nonceDamien:${nonceDamien}`);
      assert.equal(allowanceDamien, String(amount / 2));
      assert.equal(nonceDamien,'1');      
    });
    
    it('Approval Event Emitted', async () => {
      //Approval
      assert.equal(String(txRes.events['Approval'].returnValues['1']).toLowerCase(),String(bob.address).toLowerCase());
      assert.equal(String(txRes.events['Approval'].returnValues['0']).toLowerCase(),String(damien.address).toLowerCase());
      assert.equal(Number(web3.fromWei(txRes.events['Approval'].returnValues['2'])), String(amount/2));      
    });

    // this scenario follows up on the permit function above
    // damien allowed bob to transfer up {amount/2} tokens bob is now transferring 
    it('TranferFrom fail if trying to transfer more than allowed', async () => {            
      try {
        expect(await instance.methods.transferFrom(damien.address, alice.address, web3.toWei(amount + 1)).send({ from: bob.address })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }      
    });
    // this scenario follows up on the permit function above
    // damien allowed bob to transfer up {amount/2} tokens bob is now transferring 
    it('Can use tranferFrom after permit with amount <= allowed', async () => {
      bobBalance = web3.fromWei(await instance.methods.balanceOf(bob.address).call());
      damienBalance = web3.fromWei(await instance.methods.balanceOf(damien.address).call());
      aliceBalance = web3.fromWei(await instance.methods.balanceOf(alice.address).call());      
      const oldBobBalance = bobBalance;
      const oldDamienBalance = damienBalance;
      const oldAliceBalance = aliceBalance;
      const txRes = await instance.methods.transferFrom(damien.address, alice.address, web3.toWei(amount / 2)).send({ from: bob.address });
      // console.log(`transferFrom event? ${JSON.stringify(txRes.events['Transfer'].returnValues)}`);      
      bobBalance = web3.fromWei(await instance.methods.balanceOf(bob.address).call());
      damienBalance = web3.fromWei(await instance.methods.balanceOf(damien.address).call());
      aliceBalance = web3.fromWei(await instance.methods.balanceOf(alice.address).call());      
      assert.equal(Number(aliceBalance), Number(oldAliceBalance) + (amount / 2));
      assert.equal(Number(bobBalance), Number(oldBobBalance));
      assert.equal(Number(damienBalance), Number(oldDamienBalance) - (amount / 2));
    });
  });  
  
  describe('Reclaim Contract Tokens', async () => {
    const amount = 1000;
    let controllerBalance, transferResult, contractBalance, randomWalletBalance, controllerAddress;    
    const tokenHolderAddress = web3.eth.accounts[3];
    const randomWalletAddress = web3.eth.accounts[5];
    it('Contract address can receive tokens', async () => {
      controllerAddress = await instance.methods.controller().call(); // web3.eth.accounts[2];
      controllerBalance = web3.fromWei(await instance.methods.balanceOf(controllerAddress).call());
      transferResult = await instance.methods.transfer(instance.address, web3.toWei(amount)).send({ from:  tokenHolderAddress});
      contractBalance = web3.fromWei(await instance.methods.balanceOf(instance.address).call());      
      assert.equal(String(contractBalance), String(amount));      
    });

    it('Cannot be reclaimed by non controller', async () => {
      try {
        expect(await instance.methods.reclaimToken(instance.address, controllerAddress, web3.toWei(amount)).send({ from: randomWalletAddress })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });

    it('Amount reclaimed cannot exceed balance', async () => {
      try {
        expect(await instance.methods.reclaimToken(instance.address, randomWalletAddress, web3.toWei(amount + 10)).send({ from: controllerAddress })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });

    it('Reclaim works if done by controller', async () => {
      const reclaimResult = await instance.methods.reclaimToken(instance.address, randomWalletAddress, web3.toWei(amount)).send({ from: controllerAddress })
      randomWalletBalance = web3.fromWei(await instance.methods.balanceOf(randomWalletAddress).call());      
      contractBalance = web3.fromWei(await instance.methods.balanceOf(instance.address).call());
      assert.equal(String(randomWalletBalance), String(amount));
      assert.equal(String(contractBalance), "0");      
    });    
  });

  describe('Minter role test', async () => {
    const amount = 1000;
    let controllerBalance, transferResult, contractBalance, randomWalletBalance, prevRandomWalletBalance, controllerAddress;    
    const tokenHolderAddress = web3.eth.accounts[3];
    const randomWalletAddress = web3.eth.accounts[8];
    const minderAddress = web3.eth.accounts[4];
    it('Contract address can receive tokens', async () => {
      controllerAddress = await instance.methods.controller().call(); // web3.eth.accounts[2];
      controllerBalance = web3.fromWei(await instance.methods.balanceOf(controllerAddress).call());
      prevRandomWalletBalance = web3.fromWei(await instance.methods.balanceOf(randomWalletAddress).call());
      transferResult = await instance.methods.transfer(instance.address, web3.toWei(amount)).send({ from:  tokenHolderAddress});
      contractBalance = web3.fromWei(await instance.methods.balanceOf(instance.address).call());      
      assert.equal(String(contractBalance), String(amount));      
    });

    it('Cannot mint by non minter address', async () => {
      try {
        expect(await instance.methods.mint(randomWalletAddress, web3.toWei(amount)).send({ from: randomWalletAddress })).to.be.rejectedWith(Error);
      } catch (error) {
        //
      }
    });

    it('Mint works by minter', async () => {
      await instance.methods.mint(randomWalletAddress, web3.toWei(amount)).send({ from: minderAddress })
      randomWalletBalance = web3.fromWei(await instance.methods.balanceOf(randomWalletAddress).call());            
      assert.equal(String(randomWalletBalance), String(Number(amount)+Number(prevRandomWalletBalance)));
    });    
  });
});
