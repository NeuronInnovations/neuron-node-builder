#!/bin/zsh

# Kill any existing processes on seller's ports
kill $(lsof -t -i:3001) 2>/dev/null
kill $(lsof -t -i:1354) 2>/dev/null

echo "Starting seller..."
go run . --port=1654 --mode=peer --buyer-or-seller=seller --envFile=.seller-env --ws-port=3001 