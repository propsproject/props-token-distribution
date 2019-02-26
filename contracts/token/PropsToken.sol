pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "./ERC20Detailed.sol";
import "./PropsSidechainCompatible.sol";
import "./PropsTimeBasedTransfers.sol";
import "./ERC865Token.sol";

/**
 * @title PROPSToken
 * @dev PROPS token contract (based of ZEPToken by openzeppelin), a detailed ERC20 including pausable functionality.
 * The TPLToken integration causes tokens to only be transferrable to addresses
 * which have the validRecipient attribute in the jurisdiction.
 */
contract PropsToken is Initializable, ERC20Detailed, PropsSidechainCompatible, ERC865Token, PropsTimeBasedTransfers {

  /**
   * @dev Initializer function. Called only once when a proxy for the contract is created.
   * @param _holder Address that will receive it's initial supply and be able to transfer before transfers start time
   * @param _transfersStartTime Timestamp from which transfers are allowed   
   */
  function initialize(
    address _holder,
    uint _transfersStartTime
  )
    initializer
    public
  {
    uint8 decimals = 18;
    uint256 totalSupply = 0.6 * 1e9 * (10 ** uint256(decimals));
    
    ERC20Detailed.initialize("DEV_Token", "DEV_TOKEN", decimals);
    PropsTimeBasedTransfers.initialize(_transfersStartTime, _holder);    
    _mint(_holder, totalSupply);
  }

}