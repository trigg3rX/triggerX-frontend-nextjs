import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const eventListenerJson = {
  type: "event_listener",
  message0: "Listen for %1 on contract %2",
  args0: [
    {
      type: "field_input",
      name: "EVENT_NAME",
      text: "Transfer",
    },
    {
      type: "field_input",
      name: "CONTRACT_ADDRESS",
      text: "0x...",
    },
  ],
  message1: "then execute %1",
  args1: [
    {
      type: "input_statement",
      name: "ACTION",
      check: "ACTION",
    },
  ],
  previousStatement: "EVENT_CONFIG",
  nextStatement: "UTILITY_END",
  colour: 220, // Using the same color as other event/schedule blocks
  tooltip:
    "Specify the event that needs to be detected on-chain and the contract address. Then connect a contract action to execute.",
  helpUrl: "",
};

Blockly.Blocks["event_listener"] = {
  init: function () {
    this.jsonInit(eventListenerJson);
  },
};

export const eventListenerGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const eventName = block.getFieldValue("EVENT_NAME");
  const contractAddress = block.getFieldValue("CONTRACT_ADDRESS");

  const json = JSON.stringify({
    trigger_event: eventName,
    trigger_contract_address: contractAddress,
  });

  return [`// Event Listener: ${json}`, Order.NONE];
};

export default eventListenerJson;
