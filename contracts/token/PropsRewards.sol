pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
// import "./PropsParameters.sol";
import { PropsRewardsLib } from "./PropsRewardsLib.sol";

/**
 * @title Props Rewards
 * @dev Contract allows to set approved apps and validators. Submit and mint rewards...
 **/
contract PropsRewards is Initializable, ERC20 /*, PropsParameters*/ {
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

    event ApplicationUpdated(
        address indexed id,
        bytes32 name,
        address rewardsAddress,
        address indexed sidechainAddress
    );

    event ValidatorUpdated(
        address indexed id,
        bytes32 name,
        address rewardsAddress,
        address indexed sidechainAddress
    );

    event ParameterUpdate(
        PropsRewardsLib.ParameterName param,
        uint256 newValue,
        uint256 oldValue,
        uint256 timestamp
    );

    event ControllerUpdate(address indexed newController);

    //

    /*
    *  Storage
    */

    struct ValidatorsList {
        mapping (address => bool) currentValidators;
        mapping (address => bool) previousValidators;
        address[] currentValidatorsList;
        address[] previousValidatorsCount;
        uint256 updateTimestamp;
    }

    PropsRewardsLib.Data public rewardsLibData;
    // mapping (address => PropsRewardsLib.Application) public applications;
    // mapping (address => PropsRewardsLib.Validator) public validators;

    mapping (uint256 => mapping (bytes32 => uint256)) private dailyRewardsConfirmations; // day of the week => rewardsHash => confirmations
    mapping (uint256 => mapping (address => bytes32)) private dailyRewardsValidatorSubmissions; // day of the week ==> validator ==> rewardsHash
    mapping (uint256 => uint256) private dowToDailyTimestamp; // day of the week ==> daily timestamp
    mapping (address => uint256) public currentValidators;
    mapping (address => uint256) public previousValidators;
    ValidatorsList public validatorsList;
    uint256 public currentValidatorsDailyTimestamp;
    uint256 public maxTotalSupply;
    address public controller; // controller entity
    /*
    *  Modifiers
    */
    modifier onlyController() {
        require(
            msg.sender == controller,
            "Must be the controller"
        );
        _;
    }

    modifier onlyOneRewardsHashPerValidator(uint256 _dailyTimestamp, bytes32 _rewardsHash) {
         require(
             dailyRewardsValidatorSubmissions[getDayOfWeek(_dailyTimestamp)][msg.sender]!=_rewardsHash,
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

    modifier onlyFutureValidDailyTimestamp(uint256 _dailyTimestamp) {
        require(
             _dailyTimestamp % 86400 == 0 && _dailyTimestamp > currentValidatorsDailyTimestamp,
             "Must be midnight and bigger than current daily timestamp"
             );
         _;
    }

    modifier onlyFutureValidValidatorDailyTimestamp(uint256 _dailyTimestamp) {
        require(
             _dailyTimestamp % 86400 == 0 && _dailyTimestamp > validatorsList.updateTimestamp,
             "Must be midnight and bigger than current daily timestamp"
             );
         _;
    }

    modifier onlyActiveValidators(uint256 _dailyTimestamp, address _validator) {
        // TODO write this modifier, to use a function to check if in correct list
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
    function initializePostRewardsUpgrade1(address _controller, uint256 _decimals)
        public
        initializer
    {
        // max total supply is 1,000,000,000 PROPS specified in AttoPROPS
        maxTotalSupply = 1 * 1e9 * (10 ** uint256(_decimals));
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ApplicationRewardsPercent, 34750, 0); // pphm ==> 0.03475%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ApplicationRewardsMaxVariationPercent, 1.5 * 1e8, 0); // pphm ==> 150%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ValidatorMajorityPercent, 50 * 1e6, 0); // pphm ==> 50%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ValidatorRewardsPercent, 1829, 0); // pphm ==> 0.001829%
        controller = _controller;
    }

    /**
    * @dev The initializer function, get the decimals used in the token to initialize the params
    * @param _decimals uint256 number of decimals used in total supply
    */
    function initialize(address _controller, uint256 _decimals)
        public
        initializer
    {
        // max total supply is 1,000,000,000 PROPS specified in AttoPROPS
        maxTotalSupply = 1 * 1e9 * (10 ** uint256(_decimals));
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ApplicationRewardsPercent, 34750, 0); // pphm ==> 0.03475%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ApplicationRewardsMaxVariationPercent, 1.5 * 1e8, 0); // pphm ==> 150%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ValidatorMajorityPercent, 50 * 1e6, 0); // pphm ==> 50%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ValidatorRewardsPercent, 1829, 0); // pphm ==> 0.001829%
        controller = _controller;
    }

    /**
    * @dev Set new validators list
    * @param _dailyTimestamp uint256 the daily reward timestamp from which this change should take effect
    * @param _validators address[] array of validators
    */
    function setValidators(uint256 _dailyTimestamp, address[] _validators)
        public
        onlyController
        onlyFutureValidValidatorDailyTimestamp(_dailyTimestamp)
        returns (bool)
    {

        if (validatorsList.currentValidatorsList.length == 0) { // first time the daily validators list is set
            _updateCurrentValidatorsList(_validators);
        } else {
            _updatePreviousValidatorsList();
            _updateCurrentValidatorsList(_validators);
        }
        validatorsList.updateTimestamp = _dailyTimestamp;
        // TODO emit event about the list being updated with size of the list?
        return true;
    }

    /**
    * @dev Update current daily validators list
    * @param _validators address[] array of validators
    */
    function _updateCurrentValidatorsList(address[] _validators)
        internal
        returns (bool)
    {
        if (
            validatorsList.currentValidatorsList.length == 0 ||
            validatorsList.currentValidatorsList.length == _validators.length
        ) {
            for (uint256 i = 0; i < _validators.length; i++) {
                // TODO check validators actually exist
                // TODO add to list and map push if length == 0 update if length is identical
            }
        }
        // TODO handle case length is the different by deleting previous values and inserting
    }

    /**
    * @dev Update current daily validators list
    */
    function _updatePreviousValidatorsList()
        internal
        returns (bool)
    {
        if (
            validatorsList.previousValidatorsList.length == 0 ||
            validatorsList.currentValidatorsList.length == validatorsList.previousValidatorsList.length
        ) {
            for (uint256 i = 0; i < validatorsList.currentValidatorsList.length.length; i++) {
                // TODO check validators actually exist
                // TODO add to list and map push if length == 0 update if length is identical
            }
        }
        // TODO handle case length is the different by deleting previous values and inserting
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
        onlyActiveValidators(_dailyTimestamp, msg.sender)
        onlyOneRewardsHashPerValidator(_dailyTimestamp, _rewardsHash)
        returns (bool)
    {
        uint256 day = getDayOfWeek(_dailyTimestamp);
        dailyRewardsValidatorSubmissions[day][msg.sender] = _rewardsHash;
        dailyRewardsConfirmations[day][_rewardsHash] += 1;
        if (dowToDailyTimestamp[day] != _dailyTimestamp) {
            dowToDailyTimestamp[day] = _dailyTimestamp;
            // updateDailyValidatorsList(day);
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
        // for (uint256 i = 0; i < validatorsList.length; i++) {
        //     // _mint(validators[validatorsList[i]].rewardsAddress, getValidatorRewardsDailyAmountPerValidator(dayOfWeek));
        //     validatorDailyRewardsAmountSum += getValidatorRewardsDailyAmountPerValidator(dayOfWeek);
        // }
        emit DailyRewardsValidatorsMinted
        (
            _dailyTimestamp,
            _rewardsHash,
            0, // TODO finish this
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
            // _mint(rewardsLibData.applications[_applications[i]].rewardsAddress, _amounts[i]);
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
            //  if (rewardsLibData.applications[_applications[i]].status != PropsRewardsLib.ApplicationStatus.Active) return (false, 0);
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
        return 1e8; // ((maxTotalSupply - totalSupply()) * appRewardsPercentPphm * appRewardsMaxVariationPercentPphm) / 1e8;
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
        return 1e8; //((dowToDailyValidatorsList[_dayOfWeek].length * validatorMajorityPercentPphm) / 1e8)+1;
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
        return 1; // dowToDailyValidatorsList[_dayOfWeek].length;
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
        return 1e8; //(((maxTotalSupply - totalSupply()) * validatorRewardsPercentPphm) / 1e8) / dowToDailyValidatorsList[_dayOfWeek].length;
    }

    /**
    * @dev Allows the controller/owner to update to a new controller
    * @param _controller address address of the new controller
    */
    function updateController(
        address _controller
    )
        public
        onlyController
        returns (bool)
    {
        controller = _controller;
        emit ControllerUpdate
        (
            _controller
        );
        return true;
    }

    /**
    * @dev Allows the controller/owner to update rewards parameters
    * @param _name ParameterName name of the parameter
    * @param _value uint256 new value for the parameter
    * @param _timestamp starting when should this parameter use the current value
    */
    function updateParameter(
        PropsRewardsLib.ParameterName _name,
        uint256 _value,
        uint256 _timestamp
    )
        public
        onlyController
        onlyFutureValidDailyTimestamp(_timestamp)
        returns (bool)
    {
        bytes32 paramKey = PropsRewardsLib.updateParameter(rewardsLibData, _name, _value, _timestamp);
        emit ParameterUpdate
        (
            _name,
            rewardsLibData.parameters[paramKey].currentValue,
            rewardsLibData.parameters[paramKey].previousValue,
            rewardsLibData.parameters[paramKey].updateTimestamp
        );
        return true;
    }

    /**
    * @dev Allows an application to add/update its details
    * @param _name bytes32 name of the app
    * @param _rewardsAddress address an address for the app to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain
    */
    function updateApplication(
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    )
        public
        returns (bool)
    {
        PropsRewardsLib.updateApplication(rewardsLibData, _name, _rewardsAddress, _sidechainAddress);
        emit ApplicationUpdated(msg.sender, _name, _rewardsAddress, _sidechainAddress);
        return true;
    }

    /**
    * @dev Allows a validator to add/update its details
    * @param _name bytes32 name of the validator
    * @param _rewardsAddress address an address for the validator to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain
    */
    function updateValidator(
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    )
        public
        returns (bool)
    {
        PropsRewardsLib.updateValidator(rewardsLibData, _name, _rewardsAddress, _sidechainAddress);
        emit ValidatorUpdated(msg.sender, _name, _rewardsAddress, _sidechainAddress);
        return true;
    }
    // /**
    // * @dev Get active validators list
    // */
    // function getNewValidatorsList(uint256 _dailyTimestamp)
    //     public
    //     view
    //     returns (address[])
    // {
    //     address[] memory dailyValidators;
    //     uint256 counter = 0;
    //     for (uint256 i = 0; i < validatorsList.length ; i++) {
    //         if (validators[validatorsList[i]].status == ValidatorStatus.Active && _dailyTimestamp > validators[validatorsList[i]].timeAdded) {
    //             dailyValidators[counter] = validatorsList[i];
    //             counter++;
    //         }
    //     }
    //     return dailyValidators;
    // }

    // /**
    // * @dev Checks how many validators are needed for app rewards
    // * @param _dayOfWeek uint256 the daily reward day of week
    // */
    // function updateDailyValidatorsList(uint256 _dayOfWeek)
    //     internal
    //     returns (bool)
    // {
    //     address[] memory newValidators = getNewValidatorsList(dowToDailyTimestamp[_dayOfWeek]);
    //     // same length of list just replace it
    //     if (dowToDailyValidatorsList[_dayOfWeek].length == newValidators.length) {
    //         for (uint256 i = 0; i < newValidators.length; i++) {
    //             dowToDailyValidatorsList[_dayOfWeek][i] = newValidators[i];
    //         }
    //     }
    //     else {
    //         // size of new list is different than last week for this day, delete array and populate
    //         // otherwise it's the first time so just pupulate it
    //         if (dowToDailyValidatorsList[_dayOfWeek].length > 0) {
    //             deleteValidatorsList(_dayOfWeek);
    //         }
    //         for (uint256 j = 0; j < newValidators.length; j++) {
    //             dowToDailyValidatorsList[_dayOfWeek].push(newValidators[j]);
    //         }
    //     }
    //     return true;
    // }

    // /**
    // * @dev Delete existing values from the daily validators list
    // * @param _dayOfWeek uint256 the daily reward day of week
    // */
    // function deleteValidatorsList(uint256 _dayOfWeek)
    //     internal
    //     returns (bool)
    // {
    //     for (uint256 i = 0; i < dowToDailyValidatorsList[_dayOfWeek].length ; i++) {
    //         delete dowToDailyValidatorsList[_dayOfWeek][i];
    //         dowToDailyValidatorsList[_dayOfWeek].length--;
    //     }
    //     return true;
    // }
}