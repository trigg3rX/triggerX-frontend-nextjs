import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const conditionBasedJobWrapperJson = {
  type: "condition_based_job_wrapper",
  message0: "Run condition-based job.",
  message1: "%1",
  message2: "recurring %1",
  args0: [],
  args1: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: "DURATION",
    },
  ],
  args2: [
    {
      type: "input_value",
      name: "RECURRING",
      check: "RECURRING_TYPE",
    },
  ],
  previousStatement: "JOB_TYPE", // Connects only to chain selection
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
