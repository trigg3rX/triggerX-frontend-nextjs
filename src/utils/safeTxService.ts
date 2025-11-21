import { getSafeQueueUrl } from "./safeChains";

export interface ProposeEnableModuleParams {
  transactionServiceUrl: string;
  chainId: number;
  safeAddress: string;
  senderAddress: string;
  to: string;
  value: bigint;
  data: string;
  operation: number;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: string;
  refundReceiver: string;
  nonce: bigint;
  safeTxHash: string;
  signature: string;
}

export interface ProposeEnableModuleResult {
  safeTxHash: string;
  queueUrl: string | null;
}

const MULTISIG_TX_ENDPOINT = "/api/v1/safes";

const normalizeServiceUrl = (url: string): string => {
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const bigintToDecimalString = (value: bigint): string => value.toString(10);

export async function proposeEnableModuleTx(
  params: ProposeEnableModuleParams,
): Promise<ProposeEnableModuleResult> {
  const {
    transactionServiceUrl,
    chainId,
    safeAddress,
    senderAddress,
    to,
    value,
    data,
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    nonce,
    safeTxHash,
    signature,
  } = params;

  const baseUrl = normalizeServiceUrl(transactionServiceUrl);
  const endpoint = `${baseUrl}${MULTISIG_TX_ENDPOINT}/${safeAddress}/multisig-transactions/`;

  const body = {
    to,
    value: bigintToDecimalString(value),
    data,
    operation,
    safeTxGas: bigintToDecimalString(safeTxGas),
    baseGas: bigintToDecimalString(baseGas),
    gasPrice: bigintToDecimalString(gasPrice),
    gasToken,
    refundReceiver,
    nonce: bigintToDecimalString(nonce),
    safeTxHash,
    sender: senderAddress,
    signature,
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok && response.status !== 409) {
      const errorReason = await safeTransactionErrorReason(response);
      throw new Error(
        `Safe Transaction Service error (${response.status}): ${errorReason}`,
      );
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Unknown Safe Transaction Service error");
  }

  const queueUrl = await getSafeQueueUrl(chainId, safeAddress);

  return {
    safeTxHash,
    queueUrl,
  };
}

const safeTransactionErrorReason = async (
  response: Response,
): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data === "string") {
      return data;
    }
    if (data?.detail) {
      return data.detail;
    }
    if (data?.message) {
      return data.message;
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText || "Unknown error";
  }
};
