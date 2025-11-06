import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import networksData from "@/utils/networks.json";

// Type for network object
interface Network {
  id: number;
  name: string;
  type: string;
}

// Available chain options from networks.json - dynamically loaded
const chainOptions = (
  networksData as { supportedNetworks: Network[] }
).supportedNetworks.map((network: Network) => [
  network.name,
  network.id.toString(),
]);

// 1. Define the JSON structure for the Wallet Selection Block
const walletSelectionJson = {
  type: "wallet_selection",
  message0: "🔗 Wallet Address %1", // Added icon and improved message
  args0: [
    {
      type: "field_input",
      name: "WALLET_ADDRESS",
      text: "0x...",
    },
  ],
  // Left-side output connection to suggest chain block connection
  output: "wallet_output",
  colour: "#F57F17", // Orange color for wallet
  tooltip:
    "Specify the Wallet Address with which you want to submit your Job. Connect the ChainId block to the right",
  helpUrl: "",
};

// 2. Register the Wallet Selection Block using jsonInit
Blockly.Blocks["wallet_selection"] = {
  init: function () {
    this.jsonInit(walletSelectionJson);
  },
};

// 3. Define the JSON structure for the Chain Selection Block
const chainSelectionJson = {
  type: "chain_selection",
  message0: "⛓️ Chain %1",
  args0: [
    {
      type: "field_dropdown",
      name: "CHAIN_ID",
      options: chainOptions,
    },
  ],
  // Input connection to receive wallet block output
  inputsInline: true,
  colour: "#1CD35F", // Green color for chain
  tooltip:
    "Select the target blockchain for the job. Connect to the Wallet Address block on the left.",
  helpUrl: "",
};

// 4. Register the Chain Selection Block using jsonInit
Blockly.Blocks["chain_selection"] = {
  init: function () {
    this.jsonInit(chainSelectionJson);
    // Add input connection to receive wallet block output
    this.appendValueInput("WALLET_INPUT")
      .setCheck("wallet_output")
      .appendField("from");
  },
};

export const walletSelectionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const walletAddress = block.getFieldValue("WALLET_ADDRESS");
  const json = JSON.stringify({ user_address: walletAddress });
  return [`// 🔗 Wallet Configuration: ${json}`, Order.NONE];
};

export const chainSelectionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const chainId = block.getFieldValue("CHAIN_ID");
  const json = JSON.stringify({ target_chain_id: chainId });
  return [`// ⛓️ Chain Configuration: ${json}`, Order.NONE];
};
