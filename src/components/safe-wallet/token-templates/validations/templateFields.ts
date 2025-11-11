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

export const templateFields: Record<string, ParamFieldWithRules[]> = {
  "balance-maintainer": [
    {
      name: "walletAddress",
      label: "Wallet Address",
      type: "text",
      placeholder: "Enter wallet address",
      rules: { required: true, type: "address" },
    },
    {
      name: "minimumBalance",
      label: "Minimum Balance (ETH)",
      type: "number",
      placeholder: "Enter minimum balance",
      rules: { required: true, type: "numberPositive" },
    },
    {
      name: "topUpAmount",
      label: "Top-up Amount (ETH)",
      type: "number",
      placeholder: "Enter top-up amount",
      rules: { required: true, type: "numberPositive" },
    },
  ],
};
