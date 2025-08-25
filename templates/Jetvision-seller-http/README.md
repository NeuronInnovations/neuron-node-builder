### Description
This flow demonstrates how to configure a **Jetvision ADS-B sensor** as a **Seller** in the **Neuron P2P** network. It uses a custom subflow to poll a physical Jetvision device, normalize the live flight data, and broadcast it to any connected buyers through the Neuron P2P network.

---

### 📌 What the Flow Does

* **Automatically polls** a Jetvision AirSquitter or Radarcape device at a configurable IP address and interval.
* **Normalizes the raw JSON data** from the device into a clean, consistent data schema.
* **Publishes the data** as a stream to all connected buyers via the **Neuron P2P network**.
* **Initializes a Seller account** on Hedera for the Jetvision sensor, managing its identity, topics, and smart contract binding.
* Only emits a new message when the data from the sensor has **changed**.

---

### ⚙️ Flow Components

* **🔹 Jetvision Sensor (Subflow)**
    * This is a reusable component that handles the polling of the external Jetvision device.
    * It includes an **HTTP Request** node to fetch `aircraftlist.json` from the sensor's IP address.
    * A **Function node** normalizes the JSON data and performs **change detection** to prevent redundant messages.
    * The subflow is configured with `sensorIP` and `intervalSecs` variables.
* **🔹 Seller Config**
    * Creates a unique **seller account** on Hedera for the Jetvision sensor.
    * Sets up the necessary messaging topics and binds the device to a `jetvision` smart contract.
* **🔹 Neuron P2P**
    * The communication bridge that connects the seller (the Jetvision sensor) to any interested buyers.
    * It receives the normalized flight data from the **Jetvision Sensor** subflow and broadcasts it securely to all subscribed peers.

---

### 🚀 How to Use

1.  Import this flow and the included **Jetvision Sensor** subflow into your Neuron-Node-builder environment.
2.  **Configure the subflow**: Double-click the **Jetvision Sensor** node. In the "Environment" tab, set the `sensorIP` to the IP address of your physical Jetvision device.
3.  **Configure the Seller**: Double-click the **Seller Config** node and provide a **Device Role**, **Device Name**, and set a **Price** for the data.
4.  **Link the P2P node**: Double-click the **Neuron P2P** node and select your **Seller Config** from the dropdown menu.
5.  **Deploy the flow**. The seller account will be created, and the system will begin polling your Jetvision device and broadcasting the data.
6.  **Create a separate Buyer flow** to subscribe to this seller and begin receiving the flight data.

---

### 🧩 Example Use Case

This flow is an excellent example of **tokenizing physical sensor data** and making it available for sale on a decentralized marketplace.
It's ideal for:
* Selling access to real-world data feeds like **ADS-B flight tracking**.
* Demonstrating the **Neuron P2P framework's** ability to handle streaming data from physical IoT devices.
* Prototyping a real-world **IoT data marketplace** with a clear Seller/Buyer model.