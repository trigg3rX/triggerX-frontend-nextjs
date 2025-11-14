import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const eventFilterJson = {
  type: "event_filter",
  message0: "filter by parameter %1",
  args0: [
    {
      type: "field_input",
      name: "PARAMETER_NAME",
      text: "parameter name",
    },
  ],
  message1: "equals %1",
  args1: [
    {
      type: "field_input",
      name: "PARAMETER_VALUE",
      text: "value",
    },
  ],
  message2: "execute %1",
  args2: [
    {
      type: "input_value",
      name: "ACTION",
      check: "ACTION",
      align: "RIGHT",
    },
  ],
  previousStatement: "EVENT_FILTER",
  inputsInline: false,
  colour: 220, // Using the same color as other event blocks
  tooltip:
    "Filter events based on a specific parameter value. Enter the event parameter name (e.g., 'from', 'to', 'amount') and the value to filter by. Connect an action block on the right.",
  helpUrl: "",
};

Blockly.Blocks["event_filter"] = {
  init: function () {
    this.jsonInit(eventFilterJson);
  },
};

export const eventFilterGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const parameterName = block.getFieldValue("PARAMETER_NAME");
  const parameterValue = block.getFieldValue("PARAMETER_VALUE");

  const json = JSON.stringify({
    event_filter_para_name: parameterName,
    event_filter_value: parameterValue,
  });

  return [`// Event Filter: ${json}`, Order.NONE];
};

export default eventFilterJson;
