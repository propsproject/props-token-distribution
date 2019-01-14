pragma solidity ^0.4.11;

contract WalletOwnership {

    event LinkWallet(address indexed owner, bytes data);

    function () public {
        LinkWallet(msg.sender, msg.data);
    }

}
