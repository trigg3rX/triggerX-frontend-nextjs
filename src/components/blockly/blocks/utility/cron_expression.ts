import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

const cronExpressionJson = {
  type: "cron_expression",
  message0: "at %1",
  args0: [
    {
      type: "field_input",
      name: "CRON_EXPRESSION",
      text: "*/5 * * * *", // Example: every 5 minutes
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 260,
  tooltip:
    "Specify the cron expression for the intervals you want to execute the job. This job will be executed at every time interval mentioned using the cron expression.",
  helpUrl: "https://crontab.guru/",
};

Blockly.Blocks["cron_expression"] = {
  init: function () {
    this.jsonInit(cronExpressionJson);
  },
};

export const cronExpressionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const cronExpression = block.getFieldValue("CRON_EXPRESSION");
  const json = JSON.stringify({
    schedule_type: "cron",
    cron_expression: cronExpression,
  });
  return [`// Cron Expression: ${json}`, Order.NONE];
};
