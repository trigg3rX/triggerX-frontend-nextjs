import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchApiKeys } from "@/utils/fetchApiKeys";

const conditionMonitorJson = {
  type: "condition_monitor",
  message0: "Monitor %1",
  message1: "fetch %1",
  message2: "and check if it is %1",
  args0: [
    {
      type: "field_input",
      name: "SOURCE_URL",
      text: "https://api.example.com/data",
    },
  ],
  args1: [
    {
      type: "field_dropdown",
      name: "DATA_KEY",
      options: [["data-key", ""]],
    },
  ],
  args2: [
    {
      type: "field_dropdown",
      name: "CONDITION_TYPE",
      options: [
        ["equal to", "equals_to"],
        ["not equal to", "not_equals_to"],
        ["less than", "less_than"],
        ["greater than", "greater_than"],
        ["less than or equal to", "less_than_or_equals"],
        ["greater than or equal to", "greater_than_or_equals"],
        ["in range", "in_range"],
      ],
    },
  ],
  inputsInline: false,
  previousStatement: "CONDITION_CONFIG",
  nextStatement: "UTILITY_END",
  colour: 110, // Using the same color as other condition/schedule blocks
  tooltip:
    "Specify the source URL from which the data will be fetched, and the condition will be monitored. Then connect a contract action to execute.",
  helpUrl: "",
};

Blockly.Blocks["condition_monitor"] = {
  init: function () {
    this.jsonInit(conditionMonitorJson);

    // Helper function to update value inputs based on condition type
    const updateValueInputs = (conditionType: string) => {
      // Remove existing value inputs if they exist
      if (this.getInput("VALUE_INPUT")) {
        this.removeInput("VALUE_INPUT");
      }
      if (this.getInput("RANGE_INPUT")) {
        this.removeInput("RANGE_INPUT");
      }

      // Add appropriate value input based on condition type
      if (conditionType === "in_range") {
        // Show two value fields for range
        this.appendDummyInput("RANGE_INPUT")
          .appendField("lower value")
          .appendField(new Blockly.FieldTextInput("value"), "LOWER_VALUE")
          .appendField("upper value")
          .appendField(new Blockly.FieldTextInput("value"), "UPPER_VALUE");
      } else {
        // Show single value field
        this.appendDummyInput("VALUE_INPUT")
          .appendField("value")
          .appendField(new Blockly.FieldTextInput("value"), "VALUE");
      }

      // Re-add the execute input at the end
      if (this.getInput("ACTION")) {
        this.removeInput("ACTION");
      }
      this.appendStatementInput("ACTION")
        .setCheck("ACTION")
        .appendField("execute");
    };

    // Initialize with single value input (default)
    updateValueInputs("");

    // Add validator to SOURCE_URL field to fetch API keys when URL changes
    const sourceUrlField = this.getField("SOURCE_URL");
    if (sourceUrlField) {
      sourceUrlField.setValidator((newValue: string) => {
        const dataKeyDropdown = this.getField("DATA_KEY");

        // Check if it's the default example URL first - don't fetch
        if (!newValue || newValue === "https://api.example.com/data") {
          if (dataKeyDropdown) {
            (
              dataKeyDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Enter source URL", ""]];
            dataKeyDropdown.setValue("");
          }
          return newValue;
        }

        // Validate URL format
        if (!/^https?:\/\//.test(newValue)) {
          // Invalid URL format
          if (dataKeyDropdown) {
            (
              dataKeyDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Invalid URL format", ""]];
            dataKeyDropdown.setValue("");
          }
          return newValue;
        }

        // Valid URL - proceed with fetching
        // Show "Fetching keys..." immediately
        if (dataKeyDropdown) {
          (
            dataKeyDropdown as unknown as { menuGenerator_: string[][] }
          ).menuGenerator_ = [["Fetching keys...", ""]];
          dataKeyDropdown.setValue("");
        }

        // Fetch API keys asynchronously (non-blocking)
        (async () => {
          try {
            const apiKeys = await fetchApiKeys(newValue);

            const dataKeyDropdown = this.getField("DATA_KEY");

            if (dataKeyDropdown) {
              if (apiKeys && apiKeys.length > 0) {
                // Create dropdown options from API keys
                const options = apiKeys.map(
                  (key: { name: string; value: string | number }) => [
                    key.name,
                    String(key.value),
                  ],
                );

                // Update dropdown options
                (
                  dataKeyDropdown as unknown as { menuGenerator_: string[][] }
                ).menuGenerator_ = options;

                // Set the first key as default
                dataKeyDropdown.setValue(String(apiKeys[0].value));
              } else {
                // No keys found
                (
                  dataKeyDropdown as unknown as { menuGenerator_: string[][] }
                ).menuGenerator_ = [["No keys found", ""]];
                dataKeyDropdown.setValue("");
              }
            }
          } catch (error) {
            console.error("Error fetching API keys:", error);
            const dataKeyDropdown = this.getField("DATA_KEY");
            if (dataKeyDropdown) {
              (
                dataKeyDropdown as unknown as { menuGenerator_: string[][] }
              ).menuGenerator_ = [["Error fetching keys", ""]];
              dataKeyDropdown.setValue("");
            }
          }
        })();

        // Always return the new value to allow editing
        return newValue;
      });
    }

    // Add validator to CONDITION_TYPE to update value inputs
    const conditionTypeField = this.getField("CONDITION_TYPE");
    if (conditionTypeField) {
      conditionTypeField.setValidator((newValue: string) => {
        updateValueInputs(newValue);
        return newValue;
      });
    }
  },
  onchange: function (event: Blockly.Events.Abstract) {
    if (!this.workspace) {
      return;
    }

    // When block is moved from flyout to workspace or created
    if (
      event.type === Blockly.Events.BLOCK_MOVE ||
      event.type === Blockly.Events.BLOCK_CREATE
    ) {
      const sourceUrl = this.getFieldValue("SOURCE_URL");
      const dataKeyDropdown = this.getField("DATA_KEY");

      if (dataKeyDropdown) {
        if (this.isInFlyout) {
          // In flyout: show "data-key"
          (
            dataKeyDropdown as unknown as { menuGenerator_: string[][] }
          ).menuGenerator_ = [["data-key", ""]];
          dataKeyDropdown.setValue("");
        } else if (!sourceUrl || sourceUrl === "https://api.example.com/data") {
          // In workspace with default/empty URL: show "Enter source URL"
          (
            dataKeyDropdown as unknown as { menuGenerator_: string[][] }
          ).menuGenerator_ = [["Enter source URL", ""]];
          dataKeyDropdown.setValue("");
        }
      }
    }
  },
};

export const conditionMonitorGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const sourceUrl = block.getFieldValue("SOURCE_URL");
  const dataKey = block.getFieldValue("DATA_KEY");
  const conditionType = block.getFieldValue("CONDITION_TYPE");

  let json;
  if (conditionType === "in_range") {
    const lowerValue = block.getFieldValue("LOWER_VALUE");
    const upperValue = block.getFieldValue("UPPER_VALUE");
    json = JSON.stringify({
      condition_type: conditionType,
      value_source_type: "api",
      value_source_url: sourceUrl,
      selected_key_route: dataKey,
      lower_limit: lowerValue,
      upper_limit: upperValue,
    });
  } else {
    const value = block.getFieldValue("VALUE");
    json = JSON.stringify({
      condition_type: conditionType,
      value_source_type: "api",
      value_source_url: sourceUrl,
      selected_key_route: dataKey,
      upper_limit: value,
    });
  }

  return [`// Condition Monitor: ${json}`, Order.NONE];
};

export default conditionMonitorJson;
