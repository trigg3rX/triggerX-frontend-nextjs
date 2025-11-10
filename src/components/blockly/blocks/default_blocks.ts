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

// Shared tooltip message when both blocks are connected
const CONNECTED_TOOLTIP =
  "Make sure the Job Contract is deployed on the here-specified chain and the wallet address is correct.";

// 1. Define the JSON structure for the Wallet Selection Block
const walletSelectionJson = {
  type: "wallet_selection",
  message0: "Wallet Address %1", // Added icon and improved message
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
    "Specify the Wallet Address with which you want to submit your Job. Connect the ChainId block to the left.",
  helpUrl: "",
};

// 2. Register the Wallet Selection Block using jsonInit
Blockly.Blocks["wallet_selection"] = {
  init: function () {
    this.jsonInit(walletSelectionJson);
    // Set dynamic tooltip
    this.setTooltip(() => {
      const parentBlock = this.getParent();
      if (parentBlock && parentBlock.type === "chain_selection") {
        return CONNECTED_TOOLTIP;
      }
      return "Specify the Wallet Address with which you want to submit your Job. Connect to the Chain block on the left.";
    });
  },
};

// 3. Define the JSON structure for the Chain Selection Block
const chainSelectionJson = {
  type: "chain_selection",
  message0: "Chain %1",
  args0: [
    {
      type: "field_dropdown",
      name: "CHAIN_ID",
      options: chainOptions,
    },
  ],
  // Input connection to receive wallet block output
  inputsInline: true,
  nextStatement: "JOB_TYPE", // Only job type wrappers can connect below
  colour: "#1CD35F", // Green color for chain
  tooltip:
    "Specify the chain at which your job contract is deployed. Connect the Wallet block to its right.",
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

    // Set dynamic tooltip
    this.setTooltip(() => {
      const walletInput = this.getInputTargetBlock("WALLET_INPUT");
      if (walletInput && walletInput.type === "wallet_selection") {
        return CONNECTED_TOOLTIP;
      }
      return "Specify the chain at which your job contract is deployed. Connect the Wallet block to its right.";
    });
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
