# Neuron SDK WebSocket Wrapper

A WebSocket wrapper for the Neuron SDK that enables easy integration with WebSocket clients and applications.

## Features

- WebSocket endpoints for buyer and seller nodes
- Real-time P2P message forwarding
- Internal command system for seller management
- Current peer status monitoring

## Developer preview quick run

0. Create a project structure like this:
```
myfolder/
├── neuron-go-hedera-sdk/    # Checkout destream branch
└── neuron-sdk-websocket-wrapper/  # Checkout main branch
```

1. Clone the repositories:
```bash
# Clone the SDK
git clone -b destream https://github.com/NeuronInnovations/neuron-go-hedera-sdk.git
# Clone the wrapper
git clone https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper.git
```

2. Configure the environment:
   - Delete the `.template` suffix from `.buyer-env` and `.seller-env`
   - Fill in the required fields in both files

3. Start the services:
```bash
# Start the seller
./integrationtests/start-seller.sh
# Start the buyer
./integrationtests/start-buyer.sh
```

4. Test the connection:
```bash
# Connect to seller WebSocket
wscat -c ws://localhost:3001/seller/p2p
# Connect to buyer WebSocket
wscat -c ws://localhost:3002/buyer/p2p
```

5. Send a test message:
```json
{
    "type": "p2p",
    "data": "Hello from other side",
    "timestamp": 1750079750546,
    "publicKey": "target_peer_public_key"  // Required when sending messages
}
```

## Building Release Binaries

To publish binaries for different macOS architectures you can use the helper script in `scripts/build-release.sh`.

### Prerequisites

- Go 1.23 or newer installed locally (or use a CI runner).
- Access to the private `github.com/NeuronInnovations` modules. When running in CI, export `GOPRIVATE=github.com/NeuronInnovations/*` and configure Git to use a personal access token:
  ```bash
  export GH_TOKEN="<personal access token with repo scope>"
  git config --global url."https://${GH_TOKEN}@github.com/".insteadOf "https://github.com/"
  ```

### Build macOS binaries (Intel + Apple Silicon)

```bash
cd neuron-sdk-websocket-wrapper
# Optional: customise GOCACHE/GOMODCACHE if required
GOCACHE=$(pwd)/.gocache GOMODCACHE=$(pwd)/.gomodcache ./scripts/build-release.sh
```

The script produces:

- `dist/neuron-wrapper-darwin64` and `dist/neuron-wrapper-darwin64.zip`
- `dist/neuron-wrapper-darwin-arm64` and `dist/neuron-wrapper-darwin-arm64.zip`
- SHA256 checksum files alongside each archive

The `.zip` artifacts can be uploaded directly to the GitHub release. The raw binaries remain in the same folder for local testing.

### Upload to a GitHub release

After running the script, attach the zipped artifacts to the desired release tag, for example using the CLI:

```bash
TAG=v1.0.3-split
cd dist
gh release upload ${TAG} \
  neuron-wrapper-darwin64.zip neuron-wrapper-darwin64.zip.sha256 \
  neuron-wrapper-darwin-arm64.zip neuron-wrapper-darwin-arm64.zip.sha256 \
  --repo NeuronInnovations/neuron-sdk-websocket-wrapper
```

Alternatively, drag-and-drop the `dist/*.zip` files on the GitHub release page.

---

## WebSocket Endpoints

### Buyer Endpoints
- **P2P Communication**: `ws://localhost:8080/buyer/p2p`
  - Purpose: Connect to buyer node for P2P communication with other peers
  - Messages: Forwarded to/from other peers in the network
  
- **Internal Commands**: `ws://localhost:8080/buyer/commands`
  - Purpose: Send internal commands to the buyer node itself
  - Messages: Processed locally, not forwarded to other peers

### Seller Endpoints
- **P2P Communication**: `ws://localhost:8080/seller/p2p`
  - Purpose: Connect to seller node for P2P communication
  
