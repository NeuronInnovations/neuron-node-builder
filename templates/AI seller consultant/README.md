This flow demonstrates how to configure an **AI model as a Seller** in the **Neuron-Node-Builder** ecosystem. It sets up an AI service that can receive questions from a buyer via the Neuron P2P network, process them with a large language model, and send the AI's response back to the buyer.

---

### 📌 What the Flow Does
* **Creates an AI seller node** on Hedera that can receive questions and broadcast answers.
* **Receives a buyer's question** through the `Neuron P2P` node.
* **Formats the question** and sends it to an external AI model (via OpenRouter).
* **Gets the response from the AI model** and broadcasts the answer back to the buyer through the `Neuron P2P` node.
* Provides a simple **Seller chat UI** in the dashboard to visualize the incoming questions and outgoing AI responses.
* Handles **error states** for messages that are not in the expected JSON format.

---

### ⚙️ Flow Components
* **🔹 Seller Config**
    * Creates a **seller account** on Hedera for the AI service.
    * Sets up the necessary messaging topics (`stdin`, `stdout`, `stderr`).
* **🔹 Neuron P2P**
    * The communication bridge that listens for incoming messages (questions) from buyers.
    * It also broadcasts the AI's responses back to the buyer.
* **🔹 Function Node ("Convert to JSON")**
    * Parses incoming messages from the network to ensure they are valid JSON.
    * If a message isn't valid JSON, it forwards it to an output that reports the error back to the buyer.
* **🔹 Function Node ("Extract buyer's question")**
    * Extracts the core question or text from the incoming JSON payload.
    * This prepares the message for the AI model.
* **🔹 AI Model**
    * A **connector node** to an external AI service. You must configure this with your API key.
* **🔹 AI Agent**
    * Manages the conversational logic and formats the AI's response.
    * It takes the buyer's question and sends it to the **AI Model** for a response.
* **🔹 Function Node ("UI formating")**
    * Prepares the AI's response for display in the chat UI.
* **🔹 UI Template ("Seller Chat UI")**
    * Provides a simple dashboard interface to monitor the questions and answers from the seller's perspective.

---

### 🚀 How to Use
1.  Import this flow into your Neuron-Node-Builder environment.
2.  **Configure the AI Model**: Double-click the **My AI Model** node and enter your **OpenRouter API key**. Select the AI model you want to use.
3.  **Deploy the flow**. This will create your AI seller account on Hedera.
4.  **Find the Seller's EVM address**: Double-click the **Consultant Seller Config** node and copy its **EVM Address**.
5.  **Set up a separate Buyer flow** (like the `AI Buyer` flow) and paste the AI Seller's EVM address into the `Buyer Config` node.
6.  **Ensure port forwarding is configured** for ports 61336–61346 to allow the P2P connection.
7.  Once the Buyer flow is deployed, any questions sent from the Buyer will be received by this flow, processed by the AI, and the response will be sent back.

---

### 🧩 Example Use Case
This flow is a great example of how to **create a monetized AI service**. It demonstrates the process of:
* Receiving a client's request (`msg.payload`).
* Processing it with an external service (the AI model).
* Sending the results back to the client, all within a decentralized P2P network.