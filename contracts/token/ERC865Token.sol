pragma solidity ^0.5.16;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
import { ECDSA } from "openzeppelin-eth/contracts/cryptography/ECDSA.sol";
import "./IERC865.sol";

/**
 * @title ERC865Token Token
 *
 * ERC865Token allows users paying transfers in tokens instead of gas
 * https://github.com/ethereum/EIPs/issues/865
 *
 * This contract is obsolete using new EIP-2612
 *
 */

contract ERC865Token is Initializable, ERC20, IERC865 {

    /* hashed tx of transfers performed */
    mapping(bytes32 => bool) hashedTxs; //OBSOLETE    
}