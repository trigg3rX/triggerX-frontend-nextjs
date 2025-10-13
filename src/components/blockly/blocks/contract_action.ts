import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const contractActionJson = {
  type: "contract_action",
  message0: "Execute %1 on contract %2 (chain ID: %3)",
  args0: [
    {
      type: "field_input",
      name: "TARGET_FUNCTION",
      text: "transfer",
    },
    {
      type: "field_input",
      name: "TARGET_CONTRACT_ADDRESS",
      text: "0x...",
    },
    {
      type: "field_number",
      name: "TARGET_CHAIN_ID",
      value: 1,
      min: 0,
      precision: 1,
    },
  ],
  message1: "ABI (optional) %1",
  args1: [
    {
      type: "field_multilineinput",
      name: "ABI",
      text: "[]",
    },
  ],
  message2: "Arguments (JSON array) %1",
  args2: [
    {
      type: "field_multilineinput",
      name: "ARGUMENTS",
      text: "[]",
    },
  ],
  inputsInline: false,
  previousStatement: null,
  nextStatement: null,
  colour: 260,
  tooltip: "Define a smart contract function to execute as part of a job.",
  helpUrl: "",
};

Blockly.Blocks["contract_action"] = {
  init: function () {
    this.jsonInit(contractActionJson);
  },
};

export const contractActionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const targetContractAddress = block.getFieldValue("TARGET_CONTRACT_ADDRESS");
  const targetChainId = block.getFieldValue("TARGET_CHAIN_ID");
  const abi = block.getFieldValue("ABI") || "[]";
  const targetFunction = block.getFieldValue("TARGET_FUNCTION");
  const argumentsValue = block.getFieldValue("ARGUMENTS") || "[]";

  const jobData = {
    target_contract_address: targetContractAddress,
    abi: abi,
    target_function: targetFunction,
    arg_type: 0, // Static arguments
    arguments: JSON.parse(argumentsValue),
    target_chain_id: Number(targetChainId),
  };

  const json = JSON.stringify(jobData, null, 2);
  return [`// Contract Action: ${json}`, Order.NONE];
};
