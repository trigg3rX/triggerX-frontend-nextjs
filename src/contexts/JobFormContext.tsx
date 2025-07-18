"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Timeframe, TimeInterval, ContractInteraction } from "@/types/job";
import networksData from "@/utils/networks.json";
import { ethers } from "ethers";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { useTGBalance } from "./TGBalanceContext";
import toast from "react-hot-toast";
import { useStakeRegistry } from "@/hooks/useStakeRegistry";
import { devLog } from "@/lib/devLog";

interface ABIItem {
  type: string;
  name?: string;
  inputs?: { type: string }[];
  outputs?: { type: string }[];
  stateMutability?: string;
  payable?: boolean;
  constant?: boolean;
}

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
  target_chain_id: string;
  target_contract_address: string;
  target_function: string;
  abi: string | null;
  arg_type?: number;
  arguments?: string[];
  dynamic_arguments_script_url?: string;
  source_type?: string;
  source_url?: string;
  condition_type?: string;
  upper_limit?: string;
  lower_limit?: string;
  job_id?: number; // <-- add this line
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
): JobDetails {
  let triggerContractAddress = "0x0000000000000000000000000000000000000000";
  let triggerEvent = "NULL";
  if (jobType === 3 && contractInteractions.eventContract) {
    triggerContractAddress =
      contractInteractions.eventContract.address || triggerContractAddress;
    triggerEvent =
      contractInteractions.eventContract.targetEvent || triggerEvent;
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
  const argsArray = c.argumentValues || [];
  const ipfsCodeUrl = c.ipfsCodeUrl || "";
  const targetFunction = c.targetFunction ? c.targetFunction.split("(")[0] : "";
  const taskDefinitionId = getTaskDefinitionId(
    c.argumentType || "static",
    jobType,
  );
  const triggerChainId = networkId ? networkId.toString() : "";

  return {
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
    target_chain_id: triggerChainId,
    target_contract_address: contractAddress,
    target_function: targetFunction,
    abi: contractABI,
    arg_type: argType,
    arguments: argsArray,
    dynamic_arguments_script_url: ipfsCodeUrl,
    // source_type: c.sourceType,
    // source_url: c.sourceUrl,
    // condition_type: c.conditionType,
    // upper_limit: c.upperLimit,
    // lower_limit: c.lowerLimit,
  };
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

function getArgType(argumentType: string): number {
  return argumentType === "static" ? 1 : 2;
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
  handleJobTypeChange: (
    e: React.MouseEvent<HTMLButtonElement>,
    type: number,
  ) => void;
  handleTimeframeChange: (field: keyof Timeframe, value: string) => void;
  handleTimeIntervalChange: (field: keyof TimeInterval, value: string) => void;
  contractInteractions: ContractInteraction;
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
  handleConditionTypeChange: (contractKey: string, value: string) => void;
  handleUpperLimitChange: (contractKey: string, value: string) => void;
  handleLowerLimitChange: (contractKey: string, value: string) => void;
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
  estimatedFeeInGwei: bigint | null;
  setEstimatedFeeInGwei: React.Dispatch<React.SetStateAction<bigint | null>>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  estimateFee: (
    jobType: number,
    timeframeInSeconds: number,
    intervalInSeconds: number,
    codeUrls: string,
    recurring: boolean,
    argType: number,
  ) => Promise<void>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  isJobCreated: boolean;
  setIsJobCreated: React.Dispatch<React.SetStateAction<boolean>>;
  handleStakeTG: () => Promise<boolean>;
  handleCreateJob: (jobId?: string) => Promise<boolean>;
  handleSetABI: (contractKey: string, value: string) => void;
  handleSetContractDetails: (
    contractKey: string,
    address: string,
    abiString: string,
  ) => void;
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
        functions: [],
        targetFunction: "",
        argumentType: "static",
        argumentValues: [],
        ipfsCodeUrl: "",
        ipfsCodeUrlError: "",
        sourceType: "API",
        sourceUrl: "",
        sourceUrlError: "",
        conditionType: "",
        upperLimit: "",
        lowerLimit: "",
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
        sourceType: "API",
        sourceUrl: "",
        sourceUrlError: "",
        conditionType: "",
        upperLimit: "",
        lowerLimit: "",
      },
    });
  const [linkedJobs, setLinkedJobs] = useState<{ [key: number]: number[] }>({});
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const [estimatedFeeInGwei, setEstimatedFeeInGwei] = useState<bigint | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isJobCreated, setIsJobCreated] = useState<boolean>(false);

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

  // Get TG balance context
  const { fetchTGBalance } = useTGBalance();
  const { stakeRegistryAddress } = useStakeRegistry();

  // Refetch TG balance when selectedNetwork changes
  React.useEffect(() => {
    fetchTGBalance();
  }, [selectedNetwork, fetchTGBalance]);

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

  const extractEvents = (abi: string) => {
    try {
      const parsedABI = JSON.parse(abi);
      return parsedABI.filter((item: ABIItem) => item.type === "event");
    } catch (error) {
      console.error("Error parsing ABI:", error);
      return [];
    }
  };

  const extractFunctions = (abi: string) => {
    try {
      let abiArray;
      if (typeof abi === "string") {
        try {
          abiArray = JSON.parse(abi);
        } catch {
          throw new Error("Invalid ABI string format");
        }
      } else if (Array.isArray(abi)) {
        abiArray = abi;
      } else if (typeof abi === "object") {
        abiArray = [abi];
      } else {
        throw new Error("ABI must be an array, object, or valid JSON string");
      }

      if (!Array.isArray(abiArray)) {
        throw new Error("Processed ABI is not an array");
      }

      const functions = abiArray
        .filter((item) => item && item.type === "function")
        .map((func) => ({
          name: func.name || "unnamed",
          inputs: func.inputs || [],
          outputs: func.outputs || [],
          stateMutability: func.stateMutability || "nonpayable",
          payable: func.payable || false,
          constant: func.constant || false,
        }));

      return functions;
    } catch (error) {
      console.error("Error processing ABI:", error);
      return [];
    }
  };

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
        },
      }));

      if (ethers.isAddress(value)) {
        // Use the shared ABI fetch utility
        try {
          const abiString = await fetchContractABI(value);
          if (abiString) {
            JSON.parse(abiString); // Validate JSON
            const functions = extractFunctions(abiString).filter(
              (func) =>
                func.stateMutability === "nonpayable" ||
                func.stateMutability === "payable",
            );
            const events = extractEvents(abiString);
            setContractInteractions((prev) => ({
              ...prev,
              [contractKey]: {
                ...prev[contractKey],
                abi: abiString,
                events,
                functions,
                isCheckingABI: false,
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
          },
        }));
      }
    },
    [],
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
        const parsedABI = JSON.parse(value);
        if (Array.isArray(parsedABI)) {
          const functions = extractFunctions(value).filter(
            (func) =>
              func.stateMutability === "nonpayable" ||
              func.stateMutability === "payable",
          );
          const events = extractEvents(value);

          setContractInteractions((prev) => ({
            ...prev,
            [contractKey]: {
              ...prev[contractKey],
              abi: value,
              events,
              functions,
            },
          }));
        }
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
    (contractKey: string, value: string) => {
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
        },
      }));
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
              sourceType: "API",
              sourceUrl: "",
              sourceUrlError: "",
              conditionType: "",
              upperLimit: "",
              lowerLimit: "",
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

  const estimateFee = async (
    jobType: number,
    timeframeInSeconds: number,
    intervalInSeconds: number,
    codeUrls: string,
    recurring: boolean,
    argType: number,
  ) => {
    try {
      let executionCount;
      if (jobType === 1) {
        executionCount = Math.ceil(timeframeInSeconds / intervalInSeconds);
      } else {
        executionCount = recurring ? 10 : 1;
      }

      let totalFeeTG = 0;
      if (argType === 2) {
        if (codeUrls) {
          try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
            if (!API_BASE_URL) {
              throw new Error(
                "NEXT_PUBLIC_API_BASE_URL is not defined in your environment variables.",
              );
            }

            const response = await fetch(
              `${API_BASE_URL}/api/fees?ipfs_url=${encodeURIComponent(codeUrls)}`,
              {
                method: "GET",
                headers: { "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "" },
              },
            );
            if (!response.ok) throw new Error("Failed to get fees");
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            totalFeeTG = Number(data.total_fee) * executionCount;
            const stakeAmountEth = totalFeeTG * 0.001;
            devLog(
              "Total TG fee required for Dynamic:",
              totalFeeTG.toFixed(18),
              "TG",
            );

            const stakeAmountGwei = BigInt(Math.floor(stakeAmountEth * 1e9));
            setEstimatedFeeInGwei(stakeAmountGwei);
          } catch (error) {
            console.error("Error getting task fees:", error);
          }
        }
      } else {
        totalFeeTG = 0.1 * executionCount;
        devLog(
          "Total TG fee required for static:",
          totalFeeTG.toFixed(18),
          "TG",
        );
      }
      setEstimatedFee(totalFeeTG);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error estimating fee:", error);
    }
  };

  const handleStakeTG = async (): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask to use this feature");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const requiredEth = (0.001 * estimatedFee).toFixed(18);

      if (!stakeRegistryAddress) {
        throw new Error("Stake registry address not configured");
      }

      const contract = new ethers.Contract(
        stakeRegistryAddress,
        [
          "function purchaseTG(uint256 amount) external payable returns (uint256)",
        ],
        signer,
      );

      devLog("Staking ETH amount:", requiredEth);

      const tx = await contract.purchaseTG(
        ethers.parseEther(requiredEth.toString()),
        { value: ethers.parseEther(requiredEth.toString()) },
      );
      await tx.wait();
      devLog("Stake transaction confirmed: ", tx.hash);

      await fetchTGBalance();

      // After successful staking, proceed to create job
      // await handleCreateJob();
      return true;
    } catch (error) {
      console.error("Error staking TG:", error);
      toast.error("Error topping up TG: " + (error as Error).message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

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

      // Extract all job details from contract interactions
      const allJobDetails: JobDetails[] = [];

      // Extract job details for each contract interaction
      Object.keys(contractInteractions).forEach((contractKey) => {
        const contract = contractInteractions[contractKey];

        // Skip contracts that don't have required data
        if (!contract.targetFunction || !contract.abi) {
          return;
        }

        const jobDetails = extractJobDetails(
          contractKey,
          contractInteractions,
          jobTitle,
          getTimeframeInSeconds(timeframe),
          getIntervalInSeconds(timeInterval),
          recurring,
          userAddress,
          networkId,
          jobType,
        );
        allJobDetails.push(jobDetails);
      });

      // Add job cost prediction to all job details
      const updatedJobDetails = allJobDetails.map((jobDetail) => ({
        ...jobDetail,
        job_cost_prediction: estimatedFee,
        is_imua: process.env.NEXT_PUBLIC_IS_IMUA === "true",
        job_id:
          jobDetail.job_id && String(jobDetail.job_id).length > 0
            ? jobDetail.job_id
            : Math.floor(10000 + Math.random() * 90000), // 5-digit random number
      }));

      // For update, ensure job_id is set to jobId from URL
      if (jobId && updatedJobDetails[0]) {
        updatedJobDetails[0].job_id = Number(jobId);
      }

      devLog("Submitting job details:", updatedJobDetails);

      // Create or update job via API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!API_BASE_URL) {
        throw new Error("API base URL not configured in ENV");
      }

      const headers = {
        ...(process.env.NODE_ENV !== "production" && {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        }),
      };
      let response;
      if (jobId) {
        // Update job
        console.log(
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
        console.log(
          `[JobForm] Calling CREATE API: ${API_BASE_URL}/api/jobs (POST)`,
        );
        response = await fetch(`${API_BASE_URL}/api/jobs`, {
          method: "POST",
          mode: "cors",
          headers,
          body: JSON.stringify(updatedJobDetails), // send array for create
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          errorText ||
            (jobId ? "Failed to update job" : "Failed to create job"),
        );
      }

      setIsJobCreated(true);
      toast.success(
        jobId ? "Job updated successfully!" : "Job created successfully!",
      );
      return true;
    } catch (error) {
      console.error(
        jobId ? "Error updating job:" : "Error creating job:",
        error,
      );
      toast.error(
        (jobId ? "Error updating job: " : "Error creating job: ") +
          (error as Error).message,
      );
      setIsJobCreated(false);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetABI = useCallback((contractKey: string, value: string) => {
    try {
      const parsedABI = JSON.parse(value);
      if (Array.isArray(parsedABI)) {
        const functions = extractFunctions(value).filter(
          (func) =>
            func.stateMutability === "nonpayable" ||
            func.stateMutability === "payable",
        );
        const events = extractEvents(value);

        setContractInteractions((prev) => ({
          ...prev,
          [contractKey]: {
            ...prev[contractKey],
            abi: value,
            events,
            functions,
          },
        }));
      }
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
        const parsedABI = JSON.parse(abiString);
        if (Array.isArray(parsedABI)) {
          const functions = extractFunctions(abiString).filter(
            (func) =>
              func.stateMutability === "nonpayable" ||
              func.stateMutability === "payable",
          );
          const events = extractEvents(abiString);

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
        }
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
        handleContractAddressChange,
        handleManualABIChange,
        handleEventChange,
        handleFunctionChange,
        handleArgumentTypeChange,
        handleArgumentValueChange,
        handleIpfsCodeUrlChange,
        handleSourceTypeChange,
        handleSourceUrlChange,
        handleConditionTypeChange,
        handleUpperLimitChange,
        handleLowerLimitChange,
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
        estimatedFeeInGwei,
        setEstimatedFeeInGwei,
        isModalOpen,
        setIsModalOpen,
        estimateFee,
        isSubmitting,
        setIsSubmitting,
        isJobCreated,
        setIsJobCreated,
        handleStakeTG,
        handleCreateJob,
        handleSetABI,
        handleSetContractDetails,
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
