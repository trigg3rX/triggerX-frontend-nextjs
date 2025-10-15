import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

export const operatorLtJson = {
  type: "operator_lt",
  message0: "%1 < %2",
  args0: [
    { type: "input_value", name: "OPERAND1" },
    { type: "input_value", name: "OPERAND2" },
  ],
  output: "Boolean",
  colour: 230,
  tooltip: "Checks if the first operand is less than the second.",
  helpUrl: "",
};

Blockly.Blocks["operator_lt"] = {
  init: function () {
    this.jsonInit(operatorLtJson);
  },
};

export const operatorLtGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const operand1 = javascriptGenerator.valueToCode(
    block,
    "OPERAND1",
    Order.ATOMIC,
  );
  const operand2 = javascriptGenerator.valueToCode(
    block,
    "OPERAND2",
    Order.ATOMIC,
  );
  const code = `${operand1} < ${operand2}`;
  return [code, Order.ATOMIC];
};