- **Internal Commands**: `ws://localhost:8080/seller/commands`
  - Purpose: Send internal commands to the seller node itself
  - Messages: Processed locally, not forwarded to other peers

## Message Types

### P2P Messages (buyer/p2p, seller/p2p)
- **Type**: `p2p`
- **Data**: Message content to send to a specific peer
- **PublicKey**: Target peer's public key (required)

### Internal Commands (buyer/commands and seller/commands)
These commands are processed locally by the node and do not get forwarded to other peers.

#### Show Current Peers (Buyers and Sellers)
- **Type**: `showCurrentPeers`
- **Data**: Empty string or any value (ignored)
- **Response**: Detailed list of currently connected peers with status information
- **Available for**: Both buyers and sellers
- **Response Format**:
```json
[
  {
    "publicKey": "02c7370bf416ee6e9f9a430a12869c456d93db6b7392a9f90d0db8981190f47153",
    "peerID": "QmPeerID...",
    "libP2PState": "Connected",
    "rendezvousState": "SendOK",
    "isOtherSideValidAccount": true,
    "noOfConnectionAttempts": 0,
    "lastConnectionAttempt": "2024-01-01T12:00:00Z",
    "nextScheduledConnectionAttempt": "2024-01-01T12:00:00Z",
    "lastGoodsReceivedTime": "2024-01-01T12:00:00Z",
    "lastOtherSideMultiAddress": "/ip4/192.168.1.1/tcp/8080",
    "connectionStatus": "Connected"
  }
]
```

**Connection Status Values:**
- `"Connected"`: Peer is actively connected and communicating
- `"Connecting"`: Currently attempting to establish connection
- `"Reconnecting"`: Attempting to reconnect after a disconnection
- `"Disconnected"`: Peer is not currently connected
- `"Error"`: Connection failed due to an error
- `"Unknown"`: Status cannot be determined

#### Replace Sellers (Buyers Only)
- **Type**: `replaceSellers`
- **Data**: JSON string containing seller public keys
- **Available for**: Buyers only (sellers will receive an error)
- **Format**:
```json
{
  "sellerPublicKeys": [
    "02c7370bf416ee6e9f9a430a12869c456d93db6b7392a9f90d0db8981190f47153",
    "02759b048e7ccf6ba68f9658105a4a139b5f9f5dfd451857c600cc28f33a1a99ae"
  ]
}
```

## Message Format

### Sending Messages
```json
{
    "type": "p2p",
    "data": "your message here",
    "timestamp": 1234567890,
    "publicKey": "target_peer_public_key"  // Required when sending messages
}
```

### Receiving Messages
```json
{
    "type": "p2p",
    "data": "received message",
    "timestamp": 1234567890,
    "publicKey": "sender_peer_public_key"  // Included in received messages
}
```

### Error Messages
```json
{
    "type": "error",
    "data": "error description",
    "timestamp": 1234567890,
    "error": "ERROR_CODE"
}
```

## Sending Messages

### Using wscat

For interactive WebSocket testing, you can use wscat:

```bash
# Install wscat
npm install -g wscat

# Connect to buyer P2P endpoint (port 3002)
wscat -c ws://localhost:3002/buyer/p2p

# Connect to seller P2P endpoint (port 3001)
wscat -c ws://localhost:3001/seller/p2p

# Once connected, send a message:
{
    "type": "p2p",
    "data": "Hello from wscat!",
    "timestamp": 1234567890,
    "publicKey": "target_peer_public_key"
}
```

### Using WebSocket Clients

You can use any WebSocket client to connect to these endpoints:

1. Configure your WebSocket client to connect to:
   - Buyer: `ws://localhost:8080/buyer/p2p`
   - Seller: `ws://localhost:8080/seller/p2p`
2. Set the message format to:
```json
{
    "type": "p2p",
    "data": "{{your message}}",
    "timestamp": {{$timestamp}},
    "publicKey": "{{target_peer_public_key}}"
}
```

## Development Guidelines

