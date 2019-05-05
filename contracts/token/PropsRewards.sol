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
    mapping (uint256 => mapping (bytes32 => uint256)) private dailyRewardsConfirmations; // day of the week => rewardsHash => confirmations
    mapping (uint256 => mapping (address => bytes32)) private dailyRewardsValidatorSubmissions; // day of the week ==> validator ==> rewardsHash
    mapping (uint256 => uint256) private dowToDailyTimestamp; // day of the week ==> daily timestamp
    mapping (uint256 => address[]) private dowToDailyValidatorsList; // day of the week ==> validators array for that day

    /*
    *  Modifiers
    */
    modifier onlyOneRewardsHashPerValidator(uint256 _dailyTimestamp, bytes32 _rewardsHash) {
         require(
             dailyRewardsValidatorSubmissions[getDayOfWeek(_dailyTimestamp)][msg.sender]!=_rewardsHash,
             "Must be one submission per validator per day per rewards hash"
             );
         _;
    }

    /**
    * @dev The initializer function for upgrade as initialize was already called, get the decimals used in the token to initialize the params
    * @param _decimals uint256 number of decimals used in total supply
    */
    function initializePostRewardsUpgrade1(uint256 _decimals)
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
        PropsParameters.initialize
        (
            maxTotalSupply,
            appRewardPercentage,
            appRewardsMaxVariationPercentage,
            validatorMajorityPercentage, validatorRewardsPercentage
        );
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
        PropsParameters.initialize
        (
            maxTotalSupply,
            appRewardPercentage,
            appRewardsMaxVariationPercentage,
            validatorMajorityPercentage, validatorRewardsPercentage
        );
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
        uint256 day = getDayOfWeek(_dailyTimestamp);
        dailyRewardsValidatorSubmissions[day][msg.sender] = _rewardsHash;
        dailyRewardsConfirmations[day][_rewardsHash] += 1;
        if (dowToDailyTimestamp[day] != _dailyTimestamp) {
            dowToDailyTimestamp[day] = _dailyTimestamp;
            updateDailyValidatorsList(day);
        }
        if (dailyRewardsConfirmations[day][_rewardsHash] == requiredValidatorsForAppRewards(day)) {
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
        if (
            dailyRewardsConfirmations[_dailyTimestamp][_rewardsHash] == requiredValidatorsForValidatorsRewards(day)
        ) { // all validators have submitted
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
        uint256 dayOfWeek = getDayOfWeek(_dailyTimestamp);
            for (uint256 i = 0; i < validatorsList.length; i++) {
                _mint(validators[validatorsList[i]].rewardsAddress, getValidatorRewardsDailyAmountPerValidator(dayOfWeek));
                validatorDailyRewardsAmountSum += getValidatorRewardsDailyAmountPerValidator(dayOfWeek);
            }
            emit DailyRewardsValidatorsMinted
            (
                _dailyTimestamp,
                _rewardsHash,
                dowToDailyValidatorsList[dayOfWeek].length,
                validatorDailyRewardsAmountSum
            );
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
        for (uint256 i = 0; i < _applications.length; i++) {
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
        for (uint256 i = 0; i < _amounts.length; i++) {
             sum += _amounts[i];
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
    * @dev Get day of the week based on daily timestamp (midnight UTC)
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    */
    function getDayOfWeek(uint256 _dailyTimestamp)
        private
        pure
        onlyValidDailyTimestamp(_dailyTimestamp)
        returns (uint256)
    {
        return ((_dailyTimestamp / 86400) + 4) % 7; // return day of the week with 0 being Sunday and 6 is Saturday
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _dayOfWeek uint256 the daily reward day of week
    */
    function requiredValidatorsForAppRewards(uint256 _dayOfWeek)
        public
        view
        returns (uint256)
    {
        return ((dowToDailyValidatorsList[_dayOfWeek].length * validatorMajorityPercentPphm) / 1e8)+1;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _dayOfWeek uint256 the daily reward day of week
    */
    function requiredValidatorsForValidatorsRewards(uint256 _dayOfWeek)
        public
        view
        returns (uint256)
    {
        return dowToDailyValidatorsList[_dayOfWeek].length;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _dayOfWeek uint256 the daily reward day of week
    */
    function getValidatorRewardsDailyAmountPerValidator(uint256 _dayOfWeek)
        public
        view
        returns (uint256)
    {
        return (((maxTotalSupply - totalSupply()) * validatorRewardsPercentPphm) / 1e8) / dowToDailyValidatorsList[_dayOfWeek].length;
    }

    /**
    * @dev Get active validators list
    */
    function getNewValidatorsList(uint256 _dailyTimestamp)
        public
        view
        returns (address[])
    {
        address[] memory dailyValidators;
        uint256 counter = 0;
        for (uint256 i = 0; i < validatorsList.length ; i++) {
            if (validators[validatorsList[i]].status == ValidatorStatus.Active && _dailyTimestamp > validators[validatorsList[i]].timeAdded) {
                dailyValidators[counter] = validatorsList[i];
                counter++;
            }
        }
        return dailyValidators;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _dayOfWeek uint256 the daily reward day of week
    */
    function updateDailyValidatorsList(uint256 _dayOfWeek)
        internal
        returns (bool)
    {
        address[] memory newValidators = getNewValidatorsList(dowToDailyTimestamp[_dayOfWeek]);
        // same length of list just replace it
        if (dowToDailyValidatorsList[_dayOfWeek].length == newValidators.length) {
            for (uint256 i = 0; i < newValidators.length; i++) {
                dowToDailyValidatorsList[_dayOfWeek][i] = newValidators[i];
            }
        }
        else {
            // size of new list is different than last week for this day, delete array and populate
            // otherwise it's the first time so just pupulate it
            if (dowToDailyValidatorsList[_dayOfWeek].length > 0) {
                deleteValidatorsList(_dayOfWeek);
            }
            for (uint256 j = 0; j < newValidators.length; j++) {
                dowToDailyValidatorsList[_dayOfWeek].push(newValidators[j]);
            }
        }
        return true;
    }

    /**
    * @dev Delete existing values from the daily validators list
    * @param _dayOfWeek uint256 the daily reward day of week
    */
    function deleteValidatorsList(uint256 _dayOfWeek)
        internal
        returns (bool)
    {
        for (uint256 i = 0; i < dowToDailyValidatorsList[_dayOfWeek].length ; i++) {
            delete dowToDailyValidatorsList[_dayOfWeek][i];
            dowToDailyValidatorsList[_dayOfWeek].length--;
        }
        return true;
    }
}