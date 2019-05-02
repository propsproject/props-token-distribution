pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/ownership/Ownable.sol";


/**
 * @title Props RewardEntities
 * @dev Contract allows to manage application and validators
 **/
contract PropsRewardEntities is Initializable, Ownable {    
    /*
    *  Events
    */
    event ApplicationAdded(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed sidechainAddress
    );
    
    event ApplicationUpdated(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed sidechainAddress,
        ApplicationStatus indexed status
    );

    event ValidatorAdded(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed sidechainAddress
    );
    
    event ValidatorUpdated(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed sidechainAddress,
        ValidatorStatus indexed status
    );
    /*
    *  Storage
    */
    
    // The various states a validator can be in
    enum ValidatorStatus { Inactive, Active }
    // The various states an application can be in
    enum ApplicationStatus { Inactive, Active }

    // Represents an application current state
    struct Application {        
        bytes32 name;                            // Application name
        address rewardsAddress;                  // address where rewards will be minted to
        address sidechainAddress;              // address used on the sidechain
        ApplicationStatus status;                // The amount of tokens delegated to the delegator
        uint8 initializedState;                  // A way to check if there's something in the map and whether already added to list
    }

    // Represents an application current state
    struct Validator {        
        bytes32 name;                            // Application name
        address rewardsAddress;                  // address where rewards will be minted to
        address sidechainAddress;                // address used on the sidechain
        ValidatorStatus status;                  // The amount of tokens delegated to the delegator
        uint8 initializedState;                  // A way to check if there's something in the map and whether already added to list
    }

    mapping (address => Application) public applications;
    mapping (address => Validator) public validators;

    address[] public applicationsList;
    address[] public validatorsList;
    

    /*
    *  Modifiers
    */
     modifier onlyNewApplications(address _address) {
         require(
             applications[_address].initializedState == 0,
             "Must be a new application"
             );
         _;
     }

     modifier onlyExistingApplications(address _address) {
         require(
             applications[_address].initializedState > 0,
             "Must be an existing application"
             );
         _;
     }

     modifier onlyRewardedEntity(address _address) {
         require(
             msg.sender == _address,
             "Must be the application owner"
             );
         _;
     }

     modifier onlyNewValidators(address _address) {
         require(
             validators[_address].initializedState == 0,
             "Must be a new validator"
             );
         _;
     }

     modifier onlyExistingValidators(address _address) {
         require(
             validators[_address].initializedState > 0,
             "Must be an existing validator"
             );
         _;
     }

     modifier onlyActiveValidators(address _address) {
         require(
             validators[_address].status == ValidatorStatus.Active,
             "Must be an active validator"
             );
         _;
     }

    /**
    * @dev The initializer function, get the decimals used in the token to initialize the params
    */
    function initialize()
        public
        initializer
    {                         
    }

    /**
    * @dev Allows an application to add its details
    * @param _id address cold wallet storage and the id of an application
    * @param _name bytes32 name of the app
    * @param _rewardsAddress address an address for the app to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain    
    */
    function addApplication(
        address _id,
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    ) 
        public
        onlyRewardedEntity(_id)
        onlyNewApplications(_id)        
        returns (bool)
    {
        applications[_id].name = _name;
        applications[_id].rewardsAddress = _rewardsAddress;
        applications[_id].sidechainAddress = _sidechainAddress;
        applications[_id].status = ApplicationStatus.Inactive;
        applications[_id].initializedState = 1;
        emit ApplicationAdded(_id, _name, _rewardsAddress, _sidechainAddress);
        return true;
    }

    /**
    * @dev Allows an application to edit its details
    * @param _id address cold wallet storage and the id of an application
    * @param _name bytes32 name of the app
    * @param _rewardsAddress address an address for the app to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain    
    */
    function updateApplication(
        address _id,
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    ) 
        public
        onlyRewardedEntity(_id)
        onlyExistingApplications(_id)
        returns (bool)
    {
        applications[_id].name = _name;
        applications[_id].rewardsAddress = _rewardsAddress;
        applications[_id].sidechainAddress = _sidechainAddress;        
        emit ApplicationUpdated(_id, _name, _rewardsAddress, _sidechainAddress, applications[_id].status);
        return true;
    }
    
    /**
    * @dev Allows the controller to approve an application
    * @param _id address cold wallet storage and the id of an application
    */
    function approveApplication(
        address _id
    ) 
        public
        onlyOwner
        onlyExistingApplications(_id)
        returns (bool)
    {
        if (applications[_id].initializedState == 1){ // add only one time to the list on initial approval
            applicationsList.push(_id);
            applications[_id].initializedState = 2;
        }
        applications[_id].status = ApplicationStatus.Active;
        
        emit ApplicationUpdated(_id, applications[_id].name, applications[_id].rewardsAddress, applications[_id].sidechainAddress, applications[_id].status);
        return true;
    }

    /**
    * @dev Allows the controller to remove/deactivate an application
    * @param _id address cold wallet storage and the id of an application
    */
    function removeApplication(
        address _id
    ) 
        public
        onlyOwner
        onlyExistingApplications(_id)
        returns (bool)
    {        
        applications[_id].status = ApplicationStatus.Inactive;
        
        emit ApplicationUpdated(_id, applications[_id].name, applications[_id].rewardsAddress, applications[_id].sidechainAddress, applications[_id].status);
        return true;
    }

    /**
    * @dev Allows a validator to add its details
    * @param _id address cold wallet storage and the id of an application
    * @param _name bytes32 name of the validator
    * @param _rewardsAddress address an address for the validator to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain    
    */
    function addValidator(
        address _id,
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    ) 
        public
        onlyRewardedEntity(_id)
        onlyNewValidators(_id)        
        returns (bool)
    {
        validators[_id].name = _name;
        validators[_id].rewardsAddress = _rewardsAddress;
        validators[_id].sidechainAddress = _sidechainAddress;
        validators[_id].status = ValidatorStatus.Inactive;
        validators[_id].initializedState = 1;
        emit ValidatorAdded(_id, _name, _rewardsAddress, _sidechainAddress);
        return true;
    }

    /**
    * @dev Allows a validator to edit its details
    * @param _id address cold wallet storage and the id of a validator
    * @param _name bytes32 name of the validator
    * @param _rewardsAddress address an address for the validator to receive the rewards
    * @param _sidechainAddress address the address used for using the sidechain    
    */
    function updateValidator(
        address _id,
        bytes32 _name,
        address _rewardsAddress,
        address _sidechainAddress
    ) 
        public
        onlyRewardedEntity(_id)
        onlyExistingValidators(_id)
        returns (bool)
    {
        validators[_id].name = _name;
        validators[_id].rewardsAddress = _rewardsAddress;
        validators[_id].sidechainAddress = _sidechainAddress;        
        emit ValidatorUpdated(_id, _name, _rewardsAddress, _sidechainAddress, validators[_id].status);
        return true;
    }
    
    /**
    * @dev Allows the controller to approve a validator
    */
    function approveValidator(
        address _id
    ) 
        public
        onlyOwner
        onlyExistingValidators(_id)
        returns (bool)
    {
        if (validators[_id].initializedState == 1){ // add only one time to the list on initial approval
            validatorsList.push(_id);
            validators[_id].initializedState = 2;
        }
        validators[_id].status = ValidatorStatus.Active;
        
        emit ValidatorUpdated(_id, validators[_id].name, validators[_id].rewardsAddress, validators[_id].sidechainAddress, validators[_id].status);
        return true;
    }

    /**
    * @dev Allows the controller to remove/deactivate a validator
    */
    function removeValidator(
        address _id
    ) 
        public
        onlyOwner
        onlyExistingValidators(_id)
        returns (bool)
    {        
        validators[_id].status = ValidatorStatus.Inactive;
        
        emit ValidatorUpdated(_id, validators[_id].name, validators[_id].rewardsAddress, validators[_id].sidechainAddress, validators[_id].status);
        return true;
    }
}