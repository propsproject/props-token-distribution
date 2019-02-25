pragma solidity ^0.4.24;

import { ECDSA } from "openzeppelin-eth/contracts/cryptography/ECDSA.sol";
import "./ERC865.sol";

/**
 * @title ERC865Token Token
 *
 * ERC865Token allows users paying transfers in tokens instead of gas
 * https://github.com/ethereum/EIPs/issues/865
 *
 */

contract ERC865Token is ERC865 {

    /* hashed tx of transfers performed */
    mapping(bytes32 => bool) hashedTxs;

    event TransferPreSigned(address indexed from, address indexed to, address indexed delegate, uint256 amount, uint256 fee);
    event ApprovalPreSigned(address indexed from, address indexed to, address indexed delegate, uint256 amount, uint256 fee);
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
        returns (bool)
    {        
        require(_to != address(0));        

        bytes32 hashedParams = transferPreSignedHashing(address(this), _to, _value, _fee, _nonce);
        address from = ECDSA.recover(hashedParams, _signature);     
        require(from != address(0));
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false);
        _transfer(from, _to, _value);
        _transfer(from, msg.sender, _fee);        
        hashedTxs[hashedTx] = true;

        emit TransferPreSigned(from, _to, msg.sender, _value, _fee);
        return true;
    }

    /**
     * @notice Submit a presigned approval
     * @param _signature bytes The signature, issued by the owner.
     * @param _spender address The address which will spend the funds.
     * @param _value uint256 The amount of tokens to allow.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function approvePreSigned(
        bytes _signature,
        address _spender,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        public
        returns (bool)
    {
        require(_spender != address(0));        

        bytes32 hashedParams = approvePreSignedHashing(address(this), _spender, _value, _fee, _nonce);
        address from = ECDSA.recover(hashedParams, _signature);
        require(from != address(0));
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false);
        _approve(from, _spender, _value);        
        _transfer(from, msg.sender, _fee);        
        hashedTxs[hashedTx] = true;

        emit ApprovalPreSigned(from, _spender, msg.sender, _value, _fee);
        return true;
    }

    /**
     * @notice Increase the amount of tokens that an owner allowed to a spender.
     * @param _signature bytes The signature, issued by the owner.
     * @param _spender address The address which will spend the funds.
     * @param _addedValue uint256 The amount of tokens to increase the allowance by.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function increaseApprovalPreSigned(
        bytes _signature,
        address _spender,
        uint256 _addedValue,
        uint256 _fee,
        uint256 _nonce
    )
        public
        returns (bool)
    {
        require(_spender != address(0));        

        bytes32 hashedParams = increaseApprovalPreSignedHashing(address(this), _spender, _addedValue, _fee, _nonce);
        address from = ECDSA.recover(hashedParams, _signature);
        require(from != address(0));
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false);
        _approve(from, _spender, allowance(from, _spender).add(_addedValue));        
        _transfer(from, msg.sender, _fee);        
        hashedTxs[hashedTx] = true;

        emit ApprovalPreSigned(from, _spender, msg.sender, allowance(from, _spender), _fee);
        return true;
    }

    /**
     * @notice Decrease the amount of tokens that an owner allowed to a spender.
     * @param _signature bytes The signature, issued by the owner
     * @param _spender address The address which will spend the funds.
     * @param _subtractedValue uint256 The amount of tokens to decrease the allowance by.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function decreaseApprovalPreSigned(
        bytes _signature,
        address _spender,
        uint256 _subtractedValue,
        uint256 _fee,
        uint256 _nonce
    )
        public
        returns (bool)
    {
        require(_spender != address(0));        

        bytes32 hashedParams = decreaseApprovalPreSignedHashing(address(this), _spender, _subtractedValue, _fee, _nonce);
        address from = ECDSA.recover(hashedParams, _signature);
        require(from != address(0));
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false);
        uint oldValue = allowance(from, _spender);
        if (_subtractedValue > oldValue) {
            _approve(from, _spender, 0);            
        } else {
            _approve(from, _spender, allowance(from,_spender).sub(_subtractedValue));            
        }
        _transfer(from, msg.sender, _fee);        
        hashedTxs[hashedTx] = true;

        emit ApprovalPreSigned(from, _spender, msg.sender, allowance(from, _spender), _fee);
        return true;
    }

    /**
     * @notice Transfer tokens from one address to another
     * @param _signature bytes The signature, issued by the spender.
     * @param _from address The address which you want to send tokens from.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the spender.
     * @param _nonce uint256 Presigned transaction number.
     */
    function transferFromPreSigned(
        bytes _signature,
        address _from,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        public
        returns (bool)
    {
        require(_to != address(0));        

        bytes32 hashedParams = transferFromPreSignedHashing(address(this), _from, _to, _value, _fee, _nonce);

        address spender = ECDSA.recover(hashedParams, _signature);
        require(spender != address(0));
        bytes32 hashedTx = keccak256(abi.encodePacked(spender, hashedParams));
        require(hashedTxs[hashedTx] == false);
        _transfer(_from, _to, _value);        
        _approve(_from, spender, allowance(_from, spender).sub(_value));        
        _transfer(spender, msg.sender, _fee);        
        hashedTxs[hashedTx] = true;

        emit TransferPreSigned(_from, _to, msg.sender, _value, _fee);
        return true;
    }


    /**
     * @notice Hash (keccak256) of the payload used by transferPreSigned
     * @param _token address The address of the token.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function transferPreSignedHashing(
        address _token,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        public
        pure
        returns (bytes32)
    {
        /* "15420b71": transferPreSignedHashing(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0x15420b71), _token, _to, _value, _fee, _nonce));
    }

    /**
     * @notice Hash (keccak256) of the payload used by approvePreSigned
     * @param _token address The address of the token
     * @param _spender address The address which will spend the funds.
     * @param _value uint256 The amount of tokens to allow.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function approvePreSignedHashing(
        address _token,
        address _spender,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        public
        pure
        returns (bytes32)
    {
        /* "f7ac9c2e": approvePreSignedHashing(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0xf7ac9c2e), _token, _spender, _value, _fee, _nonce));
    }

    /**
     * @notice Hash (keccak256) of the payload used by increaseApprovalPreSigned
     * @param _token address The address of the token
     * @param _spender address The address which will spend the funds.
     * @param _addedValue uint256 The amount of tokens to increase the allowance by.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function increaseApprovalPreSignedHashing(
        address _token,
        address _spender,
        uint256 _addedValue,
        uint256 _fee,
        uint256 _nonce
    )
        public
        pure
        returns (bytes32)
    {
        /* "a45f71ff": increaseApprovalPreSignedHashing(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0xa45f71ff), _token, _spender, _addedValue, _fee, _nonce));
    }

     /**
      * @notice Hash (keccak256) of the payload used by decreaseApprovalPreSigned
      * @param _token address The address of the token
      * @param _spender address The address which will spend the funds.
      * @param _subtractedValue uint256 The amount of tokens to decrease the allowance by.
      * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
      * @param _nonce uint256 Presigned transaction number.
      */
    function decreaseApprovalPreSignedHashing(
        address _token,
        address _spender,
        uint256 _subtractedValue,
        uint256 _fee,
        uint256 _nonce
    )
        public
        pure
        returns (bytes32)
    {
        /* "59388d78": decreaseApprovalPreSignedHashing(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0x59388d78), _token, _spender, _subtractedValue, _fee, _nonce));
    }

    /**
     * @notice Hash (keccak256) of the payload used by transferFromPreSigned
     * @param _token address The address of the token
     * @param _from address The address which you want to send tokens from.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the spender.
     * @param _nonce uint256 Presigned transaction number.
     */
    function transferFromPreSignedHashing(
        address _token,
        address _from,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        public
        pure
        returns (bytes32)
    {
        /* "b7656dc5": transferFromPreSignedHashing(address,address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0xb7656dc5), _token, _from, _to, _value, _fee, _nonce));
    }
}