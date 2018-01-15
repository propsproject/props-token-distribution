pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import '../token/TokenVesting.sol';

/**
 * @title Crowdsale extension, working hand in hand with Coral Prefunder.
 * @author Ludovic Galabru <ludovic@galabru.com>
 *
 */

contract PrefundedCrowdsale is Crowdsale, Ownable {
    using SafeMath for uint256;

    /* Data structure holding the preallocation conditions, negotiated with investors */
    struct PreallocationConditions {

        /* Value of the discount, in percentage */
        uint256 discount;

        /* Duration of the entire vesting, in "1 day" unit */
        uint256 vestingDuration;

        /* Duration of the cliff, in "1 day" unit */
        uint256 vestingCliff;

        /* Percentage of the tokens to vest */
        uint256 percentageToVest;

        /* Whitelisting flag */
        bool isWhitelisted;
    }

    /* What are the preallocation conditions, for each investor address */
    mapping (address => PreallocationConditions) public preallocationConditions;


    /* Preallocation Conditions updated has been changed for an investor */
    event PreallocationConditionsUpdated(address indexed preallocation, uint256 discount, uint256 vestingDuration, uint256 vestingCliff, uint256 percentageToVest);

    /* Preallocated Token has been bought */
    event PreallocatedTokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /* Preallocated Token has been vested */
    event PreallocatedTokenVesting(address indexed vault, address indexed beneficiary, uint256 value, uint256 amount);

    /* Modifier allowing execution only if the sender is eligible for preallocation */
    modifier onlyPreallocations() {
        require(isPreallocation(msg.sender));
        _;
    }

    /* Modifier allowing execution only if the event is happening before the beginning of the crowdsale */
    modifier onlyBeforeCrowdsale() {
        require(now < startTime);
        _;
    }

    /* Modifier allowing execution only if the event is happening before the end of the crowdsale */
    modifier onlyBeforeEndOfCrowdsale() {
        require(now < endTime);
        _;
    }

    /**
     * @dev Is the address whitelisted?
     * @return true if the sender can buy
     */
    function isPreallocation(address _sender) public constant returns (bool) {
        require(_sender != 0x0);
        return preallocationConditions[_sender].isWhitelisted;
    }

    /**
     * @dev Add a given address to the whitelist.
     * - discount: discount, expressed in %. Pass 10 for 10% discount
     * - vestingDuration: duration of eventual vesting, in days.
     * - vestingCliff: duration of eventual cliff, in months.
     */
    function addPreallocation(address _preallocation, uint256 _discount, uint256 _vestingDuration, uint256 _vestingCliff, uint256 _percentageToVest) onlyOwner onlyBeforeCrowdsale public {
        preallocationConditions[_preallocation] = PreallocationConditions({
            discount: _discount,
            vestingDuration: _vestingDuration,
            vestingCliff: _vestingCliff,
            percentageToVest: _percentageToVest,
            isWhitelisted: true
        });
        PreallocationConditionsUpdated(_preallocation, _discount, _vestingDuration, _vestingCliff, _percentageToVest);
    }

    /**
     * @dev overriding Crowdsale#buyTokens to process eventual pre-funders
     */
    function buyTokens(address _beneficiary) payable public {
        if (isPreallocation(msg.sender)) {
            buyPreallocatedTokens(_beneficiary);
        } else {
            super.buyTokens(_beneficiary);
        }
    }

    /**
     * @dev Prepare the transaction, by configurating the rate and the vesting
     * contract if necessary
     */
    function buyPreallocatedTokens(address _beneficiary) internal onlyPreallocations onlyBeforeCrowdsale {
        PreallocationConditions storage conditions = preallocationConditions[msg.sender];

        uint256 weiAmount = msg.value;
        uint256 preferentialRate = rate.mul(100).div(100 - conditions.discount);
        uint256 tokensAmount = weiAmount.mul(preferentialRate);
        uint256 tokensToVest = tokensAmount.mul(conditions.percentageToVest).div(100);
        uint256 tokensToGrant = tokensAmount.sub(tokensToVest);

        if (tokensToGrant > 0) {
            token.mint(_beneficiary, tokensToGrant);
        }
        if (tokensToVest > 0) {
            address vestingContract = createTokenVesting(_beneficiary, conditions);
            token.mint(vestingContract, tokensToVest);
            PreallocatedTokenVesting(vestingContract, _beneficiary, weiAmount, tokensAmount);
        }
        weiRaised = weiRaised.add(weiAmount);
        forwardFunds();

        conditions.isWhitelisted = false;
        TokenPurchase(msg.sender, _beneficiary, weiAmount, tokensAmount);
        PreallocatedTokenPurchase(msg.sender, _beneficiary, weiAmount, tokensAmount);
    }

    /**
     * @dev Create a vesting token contract, subject to hold the minted tokens
     */
    function createTokenVesting(address _beneficiary, PreallocationConditions _conditions) internal returns (address) {
      require(_beneficiary != 0x0);
      uint256 vestingStart = now;
      uint256 vestingCliff = _conditions.vestingCliff * 1 days;
      uint256 vestingDuration = _conditions.vestingDuration * 1 days;
      TokenVesting vestedTokensContract = new TokenVesting(
          _beneficiary,
          vestingStart,
          vestingCliff,
          vestingDuration,
          false
      );
      return address(vestedTokensContract);
    }
}
