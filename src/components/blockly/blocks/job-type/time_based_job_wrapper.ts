import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const timeBasedJobWrapperJson = {
  type: "time_based_job_wrapper",
  message0: "Run a time-based job",
  message1: "%1",
  args0: [],
  args1: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: "DURATION",
    },
  ],
  previousStatement: "JOB_TYPE", // Connects only to chain selection
  colour: 30,
  tooltip: "Runs a job based on a time schedule.",
  helpUrl: "",
};

Blockly.Blocks["time_based_job_wrapper"] = {
  init: function () {
    this.jsonInit(timeBasedJobWrapperJson);
  },
};

export const timeBasedJobWrapperGenerator = function (): [string, Order] {
  const json = JSON.stringify({
    job_type: "time_based_wrapper",
  });
  return [`// Time-Based Job Wrapper: ${json}`, Order.NONE];
};
