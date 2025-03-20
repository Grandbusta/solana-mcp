#!/bin/zsh

if [ -z "$1" ]; then
    echo "Error: Keypair path argument is required"
    exit 1
fi

export KEYPAIR_PATH=$1
export RPC_URL="api.devnet.solana.com"
node "$(dirname "$0")/dist/index.js"