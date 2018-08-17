pragma solidity ^0.4.13;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import "./token/PropsToken.sol";
import "./token/TokenVesting.sol";


/**
 * @title Coordinator for the Token distribution
 * Simple wrapper, allowing us simplify the coordination of the ICO
 * using a MultiSigWallet
 *
 */

contract TokenDistributionCoordinator is Ownable {
    using SafeMath for uint256;

    /* Token to manage */
    PropsToken public token;

    /* Making sure that preallocation for employees is happening once */
    bool public isPreallocationForEmployeesDone = false;

    /* Making sure that preallocation for foundation is happening once */
    bool public isPreallocationForFoundationDone = false;

    /* Making sure that we're injecting the token once */
    bool public isTokenInjected = false;

    /* Making sure that we're injecting the crowdsale once */
    bool public isCrowdsaleInjected = false;

    /* Is Preallocation Open */
    bool public isPreallocationOpen = true;

    uint public constant shareForEmployees = 26;

    uint public constant shareForFoundation = 50;

    /* Events */
    event CompanyAllocation(address beneficiary, uint amount);
    event FoundationAllocation(address beneficiary, uint amount);
    event PoolAllocation(address beneficiary, uint amount);
    event SAFTAllocation(address beneficiary, uint amount, address vestingContract);
    event AdvisorAllocation(address beneficiary, uint amount, address vestingContract);

    /**
     * @dev Injecting an externally created token into the coordinator.
     */
    function injectToken(address _tokenAddress) public onlyOwner {
        require(_tokenAddress != 0x0);
        require(isTokenInjected == false);
        token = PropsToken(_tokenAddress);
        require(PropsToken(token).owner() == address(this));

        token.pause();
        isTokenInjected = true;
    }

    /**
     * @dev Pre-allocating tokens for the employees before the crowdsale starts.
     * Require token injection
     * Tax optimization.
     */
    function preallocateForEmployees(address poolAddress) public onlyOwner {
        require(isTokenInjected);
        require(isPreallocationForEmployeesDone == false);
        uint tokensAmount = token.amountOfTokenToMint().mul(shareForEmployees).div(100);
        token.mint(poolAddress, tokensAmount);
        PoolAllocation(poolAddress, tokensAmount);
        isPreallocationForEmployeesDone = true;
    }

    /**
     * @dev Pre-allocating tokens for the foundation before the crowdsale starts.
     * Require token injection
     * Tax optimization.
     */
    function preallocateForFoundation(address poolAddress) public onlyOwner {
        require(isTokenInjected);
        require(isPreallocationForFoundationDone == false);
        uint tokensAmount = token.amountOfTokenToMint().mul(shareForFoundation).div(100);
        token.mint(poolAddress, tokensAmount);
        PoolAllocation(poolAddress, tokensAmount);
        isPreallocationForFoundationDone = true;
    }

    /**
     * @dev Pre-allocating tokens
     */
    function allocateTokens(address _investor, uint _tokensVolume, uint64 _vestingDuration, uint64 _vestingCliff, uint64 _percentageToVest) internal returns (address) {
        require(isPreallocationOpen);
        require(_investor != 0x0);

        address vestingContract = 0x0;

        uint256 tokensToVest = _tokensVolume.mul(_percentageToVest).div(100);
        uint256 tokensToGrant = _tokensVolume.sub(tokensToVest);

        if (tokensToGrant > 0) {
            token.mint(_investor, tokensToGrant);
        }
        if (tokensToVest > 0) {
          uint256 vestingStart = now;
          uint256 vestingCliff = _vestingCliff * 1 days;
          uint256 vestingDuration = _vestingDuration * 1 days;
          vestingContract = address(new TokenVesting(
              _investor,
              vestingStart,
              vestingCliff,
              vestingDuration,
              false
          ));
          token.mint(vestingContract, tokensToVest);
        }

        return vestingContract;
    }

    /**
     * @dev Pre-allocating tokens to Company.
     */
    function allocateTokensToCompany(address _investor, uint _tokensVolume, uint64 _vestingDuration, uint64 _vestingCliff, uint64 _percentageToVest) public onlyOwner {
        allocateTokens(_investor, _tokensVolume, _vestingDuration, _vestingCliff, _percentageToVest);
        CompanyAllocation(_investor, _tokensVolume);
    }

    /**
     * @dev Pre-allocating tokens to Foundation.
     */
    function allocateTokensToFoundation(address _investor, uint _tokensVolume, uint64 _vestingDuration, uint64 _vestingCliff, uint64 _percentageToVest) public onlyOwner {
        allocateTokens(_investor, _tokensVolume, _vestingDuration, _vestingCliff, _percentageToVest);
        FoundationAllocation(_investor, _tokensVolume);
    }

    /**
     * @dev Pre-allocating tokens to SAFT Investor.
     */
    function allocateTokensToSAFTInvestor(address _investor, uint _tokensVolume, uint64 _vestingDuration, uint64 _vestingCliff, uint64 _percentageToVest) public onlyOwner {
        address vestingContract = allocateTokens(_investor, _tokensVolume, _vestingDuration, _vestingCliff, _percentageToVest);
        SAFTAllocation(_investor, _tokensVolume, vestingContract);
    }

    /**
     * @dev Pre-allocating tokens to Advisor.
     */
    function allocateTokensToAdvisor(address _investor, uint _tokensVolume, uint64 _vestingDuration, uint64 _vestingCliff, uint64 _percentageToVest) public onlyOwner {
        address vestingContract = allocateTokens(_investor, _tokensVolume, _vestingDuration, _vestingCliff, _percentageToVest);
        AdvisorAllocation(_investor, _tokensVolume, vestingContract);
    }

    /**
     * @dev Enabling / Disabling transfers of non whitelisted users
     */
    function setWhitelistedOnly(bool _isWhitelistOnly) onlyOwner public {
        token.setWhitelistedOnly(_isWhitelistOnly);
    }

    /**
     * @dev Adding a user to the whitelist
     */
    function whitelistUserForTransfers(address _user) onlyOwner public {
        token.whitelistUserForTransfers(_user);
    }

    /**
     * @dev Remove a user from the whitelist
     */
    function blacklistUserForTransfers(address _user) onlyOwner public {
        token.blacklistUserForTransfers(_user);
    }

    function unpauseToken() public onlyOwner {
        token.unpause();
    }

    function pauseToken() public onlyOwner {
        token.pause();
    }

    function closeMinting() public onlyOwner {
        token.finishMinting();
    }

    function releaseToken() public onlyOwner {
        token.unpause();
        token.transferOwnership(0x000000000000000000000000000000000000dead);
    }
}
