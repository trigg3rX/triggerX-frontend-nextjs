import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const timeframeJobJson = {
  type: "timeframe_job",
  message0: "until %1 %2",
  message1: "Execute: %1",
  args0: [
    {
      type: "field_number",
      name: "TIMEFRAME_VALUE",
      value: 1,
      min: 1,
      precision: 1,
    },
    {
      type: "field_dropdown",
      name: "TIMEFRAME_UNIT",
      options: [
        ["minutes", "minute"],
        ["hours", "hour"],
        ["days", "day"],
      ],
    },
  ],
  args1: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: ["TIME_CONFIG", "EVENT_CONFIG", "CONDITION_CONFIG", "ACTION"],
    },
  ],
  previousStatement: "DURATION",
  nextStatement: "TIMEFRAME_END", // Has a bottom notch but nothing can connect to it
  colour: 240, // Using the same color as other time/schedule blocks
  tooltip: "Specify till what time you need your job to be live on TriggerX.",
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
