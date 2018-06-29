const getTestPayload = require('./scripts').getTestPayload;

module.exports = async() => {
    try {
        //reverse to ignore filename, command name etc args
        let args = process.argv.reverse();
        args = args.slice(0, 7).reverse()  
        const [from, to, fee, amount, contractAddr, signingKey, nonce] = args;
        const paylod = getTestPayload(from, to, fee, amount, contractAddr, signingKey, nonce)
        console.dir(paylod, {depth: null, colors: true})
        
        // console.log("FIELDS \n\n\n\n")
        // console.log("SIGNER", owner)
        // console.log("SIG: ", sig)
        // console.log("SIG BUFF", ethUtil.toBuffer(sig))
        // console.log("to: ", to)
        // console.log("amount: ", amount)
        // console.log("fee: ", fee)
        // console.log("nonce: ", nonce)
        // console.log("token: ", "0xa9f8fef0b3df9159f1443427daa79210fceb009c")
        // console.log("alice: ", owner)
        // console.log("hash: ", ethUtil.bufferToHex(hash))
        // const pubkey = ethUtil.ecrecover(hash, vrs.v, vrs.r, vrs.s)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}
