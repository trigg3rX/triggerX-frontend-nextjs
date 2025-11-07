import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const conditionBasedJobWrapperJson = {
  type: "condition_based_job_wrapper",
  message0: "Run condition-based job.",
  message1: "Execute: %1",
  args0: [],
  args1: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: null, // Allow any block type inside
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 30,
  tooltip: "Runs a job when an off-chain condition is satisfied.",
  helpUrl: "",
};

Blockly.Blocks["condition_based_job_wrapper"] = {
  init: function () {
    this.jsonInit(conditionBasedJobWrapperJson);
  },
};

export const conditionBasedJobWrapperGenerator = function (): [string, Order] {
  const json = JSON.stringify({
    job_type: "condition_based_wrapper",
  });
  return [`// Condition-Based Job Wrapper: ${json}`, Order.NONE];
};
