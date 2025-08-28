### 📌 What the Flow Does

* **Connects to a Jetvision sensor** over a **TCP** port (e.g., 30002) to receive raw ADS-B flight data.
* **Processes data chunks** received from the TCP stream and converts them into complete JSON objects.
* **Initializes a Seller account** on Hedera for the Jetvision sensor, managing its identity and topics.
* **Publishes the data** as a stream to all connected buyers via the Neuron P2P network.
* **Translates the JSON data** into a format compatible with the `ui_worldmap` node.
* **Displays the real-time location** and details of aircraft on an interactive map in the Node-RED dashboard.

---

### ⚙️ Flow Components

* **🔹 TCP In**
    * Listens for incoming data from a specified **TCP host and port** (e.g., your Jetvision device).
    * Receives raw data streams, which are often broken into chunks.
* **🔹 Function Node ("convert tcp chunks to json objects")**
    * Buffers incoming TCP data.
    * Parses the buffered data to extract complete JSON objects.
    * This ensures that the `Neuron P2P` node receives a valid, complete message for each aircraft.
* **🔹 Seller Config**
    * Creates a unique **seller account** on Hedera for the Jetvision sensor.
    * Configures the device's role, name, and the smart contract it will use (`jetvision`).
* **🔹 Neuron P2P**
    * Receives the JSON flight data from the `TCP` stream.
    * Publishes this data to all subscribed buyers over the **Neuron peer-to-peer network**.
* **🔹 Function Node ("Translate to worldmap data format")**
    * Takes the parsed aircraft JSON object.
    * Translates it into a simple `lat`/`lon` format that the `ui_worldmap` node can understand.
* **🔹 UI Worldmap**
    * Visualizes the live flight data on a map in your Node-RED dashboard.
    * Displays aircraft as icons, with their callsigns and other details shown on hover.

---

### 🚀 How to Use

1.  Import this flow into your Neuron-Node-Builder environment.
2.  **Configure the TCP In node**: Double-click the **TCP In** node and enter the **IP address** and **port** of your Jetvision device.
3.  **Configure the Seller**: Double-click the **Jetvision seller config** node and enter your **device details** (e.g., name, price).
4.  **Link the P2P node**: Double-click the **Neuron P2P** node and select the **Jetvision seller config** from the list.
5.  **Deploy the flow**. The seller account will be created, and the system will begin receiving and broadcasting the live flight data.
6.  Open your dashboard to view the live aircraft on the map: `http://localhost:1880/worldmap/`.
7.  **Create a separate Buyer flow** to subscribe to this seller and process the data.

---

### 🧩 Example Use Case

This flow provides a complete, working example of a **real-time data seller**.
It's ideal for:
* Building a live, decentralized **flight tracking service**.
* Demonstrating how to monetize **physical IoT sensor data** on a global scale.
* Testing the end-to-end process of **data acquisition, normalization, and distribution** using the Neuron P2P framework.