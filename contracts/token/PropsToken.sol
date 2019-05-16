pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Detailed.sol";
import "./PropsTimeBasedTransfers.sol";
import "./ERC865Token.sol";
import "./PropsRewards.sol";

/**
 * @title PROPSToken
 * @dev PROPS token contract (based of ZEPToken by openzeppelin), a detailed ERC20 token
 * https://github.com/zeppelinos/zos-vouching/blob/master/contracts/ZEPToken.sol
 * PROPS are divisible by 1e18 base
 * units referred to as 'AttoPROPS'.
 *
 * PROPS are displayed using 18 decimal places of precision.
 *
 * 1 PROPS is equivalent to:
 *   1 * 1e18 == 1e18 == One Quintillion AttoPROPS
 *
 * 600 Million PROPS (total supply) is equivalent to:
 *   600000000 * 1e18 == 6e26 AttoPROPS
 *

 */


contract PropsToken is Initializable, ERC20Detailed, ERC865Token, PropsTimeBasedTransfers, PropsRewards {

  /**
   * @dev Initializer function. Called only once when a proxy for the contract is created.
   * @param _holder address that will receive it's initial supply and be able to transfer before transfers start time
   * @param _transfersStartTime uint256 Unix Timestamp from which transfers are allowed
   * @param _controller address that will have controller functionality on rewards protocol
   * @param _minSecondsBetweenDays uint256 seconds required to pass between consecutive rewards day
   */
  function initialize(
    address _holder,
    uint256 _transfersStartTime,
    address _controller,
    uint256 _minSecondsBetweenDays
  )
    public
    initializer
  {
    uint8 decimals = 18;
    // total supply is 600,000,000 PROPS specified in AttoPROPS
    uint256 totalSupply = 0.6 * 1e9 * (10 ** uint256(decimals));

    ERC20Detailed.initialize("Props Token", "PROPS", decimals);
    PropsTimeBasedTransfers.initialize(_transfersStartTime, _holder);
    PropsRewards.initialize(_controller, decimals, _minSecondsBetweenDays);
    _mint(_holder, totalSupply);
  }

  /**
   * @dev Initializer for upgrade function. Called only once after upgrade
   * @param _controller address that will have controller functionality on rewards protocol
   * @param _minSecondsBetweenDays uint256 seconds required to pass between consecutive rewards day
   */
  function initializePostRewardsUpgrade1(address _controller, uint256 _minSecondsBetweenDays)
    public
    initializer
  {
    uint8 decimals = 18;
    PropsRewards.initializePostRewardsUpgrade1(_controller, decimals, _minSecondsBetweenDays);
  }

}