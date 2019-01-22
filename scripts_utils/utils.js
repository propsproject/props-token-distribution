const gasPrice = () => 1 * (10 ** 9);
const gasLimit = (type) => {
  switch (type) {
    case 'attribute':
      return 60000;
    case 'transfer':
      return 70000;
    default:
      return 100000;
  }
};

const duration = {
  seconds(val) { return val; },
  minutes(val) { return val * this.seconds(60); },
  hours(val) { return val * this.minutes(60); },
  days(val) { return val * this.hours(24); },
  weeks(val) { return val * this.days(7); },
  years(val) { return val * this.days(365); },
};

// nonces is the global variable that holds the current nonces per address
const getAndIncrementNonce = (nonces, address) => {
  const nonce = nonces[address];
  // eslint-disable-next-line no-param-reassign
  nonces[address] += 1;
  console.log(`Got nonce ${nonce} for ${address} and incremented to ${nonces[address]}`);
  return nonce;
};

exports.gasLimit = gasLimit;
exports.gasPrice = gasPrice;
exports.duration = duration;
exports.getAndIncrementNonce = getAndIncrementNonce;
