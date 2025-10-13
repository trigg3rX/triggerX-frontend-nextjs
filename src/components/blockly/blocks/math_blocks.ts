// src/components/blockly/math_blocks.ts
import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

// --- ROUND Block ---
const mathRoundJson = {
  type: "math_round",
  message0: "round %1",
  args0: [
    {
      type: "input_value",
      name: "NUM",
      check: "Number",
    },
  ],
  output: "Number",
  colour: 230, // A math color
  tooltip: "Rounds a number to the nearest integer.",
  helpUrl: "",
};

Blockly.Blocks["math_round"] = {
  init: function () {
    this.jsonInit(mathRoundJson);
  },
};

export const mathRoundGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const argument0 =
    javascriptGenerator.valueToCode(block, "NUM", Order.NONE) || "0";
  const code = `Math.round(${argument0})`;
  return [code, Order.FUNCTION_CALL];
};

// --- NUMBER Block (for '5000') ---
const mathNumberJson = {
  type: "math_number",
  message0: "%1",
  args0: [
    {
      type: "field_number",
      name: "NUM",
      value: 0,
    },
  ],
  output: "Number",
  colour: 230,
  tooltip: "A number.",
  helpUrl: "",
};

Blockly.Blocks["math_number"] = {
  init: function () {
    this.jsonInit(mathNumberJson);
  },
};

export const mathNumberGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const number = Number(block.getFieldValue("NUM"));
  const code = String(number);
  const order = number >= 0 ? Order.ATOMIC : Order.UNARY_NEGATION;
  return [code, order];
};
