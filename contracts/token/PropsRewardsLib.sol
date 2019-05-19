pragma solidity ^0.4.24;

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
        uint256 rewardsDay;                // timestamp of when the value was updated
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
        uint256 rewardsDay;
    }

    // Represents daily reward submissions and confimations
    struct DailyRewards {
        mapping (address => bool) submissions;
        address[] submissionValidators;
        uint256 confirmations;
        uint256 initializedState;               // A way to check if there's something in the map and whether already added to list
        uint256 finalized;
        uint256 totalSupply;
        uint256 rewardsDay;
    }

    //Represent rewards day to its rewardsHash and block.timestamp
    struct RewardsDayHash {
        bytes32 rewardsHash;
        uint256 blockTimestamp;
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
        mapping (uint256 => Parameter) parameters; // uint256 is the parameter enum index
        // the participating validators
        RewardedEntityList selectedValidators;
        // the participating applications
        RewardedEntityList selectedApplications;
        // daily rewards submission data
        mapping (bytes32 => DailyRewards) dailyRewards;
        bytes32[] dailyRewardsList;
        // current and previous rewards daily timestamp
        uint256 rewardsDay;
        // indication to when to cleanup the dailyRewards data
        uint256 maxDailyRewardStorage;
        // map to hold rewardsDay to its hash and block timestamp
        mapping (uint256 => RewardsDayHash) dailyRewardHashes;
        uint256 minSecondsBetweenDays;
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

    modifier onlySelectedValidators(Data storage _self, uint256 _rewardsDay) {
        if (_getSelectedRewardedEntityListType(_self.selectedValidators, _rewardsDay) == 0) {
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

    modifier onlyValidRewardsDay(Data storage _self, uint256 _rewardsDay) {
        require(
            _rewardsDay == 0 ||
            (block.timestamp - _self.dailyRewardHashes[_rewardsDay - 1].blockTimestamp) > _self.minSecondsBetweenDays &&
            (_rewardsDay == _self.rewardsDay || _rewardsDay == (_self.rewardsDay + 1)),
            "Must be for this round or the next"
        );
         _;
    }

    modifier onlyValidValidatorsRewardsDay(Data storage _self, uint256 _rewardsDay) {
        require(
            _rewardsDay >= _self.selectedValidators.rewardsDay,
            "Must be existing or future validators rewardsDay"
        );
         _;
    }

    modifier onlyValidApplicationsRewardsDay(Data storage _self, uint256 _rewardsDay) {
        require(
            _rewardsDay >= _self.selectedApplications.rewardsDay,
            "Must be existing or future applications rewardsDay"
        );
         _;
    }

    modifier onlyValidAddresses(address _rewardsAddress, address _sidechainAddress) {
        require(
            _rewardsAddress != address(0) &&
            _sidechainAddress != address(0),
            "Must have valid rewards and sidechain addresses"
        );
        _;
    }


    /**
    * @dev The function is called by validators with the calculation of the daily rewards for previous day
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the rewards day
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _maxTotalSupply uint256 max total supply
    */
    function calculatePreviousDayValidatorRewards(
        Data storage _self,
        uint256 _rewardsDay,
        bytes32 _rewardsHash,
        uint256 _maxTotalSupply
    )
        public
        returns (uint256)
    {
        uint256 numOfValidators;
        if (_self.dailyRewards[_rewardsHash].finalized == 1) // previous daily reward was not finalized
        {
            numOfValidators = _self.dailyRewards[_rewardsHash].confirmations;
            _self.dailyRewards[_rewardsHash].finalized = 2;
            _incrementRewardsDay(_self, _rewardsDay);
            return _getValidatorRewardsDailyAmountPerValidator(_self, _rewardsDay, numOfValidators, _maxTotalSupply,  _self.dailyRewards[_rewardsHash].totalSupply);
        }
        return 0;
    }

    /**
    * @dev The function is called by validators with the calculation of the daily rewards
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the rewards day
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _maxTotalSupply uint256 max total supply
    */
    function calculateValidatorRewards(
        Data storage _self,
        uint256 _rewardsDay,
        bytes32 _rewardsHash,
        uint256 _maxTotalSupply
    )
        public
        returns (uint256)
    {
        uint256 numOfValidators;
        if (_self.dailyRewards[_rewardsHash].finalized == 1)
        {
            numOfValidators = _requiredValidatorsForValidatorsRewards(_self, _rewardsDay);
            if (numOfValidators > _self.dailyRewards[_rewardsHash].confirmations) return 0;
            _self.dailyRewards[_rewardsHash].finalized = 2;
            _incrementRewardsDay(_self, _rewardsDay);
            return _getValidatorRewardsDailyAmountPerValidator(_self, _rewardsDay, numOfValidators, _maxTotalSupply,  _self.dailyRewards[_rewardsHash].totalSupply);
        }
        return 0;
    }

    /**
    * @dev The function is called by validators with the calculation of the daily rewards
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the rewards day
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    * @param _maxTotalSupply uint256 max total supply
    * @param _currentTotalSupply uint256 current total supply
    */
    function calculateApplicationRewards(
        Data storage _self,
        uint256 _rewardsDay,
        bytes32 _rewardsHash,
        address[] _applications,
        uint256[] _amounts,
        uint256 _maxTotalSupply,
        uint256 _currentTotalSupply
    )
        public
        onlyValidRewardsDay(_self, _rewardsDay)
        onlyOneRewardsHashPerValidator(_self, _rewardsHash)
        onlySelectedValidators(_self, _rewardsDay)
        returns (uint256)
    {
        require(
                _rewardHashIsvalid(_rewardsDay, _rewardsHash, _applications, _amounts),
                "Reward Hash is invalid"
        );
        if (_self.dailyRewards[_rewardsHash].initializedState == 0) {
            if (_self.dailyRewardsList.push(_rewardsHash) > _self.maxDailyRewardStorage) {
                _deleteFirstDailyRewardEntry(_self);
            }
            _self.dailyRewards[_rewardsHash].initializedState = 1;
        }
        _self.dailyRewards[_rewardsHash].submissions[msg.sender] = true;
        _self.dailyRewards[_rewardsHash].confirmations++;
        _self.dailyRewards[_rewardsHash].submissionValidators.push(msg.sender);
        if (_self.dailyRewards[_rewardsHash].confirmations == _requiredValidatorsForAppRewards(_self, _rewardsDay)) {
            uint256 sum = _validateSubmittedData(_self, _applications, _amounts);
            require(
                sum <= _getMaxAppRewardsDailyAmount(_self, _rewardsDay, _maxTotalSupply, _currentTotalSupply),
                "Rewards data is invalid - exceed daily variation"
            );
            _finalizeDailyApplicationRewards(_self, _rewardsDay, _rewardsHash, _currentTotalSupply);
            return sum;
        }
        return 0;
    }

    /**
    * @dev Finalizes the state, rewards Hash, total supply and block timestamp for the day
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the reward day
    * @param _rewardsHash bytes32 the daily reward hash
    * @param _currentTotalSupply uint256 the current total supply
    */
    function _finalizeDailyApplicationRewards(Data storage _self, uint256 _rewardsDay, bytes32 _rewardsHash, uint256 _currentTotalSupply)
        public
        returns (bool)
    {
        _self.dailyRewards[_rewardsHash].totalSupply = _currentTotalSupply;
        _self.dailyRewards[_rewardsHash].finalized = 1;
        _self.dailyRewards[_rewardsHash].rewardsDay = _rewardsDay;
        _self.dailyRewardHashes[_rewardsDay].rewardsHash = _rewardsHash;
        _self.dailyRewardHashes[_rewardsDay].blockTimestamp = block.timestamp;
        return true;
    }
    /**
    * @dev Get parameter's value
    * @param _self Data pointer to storage
    * @param _name ParameterName name of the parameter
    * @param _rewardsDay uint256 the rewards day
    */
    function getParameterValue(
        Data storage _self,
        ParameterName _name,
        uint256 _rewardsDay
    )
        public
        view
        returns (uint256)
    {
        if (_rewardsDay >= _self.parameters[uint256(_name)].rewardsDay) {
            return _self.parameters[uint256(_name)].currentValue;
        } else {
            return _self.parameters[uint256(_name)].previousValue;
        }
    }

    /**
    * @dev Allows the controller/owner to update rewards parameters
    * @param _self Data pointer to storage
    * @param _name ParameterName name of the parameter
    * @param _value uint256 new value for the parameter
    * @param _rewardsDay uint256 the rewards day
    */
    function updateParameter(
        Data storage _self,
        ParameterName _name,
        uint256 _value,
        uint256 _rewardsDay
    )
        public
        onlyValidRewardsDay(_self, _rewardsDay)
        returns (bool)
    {
        if (_rewardsDay <= _self.parameters[uint256(_name)].rewardsDay) {
           _self.parameters[uint256(_name)].currentValue = _value;
           _self.parameters[uint256(_name)].rewardsDay = _rewardsDay;
        } else {
            _self.parameters[uint256(_name)].previousValue = _self.parameters[uint256(_name)].currentValue;
            _self.parameters[uint256(_name)].currentValue = _value;
           _self.parameters[uint256(_name)].rewardsDay = _rewardsDay;
        }
        return true;
    }

    /**
    * @dev Allows an application to add/update its details
    * @param _self Data pointer to storage
    * @param _entityType RewardedEntityType either application (0) or validator (1)
    * @param _name bytes32 name of the app
    * @param _rewardsAddress address an address for the app to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain
    */
    function updateEntity(
        Data storage _self,
        RewardedEntityType _entityType,
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    )
        public
        onlyValidAddresses(_rewardsAddress, _sidechainAddress)
        returns (bool)
    {
        if (_entityType == RewardedEntityType.Application) {
            updateApplication(_self, _name, _rewardsAddress, _sidechainAddress);
        } else {
            updateValidator(_self, _name, _rewardsAddress, _sidechainAddress);
        }
        return true;
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
        returns (uint256)
    {
        _self.applications[msg.sender].name = _name;
        _self.applications[msg.sender].rewardsAddress = _rewardsAddress;
        _self.applications[msg.sender].sidechainAddress = _sidechainAddress;
        if (_self.applications[msg.sender].initializedState == 0) {
            _self.applicationsList.push(msg.sender);
            _self.applications[msg.sender].initializedState = 1;
            _self.applications[msg.sender].entityType = RewardedEntityType.Application;
        }
        return uint256(RewardedEntityType.Application);
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
        returns (uint256)
    {
        _self.validators[msg.sender].name = _name;
        _self.validators[msg.sender].rewardsAddress = _rewardsAddress;
        _self.validators[msg.sender].sidechainAddress = _sidechainAddress;
        if (_self.validators[msg.sender].initializedState == 0) {
            _self.validatorsList.push(msg.sender);
            _self.validators[msg.sender].initializedState = 1;
            _self.validators[msg.sender].entityType = RewardedEntityType.Validator;
        }
        return uint256(RewardedEntityType.Validator);
    }

    /**
    * @dev Set new validators list
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the rewards day from which the list should be active
    * @param _validators address[] array of validators
    */
    function setValidators(
        Data storage _self,
        uint256 _rewardsDay,
        address[] _validators
    )
        public
        onlyValidValidatorsRewardsDay(_self, _rewardsDay)
        onlyExistingValidators(_self, _validators)
        returns (bool)
    {

        if (_self.selectedValidators.currentList.length == 0) { // first time the daily validators list is set
            _updateCurrentEntityList(_self.selectedValidators, _validators);
        } else {
            if (_rewardsDay > _self.selectedValidators.rewardsDay)
                _updatePreviousEntityList(_self.selectedValidators);
            _updateCurrentEntityList(_self.selectedValidators, _validators);
        }
        _self.selectedValidators.rewardsDay = _rewardsDay;
        return true;
    }

   /**
    * @dev Set new applications list
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the rewards day from which the list should be active
    * @param _applications address[] array of applications
    */
    function setApplications(
        Data storage _self,
        uint256 _rewardsDay,
        address[] _applications
    )
        public
        onlyValidApplicationsRewardsDay(_self, _rewardsDay)
        onlyExistingApplications(_self, _applications)
        returns (bool)
    {

        if (_self.selectedApplications.currentList.length == 0) { // first time the daily validators list is set
            _updateCurrentEntityList(_self.selectedApplications, _applications);
        } else {
            if (_rewardsDay > _self.selectedApplications.rewardsDay)
                _updatePreviousEntityList(_self.selectedApplications);
            _updateCurrentEntityList(_self.selectedApplications, _applications);
        }
        _self.selectedApplications.rewardsDay = _rewardsDay;
        return true;
    }

    /**
    * @dev Get applications or validators list
    * @param _self Data pointer to storage
    * @param _entityType RewardedEntityType either application (0) or validator (1)
    * @param _rewardsDay uint256 the reward day to determine which list to get
    */
    function getEntities(
        Data storage _self,
        RewardedEntityType _entityType,
        uint256 _rewardsDay
    )
        public
        view
        returns (address[])
    {
        if (_entityType == RewardedEntityType.Application) {
            if (_getSelectedRewardedEntityListType(_self.selectedApplications, _rewardsDay) == 0) {
                return _self.selectedApplications.currentList;
            } else {
                return _self.selectedApplications.previousList;
            }
        } else {
            if (_getSelectedRewardedEntityListType(_self.selectedValidators, _rewardsDay) == 0) {
                return _self.selectedValidators.currentList;
            } else {
                return _self.selectedValidators.previousList;
            }
        }
    }

    /**
    * @dev Get which entity list to use. Current = 0, previous = 1
    * @param _rewardedEntitylist RewardedEntityList pointer to storage
    * @param _rewardsDay uint256 the reward day to determine which list to get
    */
    function _getSelectedRewardedEntityListType(RewardedEntityList _rewardedEntitylist, uint256 _rewardsDay)
        internal
        pure
        returns (uint256)
    {
        if (_rewardsDay >= _rewardedEntitylist.rewardsDay) {
            return 0;
        } else {
            return 1;
        }
    }

    /**
    * @dev Updates the current dailyTimestamp and previous one
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the reward day
    */
    function _incrementRewardsDay(Data storage _self, uint256 _rewardsDay)
        public
        returns (bool)
    {
        _self.rewardsDay = (_rewardsDay + 1);
        return true;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the reward day
    * @param _maxTotalSupply uint256 max total supply
    * @param _currentTotalSupply uint256 current total supply
    */
    function _getMaxAppRewardsDailyAmount(
        Data storage _self,
        uint256 _rewardsDay,
        uint256 _maxTotalSupply,
        uint256 _currentTotalSupply
    )
        public
        view
        returns (uint256)
    {
        return ((_maxTotalSupply - _currentTotalSupply) *
        getParameterValue(_self, ParameterName.ApplicationRewardsPercent, _rewardsDay) *
        getParameterValue(_self, ParameterName.ApplicationRewardsMaxVariationPercent, _rewardsDay)) / 1e16;
    }


    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the reward day
    * @param _numOfValidators uint256 number of validators
    * @param _maxTotalSupply uint256 max total supply
    * @param _currentTotalSupply uint256 current total supply
    */
    function _getValidatorRewardsDailyAmountPerValidator(
        Data storage _self,
        uint256 _rewardsDay,
        uint256 _numOfValidators,
        uint256 _maxTotalSupply,
        uint256 _currentTotalSupply
    )
        public
        view
        returns (uint256)
    {
        return (((_maxTotalSupply - _currentTotalSupply) *
        getParameterValue(_self, ParameterName.ValidatorRewardsPercent, _rewardsDay)) / 1e8) / _numOfValidators;
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
        public
        view
        returns (uint256)
    {
        uint256 sum;
        bool valid = true;
        for (uint256 i = 0; i < _amounts.length; i++) {
             sum += _amounts[i];
            if (_self.applications[_applications[i]].initializedState != 1) valid = false;
        }
        require(
                sum > 0 && valid,
                "Sum zero or none existing app submitted"
        );
        return sum;
    }

    /**
    * @dev Checks if submitted data matches reward hash
    * @param _rewardsDay uint256 the reward day
    * @param _rewardsHash bytes32 hash of the rewards data
    * @param _applications address[] array of application addresses getting the daily reward
    * @param _amounts uint256[] array of amounts each app should get
    */
    function _rewardHashIsvalid(
        uint256 _rewardsDay,
        bytes32 _rewardsHash,
        address[] _applications,
        uint256[] _amounts
    )
        public
        pure
        returns (bool)
    {
        return keccak256(abi.encodePacked(_rewardsDay, _applications, _amounts)) == _rewardsHash;
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the reward day
    */
    function _requiredValidatorsForValidatorsRewards(Data storage _self, uint256 _rewardsDay)
        public
        view
        returns (uint256)
    {
        if (_getSelectedRewardedEntityListType(_self.selectedValidators, _rewardsDay) == 0) {
            return _self.selectedValidators.currentList.length;
        } else {
            return _self.selectedValidators.previousList.length;
        }
    }

    /**
    * @dev Checks how many validators are needed for app rewards
    * @param _self Data pointer to storage
    * @param _rewardsDay uint256 the reward day
    */
    function _requiredValidatorsForAppRewards(Data storage _self, uint256 _rewardsDay)
        public
        view
        returns (uint256)
    {
        if (_getSelectedRewardedEntityListType(_self.selectedValidators, _rewardsDay) == 0) {
            return ((_self.selectedValidators.currentList.length * getParameterValue(_self, ParameterName.ValidatorMajorityPercent, _rewardsDay)) / 1e8)+1;
        } else {
            return ((_self.selectedValidators.previousList.length * getParameterValue(_self, ParameterName.ValidatorMajorityPercent, _rewardsDay)) / 1e8)+1;
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

    /**
    * @dev Delete existing values from the previous applications list
    * @param _self Data pointer to storage
    */
    function _deleteFirstDailyRewardEntry(Data storage _self)
        public
        returns (bool)
    {
        bytes32 rewardsDayHashToDelete = _self.dailyRewardsList[0];
        uint256 rewardsDayToDelete = _self.dailyRewards[rewardsDayHashToDelete].rewardsDay;

        for (uint256 i = 1; i < _self.dailyRewardsList.length; i++) {
            _self.dailyRewardsList[i-1] = _self.dailyRewardsList[i];
        }
        delete( _self.dailyRewardsList[_self.dailyRewardsList.length - 1]);
        _self.dailyRewardsList.length--;
        delete(_self.dailyRewards[rewardsDayHashToDelete]);
        delete(_self.dailyRewardHashes[rewardsDayToDelete]);
    }
}