// src/components/blockly/dynamic_data_blocks.ts
import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// --- GET CURRENT TIME Block ---
const getCurrentTimeJson = {
  type: "get_current_time",
  message0: "current time",
  output: "Number", // Timestamp in milliseconds or seconds
  colour: 0, // A data/input color
  tooltip: "Gets the current timestamp.",
  helpUrl: "",
};

Blockly.Blocks["get_current_time"] = {
  init: function () {
    this.jsonInit(getCurrentTimeJson);
  },
};

export const getCurrentTimeGenerator = function (): [string, Order] {
  // For demonstration, we'll return a JS expression for the current time.
  // In a real system, this would trigger an actual API call or system variable.
  return [`Date.now()`, Order.FUNCTION_CALL]; // Returns milliseconds
};

// --- JOB TARGET TIME Block ---
const jobTargetTimeJson = {
  type: "job_target_time",
  message0: "job target time %1",
  args0: [
    {
      type: "field_input",
      name: "TARGET_TIME_UTC",
      text: "2024-01-01T12:00:00Z", // Default example in ISO format
    },
  ],
  output: "Number", // Expected to be a timestamp
  colour: 0,
  tooltip: "Sets a specific target time for the job (e.g., ISO 8601 format).",
  helpUrl: "",
};

Blockly.Blocks["job_target_time"] = {
  init: function () {
    this.jsonInit(jobTargetTimeJson);
  },
};

export const jobTargetTimeGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const targetTime = block.getFieldValue("TARGET_TIME_UTC");
  // For JS generation, we'll try to parse it into a timestamp.
  // Real implementation might handle this differently.
  return [`new Date("${targetTime}").getTime()`, Order.NEW]; // Returns milliseconds
};

// --- GET PRICE Block ---
const getPriceJson = {
  type: "get_price",
  message0: "Price of %1 from %2 in %3",
  args0: [
    {
      type: "field_input",
      name: "ASSET",
      text: "ETH",
    },
    {
      type: "field_dropdown",
      name: "SOURCE",
      options: [
        ["Chainlink", "CHAINLINK"],
        ["CoinGecko", "COINGECKO"],
        ["Binance", "BINANCE"],
      ],
    },
    {
      type: "field_dropdown",
      name: "CURRENCY",
      options: [
        ["USD", "USD"],
        ["EUR", "EUR"],
        ["USDT", "USDT"],
      ],
    },
  ],
  output: "Number",
  colour: 0,
  tooltip:
    "Fetches the price of an asset from a specified source in a given currency.",
  helpUrl: "",
};

Blockly.Blocks["get_price"] = {
  init: function () {
    this.jsonInit(getPriceJson);
  },
};

export const getPriceGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const asset = block.getFieldValue("ASSET");
  const source = block.getFieldValue("SOURCE");
  const currency = block.getFieldValue("CURRENCY");

  // For demonstration, this will return a placeholder.
  // In a real system, this would represent a call to your backend/oracle.
  // The generated JS code here is just illustrative.
  const json = JSON.stringify({
    action: "get_price",
    asset: asset,
    source: source,
    currency: currency,
  });
  return [`/* ${json} */ 0`, Order.ATOMIC]; // Return 0 or a placeholder for now
};
