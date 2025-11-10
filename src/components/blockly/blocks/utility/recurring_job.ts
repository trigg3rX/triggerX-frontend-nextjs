import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// JSON structure for the Recurring Job Block
// Note: This block is intended for use with condition-based or event-based jobs
const recurringJobJson = {
  type: "recurring_job",
  message0: "keep the job recurring %1",
  args0: [
    {
      type: "field_checkbox",
      name: "IS_RECURRING",
      checked: true, // Default to true for recurring
    },
  ],
  previousStatement: null, // This block can be placed anywhere that accepts a statement.
  nextStatement: null, // This block can connect to other blocks.
  colour: 30, // Using the same color as other time/schedule blocks
  tooltip:
    "Specify if you want your job to recur every time the event is detected or the condition is satisfied",
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
