import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

interface ConditionJobData {
  condition_type: string;
  value_source_type: string;
  value_source_url: string;
  selected_key_route: string;
  lower_limit?: number;
  upper_limit?: number;
}

const conditionJobJson = {
  type: "condition_job",
  message0: "Run when value from API %1 (key: %2) %3 %4 %5",
  args0: [
    {
      type: "field_input",
      name: "VALUE_SOURCE_URL",
      text: "https://api.example.com/data",
    },
    {
      type: "field_input",
      name: "SELECTED_KEY_ROUTE",
      text: "data.value", // Example: path to the value in the API response
    },
    {
      type: "field_dropdown",
      name: "CONDITION_TYPE",
      options: [
        ["is greater than", "greater_than"],
        ["is less than", "less_than"],
        ["is equal to", "equal_to"],
        ["is between", "between"],
      ],
    },
    {
      type: "field_number",
      name: "LOWER_LIMIT",
      value: 0, // Default lower limit
      precision: 0.01, // Allow decimals
    },
    {
      type: "field_number",
      name: "UPPER_LIMIT",
      value: 100, // Default upper limit (used for 'between' and 'less_than')
      precision: 0.01,
    },
  ],
  inputsInline: false, // Keep inputs stacked for readability
  previousStatement: null,
  nextStatement: null,
  colour: 210,
  tooltip:
    "Trigger a job when a condition based on API data is met. Use LOWER_LIMIT for 'greater than', 'equal to', and 'between' (start). Use UPPER_LIMIT for 'less than' and 'between' (end).",
  helpUrl: "",
};

Blockly.Blocks["condition_job"] = {
  init: function () {
    this.jsonInit(conditionJobJson);
  },
};

export const conditionJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const conditionType = block.getFieldValue("CONDITION_TYPE");
  const valueSourceUrl = block.getFieldValue("VALUE_SOURCE_URL");
  const selectedKeyRoute = block.getFieldValue("SELECTED_KEY_ROUTE");
  const lowerLimit = block.getFieldValue("LOWER_LIMIT");
  const upperLimit = block.getFieldValue("UPPER_LIMIT");

  const jobData: ConditionJobData = {
    condition_type: conditionType,
    value_source_type: "api",
    value_source_url: valueSourceUrl,
    selected_key_route: selectedKeyRoute,
  };

  // Add limits based on condition type
  if (conditionType === "greater_than" || conditionType === "equal_to") {
    jobData.lower_limit = lowerLimit;
  } else if (conditionType === "less_than") {
    jobData.upper_limit = upperLimit;
  } else if (conditionType === "between") {
    jobData.lower_limit = lowerLimit;
    jobData.upper_limit = upperLimit;
  }

  const json = JSON.stringify(jobData);
  return [`// Condition Job: ${json}`, Order.NONE];
};
