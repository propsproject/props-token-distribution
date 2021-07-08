pragma solidity ^0.5.16;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
import { PropsRewardsLib } from "./PropsRewardsLib.sol";

/**
 * @title Props Rewards
 * @dev Most of this contract is obsolete and contains relics from the rewards logic.
 * Remaining active part is controller modifier, and a way to set the new rewards/staking contract address for minting tokens
 **/
contract PropsRewards is Initializable, ERC20 {
    using SafeMath for uint256;

    /*
    *  Events
    */
    event ControllerUpdated(address indexed newController);

    /*
    *  Storage
    */

    PropsRewardsLib.Data internal rewardsLibData; //OBSOLETE
    uint256 public maxTotalSupply; //OBSOLETE
    uint256 public rewardsStartTimestamp; //OBSOLETE
    address public controller; // controller entity

    address public rewardsContract; // rewards/staking contract address
    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint) public nonces;

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
    * @dev Initialize post separation of rewards contract upgrade
    * @param _tokenName string token name
    */
    function initializeStakingUpgrade(string memory _tokenName)
        public
        initializer
    {
        uint chainId;
        assembly {
            chainId := chainid
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(_tokenName)),
                keccak256(bytes('1')),
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
    * @dev Allows the controller/owner to update to a new controller
    * @param _rewardsContract address address of the rewards contract
    */
    function updateRewardsContract(
        address _rewardsContract
    )
        public
        onlyController
    {
        require(_rewardsContract != address(0), "Rewards contract cannot be the zero address");
        rewardsContract = _rewardsContract;
        // TODO: do we want an event for this?
    }

    /**
    * @dev Allows the rewards contract to mint tokens
    * @param _to address where the tokens be minted to
    * @param _amount uint256 amount to mint
    */
    function mint(
        address _to,
        uint256 _amount
    )
        public
    {
        require(rewardsContract != address(0), "Rewards contract cannot be the zero address");
        _mint(_to, _amount);
        // TODO: do we want an event for this?
        // TODO: do we want to impose limits?
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
}