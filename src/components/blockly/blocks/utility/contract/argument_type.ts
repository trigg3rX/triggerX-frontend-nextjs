import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

/**
 * Argument Type Utility Block
 * Allows specifying whether function arguments are static or dynamic
 * Example: "transfer has static arguments"
 */
const argumentTypeJson = {
  type: "argument_type",
  message0: "%1 has %2 arguments",
  args0: [
    {
      type: "field_input",
      name: "FUNCTION_NAME",
      text: "transfer",
    },
    {
      type: "field_dropdown",
      name: "ARG_TYPE",
      options: [
        ["static", "static"],
        ["dynamic", "dynamic"],
      ],
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 190, // Using the same color as other utility blocks
  tooltip:
    "Specify whether the function arguments are static (fixed values) or dynamic (computed at runtime).",
  helpUrl: "",
};

Blockly.Blocks["argument_type"] = {
  init: function () {
    this.jsonInit(argumentTypeJson);
  },
};

export const argumentTypeGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const functionName = block.getFieldValue("FUNCTION_NAME");
  const argType = block.getFieldValue("ARG_TYPE");

  const json = JSON.stringify({
    function_name: functionName,
    argument_type: argType,
  });

  return [`// Argument Type: ${json}`, Order.NONE];
};

export default argumentTypeJson;
