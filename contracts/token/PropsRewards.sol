pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-eth/contracts/token/ERC20/SafeERC20.sol";
import { PropsRewardsLib } from "./PropsRewardsLib.sol";

/**
 * @title Props Rewards
 * @dev Contract allows to set approved apps and validators. Submit and mint rewards...
 **/
contract PropsRewards is Initializable, ERC20 {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;
    /*
    *  Events
    */
    event DailyRewardsSubmitted(
        uint256 indexed rewardsDay,
        bytes32 indexed rewardsHash,
        address indexed validator
    );

    event DailyRewardsApplicationsMinted(
        uint256 indexed rewardsDay,
        bytes32 indexed rewardsHash,
        uint256 numOfApplications,
        uint256 amount
    );

    event DailyRewardsValidatorsMinted(
        uint256 indexed rewardsDay,
        bytes32 indexed rewardsHash,
        uint256 numOfValidators,
        uint256 amount
    );

    event EntityUpdated(
        address indexed id,
        PropsRewardsLib.RewardedEntityType indexed entityType,
        bytes32 name,
        address rewardsAddress,
        address indexed sidechainAddress
    );

    event ParameterUpdated(
        PropsRewardsLib.ParameterName param,
        uint256 newValue,
        uint256 oldValue,
        uint256 rewardsDay
    );

    event ValidatorsListUpdated(
        address[] validatorsList,
        uint256 indexed rewardsDay
    );

    event ApplicationsListUpdated(
        address[] applicationsList,
        uint256 indexed rewardsDay
    );

    event ControllerUpdated(address indexed newController);

    event Settlement(
        address indexed applicationId,
        bytes32 indexed userId,
        address indexed to,
        uint256 amount,
        address rewardsAddress
    );
    /*
    *  Storage
    */

    PropsRewardsLib.Data internal rewardsLibData;
    uint256 public maxTotalSupply;
    uint256 public rewardsStartTimestamp;
    address public controller; // controller entity
    address public minter; // minter entity e.g. props rewards contract

    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint) public nonces;
    uint256 public MY_CHAIN_ID;

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
    * @param _controller address that will have controller functionality on rewards protocol    
    */
    function initializePostRewardsUpgrade1(
        address _controller        
    )
        public
    {
        uint256 decimals = 18;
        _initializePostRewardsUpgrade1(_controller, decimals);
    }

    /**
    * @dev Initialize post separation of rewards contract upgrade
    * @param _tokenName string token name
    * @param _minter address minter address
    */
    function initializePermitUpgrade(string memory _tokenName, address _minter)
        public
        initializer
    {
        minter = _minter;
        uint chainId;
        string memory one = '1';
        assembly {
            chainId := chainId
        }

        MY_CHAIN_ID = chainId;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(_tokenName)),
                keccak256(bytes(one)),
                chainId,
                address(this)
            )
        );
    }

    /**
    * @dev Allows for approvals to be made via secp256k1 signatures
    * @param _owner address owner
    * @param _spender address spender
    * @param _amount uint spender
    * @param _deadline uint spender
    * @param _v uint8 spender
    * @param _r bytes32 spender
    * @param _s bytes32 spender
    */
    function permit(
            address _owner,
            address _spender,
            uint256 _amount,
            uint _deadline,
            uint8 _v,
            bytes32 _r,
            bytes32 _s
        )
        external
    {
        require(_deadline >= block.timestamp, "Permit Expired");
        bytes32 digest = keccak256(
            abi.encodePacked(
                '\x19\x01',
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, _owner, _spender, _amount, nonces[_owner]++, _deadline))
            )
        );
        address recoveredAddress = ecrecover(digest, _v, _r, _s);
        require(recoveredAddress != address(0) && recoveredAddress == _owner, "Invalid Signature");
        _approve(_owner, _spender, _amount);
    }

    
    
    /**
    * @dev Reclaim all ERC20 compatible tokens
    * @param _token ERC20 The address of the token contract    
    */
    function reclaimToken(ERC20 _token, address _to, uint256 _amount) 
        external 
        onlyController 
    {
        require(_to != address(0), "Must transfer to recipient");
        uint256 balance = _token.balanceOf(this);
        require(_amount <= balance, "Cannot transfer more than balance");
        _token.safeTransfer(_to, _amount);
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
    {
        require(_controller != address(0), "Controller cannot be the zero address");
        controller = _controller;
        emit ControllerUpdated
        (
            _controller
        );
    }

    /**
    * @dev Allows the controller/owner to update to new minter
    * @param _minter address address of the new minter
    */
    function updateMinter(
        address _minter
    )
        public
        onlyController
    {        
        minter = _minter;
    }

    /**
    * @dev Allows the minter to mint tokens to a given address
    * @param _account address of the receiving account
    * @param _amount uint256 how much to mint    
    */
    function mint(        
        address _account,
        uint256 _amount
    )
        public        
    {
        if (msg.sender != minter) {
            _mint(_account, _amount);
        }        
    }

    /**
    * @dev Allows an application to settle sidechain props. Should be called from an application rewards address
    * @param _applicationAddress address the application main address (used to setup the application)
    * @param _userId bytes32 identification of the user on the sidechain that was settled
    * @param _to address where to send the props to
    * @param _amount uint256 the address used for using the sidechain
    */
    function settle(
        address _applicationAddress,
        bytes32 _userId,
        address _to,
        uint256 _amount
    )
        public
    {
        require(
            rewardsLibData.applications[_applicationAddress].rewardsAddress == msg.sender,
            "settle may only be called by an application"
        );
        _transfer(msg.sender, _to, _amount);
        emit Settlement(_applicationAddress, _userId, _to, _amount, msg.sender);
    }
    /**
    * @dev internal intialize rewards upgrade1
    * @param _controller address that will have controller functionality on rewards protocol
    * @param _decimals uint256 number of decimals used in total supply    
    */
    function _initializePostRewardsUpgrade1(
        address _controller,
        uint256 _decimals
    )
        internal
    {
        require(maxTotalSupply==0, "Initialize rewards upgrade1 can happen only once");
        controller = _controller;
        // max total supply is 1,000,000,000 PROPS specified in AttoPROPS
        maxTotalSupply = 1 * 1e9 * (10 ** _decimals);        
    }
}