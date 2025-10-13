import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const intervalTimeJobJson = {
  type: "interval_time_job",
  message0: "Run every %1 %2",
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
  previousStatement: null,
  nextStatement: null,
  colour: 210,
  tooltip: "Schedule a job to run repeatedly after a specified time interval.",
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

  let timeIntervalInSeconds = 0;
  if (intervalUnit === "second") {
    timeIntervalInSeconds = intervalValue;
  } else if (intervalUnit === "minute") {
    timeIntervalInSeconds = intervalValue * 60;
  } else if (intervalUnit === "hour") {
    timeIntervalInSeconds = intervalValue * 3600;
  }

  const json = JSON.stringify({
    schedule_type: "interval",
    time_interval: timeIntervalInSeconds, // Value in seconds
  });
  return [`// Interval Time Job: ${json}`, Order.NONE];
};
