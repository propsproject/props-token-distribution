module.exports = {
    port: 8555,
    testrpcOptions: '-p 8555 -m "asset member awake bring mosquito lab sustain muscle elephant equip someone obvious"',
    testCommand: 'NODE_ENV=test truffle test ./test/propstoken.test.js --network coverage',
    // norpc: true,
    // dir: './secretDirectory',
    // copyPackages: ['zeppelin-solidity'],
    skipFiles: ['TokenVesting.sol']
};