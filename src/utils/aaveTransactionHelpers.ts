import { ethers } from "ethers";
import type { SafeTransaction } from "@/types/job";

/**
 * Aave-specific utility functions for handling transaction parameter conversions
 * These functions handle the conversion between display format and encoding format
 * for Aave-specific transactions (approve and supply functions)
 */

const PLACEHOLDER_TX2_TOKEN_ADDRESS = "__TOKEN_TX2_ADDRESS__";
const PLACEHOLDER_CONNECTED_EOA = "__CONNECTED_EOA__";

/**
 * Resolves Aave-specific placeholders in transaction defaultArgumentValues
 * This should be called before passing transactions to SafeTransactionBuilder
 */
export function resolveAavePlaceholders(
  transactions: SafeTransaction[],
  connectedEOA: string | undefined,
): SafeTransaction[] {
  // Find the approve transaction to get the token address
  const approveTxIndex = transactions.findIndex(
    (tx) =>
      tx.defaultFunctionSignature?.toLowerCase().includes("approve") || tx.to, // If it's an approve transaction, the 'to' address is the token
  );
  const tokenAddress =
    approveTxIndex !== -1 ? transactions[approveTxIndex]?.to || "" : "";

  // Resolve placeholders in all transactions
  return transactions.map((tx) => {
    if (!tx.defaultArgumentValues) return tx;

    const resolvedValues = tx.defaultArgumentValues.map((value) => {
      if (value === PLACEHOLDER_TX2_TOKEN_ADDRESS) {
        return tokenAddress;
      }
      if (value === PLACEHOLDER_CONNECTED_EOA) {
        return connectedEOA || "";
      }
      return value;
    });

    return {
      ...tx,
      defaultArgumentValues: resolvedValues,
    };
  });
}

/**
 * Checks if a value is MAX_UINT256 in any format (hex, decimal, or "max")
 */
export function isMaxUint256(value: string): boolean {
  if (!value) return false;
  const trimmedValue = value.trim().toLowerCase();
  const maxUint256Hex = ethers.MaxUint256.toString(16).toLowerCase();
  const maxUint256HexPrefixed = `0x${maxUint256Hex}`;
  const maxUint256Decimal = ethers.MaxUint256.toString();

  return (
    trimmedValue === "max" ||
    trimmedValue === maxUint256Decimal ||
    trimmedValue === maxUint256Hex ||
    trimmedValue === maxUint256HexPrefixed
  );
}

/**
 * Converts MAX_UINT256 in any format to "max" for display
 */
export function formatMaxUint256ForDisplay(value: string): string {
  if (isMaxUint256(value)) {
    return "max";
  }
  return value;
}

/**
 * Converts "max" or MAX_UINT256 in any format to ethers.MaxUint256 for encoding
 */
export function parseMaxUint256ForEncoding(value: string): bigint {
  if (isMaxUint256(value)) {
    return ethers.MaxUint256;
  }
  return BigInt(value);
}

/**
 * Converts wei to ETH for display (for supply function amount parameter)
 */
export function formatWeiToEthForDisplay(value: string): string {
  try {
    const weiValue = BigInt(value);
    // If it's a reasonable wei value, convert to ETH for display
    if (weiValue > BigInt(0) && weiValue < ethers.MaxUint256) {
      return ethers.formatEther(weiValue);
    }
    return value;
  } catch {
    return value;
  }
}

/**
 * Converts ETH to wei for encoding (for supply function amount parameter)
 */
export function parseEthToWeiForEncoding(value: string): bigint {
  const ethValue = value.trim();
  if (ethValue === "" || ethValue === ".") {
    throw new Error("Invalid ETH value");
  }

  // Check if it looks like ETH (has decimal point or is small number)
  const hasDecimal = ethValue.includes(".");
  const numValue = parseFloat(ethValue);

  // If it has a decimal point or is a reasonable ETH amount, treat as ETH
  if (hasDecimal || (!isNaN(numValue) && numValue < 1e12 && numValue > 0)) {
    return ethers.parseEther(ethValue);
  } else {
    // Otherwise, treat as wei (already in wei format)
    return BigInt(value);
  }
}

/**
 * Formats a function input value for display based on Aave-specific rules
 */
export function formatAaveInputForDisplay(
  funcName: string,
  paramIndex: number,
  inputType: string,
  value: string,
): string {
  // Handle approve function amount parameter (index 1)
  if (
    funcName.toLowerCase() === "approve" &&
    paramIndex === 1 &&
    inputType.startsWith("uint")
  ) {
    return formatMaxUint256ForDisplay(value);
  }

  // Handle supply function amount parameter (index 1)
  if (
    funcName.toLowerCase() === "supply" &&
    paramIndex === 1 &&
    inputType.startsWith("uint")
  ) {
    return formatWeiToEthForDisplay(value);
  }

  return value;
}

/**
 * Parses a function input value for encoding based on Aave-specific rules
 */
export function parseAaveInputForEncoding(
  funcName: string,
  paramIndex: number,
  inputType: string,
  value: string,
): bigint {
  // Handle approve function amount parameter (index 1)
  if (
    funcName.toLowerCase() === "approve" &&
    paramIndex === 1 &&
    inputType.startsWith("uint")
  ) {
    return parseMaxUint256ForEncoding(value);
  }

  // Handle supply function amount parameter (index 1)
  if (
    funcName.toLowerCase() === "supply" &&
    paramIndex === 1 &&
    inputType.startsWith("uint")
  ) {
    try {
      return parseEthToWeiForEncoding(value);
    } catch {
      // If parsing fails, try as wei
      return BigInt(value);
    }
  }

  // Default: parse as BigInt
  return BigInt(value);
}

/**
 * Checks if a parameter should be disabled in the UI (e.g., approve amount should always be "max")
 */
export function isAaveParameterDisabled(
  funcName: string,
  paramIndex: number,
  inputType: string,
): boolean {
  return (
    funcName.toLowerCase() === "approve" &&
    paramIndex === 1 &&
    inputType.startsWith("uint")
  );
}

/**
 * Gets the placeholder text for an Aave parameter
 */
export function getAaveParameterPlaceholder(
  funcName: string,
  paramIndex: number,
  inputType: string,
): string {
  if (
    funcName.toLowerCase() === "approve" &&
    paramIndex === 1 &&
    inputType.startsWith("uint")
  ) {
    return "max";
  }
  return `Enter ${inputType}`;
}
