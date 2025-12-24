import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const timeIntervalAtJobJson = {
  type: "time_interval_at_job",
  message0: "After every %1 %2",
  args0: [
    {
      type: "field_number",
      name: "INTERVAL_VALUE",
      value: 1,
      min: 1,
      precision: 1,
    },
    {
      type: "field_dropdown",
      name: "INTERVAL_UNIT",
      options: [
        ["seconds", "second"],
        ["minutes", "minute"],
        ["hours", "hour"],
      ],
    },
  ],
  message1: "execute %1",
  args1: [
    {
      type: "input_statement",
      name: "ACTION",
      check: "ACTION",
    },
  ],
  previousStatement: "TIME_CONFIG",
  nextStatement: "UTILITY_END",
  colour: 300,
  tooltip:
    "Specify the time interval at which you want to execute the job. This job will be executed at every time interval mentioned above. Then connect a contract action to execute.",
  helpUrl: "",
};

Blockly.Blocks["time_interval_at_job"] = {
  init: function () {
    this.jsonInit(timeIntervalAtJobJson);
  },
};

export const timeIntervalAtJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const intervalValue = block.getFieldValue("INTERVAL_VALUE");
  const intervalUnit = block.getFieldValue("INTERVAL_UNIT");

  // Convert interval value to seconds based on unit
  let intervalInSeconds = Number(intervalValue);
  const unit = intervalUnit.toLowerCase();

  if (unit === "minute") {
    intervalInSeconds = intervalInSeconds * 60;
  } else if (unit === "hour") {
    intervalInSeconds = intervalInSeconds * 3600;
  }
  // "second" remains as is

  const json = JSON.stringify({
    schedule_type: "time_interval",
    interval_value: Number(intervalValue),
    interval_unit: intervalUnit,
    interval_in_seconds: intervalInSeconds,
  });

  return [`// Time Interval Job: ${json}`, Order.NONE];
};

export default timeIntervalAtJobJson;
