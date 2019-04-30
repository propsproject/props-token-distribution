pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "./PropsParameters.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";

/**
 * @title Props Rewards
 * @dev Contract allows to set approved apps and validators. Submit and mint rewards...
 **/
contract PropsRewards is Initializable, PropsParameters {
    using SafeMath for uint256;    
    /*
     *  Events
     */
    event ApplicationAdded(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed applicationAddress
    );
    event ApplicationRemoved(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed applicationAddress
    );
    event ApplicationUpdated(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed applicationAddress,
        ApplicationStatus indexed status
    );
    event ValidatorAdded(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed validatorAddress
    );
    event ValidatorRemoved(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed validatorAddress
    );
    event ValidatorUpdated(
        address indexed id,         
        bytes32 name,
        address rewardsAddress,
        address indexed validatorAddress,
        ValidatorStatus indexed status
    );
    /*
     *  Storage
     */
    // The various states a transcoder can be in
    enum ValidatorStatus { Inactive, Active }
    enum ApplicationStatus { Inactive, Active }

    // Represents an application current state
    struct Application {        
        bytes32 name;                            // Application name
        address rewardsAddress;                  // address where rewards will be minted to
        address applicationAddress;              // address used on the sidechain
        ApplicationStatus status;                // The amount of tokens delegated to the delegator
        bool initialized;                        // A way to check if there's something in the map, actual objects will be true
    }

    // Represents an application current state
    struct Validator {        
        bytes32 name;                            // Application name
        address rewardsAddress;                  // address where rewards will be minted to
        address validatorAddress;                // address used on the sidechain
        ValidatorStatus status;                  // The amount of tokens delegated to the delegator
        bool initialized;                        // A way to check if there's something in the map, actual objects will be true
    }

    mapping (address => Application) private applications;
    mapping (address => Validator) private validators;

    address[] public applicationsList;
    address[] public validatorsList;
    

    /*
     *  Modifiers
     */
     modifier onlyNewApplications(address _address) {
         require(
             !applications[_address].initialized,
             "Must be a new application"
             );
         _;
     }

     modifier onlyExistingApplications(address _address) {
         require(
             applications[_address].initialized,
             "Must be an existing application"
             );
         _;
     }

     modifier onlyNewValidators(address _address) {
         require(
             !validators[_address].initialized,
             "Must be a new validator"
             );
         _;
     }

     modifier onlyExistingValidators(address _address) {
         require(
             validators[_address].initialized,
             "Must be an existing validator"
             );
         _;
     }

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
        
        PropsParameters.initialize(
            maxTotalSupply, 
            appRewardPercentage, 
            appRewardsMaxVariationPercentage, 
            validatorMajorityPercentage, validatorRewardsPercentage);            
    }

    /**
   * @dev Allows the current owner/controller to add a reward receiving application   
   */
    function addApplication(
        address _id,
        bytes32 _name,
        address _rewardsAddress,
        address _applicationAddress
    ) 
        public 
        onlyOwner
        onlyNewApplications(_id)
        returns (bool)
    {
        applications[_id].name = _name;
        applications[_id].rewardsAddress = _rewardsAddress;
        applications[_id].applicationAddress = _applicationAddress;
        applications[_id].status = ApplicationStatus.Active;
        applications[_id].initialized = true;
        return true;
    }
    
}