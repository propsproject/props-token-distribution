pragma solidity ^0.5.16;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";

/**
 * @title Props Time Based Transfers
 * @dev Contract allows to set a transfer start time (unix timestamp) from which transfers are allowed excluding one address defined in initialize
 **/
contract PropsTimeBasedTransfers is Initializable, ERC20 {
    uint256 public transfersStartTime; //OBSOLETE
    address public canTransferBeforeStartTime; //OBSOLETE
    /**
    Contract logic is no longer relevant.
    Leaving in the variables used for upgrade compatibility but the checks are no longer required
    */
}
