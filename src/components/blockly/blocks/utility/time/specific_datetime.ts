import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// Import the custom fields to ensure they are registered
import "../../../fields/DatePickerField";
import "../../../fields/TimePickerField";

const specificDatetimeJson = {
  type: "specific_datetime",
  message0: "On %1 and at %2",
  args0: [
    {
      type: "field_date_picker",
      name: "SCHEDULE_DATE",
      text: "2024-01-01",
    },
    {
      type: "field_time_picker",
      name: "SCHEDULE_TIME",
      text: "12:00",
    },
  ],
  previousStatement: "TIME_CONFIG",
  nextStatement: "ACTION",
  colour: 300,
  tooltip:
    "Specify the Date and Time when you want your job to be executed. This job will be executed only once.",
  helpUrl: "",
};

Blockly.Blocks["specific_datetime"] = {
  init: function () {
    this.jsonInit(specificDatetimeJson);
  },
};

export const specificDatetimeGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const scheduleDate = block.getFieldValue("SCHEDULE_DATE");
  const scheduleTime = block.getFieldValue("SCHEDULE_TIME");

  // Combine date and time into a single datetime string
  const dateTime = `${scheduleDate}T${scheduleTime}`;

  const json = JSON.stringify({
    schedule_type: "specific",
    specific_schedule: dateTime,
    local_schedule: dateTime,
  });
  return [`// Specific DateTime: ${json}`, Order.NONE];
};
