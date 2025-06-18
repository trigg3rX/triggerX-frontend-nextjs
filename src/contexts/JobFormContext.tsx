"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Timeframe, TimeInterval, ContractInteraction } from "@/types/job";
import networksData from "@/utils/networks.json";
import { ethers } from "ethers";
import axios from "axios";

interface ABIItem {
  type: string;
  name?: string;
  inputs?: { type: string }[];
  outputs?: { type: string }[];
  stateMutability?: string;
  payable?: boolean;
  constant?: boolean;
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
        let abiFetched = false;

        // Try Blockscout first
        const blockscoutUrl = `https://optimism-sepolia.blockscout.com/api?module=contract&action=getabi&address=${value}`;
        try {
          const response = await axios.get(blockscoutUrl);
          const data = response.data;
          if (
            data.status === "1" &&
            data.result &&
            typeof data.result === "string" &&
            data.result.startsWith("[")
          ) {
            try {
              JSON.parse(data.result); // Just validate JSON
              const functions = extractFunctions(data.result).filter(
                (func) =>
                  func.stateMutability === "nonpayable" ||
                  func.stateMutability === "payable",
              );
              const events = extractEvents(data.result);

              setContractInteractions((prev) => ({
                ...prev,
                [contractKey]: {
                  ...prev[contractKey],
                  abi: data.result,
                  events,
                  functions,
                  isCheckingABI: false,
                },
              }));
              abiFetched = true;
            } catch (jsonError) {
              console.error("Invalid ABI format from Blockscout:", jsonError);
            }
          }
        } catch (error) {
          console.error("Error fetching from Blockscout:", error);
        }

        // If Blockscout failed, try Etherscan
        if (!abiFetched) {
          const ETHERSCAN_API_KEY =
            process.env.NEXT_PUBLIC_ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY;
          if (ETHERSCAN_API_KEY) {
            const etherscanUrl = `https://api-sepolia-optimism.etherscan.io/api?module=contract&action=getabi&address=${value}&apikey=${ETHERSCAN_API_KEY}`;
            try {
              const response = await axios.get(etherscanUrl);
              const data = response.data;
              if (
                data.status === "1" &&
                data.result &&
                typeof data.result === "string" &&
                data.result.startsWith("[")
              ) {
                try {
                  JSON.parse(data.result); // Just validate JSON
                  const functions = extractFunctions(data.result).filter(
                    (func) =>
                      func.stateMutability === "nonpayable" ||
                      func.stateMutability === "payable",
                  );
                  const events = extractEvents(data.result);

                  setContractInteractions((prev) => ({
                    ...prev,
                    [contractKey]: {
                      ...prev[contractKey],
                      abi: data.result,
                      events,
                      functions,
                      isCheckingABI: false,
                    },
                  }));
                  abiFetched = true;
                } catch (jsonError) {
                  console.error(
                    "Invalid ABI format from Etherscan:",
                    jsonError,
                  );
                }
              }
            } catch (error) {
              console.error("Error fetching from Etherscan:", error);
            }
          } else {
            console.warn(
              "Etherscan API key not found. Skipping Etherscan fallback.",
            );
          }
        }

        // If both attempts failed
        if (!abiFetched) {
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
