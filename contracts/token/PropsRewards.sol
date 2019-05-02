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
     event DailyRewardsSubmitted(
         uint256 indexed dailyTimestamp,
         bytes32 indexed rewardsHash,
         address indexed validator
     );

     event DailyRewardsApplicationsMinted(
         uint256 indexed dailyTimestamp,
         bytes32 indexed rewardsHash,
         uint256 numOfApplications,
         uint256 amount
     );

     event DailyRewardsValidatorsMinted(
         uint256 indexed dailyTimestamp,
         bytes32 indexed rewardsHash,
         uint256 numOfValidators,
         uint256 amount
     );
    
    /*
    *  Storage
    */
    // TODO Change this to 3 daily states - previous, current, new?
    mapping (uint256 => mapping (bytes32 => uint256)) private dailyRewardsConfirmations; // dailyTimestamp => rewardsHash => confirmations
    mapping (uint256 => mapping (address => bytes32)) private dailyRewardsValidatorSubmissions; // dailyTimestamp ==> validator ==> rewardsHash
    
    /*
    *  Modifiers
    */
    modifier onlyOneRewardsHashPerValidator(uint256 _dailyTimestamp, bytes32 _rewardsHash) {
         require(
             dailyRewardsValidatorSubmissions[_dailyTimestamp][msg.sender]!=_rewardsHash,
             "Must be one submission per validator per day per rewards hash"
             );
         _;
    }

    modifier onlyValidDailyTimestamp(uint256 _dailyTimestamp) {
        // assuming the daily timestamp is midnight UTC
        require(
             _dailyTimestamp % 86400 == 0,
             "Must be midnight"
             );
         _;
    }

     

    
    /**
    * @dev The initializer function for upgrade as initialize was already called, get the decimals used in the token to initialize the params
    * @param _decimals uint256 number of decimals used in total supply
    */
    function initializePostUpgrade(uint256 _decimals)
        public
        initializer
    {
        // max total supply is 1,000,000,000 PROPS specified in AttoPROPS
        uint256 maxTotalSupply = 1 * 1e9 * (10 ** uint256(_decimals));
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

    /**
    * @dev The initializer function, get the decimals used in the token to initialize the params
    * @param _decimals uint256 number of decimals used in total supply
    */
    function initialize(uint256 _decimals)
        public
        initializer
    {
        // max total supply is 1,000,000,000 PROPS specified in AttoPROPS
        uint256 maxTotalSupply = 1 * 1e9 * (10 ** uint256(_decimals));
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
    /**
    * @dev The function is called by validators with the calculation of the daily rewards
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    */
    function submitDailyRewards(    
        uint256 _dailyTimestamp, 
        bytes32 _rewardsHash, 
        address[] _applications, 
        uint256[] _amounts
    )
        public
        onlyValidDailyTimestamp(_dailyTimestamp)
        onlyActiveValidators(msg.sender)
        onlyOneRewardsHashPerValidator(_dailyTimestamp, _rewardsHash)
        returns (bool)
    {
        dailyRewardsValidatorSubmissions[_dailyTimestamp][msg.sender] = _rewardsHash;
        dailyRewardsConfirmations[_dailyTimestamp][_rewardsHash] += 1;
        // what happens with inactive apps?        
        if (dailyRewardsConfirmations[_dailyTimestamp][_rewardsHash] == requiredValidatorsForAppRewards()) {
            require(
                rewardHashIsvalid(_dailyTimestamp, _rewardsHash, _applications, _amounts),
                "Reward Hash is invalid"
            );
            (bool applicationsValid, uint256 sum) = validateSubmittedData(_applications, _amounts);
            require(
                applicationsValid,
                "Rewards data is invalid - inactive apps"
            );

            require(
                sum <= getMaxAppRewardsDailyAmount(),
                "Rewards data is invalid - daily reward amount too high"
            );
            mintDailyRewardsForApps(_dailyTimestamp, _rewardsHash, _applications, _amounts, sum);            
        }
        emit DailyRewardsSubmitted(_dailyTimestamp, _rewardsHash, msg.sender);
        if (dailyRewardsConfirmations[_dailyTimestamp][_rewardsHash] == requiredValidatorsForValidatorsRewards()) { // all validators have submitted            
            mintDailyRewardsForValidators(_dailyTimestamp, _rewardsHash);            
        }
        return true;
    }

    /**
    * @dev Mint rewards for validators
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _rewardsHash bytes32 hash of the rewards data    
    */
    function mintDailyRewardsForValidators(uint256 _dailyTimestamp, bytes32 _rewardsHash) 
        internal        
        returns (bool)
    {
        uint256 validatorDailyRewardsAmountSum = 0;
            for (uint j=0; j<validatorsList.length; j++) {
                _mint(validators[validatorsList[j]].rewardsAddress, getValidatorRewardsDailyAmountPerValidator());
                validatorDailyRewardsAmountSum += getValidatorRewardsDailyAmountPerValidator();
            }
            emit DailyRewardsValidatorsMinted(_dailyTimestamp, _rewardsHash, validatorsList.length, validatorDailyRewardsAmountSum);
        return true;
    }

    /**
    * @dev Mint rewards for apps
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    * @param _sum uint256 the sum of all application rewards given
    */
    function mintDailyRewardsForApps(
        uint256 _dailyTimestamp, 
        bytes32 _rewardsHash, 
        address[] _applications, 
        uint256[] _amounts, 
        uint256 _sum
    ) 
        internal        
        returns (bool)
    {
        for (uint i=0; i<_applications.length; i++) {
                _mint(applications[_applications[i]].rewardsAddress, _amounts[i]);
        }
        emit DailyRewardsApplicationsMinted(_dailyTimestamp, _rewardsHash, _applications.length, _sum);
        return true;
    }

    /**
    * @dev Checks if app daily rewards amount is valid
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    */
    function validateSubmittedData(address[] _applications, uint256[] _amounts) 
        public
        view
        returns (bool, uint256)
    {
        uint256 sum;
        for (uint i=0; i<_amounts.length; i++) {
             sum+=_amounts[i];
             if (applications[_applications[i]].status != ApplicationStatus.Active) return (false, 0);
        }
        return (true, sum);
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    */
    function getMaxAppRewardsDailyAmount() 
        public
        view
        returns (uint256)
    {
        return ((maxTotalSupply - totalSupply()) * appRewardsPercentPphm * appRewardsMaxVariationPercentPphm) / 1e8;        
    }        

    /**
    * @dev Checks if submitted data matches reward hash
    */
    function rewardHashIsvalid(uint256 _dailyTimestamp, bytes32 _rewardsHash, address[] _applications, uint256[] _amounts) 
        private
        pure        
        returns (bool)
    {
        return keccak256(abi.encodePacked(_dailyTimestamp, _applications, _amounts)) == _rewardsHash;
    }    

    /**
    * @dev Checks how many validators are needed for app rewards
    */
    function requiredValidatorsForAppRewards() 
        public
        view
        returns (uint256)
    {
        return ((validatorsList.length * validatorMajorityPercentPphm) / 1e8)+1;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    */
    function requiredValidatorsForValidatorsRewards() 
        public
        view
        returns (uint256)
    {
        return validatorsList.length;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    */
    function getValidatorRewardsDailyAmountPerValidator() 
        public
        view
        returns (uint256)
    {
        return (((maxTotalSupply - totalSupply()) * validatorRewardsPercentPphm) / 1e8) / validatorsList.length;
    }            
}