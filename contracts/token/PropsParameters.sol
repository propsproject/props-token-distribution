pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/ownership/Ownable.sol";

/**
 * @title Props Parameters
 * @dev Contract allows to set and get parameters related to rewards
 **/
contract PropsParameters is Initializable, Ownable {
    /*
     *  Events
     */
    event ParameterUpdate(
        string param,
        uint256 newValue,
        uint256 oldValue,
        uint256 timestamp
    );

    /*
     *  Storage
     */
    uint256 maxTotalSupply;
    uint256 appRewardsPercentPphm;
    uint256 appRewardsMaxVariationPercentPphm;
    uint256 validatorMajorityPercentPphm;
    uint256 validatorRewardsPercentPphm;
    
    uint256 lastAppRewardsPercentPphm;
    uint256 lastAppRewardsUpdateTimestamp;

    uint256 lastAppRewardsMaxVariationPercentPphm;
    uint256 lastAppRewardsMaxVariationUpdateTimestamp;

    uint256 lastValidatorMajorityPercentPphm;
    uint256 lastvalidatorMajorityUpdateTimestamp;

    uint256 lastValidatorRewardsPercentPphm;
    uint256 lastValidatorRewardsUpdateTimestamp;

    /**
    * @dev The initializer function, percentage is specified in pphm (1/100,000,000) e.g. 50,000,000 => 50%
    * @param _maxTotalSupply uint256 max props that can be minted    
    * @param _appRewardsPercentPphm uint256 app rewards percentage in pphm
    * @param _appRewardsMaxVariationPercentPphm uint256 app rewards max allowed variation percentage in pphm
    * @param _validatorMajorityPercentPphm uint256 validators majority percentage in pphm
    * @param _validatorRewardsPercentPphm uint256 app rewards percentage in pphm
    */    
    function initialize(
        uint256 _maxTotalSupply,
        uint256 _appRewardsPercentPphm,
        uint256 _appRewardsMaxVariationPercentPphm,
        uint256 _validatorMajorityPercentPphm,
        uint256 _validatorRewardsPercentPphm
    )
        public
        initializer
    {
        maxTotalSupply = _maxTotalSupply;
        appRewardsPercentPphm = _appRewardsPercentPphm;
        appRewardsMaxVariationPercentPphm = _appRewardsMaxVariationPercentPphm;
        validatorMajorityPercentPphm = _validatorMajorityPercentPphm;
        validatorRewardsPercentPphm = _validatorRewardsPercentPphm;
    }

/**
    * @dev Allows the current owner/controller to set app validator rewards daily percentage
    * @param _percentagePphm uint256 the new value to use
    * @param _timestamp from which time should the value take effect
    */
    function setValidatorRewardsPercentage(
        uint256 _percentagePphm,
        uint256 _timestamp
    ) 
        public
        onlyOwner        
        returns (bool)
    {
        if (block.timestamp >= lastValidatorRewardsUpdateTimestamp) {
            lastValidatorRewardsPercentPphm = validatorRewardsPercentPphm;                
        }        
        validatorRewardsPercentPphm = _percentagePphm;
        lastValidatorRewardsUpdateTimestamp = _timestamp;
        emit ParameterUpdate("validatorRewardsPercentage", validatorRewardsPercentPphm, lastValidatorRewardsPercentPphm, lastValidatorRewardsUpdateTimestamp);
        return true;
    }

    /**
    * @dev Get the current value of validator rewards percentage in ppm
    * @param _timestamp for which time should we get the value
    */
    function getValidatorRewardsPercentage(uint256 _timestamp)
        public
        view
        returns (uint256 percentagePphm)
    {
        if (_timestamp >= lastValidatorRewardsUpdateTimestamp) {
            return validatorRewardsPercentPphm;
        } else {
            return lastValidatorRewardsPercentPphm;
        }
    }

    /**
    * @dev Allows the current owner/controller to set app rewards daily max variation percentage
    * @param _percentagePphm uint256 the new value to use
    * @param _timestamp from which time should the value take effect
    */
    function setAppRewardsMaxVariationPercentage(
        uint256 _percentagePphm,
        uint256 _timestamp
    ) 
        public
        onlyOwner        
        returns (bool)
    {
        if (block.timestamp >= lastAppRewardsMaxVariationUpdateTimestamp) {
            lastAppRewardsMaxVariationPercentPphm = appRewardsMaxVariationPercentPphm;
        }
        appRewardsMaxVariationPercentPphm = _percentagePphm;
        lastAppRewardsMaxVariationUpdateTimestamp = _timestamp;
        emit ParameterUpdate("appRewardsMaxVariationPercentage", appRewardsMaxVariationPercentPphm, lastAppRewardsMaxVariationPercentPphm, lastAppRewardsMaxVariationUpdateTimestamp);
        return true;
    }

    /**
    * @dev Get the current value of app rewards max variation percentage
    * @param _timestamp for which time should we get the value
    */
    function getAppRewardsMaxVariationPercentage(uint256 _timestamp)
        public
        view
        returns (uint256 percentagePphm)
    {
        if (_timestamp >= lastAppRewardsMaxVariationUpdateTimestamp) {
            return appRewardsMaxVariationPercentPphm;
        } else {
            return lastAppRewardsMaxVariationPercentPphm;
        }
    }

    /**
    * @dev Allows the current owner/controller to set app rewards percentage
    * @param _percentagePphm uint256 the new value to use
    * @param _timestamp from which time should the value take effect
    */
    function setAppRewardsPercentage(
        uint256 _percentagePphm,
        uint256 _timestamp
    ) 
        public
        onlyOwner        
        returns (bool)
    {
        if (block.number >= lastAppRewardsUpdateTimestamp) {
            lastAppRewardsPercentPphm = appRewardsPercentPphm;
        }
        appRewardsPercentPphm = _percentagePphm;
        lastAppRewardsUpdateTimestamp = _timestamp;
        emit ParameterUpdate("appRewardsPercentage", appRewardsPercentPphm, lastAppRewardsPercentPphm, lastAppRewardsUpdateTimestamp);
        return true;
    }

    /**
    * @dev Get the current value of app rewards percentage
    * @param _timestamp for which time should we get the value
    */
    function getAppRewardsPercentage(uint256 _timestamp)
        public
        view
        returns (uint256 percentagePphm)
    {
        if (_timestamp >= lastAppRewardsUpdateTimestamp) {
            return appRewardsPercentPphm;
        } else {
            return lastAppRewardsPercentPphm;
        }
    }

    /**
    * @dev Allows the current owner/controller to set required validators majority percentage
    * @param _percentagePphm uint256 the new value to use
    * @param _timestamp from which time should the value take effect
    */
    function setValidatorsMajorityPercentage(
        uint256 _percentagePphm,
        uint256 _timestamp
    ) 
        public
        onlyOwner        
        returns (bool)
    {
        if (block.timestamp >= lastvalidatorMajorityUpdateTimestamp) {
            lastValidatorMajorityPercentPphm = validatorMajorityPercentPphm;
        }        
        validatorMajorityPercentPphm = _percentagePphm;
        lastvalidatorMajorityUpdateTimestamp = _timestamp;
        emit ParameterUpdate("majorityPercentage", validatorMajorityPercentPphm, lastValidatorMajorityPercentPphm, lastvalidatorMajorityUpdateTimestamp);
        return true;
    }

    /**
    * @dev Get the current value of validators majority percentage
    * @param _timestamp for which time should we get the value
    */
    function getValidatorsMajorityPercentage(uint256 _timestamp)
        public
        view
        returns (uint256 percentagePphm)
    {
        if (_timestamp >= lastvalidatorMajorityUpdateTimestamp) {
            return validatorMajorityPercentPphm;
        } else {
            return lastValidatorMajorityPercentPphm;
        }
    }
}
