This flow demonstrates how to configure a **Seller Node** for a **P2P chat application** in the **Neuron-Node-Builder** ecosystem. When deployed, it acts as a server, waiting for buyers to connect and exchange messages directly through the Neuron P2P network.

---

### 📌 What the Flow Does

* **Initializes a Seller Config node** that automatically creates a Hedera account and messaging topics (`stdin`, `stdout`, `stderr`) for the seller.
* **Sets up the Seller's identity** and binds it to a specific smart contract for the chat application.
* **Establishes a Neuron P2P** connection, which listens for incoming peer-to-peer messages from buyers.
* **Provides a custom chat UI** in the Node-RED dashboard to view all incoming messages from connected buyers in real time.
* **Displays all incoming data streams** from buyers in the Debug panel for monitoring.
* **Requires port forwarding** to allow peer-to-peer connections from external clients.

---

### ⚙️ Flow Components

* **🔹 Seller Config**
    * Creates a **seller account** on Hedera.
    * Manages the device's role, name, and smart contract binding.
    * Sets up Hedera topics for messaging, preparing the seller to receive buyer data streams.
* **🔹 Neuron P2P**
    * Establishes secure, direct peer-to-peer connections.
    * Receives messages/data directly from connected buyers.
    * Wires received data into the debug panel and the custom chat UI for inspection.
* **🔹 UI Template (Seller Chat UI)**
    * Provides a simple chat interface in the dashboard.
    * Displays incoming messages from connected buyers.
* **🔹 Debug Node**
    * Prints **all messages received from buyers** into the editor's sidebar.

---

### 🚀 How to Use

1.  Import this flow into Neuron-Node-Builder.
2.  Open the **Seller Config** node and provide a **Device Role**, **Device Name**, etc.
3.  Open the **Neuron P2P** node and select the **Chat Seller Config** from the dropdown menu to link it.
4.  Configure your router for **port forwarding (61336–61346)** to allow buyers to connect.
5.  **Deploy the flow**. This will create the seller account and make it ready to receive connections.
6.  To test the flow, you will need to **set up a separate Buyer flow**, and configure it to connect to this seller by using this seller's EVM address.

---

### 🧩 Example Use Case

This flow allows you to act as a **data seller** in a decentralized chat marketplace.
It's ideal for:
* **Hosting a P2P service** that can be subscribed to by multiple buyers.
* Demonstrating how a seller can receive and process data requests from a decentralized network.
* Verifying peer-to-peer data delivery from the seller's perspective.