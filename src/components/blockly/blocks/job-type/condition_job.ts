import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchApiKeys } from "@/utils/fetchApiKeys";

interface ConditionJobData {
  condition_type: string;
  value_source_type: string;
  value_source_url: string;
  selected_key_route: string;
  lower_limit?: number;
  upper_limit?: number;
}

interface ApiKey {
  name: string;
  value: string | number | boolean;
  originalValue?: string | number | boolean;
}

const conditionJobJson = {
  type: "condition_job",
  message0: "Runs when the condition is satisfied",
  message1: "for data from Source type %1",
  message2: "& Source url %1",
  // The Key/Condition/Limit row is added dynamically after a valid URL is entered
  message3: "execute %1",
  args1: [
    {
      type: "field_dropdown",
      name: "VALUE_SOURCE_TYPE",
      options: [
        ["API", "api"],
        ["WebSocket", "websocket", { disabled: true }],
        ["Oracle", "oracle", { disabled: true }],
      ],
    },
  ],
  args2: [
    {
      type: "field_input",
      name: "VALUE_SOURCE_URL",
      text: "https://api.example.com/data",
    },
  ],
  args3: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: "ACTION",
    },
  ],
  inputsInline: false, // Keep inputs stacked for readability
  previousStatement: null,
  nextStatement: null,
  colour: 210,
  tooltip:
    "Create a Condition Job that will execute once a specified condition is satisfied using data from an API.",
  helpUrl: "",
};

