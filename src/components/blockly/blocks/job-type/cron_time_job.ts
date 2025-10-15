import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const cronTimeJobJson = {
  type: "cron_time_job",
  message0: "Run on cron schedule %1",
  args0: [
    {
      type: "field_input",
      name: "CRON_EXPRESSION",
      text: "0 0 * * *", // Default: midnight every day
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 210,
  tooltip:
    "Schedule a job using a standard cron expression (e.g., '0 0 * * *' for daily at midnight UTC).",
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
