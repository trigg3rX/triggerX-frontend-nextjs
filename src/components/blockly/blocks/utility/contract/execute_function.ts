import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

/**
 * Execute Function Utility Block
 * Allows specifying a function to execute from a contract
 * Example: "Execute transfer from the contract 0x123..."
 */
const executeFunctionJson = {
  type: "execute_function",
  message0: "Execute %1",
  message1: "from the contract %1",
  args0: [
    {
      type: "field_input",
      name: "FUNCTION_NAME",
      text: "transfer",
    },
  ],
  args1: [
    {
      type: "field_input",
      name: "CONTRACT_ADDRESS",
      text: "0x...",
    },
  ],
  inputsInline: false,
  previousStatement: "ACTION",
  colour: 190,
  tooltip:
    "Specify the contract address and what function to be called to perform the job.",
  helpUrl: "",
};

Blockly.Blocks["execute_function"] = {
  init: function () {
    this.jsonInit(executeFunctionJson);
  },
};

export const executeFunctionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const functionName = block.getFieldValue("FUNCTION_NAME");
  const contractAddress = block.getFieldValue("CONTRACT_ADDRESS");

  const json = JSON.stringify({
    target_function: functionName,
    target_contract_address: contractAddress,
  });

  return [`// Execute Function: ${json}`, Order.NONE];
};

export default executeFunctionJson;
