// src/components/blockly/logic_blocks.ts
import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

// --- LOGICAL NOT ---
const logicNotJson = {
  type: "logic_not",
  message0: "not %1",
  args0: [
    {
      type: "input_value",
      name: "BOOL",
      check: "Boolean",
    },
  ],
  output: "Boolean",
  colour: 210, // A logic color
  tooltip: "Returns true if the input is false.",
  helpUrl: "",
};

Blockly.Blocks["logic_not"] = {
  init: function () {
    this.jsonInit(logicNotJson);
  },
};

export const logicNotGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const argument0 =
    javascriptGenerator.valueToCode(block, "BOOL", Order.LOGICAL_NOT) ||
    "false";
  return [`!${argument0}`, Order.LOGICAL_NOT];
};

// --- LOGICAL COMPARISON (Equality) ---
const logicCompareEqualityJson = {
  type: "logic_compare_equality",
  message0: "%1 = %2",
  args0: [
    {
      type: "input_value",
      name: "A",
    },
    {
      type: "input_value",
      name: "B",
    },
  ],
  inputsInline: true,
  output: "Boolean",
  colour: 210,
  tooltip: "Returns true if both inputs are equal.",
  helpUrl: "",
};

Blockly.Blocks["logic_compare_equality"] = {
  init: function () {
    this.jsonInit(logicCompareEqualityJson);
  },
};

export const logicCompareEqualityGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const argument0 =
    javascriptGenerator.valueToCode(block, "A", Order.EQUALITY) || "0";
  const argument1 =
    javascriptGenerator.valueToCode(block, "B", Order.EQUALITY) || "0";
  const code = `${argument0} === ${argument1}`;
  return [code, Order.EQUALITY];
};

// --- LOGICAL COMPARISON (Greater Than) ---
const logicCompareGreaterThanJson = {
  type: "logic_compare_greater_than",
  message0: "%1 > %2",
  args0: [
    {
      type: "input_value",
      name: "A",
      check: ["Number", "String"], // Can compare numbers or strings
    },
    {
      type: "input_value",
      name: "B",
      check: ["Number", "String"],
    },
  ],
  inputsInline: true,
  output: "Boolean",
  colour: 210,
  tooltip: "Returns true if the first input is greater than the second.",
  helpUrl: "",
};

Blockly.Blocks["logic_compare_greater_than"] = {
  init: function () {
    this.jsonInit(logicCompareGreaterThanJson);
  },
};

export const logicCompareGreaterThanGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const argument0 =
    javascriptGenerator.valueToCode(block, "A", Order.RELATIONAL) || "0";
  const argument1 =
    javascriptGenerator.valueToCode(block, "B", Order.RELATIONAL) || "0";
  const code = `${argument0} > ${argument1}`;
  return [code, Order.RELATIONAL];
};

// --- IF/THEN Block ---
const controlsIfJson = {
  type: "controls_if",
  message0: "if %1 then",
  args0: [
    {
      type: "input_value",
      name: "IF0",
      check: "Boolean",
    },
  ],
  message1: "do %1",
  args1: [
    {
      type: "input_statement",
      name: "DO0",
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 120, // A control flow color
  tooltip: "If a condition is true, then do some statements.",
  helpUrl: "",
};

Blockly.Blocks["controls_if"] = {
  init: function () {
    this.jsonInit(controlsIfJson);
  },
};

export const controlsIfGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  let code = "";
  const conditionCode =
    javascriptGenerator.valueToCode(block, "IF0", Order.NONE) || "false";
  const doCode = javascriptGenerator.statementToCode(block, "DO0");
  code += `if (${conditionCode}) {\n${doCode}}\n`;
  return [code, Order.NONE];
};
