## History
### March 2019
Deployment and distribtion of token with ERC865 support for relays

https://medium.com/@ZeppelinOrg/208e3b20d985
### July 2019
Upgrade of props token contract for supporting Props protocol and minting reward props to participating apps and validators.
- Selected validators transact daily and agree upon daily app rewards to be minted based upon app’s user activity.
- Apps can register themsleves with a rewards address
- Controller can whitelist new apps
- Parameters that control the rewards rate, and other settings controlled by Controller
- Participating validators: Coinbase, Peerstream and YouNow

https://blog.openzeppelin.com/props-rewards-engine-contracts-audit/
## March 2021
Upgrade of props token contract to support the upgraded Props Protocol.
- Removed methods related to old protocol (storage remains)
- Added minter roles for the Protocol’s L2 > L1 bridge
- Added permit
- Added reclaimTokens for tokens accidently transferred to contract
