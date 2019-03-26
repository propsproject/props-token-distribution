var fs = require('fs');
const csv = require('fast-csv');
let allocationData = require("../../output/allocation-round3-03262019-mainnet.json");
for(i in allocationData.allocations) {
    allocationData.allocations[i].distribution = "Mar26";
}
allocationData.allocations.unshift(allocationData.allocations.pop()); // hack to make first item have all columns
console.log(allocationData.allocations[0]);
let ws = fs.createWriteStream("output/allocation-round3-03262019-mainnet.csv");
csv
   .write(allocationData.allocations, {headers: true})
   .pipe(ws);