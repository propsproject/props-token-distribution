var Web3 = require('web3')
var fs = require('fs');
const csv = require('fast-csv');
const connectionConfig = require('../../truffle');
const BigNumber = require('bignumber.js');
const execSync = require('child_process').execSync;
const networkProvider = process.argv[2];
const jurisdictionContractAddress = process.argv[3];
const addressesCSV = process.argv[4];
let networkInUse;
let addressInUse;
let cmd;
let web3;
let zosData;
const allocateTo = typeof(allocationType) === 'undefined' ? 'foundation' : allocationType;

const duration = {
    seconds: function (val) { return val; },
    minutes: function (val) { return val * this.seconds(60); },
    hours: function (val) { return val * this.minutes(60); },
    days: function (val) { return val * this.hours(24); },
    weeks: function (val) { return val * this.days(7); },
    years: function (val) { return val * this.days(365); },
};

const nonces = {};

const getAndIncrementNonce = function(address) {
    nonce = nonces[address];
    nonces[address] = nonces[address] + 1; 
    console.log(`Got nonce ${nonce} for ${address} and incremented to ${nonces[address]}`);
    return nonce;
}


if (typeof(networkProvider) === 'undefined') {
    console.log("Must supply networkProvider");
    process.exit(0);
} else { //default provider
    networkInUse = `${networkProvider}0`;        
    web3 = connectionConfig.networks[networkInUse].provider;
}

if (typeof(jurisdictionContractAddress) === 'undefined') {
    console.log("Must supply jurisdictionContractAddress");
    process.exit(0);
}

if (typeof(addressesCSV) === 'undefined') {
    console.log("Must supply path to CSV");
    process.exit(0);
}
const timestamp = Math.round((new Date()).getTime() / 1000);
const allocationMetadataFilename = `build/allocation-${allocateTo}-${networkProvider}-${timestamp}.json`;
allocationsData = {};
allocationsData.allocations = [];
zosData = JSON.parse(fs.readFileSync(`zos.${networkProvider}.json`, 'utf8'));
let PropsTokenContractAddress = zosData.proxies["PropsToken/PropsToken"][0].address;