1. **Message Format**: Always use the specified JSON format
2. **Error Handling**: Implement proper error handling for all operations
3. **Logging**: Use appropriate logging levels for debugging
4. **Testing**: Test all endpoints before deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Prerequisites

- Go 1.16 or later
- WebSocket client or application
- A valid Hedera testnet account
- Access to the Neuron Network (registration, DID)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper.git
cd neuron-sdk-websocket-wrapper
```

2. Install dependencies:
```bash
go mod tidy
```

3. Build the project:
```bash
go build -o neuron-websocket-wrapper
```

## Configuration

Create two environment files:

1. `.seller-env` for the seller:
```properties
eth_rpc_url=https://testnet.hashio.io/api
hedera_evm_id=<your-evm-address>
hedera_id=<your-hedera-account-id>
location={"lat":<latitude>,"lon":<longitude>,"alt":0.000000}
mirror_api_url=https://testnet.mirrornode.hedera.com/api/v1
private_key=<your-private-key>
smart_contract_address=0x87e2fc64dc1eae07300c2fc50d6700549e1632ca
```

2. `.buyer-env` for the buyer:
```properties
eth_rpc_url=https://testnet.hashio.io/api
hedera_evm_id=<your-evm-address>
hedera_id=<your-hedera-account-id>
location={"lat":<latitude>,"lon":<longitude>,"alt":0.000000}
mirror_api_url=https://testnet.mirrornode.hedera.com/api/v1
private_key=<your-private-key>
smart_contract_address=0x87e2fc64dc1eae07300c2fc50d6700549e1632ca
list_of_sellers=<seller-public-key>
```

## Running the Service

### 1. Start the Seller

First, start the seller service:

```bash
./neuron-websocket-wrapper --mode=peer --buyer-or-seller=seller --envFile=.seller-env --port=20088
```

The seller will start listening for incoming connections and requests.

### 2. Start the Buyer

Then, start the buyer service:

```bash
./neuron-websocket-wrapper --mode=peer --buyer-or-seller=buyer --envFile=.buyer-env --port=30088 --list-of-sellers-source=env
```

The buyer will establish a connection with the seller and start the service.

### Smart Contract Address Configuration

The smart contract address can be configured in multiple ways:

**Using environment variable (recommended for most cases):**
```bash
# Set in .env file
smart_contract_address=0x1234567890123456789012345678901234567890

# Run normally
./neuron-websocket-wrapper --mode=peer --buyer-or-seller=buyer --envFile=.buyer-env
```

**Using command-line flag (overrides environment variable):**
```bash
./neuron-websocket-wrapper --mode=peer --buyer-or-seller=buyer --envFile=.buyer-env --smart-contract-address=0x1234567890123456789012345678901234567890
```

**Flag takes precedence over environment variable:**
```bash
# Even if .env has smart_contract_address=0x1111...
./neuron-websocket-wrapper --mode=peer --buyer-or-seller=buyer --envFile=.buyer-env --smart-contract-address=0x2222222222222222222222222222222222222222
# Uses 0x2222... (flag value)
```

## Usage Examples

### Using wscat (Command Line)

First, install wscat if you don't have it:
```bash
npm install -g wscat
```

#### Show Current Peers (Buyers and Sellers)

Note: this endpoint is not the `/p2p` endpoint. It's a `/comands` endpoints

```bash
# For buyers
echo '{"type":"showCurrentPeers","data":"","timestamp":1703123456789}' | wscat -c ws://localhost:8080/buyer/commands

# For sellers
echo '{"type":"showCurrentPeers","data":"","timestamp":1703123456789}' | wscat -c ws://localhost:8080/seller/commands
```

#### Replace Sellers (Buyers Only)
```bash
echo '{"type":"replaceSellers","data":"{\"sellerPublicKeys\":[\"02c7370bf416ee6e9f9a430a12869c456d93db6b7392a9f90d0db8981190f47153\",\"02759b048e7ccf6ba68f9658105a4a139b5f9f5dfd451857c600cc28f33a1a99ae\"]}","timestamp":1703123456789}' | wscat -c ws://localhost:8080/buyer/commands
```

#### Interactive Mode
You can also connect interactively and send multiple commands:
```bash
# Connect to buyer commands endpoint
wscat -c ws://localhost:8080/buyer/commands

