/**
 * Blockly Workspace Validation Utility
 * Validates the Blockly workspace for required blocks and fields
 */

export interface BlocklyValidationError {
  errorKey: string;
  errorValue: string;
  scrollToId: string;
}

export interface ValidateBlocklyWorkspaceArgs {
  xml: string;
  jobTitle: string;
  connectedAddress?: string; // Optional: validate against connected wallet
}

/**
 * Helper function to get field value from a block element
 */
function getFieldValue(blockEl: Element, fieldName: string): string | null {
  const fields = Array.from(blockEl.getElementsByTagName("field"));
  const match = fields.find((f) => f.getAttribute("name") === fieldName);
  return match ? (match.textContent || "").trim() : null;
}

/**
 * Helper function to find first block by type
 */
function findFirstBlockByType(
  blockNodes: Element[],
  type: string,
): Element | undefined {
  return blockNodes.find((b) => (b.getAttribute("type") || "") === type);
}

/**
 * Validates the Blockly workspace for required blocks and configuration
 * @returns null if valid, or error object if validation fails
 */
export function validateBlocklyWorkspace({
  xml,
  jobTitle,
  connectedAddress,
}: ValidateBlocklyWorkspaceArgs): BlocklyValidationError | null {
  // Validate job title
  if (!jobTitle || jobTitle.trim() === "") {
    return {
      errorKey: "jobTitle",
      errorValue: "Job title is required.",
      scrollToId: "job-title-input",
    };
  }

  // Parse XML to extract blocks
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const blockNodes = Array.from(doc.getElementsByTagName("block"));

    // Check if workspace is empty
    if (blockNodes.length === 0) {
      return {
        errorKey: "workspace",
        errorValue: "Workspace is empty. Please add blocks to create a job.",
        scrollToId: "blockly-workspace",
      };
    }

    // Required blocks validation
    const chainBlock = findFirstBlockByType(blockNodes, "chain_selection");
    const walletBlock = findFirstBlockByType(blockNodes, "wallet_selection");

    // Check for chain selection
    if (!chainBlock) {
      return {
        errorKey: "chain",
        errorValue:
          "Chain selection block is required. Please add it from the Chain category.",
        scrollToId: "blockly-workspace",
      };
    }

    // Validate chain has a value
    const chainId = getFieldValue(chainBlock, "CHAIN_ID");
    if (!chainId || chainId === "") {
      return {
        errorKey: "chain",
        errorValue: "Please select a valid chain in the chain selection block.",
        scrollToId: "blockly-workspace",
      };
    }

    // Check for wallet selection
    if (!walletBlock) {
      return {
        errorKey: "wallet",
        errorValue:
          "Wallet selection block is required. Please add it from the Wallet category.",
        scrollToId: "blockly-workspace",
      };
    }

    // Validate wallet address
    const walletAddress = getFieldValue(walletBlock, "WALLET_ADDRESS");
    if (!walletAddress || walletAddress === "0x..." || walletAddress === "") {
      return {
        errorKey: "wallet",
        errorValue:
          "Please enter a valid wallet address in the wallet selection block.",
        scrollToId: "blockly-workspace",
      };
    }

    // Validate wallet address format (basic check)
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return {
        errorKey: "wallet",
        errorValue:
          "Invalid wallet address format. It should start with 0x and be 42 characters long.",
        scrollToId: "blockly-workspace",
      };
    }

    // Optional: Check if wallet address matches connected wallet (for TG balance)
    if (
      connectedAddress &&
      walletAddress.toLowerCase() !== connectedAddress.toLowerCase()
    ) {
      return {
        errorKey: "wallet",
        errorValue: `Warning: The wallet address in your workspace (${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}) does not match your connected wallet (${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}). The TG balance shown is for your connected wallet. Please ensure the workspace wallet has sufficient TG balance.`,
        scrollToId: "blockly-workspace",
      };
    }

    // Check for at least one job type block
    const jobTypeBlocks = [
      "fixed_time_job",
      "interval_time_job",
      "cron_time_job",
      "event_job",
      "condition_job",
    ];
    const hasJobType = blockNodes.some((b) =>
      jobTypeBlocks.includes(b.getAttribute("type") || ""),
    );

    if (!hasJobType) {
      return {
        errorKey: "jobType",
        errorValue:
          "At least one job type block is required. Please add one from the Job Type category.",
        scrollToId: "blockly-workspace",
      };
    }

    // Check for contract action block
    const contractActionBlock = findFirstBlockByType(
      blockNodes,
      "contract_action",
    );
    if (!contractActionBlock) {
      return {
        errorKey: "contractAction",
        errorValue:
          "Contract action block is required. Please add it from the Utility category.",
        scrollToId: "blockly-workspace",
      };
    }

    // Validate contract action fields
    const contractAddress = getFieldValue(
      contractActionBlock,
      "TARGET_CONTRACT_ADDRESS",
    );
    if (
      !contractAddress ||
      contractAddress === "0x..." ||
      contractAddress === ""
    ) {
      return {
        errorKey: "contractAction",
        errorValue:
          "Please enter a valid contract address in the contract action block.",
        scrollToId: "blockly-workspace",
      };
    }

    // Validate contract address format
    if (!contractAddress.startsWith("0x") || contractAddress.length !== 42) {
      return {
        errorKey: "contractAction",
        errorValue:
          "Invalid contract address format in contract action block. It should start with 0x and be 42 characters long.",
        scrollToId: "blockly-workspace",
      };
    }

    const targetFunction = getFieldValue(
      contractActionBlock,
      "TARGET_FUNCTION",
    );
    if (!targetFunction || targetFunction === "") {
      return {
        errorKey: "contractAction",
        errorValue:
          "Please select a target function in the contract action block.",
        scrollToId: "blockly-workspace",
      };
    }

    // Validate argument type
    const argType = getFieldValue(contractActionBlock, "ARG_TYPE");
    if (argType === "1") {
      // Dynamic arguments
      const scriptUrl = getFieldValue(
        contractActionBlock,
        "DYNAMIC_ARGUMENTS_SCRIPT_URL",
      );
      if (!scriptUrl || scriptUrl === "") {
        return {
          errorKey: "contractAction",
          errorValue:
            "Dynamic arguments script URL is required when using dynamic argument type.",
          scrollToId: "blockly-workspace",
        };
      }

      // Basic URL validation
      try {
        new URL(scriptUrl);
      } catch {
        return {
          errorKey: "contractAction",
          errorValue: "Invalid URL format for dynamic arguments script URL.",
          scrollToId: "blockly-workspace",
        };
      }
    }

    // Validate event job specific fields
    const eventJobBlock = findFirstBlockByType(blockNodes, "event_job");
    if (eventJobBlock) {
      const triggerContractAddress = getFieldValue(
        eventJobBlock,
        "TRIGGER_CONTRACT_ADDRESS",
      );
      if (
        !triggerContractAddress ||
        triggerContractAddress === "0x..." ||
        triggerContractAddress === ""
      ) {
        return {
          errorKey: "eventJob",
          errorValue:
            "Please enter a valid trigger contract address in the event job block.",
          scrollToId: "blockly-workspace",
        };
      }

      const triggerEvent = getFieldValue(eventJobBlock, "TRIGGER_EVENT");
      if (!triggerEvent || triggerEvent === "") {
        return {
          errorKey: "eventJob",
          errorValue: "Please select a trigger event in the event job block.",
          scrollToId: "blockly-workspace",
        };
      }
    }

    // Validate condition job specific fields
    const conditionJobBlock = findFirstBlockByType(blockNodes, "condition_job");
    if (conditionJobBlock) {
      const conditionType = getFieldValue(conditionJobBlock, "CONDITION_TYPE");
      if (!conditionType || conditionType === "") {
        return {
          errorKey: "conditionJob",
          errorValue:
            "Please select a condition type in the condition job block.",
          scrollToId: "blockly-workspace",
        };
      }

      const valueSourceUrl = getFieldValue(
        conditionJobBlock,
        "VALUE_SOURCE_URL",
      );
      if (!valueSourceUrl || valueSourceUrl === "") {
        return {
          errorKey: "conditionJob",
          errorValue:
            "Please enter a value source URL in the condition job block.",
          scrollToId: "blockly-workspace",
        };
      }

      // Validate limits based on condition type
      if (conditionType === "between") {
        const lowerLimit = getFieldValue(conditionJobBlock, "LOWER_LIMIT");
        const upperLimit = getFieldValue(conditionJobBlock, "UPPER_LIMIT");
        if (
          !lowerLimit ||
          !upperLimit ||
          lowerLimit === "" ||
          upperLimit === ""
        ) {
          return {
            errorKey: "conditionJob",
            errorValue:
              "Both lower and upper limits are required for 'between' condition type.",
            scrollToId: "blockly-workspace",
          };
        }
      } else {
        const upperLimit = getFieldValue(conditionJobBlock, "UPPER_LIMIT");
        if (!upperLimit || upperLimit === "") {
          return {
            errorKey: "conditionJob",
            errorValue:
              "Please enter a value limit in the condition job block.",
            scrollToId: "blockly-workspace",
          };
        }
      }
    }

    // Validate time-based job fields
    const intervalJobBlock = findFirstBlockByType(
      blockNodes,
      "interval_time_job",
    );
    if (intervalJobBlock) {
      const intervalValue = getFieldValue(
        intervalJobBlock,
        "TIME_INTERVAL_VALUE",
      );
      if (!intervalValue || intervalValue === "0" || intervalValue === "") {
        return {
          errorKey: "intervalJob",
          errorValue:
            "Please enter a valid time interval value greater than 0.",
          scrollToId: "blockly-workspace",
        };
      }
    }

    const fixedJobBlock = findFirstBlockByType(blockNodes, "fixed_time_job");
    if (fixedJobBlock) {
      const scheduleDate = getFieldValue(fixedJobBlock, "SCHEDULE_DATE");
      const scheduleTime = getFieldValue(fixedJobBlock, "SCHEDULE_TIME");
      if (!scheduleDate || scheduleDate === "") {
        return {
          errorKey: "fixedJob",
          errorValue:
            "Please select a schedule date in the fixed time job block.",
          scrollToId: "blockly-workspace",
        };
      }
      if (!scheduleTime || scheduleTime === "") {
        return {
          errorKey: "fixedJob",
          errorValue:
            "Please select a schedule time in the fixed time job block.",
          scrollToId: "blockly-workspace",
        };
      }
    }

    const cronJobBlock = findFirstBlockByType(blockNodes, "cron_time_job");
    if (cronJobBlock) {
      const cronExpression = getFieldValue(cronJobBlock, "CRON_EXPRESSION");
      if (!cronExpression || cronExpression === "") {
        return {
          errorKey: "cronJob",
          errorValue:
            "Please enter a valid cron expression in the cron time job block.",
          scrollToId: "blockly-workspace",
        };
      }
    }

    // All validations passed
    return null;
  } catch (error) {
    console.error("Error parsing XML or validating workspace:", error);
    return {
      errorKey: "workspace",
      errorValue:
        "Error validating workspace. Please check your blocks and try again.",
      scrollToId: "blockly-workspace",
    };
  }
}
