pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";

/**
 * @title Props Sidechain Compatible
 * @dev Added a settle function and events
 **/
contract PropsTimeBasedTransfers is ERC20 {
    
    uint public transfersStartTime;
    address public canTransferBeforeStartTime;

    /**
    * @notice The initializer function, with transfers start time `transfersStartTime`
    * and `canTransferBeforeStartTime` address which is exempt from start time restrictions
    * @param start uint Timestamp of when transfers can start
    * @param account uint256 address exempt from the start date check    
    */
    function initialize(
        uint start,
        address account
    )
        public
        initializer
    {
        transfersStartTime = start;
        canTransferBeforeStartTime = account;
    }

    function canTransfer(address account) public view returns (bool) {
        return (now > transfersStartTime || account==canTransferBeforeStartTime);
    }

    function transfer(
        address to,
        uint256 value
    )
    public    
    returns (bool)
    {
        require(
            canTransfer(msg.sender),
            "Transfers are not yet active"
        );
        return super.transfer(to, value);        
    }

    function transferFrom(
    address from,
    address to,
    uint256 value
    )
    public    
    returns (bool)
    {
        require(
            canTransfer(msg.sender),
            "Transfers are not yet active"
        );
        return super.transferFrom(from, to, value);        
    }    
}
