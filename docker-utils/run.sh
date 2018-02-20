#!/bin/bash

errNumArgs="Illegal number of arguments. Please provide 3 different accounts private keys"
if [ "$#" -ne 3 ]; then
    echo $errNumArgs
    exit 1
fi

ganachePID=$(ps aux | pgrep 'ganache-cli -p 8545' | awk '{print $2}')
if [[ $ganachePID ]]; then
    kill $ganachePID
fi

# parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
# cd "$parent_path"

owner=$1
sender=$2
recipient=$3
balance=$(( 10 ** 20 ))
forever start --workingDir . --silent -l ./forever.ganache.log -o ./std.ganache.log -e ./sterr.ganache.log /usr/local/bin/ganache-cli -i 8000 --network docker --account="$owner, $balance" --account="$sender, $balance" --account="$recipient, $balance" 
truffle exec ./deploy.js --network docker 
node ./server.js 
# forever start --workingDir . -l ./forever.express.log -o ./std.express.log -e ./sterr.express.log ./server.js 
