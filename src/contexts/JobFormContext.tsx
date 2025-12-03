/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Timeframe,
  TimeInterval,
  ContractInteraction,
  ContractEvent,
  ContractFunction,
  SafeTransaction,
} from "@/types/job";
import networksData from "@/utils/networks.json";
import { ethers } from "ethers";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { fetchApiKeys } from "@/utils/fetchApiKeys";
import { useTriggerBalance } from "./BalanceContext";
import toast from "react-hot-toast";
import { useStakeRegistry } from "@/hooks/useStakeRegistry";
import { devLog } from "@/lib/devLog";
import JobRegistryArtifact from "@/artifacts/JobRegistry.json";
import { useChainId } from "wagmi";
import {
  getJobRegistryAddress,
  getSafeMultiSendCallOnlyAddress,
} from "@/utils/contractAddresses";
import { getWalletDisplayName } from "@/utils/safeWalletNames";
import { extractFunctions, extractEvents, parseABI } from "@/utils/abiUtils";
import { encodeMultisendData } from "@/utils/multisendEncoding";

// Utility types and functions moved from JobForm.tsx
export type JobDetails = {
  user_address: string;
  ether_balance: number;
  token_balance: number;
  job_title: string;
  task_definition_id: number;
  time_frame: number;
  recurring: boolean;
  timezone: string;
  time_interval: number;
  trigger_chain_id: string;
  trigger_contract_address: string;
  trigger_event: string;
  event_filter_para_name?: string;
  event_filter_value?: string;
  target_chain_id: string;
  target_contract_address: string;
  target_function: string;
  abi: string | null;
  arg_type?: number;
  arguments?: string[];
  dynamic_arguments_script_url?: string;
  value_source_type?: string;
  value_source_url?: string;
  selected_key_route?: string;
  condition_type?: string;
  upper_limit?: number;
  lower_limit?: number;
  safe_transactions?: SafeTransaction[];
  job_id?: string;
  language?: string;
  is_safe?: boolean;
  safe_address?: string;
  safe_name?: string;
};

function extractJobDetails(
  contractKey: string,
  contractInteractions: ContractInteraction,
  jobTitle: string,
  timeframeInSeconds: number,
  intervalInSeconds: number,
  recurring: boolean,
  userAddress: string | undefined,
  networkId: number | undefined,
  jobType: number,
  language?: string,
  executionMode?: "contract" | "safe",
  selectedSafeWallet?: string | null,
  chainId?: number,
  userSafeWallets?: string[],
  customScriptUrl?: string,
): JobDetails {
  console.log(
    "[extractJobDetails] Starting job details extraction for contractKey:",
    contractKey,
  );
  console.log("[extractJobDetails] Input parameters:", {
    jobTitle,
    jobType,
    executionMode,
    selectedSafeWallet,
    networkId,
    chainId,
  });
  let triggerContractAddress = "0x0000000000000000000000000000000000000000";
  let triggerEvent = "NULL";
  let eventFilterParaName = "";
  let eventFilterValue = "";
  if (jobType === 3 && contractInteractions.eventContract) {
    triggerContractAddress =
      contractInteractions.eventContract.address || triggerContractAddress;
    triggerEvent =
      contractInteractions.eventContract.targetEvent || triggerEvent;
    eventFilterParaName =
      contractInteractions.eventContract.selectedEventArgument || "";
    eventFilterValue =
      contractInteractions.eventContract.eventArgumentValue || "";
  } else {
    const c = contractInteractions[contractKey];
    if (c && c.address) {
      triggerContractAddress = c.address;
    }
  }

  const c = contractInteractions[contractKey];
  const contractAddress =
    c.address || "0x0000000000000000000000000000000000000000";
  const contractABI = c.abi;
  const argType = getArgType(c.argumentType || "static");
  let argsArray = [...(c.argumentValues || [])];
  // For jobType 4 (custom script), use customScriptUrl instead of contract's ipfsCodeUrl
  const ipfsCodeUrl =
    jobType === 4 ? customScriptUrl || "" : c.ipfsCodeUrl || "";
  const targetFunction = c.targetFunction ? c.targetFunction.split("(")[0] : "";
  const taskDefinitionId = getTaskDefinitionId(
    c.argumentType || "static",
    jobType,
  );
  const triggerChainId = networkId ? networkId.toString() : "";

  // Use safeTransactions for Safe wallet with static arguments
  let safeTransactions: SafeTransaction[] | undefined = undefined;
  let encodedMultiSendData: string | null = null;

  if (
    executionMode === "safe" &&
    selectedSafeWallet &&
    c.argumentType === "static" &&
    contractKey === "contract" // Only for main contract, not event contract
  ) {
    console.log("[extractJobDetails] Processing Safe wallet transactions...");
    // Use user-provided safeTransactions from UI if available
    if (c.safeTransactions && c.safeTransactions.length > 0) {
      safeTransactions = c.safeTransactions;
      console.log("[extractJobDetails] Using provided safeTransactions:", {
        count: safeTransactions.length,
        transactions: safeTransactions.map((tx, idx) => ({
          index: idx,
          to: tx.to,
          value: tx.value,
          dataLength: tx.data?.length || 0,
        })),
      });
    } else {
      // Fallback: build from static arguments (legacy behavior)
      const fullFunctionSignature = c.targetFunction || "";
      safeTransactions = buildSafeTransactionsFromStaticArgs(
        contractAddress,
        contractABI,
        fullFunctionSignature,
        argsArray,
      );

      // If  no safe transactions were built, log a warning
      if (!safeTransactions || safeTransactions.length === 0) {
        devLog(
          "[extractJobDetails] Warning: No safe transactions provided for static Safe wallet job",
        );
      }
    }

    if (safeTransactions && safeTransactions.length > 0) {
      try {
        encodedMultiSendData = encodeMultisendData(safeTransactions);
        console.log("[extractJobDetails] Encoded multisend data:", {
          length: encodedMultiSendData?.length || 0,
          preview: encodedMultiSendData?.substring(0, 66) + "...",
        });
      } catch (error) {
        devLog(
          "[extractJobDetails] Failed to encode Safe multisend data:",
          error,
        );
        console.error(
          "[extractJobDetails] Failed to encode Safe multisend data:",
          error,
        );
        encodedMultiSendData = null;
      }
    }

    if (
      safeTransactions &&
      safeTransactions.length > 0 &&
      selectedSafeWallet &&
      encodedMultiSendData
    ) {
      const numericChainId = chainId ?? networkId ?? 0;
      const multiSendCallOnlyAddress =
        numericChainId !== 0
          ? getSafeMultiSendCallOnlyAddress(numericChainId)
          : "";

      if (!multiSendCallOnlyAddress) {
        devLog(
          "[extractJobDetails] Missing MultiSendCallOnly address for chain",
          numericChainId,
        );
      } else {
        argsArray = [
          selectedSafeWallet,
          multiSendCallOnlyAddress,
          "0",
          encodedMultiSendData,
          "1",
        ];
        console.log(
          "[extractJobDetails] Updated argsArray for Safe execution:",
          {
            safeWallet: selectedSafeWallet,
            multiSendAddress: multiSendCallOnlyAddress,
            encodedDataLength: encodedMultiSendData?.length || 0,
          },
        );
      }
    }
  }

  // Generate unique job title for linked jobs
  // let finalJobTitle = jobTitle;
  // if (contractKey.includes('-')) {
  //   const linkedJobId = contractKey.split('-')[1];
  //   finalJobTitle = `${jobTitle} - Linked Job ${linkedJobId}`;
  // }

  const jobDetails: JobDetails = {
    user_address: userAddress || "",
    ether_balance: 0,
    token_balance: 0,
    job_title: jobTitle,
    task_definition_id: taskDefinitionId,
    time_frame: timeframeInSeconds,
    recurring,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    time_interval: intervalInSeconds,
    trigger_chain_id: triggerChainId,
    trigger_contract_address: triggerContractAddress,
    trigger_event: triggerEvent,
    event_filter_para_name: eventFilterParaName || "",
    event_filter_value: eventFilterValue || "",
    target_chain_id: triggerChainId,
    target_contract_address: contractAddress,
    target_function: targetFunction,
    abi: contractABI,
    arg_type: argType,
    arguments: argsArray,
    dynamic_arguments_script_url: ipfsCodeUrl,
    value_source_type: c.sourceType,
    value_source_url: c.sourceUrl,
    selected_key_route: (() => {
      // Get the selected API key name instead of value
      if (c.selectedApiKey && c.apiKeys) {
        const selectedApiKey = c.apiKeys.find(
          (key) => String(key.value) === c.selectedApiKey,
        );
        if (selectedApiKey) {
          return selectedApiKey.name; // Return the key name (e.g., "ethereum.usd")
        }
      }
      return "";
    })(),
    condition_type: mapConditionType(c.conditionType || ""),
    upper_limit: c.upperLimit ? parseFloat(c.upperLimit) : undefined,
    lower_limit: c.lowerLimit ? parseFloat(c.lowerLimit) : undefined,
    language: language || undefined,
    is_safe: executionMode === "safe",
    safe_address:
      executionMode === "safe" ? selectedSafeWallet || undefined : undefined,
    safe_name:
      executionMode === "safe" && selectedSafeWallet && chainId
        ? getWalletDisplayName(
          selectedSafeWallet,
          chainId,
          userSafeWallets || [],
        )
        : undefined,
    safe_transactions: safeTransactions,
  };

  console.log("[extractJobDetails] Final job details prepared:", {
    job_title: jobDetails.job_title,
    task_definition_id: jobDetails.task_definition_id,
    target_contract_address: jobDetails.target_contract_address,
    target_function: jobDetails.target_function,
    execution_mode: executionMode,
    is_safe: jobDetails.is_safe,
    safe_address: jobDetails.safe_address,
    safe_transactions_count: jobDetails.safe_transactions?.length || 0,
    arguments_count: jobDetails.arguments?.length || 0,
    condition_type: jobDetails.condition_type,
    upper_limit: jobDetails.upper_limit,
    value_source_type: jobDetails.value_source_type,
    value_source_url: jobDetails.value_source_url,
  });

  return jobDetails;
}

