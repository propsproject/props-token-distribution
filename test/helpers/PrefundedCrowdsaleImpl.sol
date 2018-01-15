pragma solidity ^0.4.13;

import '../../contracts/crowdsale/PrefundedCrowdsale.sol';

contract PrefundedCrowdsaleImpl is PrefundedCrowdsale {

  function PrefundedCrowdsaleImpl (
      uint256 _startTime,
      uint256 _endTime,
      uint256 _rate,
      address _wallet
  )
      Crowdsale(_startTime, _endTime, _rate, _wallet)
      PrefundedCrowdsale()
  {
  }

}
