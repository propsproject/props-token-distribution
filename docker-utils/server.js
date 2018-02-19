const express = require('express');
const fs = require('fs');
const bodyParser = require("body-parser");
const getTestPayload = require('./scripts').getTestPayload;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let tokenAddr;
fs.readFile('/tmp/token-address.json', (err, data) => {
    if (err) 
        throw new Error(err)
    tokenAddr = JSON.parse(data).address;
})

app.post('/delegatedtrans', (req, res) => {
    try {
        console.log(req.body.from, req.body.to, req.body.fee, req.body.amount, tokenAddr, req.body.key, req.body.nonce)
        const payload = getTestPayload(req.body.from, req.body.to, req.body.fee, req.body.amount, tokenAddr, req.body.key, req.body.nonce);
        res.status(200).json(payload);
    } catch (error) {
        console.log(error);
        res.status(500).json({error: "Something went wrong check logs"});
    }
})

app.listen(3000, () => {
    console.log('Express server listening on port 3000')
})