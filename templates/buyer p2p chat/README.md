This flow demonstrates how to configure a Buyer Node to participate in a P2P chat application built with the Neuron-Node-Builder ecosystem. It establishes a secure, direct connection to a seller (by their EVM address) and allows the buyer to send and receive messages in real time.

📌 What the Flow Does
Initializes a Buyer Config node that automatically creates a Hedera account and messaging topics (stdin, stdout, stderr) for the buyer.

Connects to a specific seller (identified by their EVM address) via the Neuron P2P network.

Enables two-way communication, allowing you to send messages to the seller and receive their responses.

Provides a custom chat UI in the Node-RED dashboard for a user-friendly conversational experience.

Displays all incoming and outgoing data in the Debug panel for monitoring.

Requires port forwarding to allow the peer-to-peer connection.

⚙️ Flow Components
🔹 Buyer Config

Creates a buyer account on Hedera.

Manages the list of sellers to connect to by their EVM addresses.

Sets up Hedera topics for messaging, preparing the buyer to send messages and receive data streams.

🔹 UI Template (Buyer Chat UI)

Provides an interactive chat interface in the Node-RED dashboard.

Sends messages from the UI into the Neuron network and displays incoming messages from the seller.

🔹 Neuron P2P

Establishes a secure, direct peer-to-peer connection with the listed sellers.

It sends messages/data from the buyer to the seller and receives messages from the seller.

🔹 Debug Node

Prints all messages received from the seller into the editor's sidebar.

🚀 How to Use
Import this flow into your Neuron-Node-Builder environment.

Deploy the flow to initialize the Buyer account.

Find the Seller's EVM address: You'll need the EVM address from a deployed Seller chat flow. Copy it.

Configure the Buyer: Double-click the Buyer p2p chat config node, click the add button, and paste the Seller's EVM address you just copied.

Open the Neuron P2P node and select the Buyer p2p chat config to link them.

Configure your router for port forwarding (61336–61346) to allow connections to the seller.

Deploy the flow again to save the changes.

Go to the Node-RED dashboard and begin typing in the chat box to send messages to the seller.

🧩 Example Use Case
This flow provides a complete example of a decentralized chat client. It is ideal for:

Testing connectivity with a Neuron P2P seller node.

Prototyping secure, peer-to-peer messaging applications.

Demonstrating the buyer-side functionality of a decentralized application.