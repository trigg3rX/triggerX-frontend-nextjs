import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const conditionMonitorJson = {
  type: "condition_monitor",
  message0: "Monitor %1",
  message1: "fetch %1",
  message2: "and check if it is %1 %2",
  args0: [
    {
      type: "field_input",
      name: "SOURCE_URL",
      text: "https://api.example.com/data",
    },
  ],
  args1: [
    {
      type: "field_input",
      name: "DATA_KEY",
      text: "price.usd",
    },
  ],
  args2: [
    {
      type: "field_dropdown",
      name: "CONDITION_TYPE",
      options: [
        ["less than", "less_than"],
        ["less than or equal to", "less_than_or_equals"],
        ["equal to", "equals_to"],
        ["greater than", "greater_than"],
        ["greater than or equal to", "greater_than_or_equals"],
        ["not equal to", "not_equals_to"],
      ],
    },
    {
      type: "field_number",
      name: "VALUE",
      value: 100,
      precision: 0.01,
    },
  ],
  inputsInline: false,
  previousStatement: "CONDITION_CONFIG",
  colour: 110, // Using the same color as other condition/schedule blocks
  tooltip:
    "Specify the source URL from which the data will be fetched, and the condition will be monitored.",
  helpUrl: "",
};

Blockly.Blocks["condition_monitor"] = {
  init: function () {
    this.jsonInit(conditionMonitorJson);
  },
};

export const conditionMonitorGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const sourceUrl = block.getFieldValue("SOURCE_URL");
  const dataKey = block.getFieldValue("DATA_KEY");
  const conditionType = block.getFieldValue("CONDITION_TYPE");
  const value = block.getFieldValue("VALUE");

  const json = JSON.stringify({
    condition_type: conditionType,
    value_source_type: "api",
    value_source_url: sourceUrl,
    selected_key_route: dataKey,
    upper_limit: Number(value),
  });

  return [`// Condition Monitor: ${json}`, Order.NONE];
};

export default conditionMonitorJson;