# Then paste these messages one by one:
{"type":"showCurrentPeers","data":"","timestamp":1703123456789}
{"type":"replaceSellers","data":"{\"sellerPublicKeys\":[\"02c7370bf416ee6e9f9a430a12869c456d93db6b7392a9f90d0db8981190f47153\"]}","timestamp":1703123456789}

# Or connect to seller commands endpoint
wscat -c ws://localhost:8080/seller/commands

# Then paste this message:
{"type":"showCurrentPeers","data":"","timestamp":1703123456789}
```

## Response Format

All responses follow this format:
```json
{
    "type": "response_type",
    "data": "response_data",
    "timestamp": 1234567890123,
    "error": "error_message_if_any"
}
```

## Error Handling

The system returns structured error responses with:
- **PARSE_ERROR**: Invalid JSON format in request
- **NO_ADDRESSES**: Node has no reachable addresses
- **REPLACE_ERROR**: Error during seller replacement process
- **BUYER_ONLY_OPERATION**: Command is only available for buyers (e.g., replaceSellers from seller)
- **UNKNOWN_COMMAND**: Command type not recognized

## Testing

Run the test script to verify functionality:
```bash
node test_seller_replacement.js
```

## Architecture Notes

- **P2P Messages**: Use `/buyer/p2p` or `/seller/p2p` for peer-to-peer communication
- **Internal Commands**: Use `/buyer/commands` for node introspection and management
- **Separation**: Internal commands never get forwarded to other peers, ensuring clean separation of concerns

### JavaScript/Node.js
```javascript
const WebSocket = require('ws');

// Connect to buyer internal commands endpoint
const buyerWs = new WebSocket('ws://localhost:8080/buyer/commands');

// Show current peers (buyer)
buyerWs.send(JSON.stringify({
    type: 'showCurrentPeers',
    data: '',
    timestamp: Date.now()
}));

// Replace sellers (buyer only)
buyerWs.send(JSON.stringify({
    type: 'replaceSellers',
    data: JSON.stringify({
        sellerPublicKeys: ['02c7370bf416ee6e9f9a430a12869c456d93db6b7392a9f90d0db8981190f47153']
    }),
    timestamp: Date.now()
}));

// Connect to seller internal commands endpoint
const sellerWs = new WebSocket('ws://localhost:8080/seller/commands');

// Show current peers (seller)
sellerWs.send(JSON.stringify({
    type: 'showCurrentPeers',
    data: '',
    timestamp: Date.now()
}));

// Note: replaceSellers will return an error for sellers
```

### Python
```python
import websocket
import json
import time

# Connect to buyer internal commands endpoint
buyer_ws = websocket.create_connection("ws://localhost:8080/buyer/commands")

# Show current peers (buyer)
buyer_ws.send(json.dumps({
    "type": "showCurrentPeers",
    "data": "",
    "timestamp": int(time.time() * 1000)
}))

# Replace sellers (buyer only)
buyer_ws.send(json.dumps({
    "type": "replaceSellers",
    "data": json.dumps({
        "sellerPublicKeys": ["02c7370bf416ee6e9f9a430a12869c456d93db6b7392a9f90d0db8981190f47153"]
    }),
    "timestamp": int(time.time() * 1000)
}))

# Connect to seller internal commands endpoint
seller_ws = websocket.create_connection("ws://localhost:8080/seller/commands")

# Show current peers (seller)
seller_ws.send(json.dumps({
    "type": "showCurrentPeers",
    "data": "",
    "timestamp": int(time.time() * 1000)
}))

# Note: replaceSellers will return an error for sellers
```
