import { Timeframe, TimeInterval, ContractInteraction } from "@/types/job";

interface ValidateJobFormArgs {
  jobType: number;
  jobTitle: string;
  timeframe: Timeframe;
  timeInterval: TimeInterval;
  contractInteractions: ContractInteraction;
  linkedJobs: { [key: number]: number[] };
  validateJobTitle: (title?: string) => string | null;
  validateTimeframe: (tf?: Timeframe) => string | null;
  validateTimeInterval: (ti?: TimeInterval, jt?: number) => string | null;
  validateABI: (contractKey: string) => string | null;
}

export function validateJobForm({
  jobType,
  jobTitle,
  timeframe,
  timeInterval,
  contractInteractions,
  linkedJobs,
  validateJobTitle,
  validateTimeframe,
  validateTimeInterval,
  validateABI,
}: ValidateJobFormArgs): null | {
  errorKey: string;
  errorValue: string;
  scrollToId: string;
} {
  // Job title
  const jobTitleErrorMsg = validateJobTitle(jobTitle);
  if (jobTitleErrorMsg) {
    return {
      errorKey: "jobTitle",
      errorValue: jobTitleErrorMsg,
      scrollToId: "job-title-input",
    };
  }
  // Timeframe
  const timeframeErrorMsg = validateTimeframe(timeframe);
  if (timeframeErrorMsg) {
    return {
      errorKey: "timeframe",
      errorValue: timeframeErrorMsg,
      scrollToId: "timeframe-inputs",
    };
  }
  // Time interval
  const intervalErrorMsg = validateTimeInterval(timeInterval, jobType);
  if (intervalErrorMsg) {
    return {
      errorKey: "timeInterval",
      errorValue: intervalErrorMsg,
      scrollToId: "time-interval-inputs",
    };
  }
  // Event contract (jobType 3)
  if (jobType === 3) {
    const eventContract = contractInteractions.eventContract;
    if (!eventContract.address || eventContract.address.trim() === "") {
      return {
        errorKey: "eventContractAddress",
        errorValue: "Event contract address is required.",
        scrollToId: "contract-address-input-eventContract",
      };
    }
    const abiError = validateABI("eventContract");
    if (abiError) {
      return {
        errorKey: "eventContractABI",
        errorValue: abiError,
        scrollToId: "contract-address-input-eventContract",
      };
    }
    if (!eventContract.targetEvent) {
      return {
        errorKey: "eventContractTarget",
        errorValue: "Target event must be selected.",
        scrollToId: "eventContract-target-dropdown",
      };
    }
  }
  // Main contract
  const contract = contractInteractions.contract;
  if (!contract.address || contract.address.trim() === "") {
    return {
      errorKey: "contractAddress",
      errorValue: "Contract address is required.",
      scrollToId: "contract-address-input-contract",
    };
  }
  const abiError = validateABI("contract");
  if (abiError) {
    return {
      errorKey: "contractABI",
      errorValue: abiError,
      scrollToId: "contract-address-input-contract",
    };
  }
  if (!contract.targetFunction) {
    return {
      errorKey: "contractTarget",
      errorValue: "Target function must be selected.",
      scrollToId: "contract-target-dropdown",
    };
  }
  if (contract.argumentType === "dynamic") {
    if (
      !contract.ipfsCodeUrl ||
      contract.ipfsCodeUrl.trim() === "" ||
      contract.ipfsCodeUrlError
    ) {
      return {
        errorKey: "contractIpfs",
        errorValue: "IPFS Code URL is required for dynamic argument type.",
        scrollToId: "contract-ipfs-code-url-contract",
      };
    }
  } else {
    const selectedFunction = contract.functions.find(
      (func) =>
        `${func.name}(${(func.inputs || []).map((input) => input.type).join(",")})` ===
        contract.targetFunction,
    );
    const hasArguments =
      selectedFunction &&
      selectedFunction.inputs &&
      selectedFunction.inputs.length > 0;
    if (hasArguments) {
      const missingArg = selectedFunction.inputs.find(
        (_, idx) =>
          !contract.argumentValues?.[idx] ||
          contract.argumentValues[idx].trim() === "",
      );
      if (missingArg) {
        return {
          errorKey: "contractArgs",
          errorValue:
            "All function arguments are required for static argument type.",
          scrollToId: "contract-args-section-contract",
        };
      }
    }
  }
  if (jobType === 2) {
    if (
      !contract.sourceUrl ||
      contract.sourceUrl.trim() === "" ||
      contract.sourceUrlError
    ) {
      return {
        errorKey: "contractSourceUrl",
        errorValue: "Source URL is required and must be valid.",
        scrollToId: "contract-source-url-contract",
      };
    }
    if (!contract.conditionType) {
      return {
        errorKey: "contractConditionType",
        errorValue: "Condition type is required.",
        scrollToId: "contract-condition-type-contract",
      };
    }
    if (contract.conditionType === "between") {
      if (
        !contract.upperLimit ||
        contract.upperLimit === "" ||
        !contract.lowerLimit ||
        contract.lowerLimit === ""
      ) {
        return {
          errorKey: "contractLimits",
          errorValue: "Both upper and lower limits are required.",
          scrollToId: "contract-limits-section-contract",
        };
      }
    } else {
      if (!contract.upperLimit || contract.upperLimit === "") {
        return {
          errorKey: "contractLimits",
          errorValue: "Value is required.",
          scrollToId: "contract-limits-section-contract",
        };
      }
    }
  }
  // Linked jobs
  if (linkedJobs[jobType]?.length > 0) {
    for (const jobId of linkedJobs[jobType]) {
      const jobKey = `${jobType}-${jobId}`;
      const linked = contractInteractions[jobKey];
      if (!linked?.address || linked.address.trim() === "") {
        return {
          errorKey: `${jobKey}Address`,
          errorValue: "Contract address is required.",
          scrollToId: `contract-address-input-${jobKey}`,
        };
      }
      if (!linked.abi || linked.abi === null || linked.abi === "") {
        return {
          errorKey: `${jobKey}ABI`,
          errorValue: "Contract ABI must be verified or provided manually.",
          scrollToId: `contract-address-input-${jobKey}`,
        };
      }
      if (!linked.targetFunction) {
        return {
          errorKey: `${jobKey}Target`,
          errorValue: "Target function must be selected.",
          scrollToId: `${jobKey}-target-dropdown`,
        };
      }
      if (linked.argumentType === "dynamic") {
        if (
          !linked.ipfsCodeUrl ||
          linked.ipfsCodeUrl.trim() === "" ||
          linked.ipfsCodeUrlError
        ) {
          return {
            errorKey: `${jobKey}Ipfs`,
            errorValue: "IPFS Code URL is required for dynamic argument type.",
            scrollToId: `contract-ipfs-code-url-${jobKey}`,
          };
        }
      } else {
        const selectedFunction = linked.functions.find(
          (func) =>
            `${func.name}(${(func.inputs || []).map((input) => input.type).join(",")})` ===
            linked.targetFunction,
        );
        const hasArguments =
          selectedFunction &&
          selectedFunction.inputs &&
          selectedFunction.inputs.length > 0;
        if (hasArguments) {
          const missingArg = selectedFunction.inputs.find(
            (_, idx) =>
              !linked.argumentValues?.[idx] ||
              linked.argumentValues[idx].trim() === "",
          );
          if (missingArg) {
            return {
              errorKey: `${jobKey}Args`,
              errorValue:
                "All function arguments are required for static argument type.",
              scrollToId: `contract-args-section-${jobKey}`,
            };
          }
        }
      }
      if (jobType === 2) {
        if (
          !linked.sourceUrl ||
          linked.sourceUrl.trim() === "" ||
          linked.sourceUrlError
        ) {
          return {
            errorKey: `${jobKey}SourceUrl`,
            errorValue: "Source URL is required and must be valid.",
            scrollToId: `contract-source-url-${jobKey}`,
          };
        }
        if (!linked.conditionType) {
          return {
            errorKey: `${jobKey}ConditionType`,
            errorValue: "Condition type is required.",
            scrollToId: `contract-condition-type-${jobKey}`,
          };
        }
        if (linked.conditionType === "between") {
          if (
            !linked.upperLimit ||
            linked.upperLimit === "" ||
            !linked.lowerLimit ||
            linked.lowerLimit === ""
          ) {
            return {
              errorKey: `${jobKey}Limits`,
              errorValue: "Both upper and lower limits are required.",
              scrollToId: `contract-limits-section-${jobKey}`,
            };
          }
        } else {
          if (!linked.upperLimit || linked.upperLimit === "") {
            return {
              errorKey: `${jobKey}Limits`,
              errorValue: "Value is required.",
              scrollToId: `contract-limits-section-${jobKey}`,
            };
          }
        }
      }
    }
  }
  return null;
}
