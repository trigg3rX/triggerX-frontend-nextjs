// src/components/blockly/loop_blocks.ts
import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

// --- REPEAT UNTIL Block ---
const controlsRepeatUntilJson = {
  type: "controls_repeat_until",
  message0: "repeat until %1",
  args0: [
    {
      type: "input_value",
      name: "BOOL",
      check: "Boolean",
    },
  ],
  message1: "do %1",
  args1: [
    {
      type: "input_statement",
      name: "DO",
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 120, // A control flow color
  tooltip: "Repeatedly execute statements until a condition is true.",
  helpUrl: "",
};

Blockly.Blocks["controls_repeat_until"] = {
  init: function () {
    this.jsonInit(controlsRepeatUntilJson);
  },
};

export const controlsRepeatUntilGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const argument0 =
    javascriptGenerator.valueToCode(block, "BOOL", Order.NONE) || "false"; // Condition
  const branch = javascriptGenerator.statementToCode(block, "DO"); // Statements inside loop
  const code = `while (!(${argument0})) {\n${branch}}\n`;
  return [code, Order.NONE];
};

// --- FOREVER Block ---
// Note: 'forever' blocks often imply an infinite loop that needs an explicit break
// or relies on an external stop. For a simple JS representation, we'll use a `while(true)`
// and assume any breaking condition would be internal to the 'do' block.
const controlsForeverJson = {
  type: "controls_forever",
  message0: "forever",
  message1: "do %1",
  args1: [
    {
      type: "input_statement",
      name: "DO",
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 120, // A control flow color
  tooltip: "Repeatedly execute statements indefinitely.",
  helpUrl: "",
};

Blockly.Blocks["controls_forever"] = {
  init: function () {
    this.jsonInit(controlsForeverJson);
  },
};

export const controlsForeverGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const branch = javascriptGenerator.statementToCode(block, "DO");
  // In a real execution environment, this would need a way to stop.
  // For Blockly's JS generation, `while(true)` is the direct equivalent.
  const code = `while (true) {\n${branch}}\n`;
  return [code, Order.NONE];
};

const controlsRepeatEveryIntervalJson = {
  type: "controls_repeat_every_interval",
  message0: "repeat every %1 %2",
  args0: [
    {
      type: "field_number",
      name: "INTERVAL_VALUE",
      value: 5,
      min: 1,
      precision: 1,
    },
    {
      type: "field_dropdown",
      name: "INTERVAL_UNIT",
      options: [
        ["seconds", "second"],
        ["minutes", "minute"],
        ["hours", "hour"],
      ],
    },
  ],
  message1: "do %1",
  args1: [
    {
      type: "input_statement",
      name: "DO",
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 120, // Control flow color
  tooltip: "Repeatedly execute statements with a delay between each execution.",
  helpUrl: "",
};

Blockly.Blocks["controls_repeat_every_interval"] = {
  init: function () {
    this.jsonInit(controlsRepeatEveryIntervalJson);
  },
};

export const controlsRepeatEveryIntervalGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const intervalValue = block.getFieldValue("INTERVAL_VALUE");
  const intervalUnit = block.getFieldValue("INTERVAL_UNIT");
  const branch = javascriptGenerator.statementToCode(block, "DO");

  let delayInMilliseconds = 0;
  if (intervalUnit === "second") {
    delayInMilliseconds = intervalValue * 1000;
  } else if (intervalUnit === "minute") {
    delayInMilliseconds = intervalValue * 60 * 1000;
  } else if (intervalUnit === "hour") {
    delayInMilliseconds = intervalValue * 3600 * 1000;
  }

  // This is a conceptual representation. In a real job scheduler,
  // this would translate to a scheduled recurring task.
  // For raw JS generation, a `setInterval` is the closest, but often
  // jobs are processed in a more robust backend system.
  const code = `
    const intervalId = setInterval(() => {
      ${branch}
    }, ${delayInMilliseconds});
    // For a 'repeat until' or 'forever' wrapper, this setInterval would need to be managed
    // and cleared by the outer loop's logic or an explicit 'break' / 'stop job' block.
  `;
  return [code, Order.NONE];
};
