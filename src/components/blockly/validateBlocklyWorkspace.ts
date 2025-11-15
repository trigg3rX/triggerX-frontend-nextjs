// Validates the Blockly workspace for required blocks and fields
export interface BlocklyValidationError {
  errorKey: string;
  errorValue: string;
}

export interface ValidateBlocklyWorkspaceArgs {
  xml: string;
  jobTitle: string;
  connectedAddress?: string; // Optional: validate against connected wallet
}

function getFieldValue(blockEl: Element, fieldName: string): string | null {
  const fields = Array.from(blockEl.getElementsByTagName("field"));
  const match = fields.find((f) => f.getAttribute("name") === fieldName);
  return match ? (match.textContent || "").trim() : null;
}

function findFirstBlockByType(
  blockNodes: Element[],
  type: string,
): Element | undefined {
  return blockNodes.find((b) => (b.getAttribute("type") || "") === type);
}

// Validates the Blockly workspace for required blocks and configuration
//  @returns null if valid, or error object if validation fails

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
      };
    }

    // Check for wallet selection
    if (!walletBlock) {
      return {
        errorKey: "wallet",
        errorValue:
          "Wallet selection block is required. Please add it from the Wallet category.",
      };
    }

    // Validate wallet address
    const walletAddress = getFieldValue(walletBlock, "WALLET_ADDRESS");
    if (!walletAddress || walletAddress === "0x..." || walletAddress === "") {
      return {
        errorKey: "wallet",
        errorValue:
          "Please enter a valid wallet address in the wallet selection block.",
      };
    }

    // Validate wallet address format (basic check)
    if (!walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      return {
        errorKey: "wallet",
        errorValue:
          "Invalid wallet address format. It should start with 0x and be 42 characters long.",
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
      };
    }

    // Check for exactly one job wrapper block
    const jobWrapperBlocks = [
      "time_based_job_wrapper",
      "event_based_job_wrapper",
      "condition_based_job_wrapper",
    ];
    const jobWrappers = blockNodes.filter((b) =>
      jobWrapperBlocks.includes(b.getAttribute("type") || ""),
    );

    if (jobWrappers.length === 0) {
      return {
        errorKey: "jobWrapper",
        errorValue:
          "A job wrapper block is required. Please add one from the Job Type category.",
      };
    }

    if (jobWrappers.length > 1) {
      return {
        errorKey: "jobWrapper",
        errorValue:
          "Only one job wrapper block is allowed. Please remove extra job wrapper blocks.",
      };
    }

    // Check for exactly one duration block (timeframe_job)
    const durationBlocks = blockNodes.filter(
      (b) => b.getAttribute("type") === "timeframe_job",
    );

    if (durationBlocks.length === 0) {
      return {
        errorKey: "duration",
        errorValue:
          "A duration block is required. Please add the 'until' block from the Utility category.",
      };
    }

    if (durationBlocks.length > 1) {
      return {
        errorKey: "duration",
        errorValue:
          "Only one duration block is allowed. The duration block connected to the job wrapper will be the final duration.",
      };
    }

    // Validate that duration block is connected to job wrapper
    const jobWrapperHasDuration = jobWrappers.some((wrapper) => {
      const statementInput = Array.from(
        wrapper.getElementsByTagName("statement"),
      ).find((val) => val.getAttribute("name") === "STATEMENT");
      return (
        statementInput
          ?.getElementsByTagName("block")[0]
          ?.getAttribute("type") === "timeframe_job"
      );
    });

    if (!jobWrapperHasDuration) {
      return {
        errorKey: "duration",
        errorValue:
          "The duration block must be connected to the job wrapper block. Please connect the 'until' block to the duration input of the job wrapper.",
      };
    }

    // All validations passed
    return null;
  } catch (error) {
    console.error("Error parsing XML or validating workspace:", error);
    return {
      errorKey: "workspace",
      errorValue:
        "Error validating workspace. Please check your blocks and try again.",
    };
  }
}
