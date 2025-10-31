import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const timeframeJobJson = {
  type: "timeframe_job",
  message0: "Job runs for %1 %2",
  args0: [
    {
      type: "field_number",
      name: "TIMEFRAME_VALUE",
      value: 3600, // Default to 1 hour (3600 seconds)
      min: 1,
      precision: 1,
    },
    {
      type: "field_dropdown",
      name: "TIMEFRAME_UNIT",
      options: [
        ["seconds", "second"],
        ["minutes", "minute"],
        ["hours", "hour"],
        ["days", "day"],
      ],
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 30, // Using the same color as other time/schedule blocks
  tooltip: "Define a specific duration for the job to run.",
  helpUrl: "",
};

Blockly.Blocks["timeframe_job"] = {
  init: function () {
    this.jsonInit(timeframeJobJson);
  },
};

export const timeframeJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const timeframeValue = block.getFieldValue("TIMEFRAME_VALUE");
  const timeframeUnit = block.getFieldValue("TIMEFRAME_UNIT"); // 'second', 'minute', 'hour', 'day'

  let timeframeInSeconds = 0;
  if (timeframeUnit === "second") {
    timeframeInSeconds = timeframeValue;
  } else if (timeframeUnit === "minute") {
    timeframeInSeconds = timeframeValue * 60;
  } else if (timeframeUnit === "hour") {
    timeframeInSeconds = timeframeValue * 3600;
  } else if (timeframeUnit === "day") {
    timeframeInSeconds = timeframeValue * 86400; // 24 * 60 * 60
  }

  const json = JSON.stringify({
    time_frame: timeframeInSeconds, // Value in seconds
  });
  return [`// Timeframe Job: ${json}`, Order.NONE];
};
