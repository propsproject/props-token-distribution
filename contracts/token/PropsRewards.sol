pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
import { PropsRewardsLib } from "./PropsRewardsLib.sol";

/**
 * @title Props Rewards
 * @dev Contract allows to set approved apps and validators. Submit and mint rewards...
 **/
contract PropsRewards is Initializable, ERC20 {
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

    event ParameterUpdated(
        PropsRewardsLib.ParameterName param,
        uint256 newValue,
        uint256 oldValue,
        uint256 timestamp
    );

    event ValidatorsListUpdated(
        address[] validatorsList,
        uint256 indexed dailyTimestamp
    );

    event ApplicationsListUpdated(
        address[] applicationsList,
        uint256 indexed dailyTimestamp
    );

    event ControllerUpdated(address indexed newController);

    /*
    *  Storage
    */

    PropsRewardsLib.Data internal rewardsLibData;
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

    /**
    * @dev The initializer function for upgrade as initialize was already called, get the decimals used in the token to initialize the params
    * @param _decimals uint256 number of decimals used in total supply
    */
    function initializePostRewardsUpgrade1(address _controller, uint256 _decimals)
        public
        initializer
    {
        _initializePostRewardsUpgrade1(_controller, _decimals);
    }

    /**
    * @dev The initializer function, get the decimals used in the token to initialize the params
    * @param _decimals uint256 number of decimals used in total supply
    */
    function initialize(address _controller, uint256 _decimals)
        public
        initializer
    {
        _initializePostRewardsUpgrade1(_controller, _decimals);
    }

    /**
    * @dev Set new validators list
    * @param _dailyTimestamp uint256 the daily reward timestamp from which this change should take effect
    * @param _validators address[] array of validators
    */
    function setValidators(uint256 _dailyTimestamp, address[] _validators)
        public
        onlyController
        returns (bool)
    {
        PropsRewardsLib.setValidators(rewardsLibData, _dailyTimestamp, _validators);
        emit ValidatorsListUpdated(_validators, _dailyTimestamp);
        return true;
    }

    /**
    * @dev Set new applications list
    * @param _dailyTimestamp uint256 the daily reward timestamp from which this change should take effect
    * @param _applications address[] array of validators
    */
    function setApplications(uint256 _dailyTimestamp, address[] _applications)
        public
        onlyController
        returns (bool)
    {
        PropsRewardsLib.setApplications(rewardsLibData, _dailyTimestamp, _applications);
        emit ApplicationsListUpdated(_applications, _dailyTimestamp);
        return true;
    }

    /**
    * @dev Get the applications or validators list
    * @param _entityType RewardedEntityType either application (0) or validator (1)
    * @param _dailyTimestamp uint256 the daily reward timestamp from which this change should take effect
    */
    function getEntities(PropsRewardsLib.RewardedEntityType _entityType, uint256 _dailyTimestamp)
        public
        view
        returns (address[])
    {
        return PropsRewardsLib.getEntities(rewardsLibData, _entityType, _dailyTimestamp);
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
        returns (bool)
    {
        // if submission is for a new day check if previous day validator rewards were given if not give to participating ones
        if (
            rewardsLibData.previousDailyTimestamp > 0 &&
            _dailyTimestamp > rewardsLibData.currentDailyTimestamp
        ) {
            uint256 previousDayValidatorRewardsAmount = PropsRewardsLib.calculateValidatorRewards(
                rewardsLibData,
                rewardsLibData.currentDailyTimestamp,
                rewardsLibData.previousDailyRewardsHash,
                maxTotalSupply,
                true
            );
            if (previousDayValidatorRewardsAmount > 0) {
                _mintDailyRewardsForValidators(rewardsLibData.currentDailyTimestamp, rewardsLibData.previousDailyRewardsHash, previousDayValidatorRewardsAmount);
            }
        }
        // check and give application rewards if majority of validators agree
        uint256 appRewardsSum = PropsRewardsLib.calculateApplicationRewards(
            rewardsLibData,
            _dailyTimestamp,
            _rewardsHash,
            _applications,
            _amounts,
            maxTotalSupply,
            totalSupply()
        );
        if (appRewardsSum > 0) {
            _mintDailyRewardsForApps(_dailyTimestamp, _rewardsHash, _applications, _amounts, appRewardsSum);
        }

        // check and give validator rewards if all validators submitted
        uint256 validatorRewardsAmount = PropsRewardsLib.calculateValidatorRewards(
            rewardsLibData,
            _dailyTimestamp,
            _rewardsHash,
            maxTotalSupply,
            false
        );
        if (validatorRewardsAmount > 0) {
            _mintDailyRewardsForValidators(_dailyTimestamp, _rewardsHash, validatorRewardsAmount);
        }

        emit DailyRewardsSubmitted(_dailyTimestamp, _rewardsHash, msg.sender);
        return true;
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
        emit ControllerUpdated
        (
            _controller
        );
        return true;
    }

    /**
    * @dev Allows getting a parameter value based on timestamp
    * @param _name ParameterName name of the parameter
    * @param _timestamp starting when should this parameter use the current value
    */
    function getParameter(
        PropsRewardsLib.ParameterName _name,
        uint256 _timestamp
    )
        public
        view
        returns (uint256)
    {
        return PropsRewardsLib.getParameterValue(rewardsLibData, _name, _timestamp);
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
        returns (bool)
    {
        bytes32 paramKey = PropsRewardsLib.updateParameter(rewardsLibData, _name, _value, _timestamp);
        emit ParameterUpdated(
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

    /**
    * @dev internal intialize rewards upgrade1
    */
    function _initializePostRewardsUpgrade1(address _controller, uint256 _decimals)
        internal
    {
        // max total supply is 1,000,000,000 PROPS specified in AttoPROPS
        maxTotalSupply = 1 * 1e9 * (10 ** uint256(_decimals));
        // ApplicationRewardsPercent pphm ==> 0.03475%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ApplicationRewardsPercent, 34750, 0);
        // ApplicationRewardsMaxVariationPercent pphm ==> 150%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ApplicationRewardsMaxVariationPercent, 150 * 1e6, 0);
        // ValidatorMajorityPercent pphm ==> 50%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ValidatorMajorityPercent, 50 * 1e6, 0);
         // ValidatorRewardsPercent pphm ==> 0.001829%
        PropsRewardsLib.updateParameter(rewardsLibData, PropsRewardsLib.ParameterName.ValidatorRewardsPercent, 1829, 0);
        controller = _controller;
        rewardsLibData.maxDailyRewardStorage = 7; // keep daily rewards data for up to 7 days
    }

    /**
    * @dev Mint rewards for validators
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _amount uint256 amount each validator should get
    */
    function _mintDailyRewardsForValidators(uint256 _dailyTimestamp, bytes32 _rewardsHash, uint256 _amount)
        internal
    {
        uint256 validatorsCount = rewardsLibData.dailyRewards[_rewardsHash].submissionValidators.length;
        for (uint256 i = 0; i < validatorsCount; i++) {
            _mint(rewardsLibData.validators[rewardsLibData.dailyRewards[_rewardsHash].submissionValidators[i]].rewardsAddress,_amount);
        }
        emit DailyRewardsValidatorsMinted(
            _dailyTimestamp,
            _rewardsHash,
            validatorsCount,
            (_amount * validatorsCount)
        );
    }

    /**
    * @dev Mint rewards for apps
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    * @param _sum uint256 the sum of all application rewards given
    */
    function _mintDailyRewardsForApps(
        uint256 _dailyTimestamp,
        bytes32 _rewardsHash,
        address[] _applications,
        uint256[] _amounts,
        uint256 _sum
    )
        internal
    {
        for (uint256 i = 0; i < _applications.length; i++) {
            _mint(rewardsLibData.applications[_applications[i]].rewardsAddress, _amounts[i]);
        }
        emit DailyRewardsApplicationsMinted(_dailyTimestamp, _rewardsHash, _applications.length, _sum);
    }
}