import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

const contractEventCheckJson = {
  type: "contract_event_check",
  message0: "Contract %1 contains event %2 on Chain %3 ?",
  args0: [
    {
      type: "input_value",
      name: "CONTRACT_ADDRESS",
      check: "String", // Accepts a string block for the address
    },
    {
      type: "field_input",
      name: "EVENT_SIGNATURE",
      text: "Transfer(address,address,uint256)", // Example: ERC-20 Transfer event signature
    },
    {
      type: "input_value",
      name: "CHAIN_ID",
      check: "Number", // Accepts a number block for chain ID
    },
  ],
  inputsInline: true,
  output: "Boolean",
  colour: 260, // Matching contract action color
  tooltip:
    "Checks if a specific event has occurred on a contract within a recent block range.",
  helpUrl: "",
};

Blockly.Blocks["contract_event_check"] = {
  init: function () {
    this.jsonInit(contractEventCheckJson);
  },
};

export const contractEventCheckGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const contractAddress =
    javascriptGenerator.valueToCode(block, "CONTRACT_ADDRESS", Order.ATOMIC) ||
    "''";
  const eventSignature = block.getFieldValue("EVENT_SIGNATURE");
  const chainId =
    javascriptGenerator.valueToCode(block, "CHAIN_ID", Order.ATOMIC) || "1"; // Default to Ethereum Mainnet

  // In a real application, this would represent a call to an event listener or a blockchain query service.
  // The generated JS here is a placeholder for your backend to interpret.
  const json = JSON.stringify({
    condition_type: "contract_event",
    contract_address: contractAddress.replace(/'/g, ""), // Remove quotes for cleaner JSON
    event_signature: eventSignature,
    chain_id: chainId,
    // You might add more fields like 'from_block', 'to_block', 'filter_args'
  });
  return [`/* Check Contract Event: ${json} */ false`, Order.ATOMIC]; // Return false as a placeholder
};
