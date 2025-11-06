import { JobFormContextType } from "@/contexts/JobFormContext";
import networksData from "@/utils/networks.json";

/**
 * Syncs Blockly workspace blocks to JobFormContext
 * This populates the form context so JobFeeModal can work with Blockly data
 */
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
    const intervalBlock = findFirstBlockByType("interval_time_job");
    const timeframeBlock = findFirstBlockByType("timeframe_job");
    const recurringBlock = findFirstBlockByType("recurring_job");
    const eventBlock = findFirstBlockByType("event_job");
    const contractActionBlock = findFirstBlockByType("contract_action");
    const conditionBlock = findFirstBlockByType("condition_job");

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
      const val = Number(getField(intervalBlock, "TIME_INTERVAL_VALUE") || 0);
      const unit = (
        getField(intervalBlock, "TIME_INTERVAL_UNIT") || "second"
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

    // 5. Set recurring
    if (recurringBlock) {
      const isRec = getField(recurringBlock, "IS_RECURRING");
      formContext.setRecurring((isRec || "TRUE").toUpperCase() === "TRUE");
    } else {
      formContext.setRecurring(true);
    }

    // 6. Set contract action details
    if (contractActionBlock) {
      const addr =
        getField(contractActionBlock, "TARGET_CONTRACT_ADDRESS") || "";
      const func = getField(contractActionBlock, "TARGET_FUNCTION") || "";
      const argTypeStr = getField(contractActionBlock, "ARG_TYPE"); // "0" static, "1" dynamic
      const isDynamic = argTypeStr === "1";

      // Set contract address (this will trigger ABI fetching)
      formContext.handleContractAddressChange("contract", addr);

      // Wait a bit for ABI to load, then set function and arguments
      setTimeout(() => {
        if (func) {
          formContext.handleFunctionChange("contract", func);
        }

        // Set argument type
        formContext.handleArgumentTypeChange(
          "contract",
          isDynamic ? "dynamic" : "static",
        );

        // Set arguments
        if (isDynamic) {
          const scriptUrl =
            getField(contractActionBlock, "DYNAMIC_ARGUMENTS_SCRIPT_URL") || "";
          formContext.handleIpfsCodeUrlChange("contract", scriptUrl);
        } else {
          // Try to read sequential ARG_VALUE_i fields
          const args: string[] = [];
          for (let i = 0; i < 10; i++) {
            const v = getField(contractActionBlock, `ARG_VALUE_${i}`);
            if (v === null) break;
            args.push(v);
          }

          // Fallback to ARGUMENTS field if no sequential args
          if (args.length === 0) {
            const raw = getField(contractActionBlock, "ARGUMENTS");
            try {
              const parsed = JSON.parse(raw || "[]");
              if (Array.isArray(parsed)) {
                parsed.forEach((arg, idx) => {
                  formContext.handleArgumentValueChange(
                    "contract",
                    idx,
                    String(arg),
                  );
                });
              }
            } catch {
              // Ignore invalid JSON
            }
          } else {
            args.forEach((arg, idx) => {
              formContext.handleArgumentValueChange("contract", idx, arg);
            });
          }
        }
      }, 500); // Give time for ABI to load
    }

    // 7. Set event job details (for event-based jobs)
    if (eventBlock && jobType === 3) {
      const tAddr = getField(eventBlock, "TRIGGER_CONTRACT_ADDRESS") || "";
      const tEvent = getField(eventBlock, "TRIGGER_EVENT") || "";
      const fName = getField(eventBlock, "EVENT_FILTER_PARA_NAME") || "";
      const fVal = getField(eventBlock, "EVENT_FILTER_VALUE") || "";

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
      const srcUrl = getField(conditionBlock, "VALUE_SOURCE_URL") || "";
      const keyRoute = getField(conditionBlock, "SELECTED_KEY_ROUTE") || "";
      const lower = getField(conditionBlock, "LOWER_LIMIT") || "";
      const upper = getField(conditionBlock, "UPPER_LIMIT") || "";

      // Map condition type from Blockly to form format
      const conditionTypeMap: Record<string, string> = {
        EQUALS: "equals",
        NOT_EQUALS: "not_equals",
        LESS_THAN: "less_than",
        GREATER_THAN: "greater_than",
        BETWEEN: "between",
        LESS_EQUAL: "less_equal",
        GREATER_EQUAL: "greater_equal",
      };

      const mappedConditionType =
        conditionTypeMap[cType] || cType.toLowerCase();

      formContext.handleConditionTypeChange("contract", mappedConditionType);

      if (srcUrl) {
        formContext.handleSourceTypeChange("contract", "api");
        formContext.handleSourceUrlChange("contract", srcUrl);
      }

      if (lower) {
        formContext.handleLowerLimitChange("contract", lower);
      }

      if (upper) {
        formContext.handleUpperLimitChange("contract", upper);
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
