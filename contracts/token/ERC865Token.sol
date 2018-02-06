pragma solidity ^0.4.18;

import "./ERC865.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
 * @title ERC865Token Token
 *
 * ERC865Token allows users paying transfers in tokens instead of gas
 * https://github.com/ethereum/EIPs/issues/865
 *
 */

contract ERC865Token is ERC865, StandardToken {

    /* Nonces of transfers performed */
    mapping(bytes => bool) signatures;

    event TransferPreSigned(address indexed from, address indexed to, address indexed delegate, uint256 amount, uint256 fee);
    event ApprovalPreSigned(address indexed from, address indexed to, address indexed delegate, uint256 amount, uint256 fee);

    event Log(uint initialGas,uint t1,uint t2,uint finalGas);

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
        public
        returns (bool)
    {
        uint initialGas = msg.gas;
        require(_to != address(0));
        require(signatures[_signature] == false);

        bytes32 hashedTx = transferPreSignedHashing(address(this), _to, _value, _gasPrice, _nonce);

        address from = recover(hashedTx, _signature);
        require(from != address(0));

        balances[_to] = balances[_to].add(_value);

        signatures[_signature] = true;

        Transfer(from, _to, _value);

        uint256 balanceFrom = balances[from].sub(_value);
        uint256 balanceSender = balances[msg.sender];
        uint storageCostSender = (balanceSender > 0) ? 5000 : 20000;

        uint fee = initialGas.add(27000).add(storageCostSender).sub(msg.gas).mul(_gasPrice); // 26000 = 21000 + 5000, still have to add the cost for 2 additions + 2 comparisons + 1 multiplication
        balances[from] = balanceFrom.sub(fee);
        balances[msg.sender] = balanceSender.add(fee);
        Transfer(from, msg.sender, fee);
        TransferPreSigned(from, _to, msg.sender, _value, fee);

        return true;
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
        public
        returns (bool)
    {
        uint initialGas = msg.gas;
        require(_spender != address(0));
        require(signatures[_signature] == false);

        bytes32 hashedTx = approvePreSignedHashing(address(this), _spender, _value, _gasPrice, _nonce);
        address from = recover(hashedTx, _signature);
        require(from != address(0));

        allowed[from][_spender] = _value;
        signatures[_signature] = true;

        Approval(msg.sender, _spender, _value);

        uint256 balanceFrom = balances[from].sub(_value);
        uint256 balanceSender = balances[msg.sender];
        uint storageCostSender = (balanceSender > 0) ? 5000 : 20000;

        uint fee = initialGas.add(27000).add(storageCostSender).sub(msg.gas).mul(_gasPrice); // 26000 = 21000 + 5000, still have to add the cost for 2 additions + 2 comparisons + 1 multiplication
        balances[from] = balanceFrom.sub(fee);
        balances[msg.sender] = balanceSender.add(fee);
        ApprovalPreSigned(from, _spender, msg.sender, _value, fee);

        return true;
    }

    /**
    * @dev returns the value of the original keccak256, signed by sender.
    * By having this signature and this order with hashing, generating the
    * data of this function returns (almost) the data to hash.
    * @param _token Address of the token
    * @param _to Address of recipient
    * @param _value Amount of tokens to send to the recipient
    * @param _gasPrice Amount of fee to send to the delegate
    * @param _nonce Nonce for the transaction
    */
    function transferPreSignedHashing(
        address _token,
        address _to,
        uint256 _value,
        uint256 _gasPrice,
        uint256 _nonce
    )
        public
        pure
        returns (bytes32)
    {
        /* "48664c16": transferPreSignedHashing(address,address,address,uint256,uint256,uint256) */
        return keccak256(bytes4(0x48664c16), _token, _to, _value, _gasPrice, _nonce);
    }


    /**
     * @notice Include a presigned `""095ea7b3": "approve(address,uint256)"`
     * @param _token Address of the token
     * @param _spender Address of recipient
     * @param _value The value of tokens to be transferred
     * @param _gasPrice How much tokens willing to pay per gas
     * @param _nonce Presigned transaction number.
     */
    function approvePreSignedHashing(
        address _token,
        address _spender,
        uint256 _value,
        uint256 _gasPrice,
        uint256 _nonce
    )
        public
        pure
        returns (bytes32)
    {
        /* "20162639": approvePreSignedHashing(address,address,uint256,uint256,uint256) */
        return keccak256(bytes4(0x20162639), _token, _spender, _value, _gasPrice, _nonce);
    }

    /**
     * @dev Recover signer address from a message by using his signature
     * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
     * @param sig bytes signature, the signature is generated using web3.eth.sign()
     */
    function recover(bytes32 hash, bytes sig) public pure returns (address) {
      bytes32 r;
      bytes32 s;
      uint8 v;

      //Check the signature length
      if (sig.length != 65) {
        return (address(0));
      }

      // Divide the signature in r, s and v variables
      assembly {
        r := mload(add(sig, 32))
        s := mload(add(sig, 64))
        v := byte(0, mload(add(sig, 96)))
      }

      // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
      if (v < 27) {
        v += 27;
      }

      // If the version is correct return the signer address
      if (v != 27 && v != 28) {
        return (address(0));
      } else {
        return ecrecover(hash, v, r, s);
      }
    }

}
