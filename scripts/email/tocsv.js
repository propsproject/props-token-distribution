var fs = require('fs');
const csv = require('fast-csv');
let allocationData = require("../../output/allocation-04082019-1200pm-mainnet.json");
for(i in allocationData.allocations) {
    allocationData.allocations[i].distribution = "Mar26";
}
allocationData.allocations.unshift(allocationData.allocations.pop()); // hack to make first item have all columns
allocationData.allocations.unshift(allocationData.allocations.pop()); // hack to make first item have all columns
console.log(allocationData.allocations[0]);
let ws = fs.createWriteStream("output/allocation-04082019-1200pm-mainnet.csv");
csv
   .write(allocationData.allocations, {headers: true})
   .pipe(ws);