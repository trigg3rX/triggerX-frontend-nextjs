"use client";

import type { ParamField } from "@/components/safe-wallet/TokenJobParamsForm";

export interface ParamValidationRule {
  required?: boolean;
  type?: "address" | "numberPositive" | "boolean" | "text" | "number";
  min?: number;
  max?: number;
  pattern?: RegExp;
  // Return an error string or undefined if valid
  custom?: (value: string | undefined) => string | undefined;
}

export interface ParamFieldWithRules extends ParamField {
  rules?: ParamValidationRule;
}

export const templateFields: Record<
  string,
  Record<string, ParamFieldWithRules[]>
> = {
  "balance-maintainer": {
    targetFunction: [
      {
        name: "contractAddress",
        label: "Contract Address",
        type: "text",
        placeholder: "Enter contract address",
        rules: { required: true, type: "address" },
      },
      {
        name: "minimumBalance",
        label: "Minimum Balance",
        type: "number",
        placeholder: "Enter minimum balance (ETH)",
        rules: { required: true, type: "numberPositive" },
      },
    ],
    timeFrame: [
      {
        name: "timeFrame",
        label: "Time Frame",
        type: "number",
        placeholder:
          "Enter time in seconds till you want to maintain the balance",
        rules: { required: true, type: "numberPositive", min: 1 },
      },
    ],
    timeInterval: [
      {
        name: "timeInterval",
        label: "Time Interval",
        type: "number",
        placeholder: "Enter interval in seconds to check the balance",
        rules: { required: true, type: "numberPositive", min: 1 },
      },
    ],
  },
};