function getTimeframeInSeconds(timeframe: Timeframe): number {
  return (
    (Number(timeframe.days) || 0) * 86400 +
    (Number(timeframe.hours) || 0) * 3600 +
    (Number(timeframe.minutes) || 0) * 60
  );
}

function getIntervalInSeconds(timeInterval: TimeInterval): number {
  return (
    (Number(timeInterval.hours) || 0) * 3600 +
    (Number(timeInterval.minutes) || 0) * 60 +
    (Number(timeInterval.seconds) || 0)
  );
}

function getNetworkIdByName(name: string): number | undefined {
  return networksData.supportedNetworks.find((n) => n.name === name)?.id;
}

function getTaskDefinitionId(argumentType: string, jobType: number): number {
  // Custom script trigger always uses task definition ID 7
  if (jobType === 4) {
    return 7;
  }

  return argumentType === "static"
    ? jobType === 1
      ? 1
      : jobType === 2
        ? 5
        : 3
    : jobType === 1
      ? 2
      : jobType === 2
        ? 6
        : 4;
}

const mapParsedFunctionsToContractFunctions = (
  parsedFunctions: ReturnType<typeof extractFunctions>,
): ContractFunction[] =>
  parsedFunctions.map((func) => ({
    name: func.name,
    inputs: func.inputs.map((input) => ({ type: input.type })),
    outputs: (func.outputs || []).map((output) => ({ type: output.type })),
    stateMutability: func.stateMutability || "nonpayable",
    payable: func.payable ?? func.stateMutability === "payable",
    constant: func.constant ?? false,
  }));

const mapParsedEventsToContractEvents = (
  parsedEvents: ReturnType<typeof extractEvents>,
): ContractEvent[] =>
  parsedEvents.map((event) => ({
    name: event.name,
    inputs: event.inputs.map((input) => ({
      name: input.name,
      type: input.type,
    })),
  }));

function getArgType(argumentType: string): number {
  return argumentType === "static" ? 1 : 2;
}

// Map frontend condition type IDs to backend constants
function mapConditionType(frontendConditionType: string): string {
  const conditionTypeMap: Record<string, string> = {
    equals: "equals",
    not_equals: "not_equals",
    less_than: "less_than",
    greater_than: "greater_than",
    between: "between",
    less_equal: "less_equal",
    greater_equal: "greater_equal",
  };

  return conditionTypeMap[frontendConditionType] || frontendConditionType;
}

// 1. encoding utility functions:

function toBytes32(ipfsHash: string): string {
  // If already 66 chars (0x + 64 hex), return as is
  if (/^0x[0-9a-fA-F]{64}$/.test(ipfsHash)) return ipfsHash;
  // Otherwise, hash the string (keccak256)
  return ethers.keccak256(ethers.toUtf8Bytes(ipfsHash));
}

function encodeJobType1Data(timeInterval: number) {
  return ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [timeInterval]);
}
function encodeJobType2Data(timeInterval: number, ipfsHash: string) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "bytes32"],
    [timeInterval, toBytes32(ipfsHash)],
  );
}
function encodeJobType3or5Data(recurringJob: boolean) {
  return ethers.AbiCoder.defaultAbiCoder().encode(["bool"], [recurringJob]);
}
function encodeJobType4or6Data(recurringJob: boolean, ipfsHash: string) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["bool", "bytes32"],
    [recurringJob, toBytes32(ipfsHash)],
  );
}
function encodeJobType7Data(
  timeInterval: number,
  ipfsHash: string,
  language: string,
) {
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "bytes32", "string"],
    [timeInterval, toBytes32(ipfsHash), language],
  );
}

/**
 * Builds SafeTransaction array from static arguments for Safe wallet jobs
 * @param contractAddress - Target contract address
 * @param abi - Contract ABI as string
 * @param targetFunction - Function signature (e.g., "transfer(address,uint256)")
 * @param argumentValues - Array of argument values as strings
 * @returns Array of SafeTransaction objects
 */
function buildSafeTransactionsFromStaticArgs(
  contractAddress: string,
  abi: string | null,
  targetFunction: string,
  argumentValues: string[],
): SafeTransaction[] {
  if (!abi || !targetFunction || !contractAddress) {
    return [];
  }

  try {
    // Parse ABI
    const abiArray = typeof abi === "string" ? JSON.parse(abi) : abi;
    const contractInterface = new ethers.Interface(abiArray);

    // Try to get function by full signature first, then by name if that fails
    let functionFragment;
    try {
      functionFragment = contractInterface.getFunction(targetFunction);
    } catch {
      // If full signature fails, try with just the function name
      const functionName = targetFunction.split("(")[0];
      functionFragment = contractInterface.getFunction(functionName);
    }

    if (!functionFragment) {
      const functionName = targetFunction.split("(")[0];
      devLog(
        `[buildSafeTransactions] Function ${functionName} not found in ABI`,
      );
      return [];
    }

    // Parse and encode arguments
    // Convert string arguments to appropriate types based on function inputs
    const parsedArgs: any[] = [];
    const functionInputs = functionFragment.inputs;

    for (let i = 0; i < functionInputs.length; i++) {
      const input = functionInputs[i];
      const argValue = argumentValues[i] || "";

      if (!argValue) {
        throw new Error(
          `Missing argument ${i + 1} (${input.name || input.type})`,
        );
      }

      // Parse argument based on type
      let parsedValue: any = argValue;
      if (input.type.startsWith("uint") || input.type.startsWith("int")) {
        parsedValue = BigInt(argValue);
      } else if (input.type === "bool") {
        parsedValue = argValue.toLowerCase() === "true";
      } else if (input.type === "address") {
        parsedValue = argValue; // Addresses are strings
      } else if (input.type.startsWith("bytes")) {
        parsedValue = argValue; // Bytes are hex strings
      } else if (input.type === "string") {
        parsedValue = argValue; // Strings stay as strings
      }

      parsedArgs.push(parsedValue);
    }

    // Encode function call
    const encodedData = contractInterface.encodeFunctionData(
      functionFragment,
      parsedArgs,
    );

    // Create SafeTransaction
    const safeTransaction: SafeTransaction = {
      to: contractAddress,
      value: "0", // Default to 0, can be extended if needed
      data: encodedData,
    };

    return [safeTransaction];
  } catch (error) {
    devLog("[buildSafeTransactions] Error building safe transaction:", error);
    return [];
  }
}

