import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

interface EventJobData {
  trigger_chain_id: number;
  trigger_contract_address: string;
  trigger_event: string;
  event_filter_para_name?: string;
  event_filter_value?: string;
}

const eventJobJson = {
  type: "event_job",
  message0:
    "On chain ID %1 event %2 from contract %3 %4 with parameter %5 value %6",
  args0: [
    {
      type: "field_number",
      name: "TRIGGER_CHAIN_ID",
      value: 1, // Default chain ID
      min: 0,
      precision: 1,
    },
    {
      type: "field_input",
      name: "TRIGGER_EVENT",
      text: "Transfer", // Example: ERC-20 Transfer event
    },
    {
      type: "field_input",
      name: "TRIGGER_CONTRACT_ADDRESS",
      text: "0x...", // Default: empty address
    },
    {
      type: "input_dummy", // For formatting spacing
      name: "EVENT_FILTER_SPACER",
    },
    {
      type: "field_input",
      name: "EVENT_FILTER_PARA_NAME",
      text: "optional_param_name", // Default optional
    },
    {
      type: "field_input",
      name: "EVENT_FILTER_VALUE",
      text: "optional_param_value", // Default optional
    },
  ],
  inputsInline: false, // Keep inputs stacked for readability
  previousStatement: null,
  nextStatement: null,
  colour: 210,
  tooltip:
    "Trigger a job when a specific event is emitted from a smart contract on a given chain, with optional parameter filtering.",
  helpUrl: "",
};

Blockly.Blocks["event_job"] = {
  init: function () {
    this.jsonInit(eventJobJson);
  },
};

export const eventJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const triggerChainId = block.getFieldValue("TRIGGER_CHAIN_ID");
  const triggerEvent = block.getFieldValue("TRIGGER_EVENT");
  const triggerContractAddress = block.getFieldValue(
    "TRIGGER_CONTRACT_ADDRESS",
  );
  const eventFilterParaName = block.getFieldValue("EVENT_FILTER_PARA_NAME");
  const eventFilterValue = block.getFieldValue("EVENT_FILTER_VALUE");

  const jobData: EventJobData = {
    trigger_chain_id: triggerChainId,
    trigger_contract_address: triggerContractAddress,
    trigger_event: triggerEvent,
  };

  // Only include filter parameters if they are not their default "optional" text
  if (
    eventFilterParaName !== "optional_param_name" &&
    eventFilterValue !== "optional_param_value"
  ) {
    jobData.event_filter_para_name = eventFilterParaName;
    jobData.event_filter_value = eventFilterValue;
  }

  const json = JSON.stringify(jobData);
  return [`// Event Job: ${json}`, Order.NONE];
};
