pragma solidity ^0.4.13;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/RefundableCrowdsale.sol";
import "./PrefundedCrowdsale.sol";
import "./PhasedUserCappedCrowdsale.sol";
import "./WhitelistedCrowdsale.sol";
import "../token/PropsToken.sol";

/**
 * @title PROPS Crowdsale
 * @dev Composition of UserCappedCrowdsale, PrefundedCrowdsale & RefundableCrowdsale
 * All the specs of the crowdsale are available in /specs/README.md
 *
 */

contract PropsCrowdsale is PhasedUserCappedCrowdsale, WhitelistedCrowdsale, PrefundedCrowdsale, RefundableCrowdsale {

    /*  */
    uint256 public constant shareOfTokensAvailable = 20;

    /* Soft cap has been changed */
    event SoftCapUpdate(uint256 cap);

    /* Hard cap has been changed */
    event HardCapUpdate(uint256 cap);

    /* Hard cap has been changed */
    event RateUpdate(uint256 rate);

    function PropsCrowdsale(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _softCap,
        uint256 _hardCap,
        address _wallet,
        address _token
    ) public
        WhitelistedCrowdsale()
        PhasedUserCappedCrowdsale(_hardCap)
        RefundableCrowdsale(_softCap)
        Crowdsale(_startTime, _endTime, 1, _wallet)
    {
        token = PropsToken(_token);
        updateRate(0);
    }

    function createTokenContract() internal returns (MintableToken) {
        return MintableToken(0x0);
    }

    function updateCaps(uint _softCap, uint _hardCap, uint _volumeSoldUnderSAFT) onlyOwner public {
        require(now < startTime);

        setHardCap(_hardCap);
        setSoftCap(_softCap);
        updateRate(_volumeSoldUnderSAFT);
    }

    /**
     * Ability to set a hard cap after deployment, and before the beginning of
     * the crowdsale (SAFT support).
     */
    function setHardCap(uint _hardCap) internal {
        require(_hardCap > 0);
        cap = _hardCap;
        HardCapUpdate(cap);
    }

    /**
     * Ability to set a soft cap after deployment, and before the beginning of
     * the crowdsale (SAFT support).
     */
    function setSoftCap(uint _softCap) internal {
        require(_softCap > 0);
        goal = _softCap;
        SoftCapUpdate(goal);
    }

    /**
     * Ability to set the rate after deployment before the beginning of
     * the crowdsale.
     */
    function updateRate(uint _volumeSoldUnderSAFT) internal {
        require(cap > 0);

        uint totalSupply = PropsToken(token).amountOfTokenToMint();
        uint volumeAvailable = totalSupply.mul(shareOfTokensAvailable).div(100);
        uint volumeAvailableForCrowdsale = volumeAvailable.sub(_volumeSoldUnderSAFT);
        rate = volumeAvailableForCrowdsale.div(cap);
        RateUpdate(rate);
    }

    /**
     * Finalizing the crowdsale implies
     * - Evaluate the refunding clauses
     * - Mint and Burn the un-minted tokens
     * - Pass the ownership of the token back to the original owner.
     */
    function finalization() internal {
        super.finalization();
        if (super.goalReached()) {
            token.finishMinting();
            PropsToken(token).unpause();
            token.transferOwnership(0x000000000000000000000000000000000000dead);
        }
    }

    /**
     * @dev overriding Crowdsale#buyPreallocatedTokens.
     * Making sure that preallocated tokens are not outreaching the hardcap,
     */
    function buyPreallocatedTokens(address _beneficiary) internal {
        require(weiRaised.add(msg.value) <= cap);
        super.buyPreallocatedTokens(_beneficiary);
    }

    /**
     * @dev Returns the cap for a given user
     */
    function currentCapForUser(address _user) internal constant returns (uint) {
        uint totalInvestment = weiRaisedFromUser[_user];
        return totalInvestment.add(this.participationAvailableForUser(_user));
    }

    /**
     * @dev Returns the cap for a given user
     */
    function participationAvailableForUser(address _user) public constant returns (uint) {
        uint capForUser = super.currentCapForUser(_user);
        uint runningParticipation = weiRaisedFromUser[_user];
        uint participationLeft = capForUser.sub(runningParticipation);
        uint weiToRaise =  cap.sub(weiRaised);
        if (participationLeft > weiToRaise) {
            participationLeft = weiToRaise;
        }
        return participationLeft;
    }

}
