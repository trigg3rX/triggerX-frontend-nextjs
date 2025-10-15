import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

export const operatorMultiplyJson = {
  type: "operator_multiply",
  message0: "%1 * %2",
  args0: [
    { type: "input_value", name: "NUM1", check: "Number" },
    { type: "input_value", name: "NUM2", check: "Number" },
  ],
  output: "Number",
  colour: 230,
  tooltip: "Multiplies two numbers.",
  helpUrl: "",
};

Blockly.Blocks["operator_multiply"] = {
  init: function () {
    this.jsonInit(operatorMultiplyJson);
  },
};

export const operatorMultiplyGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const num1 = javascriptGenerator.valueToCode(block, "NUM1", Order.ATOMIC);
  const num2 = javascriptGenerator.valueToCode(block, "NUM2", Order.ATOMIC);
  const code = `${num1} * ${num2}`;
  return [code, Order.ATOMIC];
};
