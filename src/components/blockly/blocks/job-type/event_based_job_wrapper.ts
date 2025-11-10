import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const eventBasedJobWrapperJson = {
  type: "event_based_job_wrapper",
  message0: "Run an event-based job.",
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
  tooltip: "Runs the job when an on-chain event is detected.",
  helpUrl: "",
};

Blockly.Blocks["event_based_job_wrapper"] = {
  init: function () {
    this.jsonInit(eventBasedJobWrapperJson);
  },
};

export const eventBasedJobWrapperGenerator = function (): [string, Order] {
  const json = JSON.stringify({
    job_type: "event_based_wrapper",
  });
  return [`// Event-Based Job Wrapper: ${json}`, Order.NONE];
};
