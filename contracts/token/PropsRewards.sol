pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
import "./PropsParameters.sol";
import "./PropsRewardEntities.sol";

/**
 * @title Props Rewards
 * @dev Contract allows to set approved apps and validators. Submit and mint rewards...
 **/
contract PropsRewards is Initializable, ERC20, PropsRewardEntities, PropsParameters {
    using SafeMath for uint256;    
    /*
     *  Events
     */
    
    /*
     *  Storage
     */
    
    
    /*
     *  Modifiers
     */
     
    /**
    * @dev The initializer function, get the decimals used in the token to initialize the params
    */
    function initialize(uint256 decimals)
        public
        initializer
    {
        // max total supply is 1,000,000,000 PROPS specified in AttoPROPS
        uint256 maxTotalSupply = 1 * 1e9 * (10 ** uint256(decimals));
        uint256 appRewardPercentage = 34750; // pphm ==> 0.03475%
        uint256 appRewardsMaxVariationPercentage = 1.5 * 1e8; //pphm ==> 150%
        uint256 validatorMajorityPercentage = 50 * 1e6; //pphm ==> 50%
        uint256 validatorRewardsPercentage = 1829; // pphm ==> 0.001829%
        PropsRewardEntities.initialize();
        PropsParameters.initialize(
            maxTotalSupply, 
            appRewardPercentage, 
            appRewardsMaxVariationPercentage, 
            validatorMajorityPercentage, validatorRewardsPercentage);            
    }    
}