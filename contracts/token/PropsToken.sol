pragma solidity ^0.4.13;

import "zeppelin-solidity/contracts/token/PausableToken.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";

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

contract PropsToken is PausableToken, MintableToken {

    /* Set the token name for display */
    string public constant symbol = "PROPS";

    /* Set the token symbol for display */
    string public constant name = "PROPS Token";

    /* Set the number of decimals for display */
    uint8 public constant decimals = 18;

    /* 1 Billion PROPS specified in AttoPROPS */
    uint256 public constant amountOfTokenToMint = 1000000000 * 10**uint256(decimals);

    /* Delegated transfers performed */
    mapping(address => uint256) lastSuccessfulNonceForUser;

    event DelegatedTransfer(address indexed from, address indexed to, address indexed delegate, uint256 value, uint256 fee);

    /**
    * @dev delegate transfer
    * @param _nonce Nonce for the transaction
    * @param _from Address of sender
    * @param _to Address of recipient
    * @param _value Amount of tokens to send to the recipient
    * @param _fee Amount of fee to send to the delegate
    * @param _v V
    * @param _r R
    * @param _s S
    */
    function delegatedTransfer(uint256 _nonce, address _from, address _to, uint256 _value, uint256 _fee, uint8 _v, bytes32 _r, bytes32 _s) public returns (bool) {
      uint256 total = _value.add(_fee);
      require(_from != address(0));
      require(_to != address(0));
      require(total <= balances[_from]);
      require(_nonce > lastSuccessfulNonceForUser[_from]);

      address delegate = msg.sender;
      address token = address(this);

      bytes32 delegatedTxnHash = keccak256(delegate, token, _nonce, _from, _to, _value, _fee);
      address signatory = ecrecover(delegatedTxnHash, _v, _r, _s);
      Log(_from, signatory, delegatedTxnHash, _v, _r, _s);
      require(signatory == _from);

      // SafeMath.sub will throw if there is not enough balance.
      balances[signatory] = balances[signatory].sub(total);
      balances[_to] = balances[_to].add(_value);
      balances[delegate] = balances[delegate].add(_fee);
      lastSuccessfulNonceForUser[_from] = _nonce;

      DelegatedTransfer(_from, _to, delegate, _value, _fee);
      Transfer(_from, _to, _value);
      Transfer(_from, delegate, _fee);
      return true;
    }

    event Log(address from, address signatory, bytes32 hash, uint8 _v, bytes32 _r, bytes32 _s);

    function hashParams(uint256 _nonce, address _from, address _to, uint256 _value, uint256 _fee) public returns (bytes32) {
      address delegate = msg.sender;
      address token = address(this);
      /* bytes32 h = keccak256(delegate, token, _nonce, _from, _to, _value, _fee); */
      bytes32 h = keccak256(delegate, token, _nonce, _from, _to, _value, _fee);
      return h;
    }


}
