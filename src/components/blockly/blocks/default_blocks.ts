// reviewed
import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// 1. Define the JSON structure for the Wallet Selection Block
const walletSelectionJson = {
  type: "wallet_selection",
  message0: "Wallet Address %1", // Reverting to original message
  args0: [
    {
      type: "field_input",
      name: "WALLET_ADDRESS",
      text: "0x...",
    },
  ],
  // "nextStatement": "wallet_init": We're introducing a connection type. This means only blocks that declare previousStatement: "wallet_init" can connect to it. This allows us to enforce the connection order with the chain_selection block.
  nextStatement: "wallet_init",
  colour: 65,
  tooltip:
    "Specifies the wallet address for the job. This must be the first block.",
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
  message0: "Chain ID %1",
  args0: [
    {
      type: "field_number",
      name: "CHAIN_ID",
      value: 1,
      min: 0,
      precision: 1,
    },
  ],
  previousStatement: "wallet_init", // ONLY accepts connections of type "wallet_init"
  nextStatement: null, // Can be connected to next block (other job configurations)
  colour: 65,
  tooltip:
    "Select the target blockchain ID for the job. Must follow a Wallet Address block.",
  helpUrl: "",
};

// 4. Register the Chain Selection Block using jsonInit
Blockly.Blocks["chain_selection"] = {
  init: function () {
    this.jsonInit(chainSelectionJson);
  },
};

export const walletSelectionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const walletAddress = block.getFieldValue("WALLET_ADDRESS");
  const json = JSON.stringify({ user_address: walletAddress });
  return [`// Wallet Address: ${json}`, Order.NONE];
};

export const chainSelectionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const chainId = block.getFieldValue("CHAIN_ID");
  const json = JSON.stringify({ target_chain_id: chainId });
  return [`// Chain ID: ${json}`, Order.NONE];
};
