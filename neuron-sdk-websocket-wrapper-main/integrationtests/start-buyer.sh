#!/bin/zsh

# Kill any existing processes on buyer's ports
kill $(lsof -t -i:3002) 2>/dev/null
kill $(lsof -t -i:1355) 2>/dev/null

echo "Starting buyer..."
go run . --port=1251 --mode=peer --buyer-or-seller=buyer --list-of-sellers-source=env --envFile=.buyer-env  --ws-port=3002 n