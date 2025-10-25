import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// Import the custom fields to ensure they are registered
import "../../fields/DatePickerField";
import "../../fields/TimePickerField";

// Fixed Time Job Block - Wrapper for containing other blocks
const fixedTimeJobJson = {
  type: "fixed_time_job",
  message0: "Runs once on %1 at %2",
  message1: "Execute: %1",
  args0: [
    {
      type: "field_date_picker",
      name: "SCHEDULE_DATE",
      text: "2024-01-01",
    },
    {
      type: "field_time_picker",
      name: "SCHEDULE_TIME",
      text: "12:00",
    },
  ],
  args1: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: null, // Allow any block type inside
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 210, // A distinct color for scheduling blocks
  tooltip:
    "Schedule a job to run once at a specific date and time. Select the date and time when the job should execute. Drag other blocks inside to define what the job should do.",
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
  const scheduleDate = block.getFieldValue("SCHEDULE_DATE");
  const scheduleTime = block.getFieldValue("SCHEDULE_TIME");

  // Combine date and time into a single datetime string
  const dateTime = `${scheduleDate}T${scheduleTime}`;

  const json = JSON.stringify({
    schedule_type: "specific",
    specific_schedule: dateTime,
    local_schedule: dateTime,
  });
  return [`// Fixed Time Job: ${json}`, Order.NONE];
};
