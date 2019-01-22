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

const timeStamp = () => {
  // Create a date object with the current time
  const now = new Date();
  // Create an array with the current month, day and time
  const date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
  // Create an array with the current hour, minute and second
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()];
  // Determine AM or PM suffix based on the hour
  const suffix = (time[0] < 12) ? 'AM' : 'PM';
  // Convert hour from military time
  time[0] = (time[0] < 12) ? time[0] : time[0] - 12;
  // If hour is 0, set it to 12
  time[0] = time[0] || 12;
  // If seconds and minutes are less than 10, add a zero
  for (let i = 1; i < 3; i += 1) {
    if (time[i] < 10) {
      time[i] = `0${time[i]}`;
    }
  }
  // Return the formatted string
  return `${date.join('/')} ${time.join(':')} ${suffix}`;
};

exports.gasLimit = gasLimit;
exports.gasPrice = gasPrice;
exports.duration = duration;
exports.getAndIncrementNonce = getAndIncrementNonce;
exports.timeStamp = timeStamp;
