pragma solidity ^0.4.13;


import '../../contracts/crowdsale/PropsCrowdsale.sol';

contract PropsCrowdsaleImpl is PropsCrowdsale {

  function PropsCrowdsaleImpl (
      uint256 _startTime,
      uint256 _endTime,
      uint256 _softCap,
      uint256 _hardCap,
      address _wallet,
      address _token
  )
      PropsCrowdsale(_startTime, _endTime, _softCap, _hardCap, _wallet, _token)
  {
  }

}
