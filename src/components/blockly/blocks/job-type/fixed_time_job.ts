import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// Fixed Time Job Block
const fixedTimeJobJson = {
  type: "fixed_time_job",
  message0: "Run once at %1",
  args0: [
    {
      type: "field_input",
      name: "SCHEDULE_TIME",
      text: "YYYY-MM-DD HH:MM:SS", // Example format
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 210, // A distinct color for scheduling blocks
  tooltip:
    "Schedule a job to run once at a specific date and time (e.g., 2023-10-27 14:30:00).",
  helpUrl: "",
};

Blockly.Blocks["fixed_time_job"] = {
  init: function () {
    this.jsonInit(fixedTimeJobJson);
  },
};

export const fixedTimeJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const scheduleTime = block.getFieldValue("SCHEDULE_TIME");
  const json = JSON.stringify({
    schedule_type: "specific",
    specific_schedule: scheduleTime,
  });
  return [`// Fixed Time Job: ${json}`, Order.NONE];
};
