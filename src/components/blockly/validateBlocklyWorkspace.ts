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
  // Ensure wallet is connected in the dApp
  if (!connectedAddress) {
    return {
      errorKey: "walletConnection",
      errorValue:
        "No wallet connected. Use the Connect Wallet button in the header to connect before continuing.",
    };
  }

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

    // Check for chain selection
    if (!chainBlock) {
      return {
        errorKey: "chain",
        errorValue:
          "Chain selection block is required. Please add it from the Chain category.",
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

    // Get the chain's connected job wrapper type
    const chainNextBlock = chainBlock
      ? Array.from(
          chainBlock.getElementsByTagName("next"),
        )[0]?.getElementsByTagName("block")[0]
      : null;

    const connectedWrapperType = chainNextBlock?.getAttribute("type");

    // Helper function to validate execute_function block fields
    const validateExecuteFunctionBlock = (
      execBlock: Element,
      errorContext: string,
    ): BlocklyValidationError | null => {
      // Validate contract address
      const contractAddress = getFieldValue(execBlock, "CONTRACT_ADDRESS");
      if (
        !contractAddress ||
        contractAddress === "0x..." ||
        contractAddress.trim() === ""
      ) {
        return {
          errorKey: errorContext,
          errorValue:
            "Execute function block requires a valid contract address. Please enter the contract address in the execute function block.",
        };
      }

      if (!contractAddress.startsWith("0x") || contractAddress.length !== 42) {
        return {
          errorKey: errorContext,
          errorValue:
            "Invalid contract address format in execute function block. It should start with 0x and be 42 characters long.",
        };
      }

      // Validate function name
      const functionName = getFieldValue(execBlock, "FUNCTION_NAME");
      if (!functionName || functionName.trim() === "") {
        return {
          errorKey: errorContext,
          errorValue:
            "Execute function block requires a valid function to be selected. Please select a function from the dropdown in the execute function block.",
        };
      }

      // Validate arguments block
      const argsStatement = Array.from(
        execBlock.getElementsByTagName("statement"),
      ).find((val) => val.getAttribute("name") === "ARGUMENTS");

      const argsBlock = argsStatement?.getElementsByTagName("block")[0];

      if (!argsBlock) {
        return {
          errorKey: errorContext,
          errorValue:
            "Execute function block requires argument configuration. Please connect either a 'static arguments' or 'dynamic arguments' block to the execute function block.",
        };
      }

      const argsType = argsBlock.getAttribute("type");
      if (argsType === "dynamic_arguments") {
        const ipfsUrl = getFieldValue(argsBlock, "IPFS_URL");
        if (!ipfsUrl || ipfsUrl.trim() === "" || ipfsUrl === "ipfs://...") {
          return {
            errorKey: errorContext,
            errorValue:
              "Dynamic arguments block requires a valid IPFS URL. Please enter the IPFS URL in the dynamic arguments block.",
          };
        }

        const isIpfsScheme = ipfsUrl.startsWith("ipfs://");
        const isGatewayUrl = ipfsUrl.startsWith("https://");
        const looksLikeCid = ipfsUrl.length >= 46 && !ipfsUrl.includes(" ");

        if (!(isIpfsScheme || isGatewayUrl || looksLikeCid)) {
          return {
            errorKey: errorContext,
            errorValue:
              "Invalid IPFS URL format in dynamic arguments block. Use ipfs://, https:// gateway, or a CID.",
          };
        }
      } else if (argsType !== "static_arguments") {
        return {
          errorKey: errorContext,
          errorValue: `Execute function block requires either static or dynamic arguments. Please connect the appropriate arguments block. Found: ${argsType || "unknown"}`,
        };
      }

      return null;
    };

    // Helper function to validate utility blocks inside duration
    const validateUtilityInDuration = (
      wrapper: Element,
      expectedBlockTypes: string[],
      errorMessage: string,
      categoryName: string,
    ): BlocklyValidationError | null => {
      const wrapperStatement = Array.from(
        wrapper.getElementsByTagName("statement"),
      ).find((val) => val.getAttribute("name") === "STATEMENT");

      const durationBlock = wrapperStatement?.getElementsByTagName("block")[0];

      if (
        durationBlock &&
        durationBlock.getAttribute("type") === "timeframe_job"
      ) {
        // Check if there's at least one utility block inside duration
        const durationStatement = Array.from(
          durationBlock.getElementsByTagName("statement"),
        ).find((val) => val.getAttribute("name") === "STATEMENT");

        const utilityBlock =
          durationStatement?.getElementsByTagName("block")[0];

        if (!utilityBlock) {
          return {
            errorKey: "utility",
            errorValue: errorMessage,
          };
        }

        // Verify it's the correct type block
        const utilityType = utilityBlock.getAttribute("type");

        if (utilityType && !expectedBlockTypes.includes(utilityType)) {
          return {
            errorKey: "utility",
            errorValue: `Invalid utility block type. Please use a ${categoryName} utility block from the ${categoryName} category.`,
          };
        }
      }

      return null;
    };

    // Define utility block types for each category
    const timeConfigTypes = [
      "cron_expression",
      "specific_datetime",
      "time_interval_at_job",
    ];
    const eventConfigTypes = ["event_listener", "recurring_job"];
    const conditionConfigTypes = ["condition_monitor", "recurring_job"];

    // Check for mixed utility types in the workspace
    const timeUtilityBlocks = blockNodes.filter((b) =>
      timeConfigTypes.includes(b.getAttribute("type") || ""),
    );
    const eventUtilityBlocks = blockNodes.filter((b) =>
      eventConfigTypes.includes(b.getAttribute("type") || ""),
    );
    const conditionUtilityBlocks = blockNodes.filter((b) =>
      conditionConfigTypes.includes(b.getAttribute("type") || ""),
    );

    // Count how many different utility types are present
    const utilityTypesPresent = [
      timeUtilityBlocks.length > 0,
      eventUtilityBlocks.length > 0,
      conditionUtilityBlocks.length > 0,
    ].filter(Boolean).length;

    if (utilityTypesPresent > 1) {
      return {
        errorKey: "utility",
        errorValue:
          "Workspace can only contain one type of utility block at a time. Please use either Time utilities (cron, datetime, interval), Event utilities (event listener), or Condition utilities (condition monitor), but not a mix of them.",
      };
    }

    // Check if chain is connected to time_based_job_wrapper
    if (
      connectedWrapperType === "time_based_job_wrapper" &&
      chainBlock &&
      chainNextBlock
    ) {
      const timeBasedWrapper = jobWrappers.find(
        (wrapper) => wrapper.getAttribute("type") === "time_based_job_wrapper",
      );

      if (timeBasedWrapper) {
        const validationError = validateUtilityInDuration(
          timeBasedWrapper,
          timeConfigTypes,
          "When using a time-based job, you must add at least one utility block (like cron expression, specific datetime, or time interval) inside the duration block. Please add a utility from the Time category.",
          "Time",
        );

        if (validationError) return validationError;

        // Check that each time utility block has a contract action
        for (const timeUtilityBlock of timeUtilityBlocks) {
          const utilityType = timeUtilityBlock.getAttribute("type");

          // Check if there's a contract action in the utility's ACTION statement
          const actionStatement = Array.from(
            timeUtilityBlock.getElementsByTagName("statement"),
          ).find((val) => val.getAttribute("name") === "ACTION");

          const actionBlock = actionStatement?.getElementsByTagName("block")[0];

          if (!actionBlock) {
            return {
              errorKey: "time",
              errorValue: `Time utility block (${utilityType}) requires an action block to execute. Please connect an execute function block to the 'execute' input of the time utility block.`,
            };
          }

          // Verify it's an execute function or execute through safe wallet block
          const actionType = actionBlock.getAttribute("type");
          if (
            actionType !== "execute_function" &&
            actionType !== "execute_through_safe_wallet"
          ) {
            return {
              errorKey: "time",
              errorValue: `Time utility block requires an execute block to execute. Please connect an execute function block or execute through safe wallet block to the 'execute' input. Found: ${actionType || "unknown"}`,
            };
          }

          // Validate execute_function block using helper (only for execute_function, not safe wallet)
          if (actionType === "execute_function") {
            const execValidation = validateExecuteFunctionBlock(
              actionBlock,
              "time",
            );
            if (execValidation) return execValidation;
          }
        }
      }

      // Ensure no event or condition utilities are present
      if (eventUtilityBlocks.length > 0) {
        return {
          errorKey: "utility",
          errorValue:
            "Time-based jobs cannot contain Event utility blocks. Please remove the event listener block or switch to an event-based job wrapper.",
        };
      }
      if (conditionUtilityBlocks.length > 0) {
        return {
          errorKey: "utility",
          errorValue:
            "Time-based jobs cannot contain Condition utility blocks. Please remove the condition monitor block or switch to a condition-based job wrapper.",
        };
      }
    }

    // Check if chain is connected to event_based_job_wrapper
    if (
      connectedWrapperType === "event_based_job_wrapper" &&
      chainBlock &&
      chainNextBlock
    ) {
      const eventBasedWrapper = jobWrappers.find(
        (wrapper) => wrapper.getAttribute("type") === "event_based_job_wrapper",
      );

      if (eventBasedWrapper) {
        const validationError = validateUtilityInDuration(
          eventBasedWrapper,
          eventConfigTypes,
          "When using an event-based job, you must add at least one event listener block inside the duration block. Please add an event listener from the Event category.",
          "Event",
        );

        if (validationError) return validationError;

        // Additional validation for event_listener block fields
        const eventListenerBlock = blockNodes.find(
          (b) => b.getAttribute("type") === "event_listener",
        );

        if (eventListenerBlock) {
          // Check CONTRACT_ADDRESS field
          const contractAddress = getFieldValue(
            eventListenerBlock,
            "CONTRACT_ADDRESS",
          );
          if (
            !contractAddress ||
            contractAddress === "0x..." ||
            contractAddress.trim() === ""
          ) {
            return {
              errorKey: "event",
              errorValue:
                "Event listener requires a valid contract address. Please enter the contract address in the event listener block.",
            };
          }

          // Validate contract address format
          if (
            !contractAddress.startsWith("0x") ||
            contractAddress.length !== 42
          ) {
            return {
              errorKey: "event",
              errorValue:
                "Invalid contract address format in event listener. It should start with 0x and be 42 characters long.",
            };
          }

          // Check EVENT_NAME field
          const eventName = getFieldValue(eventListenerBlock, "EVENT_NAME");
          if (!eventName || eventName.trim() === "") {
            return {
              errorKey: "event",
              errorValue:
                "Event listener requires a valid event to be selected. Please select an event from the dropdown in the event listener block.",
            };
          }

          // Check if there's an action block connected to the event listener
          const actionStatement = Array.from(
            eventListenerBlock.getElementsByTagName("statement"),
          ).find((val) => val.getAttribute("name") === "ACTION");

          const actionBlock = actionStatement?.getElementsByTagName("block")[0];

          if (!actionBlock) {
            return {
              errorKey: "event",
              errorValue:
                "Event listener requires an action block. Please connect either an event filter or an execute function block to the 'then' input of the event listener.",
            };
          }

          // Verify it's either event_filter or execute_function
          const actionType = actionBlock.getAttribute("type");

          if (actionType === "event_filter") {
            // Validate event_filter block fields
            const filterParamName = getFieldValue(
              actionBlock,
              "PARAMETER_NAME",
            );
            if (!filterParamName || filterParamName.trim() === "") {
              return {
                errorKey: "event",
                errorValue:
                  "Event filter requires a parameter name to be selected. Please select a parameter from the dropdown in the event filter block.",
              };
            }

            const filterParamValue = getFieldValue(
              actionBlock,
              "PARAMETER_VALUE",
            );
            if (
              !filterParamValue ||
              filterParamValue === "value" ||
              filterParamValue.trim() === ""
            ) {
              return {
                errorKey: "event",
                errorValue:
                  "Event filter requires a parameter value. Please enter a value in the event filter block.",
              };
            }

            // Check if there's a contract action in the event filter's ACTION statement
            const filterActionStatement = Array.from(
              actionBlock.getElementsByTagName("statement"),
            ).find((val) => val.getAttribute("name") === "ACTION");

            const contractActionBlock =
              filterActionStatement?.getElementsByTagName("block")[0];

            if (!contractActionBlock) {
              return {
                errorKey: "event",
                errorValue:
                  "Event filter must contain an action block. Please connect an execute function block inside the event filter's 'execute' input.",
              };
            }

            const contractActionType = contractActionBlock.getAttribute("type");
            if (
              contractActionType !== "execute_function" &&
              contractActionType !== "execute_through_safe_wallet"
            ) {
              return {
                errorKey: "event",
                errorValue: `Event filter must contain an execute block. Please connect an execute function block or execute through safe wallet block inside the event filter's 'execute' input. Found: ${contractActionType || "unknown"}`,
              };
            }

            // Validate execute_function block using helper (only for execute_function, not safe wallet)
            if (contractActionType === "execute_function") {
              const filterExecValidation = validateExecuteFunctionBlock(
                contractActionBlock,
                "event",
              );
              if (filterExecValidation) return filterExecValidation;
            }
          } else if (
            actionType !== "execute_function" &&
            actionType !== "execute_through_safe_wallet"
          ) {
            return {
              errorKey: "event",
              errorValue: `Event listener requires either an event filter or execute block. Please connect the appropriate block to the 'then' input. Found: ${actionType || "unknown"}`,
            };
          } else if (actionType === "execute_function") {
            // Direct execute_function block connected to event listener
            const directExecValidation = validateExecuteFunctionBlock(
              actionBlock,
              "event",
            );
            if (directExecValidation) return directExecValidation;
          }
        }
      }

      // Ensure no time or condition utilities are present
      if (timeUtilityBlocks.length > 0) {
        return {
          errorKey: "utility",
          errorValue:
            "Event-based jobs cannot contain Time utility blocks. Please remove the time utility blocks or switch to a time-based job wrapper.",
        };
      }
      if (conditionUtilityBlocks.length > 0) {
        return {
          errorKey: "utility",
          errorValue:
            "Event-based jobs cannot contain Condition utility blocks. Please remove the condition monitor block or switch to a condition-based job wrapper.",
        };
      }
    }

    // Check if chain is connected to condition_based_job_wrapper
    if (
      connectedWrapperType === "condition_based_job_wrapper" &&
      chainBlock &&
      chainNextBlock
    ) {
      const conditionBasedWrapper = jobWrappers.find(
        (wrapper) =>
          wrapper.getAttribute("type") === "condition_based_job_wrapper",
      );

      if (conditionBasedWrapper) {
        const validationError = validateUtilityInDuration(
          conditionBasedWrapper,
          conditionConfigTypes,
          "When using a condition-based job, you must add at least one condition monitor block inside the duration block. Please add a condition monitor from the Condition category.",
          "Condition",
        );

        if (validationError) return validationError;

        // Additional validation for condition_monitor block fields
        const conditionMonitorBlock = blockNodes.find(
          (b) => b.getAttribute("type") === "condition_monitor",
        );

        if (conditionMonitorBlock) {
          // Check SOURCE_URL field
          const sourceUrl = getFieldValue(conditionMonitorBlock, "SOURCE_URL");
          if (
            !sourceUrl ||
            sourceUrl === "https://api.example.com/data" ||
            sourceUrl.trim() === ""
          ) {
            return {
              errorKey: "condition",
              errorValue:
                "Condition monitor requires a valid source URL. Please enter a valid API URL in the condition monitor block.",
            };
          }

          // Validate URL format
          if (!/^https?:\/\//.test(sourceUrl)) {
            return {
              errorKey: "condition",
              errorValue:
                "Invalid source URL format in condition monitor. It should start with http:// or https://.",
            };
          }

          // Check DATA_KEY field
          const dataKey = getFieldValue(conditionMonitorBlock, "DATA_KEY");
          if (!dataKey || dataKey.trim() === "") {
            return {
              errorKey: "condition",
              errorValue:
                "Condition monitor requires a valid data key to be selected. Please select a data key from the dropdown in the condition monitor block.",
            };
          }

          // Check if VALUE or LOWER_VALUE/UPPER_VALUE fields are set
          const conditionType = getFieldValue(
            conditionMonitorBlock,
            "CONDITION_TYPE",
          );
          if (conditionType === "in_range") {
            const lowerValue = getFieldValue(
              conditionMonitorBlock,
              "LOWER_VALUE",
            );
            const upperValue = getFieldValue(
              conditionMonitorBlock,
              "UPPER_VALUE",
            );
            if (
              !lowerValue ||
              lowerValue === "value" ||
              !upperValue ||
              upperValue === "value"
            ) {
              return {
                errorKey: "condition",
                errorValue:
                  "Condition monitor with 'in range' condition requires valid lower and upper values. Please enter the range values in the condition monitor block.",
              };
            }
          } else {
            const value = getFieldValue(conditionMonitorBlock, "VALUE");
            if (!value || value === "value") {
              return {
                errorKey: "condition",
                errorValue:
                  "Condition monitor requires a valid comparison value. Please enter the value in the condition monitor block.",
              };
            }
          }

          // Check if there's a contract action connected to the condition monitor
          const actionStatement = Array.from(
            conditionMonitorBlock.getElementsByTagName("statement"),
          ).find((val) => val.getAttribute("name") === "ACTION");

          const actionBlock = actionStatement?.getElementsByTagName("block")[0];

          if (!actionBlock) {
            return {
              errorKey: "condition",
              errorValue:
                "Condition monitor requires an action block to execute. Please connect an execute function block to the 'execute' input of the condition monitor.",
            };
          }

          // Verify it's an execute function or execute through safe wallet block
          const actionType = actionBlock.getAttribute("type");
          if (
            actionType !== "execute_function" &&
            actionType !== "execute_through_safe_wallet"
          ) {
            return {
              errorKey: "condition",
              errorValue: `Condition monitor requires an execute block to execute. Please connect an execute function block or execute through safe wallet block to the 'execute' input. Found block type: ${actionType || "unknown"}`,
            };
          }

          // Validate execute_function block using helper (only for execute_function, not safe wallet)
          if (actionType === "execute_function") {
            const condExecValidation = validateExecuteFunctionBlock(
              actionBlock,
              "condition",
            );
            if (condExecValidation) return condExecValidation;
          }
        }
      }

      // Ensure no time or event utilities are present
      if (timeUtilityBlocks.length > 0) {
        return {
          errorKey: "utility",
          errorValue:
            "Condition-based jobs cannot contain Time utility blocks. Please remove the time utility blocks or switch to a time-based job wrapper.",
        };
      }
      if (eventUtilityBlocks.length > 0) {
        return {
          errorKey: "utility",
          errorValue:
            "Condition-based jobs cannot contain Event utility blocks. Please remove the event listener block or switch to an event-based job wrapper.",
        };
      }
    }

    // Check for execute contract blocks - only one type allowed
    const executeContractBlocks = blockNodes.filter(
      (b) => b.getAttribute("type") === "execute_function",
    );
    const executeSafeWalletBlocks = blockNodes.filter(
      (b) => b.getAttribute("type") === "execute_through_safe_wallet",
    );

    // Ensure only one type of execute block is used
    if (
      executeContractBlocks.length > 0 &&
      executeSafeWalletBlocks.length > 0
    ) {
      return {
        errorKey: "execute",
        errorValue:
          "Only one type of execution block is allowed. Please use either 'Execute Function' blocks OR 'Execute through Safe Wallet' blocks, but not both in the same workspace.",
      };
    }

    if (executeSafeWalletBlocks.length > 0) {
      // Check each execute_through_safe_wallet block
      for (const executeBlock of executeSafeWalletBlocks) {
        // Check if there's a safe wallet block connected to the SAFE_WALLET input
        const safeWalletValue = Array.from(
          executeBlock.getElementsByTagName("value"),
        ).find((val) => val.getAttribute("name") === "SAFE_WALLET");

        const connectedSafeBlock =
          safeWalletValue?.getElementsByTagName("block")[0];

        if (!connectedSafeBlock) {
          return {
            errorKey: "safe_wallet",
            errorValue:
              "Execute through Safe Wallet block requires a safe wallet to be connected. Please connect a Safe wallet block (Create Safe Wallet, Import Safe Wallet, or Select Safe Wallet) from the Safe Wallet category.",
          };
        }

        // Verify the connected block is a valid safe wallet block
        const connectedBlockType = connectedSafeBlock.getAttribute("type");
        const validSafeWalletTypes = [
          "create_safe_wallet",
          "import_safe_wallet",
          "select_safe_wallet",
        ];

        if (!validSafeWalletTypes.includes(connectedBlockType || "")) {
          return {
            errorKey: "safe_wallet",
            errorValue: `Execute through Safe Wallet block requires a valid Safe wallet block. Please connect a Create Safe Wallet, Import Safe Wallet, or Select Safe Wallet block. Found: ${connectedBlockType || "unknown"}`,
          };
        }

        // Additional validation for select_safe_wallet
        if (connectedBlockType === "select_safe_wallet") {
          const selectedWallet = getFieldValue(
            connectedSafeBlock,
            "SAFE_WALLET",
          );
          if (!selectedWallet || selectedWallet === "") {
            return {
              errorKey: "safe_wallet",
              errorValue:
                "Please select a Safe wallet from the dropdown in the Select Safe Wallet block, or use Create/Import Safe Wallet block instead.",
            };
          }
        }
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
    };
  }
}