export interface JobFormContextType {
  jobType: number;
  setJobType: React.Dispatch<React.SetStateAction<number>>;
  selectedNetwork: string;
  setSelectedNetwork: React.Dispatch<React.SetStateAction<string>>;
  jobTitle: string;
  setJobTitle: React.Dispatch<React.SetStateAction<string>>;
  timeframe: Timeframe;
  setTimeframe: React.Dispatch<React.SetStateAction<Timeframe>>;
  timeInterval: TimeInterval;
  setTimeInterval: React.Dispatch<React.SetStateAction<TimeInterval>>;
  recurring: boolean;
  setRecurring: React.Dispatch<React.SetStateAction<boolean>>;
  executionMode: "contract" | "safe";
  setExecutionMode: React.Dispatch<React.SetStateAction<"contract" | "safe">>;
  selectedSafeWallet: string | null;
  setSelectedSafeWallet: React.Dispatch<React.SetStateAction<string | null>>;
  userSafeWallets: string[];
  setUserSafeWallets: React.Dispatch<React.SetStateAction<string[]>>;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  customScriptUrl: string;
  setCustomScriptUrl: React.Dispatch<React.SetStateAction<string>>;
  handleJobTypeChange: (
    e: React.MouseEvent<HTMLButtonElement>,
    type: number,
  ) => void;
  handleTimeframeChange: (field: keyof Timeframe, value: string) => void;
  handleTimeIntervalChange: (field: keyof TimeInterval, value: string) => void;
  contractInteractions: ContractInteraction;
  setContractInteractions: React.Dispatch<
    React.SetStateAction<ContractInteraction>
  >;
  handleContractAddressChange: (contractKey: string, value: string) => void;
  handleManualABIChange: (contractKey: string, value: string) => void;
  handleEventChange: (contractKey: string, value: string) => void;
  handleFunctionChange: (contractKey: string, value: string) => void;
  handleArgumentTypeChange: (
    contractKey: string,
    value: "static" | "dynamic" | "",
  ) => void;
  handleArgumentValueChange: (
    contractKey: string,
    index: number,
    value: string,
  ) => void;
  handleIpfsCodeUrlChange: (contractKey: string, value: string) => void;
  handleSourceTypeChange: (contractKey: string, value: string) => void;
  handleSourceUrlChange: (contractKey: string, value: string) => void;
  handleApiKeySelection: (contractKey: string, apiKeyValue: string) => void;
  handleConditionTypeChange: (contractKey: string, value: string) => void;
  handleUpperLimitChange: (contractKey: string, value: string) => void;
  handleLowerLimitChange: (contractKey: string, value: string) => void;
  handleSafeTransactionsChange: (
    contractKey: string,
    transactions: SafeTransaction[],
  ) => void;
  linkedJobs: { [key: number]: number[] };
  handleLinkJob: (jobType: number) => void;
  handleDeleteLinkedJob: (jobType: number, jobId: number) => void;
  validateTimeframe: (tf?: Timeframe) => string | null;
  validateTimeInterval: (ti?: TimeInterval, jt?: number) => string | null;
  validateJobTitle: (title?: string) => string | null;
  validateABI: (contractKey: string) => string | null;
  jobTitleError: string | null;
  setJobTitleError: React.Dispatch<React.SetStateAction<string | null>>;
  jobTitleErrorRef: React.RefObject<HTMLDivElement | null>;
  errorFrame: string | null;
  setErrorFrame: React.Dispatch<React.SetStateAction<string | null>>;
  errorFrameRef: React.RefObject<HTMLDivElement | null>;
  errorInterval: string | null;
  setErrorInterval: React.Dispatch<React.SetStateAction<string | null>>;
  errorIntervalRef: React.RefObject<HTMLDivElement | null>;
  contractErrors: Record<string, string | null>;
  setContractErrors: React.Dispatch<
    React.SetStateAction<Record<string, string | null>>
  >;
  extractJobDetails: typeof extractJobDetails;
  getTimeframeInSeconds: typeof getTimeframeInSeconds;
  getIntervalInSeconds: typeof getIntervalInSeconds;
  getNetworkIdByName: typeof getNetworkIdByName;
  getTaskDefinitionId: typeof getTaskDefinitionId;
  getArgType: typeof getArgType;
  estimatedFee: number;
  setEstimatedFee: React.Dispatch<React.SetStateAction<number>>;
  estimatedFeeInWei: bigint | null;
  setEstimatedFeeInWei: React.Dispatch<React.SetStateAction<bigint | null>>;
  feePerExecution: bigint | null;
  setFeePerExecution: React.Dispatch<React.SetStateAction<bigint | null>>;
  desiredExecutions: number;
  setDesiredExecutions: React.Dispatch<React.SetStateAction<number>>;
  calculatedExecutions: number | null;
  setCalculatedExecutions: React.Dispatch<React.SetStateAction<number | null>>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  estimateFee: (jobDetails: JobDetails) => Promise<void>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  isJobCreated: boolean;
  setIsJobCreated: React.Dispatch<React.SetStateAction<boolean>>;
  contractInteractionSuccessful: boolean;
  setContractInteractionSuccessful: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  lastJobId: string | undefined;
  setLastJobId: React.Dispatch<React.SetStateAction<string | undefined>>;
  handleTopUpETH: () => Promise<boolean>;
  handleCreateJob: (jobId?: string) => Promise<boolean>;
  handleSetABI: (contractKey: string, value: string) => void;
  handleSetContractDetails: (
    contractKey: string,
    address: string,
    abiString: string,
  ) => void;
  hasConfirmedPermission: boolean;
  setHasConfirmedPermission: React.Dispatch<React.SetStateAction<boolean>>;
  permissionError: string | null;
  setPermissionError: React.Dispatch<React.SetStateAction<string | null>>;
  resetContractInteractionState: () => void;
  reset: () => void;
}

export const JobFormContext = createContext<JobFormContextType | undefined>(
  undefined,
);

