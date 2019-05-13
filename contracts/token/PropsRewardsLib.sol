pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";


/**
 * @title Props Rewards Library
 * @dev Library to manage application and validators and parameters
 **/
library PropsRewardsLib {
    /*
    *  Storage
    */

    // The various parameters used by the contract
    enum ParameterName { ApplicationRewardsPercent, ApplicationRewardsMaxVariationPercent, ValidatorMajorityPercent, ValidatorRewardsPercent}
    enum RewardedEntityType { Application, Validator }

    // Represents a parameter current, previous and time of change
    struct Parameter {
        uint256 currentValue;                   // current value in Pphm valid after timestamp
        uint256 previousValue;                  // previous value in Pphm for use before timestamp
        uint256 updateTimestamp;                // timestamp of when the value was updated
    }
    // Represents application details
    struct RewardedEntity {
        bytes32 name;                           // Application name
        address rewardsAddress;                 // address where rewards will be minted to
        address sidechainAddress;               // address used on the sidechain
        uint256 initializedState;               // A way to check if there's something in the map and whether already added to list
        RewardedEntityType entityType;                // Type of rewarded entity
    }

    // Represents validators current and previous lists
    struct RewardedEntityList {
        mapping (address => bool) current;
        mapping (address => bool) previous;
        address[] currentList;
        address[] previousList;
        uint256 updateTimestamp;
    }

    // Represents daily reward submissions and confimations
    struct DailyRewards {
        mapping (address => bool) submissions;
        address[] submissionValidators;
        uint256 confirmations;
        uint256 initializedState;               // A way to check if there's something in the map and whether already added to list
        uint256 finalized;
    }

    // represent the storage structures
    struct Data {
        // applications data
        mapping (address => RewardedEntity) applications;
        address[] applicationsList;
        // validators data
        mapping (address => RewardedEntity) validators;
        address[] validatorsList;
        // adjustable parameters data
        mapping (bytes32 => Parameter) parameters; // parameter name which is keccak256(ParameterName.X)
        // the participating validators
        RewardedEntityList selectedValidators;
        // the participating applications
        RewardedEntityList selectedApplications;
        // daily rewards submission data
        mapping (bytes32 => DailyRewards) dailyRewards;
        bytes32[] dailyRewardsList;
        // previous daily reward hash
        bytes32 previousDailyRewardsHash;
        // current and previous rewards daily timestamp
        uint256 currentDailyTimestamp;
        uint256 previousDailyTimestamp;
        // indication to when to cleanup the dailyRewards data
        uint256 maxDailyRewardStorage;
    }
    /*
    *  Modifiers
    */
    modifier onlyOneRewardsHashPerValidator(Data storage _self, bytes32 _rewardsHash) {
        require(
            !_self.dailyRewards[_rewardsHash].submissions[msg.sender],
            "Must be one submission per validator"
        );
         _;
    }

    modifier onlyExistingApplications(Data storage _self, address[] _entities) {
        for (uint256 i = 0; i < _entities.length; i++) {
            require(
                _self.applications[_entities[i]].initializedState == 1,
                "Application must exist"
            );
        }
        _;
    }

    modifier onlyExistingValidators(Data storage _self, address[] _entities) {
        for (uint256 i = 0; i < _entities.length; i++) {
            require(
                _self.validators[_entities[i]].initializedState == 1,
                "Validator must exist"
            );
        }
        _;
    }

    modifier onlySelectedValidators(Data storage _self, uint256 _dailyTimestamp) {
        if (getSelectedRewardedEntityListType(_self.selectedValidators, _dailyTimestamp) == 0) {
            require (
                _self.selectedValidators.current[msg.sender],
                "Must be a current selected validator"
            );
        } else {
            require (
                _self.selectedValidators.previous[msg.sender],
                "Must be a previous selected validator"
            );
        }
        _;
    }

    /**
    * @dev The function is called by validators with the calculation of the daily rewards
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _maxTotalSupply uint256 max total supply
    * @param _currentTotalSupply uint256 current total supply
    * @param _previousDayRewards uint256 calculating previous day validator rewards
    */
    function calculateValidatorRewards(
        Data storage _self,
        uint256 _dailyTimestamp,
        bytes32 _rewardsHash,
        uint256 _maxTotalSupply,
        uint256 _currentTotalSupply,
        bool _previousDayRewards
    )
        public
        returns (uint256)
    {
        uint256 numOfValidators;
        if (_self.dailyRewards[_rewardsHash].finalized == 1) // previous daily reward was not finalized
        {
            if (_previousDayRewards) {
                numOfValidators = _self.dailyRewards[_rewardsHash].confirmations;
            } else {
                numOfValidators = _requiredValidatorsForValidatorsRewards(_self, _dailyTimestamp);
            }
            _self.dailyRewards[_rewardsHash].finalized = 2;
            return _getValidatorRewardsDailyAmountPerValidator(_self, _dailyTimestamp, numOfValidators, _maxTotalSupply, _currentTotalSupply);
        }
        return 0;
    }

    /**
    * @dev The function is called by validators with the calculation of the daily rewards
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    * @param _maxTotalSupply uint256 max total supply
    * @param _currentTotalSupply uint256 current total supply
    */
    function calculateApplicationRewards(
        Data storage _self,
        uint256 _dailyTimestamp,
        bytes32 _rewardsHash,
        address[] _applications,
        uint256[] _amounts,
        uint256 _maxTotalSupply,
        uint256 _currentTotalSupply
    )
        public
        onlyOneRewardsHashPerValidator(_self, _rewardsHash)
        onlySelectedValidators(_self, _dailyTimestamp)
        returns (uint256)
    {
        if (_self.dailyRewards[_rewardsHash].initializedState == 0) {
            _self.dailyRewardsList.push(_rewardsHash);
            _self.dailyRewards[_rewardsHash].initializedState = 1;
        }
        _self.dailyRewards[_rewardsHash].submissions[msg.sender] = true;
        _self.dailyRewards[_rewardsHash].confirmations++;
        _self.dailyRewards[_rewardsHash].submissionValidators.push(msg.sender);
        if (_self.dailyRewards[_rewardsHash].confirmations == _requiredValidatorsForAppRewards(_self, _dailyTimestamp)) {
           require(
                _rewardHashIsvalid(_dailyTimestamp, _rewardsHash, _applications, _amounts),
                "Reward Hash is invalid"
            );
            (bool applicationsValid, uint256 sum) = _validateSubmittedData(_self, _applications, _amounts);
            require(
                applicationsValid,
                "Rewards data is invalid - unknown application"
            );
            require(
                sum <= _getMaxAppRewardsDailyAmount(_self, _dailyTimestamp, _maxTotalSupply, _currentTotalSupply),
                "Rewards data is invalid - exceed daily variation"
            );
            _updateDailyTimestamp(_self, _dailyTimestamp);
            _self.dailyRewards[_rewardsHash].finalized = 1;
            _self.previousDailyRewardsHash = _rewardsHash;
            return sum;
        }
        return 0;
    }

    /**
    * @dev Get parameter's value
    * @param _self Data pointer to storage
    * @param _name ParameterName name of the parameter
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    */
    function getParameterValue(
        Data storage _self,
        ParameterName _name,
        uint256 _dailyTimestamp
    )
        public
        view
        returns (uint256)
    {
        Parameter memory param = _self.parameters[getParameterKey(_name)];
        if (_dailyTimestamp >= param.updateTimestamp) {
            return param.currentValue;
        } else {
            return param.previousValue;
        }
    }

    /**
    * @dev Get parameter's bytes32 encoding
    * @param _name ParameterName name of the parameter
    */
    function getParameterKey(ParameterName _name)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_name));
    }

    /**
    * @dev Allows the controller/owner to update rewards parameters
    * @param _self Data pointer to storage
    * @param _name ParameterName name of the parameter
    * @param _value uint256 new value for the parameter
    * @param _timestamp starting when should this parameter use the current value
    */
    function updateParameter(
        Data storage _self,
        ParameterName _name,
        uint256 _value,
        uint256 _timestamp
    )
        public
        returns (bytes32)
    {
        bytes32 paramKey = getParameterKey(_name);
        if (_timestamp <= _self.parameters[paramKey].updateTimestamp) {
           _self.parameters[paramKey].currentValue = _value;
           _self.parameters[paramKey].updateTimestamp = _timestamp;
        } else {
            _self.parameters[paramKey].previousValue = _self.parameters[paramKey].currentValue;
            _self.parameters[paramKey].currentValue = _value;
           _self.parameters[paramKey].updateTimestamp = _timestamp;
        }
        return paramKey;
    }

    /**
    * @dev Allows an application to add/update its details
    * @param _self Data pointer to storage
    * @param _name bytes32 name of the app
    * @param _rewardsAddress address an address for the app to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain
    */
    function updateApplication(
        Data storage _self,
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    )
        public
        returns (bool)
    {
        _self.applications[msg.sender].name = _name;
        _self.applications[msg.sender].rewardsAddress = _rewardsAddress;
        _self.applications[msg.sender].sidechainAddress = _sidechainAddress;
        if (_self.applications[msg.sender].initializedState == 0) {
            _self.applicationsList.push(msg.sender);
            _self.applications[msg.sender].initializedState = 1;
            _self.applications[msg.sender].entityType = RewardedEntityType.Application;
        }
        return true;
    }

    /**
    * @dev Allows a validator to add/update its details
    * @param _self Data pointer to storage
    * @param _name bytes32 name of the validator
    * @param _rewardsAddress address an address for the validator to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain
    */
    function updateValidator(
        Data storage _self,
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    )
        public
        returns (bool)
    {
        _self.validators[msg.sender].name = _name;
        _self.validators[msg.sender].rewardsAddress = _rewardsAddress;
        _self.validators[msg.sender].sidechainAddress = _sidechainAddress;
        if (_self.validators[msg.sender].initializedState == 0) {
            _self.validatorsList.push(msg.sender);
            _self.validators[msg.sender].initializedState = 1;
            _self.validators[msg.sender].entityType = RewardedEntityType.Validator;
        }
        return true;
    }

    /**
    * @dev Set new validators list
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp from which this change should take effect
    * @param _validators address[] array of validators
    */
    function setValidators(
        Data storage _self,
        uint256 _dailyTimestamp,
        address[] _validators
    )
        public
        onlyExistingValidators(_self, _validators)
        returns (bool)
    {

        if (_self.selectedValidators.currentList.length == 0) { // first time the daily validators list is set
            _updateCurrentEntityList(_self.selectedValidators, _validators);
        } else {
            _updatePreviousEntityList(_self.selectedValidators);
            _updateCurrentEntityList(_self.selectedValidators, _validators);
        }
        _self.selectedValidators.updateTimestamp = _dailyTimestamp;
        return true;
    }

   /**
    * @dev Set new applications list
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp from which this change should take effect
    * @param _applications address[] array of applications
    */
    function setApplications(
        Data storage _self,
        uint256 _dailyTimestamp,
        address[] _applications
    )
        public
        onlyExistingApplications(_self, _applications)
        returns (bool)
    {

        if (_self.selectedApplications.currentList.length == 0) { // first time the daily validators list is set
            _updateCurrentEntityList(_self.selectedApplications, _applications);
        } else {
            _updatePreviousEntityList(_self.selectedApplications);
            _updateCurrentEntityList(_self.selectedApplications, _applications);
        }
        _self.selectedApplications.updateTimestamp = _dailyTimestamp;
        return true;
    }

    /**
    * @dev Get which entity list to use. Current = 0, previous = 1
    * @param _rewardedEntitylist RewardedEntityList pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    */
    function getSelectedRewardedEntityListType(RewardedEntityList _rewardedEntitylist, uint256 _dailyTimestamp)
        internal
        pure
        returns (uint256)
    {
        if (_dailyTimestamp >= _rewardedEntitylist.updateTimestamp) {
            return 0;
        } else {
            return 1;
        }
    }

    /**
    * @dev Updates the current dailyTimestamp and previous one
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    */
    function _updateDailyTimestamp(Data storage _self, uint256 _dailyTimestamp)
        internal
        returns (bool)
    {
        _self.previousDailyTimestamp = _self.currentDailyTimestamp;
        _self.currentDailyTimestamp = _dailyTimestamp;
        return true;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _maxTotalSupply uint256 max total supply
    * @param _currentTotalSupply uint256 current total supply
    */
    function _getMaxAppRewardsDailyAmount(
        Data storage _self,
        uint256 _dailyTimestamp,
        uint256 _maxTotalSupply,
        uint256 _currentTotalSupply
    )
        internal
        view
        returns (uint256)
    {
        return ((_maxTotalSupply - _currentTotalSupply) *
        getParameterValue(_self, ParameterName.ApplicationRewardsPercent, _dailyTimestamp) *
        getParameterValue(_self, ParameterName.ApplicationRewardsMaxVariationPercent, _dailyTimestamp)) / 1e8;
    }


    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _numOfValidators uint256 number of validators
    * @param _maxTotalSupply uint256 max total supply
    * @param _currentTotalSupply uint256 current total supply
    */
    function _getValidatorRewardsDailyAmountPerValidator(
        Data storage _self,
        uint256 _dailyTimestamp,
        uint256 _numOfValidators,
        uint256 _maxTotalSupply,
        uint256 _currentTotalSupply
    )
        internal
        view
        returns (uint256)
    {
        return (((_maxTotalSupply - _currentTotalSupply) *
        getParameterValue(_self, ParameterName.ValidatorRewardsPercent, _dailyTimestamp)) / 1e8) / _numOfValidators;
    }

    /**
    * @dev Checks if app daily rewards amount is valid
    * @param _self Data pointer to storage
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    */
    function _validateSubmittedData(
        Data storage _self,
        address[] _applications,
        uint256[] _amounts
    )
        internal
        view
        returns (bool, uint256)
    {
        uint256 sum;
        for (uint256 i = 0; i < _amounts.length; i++) {
             sum += _amounts[i];
            if (_self.applications[_applications[i]].initializedState != 1) return (false, 0);
        }
        return (true, sum);
    }

    /**
    * @dev Checks if submitted data matches reward hash
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    */
    function _rewardHashIsvalid(
        uint256 _dailyTimestamp,
        bytes32 _rewardsHash,
        address[] _applications,
        uint256[] _amounts
    )
        internal
        pure
        returns (bool)
    {
        return keccak256(abi.encodePacked(_dailyTimestamp, _applications, _amounts)) == _rewardsHash;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    */
    function _requiredValidatorsForValidatorsRewards(Data storage _self, uint256 _dailyTimestamp)
        internal
        view
        returns (uint256)
    {
        if (getSelectedRewardedEntityListType(_self.selectedValidators, _dailyTimestamp) == 0) {
            return _self.selectedValidators.currentList.length;
        } else {
            return _self.selectedValidators.previousList.length;
        }
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _self Data pointer to storage
    * @param _dailyTimestamp uint256 the daily reward timestamp (midnight UTC of each day)
    */
    function _requiredValidatorsForAppRewards(Data storage _self, uint256 _dailyTimestamp)
        internal
        view
        returns (uint256)
    {
        if (getSelectedRewardedEntityListType(_self.selectedValidators, _dailyTimestamp) == 0) {
            return ((_self.selectedValidators.currentList.length * getParameterValue(_self, ParameterName.ValidatorMajorityPercent, _dailyTimestamp)) / 1e8)+1;
        } else {
            return ((_self.selectedValidators.previousList.length * getParameterValue(_self, ParameterName.ValidatorMajorityPercent, _dailyTimestamp)) / 1e8)+1;
        }
    }

    /**
    * @dev Update current daily applications list.
    * If new, push.
    * If same size, replace
    * If different size, delete, and then push.
    * @param _rewardedEntitylist RewardedEntityList pointer to storage
    * @param _entities address[] array of entities
    */
    //_updateCurrentEntityList(_rewardedEntitylist, _entities,_rewardedEntityType),
    function _updateCurrentEntityList(
        RewardedEntityList storage _rewardedEntitylist,
        address[] _entities
    )
        internal
        returns (bool)
    {
        bool emptyCurrentList = _rewardedEntitylist.currentList.length == 0;
        if (!emptyCurrentList && _rewardedEntitylist.currentList.length != _entities.length) {
            _deleteCurrentEntityList(_rewardedEntitylist);
            emptyCurrentList = true;
        }

        for (uint256 i = 0; i < _entities.length; i++) {
            if (emptyCurrentList) {
                _rewardedEntitylist.currentList.push(_entities[i]);
            } else {
                _rewardedEntitylist.currentList[i] = _entities[i];
            }
            _rewardedEntitylist.current[_entities[i]] = true;
        }
        return true;
    }

    /**
    * @dev Update previous daily list
    * @param _rewardedEntitylist RewardedEntityList pointer to storage
    */
    function _updatePreviousEntityList(RewardedEntityList storage _rewardedEntitylist)
        internal
        returns (bool)
    {
        bool emptyPreviousList = _rewardedEntitylist.previousList.length == 0;
        if (
            !emptyPreviousList &&
            _rewardedEntitylist.previousList.length != _rewardedEntitylist.currentList.length
        ) {
            _deletePreviousEntityList(_rewardedEntitylist);
            emptyPreviousList = true;
        }
        for (uint256 i = 0; i < _rewardedEntitylist.currentList.length; i++) {
            if (emptyPreviousList) {
                _rewardedEntitylist.previousList.push(_rewardedEntitylist.currentList[i]);
            } else {
                _rewardedEntitylist.previousList[i] = _rewardedEntitylist.currentList[i];
            }
            _rewardedEntitylist.previous[_rewardedEntitylist.currentList[i]] = true;
        }
        return true;
    }

    /**
    * @dev Delete existing values from the current list
    * @param _rewardedEntitylist RewardedEntityList pointer to storage
    */
    function _deleteCurrentEntityList(RewardedEntityList storage _rewardedEntitylist)
        internal
        returns (bool)
    {
        for (uint256 i = 0; i < _rewardedEntitylist.currentList.length ; i++) {
             delete _rewardedEntitylist.current[_rewardedEntitylist.currentList[i]];
        }
        delete  _rewardedEntitylist.currentList;
        return true;
    }

    /**
    * @dev Delete existing values from the previous applications list
    * @param _rewardedEntitylist RewardedEntityList pointer to storage
    */
    function _deletePreviousEntityList(RewardedEntityList storage _rewardedEntitylist)
        internal
        returns (bool)
    {
        for (uint256 i = 0; i < _rewardedEntitylist.previousList.length ; i++) {
            delete _rewardedEntitylist.previous[_rewardedEntitylist.previousList[i]];
        }
        delete _rewardedEntitylist.previousList;
        return true;
    }
}