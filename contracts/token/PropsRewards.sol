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

    event ControllerUpdated(address indexed newController);

    /*
    *  Storage
    */

    PropsRewardsLib.Data internal rewardsLibData;
    uint256 public maxTotalSupply;
    uint256 public rewardsStartTimestamp;
    address public controller; // controller entity
    mapping(address => bool) public minters;
    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint256) public nonces;
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
     * @param _controller address that will have controller functionality on token
     */
    function initialize(address _controller) public {
        uint256 decimals = 18;
        _initialize(_controller, decimals);
    }

    /**
     * @dev Initialize post separation of rewards contract upgrade
     * @param _tokenName string token name
     */
    function initializePermitUpgrade(string memory _tokenName)
        public
        initializer
    {
        // We hardcode the chain id
        uint256 chainId = 1;
        string memory one = "1";

        // Solidity 0.4 does not support chain ids
        // assembly {
        //     chainId := chainid()
        // }

        MY_CHAIN_ID = chainId;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
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
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        require(_deadline >= block.timestamp, "Permit Expired");
        bytes32 digest =
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR,
                    keccak256(
                        abi.encode(
                            PERMIT_TYPEHASH,
                            _owner,
                            _spender,
                            _amount,
                            nonces[_owner]++,
                            _deadline
                        )
                    )
                )
            );
        address recoveredAddress = ecrecover(digest, _v, _r, _s);
        require(
            recoveredAddress != address(0) && recoveredAddress == _owner,
            "Invalid Signature"
        );
        _approve(_owner, _spender, _amount);
    }

    /**
     * @dev Reclaim all ERC20 compatible tokens
     * @param _token ERC20 The address of the token contract
     */
    function reclaimToken(
        ERC20 _token,
        address _to,
        uint256 _amount
    ) external onlyController {
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

    function addMinter(address _minter) public onlyController {
        minters[_minter] = true;
    }

    function removeMinter(address _minter) public onlyController {
        minters[_minter] = false;
    }

    /**
     * @dev Allows minters to mint tokens to a given address
     * @param _account address of the receiving account
     * @param _amount uint256 how much to mint
     */
    function mint(address _account, uint256 _amount) public {
        require(minters[msg.sender], "Mint fn can be called only by minter");
        require(
            totalSupply().add(_amount) <= maxTotalSupply,
            "Max total supply exceeded"
        );
        _mint(_account, _amount);
    }
    
    /**
     * @dev internal intialize
     * @param _controller address that will have controller functionality on rewards protocol
     * @param _decimals uint256 number of decimals used in total supply
     */
    function _initialize(address _controller, uint256 _decimals) internal {
        require(
            maxTotalSupply == 0,
            "Initialize rewards upgrade1 can happen only once"
        );
        controller = _controller;
        // max total supply is 1,000,000,000 PROPS specified in AttoPROPS
        maxTotalSupply = 1 * 1e9 * (10**_decimals);
    }
}