export const JobFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [jobType, setJobType] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState<string>(
    networksData.supportedNetworks[0].name,
  );
  const [jobTitle, setJobTitle] = useState<string>("");
  const [timeframe, setTimeframe] = useState<Timeframe>({
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const [timeInterval, setTimeInterval] = useState<TimeInterval>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [recurring, setRecurring] = useState<boolean>(true);
  const [contractInteractions, setContractInteractions] =
    useState<ContractInteraction>({
      eventContract: {
        address: "",
        abi: null,
        isCheckingABI: false,
        manualABI: "",
        events: [],
        targetEvent: "",
        selectedEventArgument: "",
        eventArgumentValue: "",
        functions: [],
        targetFunction: "",
        argumentType: "static",
        argumentValues: [],
        ipfsCodeUrl: "",
        ipfsCodeUrlError: "",
        sourceType: "api",
        sourceUrl: "",
        sourceUrlError: "",
        conditionType: "",
        upperLimit: "",
        lowerLimit: "",
        apiKeys: [],
        selectedApiKey: "",
        selectedApiKeyValue: "",
        isFetchingApiKeys: false,
        apiKeysError: "",
        isProxy: false,
        implementationAddress: undefined,
        proxyType: undefined,
        safeTransactions: [],
      },
      contract: {
        address: "",
        abi: null,
        isCheckingABI: false,
        manualABI: "",
        events: [],
        targetEvent: "",
        functions: [],
        targetFunction: "",
        argumentType: "",
        argumentValues: [],
        ipfsCodeUrl: "",
        ipfsCodeUrlError: "",
        sourceType: "api",
        sourceUrl: "",
        sourceUrlError: "",
        conditionType: "",
        upperLimit: "",
        lowerLimit: "",
        apiKeys: [],
        selectedApiKey: "",
        selectedApiKeyValue: "",
        isFetchingApiKeys: false,
        apiKeysError: "",
        isProxy: false,
        implementationAddress: undefined,
        proxyType: undefined,
        safeTransactions: [],
      },
    });
  const [linkedJobs, setLinkedJobs] = useState<{ [key: number]: number[] }>({});
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [estimatedFeeInWei, setEstimatedFeeInWei] = useState<bigint | null>(
    null,
  );
  const [feePerExecution, setFeePerExecution] = useState<bigint | null>(null);
  const [desiredExecutions, setDesiredExecutions] = useState<number>(5);
  const [calculatedExecutions, setCalculatedExecutions] = useState<
    number | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isJobCreated, setIsJobCreated] = useState<boolean>(false);
  const [contractInteractionSuccessful, setContractInteractionSuccessful] =
    useState<boolean>(false);
  const [lastJobId, setLastJobId] = useState<string | undefined>(undefined);
  const [hasConfirmedPermission, setHasConfirmedPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [executionMode, setExecutionMode] = useState<"contract" | "safe">(
    "contract",
  );
  const [selectedSafeWallet, setSelectedSafeWallet] = useState<string | null>(
    null,
  );
  const [userSafeWallets, setUserSafeWallets] = useState<string[]>([]);
  const [language, setLanguage] = useState<string>("");
  const [customScriptUrl, setCustomScriptUrl] = useState<string>("");

  React.useEffect(() => {
    setContractInteractions((prev) => ({
      ...prev,
      contract: {
        ...prev.contract,
        ipfsCodeUrl: "",
        ipfsCodeUrlError: "",
      },
    }));
  }, [executionMode]);

  // Update total fee when desiredExecutions changes (for non-time-interval jobs)
  React.useEffect(() => {
    if (feePerExecution && calculatedExecutions === null) {
      // Only recalculate for non-time-interval jobs
      const totalFeeWei = feePerExecution * BigInt(desiredExecutions);
      setEstimatedFeeInWei(totalFeeWei);
      const totalFeeETH = Number(totalFeeWei) / 1e18;
      setEstimatedFee(totalFeeETH);
      devLog(
        "Updated total fee for",
        desiredExecutions,
        "executions:",
        totalFeeWei.toString(),
        "Wei",
      );
    }
  }, [desiredExecutions, feePerExecution, calculatedExecutions]);

  // Error refs (must be stable, not recreated on every render)
  const jobTitleErrorRef = React.useRef<HTMLDivElement | null>(null);
  const errorFrameRef = React.useRef<HTMLDivElement | null>(null);
  const errorIntervalRef = React.useRef<HTMLDivElement | null>(null);

  // Error states
  const [jobTitleError, setJobTitleError] = useState<string | null>(null);
  const [errorFrame, setErrorFrame] = useState<string | null>(null);
  const [errorInterval, setErrorInterval] = useState<string | null>(null);
  const [contractErrors, setContractErrors] = useState<
    Record<string, string | null>
  >({});

  // Get ETH balance context
  const { fetchBalance } = useTriggerBalance();
  const { stakeRegistryAddress } = useStakeRegistry();
  const chainId = useChainId();

  // Refetch ETH balance when selectedNetwork changes
  React.useEffect(() => {
    fetchBalance();
  }, [selectedNetwork, fetchBalance]);

  // Refetch ABI for all contracts when selectedNetwork changes
  React.useEffect(() => {
    Object.entries(contractInteractions).forEach(([contractKey, contract]) => {
      if (contract.address && ethers.isAddress(contract.address)) {
        handleContractAddressChange(contractKey, contract.address);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNetwork]);

  const handleJobTypeChange = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, type: number) => {
      e.preventDefault();
      setJobType(type);
    },
    [],
  );

  const handleTimeframeChange = useCallback(
    (field: keyof Timeframe, value: string) => {
      setTimeframe((prev) => ({
        ...prev,
        [field]: parseInt(value) || 0,
      }));
    },
    [],
  );

  const handleTimeIntervalChange = useCallback(
    (field: keyof TimeInterval, value: string) => {
      setTimeInterval((prev) => ({
        ...prev,
        [field]: parseInt(value) || 0,
      }));
    },
    [],
  );

  const handleContractAddressChange = useCallback(
    async (contractKey: string, value: string) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          address: value,
          isCheckingABI: true,
          events: [],
          functions: [],
          targetFunction: "",
          targetEvent: "",
          manualABI: "",
          // Reset proxy-related fields
          isProxy: false,
          implementationAddress: undefined,
          proxyType: undefined,
        },
      }));

      if (ethers.isAddress(value)) {
        // First, try to detect if it's a proxy contract
        let proxyInfo: {
          isProxy: boolean;
          implementationAddress?: string;
          proxyType?: string;
        } = {
          isProxy: false,
          implementationAddress: undefined,
          proxyType: undefined,
        };

        try {
          const { detectProxyAndGetImplementation, getProviderForChain } =
            await import("@/utils/proxyDetection");
          const provider = getProviderForChain(
            getNetworkIdByName(selectedNetwork) || 1,
          );
          const detectedProxy = await detectProxyAndGetImplementation(
            value,
            provider,
          );
          proxyInfo = {
            isProxy: detectedProxy.isProxy,
            implementationAddress: detectedProxy.implementationAddress,
            proxyType: detectedProxy.proxyType,
          };
        } catch (proxyError) {
          devLog(`Error detecting proxy: ${proxyError}`);
        }

        // Fetch ABI - if it's a proxy, fetch from implementation address
        try {
          let abiString: string | null = null;

          if (proxyInfo.isProxy && proxyInfo.implementationAddress) {
            // For proxy contracts, fetch ABI from implementation address
            devLog(
              `Fetching ABI for proxy implementation: ${proxyInfo.implementationAddress}`,
            );
            abiString = await fetchContractABI(
              proxyInfo.implementationAddress,
              getNetworkIdByName(selectedNetwork),
              true, // Skip proxy detection since we already know this is the implementation
            );
          } else {
            // For regular contracts, fetch ABI from original address
            abiString = await fetchContractABI(
              value,
              getNetworkIdByName(selectedNetwork),
              false, // Allow proxy detection for regular contracts
            );
          }

          if (abiString) {
            const parseResult = parseABI(abiString);
            if (!parseResult.success || !parseResult.abi) {
              throw new Error(parseResult.error || "Invalid ABI format");
            }
            const parsedFunctions = extractFunctions(parseResult.abi, true);
            const functions =
              mapParsedFunctionsToContractFunctions(parsedFunctions);
            const parsedEvents = extractEvents(parseResult.abi);
            const events = mapParsedEventsToContractEvents(parsedEvents);

            setContractInteractions((prev) => ({
              ...prev,
              [contractKey]: {
                ...prev[contractKey],
                abi: abiString,
                events,
                functions,
                isCheckingABI: false,
                isProxy: proxyInfo.isProxy,
                implementationAddress: proxyInfo.implementationAddress,
                proxyType: proxyInfo.proxyType,
              },
            }));
          } else {
            setContractInteractions((prev) => ({
              ...prev,
              [contractKey]: {
                ...prev[contractKey],
                abi: null,
                events: [],
                functions: [],
                isCheckingABI: false,
                isProxy: proxyInfo.isProxy,
                implementationAddress: proxyInfo.implementationAddress,
                proxyType: proxyInfo.proxyType,
              },
            }));
          }
        } catch {
          setContractInteractions((prev) => ({
            ...prev,
            [contractKey]: {
              ...prev[contractKey],
              abi: null,
              events: [],
              functions: [],
              isCheckingABI: false,
              isProxy: proxyInfo.isProxy,
              implementationAddress: proxyInfo.implementationAddress,
              proxyType: proxyInfo.proxyType,
            },
          }));
        }
      } else {
        setContractInteractions((prev) => ({
          ...prev,
          [contractKey]: {
            ...prev[contractKey],
            abi: null,
            events: [],
            functions: [],
            isCheckingABI: false,
            isProxy: false,
            implementationAddress: undefined,
            proxyType: undefined,
          },
        }));
      }
    },
    [selectedNetwork],
  );

  const handleManualABIChange = useCallback(
    (contractKey: string, value: string) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          manualABI: value,
        },
      }));

      try {
        const parseResult = parseABI(value);
        if (!parseResult.success || !parseResult.abi) {
          throw new Error(parseResult.error || "Invalid ABI format");
        }
        const parsedFunctions = extractFunctions(parseResult.abi, true);
        const functions =
          mapParsedFunctionsToContractFunctions(parsedFunctions);
        const parsedEvents = extractEvents(parseResult.abi);
        const events = mapParsedEventsToContractEvents(parsedEvents);

        setContractInteractions((prev) => ({
          ...prev,
          [contractKey]: {
            ...prev[contractKey],
            abi: value,
            events,
            functions,
          },
        }));
      } catch (error) {
        console.error("Invalid ABI format:", error);
        setContractInteractions((prev) => ({
          ...prev,
          [contractKey]: {
            ...prev[contractKey],
            abi: null,
            events: [],
            functions: [],
          },
        }));
      }
    },
    [],
  );

  const handleEventChange = useCallback(
    (contractKey: string, value: string) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          targetEvent: value,
        },
      }));
    },
    [],
  );

  const handleFunctionChange = useCallback(
    (contractKey: string, value: string) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          targetFunction: value,
          ipfsCodeUrl: "",
          ipfsCodeUrlError: "",
        },
      }));
    },
    [],
  );

  const handleArgumentTypeChange = useCallback(
    (contractKey: string, value: "static" | "dynamic" | "") => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          argumentType: value,
          ipfsCodeUrl: "",
          ipfsCodeUrlError: "",
        },
      }));
    },
    [],
  );

  const handleArgumentValueChange = useCallback(
    (contractKey: string, index: number, value: string) => {
      setContractInteractions((prev) => {
        const prevValues = prev[contractKey].argumentValues || [];
        const updatedValues = [...prevValues];
        updatedValues[index] = value;
        return {
          ...prev,
          [contractKey]: {
            ...prev[contractKey],
            argumentValues: updatedValues,
          },
        };
      });
    },
    [],
  );

  const handleIpfsCodeUrlChange = useCallback(
    (contractKey: string, value: string) => {
      let error = "";
      // Simple validation: must start with ipfs:// or https:// or be a CID (alphanumeric, length >= 46)
      if (
        !value.startsWith("ipfs://") &&
        !value.startsWith("https://") &&
        value.length < 46
      ) {
        error = "Invalid IPFS URL or CID";
      }
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          ipfsCodeUrl: value,
          ipfsCodeUrlError: error,
        },
      }));
    },
    [],
  );

  const handleSourceTypeChange = useCallback(
    (contractKey: string, value: string) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          sourceType: value,
        },
      }));
    },
    [],
  );

  const handleSourceUrlChange = useCallback(
    async (contractKey: string, value: string) => {
      let error = "";
      // Simple validation: must be a non-empty string and look like a URL
      if (!value || !/^https?:\/\//.test(value)) {
        error = "Invalid URL. Must start with http:// or https://";
      }

      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          sourceUrl: value,
          sourceUrlError: error,
          isFetchingApiKeys: !error,
          apiKeys: [],
          selectedApiKey: "",
          apiKeysError: "",
        },
      }));

      // If URL is valid, try to fetch API keys
      if (!error && value) {
        try {
          setContractInteractions((prev) => ({
            ...prev,
            [contractKey]: {
              ...prev[contractKey],
              isFetchingApiKeys: true,
              apiKeysError: "",
            },
          }));

          const apiKeys = await fetchApiKeys(value);

          setContractInteractions((prev) => {
            const firstKey =
              apiKeys && apiKeys.length > 0 ? apiKeys[0] : undefined;
            const defaultSelectedValue = firstKey ? String(firstKey.value) : "";
            const defaultActualValue = firstKey
              ? String(firstKey.originalValue || firstKey.value)
              : "";

            return {
              ...prev,
              [contractKey]: {
                ...prev[contractKey],
                apiKeys,
                isFetchingApiKeys: false,
                apiKeysError: "",
                // Initialize selection so downstream submission has a value even if user doesn't click
                selectedApiKey:
                  prev[contractKey].selectedApiKey &&
                    prev[contractKey].selectedApiKey !== ""
                    ? prev[contractKey].selectedApiKey
                    : defaultSelectedValue,
                selectedApiKeyValue:
                  prev[contractKey].selectedApiKeyValue &&
                    prev[contractKey].selectedApiKeyValue !== ""
                    ? prev[contractKey].selectedApiKeyValue
                    : defaultActualValue,
              },
            };
          });
        } catch (fetchError) {
          setContractInteractions((prev) => ({
            ...prev,
            [contractKey]: {
              ...prev[contractKey],
              isFetchingApiKeys: false,
              apiKeysError:
                fetchError instanceof Error
                  ? fetchError.message
                  : "Failed to fetch API keys",
            },
          }));
        }
      }
    },
    [],
  );

  const handleApiKeySelection = useCallback(
    (contractKey: string, apiKeyValue: string) => {
      setContractInteractions((prev) => {
        const contract = prev[contractKey];
        const selectedApiKey = contract.apiKeys?.find(
          (key) => String(key.value) === apiKeyValue,
        );

        // Get the actual value from the selected API key
        let actualValue = "";
        if (selectedApiKey) {
          // Use the originalValue if available, otherwise use the value
          actualValue = selectedApiKey.originalValue || selectedApiKey.value;
        } else {
          // Fallback to the apiKeyValue if no API key found
          actualValue = apiKeyValue;
        }

        // Ensure we have a string value
        if (typeof actualValue !== "string") {
          actualValue = String(actualValue);
        }

        return {
          ...prev,
          [contractKey]: {
            ...contract,
            selectedApiKey: apiKeyValue, // Unique identifier for radio button
            selectedApiKeyValue: actualValue, // Actual value to be used
          },
        };
      });
    },
    [],
  );

  const handleConditionTypeChange = useCallback(
    (contractKey: string, value: string) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          conditionType: value,
          // Reset lowerLimit if not "In Range"
          lowerLimit: value === "In Range" ? prev[contractKey].lowerLimit : "0",
        },
      }));
    },
    [],
  );

  const handleUpperLimitChange = useCallback(
    (contractKey: string, value: string) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          upperLimit: value,
        },
      }));
    },
    [],
  );

  const handleLowerLimitChange = useCallback(
    (contractKey: string, value: string) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          lowerLimit: value,
        },
      }));
    },
    [],
  );

  const handleSafeTransactionsChange = useCallback(
    (contractKey: string, transactions: SafeTransaction[]) => {
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          safeTransactions: transactions,
        },
      }));
    },
    [],
  );

  const handleLinkJob = useCallback((jobType: number) => {
    setLinkedJobs((prevJobs) => {
      const existingJobs = prevJobs[jobType] || [];
      if (existingJobs.length < 3) {
        const newJobId = existingJobs.length + 1;

        setContractInteractions((prevDetails) => {
          const newDetails: ContractInteraction = {
            ...prevDetails,
            [`${jobType}-${newJobId}`]: {
              address: "",
              abi: null,
              isCheckingABI: false,
              manualABI: "",
              events: [],
              targetEvent: "",
              functions: [],
              targetFunction: "",
              argumentType: "static",
              argumentValues: [],
              ipfsCodeUrl: "",
              ipfsCodeUrlError: "",
              sourceType: "api",
              sourceUrl: "",
              sourceUrlError: "",
              conditionType: "",
              upperLimit: "",
              lowerLimit: "",
              apiKeys: [],
              selectedApiKey: "",
              selectedApiKeyValue: "",
              isFetchingApiKeys: false,
              apiKeysError: "",
              isProxy: false,
              implementationAddress: undefined,
              proxyType: undefined,
            },
          };
          return newDetails;
        });

        return {
          ...prevJobs,
          [jobType]: [...existingJobs, newJobId],
        };
      }
      return prevJobs;
    });
  }, []);

  const handleDeleteLinkedJob = useCallback(
    (jobType: number, jobId: number) => {
      setLinkedJobs((prevJobs) => {
        const updatedJobs = {
          ...prevJobs,
          [jobType]: prevJobs[jobType].filter((id) => id !== jobId),
        };

        // Re-index the remaining jobs
        if (updatedJobs[jobType]) {
          updatedJobs[jobType] = updatedJobs[jobType].map(
            (id, index) => index + 1,
          ); // Re-index from 1
        }

        // If there are no linked jobs left for this jobType, remove the jobType entry
        if (updatedJobs[jobType]?.length === 0) {
          delete updatedJobs[jobType];
        }

        return updatedJobs;
      });

      setContractInteractions((prevDetails) => {
        const updatedDetails: ContractInteraction = { ...prevDetails };

        // Get all job keys for this jobType and sort them
        const jobKeys = Object.keys(updatedDetails)
          .filter((key) => key.startsWith(`${jobType}-`))
          .sort((a, b) => {
            const aId = parseInt(a.split("-")[1]);
            const bId = parseInt(b.split("-")[1]);
            return aId - bId;
          });

        if (jobKeys.length === 0) {
          return updatedDetails; // No linked jobs, nothing to do
        }

        // Shift all contract details up starting from the deleted job
        for (let i = jobId; i < jobKeys.length; i++) {
          const currentKey = `${jobType}-${i}`;
          const nextKey = `${jobType}-${i + 1}`;

          if (updatedDetails[nextKey]) {
            updatedDetails[currentKey] = updatedDetails[nextKey];
          }
        }

        // Delete the last key
        const lastKey = jobKeys[jobKeys.length - 1];
        delete updatedDetails[lastKey];

        return updatedDetails;
      });
    },
    [],
  );

  // Helper function to get job registry address for current chain
  const getJobRegistryAddressForCurrentChain = useCallback(() => {
    return getJobRegistryAddress(chainId);
  }, [chainId]);

  // Validation helpers
  const validateTimeframe = (tf: Timeframe = timeframe) => {
    if (tf.days === 0 && tf.hours === 0 && tf.minutes === 0) {
      return "Please set a valid timeframe before submitting.";
    }
    return null;
  };

  const validateTimeInterval = (
    ti: TimeInterval = timeInterval,
    jt: number = jobType,
  ) => {
    if (jt === 1) {
      if (
        (ti.hours === 0 && ti.minutes === 0 && ti.seconds === 0) ||
        ti.hours * 3600 + ti.minutes * 60 + ti.seconds < 30
      ) {
        return "Please set a valid time interval of at least 30 seconds before submitting.";
      }
    }
    return null;
  };

  const validateJobTitle = (title: string = jobTitle) => {
    if (!title || title.trim() === "") {
      return "Job title is required.";
    }
    return null;
  };

  const validateABI = (contractKey: string): string | null => {
    const contract = contractInteractions[contractKey];
    if (!contract) return "Contract not found.";
    if (!contract.abi || contract.abi === null || contract.abi === "") {
      return "Contract ABI must be verified or provided manually.";
    }
    return null;
  };

  const estimateFee = async (jobDetails: JobDetails) => {
    try {
      if (!jobDetails) {
        throw new Error("Job details are required to estimate fee");
      }

      const {
        task_definition_id: taskDefinitionId,
        time_frame: timeframeInSeconds,
        time_interval: intervalInSeconds,
        dynamic_arguments_script_url: codeUrls,
        target_chain_id: targetChainId,
        target_contract_address: targetContractAddress,
        target_function: targetFunction,
        abi: contractAbi,
        arguments: jobArguments,
      } = jobDetails;

      if (!taskDefinitionId) {
        throw new Error("Task definition ID is missing");
      }
      if (!targetContractAddress || !targetFunction || !contractAbi) {
        throw new Error("Job details are missing contract information");
      }

      // Calculate execution count based on task definition ID
      let executionCount: number;
      const intervalSeconds = intervalInSeconds || 0;
      // For time-interval based jobs (taskDefinitionId 1, 2)
      if (taskDefinitionId === 1 || taskDefinitionId === 2) {
        if (!intervalSeconds || intervalSeconds <= 0) {
          throw new Error("Time interval must be greater than 0 for this job");
        }
        executionCount = Math.floor(
          (timeframeInSeconds || 0) / intervalSeconds,
        );
        setCalculatedExecutions(executionCount);
        devLog(
          "Calculated execution count for time-interval job:",
          executionCount,
          "timeframe:",
          timeframeInSeconds,
          "interval:",
          intervalInSeconds,
        );
      } else {
        // For other job types (condition-based, event-based), use desiredExecutions (default 5)
        executionCount = desiredExecutions;
        setCalculatedExecutions(null); // Not auto-calculated
        devLog("Using desired execution count:", executionCount);
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_BASE_URL) {
        throw new Error(
          "NEXT_PUBLIC_API_BASE_URL is not defined in your environment variables.",
        );
      }

      // Prepare arguments array for fee estimation using job details
      const args = jobArguments || [];
      const argsToSend = args.length > 0 ? args : [];

      // Build query parameters
      const params = new URLSearchParams();
      if (codeUrls) params.append("ipfs_url", codeUrls);
      params.append("task_definition_id", taskDefinitionId.toString());
      params.append("target_chain_id", targetChainId?.toString() || "");
      params.append("target_contract_address", targetContractAddress);
      params.append("target_function", targetFunction);
      params.append(
        "abi",
        typeof contractAbi === "string"
          ? contractAbi
          : JSON.stringify(contractAbi),
      );
      // Always append args, even if empty array
      params.append("args", JSON.stringify(argsToSend));

      devLog("Fetching fee estimation with params:", {
        ipfs_url: codeUrls,
        task_definition_id: taskDefinitionId,
        target_chain_id: targetChainId,
        target_contract_address: targetContractAddress,
        target_function: targetFunction,
        args: argsToSend,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/fees?${params.toString()}`,
        {
          method: "GET",
          headers: { "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "" },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get fees: ${errorText}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Backend returns job_cost_prediction in Wei per execution
      const feePerExecutionWei = BigInt(
        data.job_cost_prediction || data.total_fee || 0,
      );
      const totalFeeWei = feePerExecutionWei * BigInt(executionCount);

      devLog(
        "Fee per execution (Wei):",
        feePerExecutionWei.toString(),
        "Total fee for",
        executionCount,
        "executions (Wei):",
        totalFeeWei.toString(),
      );

      setFeePerExecution(feePerExecutionWei);
      setEstimatedFeeInWei(totalFeeWei);

      // Convert Wei to ETH for display purposes (divide by 1e18)
      const totalFeeETH = Number(totalFeeWei) / 1e18;
      setEstimatedFee(totalFeeETH);

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error estimating fee:", error);
      toast.error("Failed to estimate fee: " + (error as Error).message);
    }
  };

  const handleTopUpETH = async (): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask to use this feature");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (!stakeRegistryAddress) {
        throw new Error("Stake registry address not configured");
      }

      if (!estimatedFeeInWei) {
        throw new Error("No estimated fee available");
      }

      // Convert Wei to ETH for the stake amount (divide by 1e18)
      const requiredEth = Number(estimatedFeeInWei) / 1e18;

      const contract = new ethers.Contract(
        stakeRegistryAddress,
        ["function depositETH(uint256 ethAmount) external payable"],
        signer,
      );

      devLog("Staking ETH amount:", requiredEth.toString());
      devLog("Staking Wei amount:", estimatedFeeInWei.toString());

      const tx = await contract.depositETH(estimatedFeeInWei, {
        value: estimatedFeeInWei,
      });
      await tx.wait();
      devLog("Stake transaction confirmed: ", tx.hash);

      await fetchBalance();

      // After successful staking, proceed to create job
      // await handleCreateJob();
      return true;
    } catch (error) {
      devLog("Error topping up ETH: " + (error as Error).message);
      toast.error("Error topping up ETH");

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  function trimObjectStrings<T>(obj: T): T {
    if (obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => {
        if (typeof item === "string") {
          return item.trim();
        } else if (typeof item === "object" && item !== null) {
          return trimObjectStrings(item);
        }
        return item;
      }) as T;
    }

    // Handle primitive strings that are not part of an array or object
    if (typeof obj === "string") {
      return (obj as string).trim() as T;
    }

    // If it's an object (and not an array or primitive string)
    if (typeof obj === "object") {
      // We can safely assert it's a Record<string, unknown> to iterate its keys
      const castObj = obj as Record<string, unknown>;
      const trimmedObj: Record<string, unknown> = {};

      for (const key in castObj) {
        if (Object.prototype.hasOwnProperty.call(castObj, key)) {
          const value = castObj[key];
          if (typeof value === "string") {
            trimmedObj[key] = value.trim();
          } else if (typeof value === "object" && value !== null) {
            trimmedObj[key] = trimObjectStrings(value);
          } else {
            trimmedObj[key] = value;
          }
        }
      }
      return trimmedObj as T;
    }

    // For any other primitive types (number, boolean, undefined, symbol, bigint)
    return obj;
  }

  const handleCreateJob = async (jobId?: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask to use this feature");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get network ID
      const networkId = getNetworkIdByName(selectedNetwork);
      if (!networkId) {
        throw new Error("Invalid network selected");
      }

      console.log("[handleCreateJob] Starting job creation process...");
      console.log("[handleCreateJob] Job configuration:", {
        jobTitle,
        jobType,
        executionMode,
        selectedNetwork,
        networkId,
        selectedSafeWallet,
        chainId,
        timeframe,
        timeInterval,
        recurring,
        language,
      });

      // Extract all job details from contract interactions
      const allJobDetails: JobDetails[] = [];
      const linkedJobDetails: JobDetails[] = [];

      console.log("[handleCreateJob] Processing contract interactions:", {
        contractKeys: Object.keys(contractInteractions),
        contractCount: Object.keys(contractInteractions).length,
      });

      // Extract job details for each contract interaction
      Object.keys(contractInteractions).forEach((contractKey) => {
        const contract = contractInteractions[contractKey];

        console.log("[handleCreateJob] Processing contract:", contractKey, {
          hasTargetFunction: !!contract.targetFunction,
          hasAbi: !!contract.abi,
          hasSafeTransactions: !!contract.safeTransactions,
          safeTransactionsCount: contract.safeTransactions?.length || 0,
        });

        // Skip contracts that don't have required data
        // For jobType 4 (custom script), we don't need targetFunction or abi
        if (jobType !== 4 && (!contract.targetFunction || !contract.abi)) {
          console.log(
            "[handleCreateJob] Skipping contract (missing targetFunction or ABI):",
            contractKey,
          );
          return;
        }

        const timeframeInSeconds = getTimeframeInSeconds(timeframe);
        const intervalInSeconds = getIntervalInSeconds(timeInterval);

        const jobDetails = extractJobDetails(
          contractKey,
          contractInteractions,
          jobTitle,
          timeframeInSeconds,
          intervalInSeconds,
          recurring,
          userAddress,
          networkId,
          jobType,
          language || "go",
          executionMode,
          selectedSafeWallet,
          chainId,
          userSafeWallets,
          customScriptUrl,
        );

        // Check if this is a linked job (contractKey format: "jobType-jobId")
        if (contractKey.includes("-")) {
          linkedJobDetails.push(jobDetails);
          console.log("[handleCreateJob] Added linked job:", contractKey);
        } else {
          allJobDetails.push(jobDetails);
          console.log("[handleCreateJob] Added main job:", contractKey);
        }
      });

      console.log("[handleCreateJob] Job details extracted:", {
        mainJobsCount: allJobDetails.length,
        linkedJobsCount: linkedJobDetails.length,
      });

      const updatedJobDetails: Array<
        Omit<JobDetails, "job_id"> & { job_id?: string }
      > = allJobDetails.map((jobDetail) => ({
        ...jobDetail,
        job_cost_prediction: estimatedFee,
        is_imua: process.env.NEXT_PUBLIC_IS_IMUA === "true",
        created_chain_id: networkId.toString(),
      }));

      const updatedLinkedJobDetails: Array<
        Omit<JobDetails, "job_id"> & { job_id?: string }
      > = linkedJobDetails.map((jobDetail) => ({
        ...jobDetail,
        job_cost_prediction: estimatedFee,
        is_imua: process.env.NEXT_PUBLIC_IS_IMUA === "true",
        created_chain_id: networkId.toString(),
      }));

      console.log(
        "[handleCreateJob] Final job details prepared for submission:",
        {
          mainJobs: updatedJobDetails.map((jd) => ({
            job_title: jd.job_title,
            task_definition_id: jd.task_definition_id,
            target_contract: jd.target_contract_address,
            target_function: jd.target_function,
            is_safe: jd.is_safe,
            safe_address: jd.safe_address,
            safe_transactions_count: jd.safe_transactions?.length || 0,
            arguments: jd.arguments,
            condition_type: jd.condition_type,
            upper_limit: jd.upper_limit,
            value_source_url: jd.value_source_url,
          })),
          linkedJobsCount: updatedLinkedJobDetails.length,
          estimatedFee,
        },
      );

      // --- ENCODING LOGIC FOR CONTRACT CALL ---
      let encodedData: string = "0x";
      if (updatedJobDetails.length > 0) {
        const jd = updatedJobDetails[0];
        // Get task definition ID to determine encoding format
        const taskDefinitionId = jd.task_definition_id;

        // Validate task definition ID for job type
        if (jobType === 2 && taskDefinitionId === 2) {
          throw new Error("Invalid task definition ID for condition-based job");
        }
        if (taskDefinitionId === 1) {
          // Time-based, no IPFS
          encodedData = encodeJobType1Data(jd.time_interval);
        } else if (taskDefinitionId === 2) {
          encodedData = encodeJobType2Data(
            jd.time_interval,
            jd.dynamic_arguments_script_url || "",
          );
        } else if (taskDefinitionId === 3 || taskDefinitionId === 5) {
          encodedData = encodeJobType3or5Data(jd.recurring);
        } else if (taskDefinitionId === 4 || taskDefinitionId === 6) {
          // Recurring flag + IPFS
          encodedData = encodeJobType4or6Data(
            jd.recurring,
            jd.dynamic_arguments_script_url || "",
          );
        } else if (taskDefinitionId === 7) {
          // Custom script: time interval + IPFS hash + language
          const ipfsBytes32 = ethers.id(jd.dynamic_arguments_script_url || "");
          encodedData = encodeJobType7Data(
            jd.time_interval,
            ipfsBytes32,
            jd.language || "typescript",
          );
        } else {
          throw new Error(`Unknown task definition ID: ${taskDefinitionId}`);
        }

        // --- ACTUAL CONTRACT CALL ---
        try {
          // Check if we should skip contract interaction (if it was already successful)
          const shouldSkipContract =
            !jobId && contractInteractionSuccessful && lastJobId;

          if (shouldSkipContract) {
            devLog(
              "[JobForm] Skipping contract interaction - already successful, using last job ID:",
              lastJobId,
            );
            updatedJobDetails[0].job_id = lastJobId;
          } else if (jobId) {
            const urlParams = new URLSearchParams(window.location.search);
            const oldJobName = urlParams.get("oldJobName") || "";
            const oldJobType = urlParams.get("jobType") || "";
            const oldTimeFrame = urlParams.get("oldTimeFrame") || "";
            const oldTargetContract = urlParams.get("targetContract") || "";
            let oldDataDecoded: OldDataDecoded = {};
            try {
              oldDataDecoded =
                JSON.parse(urlParams.get("oldData") || "{}") || {};
            } catch (parseError) {
              console.log("[JobForm] Error parsing oldData:", parseError);
            }

            // Map string jobType to number
            const triggerTypeMap: Record<string, number> = {
              "Time-based": 1,
              "Condition-based": 2,
              "Event-based": 3,
            };
            const oldJobTypeNum = triggerTypeMap[oldJobType] || 1;

            // Encode oldData using the same logic as newData
            let oldEncodedData = "0x";
            if (oldJobTypeNum === 1) {
              oldEncodedData = encodeJobType1Data(
                Number(oldDataDecoded.timeInterval ?? 0),
              );
            } else if (oldJobTypeNum === 2) {
              oldEncodedData = encodeJobType2Data(
                Number(oldDataDecoded.timeInterval ?? 0),
                oldDataDecoded.dynamic_arguments_script_url ?? "",
              );
            } else if (oldJobTypeNum === 3 || oldJobTypeNum === 5) {
              oldEncodedData = encodeJobType3or5Data(
                Boolean(oldDataDecoded.recurring ?? false),
              );
            } else if (oldJobTypeNum === 4 || oldJobTypeNum === 6) {
              oldEncodedData = encodeJobType4or6Data(
                Boolean(oldDataDecoded.recurring ?? false),
                oldDataDecoded.dynamic_arguments_script_url ?? "",
              );
            } else if (oldJobTypeNum === 7) {
              oldEncodedData = encodeJobType7Data(
                Number(oldDataDecoded.timeInterval ?? 0),
                oldDataDecoded.dynamic_arguments_script_url ?? "",
                oldDataDecoded.language ?? "typescript",
              );
            }

            // New values from form state
            const newJobName = jd.job_title;
            const newTimeFrame = jd.time_frame;
            const newEncodedData = encodedData;

            // Print in required format
            devLog("[JobForm] updateJob arguments:", {
              jobId,
              oldJobName,
              jobType: oldJobTypeNum,
              oldTimeFrame,
              targetContract: oldTargetContract,
              oldData: oldEncodedData,
              newJobName,
              newTimeFrame,
              newData: newEncodedData,
            });

            // Call updateJob on the contract
            const jobCreationAddress = getJobRegistryAddressForCurrentChain();
            if (!jobCreationAddress) {
              throw new Error(
                `Job creation contract address not set for chain ${chainId}`,
              );
            }
            const jobContract = new ethers.Contract(
              jobCreationAddress,
              JobRegistryArtifact.abi,
              signer,
            );

            // Log how job_id is set
            devLog(
              `[JobForm] job_id will be set from contract event after creation. Current value:`,
              jd.job_id,
            );
            const tx = await jobContract.updateJob(
              jobId,
              oldJobName,
              oldJobTypeNum,
              Number(oldTimeFrame),
              oldTargetContract,
              oldEncodedData,
              newJobName,
              newTimeFrame,
              newEncodedData,
            );
            devLog("[JobForm] updateJob tx sent:", tx.hash);
            const receipt = await tx.wait();
            devLog(
              "[JobForm] updateJob tx confirmed:",
              receipt.transactionHash,
            );
            // Optionally, handle receipt and events for updateJob if needed
          } else {
            const jobCreationAddress = getJobRegistryAddressForCurrentChain();
            if (!jobCreationAddress) {
              throw new Error(
                `Job creation contract address not set for chain ${chainId}`,
              );
            }
            const jobContract = new ethers.Contract(
              jobCreationAddress,
              JobRegistryArtifact.abi,
              signer,
            );

            // Check for common validation issues
            if (!jd.job_title || jd.job_title.trim() === "") {
              console.log("[JobForm] ERROR: Empty job title");
              throw new Error("Job title cannot be empty");
            }
            // Task definition ID 7 (custom script) doesn't require a target contract address
            if (
              jd.task_definition_id !== 7 &&
              (!jd.target_contract_address ||
                jd.target_contract_address ===
                "0x0000000000000000000000000000000000000000")
            ) {
              console.log("[JobForm] ERROR: Invalid target contract address");
              throw new Error("Target contract address is required");
            }

            // Check for time interval requirement for task definition IDs 2, 7 (Time-based with IPFS)
            if (
              (jd.task_definition_id === 2 || jd.task_definition_id === 7) &&
              jd.time_interval <= 0
            ) {
              console.log(
                `[JobForm] ERROR: Time interval must be greater than 0 for task definition ID ${jd.task_definition_id}`,
              );
              throw new Error(
                `Time interval must be greater than 0 for task definition ID ${jd.task_definition_id}`,
              );
            }

            // Check for IPFS hash requirement for task definition IDs 2, 4, 6, 7 (require IPFS)
            if (
              (jd.task_definition_id === 2 ||
                jd.task_definition_id === 4 ||
                jd.task_definition_id === 6 ||
                jd.task_definition_id === 7) &&
              (!jd.dynamic_arguments_script_url ||
                jd.dynamic_arguments_script_url.trim() === "")
            ) {
              throw new Error(
                `IPFS hash is required for task definition ID ${jd.task_definition_id}`,
              );
            }

            // Try to estimate gas first to get more detailed error
            try {
            } catch (gasError: unknown) {
              console.log("[JobForm] Gas estimation failed:", gasError);
              // Try to decode the error
              if (
                gasError &&
                typeof gasError === "object" &&
                "data" in gasError
              ) {
                const errorData = (gasError as { data: string }).data;
                console.log("[JobForm] Error data:", errorData);

                try {
                  const decodedError =
                    jobContract.interface.parseError(errorData);
                  console.log("[JobForm] Decoded error:", decodedError);
                } catch (decodeError) {
                  console.log("[JobForm] Could not decode error:", decodeError);
                }
              }
              throw gasError;
            }

            const tx = await jobContract.createJob(
              jd.job_title,
              jd.task_definition_id, // Use task definition ID instead of job type
              jd.time_frame,
              jd.target_contract_address,
              encodedData,
            );
            const receipt = await tx.wait();

            // Try to get jobId from event
            const jobCreatedEvent = receipt.logs
              .map((log: unknown) => {
                try {
                  return jobContract.interface.parseLog(
                    log as unknown as Parameters<
                      typeof jobContract.interface.parseLog
                    >[0],
                  );
                } catch (parseError) {
                  console.log("[JobForm] Error parsing log:", parseError);
                  return null;
                }
              })
              .find(
                (
                  parsed: unknown,
                ): parsed is {
                  name: string;
                  args: { jobId?: { toString: () => string } };
                } => {
                  const isValid =
                    !!parsed &&
                    typeof (parsed as { name?: string }).name === "string" &&
                    (parsed as { name: string }).name === "JobCreated";
                  devLog(
                    "[JobForm] Checking if parsed log is JobCreated event:",
                    isValid,
                  );
                  return isValid;
                },
              );

            if (jobCreatedEvent) {
              const returnedJobId = jobCreatedEvent.args.jobId?.toString();
              updatedJobDetails[0].job_id = returnedJobId;
              // Mark contract interaction as successful and store the job ID
              setContractInteractionSuccessful(true);
              setLastJobId(returnedJobId);
              devLog(
                "[JobForm] Contract interaction successful, stored job ID:",
                returnedJobId,
              );
            } else {
              console.log("[JobForm] No JobCreated event found in logs.");
            }
            devLog("Job creation transaction confirmed: ", tx.hash);
          }
        } catch (err) {
          devLog("Error in contract call section:", err);
          devLog("Error calling createJob contract: ", err);
          toast.error("Error creating job on-chain");
          setIsSubmitting(false);
          return false;
        }
        // --- END CONTRACT CALL ---
      }
      // --- END ENCODING LOGIC ---

      // Process linked jobs if any exist
      if (updatedLinkedJobDetails.length > 0) {
        devLog(
          "[JobForm] Processing linked jobs:",
          updatedLinkedJobDetails.length,
        );

        for (let i = 0; i < updatedLinkedJobDetails.length; i++) {
          const linkedJob = updatedLinkedJobDetails[i];

          try {
            // Encode data for linked job
            let linkedEncodedData: string = "0x";
            const linkedTaskDefinitionId = linkedJob.task_definition_id;

            if (linkedTaskDefinitionId === 1) {
              linkedEncodedData = encodeJobType1Data(linkedJob.time_interval);
            } else if (linkedTaskDefinitionId === 2) {
              linkedEncodedData = encodeJobType2Data(
                linkedJob.time_interval,
                linkedJob.dynamic_arguments_script_url || "",
              );
            } else if (
              linkedTaskDefinitionId === 3 ||
              linkedTaskDefinitionId === 5
            ) {
              linkedEncodedData = encodeJobType3or5Data(linkedJob.recurring);
            } else if (
              linkedTaskDefinitionId === 4 ||
              linkedTaskDefinitionId === 6
            ) {
              linkedEncodedData = encodeJobType4or6Data(
                linkedJob.recurring,
                linkedJob.dynamic_arguments_script_url || "",
              );
            } else if (linkedTaskDefinitionId === 7) {
              // Custom script: time interval + IPFS hash + language
              const ipfsBytes32 = ethers.id(
                linkedJob.dynamic_arguments_script_url || "",
              );
              linkedEncodedData = encodeJobType7Data(
                linkedJob.time_interval,
                ipfsBytes32,
                linkedJob.language || "typescript",
              );
            }

            // Create linked job on contract
            const jobCreationAddress = getJobRegistryAddressForCurrentChain();
            if (!jobCreationAddress) {
              throw new Error(
                `Job creation contract address not set for chain ${chainId}`,
              );
            }
            const jobContract = new ethers.Contract(
              jobCreationAddress,
              JobRegistryArtifact.abi,
              signer,
            );

            const linkedTx = await jobContract.createJob(
              linkedJob.job_title,
              linkedJob.task_definition_id,
              linkedJob.time_frame,
              linkedJob.task_definition_id === 7
                ? ""
                : linkedJob.target_contract_address, // Use empty string for custom script jobs
              linkedEncodedData,
            );
            const linkedReceipt = await linkedTx.wait();

            // Get jobId from event for linked job
            const linkedJobCreatedEvent = linkedReceipt.logs
              .map((log: unknown) => {
                try {
                  return jobContract.interface.parseLog(
                    log as unknown as Parameters<
                      typeof jobContract.interface.parseLog
                    >[0],
                  );
                } catch (parseError) {
                  console.log(
                    "[JobForm] Error parsing linked job log:",
                    parseError,
                  );
                  return null;
                }
              })
              .find(
                (
                  parsed: unknown,
                ): parsed is {
                  name: string;
                  args: { jobId?: { toString: () => string } };
                } => {
                  const isValid =
                    !!parsed &&
                    typeof (parsed as { name?: string }).name === "string" &&
                    (parsed as { name: string }).name === "JobCreated";
                  return isValid;
                },
              );

            if (linkedJobCreatedEvent) {
              const linkedJobId = linkedJobCreatedEvent.args.jobId?.toString();
              updatedLinkedJobDetails[i].job_id = linkedJobId;
              devLog(
                "[JobForm] Linked job created successfully, job ID:",
                linkedJobId,
              );
            } else {
              console.log(
                "[JobForm] No JobCreated event found in linked job logs.",
              );
            }
          } catch (err) {
            devLog("Error creating linked job:", err);
            toast.error("Error creating linked job on-chain");
            setIsSubmitting(false);
            return false;
          }
        }
      }

      // For update, ensure job_id is set to jobId from URL
      if (jobId && updatedJobDetails[0]) {
        updatedJobDetails[0].job_id = jobId;
      }

      // Combine main job and linked jobs for API submission
      const allJobsForSubmission = [
        ...updatedJobDetails,
        ...updatedLinkedJobDetails,
      ];

      console.log("before trim", allJobsForSubmission);
      const trimmedJobsForSubmission = trimObjectStrings(allJobsForSubmission);
      console.log("Submitting job details:", trimmedJobsForSubmission);

      // Create or update job via API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_BASE_URL) {
        throw new Error("API base URL not configured in ENV");
      }

      const headers = {
        "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
      };
      let response;
      if (jobId) {
        // Update job
        devLog(
          `[JobForm] Calling UPDATE API: ${API_BASE_URL}/api/jobs/update/${jobId} (PUT)`,
        );
        response = await fetch(`${API_BASE_URL}/api/jobs/update/${jobId}`, {
          method: "PUT",
          mode: "cors",
          headers,
          body: JSON.stringify(updatedJobDetails[0]), // send single job object for update
        });
      } else {
        // Create job
        devLog(`[JobForm] Calling CREATE API: ${API_BASE_URL}/api/jobs (POST)`);
        response = await fetch(`${API_BASE_URL}/api/jobs`, {
          method: "POST",
          mode: "cors",
          headers,
          body: JSON.stringify(trimmedJobsForSubmission), // send array for create
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText ||
          (jobId ? "Failed to update job" : "Failed to create job"),
        );
      }

      setIsJobCreated(true);
      // Reset contract interaction state after successful job creation
      setContractInteractionSuccessful(false);
      setLastJobId(undefined);
      toast.success(
        jobId ? "Job updated successfully!" : "Job created successfully!",
      );
      return true;
    } catch (error) {
      devLog(
        (jobId ? "Error updating job: " : "Error creating job: ") +
        (error as Error).message,
      );
      toast.error(jobId ? "Error updating job: " : "Error creating job: ");
      setIsJobCreated(false);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetABI = useCallback((contractKey: string, value: string) => {
    try {
      const parseResult = parseABI(value);
      if (!parseResult.success || !parseResult.abi) {
        throw new Error(parseResult.error || "Invalid ABI format");
      }
      const parsedFunctions = extractFunctions(parseResult.abi, true);
      const functions = mapParsedFunctionsToContractFunctions(parsedFunctions);
      const parsedEvents = extractEvents(parseResult.abi);
      const events = mapParsedEventsToContractEvents(parsedEvents);

      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          abi: value,
          events,
          functions,
        },
      }));
    } catch (error) {
      console.error("Invalid ABI format:", error);
      setContractInteractions((prev) => ({
        ...prev,
        [contractKey]: {
          ...prev[contractKey],
          abi: null,
          events: [],
          functions: [],
        },
      }));
    }
  }, []);

  const handleSetContractDetails = useCallback(
    (contractKey: string, address: string, abiString: string) => {
      try {
        const parseResult = parseABI(abiString);
        if (!parseResult.success || !parseResult.abi) {
          throw new Error(parseResult.error || "Invalid ABI format");
        }
        const parsedFunctions = extractFunctions(parseResult.abi, true);
        const functions =
          mapParsedFunctionsToContractFunctions(parsedFunctions);
        const parsedEvents = extractEvents(parseResult.abi);
        const events = mapParsedEventsToContractEvents(parsedEvents);

        setContractInteractions((prev) => ({
          ...prev,
          [contractKey]: {
            ...prev[contractKey],
            address,
            abi: abiString,
            events,
            functions,
          },
        }));
      } catch (error) {
        console.error("Invalid ABI format:", error);
        setContractInteractions((prev) => ({
          ...prev,
          [contractKey]: {
            ...prev[contractKey],
            address,
            abi: null,
            events: [],
            functions: [],
          },
        }));
      }
    },
    [],
  );

  const resetContractInteractionState = useCallback(() => {
    setContractInteractionSuccessful(false);
    setLastJobId(undefined);
    devLog("[JobForm] Reset contract interaction state");
  }, []);

  const reset = () => {
    setJobType(0); // Default trigger type
    setJobTitle("");
    setJobTitleError(null);
    setTimeframe({ days: 0, hours: 0, minutes: 0 });
    setErrorFrame(null);
    setTimeInterval({ hours: 0, minutes: 0, seconds: 0 });
    setRecurring(true);
    setErrorInterval(null);
    setContractInteractions({
      eventContract: {
        address: "",
        abi: null,
        isCheckingABI: false,
        manualABI: "",
        events: [],
        targetEvent: "",
        selectedEventArgument: "",
        eventArgumentValue: "",
        functions: [],
        targetFunction: "",
        argumentType: "static",
        argumentValues: [],
        ipfsCodeUrl: "",
        ipfsCodeUrlError: "",
        sourceType: "api",
        sourceUrl: "",
        sourceUrlError: "",
        conditionType: "",
        upperLimit: "",
        lowerLimit: "",
        apiKeys: [],
        selectedApiKey: "",
        selectedApiKeyValue: "",
        isFetchingApiKeys: false,
        apiKeysError: "",
        isProxy: false,
        implementationAddress: undefined,
        proxyType: undefined,
        safeTransactions: [],
      },
      contract: {
        address: "",
        abi: null,
        isCheckingABI: false,
        manualABI: "",
        events: [],
        targetEvent: "",
        functions: [],
        targetFunction: "",
        argumentType: "",
        argumentValues: [],
        ipfsCodeUrl: "",
        ipfsCodeUrlError: "",
        sourceType: "api",
        sourceUrl: "",
        sourceUrlError: "",
        conditionType: "",
        upperLimit: "",
        lowerLimit: "",
        apiKeys: [],
        selectedApiKey: "",
        selectedApiKeyValue: "",
        isFetchingApiKeys: false,
        apiKeysError: "",
        isProxy: false,
        implementationAddress: undefined,
        proxyType: undefined,
        safeTransactions: [],
      },
    });
    setLinkedJobs({});
    setEstimatedFee(0);
    setEstimatedFeeInWei(null);
    setFeePerExecution(null);
    setDesiredExecutions(5);
    setCalculatedExecutions(null);
    setContractErrors({});
    setIsModalOpen(false);
    setIsJobCreated(false);
    setContractInteractionSuccessful(false);
    setLastJobId(undefined);
    setIsSubmitting(false);
    setHasConfirmedPermission(false);
    setPermissionError(null);
    setExecutionMode("contract");
    setSelectedSafeWallet(null);
    setUserSafeWallets([]);
    setLanguage("");
    setCustomScriptUrl("");
  };

  return (
    <JobFormContext.Provider
      value={{
        jobType,
        setJobType,
        selectedNetwork,
        setSelectedNetwork,
        jobTitle,
        setJobTitle,
        timeframe,
        setTimeframe,
        timeInterval,
        setTimeInterval,
        recurring,
        setRecurring,
        handleJobTypeChange,
        handleTimeframeChange,
        handleTimeIntervalChange,
        contractInteractions,
        setContractInteractions,
        handleContractAddressChange,
        handleManualABIChange,
        handleEventChange,
        handleFunctionChange,
        handleArgumentTypeChange,
        handleArgumentValueChange,
        handleIpfsCodeUrlChange,
        handleSourceTypeChange,
        handleSourceUrlChange,
        handleApiKeySelection,
        handleConditionTypeChange,
        handleUpperLimitChange,
        handleLowerLimitChange,
        handleSafeTransactionsChange,
        linkedJobs,
        handleLinkJob,
        handleDeleteLinkedJob,
        validateTimeframe,
        validateTimeInterval,
        validateJobTitle,
        validateABI,
        jobTitleError,
        setJobTitleError,
        jobTitleErrorRef,
        errorFrame,
        setErrorFrame,
        errorFrameRef,
        errorInterval,
        setErrorInterval,
        errorIntervalRef,
        contractErrors,
        setContractErrors,
        extractJobDetails,
        getTimeframeInSeconds,
        getIntervalInSeconds,
        getNetworkIdByName,
        getTaskDefinitionId,
        getArgType,
        estimatedFee,
        setEstimatedFee,
        estimatedFeeInWei,
        setEstimatedFeeInWei,
        feePerExecution,
        setFeePerExecution,
        desiredExecutions,
        setDesiredExecutions,
        calculatedExecutions,
        setCalculatedExecutions,
        isModalOpen,
        setIsModalOpen,
        estimateFee,
        isSubmitting,
        setIsSubmitting,
        isJobCreated,
        setIsJobCreated,
        contractInteractionSuccessful,
        setContractInteractionSuccessful,
        lastJobId,
        setLastJobId,
        handleTopUpETH,
        handleCreateJob,
        handleSetABI,
        handleSetContractDetails,
        hasConfirmedPermission,
        setHasConfirmedPermission,
        permissionError,
        setPermissionError,
        executionMode,
        setExecutionMode,
        selectedSafeWallet,
        setSelectedSafeWallet,
        userSafeWallets,
        setUserSafeWallets,
        language,
        setLanguage,
        customScriptUrl,
        setCustomScriptUrl,
        resetContractInteractionState,
        reset,
      }}
    >
      {children}
    </JobFormContext.Provider>
  );
};

export const useJobForm = () => {
  const context = useContext(JobFormContext);
  if (context === undefined) {
    throw new Error("useJobForm must be used within a JobFormProvider");
  }
  return context;
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

type OldDataDecoded = {
  timeInterval?: number | string;
  dynamic_arguments_script_url?: string;
  recurring?: boolean;
  language?: string;
};
