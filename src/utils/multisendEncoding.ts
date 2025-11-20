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

  let encodedTransactions = "";

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];

    // Validate transaction
    if (!tx.to || !ethers.isAddress(tx.to)) {
      throw new Error(
        `Transaction ${i + 1}: Invalid or missing 'to' address: ${tx.to}`,
      );
    }

    if (tx.value === undefined || tx.value === null) {
      throw new Error(`Transaction ${i + 1}: Missing 'value' field`);
    }

    if (tx.data === undefined || tx.data === null) {
      throw new Error(`Transaction ${i + 1}: Missing 'data' field`);
    }

    // Convert value to BigInt
    let value: bigint;
    try {
      value = ethers.toBigInt(tx.value);
    } catch {
      throw new Error(
        `Transaction ${i + 1}: Invalid value format: ${tx.value}`,
      );
    }

    // Remove 0x prefix from data if present
    const dataWithoutPrefix = tx.data.startsWith("0x")
      ? tx.data.slice(2)
      : tx.data;

    // Calculate data length in bytes (each hex char = 0.5 byte)
    const dataLength = BigInt(dataWithoutPrefix.length / 2);

    // Encode each field
    // operation: uint8 (1 byte) - always CALL (0) for internal multisend txs
    const operationHex = "00";

    // to: address (20 bytes = 40 hex chars)
    const toHex = tx.to.toLowerCase().replace(/^0x/, "").padStart(40, "0");

    // value: uint256 (32 bytes = 64 hex chars)
    const valueHex = value.toString(16).padStart(64, "0");

    // dataLength: uint256 (32 bytes = 64 hex chars)
    const dataLengthHex = dataLength.toString(16).padStart(64, "0");

    // Concatenate: operation + to + value + dataLength + data
    encodedTransactions +=
      operationHex + toHex + valueHex + dataLengthHex + dataWithoutPrefix;

    devLog(
      `[encodeMultisendData] Transaction ${i + 1} encoded:`,
      `op=CALL, to=${tx.to}, value=${tx.value}, dataLength=${dataLength}`,
    );
  }

  // Create the packed transactions bytes
  const packedTransactions = `0x${encodedTransactions}`;

  // Encode as multiSend(bytes transactions)
  const multiSendInterface = new ethers.Interface([
    "function multiSend(bytes transactions)",
  ]);

  const encodedMultiSend = multiSendInterface.encodeFunctionData("multiSend", [
    packedTransactions,
  ]);

  devLog(
    "[encodeMultisendData] MultiSend encoded successfully:",
    encodedMultiSend.substring(0, 100) + "...",
  );

  return encodedMultiSend;
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
