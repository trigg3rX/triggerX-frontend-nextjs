import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
// Ensure custom fields are registered for date/time picking
import "../../fields/DatePickerField";
import "../../fields/TimePickerField";

const intervalTimeJobJson = {
  type: "interval_time_job",
  // Split long content into multiple rows to reduce overall width
  message0: "Run every %1 %2",
  message1: "until %1 %2",
  message2: "execute: %1",
  args0: [
    {
      type: "field_number",
      name: "TIME_INTERVAL_VALUE",
      value: 60, // Default to 60 units
      min: 1,
      precision: 1,
    },
    {
      type: "field_dropdown",
      name: "TIME_INTERVAL_UNIT",
      options: [
        ["seconds", "second"],
        ["minutes", "minute"],
        ["hours", "hour"],
      ],
    },
  ],
  args1: [
    {
      type: "field_date_picker",
      name: "UNTIL_DATE",
      text: "2024-01-01",
    },
    {
      type: "field_time_picker",
      name: "UNTIL_TIME",
      text: "12:00",
    },
  ],
  args2: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: null, // Allow any block type inside
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 210,
  tooltip:
    "Schedule a job to run repeatedly at a set interval until a specific date and time. Drag other blocks inside to define what the job should do.",
  helpUrl: "",
};

Blockly.Blocks["interval_time_job"] = {
  init: function () {
    this.jsonInit(intervalTimeJobJson);
  },
};

export const intervalTimeJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const intervalValue = block.getFieldValue("TIME_INTERVAL_VALUE");
  const intervalUnit = block.getFieldValue("TIME_INTERVAL_UNIT"); // 'second', 'minute', 'hour'
  const untilDate = block.getFieldValue("UNTIL_DATE");
  const untilTime = block.getFieldValue("UNTIL_TIME");

  let timeIntervalInSeconds = 0;
  if (intervalUnit === "second") {
    timeIntervalInSeconds = intervalValue;
  } else if (intervalUnit === "minute") {
    timeIntervalInSeconds = intervalValue * 60;
  } else if (intervalUnit === "hour") {
    timeIntervalInSeconds = intervalValue * 3600;
  }

  // Combine date and time into a single datetime string if provided
  const untilDateTime =
    untilDate && untilTime ? `${untilDate}T${untilTime}` : undefined;

  const json = JSON.stringify({
    schedule_type: "interval",
    time_interval: timeIntervalInSeconds, // Value in seconds
    end_schedule: untilDateTime,
    local_end_schedule: untilDateTime,
  });
  return [`// Interval Time Job: ${json}`, Order.NONE];
};
