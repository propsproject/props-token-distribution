const helpers = require('./helpers');
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
const PropsCrowdsale = artifacts.require('./helpers/PropsCrowdsaleImpl.sol')

contract('PropsCrowdsale', ([
  _,
  owner,
  attacker,
  alice,
  bob,
  charlie,
  zoe
]) => {

  before(async () => {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async () => {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.weeks(1);
    this.softCap = 0.5;
    this.hardCap = 1;

    this.token = await PropsToken.new({from: owner});

    this.crowdsale = await PropsCrowdsale.new(
      this.startTime,
      this.endTime,
      ether(this.softCap),
      ether(this.hardCap),
      owner,
      this.token.address,
      {from: owner}
    );

    await this.token.pause({from: owner});
    await this.token.transferOwnership(this.crowdsale.address, {from: owner});
  });

  describe('When the contract is deployed, it should', () => {
    it('have 0 registered users', async () => {
      let whitelistedUsersCount = await this.crowdsale.whitelistedUsersCount();
      whitelistedUsersCount.toNumber().should.equal(0);
    });
  });

  describe('As the owner,', () => {
    describe('before the crowdsale, I should be able to', () => {
      beforeEach(async () => {
        await timeTravelTo(this.startTime - duration.minutes(1));
        await this.crowdsale.addPhase(1, this.startTime, this.startTime+duration.hours(2), {from: owner});
      });
      it('add a new phase', async () => {
        await this.crowdsale.addPhase(2, this.startTime+duration.hours(2), this.startTime+duration.hours(10), {from: owner}).should.be.fulfilled;
      });
      it('update the cap of a phase', async () => {
        await this.crowdsale.updateDefaultCapForPhase(0, 3, {from: owner}).should.be.fulfilled;
      });
      it('override the cap of a user during a phase', async () => {
        await this.crowdsale.overrideCapForUserOnPhase(0, alice, 4, {from: owner}).should.be.fulfilled;
      });
      it('whitelist a new user', async () => {
        await this.crowdsale.addWhitelistedUser(alice, {from: owner}).should.be.fulfilled;
      });
      it('disable the whitelisting restriction', async () => {
        await this.crowdsale.setWhitelistedOnly(false, {from: owner}).should.be.fulfilled;
      });
      it('re-enable the whitelisting restriction', async () => {
        await this.crowdsale.setWhitelistedOnly(false, {from: owner}).should.be.fulfilled;
        await this.crowdsale.setWhitelistedOnly(true, {from: owner}).should.be.fulfilled;
      });
    });

    describe('when the crowdsale starts,', () => {
      beforeEach(async () => {
        await this.crowdsale.addPhase(1, this.startTime, this.startTime+duration.hours(2), {from: owner});
        await timeTravelTo(this.startTime + duration.minutes(1));
      });
      describe('I should be able to', () => {
        it('update the cap of a phase', async () => {
          await this.crowdsale.updateDefaultCapForPhase(0, 3, {from: owner}).should.be.fulfilled;
        });
        it('override the cap of a user during a phase', async () => {
          await this.crowdsale.overrideCapForUserOnPhase(0, alice, 4, {from: owner}).should.be.fulfilled;
        });
        it('disable the whitelisting restriction', async () => {
          await this.crowdsale.setWhitelistedOnly(false, {from: owner}).should.be.fulfilled;
        });
        it('re-enable the whitelisting restriction', async () => {
          await this.crowdsale.setWhitelistedOnly(false, {from: owner}).should.be.fulfilled;
          await this.crowdsale.setWhitelistedOnly(true, {from: owner}).should.be.fulfilled;
        });
        it('whitelist a new user', async () => {
          await this.crowdsale.addWhitelistedUser(alice, {from: owner}).should.be.fulfilled;
        });
      });
      describe('I should not be able to', () => {
        it('add a new phase', async () => {
          await this.crowdsale.addPhase(1, this.startTime, this.startTime+duration.hours(2), {from: owner}).should.be.rejectedWith(EVMThrow);
        });
      });
    });

    describe('when the crowdsale ends,', () => {
      describe('I should be able to', () => {
        it('get the funds of the crowdsale if the soft cap is reached at the end', async () => {
          await this.crowdsale.addWhitelistedUser(alice, {from: owner});
          await this.crowdsale.addPhase(ether(1), this.startTime, this.startTime+duration.hours(2), {from: owner});
          await timeTravelTo(this.startTime + duration.seconds(1));
          await buyTokens(this.crowdsale, alice, this.softCap).should.be.fulfilled;
          await timeTravelTo(this.endTime + duration.seconds(1));
          const balanceBefore = web3.eth.getBalance(owner);
          await this.crowdsale.finalize({from: owner});
          const balanceAfter = web3.eth.getBalance(owner);
          const gasApproximation = 0.01;
          const funds = balanceAfter.minus(balanceBefore).toNumber();
          const softCapMinusGas = ether(this.softCap-gasApproximation).toNumber()
          funds.should.be.above(softCapMinusGas);
        });
        it('get the funds of the crowdsale if the hard cap is reached anytime', async () => {
          await this.crowdsale.addWhitelistedUser(alice, {from: owner});
          await this.crowdsale.addPhase(ether(1), this.startTime, this.startTime+duration.hours(2), {from: owner});
          await timeTravelTo(this.startTime + duration.seconds(1));
          await buyTokens(this.crowdsale, alice, this.hardCap).should.be.fulfilled;
          const balanceBefore = web3.eth.getBalance(owner);
          await this.crowdsale.finalize({from: owner});
          const balanceAfter = web3.eth.getBalance(owner);
          const gasApproximation = 0.01;
          const funds = balanceAfter.minus(balanceBefore).toNumber();
          const hardCapMinusGas = ether(this.hardCap-gasApproximation).toNumber()
          funds.should.be.above(hardCapMinusGas);
        });
      });
      describe('I should not be able to', () => {
        it('get the funds of the crowdsale if the soft cap is not reached', async () => {
          await this.crowdsale.addWhitelistedUser(alice, {from: owner});
          await this.crowdsale.addPhase(ether(1), this.startTime, this.startTime+duration.hours(2), {from: owner});
          await timeTravelTo(this.startTime + duration.seconds(1));
          await buyTokens(this.crowdsale, alice, this.softCap-0.1);
          await timeTravelTo(this.endTime + duration.seconds(1));
          const balanceBefore = web3.eth.getBalance(owner).toNumber();
          await this.crowdsale.finalize({from: owner});
          const balanceAfter = web3.eth.getBalance(owner).toNumber();
          balanceBefore.should.be.above(balanceAfter);
        });
      });
    });
  });


  describe('As an attacker,', () => {
    describe('before the crowdsale, I should not be able to', () => {
      beforeEach(async () => {
        await timeTravelTo(this.startTime - duration.minutes(1));
        await this.crowdsale.addPhase(1, this.startTime, this.startTime+duration.hours(2), {from: owner});
      });
      it('add a new phase', async () => {
        await this.crowdsale.addPhase(2, this.startTime+duration.hours(2), this.startTime+duration.hours(10), {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
      it('update the cap of a phase', async () => {
        await this.crowdsale.updateDefaultCapForPhase(0, 3, {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
      it('override the cap of a user during a phase', async () => {
        await this.crowdsale.overrideCapForUserOnPhase(0, alice, 4, {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
      it('whitelist a new user', async () => {
        await this.crowdsale.addWhitelistedUser(alice, {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
      it('disable the whitelisting restriction', async () => {
        await this.crowdsale.setWhitelistedOnly(false, {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
    });

    describe('when the crowdsale starts, I should not be able to', () => {
      beforeEach(async () => {
        await timeTravelTo(this.startTime - duration.minutes(1));
        await this.crowdsale.addPhase(1, this.startTime, this.startTime+duration.hours(2), {from: owner});
      });
      it('add a new phase', async () => {
        await this.crowdsale.addPhase(2, this.startTime+duration.hours(2), this.startTime+duration.hours(10), {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
      it('update the cap of a phase', async () => {
        await this.crowdsale.updateDefaultCapForPhase(0, 3, {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
      it('override the cap of a user during a phase', async () => {
        await this.crowdsale.overrideCapForUserOnPhase(0, alice, 4, {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
      it('whitelist a new user', async () => {
        await this.crowdsale.addWhitelistedUser(alice, {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
      it('disable the whitelisting restriction', async () => {
        await this.crowdsale.setWhitelistedOnly(false, {from: attacker}).should.be.rejectedWith(EVMThrow);
      });
    });
  });

  describe('Considering Alice, Bob & Charlie as whitelisted investors,', () => {

    beforeEach(async () => {
      await this.crowdsale.addWhitelistedUser(alice, {from: owner});
      await this.crowdsale.addWhitelistedUser(bob, {from: owner});
      await this.crowdsale.addWhitelistedUser(charlie, {from: owner});
    });

    describe('before the crowdsale, no one should be able to', () => {
      beforeEach(async () => {
        await timeTravelTo(this.startTime - duration.minutes(1));
        await this.crowdsale.addPhase(1, this.startTime, this.startTime+duration.hours(2), {from: owner});
      });
      it('buy tokens', async () => {
        await buyTokens(this.crowdsale, alice, 0.1).should.be.rejectedWith(EVMThrow);
      });
    });

    describe('when the crowdsale starts,', () => {

      describe(`
        Scenario 1:
        Crowdsale capped to 1 ETH
        - Phase 1, [Oh; 2h], cap = 0.02 ETH/user
        - Phase 2, [2h; 4h], cap = 0.03 ETH/user
        - Phase 3, [4h; ∞h], cap = 0.04 ETH/user
        `, () => {

        beforeEach(async () => {
          await this.crowdsale.addPhase(ether(0.02), this.startTime, this.startTime+duration.hours(2), {from: owner});
          await this.crowdsale.addPhase(ether(0.03), this.startTime+duration.hours(2), this.startTime+duration.hours(4), {from: owner});
          await this.crowdsale.addPhase(ether(0.04), this.startTime+duration.hours(4), this.startTime+duration.days(7), {from: owner});
        });

        describe('During Phase 1,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.seconds(1));
          });

          describe('Alice should be able to', () => {
            it('send 0.01 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.01).should.be.fulfilled;
            });
            it('send 0.02 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.02).should.be.fulfilled;
            });
          });

          describe('Alice should not be able to', () => {
            it('send 0.03 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.03).should.be.rejectedWith(EVMThrow);
            });
          });

          describe('Zoe should not be able to', () => {
            it('send 0.01 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
            });
            it('send 0.1 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
            });
          });
        });

        describe('During Phase 2,', () => {
          describe('if Alice sent 0.02 ETH (cap reached) during Phase 1,', () => {
            beforeEach(async () => {
              await timeTravelTo(this.startTime + duration.seconds(1));
              await buyTokens(this.crowdsale, alice, 0.02);
              await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
            });
            describe('she should be able to', () => {
              it('send 0.005 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.005).should.be.fulfilled;
              });
              it('send 0.01 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.01).should.be.fulfilled;
              });
            });
            describe('she should not be able to', () => {
              it('send 0.015 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.015).should.be.rejectedWith(EVMThrow);
              });
            });
          });

          describe('if Alice sent 0.01 ETH (cap not reached) during Phase 1,', () => {
            beforeEach(async () => {
              await timeTravelTo(this.startTime + duration.seconds(1));
              await buyTokens(this.crowdsale, alice, 0.01);
              await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
            });
            describe('she should be able to', () => {
              it('send 0.01 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.01).should.be.fulfilled;
              });
              it('send 0.02 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.02).should.be.fulfilled;
              });
            });
            describe('she should not be able to', () => {
              it('send 0.025 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.025).should.be.rejectedWith(EVMThrow);
              });
            });
          });

          describe('Zoe should not be able to', () => {
            it('send 0.01 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
            });
            it('send 0.1 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
            });
          });
        });

        describe('During Phase 3,', () => {
          describe('if Alice sent 0.03 ETH (cap reached) during Phase 1 & 2,', () => {
            beforeEach(async () => {
              await timeTravelTo(this.startTime + duration.seconds(1));
              await buyTokens(this.crowdsale, alice, 0.02);
              await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
              await buyTokens(this.crowdsale, alice, 0.01);
              await timeTravelTo(this.startTime + duration.hours(4) + duration.seconds(1));
            });
            describe('she should be able to', () => {
              it('send 0.005 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.005).should.be.fulfilled;
              });
              it('send 0.01 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.01).should.be.fulfilled;
              });
            });
            describe('she should not be able to', () => {
              it('send 0.015 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.015).should.be.rejectedWith(EVMThrow);
              });
            });
          });

          describe('if Alice sent 0.02 ETH (cap not reached) during Phase 1 & 2,', () => {
            beforeEach(async () => {
              await timeTravelTo(this.startTime + duration.seconds(1));
              await buyTokens(this.crowdsale, alice, 0.01);
              await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
              await buyTokens(this.crowdsale, alice, 0.01);
              await timeTravelTo(this.startTime + duration.hours(4) + duration.seconds(1));
            });
            describe('she should be able to', () => {
              it('send 0.01 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.01).should.be.fulfilled;
              });
              it('send 0.02 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.02).should.be.fulfilled;
              });
            });
            describe('she should not be able to', () => {
              it('send 0.025 ETH', async () => {
                await buyTokens(this.crowdsale, alice, 0.025).should.be.rejectedWith(EVMThrow);
              });
            });
          });

          describe('Zoe should not be able to', () => {
            it('send 0.01 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
            });
            it('send 0.1 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
            });
          });
        });
      });
    });

    describe(`
      Scenario 2:
      Crowdsale capped to 1 ETH
      - Phase 1: [Oh; 2h], cap = 0.25 ETH/user
      - Phase 2: [2h; 4h], cap = 0.5 ETH/user
      - Phase 3: [4h; ∞h], cap = 1 ETH/user

      Alice wants to invest 2 ETH
      Bob wants to invest 0.5 ETH
      Charlie wants to invest 0.25 ETH
      `, () => {

      beforeEach(async () => {
        await this.crowdsale.addPhase(ether(0.25), this.startTime, this.startTime+duration.hours(2), {from: owner});
        await this.crowdsale.addPhase(ether(0.5), this.startTime+duration.hours(2), this.startTime+duration.hours(4), {from: owner});
        await this.crowdsale.addPhase(ether(1), this.startTime+duration.hours(4), this.startTime+duration.days(7), {from: owner});
      });

      describe('During Phase 1,', () => {
        beforeEach(async () => {
          await timeTravelTo(this.startTime + duration.seconds(1));
        });

        describe('Alice should be able to', () => {
          it('send 0.10 ETH', async () => {
            await buyTokens(this.crowdsale, alice, 0.1).should.be.fulfilled;
          });
          it('send 0.25 ETH', async () => {
            await buyTokens(this.crowdsale, alice, 0.25).should.be.fulfilled;
          });
        });

        describe('Alice should not be able to', () => {
          it('send 2 ETH', async () => {
            await buyTokens(this.crowdsale, alice, 2).should.be.rejectedWith(EVMThrow);
          });
        });

        describe('Zoe should not be able to', () => {
          it('send 0.01 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
          });
          it('send 0.1 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
          });
        });
      });

      describe('During Phase 2,', () => {
        describe('if Alice, Bob and Charlie reached their cap (0.75 ETH raised) during Phase 1,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.seconds(1));
            await buyTokens(this.crowdsale, alice, 0.25);
            await buyTokens(this.crowdsale, bob, 0.25);
            await buyTokens(this.crowdsale, charlie, 0.25);
            await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
          });

          describe('Alice should be able to', () => {
            it('send 0.1 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.1).should.be.fulfilled;
            });
            it('send 0.25 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.25).should.be.fulfilled;
            });
          });

          describe('Alice should not be able to', () => {
            it('send 0.5 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.5).should.be.rejectedWith(EVMThrow);
            });
          });

          describe('Zoe should not be able to', () => {
            it('send 0.01 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
            });
            it('send 0.1 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
            });
          });
        });

        describe('if Bob and Charlie reached their cap (0.5 ETH raised) during Phase 1,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.seconds(1));
            await buyTokens(this.crowdsale, bob, 0.25);
            await buyTokens(this.crowdsale, charlie, 0.25);
            await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
          });

          describe('Alice should be able to', () => {
            it('send 0.25 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.25).should.be.fulfilled;
            });
            it('send 0.5 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.5).should.be.fulfilled;
            });
          });

          describe('Alice should not be able to', () => {
            it('send 1 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 1).should.be.rejectedWith(EVMThrow);
            });
          });
        });

        describe('Zoe should not be able to', () => {
          it('send 0.01 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
          });
          it('send 0.1 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
          });
        });
      });

      describe('During Phase 3,', () => {
        describe('if Bob and Charlie reached their investment goal (0.75 ETH raised) during Phase 1 & 2,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.seconds(1));
            await buyTokens(this.crowdsale, bob, 0.25);
            await buyTokens(this.crowdsale, charlie, 0.25);
            await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
            await buyTokens(this.crowdsale, bob, 0.25);
            await timeTravelTo(this.startTime + duration.hours(4) + duration.seconds(1));
          });

          describe('Alice should be able to', () => {
            it('send 0.25 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.25).should.be.fulfilled;
            });
          });

          describe('Alice should not be able to', () => {
            it('send 0.5 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.5).should.be.rejectedWith(EVMThrow);
            });
          });

          describe('Zoe should not be able to', () => {
            it('send 0.01 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
            });
            it('send 0.1 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
            });
          });
        });

        describe('if no one invested during Phase 1 & 2,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.hours(4) + duration.seconds(1));
          });

          describe('Alice should be able to', () => {
            it('send 0.5 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.5).should.be.fulfilled;
            });
            it('send 1 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 1).should.be.fulfilled;
            });
          });

          describe('Alice should not be able to', () => {
            it('send 2 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 2).should.be.rejectedWith(EVMThrow);
            });
          });

          describe('Zoe should not be able to', () => {
            it('send 0.01 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
            });
            it('send 0.1 ETH', async () => {
              await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
            });
          });
        });
      });
    });

    describe(`
      Scenario 3:
      Crowdsale capped to 1 ETH
      - Phase 1: [Oh; 2h], cap = 0.5 ETH/user
      - Phase 2: [2h; 4h], cap = 0.75 ETH/user
      - Phase 3: [4h; ∞h], cap = 1 ETH/user

      Alice wants to invest 2 ETH
      Bob wants to invest 0.5 ETH
      Charlie wants to invest 0.25 ETH

      Overriden caps:
      - Phase 1: Alice = 0.4,    Bob = /,      Charlie = 0.05
      - Phase 2: Alice = 0.45,   Bob = 0.1,    Charlie = /
      - Phase 3: Alice = /,      Bob = 0.2,    Charlie = 0.1
      `, () => {

      beforeEach(async () => {
        await this.crowdsale.addPhase(ether(0.5), this.startTime, this.startTime+duration.hours(2), {from: owner});
        await this.crowdsale.addPhase(ether(0.75), this.startTime+duration.hours(2), this.startTime+duration.hours(4), {from: owner});
        await this.crowdsale.addPhase(ether(1), this.startTime+duration.hours(4), this.startTime+duration.days(7), {from: owner});
        await this.crowdsale.overrideCapForUserOnPhase(0, alice, ether(0.4), {from: owner});
        await this.crowdsale.overrideCapForUserOnPhase(0, charlie, ether(0.05), {from: owner});
        await this.crowdsale.overrideCapForUserOnPhase(1, alice, ether(0.45), {from: owner});
        await this.crowdsale.overrideCapForUserOnPhase(1, bob, ether(0.1), {from: owner});
        await this.crowdsale.overrideCapForUserOnPhase(2, bob, ether(0.2), {from: owner});
        await this.crowdsale.overrideCapForUserOnPhase(2, charlie, ether(0.10), {from: owner});
      });

      describe('During Phase 1,', () => {
        beforeEach(async () => {
          await timeTravelTo(this.startTime + duration.seconds(1));
        });

        describe('Alice should be able to', () => {
          it('send 0.25 ETH', async () => {
            await buyTokens(this.crowdsale, alice, 0.25).should.be.fulfilled;
          });
          it('send 0.4 ETH', async () => {
            await buyTokens(this.crowdsale, alice, 0.40).should.be.fulfilled;
          });
        });

        describe('Alice should not be able to', () => {
          it('send 0.5 ETH', async () => {
            await buyTokens(this.crowdsale, alice, 0.5).should.be.rejectedWith(EVMThrow);
          });
        });

        describe('Zoe should not be able to', () => {
          it('send 0.01 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
          });
          it('send 0.1 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
          });
        });
      });

      describe('During Phase 2,', () => {
        describe('if Alice, Bob and Charlie reached their cap (0.70 ETH raised) during Phase 1,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.seconds(1));
            await buyTokens(this.crowdsale, alice, 0.40);
            await buyTokens(this.crowdsale, bob, 0.25);
            await buyTokens(this.crowdsale, charlie, 0.05);
            await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
          });
          describe('Alice should be able to', () => {
            it('send 0.02 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.02).should.be.fulfilled;
            });
            it('send 0.05 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.05).should.be.fulfilled;
            });
          });
          describe('Alice should not be able to', () => {
            it('send 0.1 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 1).should.be.rejectedWith(EVMThrow);
            });
          });
        });

        describe('if Bob and Charlie reached their cap (0.5 ETH raised) during Phase 1,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.seconds(1));
            await buyTokens(this.crowdsale, bob, 0.25);
            await buyTokens(this.crowdsale, charlie, 0.05);
            await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
          });
          describe('Alice should be able to', () => {
            it('send 0.25 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.25).should.be.fulfilled;
            });
            it('send 0.45 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.45).should.be.fulfilled;
            });
          });
          describe('Alice should not be able to', () => {
            it('send 1 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 1).should.be.rejectedWith(EVMThrow);
            });
          });
          describe('Charlie should be able to', () => {
            it('send 0.45 ETH', async () => {
              await buyTokens(this.crowdsale, charlie, 0.45).should.be.fulfilled;
            });
          });
        });

        describe('Zoe should not be able to', () => {
          it('send 0.01 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
          });
          it('send 0.1 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
          });
        });
      });

      describe('During Phase 3,', () => {
        describe('if Bob and Charlie reached their investment goal (0.75 ETH raised) during Phase 1 & 2,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.seconds(1));
            await buyTokens(this.crowdsale, bob, 0.5);
            await buyTokens(this.crowdsale, charlie, 0.05);
            await timeTravelTo(this.startTime + duration.hours(2) + duration.seconds(1));
            await buyTokens(this.crowdsale, charlie, 0.20);
            await timeTravelTo(this.startTime + duration.hours(4) + duration.seconds(1));
          });
          describe('Alice should be able to', () => {
            it('send 0.25 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.25).should.be.fulfilled;
            });
          });
          describe('Alice should not be able to', () => {
            it('send 0.5 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.5).should.be.rejectedWith(EVMThrow);
            });
            it('send 1 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 1).should.be.rejectedWith(EVMThrow);
            });
          });
        });

        describe('if no one invested during Phase 1 & 2,', () => {
          beforeEach(async () => {
            await timeTravelTo(this.startTime + duration.hours(4) + duration.seconds(1));
          });
          describe('Alice should be able to', () => {
            it('send 0.5 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 0.5).should.be.fulfilled;
            });
            it('send 1 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 1).should.be.fulfilled;
            });
          });
          describe('Alice should not be able to', () => {
            it('send 2 ETH', async () => {
              await buyTokens(this.crowdsale, alice, 2).should.be.rejectedWith(EVMThrow);
            });
          });
        });

        describe('Zoe should not be able to', () => {
          it('send 0.01 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.01).should.be.rejectedWith(EVMThrow);
          });
          it('send 0.1 ETH', async () => {
            await buyTokens(this.crowdsale, zoe, 0.1).should.be.rejectedWith(EVMThrow);
          });
        });
      });
    });

    describe(`
      Scenario 4:
      Crowdsale capped to 1 ETH
      - Phase 1: [Oh; ∞h], cap = 0.5 ETH/user

      Alice wants to invest 0.4 ETH
      `, () => {

      describe('At the end of the crowdsale, if Alice in the only one to reach investment goal,', () => {
        beforeEach(async () => {
          await this.crowdsale.addPhase(ether(0.5), this.startTime, this.startTime+duration.hours(2), {from: owner});
          await timeTravelTo(this.startTime + duration.seconds(1));
        });

        describe('she should be able to', () => {
          it('be refunded', async () => {
          });
        });
      });
    });
  });
});



// Get a refund if soft cap not reached
