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


    /**
     * @notice Include a presigned `"a9059cbb": "transfer(address,uint256)"`
     * @param _signature Signed transfer
     * @param _to The address of the recipient
     * @param _value The value of tokens to be transferred
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function transferPreSigned(
        bytes _signature,
        address _to,
        uint256 _value,
        uint256 _gasPrice,
        uint256 _nonce
    )
        whenNotPaused
        public
        returns (bool)
    {
        return super.transferPreSigned(_signature, _to, _value, _gasPrice, _nonce);
    }

    /**
     * @notice Include a presigned `""095ea7b3": "approve(address,uint256)"`
     * @param _signature Signed transfer
     * @param _spender The address of the recipient
     * @param _value The value of tokens to be transferred
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function approvePreSigned(
        bytes _signature,
        address _spender,
        uint256 _value,
        uint256 _gasPrice,
        uint256 _nonce
    )
        whenNotPaused
        public
        returns (bool)
    {
        return super.approvePreSigned(_signature, _spender, _value, _gasPrice, _nonce);
    }
}
