import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const cronTimeJobJson = {
  type: "cron_time_job",
  message0: "Cron Time Job: Run on cron schedule %1",
  message1: "Execute: %1",
  args0: [
    {
      type: "field_input",
      name: "CRON_EXPRESSION",
      text: "0 0 * * *", // Default: midnight every day
    },
  ],
  args1: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: null, // Allow any block type inside
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 210,
  tooltip:
    "Schedule a job using a standard cron expression. Drag other blocks inside to define what the job should do.",
  helpUrl: "https://crontab.guru/",
};

Blockly.Blocks["cron_time_job"] = {
  init: function () {
    this.jsonInit(cronTimeJobJson);
  },
};

export const cronTimeJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const cronExpression = block.getFieldValue("CRON_EXPRESSION");
  const json = JSON.stringify({
    schedule_type: "cron",
    cron_expression: cronExpression,
  });
  return [`// Cron Time Job: ${json}`, Order.NONE];
};