Blockly.Blocks["condition_job"] = {
  init: function () {
    this.jsonInit(conditionJobJson);

    // Store available keys on the block instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).availableKeys = [["Enter API URL first", "none"]];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).isFetchingKeys = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).lastFetchedUrl = "";

    const updateLimitFieldsVisibility = () => {
      const conditionType = this.getFieldValue("CONDITION_TYPE");
      const lowerField = this.getField("LOWER_LIMIT");
      const upperField = this.getField("UPPER_LIMIT");

      // Range/between => show both; otherwise show single value (upper)
      const isRange =
        conditionType === "between" || conditionType === "in_range";
      const showLower = isRange;
      const showUpper = isRange || !isRange;

      if (lowerField) lowerField.setVisible(!!showLower);
      if (upperField) upperField.setVisible(!!showUpper);

      // Force a re-render after visibility changes
      this.render();
    };

    const fetchAndUpdateKeys = async (url: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blockInstance = this as any;

      if (
        !url ||
        blockInstance.isFetchingKeys ||
        url === blockInstance.lastFetchedUrl
      )
        return;

      // Simple URL validation
      if (!/^https?:\/\//.test(url)) {
        // Hide params row entirely for invalid/empty URL
        try {
          this.removeInput("PARAMS_INPUT");
        } catch {}
        return;
      }

      blockInstance.isFetchingKeys = true;
      blockInstance.lastFetchedUrl = url;

      // Update dropdown to show loading state and create params row
      blockInstance.availableKeys = [["Fetching keys...", "loading"]];
      try {
        this.removeInput("PARAMS_INPUT");
      } catch {}
      this.appendDummyInput("PARAMS_INPUT")
        .appendField("where the data key")
        .appendField(
          new Blockly.FieldDropdown(blockInstance.availableKeys),
          "SELECTED_KEY_ROUTE",
        )
        .appendField("is")
        .appendField(
          new Blockly.FieldDropdown([
            ["Equals to", "equals_to"],
            ["Not Equals to", "not_equals_to"],
            ["Less Than", "less_than"],
            ["Greater Than", "greater_than"],
            ["In Range", "in_range"],
            ["Less Than or Equals to", "less_than_or_equals"],
            ["Greater Than or Equals to", "greater_than_or_equals"],
          ]),
          "CONDITION_TYPE",
        )
        .appendField("min:")
        .appendField(
          new Blockly.FieldNumber(0, undefined, undefined, 0.01),
          "LOWER_LIMIT",
        )
        .appendField("max:")
        .appendField(
          new Blockly.FieldNumber(100, undefined, undefined, 0.01),
          "UPPER_LIMIT",
        );
      try {
        this.moveInputBefore("PARAMS_INPUT", "STATEMENT");
      } catch {}

      try {
        const apiKeys: ApiKey[] = await fetchApiKeys(url);

        if (apiKeys && apiKeys.length > 0) {
          // Convert API keys to dropdown options
          blockInstance.availableKeys = apiKeys.map((key) => [
            key.name,
            key.name, // Use the key name as the value (e.g., "ethereum.usd")
          ]);
        } else {
          // No keys found
          blockInstance.availableKeys = [["No keys found", "none"]];
        }
      } catch (error) {
        console.error("Error fetching API keys:", error);
        // Show error state
        blockInstance.availableKeys = [["Error fetching keys", "error"]];
      } finally {
        blockInstance.isFetchingKeys = false;

        // Rebuild the params row with new keys
        try {
          this.removeInput("PARAMS_INPUT");
        } catch {}
        this.appendDummyInput("PARAMS_INPUT")
          .appendField("where the key route")
          .appendField(
            new Blockly.FieldDropdown(blockInstance.availableKeys),
            "SELECTED_KEY_ROUTE",
          )
          .appendField("is")
          .appendField(
            new Blockly.FieldDropdown([
              ["Equals to", "equals_to"],
              ["Not Equals to", "not_equals_to"],
              ["Less Than", "less_than"],
              ["Greater Than", "greater_than"],
              ["In Range", "in_range"],
              ["Less Than or Equals to", "less_than_or_equals"],
              ["Greater Than or Equals to", "greater_than_or_equals"],
            ]),
            "CONDITION_TYPE",
          )
          .appendField(
            new Blockly.FieldNumber(0, undefined, undefined, 0.01),
            "LOWER_LIMIT",
          )
          .appendField(
            new Blockly.FieldNumber(100, undefined, undefined, 0.01),
            "UPPER_LIMIT",
          );
        try {
          this.moveInputBefore("PARAMS_INPUT", "STATEMENT");
        } catch {}

        updateLimitFieldsVisibility();
        this.render();
      }
    };

    const validateRequiredLimits = () => {
      const conditionType = this.getFieldValue("CONDITION_TYPE");
      const lowerField = this.getField("LOWER_LIMIT");
      const upperField = this.getField("UPPER_LIMIT");
      const lowerVal = lowerField ? Number(lowerField.getValue()) : undefined;
      const upperVal = upperField ? Number(upperField.getValue()) : undefined;

      let warning: string | null = null;
      const isRange =
        conditionType === "between" || conditionType === "in_range";
      if (isRange) {
        if (
          lowerVal === undefined ||
          isNaN(lowerVal) ||
          upperVal === undefined ||
          isNaN(upperVal)
        ) {
          warning = "Both lower and upper values are required for range.";
        } else if (lowerVal > upperVal) {
          warning = "Lower value should be <= upper value.";
        }
      } else {
        // Single-value conditions must have the single value (upper)
        if (upperVal === undefined || isNaN(upperVal)) {
          warning = "A value is required for this condition.";
        }
      }

      this.setWarningText(warning);
    };

    // Limits row is only available after params row is added; safe to skip on init

    // Fetch keys on initial load if URL is already set and valid
    const initialUrl = this.getFieldValue("VALUE_SOURCE_URL");
    if (initialUrl && initialUrl !== "https://api.example.com/data") {
      setTimeout(() => fetchAndUpdateKeys(initialUrl), 100);
    }

    this.setOnChange((event?: Blockly.Events.Abstract) => {
      if (!event) return;
      const ev = event as unknown as { name?: string; blockId?: string };

      // Fetch API keys when URL changes; show/hide params row accordingly
      if (
        event.type === Blockly.Events.BLOCK_CHANGE &&
        ev.name === "VALUE_SOURCE_URL" &&
        ev.blockId === this.id
      ) {
        const url = this.getFieldValue("VALUE_SOURCE_URL");
        fetchAndUpdateKeys(url);
      }

      // Update visibility when condition type changes
      if (
        event.type === Blockly.Events.BLOCK_CHANGE &&
        ev.name === "CONDITION_TYPE" &&
        ev.blockId === this.id
      ) {
        updateLimitFieldsVisibility();
      }

      // Validate on any change affecting limits
      if (
        (event.type === Blockly.Events.BLOCK_CHANGE &&
          ev.blockId === this.id &&
          (ev.name === "LOWER_LIMIT" ||
            ev.name === "UPPER_LIMIT" ||
            ev.name === "CONDITION_TYPE")) ||
        event.type === Blockly.Events.CHANGE
      ) {
        validateRequiredLimits();
      }
    });
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

  // Add value(s) based on condition type (align with form logic)
  if (conditionType === "between" || conditionType === "in_range") {
    jobData.lower_limit = lowerLimit;
    jobData.upper_limit = upperLimit;
  } else {
    // Single-value conditions: use upper_limit as the submission value
    jobData.upper_limit = upperLimit;
  }

  const json = JSON.stringify(jobData);
  return [`// Condition Job: ${json}`, Order.NONE];
};
