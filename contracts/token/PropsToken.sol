pragma solidity ^0.4.18;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Mintable.sol";
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

contract PropsToken is Initializable, ERC865Token, ERC20Detailed, ERC20Pausable, ERC20Mintable {

    /* Set the token symbol for display */
    string public constant symbol = "TOKEN_DEV";

    /* Set the token name for display */
    string public constant name = "TokenDev";

    /* Set the number of decimals for display */
    uint8 public constant decimals = 18;

    /* 1 Billion PROPS specified in AttoPROPS */
    uint256 public constant amountOfTokenToMint = 10**9 * 10**uint256(decimals);

    event TransferDetails(
        address from,
        uint256 fromBalance,
        address to,
        uint256 toBalance,
        uint256 amount
    );

    event Settlement(
        uint256 timestamp,
        address from,
        address recipient,
        uint256 amount
    );

    function initialize(string _name, string _symbol, uint8 _decimals) public initializer {
        ERC20Detailed.initialize(_name, _symbol, _decimals);

        amountOfTokenToMint = 10**9 * 10**uint256(_decimals);

        // Initialize the minter and pauser roles
        ERC20Mintable.initialize(address(this));
        ERC20Pausable.initialize(address(this));
    }

    /**
    * @notice transfer token for a specified address
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
        if (super.transfer(_to, _value)) {
            emit TransferDetails(msg.sender, super.balanceOf(msg.sender), _to, super.balanceOf(_to), _value);
            return true;
        }

        return false;
    }

    /**
    * @notice settle pending earnings on the PROPS-Chain by using this settlement method to transfer and emit a settlement Event
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function settle(address _to, uint256 _value) public returns (bool) {
        if (super.transfer(_to, _value)) {
            emit Settlement(block.timestamp, msg.sender, _to, _value);
            emit TransferDetails(msg.sender, super.balanceOf(msg.sender), _to, super.balanceOf(_to), _value);
            return true;
        }

        return false;
    }

    /**
     * @notice Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        if (super.transferFrom(_from, _to, _value)) {
            emit TransferDetails(_from, super.balanceOf(_from), _to, super.balanceOf(_to), _value);
            return true;
        }

        return false;
    }

    /**
     * @notice Submit a presigned transfer
     * @param _signature bytes The signature, issued by the owner.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function transferPreSigned(
        bytes _signature,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        public
        whenNotPaused
        returns (bool)
    {
        if (super.transferPreSigned(_signature, _to, _value, _fee, _nonce)) {
            emit TransferDetails(from, super.balanceOf(from), _to, super.balanceOf(_to), _value);
            return true;
        }

        return false;
    }

}