async function main() {     
    // instantiate propstoken
    const propsContractABIPath = "../../build/contracts/PropsToken.json";
    const propsContractABI = require(propsContractABIPath);
    networkInUse = `${networkProvider}2`;
    tokenHolderAddress = connectionConfig.networks[networkInUse].wallet_address;    
    providerTransferrer = connectionConfig.networks[networkInUse].provider();        
    web3 = new Web3(providerTransferrer);    
    const propsContractInstance = new web3.eth.Contract(propsContractABI.abi,PropsTokenContractAddress);    
    nonces[tokenHolderAddress] = await web3.eth.getTransactionCount(tokenHolderAddress);
    
    
    
    // instantiate jurisdiction
    const jurisdictionContractABIPath = "../../build/contracts/BasicJurisdiction.json";
    const jurisdictionContractABI = require(jurisdictionContractABIPath);
    networkInUse = `${networkProvider}Validator`;    
    validatorAddress = connectionConfig.networks[networkInUse].wallet_address;    
    providerValidator = connectionConfig.networks[networkInUse].provider();    
    web3 = new Web3(providerValidator);
    const jurisdictionContractInstance = new web3.eth.Contract(jurisdictionContractABI.abi,jurisdictionContractAddress);
    nonces[validatorAddress] = await web3.eth.getTransactionCount(validatorAddress);    
        
    // read csv
    const allocationContents = fs.readFileSync(addressesCSV, 'utf8');  
    const allocationArray = allocationContents.split(/\r?\n/)
    for (let i=0; i< allocationArray.length; ++i) {
        if (i <= 0) continue;
        console.log("Working on row:"+allocationArray[i]);
        const allocationData = allocationArray[i].split(",");
        // Address,Tokens,Vesting Duration,Vesting Cliff,Percentage Vested
        const _address = allocationData[0];
        const _tokensRead = new BigNumber(allocationData[1]);
        // const _tokensMultiplier = new BigNumber(1 * 10 ** 18);
        const _tokens = _tokensRead; // .multipliedBy(_tokensMultiplier);
        const _duration = new BigNumber(allocationData[2]);
        const _cliff = new BigNumber(allocationData[3]);
        const _percent = new BigNumber(allocationData[4]);
        //deploy proxy contract per address        
        networkInUse = `${networkProvider}1`;
        addressInUse = connectionConfig.networks[networkInUse].wallet_address;
        addressPropsHolder = connectionConfig.networks[`${networkProvider}2`].wallet_address;
        
        const start = (timestamp) + duration.minutes(1);
        const cliffDuration = duration.days(_cliff);
        const vestingDuration = duration.days(_duration);
        const recovable = "false";
        const beneficiary = _address;

        const tokensToVest = _tokens.multipliedBy(_percent).dividedBy(100);
        const tokensToGrant = _tokens.minus(tokensToVest);

        const allocationOutput = {};
        allocationOutput.beneficiary = beneficiary;
        allocationOutput.start = start;
        allocationOutput.tokensToVest = tokensToVest; // .dividedBy(_tokensMultiplier).toString();
        allocationOutput.tokensToGrant = tokensToGrant; // .dividedBy(_tokensMultiplier).toString();
        allocationOutput.vestingDuration = _duration;
        allocationOutput.cliffDuration = _cliff;

        if (tokensToVest > 0) {
            cmd = `zos create TokenVesting -v --init initialize --args ${beneficiary},${start},${cliffDuration},${vestingDuration},${recovable},${addressInUse} --network ${networkInUse} --from ${addressInUse}`
            try {
                // create token vesting contract      
                console.log(`Executing ${cmd}`);  
                tokenVestingProxyContractAddress = execSync(cmd).toString().replace(/\n$/, '');                                
                allocationOutput.vestingContractAddress = tokenVestingProxyContractAddress;
                
                // whitelist the vesting contract
                console.log(`Issuing attribute for vesting contract ${tokenVestingProxyContractAddress}`);
                await jurisdictionContractInstance.methods.issueAttribute(
                    tokenVestingProxyContractAddress,
                    1,
                    0
                ).send({
                    from: validatorAddress,
                    gas: 6000000,
                    gasPrice: 10 ** 9,
                    nonce: getAndIncrementNonce(validatorAddress)
                }).then(function(receipt){                    
                    allocationOutput.validatedVestingContract = true;
                    allocationOutput.validationVestingTx = receipt.transactionHash;  
                    console.log(`Attribute set for vesting contract ${tokenVestingProxyContractAddress}`);
                  }).catch((error) => {        
                    console.log(`Error setting attribute for vesting contract ${tokenVestingProxyContractAddress}:${error}`);
                })                
                // transfer to vesting contract
                console.log(`Transferring ${tokensToVest.toString()} to vesting contract from ${tokenHolderAddress}`);
                await propsContractInstance.methods.transfer(
                    tokenVestingProxyContractAddress,
                    web3.utils.toWei(tokensToVest.toString())
                ).send({
                    from: tokenHolderAddress,
                    gas: 6000000,
                    gasPrice: 10 ** 9,
                    nonce: getAndIncrementNonce(tokenHolderAddress)
                }).then(function(receipt){                    
                    allocationOutput.vestingTransferTx = receipt.transactionHash;
                    console.log(`Transferred ${tokensToVest.toString()} to vesting contract from ${tokenHolderAddress} (tx=${receipt.transactionHash})`);
                    }).catch((error) => {        
                        console.log(`Error transferring ${tokensToVest.toString()} to vesting contract from ${tokenHolderAddress}:${error}`);
                })                   
            } catch (err) {
                console.warn(err);
            }            
        }
        
        // whitelist beneficianry
        console.log(`Issuing attribute for beneficiary ${beneficiary}`);
        await jurisdictionContractInstance.methods.issueAttribute(
            beneficiary,
            1,
            0
        ).send({
            from: validatorAddress,
            gas: 6000000,
            gasPrice: 10 ** 9,
            nonce: getAndIncrementNonce(validatorAddress)
        }).then(function(receipt){                    
            allocationOutput.validatedBeneficiary = true;
            allocationOutput.validatedBeneficiaryTx = receipt.transactionHash;                                            
            console.log(`Attribute set for beneficiary ${beneficiary}`);
            }).catch((error) => {
                console.log(`Error setting attribute for beneficiary ${beneficiary}:${error}`);            
        });        
        if (tokensToGrant > 0) {
            try {
                // transfer to beneficiary
                console.log(`Transferring ${tokensToGrant.toString()} to beneficiary ${beneficiary} from ${tokenHolderAddress}`);
                await propsContractInstance.methods.transfer(
                    beneficiary,
                    web3.utils.toWei(tokensToGrant.toString())
                ).send({
                    from: tokenHolderAddress,
                    gas: 6000000,
                    gasPrice: 10 ** 9,
                    nonce: getAndIncrementNonce(tokenHolderAddress)
                }).then(function(receipt){                    
                    allocationOutput.beneficiaryTransferTx = receipt.transactionHash; 
                    console.log(`Transferred ${tokensToGrant.toString()} to beneficiary ${beneficiary} from ${tokenHolderAddress} (tx=${receipt.transactionHash})`);                           
                }).catch((error) => {
                    console.log(`Error transferring ${tokensToGrant.toString()} to beneficiary ${beneficiary} from ${tokenHolderAddress}:${error}`);                    
                })                
            } catch (err) {
                console.warn(err);
            }                        
        }        
        console.log("Pushing into allocationData.allocations "+JSON.stringify(allocationOutput));
        allocationsData.allocations.push(allocationOutput);
    }

    fs.writeFile(
        allocationMetadataFilename,
        JSON.stringify(allocationsData),
        {flag: 'w'},
        err => {
          if (err) {
            console.error(err)
            process.exit(1)
          }
          console.log(`metadata written to ${allocationMetadataFilename}`)
          console.log(JSON.stringify(allocationsData, null, 2))      
          process.exit(0)
        }
      )
}

try {
    main();
} catch (err) {
    console.log(err);
}