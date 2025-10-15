import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

export const operatorAddJson = {
  type: "operator_add",
  message0: "%1 + %2",
  args0: [
    { type: "input_value", name: "NUM1", check: "Number" },
    { type: "input_value", name: "NUM2", check: "Number" },
  ],
  output: "Number",
  colour: 230,
  tooltip: "Adds two numbers.",
  helpUrl: "",
};

Blockly.Blocks["operator_add"] = {
  init: function () {
    this.jsonInit(operatorAddJson);
  },
};

export const operatorAddGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const num1 = javascriptGenerator.valueToCode(block, "NUM1", Order.ATOMIC);
  const num2 = javascriptGenerator.valueToCode(block, "NUM2", Order.ATOMIC);
  const code = `${num1} + ${num2}`;
  return [code, Order.ATOMIC];
};
