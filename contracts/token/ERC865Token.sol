pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
 * @title ERC865Token Token
 *
 * ERC865Token allows users paying transfers in tokens instead of gas
 * https://github.com/ethereum/EIPs/issues/865
 *
 */

contract ERC865Token is StandardToken {

    /* Nonces of transfers performed */
    mapping(address => uint256) nonces;

    event DelegatedTransfer(address indexed from, address indexed to, address indexed delegate, uint256 amount, uint256 fee);

    /**
    * @dev delegate transfer
    * @param _nonce Nonce for the transaction
    * @param _from Address of sender
    * @param _to Address of recipient
    * @param _amount Amount of tokens to send to the recipient
    * @param _fee Amount of fee to send to the delegate
    * @param _v V
    * @param _r R
    * @param _s S
    */
    function delegatedTransfer(uint256 _nonce, address _from, address _to, uint256 _amount, uint256 _fee, uint8 _v, bytes32 _r, bytes32 _s) public returns (bool) {
      uint256 total = _amount.add(_fee);
      require(_from != address(0));
      require(_to != address(0));
      require(total <= balances[_from]);
      require(_nonce > nonces[_from]);

      bytes32 hashedTx = delegatedTransferHash(address(this), _nonce, _from, _to, msg.sender, _amount, _fee);
      address signatory = ecrecover(hashedTx, _v, _r, _s);

      require(signatory == _from);

      balances[signatory] = balances[signatory].sub(total);
      balances[_to] = balances[_to].add(_amount);
      balances[msg.sender] = balances[msg.sender].add(_fee);
      nonces[_from] = _nonce;

      DelegatedTransfer(_from, _to, msg.sender, _amount, _fee);
      Transfer(_from, _to, _amount);
      Transfer(_from, msg.sender, _fee);
      return true;
    }

    /**
    * @dev returns the value of the original keccak256, signed by sender.
    * By having this signature and this order with hashing, generating the
    * data of this function returns (almost) the data to hash.
    * @param _token Address of the token
    * @param _nonce Nonce for the transaction
    * @param _from Address of sender
    * @param _to Address of recipient
    * @param _amount Amount of tokens to send to the recipient
    * @param _fee Amount of fee to send to the delegate
    */
    function delegatedTransferHash(address _token, uint256 _nonce, address _from, address _to, address _delegate, uint256 _amount, uint256 _fee) public pure returns (bytes32) {
      /* "6e74f5d1": delegatedTransferHash(address,uint256,address,address,address,uint256,uint256) */
      return keccak256(bytes4(0x6e74f5d1), _token, _nonce, _from, _to, _delegate, _amount, _fee);
    }
}
