var fs = require('fs');
const csv = require('fast-csv');
let allocationData = require("../../output/allocation-1000am-Mar11-mainnet.json");
for(i in allocationData.allocations) {
    allocationData.allocations[i].distribution = "Mar11";
}
console.log(allocationData.allocations[0]);
let ws = fs.createWriteStream("output/allocation-1000am-Mar11-mainnet.csv");
csv
   .write(allocationData.allocations, {headers: true})
   .pipe(ws);