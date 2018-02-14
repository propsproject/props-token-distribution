pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "./ERC865Token.sol";

/**
 * @title PROPS Token
 * @dev ERC20 Token (PROPS)
 *
 * PROPS are divisible by 1e18 base
 * units referred to as 'AttoPROPS'.
 *
 * PROPS are displayed using 18 decimal places of precision.
 *
 * 1 PROPS is equivalent to:
 *   1 * 1e18 == 1e18 == One Quintillion AttoPROPS
 *
 * 1 Billion PROPS (total supply) is equivalent to:
 *   1000000000 * 1e18 == 1e27 == One Octillion AttoPROPS
 *
 */

contract PropsToken is ERC865Token, PausableToken, MintableToken {

    /* Set the token name for display */
    string public constant symbol = "PROPS";

    /* Set the token symbol for display */
    string public constant name = "PROPS Token";

    /* Set the number of decimals for display */
    uint8 public constant decimals = 18;

    /* 1 Billion PROPS specified in AttoPROPS */
    uint256 public constant amountOfTokenToMint = 1000000000 * 10**uint256(decimals);

    /* Is crowdsale filtering non registered users. True by default */
    bool public isTransferWhitelistOnly;

    /* Mapping of whitelisted users */
    mapping (address => bool) usersAllowedToTransfer;

    event UserAllowedToTransfer(address user);

    /**
     * @dev Is the address allowed to transfer
     * @return true if the sender can transfer
     */
    function isUserAllowedToTransfer(address _user) public constant returns (bool) {
        require(_user != 0x0);
        return usersAllowedToTransfer[_user];
    }

    /**
     * @dev Enabling / Disabling transfers of non whitelisted users
     */
    function setWhitelistedOnly(bool _isWhitelistOnly) onlyOwner public {
        if (isTransferWhitelistOnly != _isWhitelistOnly) {
            isTransferWhitelistOnly = _isWhitelistOnly;
        }
    }

    /**
     * @dev Adding a user to the whitelist
     */
    function whitelistUserForTransfers(address _user) onlyOwner public {
        require(!isUserAllowedToTransfer(_user));
        usersAllowedToTransfer[_user] = true;
        UserAllowedToTransfer(_user);
    }

    /**
     * @dev Remove a user from the whitelist
     */
    function blacklistUserForTransfers(address _user) onlyOwner public {
        require(isUserAllowedToTransfer(_user));
        usersAllowedToTransfer[_user] = false;
        UserAllowedToTransfer(_user);
    }

    /**
    * @dev transfer token for a specified address
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
      if (isTransferWhitelistOnly) {
        require(isUserAllowedToTransfer(msg.sender));
      }
      return super.transfer(_to, _value);
    }


    /**
     * @dev Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
      if (isTransferWhitelistOnly) {
        require(isUserAllowedToTransfer(_from));
      }
      return super.transferFrom(_from, _to, _value);
    }

    /**
     * @notice Include a presigned `"a9059cbb": "transfer(address,uint256)"`
     * @param _signature Signed transfer
     * @param _to The address of the recipient
     * @param _value The value of tokens to be transferred
     * @param _fee How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function transferPreSigned(
        bytes _signature,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        whenNotPaused
        public
        returns (bool)
    {
        if (isTransferWhitelistOnly) {
            bytes32 hashedTx = super.transferPreSignedHashing(address(this), _to, _value, _fee, _nonce);
            address from = recover(hashedTx, _signature);
            require(isUserAllowedToTransfer(from));
        }
        return super.transferPreSigned(_signature, _to, _value, _fee, _nonce);
    }

    /**
     * @notice Include a presigned `""095ea7b3": "approve(address,uint256)"`
     * @param _signature Signed transfer
     * @param _spender The address of the recipient
     * @param _value The value of tokens to be transferred
     * @param _fee How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function approvePreSigned(
        bytes _signature,
        address _spender,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        whenNotPaused
        public
        returns (bool)
    {
        if (isTransferWhitelistOnly) {
            bytes32 hashedTx = super.approvePreSignedHashing(address(this), _spender, _value, _fee, _nonce);
            address from = recover(hashedTx, _signature);
            require(isUserAllowedToTransfer(from));
        }
        return super.approvePreSigned(_signature, _spender, _value, _fee, _nonce);
    }



}
