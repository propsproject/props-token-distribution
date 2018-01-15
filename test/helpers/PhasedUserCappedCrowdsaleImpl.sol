pragma solidity ^0.4.13;

import '../../contracts/crowdsale/PhasedUserCappedCrowdsale.sol';

contract PhasedUserCappedCrowdsaleImpl is PhasedUserCappedCrowdsale {

  function PhasedUserCappedCrowdsaleImpl (
      uint256 _startTime,
      uint256 _endTime,
      uint256 _rate,
      uint256 _cap,
      address _wallet
  )
      Crowdsale(_startTime, _endTime, _rate, _wallet)
      PhasedUserCappedCrowdsale(_cap)
  {
  }

}
