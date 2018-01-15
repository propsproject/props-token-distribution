pragma solidity ^0.4.13;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * @title Crowdsale extension.
 * @author Ludovic Galabru
 *
 */

contract PhasedUserCappedCrowdsale is CappedCrowdsale, Ownable {
    using SafeMath for uint256;

    /* Data structure holding the phases */
    struct Phase {
        /* identifier for the phase */
        uint id;

        /* cap used by default during the phase */
        uint defaultCap;

        /* Timestamp - beginning of the phase */
        uint startingAt;

        /* Timestamp - end of the phase */
        uint endingAt;
    }

    /* Composition of phases for the crowdsale */
    Phase[] public phases;

    /* Max number of phases for the crowdsale */
    uint public phasesLimit;

    /* Constant */
    uint public constant notFound = (2**256 - 1);

    /* Value of the cap to override for a given user, if so, on given phase */
    mapping (uint => mapping (address => uint)) public capForUserOnPhase;

    /* Value of the participation for a given user */
    mapping (address => uint) public weiRaisedFromUser;

    event PhaseCreated(uint _phaseId, uint _defaultCap, uint startingAt, uint endingAt);

    event PhaseUpdated(uint _phaseId, uint _defaultUserCap);

    event UserCapOverridenForPhase(uint _phaseId, address _user, uint _userCap);

    /* Modifier allowing execution only if the crowdsale hasn't start yet */
    modifier onlyBeforeCrowdsale() {
        require(now < startTime);
        _;
    }

    function PhasedUserCappedCrowdsale(uint256 _cap) public
        CappedCrowdsale(_cap)
    {
        phasesLimit = 3;
    }

    /**
     * @dev Add phase to the crowdsale.
     * Phases must be added in chronological order.
     */
    function addPhase(uint _defaultCap, uint _startingAt, uint _endingAt) onlyOwner onlyBeforeCrowdsale public {
        require(phases.length < phasesLimit);
        require(_defaultCap > 0);
        require(_startingAt >= startTime);
        require(_endingAt <= endTime);

        uint phaseId = phases.length;
        phases.push(Phase({
            id: phaseId,
            defaultCap: _defaultCap,
            startingAt: _startingAt,
            endingAt: _endingAt
        }));

        PhaseCreated(phaseId, _defaultCap, _startingAt, _endingAt);
    }

    /**
     * @dev Update the default cap for a given phase.
     */
    function updateDefaultCapForPhase(uint _phaseId, uint _defaultUserCap) onlyOwner public {
        require(_phaseId < phases.length);
        require(_defaultUserCap > 0);

        phases[_phaseId].defaultCap = _defaultUserCap;

        PhaseUpdated(_phaseId, _defaultUserCap);
    }

    /**
     * @dev Override the cap of a given user during a specific phase
     */
    function overrideCapForUserOnPhase(uint _phaseId, address _user, uint _userCap) onlyOwner public {
        require(_phaseId < phases.length);
        require(_userCap > 0);

        capForUserOnPhase[_phaseId][_user] = _userCap;

        UserCapOverridenForPhase(_phaseId, _user, _userCap);
    }

    /**
     * @dev Overriding Crowdsale#buyTokens, for pre-flight & post-flight.
     * Can be removed if https://github.com/OpenZeppelin/zeppelin-solidity/pull/404
     * is merged
     */
    function buyTokens(address _beneficiary) payable public {
        require(canBuyTokens(_beneficiary));
        super.buyTokens(_beneficiary);
        didBuyTokens(_beneficiary);
    }

    /**
     * @dev Evaluating the cap.
     * If the msg.value is above the remaining cap of the sender, we reject the transaction
     */
    function canBuyTokens(address _beneficiary) internal constant returns (bool) {
        uint phaseId = currentPhaseId();
        bool canBuyTokens = super.validPurchase() && (phaseId != notFound);
        if (canBuyTokens) {
            uint totalInvestment = weiRaisedFromUser[_beneficiary].add(msg.value);
            uint currentCap = currentCapForUser(_beneficiary);
            canBuyTokens = (totalInvestment <= currentCap);
        }
        return canBuyTokens;
    }

    /**
     * @dev Keeping track of how much was invested by every single user
     */
    function didBuyTokens(address _beneficiary) internal {
        weiRaisedFromUser[_beneficiary] = weiRaisedFromUser[_beneficiary].add(msg.value);
    }

    /**
     * @dev Returns the current phase
     */
    function currentPhaseId() public constant returns (uint) {
        for (uint i = 0; i < phases.length; i++) {
            if ((now >= phases[i].startingAt) && (now < phases[i].endingAt)) {
                return i;
            }
        }
        return notFound;
    }

    /**
     * @dev Returns phases count
     */
    function getPhaseCount() public constant returns (uint256) {
        return phases.length;
    }

    /**
     * @dev Returns the cap for a given user
     */
    function currentCapForUser(address _user) internal constant returns (uint) {
        uint phaseId = currentPhaseId();
        return capForUserDuringPhase(_user, phaseId);
    }

    /**
     * @dev Returns the cap for a given user during a phase
     */
    function capForUserDuringPhase(address _user, uint _phaseId) internal constant returns (uint) {
        uint cap = 0;
        if (_phaseId != notFound) {
            cap = capForUserOnPhase[_phaseId][_user];
            if (cap == 0) {
                cap = phases[_phaseId].defaultCap;
            }
        }
        return cap;
    }

}
