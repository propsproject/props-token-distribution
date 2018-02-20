# docker-utils

## Overview
This directory contains helper scripts for running a ganache-cli instance with the PropsToken deployed for functional testing. 
The basic workflow for testing is as follows. 

- Build docker container 
- Run docker container
    - run ganache-cli passing 3 private keys as arguments to create accounts. This allows us to use same private keys across test
    - deploy token contract
        - mint some tokens for the first private key argument passed to docker run command 
    - write token address to a file in /tmp/token-address.json . This will allow use to serve an express server that can return us the token address programmatically. 
    - start express server that will serve up endpoint for generating proper payload request for delegated transfer function
- In your test: hit docker container endpoint to get proper payload for delegated transfer
- User that payload to test the delegated transfer method from your modules

This tool can be extended to other methods also

### Usage 
The main script used is run.sh which is the entrypoint for the Dockerfile. It takes 3 private keys as arguments, make sure they have the 0x hex prefix. 
Now when ganache-cli runs on port 9000 and networkid 8000 it will create 3 accounts from the 3 private keys and allocated an enormous amount of either for both. 
After, truffle exec is ran on the deploy.js script which will deploy the PropsToken and mint some tokens for testing for the account at index 0 (first private key argument provided). This is your owner of the contract and all these initially minted tokens. Now in your test you can send tokens from this owner account. 

#### Running Without docker 

```sh
$ ./run.sh 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f 0x0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1
```

#### Running Without docker
```sh
$ docker build -t props-token-test-env .
$ docker run -p 8545:8545 -p 3000:3000 props-token-test-env 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f 0x0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1
```


### Delegated Transfer Utils
This is a script that will take your sender, recipient, and signing key and produce a properly formatted http request payload for the 
[props-transaction-service](https://github.com/PROPSProject/props-transaction-service/blob/delegated-transfer/http/routing/v1/delegated_transfer.go) /v1/token/transfer endpoint 
Use truffle exec to execute the script.

truffle exec payload.js senderAddress recipientAddress fee amount contractAddress signingKey nonce
```sh
$ truffle exec payload.js 0xf17f52151EbEF6C7334FAD080c5704D77216b732 0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef 400 4000 0xa9f8fef0b3df9159f1443427daa79210fceb009c ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f 4
```

### Here are some valid address-privatekey combinations
                    Address                                             Private Key
- 0x627306090abaB3A6e1400e9345bC60c78a8BEf57 c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
- 0xf17f52151EbEF6C7334FAD080c5704D77216b732 ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f
- 0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef 0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1

### Example request to /delegatedtrans endpoint on the docker container 

```json
{
	"from": "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
	"to": "0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef",
	"fee": 400,
	"amount": 4000, 
	"key": "ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
	"nonce": 4
}
```
