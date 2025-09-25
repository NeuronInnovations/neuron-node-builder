This flow demonstrates how to configure a Buyer Node to purchase and visualize Jetvision ADS-B flight data from a seller. It establishes a direct, secure connection with a Jetvision seller (by its EVM address) and displays the live aircraft data on a world map in the Node-RED dashboard.

📌 What the Flow Does
Initializes a Buyer Config node that automatically creates a Hedera account and messaging topics (stdin, stdout, stderr) for the buyer.

Connects to one or more Jetvision sellers using their EVM addresses via the Neuron P2P network.

Receives streamed flight data from the connected sellers.

Processes the incoming JSON data and transforms it into a format suitable for the ui_worldmap node.

Displays the live location and details of aircraft on an interactive world map.

Requires port forwarding to allow the peer-to-peer connections.

⚙️ Flow Components
🔹 Buyer Config

Creates a buyer account on Hedera.

Manages the list of sellers to connect to by their EVM addresses.

Sets up Hedera topics for messaging.

🔹 Neuron P2P

Establishes a secure, direct peer-to-peer connection with the listed sellers.

Receives real-time messages and data streams from the connected sellers.

🔹 Function Node ("Translate to worldmap data format")

Parses the incoming JSON payload from the seller.

Transforms the data into the simple lat/lon format required by the ui_worldmap node.

Adds additional metadata like icon type and size, flight callsign, and bearing.

🔹 UI Worldmap

Visualizes the live flight data on a map in your Node-RED dashboard.

Displays aircraft as icons, with their callsigns and other details shown on hover.

🚀 How to Use
Import this flow into your Neuron-Node-Builder environment.

Deploy the flow to initialize the Buyer account.

Find the Seller's EVM address: You need the EVM address from a deployed Jetvision Seller flow (like the "Jetvision seller simulator"). Copy it.

Configure the Buyer: Double-click the Jetvision Buyer Config node, click the add button, and paste the Seller's EVM address.

Open the Neuron P2P node and select the Jetvision Buyer Config.

Configure your router for port forwarding (61336–61346) to allow connections to the seller.

Deploy the flow again to save the changes.

Go to the Node-RED dashboard at http://localhost:1880/worldmap/ to see the live flight data on the map.

🧩 Example Use Case
This flow demonstrates how to act as a data buyer in a decentralized data marketplace. It's ideal for:

Subscribing to and consuming live data from a Neuron P2P seller.

Validating a seller's data stream and visualizing it in a user-friendly way.

Building a decentralized flight tracking application that is not dependent on a central server.