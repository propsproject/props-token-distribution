pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Pausable.sol";
import "tpl-contracts-eth/contracts/token/TPLRestrictedReceiverToken.sol";
import "./PropsSidechainCompatible.sol";

/**
 * @title PROPSToken
 * @dev PROPS token contract (based of ZEPToken by openzeppelin), a detailed ERC20 including pausable functionality.
 * The TPLToken integration causes tokens to only be transferrable to addresses
 * which have the validRecipient attribute in the jurisdiction.
 */
contract PropsToken is Initializable, TPLRestrictedReceiverToken, ERC20Detailed, ERC20Pausable, PropsSidechainCompatible {

  /**
   * @dev Initializer function. Called only once when a proxy for the contract is created.
   * @param _sender Address that will control the token and receive it's initial supply.
   * @param _jurisdictionAddress AttributeRegistry used for the TPL jurisdiction of the token.
   * @param _validRecipientAttributeId uint256 id that the TPL jurisdiction uses to control which addresses can receive the token.
   */
  function initialize(
    address _sender,
    AttributeRegistryInterface _jurisdictionAddress,
    uint256 _validRecipientAttributeId
  )
    initializer
    public
  {
    uint8 decimals = 18;
    uint256 totalSupply = 1e9 * (10 ** uint256(decimals));

    ERC20Pausable.initialize(_sender);
    ERC20Detailed.initialize("DEV Token", "DEV_TOKEN", decimals);
    TPLRestrictedReceiverToken.initialize(_jurisdictionAddress, _validRecipientAttributeId);
    _mint(_sender, totalSupply);
  }

}