var fs = require('fs');
var array = fs.readFileSync(process.argv[2]).toString().split("\n");
let start; let vest; let part; let contract; let tokens; let contractAddress; let missing = 0; let failed = 0; let badline;
let data = {
    "vest": Array(),
    "novest": Array()
};
for(i in array) {
    let line = array[i].split('Working on row - ')[1];
    if(line) {
        part = line.split('timepassed=')[1].split(')');
        if(i>1) {
            data[vest].push(part[0]-start)
            if(vest==='vest' && !contractAddress) {
                failed++;
                console.log(failed, line.split('timepassed=')[0].split(' ')[0],tokens);
                missing += tokens;
                //console.log(badline);
            }
            contractAddress = false;
        }
        multiplier = part[1].split(',')[4]/100;
        tokens = part[1].split(',')[1] * multiplier;
        badline = line;
        start = part[0];
        vest = part[1].split(',')[4]>0 ? 'vest' : 'novest';
    }
    contract = array[i].split('Instance created at ')[1];
    if(contract) {
        contractAddress = contract;
    }
}

let average = (array) => array.reduce((a, b) => a + b) / array.length;
let averageVest = average(data.vest);
let averageNoVest = average(data.novest);
let totalTime = (averageVest * 354) + (averageNoVest * 182)
let totalHours = totalTime / 3600;
console.log('Hours',totalHours);
console.log('Vest',data.vest.length);
console.log('No Vest',data.novest.length);
console.log('Total Failed',failed);
console.log('Missing Tokens',missing);