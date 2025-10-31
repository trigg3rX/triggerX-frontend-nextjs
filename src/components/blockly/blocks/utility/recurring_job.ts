import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// JSON structure for the Recurring Job Block
const recurringJobJson = {
  type: "recurring_job",
  message0: "Recurring Job: %1",
  args0: [
    {
      type: "field_checkbox",
      name: "IS_RECURRING",
      checked: true, // Default to true for recurring
    },
  ],
  previousStatement: null, // This block can be placed anywhere that accepts a statement.
  nextStatement: null, // This block can connect to other blocks.
  colour: 260, // Using the Utility category colour
  tooltip: "Specifies if the job should be a recurring job.",
  helpUrl: "",
};

// Register the Recurring Job Block
Blockly.Blocks["recurring_job"] = {
  init: function () {
    this.jsonInit(recurringJobJson);
  },
};

// JavaScript generator for the Recurring Job Block
export const recurringJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const isRecurring = block.getFieldValue("IS_RECURRING") === "TRUE";
  const json = JSON.stringify({ recurring: isRecurring });
  return [`// Recurring Job: ${json}`, Order.NONE];
};
