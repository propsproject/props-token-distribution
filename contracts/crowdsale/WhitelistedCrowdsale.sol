pragma solidity ^0.4.13;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * @title Crowdsale extension.
 * @author Ludovic Galabru
 *
 */

contract WhitelistedCrowdsale is Crowdsale, Ownable {
    using SafeMath for uint256;

    /* Mapping of whitelisted users */
    mapping (address => bool) whitelistedUsersLookup;

    /* Is crowdsale filtering non registered users. True by default */
    bool public isWhitelistOnly;

    /* Keeping track of the count of whitelisted users */
    uint public whitelistedUsersCount;

    event UserWhitelisted(address user);

    event UserRemovedFromWhitelist(address user);

    function WhitelistedCrowdsale() public {
        isWhitelistOnly = true;
        whitelistedUsersCount = 0;
    }

    /**
     * @dev Is the address registered?
     * @return true if the sender can buy
     */
    function isWhitelistedUser(address _sender) public constant returns (bool) {
        require(_sender != 0x0);
        return whitelistedUsersLookup[_sender];
    }

    /**
     * @dev Enabling / Disabling filetering of non registered users
     */
    function setWhitelistedOnly(bool _isWhitelistOnly) onlyOwner public {
        if (isWhitelistOnly != _isWhitelistOnly) {
            isWhitelistOnly = _isWhitelistOnly;
        }
    }

    /**
     * @dev Adding a user to the whitelist of the crowdsale
     */
    function addWhitelistedUser(address _user) onlyOwner public {
        require(!isWhitelistedUser(_user));
        whitelistedUsersLookup[_user] = true;
        whitelistedUsersCount = whitelistedUsersCount.add(1);
        UserWhitelisted(_user);
    }

    /**
     * @dev Removing a user from the whitelist of the crowdsale
     */
    function removeWhitelistedUser(address _user) onlyOwner public {
        require(isWhitelistedUser(_user));
        whitelistedUsersLookup[_user] = false;
        whitelistedUsersCount = whitelistedUsersCount.sub(1);
        UserRemovedFromWhitelist(_user);
    }

    /**
     * @dev Overriding Crowdsale#buyTokens, for filtering users based on
     * whitelist
     */
    function buyTokens(address _beneficiary) payable public {
        bool canBuyTokens = super.validPurchase();
        if (isWhitelistOnly && canBuyTokens) {
            canBuyTokens = isWhitelistedUser(_beneficiary);
        }
        require(canBuyTokens);
        super.buyTokens(_beneficiary);
    }

    /**
     * @dev Returns the number of whitelisted users
     */
    function whitelistedUsersCount() public constant returns (uint) {
        return whitelistedUsersCount;
    }
}
