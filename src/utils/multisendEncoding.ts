import { ethers } from "ethers";
import { SafeTransaction } from "@/types/job";
import { devLog } from "@/lib/devLog";

/**
 * Encodes multiple Safe transactions into MultiSend format
 *
 * MultiSend format for each transaction:
 * - operation (1 byte): 0x00 = CALL, 0x01 = DELEGATECALL
 * - to (20 bytes): Target address
 * - value (32 bytes): Value in wei (left-padded)
 * - dataLength (32 bytes): Length of data in bytes (left-padded)
 * - data (variable): Encoded function call data
 *
 * All transactions are concatenated and then encoded as:
 * multiSend(bytes transactions)
 *
 * @param transactions - Array of Safe transactions to encode
 * @returns Encoded MultiSend function call data (hex string with 0x prefix)
 * @throws Error if any transaction is invalid
 */
export function encodeMultisendData(transactions: SafeTransaction[]): string {
  if (!transactions || transactions.length === 0) {
    throw new Error("At least one transaction is required for MultiSend");
  }

  devLog("[encodeMultisendData] Encoding", transactions.length, "transactions");

  // Multisend format: for each transaction, encode as:
  // operation (1 byte) + to (20 bytes) + value (32 bytes) + dataLength (32 bytes) + data (variable)
  let encodedTransactions = "";

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const to = tx.to;
    const value = ethers.toBigInt(tx.value);
    const data = tx.data;

    // Remove 0x prefix from data if present
    const dataWithoutPrefix = data.startsWith("0x") ? data.slice(2) : data;
    const dataLength = ethers.toBigInt(dataWithoutPrefix.length / 2);

    // Encode each field and concatenate
    // operation: uint8 (1 byte)
    const operation = typeof tx.operation === "number" ? tx.operation : 0;
    if (operation < 0 || operation > 1) {
      throw new Error(
        `Transaction ${i + 1}: Invalid Safe transaction operation: ${operation}. Expected 0 (CALL) or 1 (DELEGATECALL).`,
      );
    }
    const operationHex = operation.toString(16).padStart(2, "0");
    // to: address (20 bytes)
    const toHex = to.toLowerCase().replace(/^0x/, "").padStart(40, "0");
    // value: uint256 (32 bytes)
    const valueHex = value.toString(16).padStart(64, "0");
    // dataLength: uint256 (32 bytes)
    const dataLengthHex = dataLength.toString(16).padStart(64, "0");
    // data: bytes (variable length)

    encodedTransactions +=
      operationHex + toHex + valueHex + dataLengthHex + dataWithoutPrefix;

    devLog(
      `[encodeMultisendData] Transaction ${i + 1} encoded:`,
      `op=${operation === 0 ? "CALL" : "DELEGATECALL"}, to=${tx.to}, value=${tx.value}, dataLength=${dataLength}, dataPreview=${data.substring(0, 66)}${data.length > 66 ? "..." : ""}`,
    );
  }

  const packedTransactions = `0x${encodedTransactions}`;
  const multiSendInterface = new ethers.Interface([
    "function multiSend(bytes transactions)",
  ]);

  return multiSendInterface.encodeFunctionData("multiSend", [
    packedTransactions,
  ]);
}

/**
 * Validates a Safe transaction
 * @param tx - Transaction to validate
 * @param index - Optional index for error messages
 * @returns Object with isValid boolean and optional error message
 */
export function validateSafeTransaction(
  tx: SafeTransaction,
  index?: number,
): { isValid: boolean; error?: string } {
  const prefix = index !== undefined ? `Transaction ${index + 1}: ` : "";

  if (!tx.to || !ethers.isAddress(tx.to)) {
    return {
      isValid: false,
      error: `${prefix}Invalid or missing 'to' address`,
    };
  }

  if (tx.value === undefined || tx.value === null) {
    return {
      isValid: false,
      error: `${prefix}Missing 'value' field`,
    };
  }

  try {
    ethers.toBigInt(tx.value);
  } catch {
    return {
      isValid: false,
      error: `${prefix}Invalid value format: ${tx.value}`,
    };
  }

  if (tx.data === undefined || tx.data === null) {
    return {
      isValid: false,
      error: `${prefix}Missing 'data' field`,
    };
  }

  // Validate data is a string
  if (typeof tx.data !== "string") {
    return {
      isValid: false,
      error: `${prefix}Invalid 'data' type, expected string but got ${typeof tx.data}`,
    };
  }

  // Empty data (0x) is valid for ETH transfers
  // Non-empty data should be a valid hex string
  if (tx.data !== "0x" && tx.data !== "") {
    // Validate hex string format
    if (!/^0x[0-9a-fA-F]*$/.test(tx.data)) {
      return {
        isValid: false,
        error: `${prefix}Invalid 'data' format, must be a valid hex string`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates an array of Safe transactions
 * @param transactions - Array of transactions to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateSafeTransactions(transactions: SafeTransaction[]): {
  isValid: boolean;
  error?: string;
} {
  if (!transactions || transactions.length === 0) {
    return {
      isValid: false,
      error: "At least one transaction is required",
    };
  }

  for (let i = 0; i < transactions.length; i++) {
    const validation = validateSafeTransaction(transactions[i], i);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}
