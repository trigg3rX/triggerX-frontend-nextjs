import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const staticArgumentsJson = {
  type: "static_arguments",
  message0: "%1 has parameter value/s %2",
  args0: [
    {
      type: "field_input",
      name: "FUNCTION_NAME",
      text: "transfer",
    },
    {
      type: "field_input",
      name: "ARGUMENT_VALUES",
      text: '["0x...", "1000"]',
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 190,
  tooltip: "Specify the values that will be passed as arguments.",
  helpUrl: "",
};

Blockly.Blocks["static_arguments"] = {
  init: function () {
    this.jsonInit(staticArgumentsJson);
  },
};

export const staticArgumentsGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const functionName = block.getFieldValue("FUNCTION_NAME");
  const argumentValues = block.getFieldValue("ARGUMENT_VALUES");

  // Try to parse as JSON array
  let parsedValues;
  try {
    parsedValues = JSON.parse(argumentValues);
  } catch {
    parsedValues = argumentValues;
  }

  const json = JSON.stringify({
    function_name: functionName,
    argument_type: "static",
    argument_values: parsedValues,
  });

  return [`// Static Arguments: ${json}`, Order.NONE];
};

export default staticArgumentsJson;
