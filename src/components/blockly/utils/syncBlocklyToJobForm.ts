import { JobFormContextType } from "@/contexts/JobFormContext";
import networksData from "@/utils/networks.json";

export function syncBlocklyToJobForm(
  xml: string,
  formContext: JobFormContextType,
): boolean {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const blockNodes = Array.from(doc.getElementsByTagName("block"));

    // Helper to get field value
    const getField = (blockEl: Element, name: string): string | null => {
      const fields = Array.from(blockEl.getElementsByTagName("field"));
      const match = fields.find((f) => f.getAttribute("name") === name);
      return match ? (match.textContent || "").trim() : null;
    };

    const findFirstBlockByType = (type: string): Element | undefined =>
      blockNodes.find((b) => (b.getAttribute("type") || "") === type);

    // Find all relevant blocks
    const chainBlock = findFirstBlockByType("chain_selection");
    const intervalBlock = findFirstBlockByType("time_interval_at_job");
    const cronBlock = findFirstBlockByType("cron_expression");
    const specificDatetimeBlock = findFirstBlockByType("specific_datetime");
    const timeframeBlock = findFirstBlockByType("timeframe_job");
    const recurringBlock = findFirstBlockByType("recurring_job");
    const eventBlock = findFirstBlockByType("event_listener");
    const executeFunctionBlock = findFirstBlockByType("execute_function");
    const conditionBlock = findFirstBlockByType("condition_monitor");

    // 1. Set network based on chain ID
    if (chainBlock) {
      const chainId = getField(chainBlock, "CHAIN_ID");
      if (chainId) {
        const network = networksData.supportedNetworks.find(
          (n) => n.id.toString() === chainId,
        );
        if (network) {
          formContext.setSelectedNetwork(network.name);
        }
      }
    }

    // 2. Determine and set job type
    let jobType = 1; // Default: Time-based
    if (conditionBlock) {
      jobType = 2; // Condition-based
    } else if (eventBlock) {
      jobType = 3; // Event-based
    }
    formContext.setJobType(jobType);

    // 3. Set timeframe
    if (timeframeBlock) {
      const tfVal = Number(getField(timeframeBlock, "TIMEFRAME_VALUE") || 0);
      const tfUnit = (
        getField(timeframeBlock, "TIMEFRAME_UNIT") || "second"
      ).toLowerCase();

      let totalSeconds = tfVal;
      if (tfUnit === "minute") totalSeconds = tfVal * 60;
      else if (tfUnit === "hour") totalSeconds = tfVal * 3600;
      else if (tfUnit === "day") totalSeconds = tfVal * 86400;

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      formContext.setTimeframe({ days, hours, minutes });
    }

    // 4. Set time interval (for time-based jobs)
    if (intervalBlock) {
      const val = Number(getField(intervalBlock, "INTERVAL_VALUE") || 0);
      const unit = (
        getField(intervalBlock, "INTERVAL_UNIT") || "second"
      ).toLowerCase();

      let totalSeconds = val;
      if (unit === "minute") totalSeconds = val * 60;
      else if (unit === "hour") totalSeconds = val * 3600;
      else if (unit === "day") totalSeconds = val * 86400;

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      formContext.setTimeInterval({ hours, minutes, seconds });
    }

    // 4b. Set cron expression (alternative to time interval)
    if (cronBlock) {
      const cronExpr = getField(cronBlock, "CRON_EXPRESSION") || "";
      formContext.setCronExpression(cronExpr);
    } else {
      formContext.setCronExpression("");
    }

    // 4c. Set specific schedule (alternative to time interval)
    if (specificDatetimeBlock) {
      const scheduleDate =
        getField(specificDatetimeBlock, "SCHEDULE_DATE") || "";
      const scheduleTime =
        getField(specificDatetimeBlock, "SCHEDULE_TIME") || "";
      // Combine date and time into ISO format
      const specificSchedule =
        scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : "";
      formContext.setSpecificSchedule(specificSchedule);
    } else {
      formContext.setSpecificSchedule("");
    }

    // 5. Set recurring
    if (recurringBlock) {
      const isRec = getField(recurringBlock, "IS_RECURRING");
      formContext.setRecurring((isRec || "TRUE").toUpperCase() === "TRUE");
    } else {
      formContext.setRecurring(true);
    }

    // 6. Set execute function details and argument type
    if (executeFunctionBlock) {
      const addr = getField(executeFunctionBlock, "CONTRACT_ADDRESS") || "";
      const func = getField(executeFunctionBlock, "FUNCTION_NAME") || "";

      // Set contract address (this will trigger ABI fetching)
      formContext.handleContractAddressChange("contract", addr);

      // Check for manual ABI input block
      const manualAbiBlock = findFirstBlockByType("manual_abi_input");
      if (manualAbiBlock) {
        const abiText = getField(manualAbiBlock, "ABI_TEXT") || "";
        if (abiText && abiText !== "[]") {
          formContext.handleManualABIChange("contract", abiText);
        }
      }

      // Determine argument type from child blocks
      const staticArgsBlock = findFirstBlockByType("static_arguments");
      const dynamicArgsBlock = findFirstBlockByType("dynamic_arguments");

      let argumentType: "static" | "dynamic" | "" = "";
      if (staticArgsBlock) {
        argumentType = "static";
      } else if (dynamicArgsBlock) {
        argumentType = "dynamic";
      }

      // Set argument type
      if (argumentType) {
        formContext.handleArgumentTypeChange("contract", argumentType);
      }

      // If dynamic arguments, set IPFS URL
      if (dynamicArgsBlock) {
        const ipfsUrl = getField(dynamicArgsBlock, "IPFS_URL") || "";
        if (ipfsUrl) {
          formContext.handleIpfsCodeUrlChange("contract", ipfsUrl);
        }
      }

      // If static arguments, set argument values
      if (staticArgsBlock) {
        const fields = Array.from(
          staticArgsBlock.getElementsByTagName("field"),
        );
        const argumentValues: string[] = [];

        // Extract argument values (fields named VALUE_0, VALUE_1, etc.)
        fields.forEach((field) => {
          const fieldName = field.getAttribute("name") || "";
          if (fieldName.startsWith("VALUE_")) {
            argumentValues.push((field.textContent || "").trim());
          }
        });

        // Set argument values
        argumentValues.forEach((value, index) => {
          formContext.handleArgumentValueChange("contract", index, value);
        });
      }

      // Wait a bit for ABI to load, then set function
      setTimeout(() => {
        if (func) {
          formContext.handleFunctionChange("contract", func);
        }
      }, 500); // Give time for ABI to load
    }

    // 7. Set event job details (for event-based jobs)
    if (eventBlock && jobType === 3) {
      const tAddr = getField(eventBlock, "CONTRACT_ADDRESS") || "";
      const tEvent = getField(eventBlock, "EVENT_NAME") || "";

      // Look for event_filter block as a child
      const eventFilterBlock = findFirstBlockByType("event_filter");
      const fName = eventFilterBlock
        ? getField(eventFilterBlock, "PARAMETER_NAME") || ""
        : "";
      const fVal = eventFilterBlock
        ? getField(eventFilterBlock, "PARAMETER_VALUE") || ""
        : "";

      // Set event contract address
      formContext.handleContractAddressChange("eventContract", tAddr);

      setTimeout(() => {
        if (tEvent) {
          formContext.handleEventChange("eventContract", tEvent);
        }

        // Set event filter if present
        if (fName && fVal) {
          formContext.setContractInteractions((prev) => ({
            ...prev,
            eventContract: {
              ...prev.eventContract,
              selectedEventArgument: fName,
              eventArgumentValue: fVal,
            },
          }));
        }
      }, 500);
    }

    // 8. Set condition job details (for condition-based jobs)
    if (conditionBlock && jobType === 2) {
      const cType = getField(conditionBlock, "CONDITION_TYPE") || "";
      const srcUrl = getField(conditionBlock, "SOURCE_URL") || "";
      const keyRoute = getField(conditionBlock, "DATA_KEY") || "";

      // For range conditions, there are LOWER_VALUE and UPPER_VALUE
      // For non-range conditions, there is a single VALUE field
      const lower = getField(conditionBlock, "LOWER_VALUE") || "";
      const upper = getField(conditionBlock, "UPPER_VALUE") || "";
      const value = getField(conditionBlock, "VALUE") || "";

      // Map condition type from Blockly to form format
      const conditionTypeMap: Record<string, string> = {
        equals_to: "equals",
        not_equals_to: "not_equals",
        less_than: "less_than",
        greater_than: "greater_than",
        in_range: "between",
        less_than_or_equals: "less_equal",
        greater_than_or_equals: "greater_equal",
      };

      const mappedConditionType =
        conditionTypeMap[cType] || cType.toLowerCase();

      formContext.handleConditionTypeChange("contract", mappedConditionType);

      if (srcUrl) {
        formContext.handleSourceTypeChange("contract", "api");
        formContext.handleSourceUrlChange("contract", srcUrl);
      }

      // For range conditions, set both lower and upper
      if (lower && upper) {
        formContext.handleLowerLimitChange("contract", lower);
        formContext.handleUpperLimitChange("contract", upper);
      }
      // For non-range conditions, set the single value as upper limit
      else if (value) {
        formContext.handleUpperLimitChange("contract", value);
      }

      // Set selected key route if present
      if (keyRoute) {
        setTimeout(() => {
          formContext.setContractInteractions((prev) => ({
            ...prev,
            contract: {
              ...prev.contract,
              selectedApiKey: keyRoute,
            },
          }));
        }, 1000); // Wait for API keys to load
      }
    }

    return true;
  } catch (error) {
    console.error("Error syncing Blockly to JobForm:", error);
    return false;
  }
}
