import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

/**
 * Manual ABI Input Block
 * Allows adding ABI JSON for the target function
 */
const manualAbiInputJson = {
  type: "manual_abi_input",
  message0: "Add ABI of the target function %1",
  args0: [
    {
      type: "field_input",
      name: "ABI_TEXT",
      text: "[]",
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 160,
  tooltip: "Add the ABI JSON of the target function you want to execute.",
  helpUrl: "",
};

Blockly.Blocks["manual_abi_input"] = {
  init: function () {
    this.jsonInit(manualAbiInputJson);
  },
};

export const manualAbiInputGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const txt = block.getFieldValue("ABI_TEXT") || "";
  const json = JSON.stringify({
    abi: txt,
  });
  return [`// Manual ABI Input: ${json}`, Order.NONE];
};

export default manualAbiInputJson;
