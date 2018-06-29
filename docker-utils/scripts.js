const ethUtil = require('ethereumjs-util')

const formattedAddress = (address) => {
    return Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
};
const formattedInt = (int) => {
    return ethUtil.setLengthLeft(int, 32);
};
const formattedBytes32 = (bytes) => {
    return ethUtil.addHexPrefix(bytes.toString('hex'));
};
const hashedTightPacked = (args) => {
    return ethUtil.sha3(Buffer.concat(args));
};

const getTestPayload = (from, to, fee, amount, contractAddr, signingKey, nonce) => {
    try {
        const fromPrivateKey = ethUtil.toBuffer(ethUtil.addHexPrefix(signingKey))
        const components = [
            ethUtil.toBuffer(ethUtil.addHexPrefix('48664c16')),
            formattedAddress(contractAddr),
            formattedAddress(to),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce)
        ];
        const hash = hashedTightPacked(components);
        const vrs = ethUtil.ecsign(hash, fromPrivateKey);
        const signature = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

        return {
            signature,
            to,
            amount,
            fee,
            nonce
        };


    } catch (error) {
        throw new Error(error)
    }
}

module.exports = {getTestPayload}