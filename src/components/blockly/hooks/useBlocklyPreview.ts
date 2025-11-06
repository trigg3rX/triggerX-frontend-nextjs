import { useState, useEffect, useCallback } from "react";
import networksData from "@/utils/networks.json";

/**
 * Custom hook to generate JSON and human-readable previews from Blockly workspace XML
 */
export function useBlocklyPreview(xml: string, jobTitle: string) {
  const [jsonPreview, setJsonPreview] = useState<string>("{}");
  const [humanPreview, setHumanPreview] = useState<string>("");

  const generateJson = useCallback(() => {
    // Generate comprehensive Job JSON preview from blocks
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");
      const blockNodes = Array.from(doc.getElementsByTagName("block"));

      // Helper function to get field value from a block
      const getField = (blockEl: Element, name: string): string | null => {
        const fields = Array.from(blockEl.getElementsByTagName("field"));
        const match = fields.find((f) => f.getAttribute("name") === name);
        return match ? (match.textContent || "").trim() : null;
      };

      const findFirstBlockByType = (type: string): Element | undefined =>
        blockNodes.find((b) => (b.getAttribute("type") || "") === type);

      // Find blocks for JSON generation
      const chainBlockForJson = findFirstBlockByType("chain_selection");
      const walletBlockForJson = findFirstBlockByType("wallet_selection");
      const intervalBlock = findFirstBlockByType("interval_time_job");
      const fixedBlock = findFirstBlockByType("fixed_time_job");
      const cronBlock = findFirstBlockByType("cron_time_job");
      const timeframeBlock = findFirstBlockByType("timeframe_job");
      const recurringBlock = findFirstBlockByType("recurring_job");
      const eventBlock = findFirstBlockByType("event_job");
      const contractActionBlock = findFirstBlockByType("contract_action");
      const conditionBlock = findFirstBlockByType("condition_job");

      // Start building full JSON
      const jsonData: Record<string, unknown> = {};

      // Defaults and metadata
      jsonData.job_id = ""; // assigned after validation/creation
      jsonData.job_title = jobTitle;
      jsonData.ether_balance = 0;
      jsonData.token_balance = 0;
      jsonData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      jsonData.custom = true;
      jsonData.is_imua = false;
      jsonData.job_cost_prediction = 0;

      if (chainBlockForJson) {
        const chainId = getField(chainBlockForJson, "CHAIN_ID");
        if (chainId) {
          jsonData.target_chain_id = chainId;
          jsonData.created_chain_id = chainId;
        }
      }

      if (walletBlockForJson) {
        const walletAddress = getField(walletBlockForJson, "WALLET_ADDRESS");
        if (walletAddress) {
          jsonData.user_address = walletAddress;
        }
      }

      // Schedule related
      const toSeconds = (
        valueStr: string | null,
        unit: string | null,
      ): number => {
        const v = Number(valueStr || 0);
        const u = (unit || "second").toLowerCase();
        if (u === "minute") return v * 60;
        if (u === "hour") return v * 3600;
        if (u === "day") return v * 86400;
        return v;
      };

      if (intervalBlock) {
        const val = getField(intervalBlock, "TIME_INTERVAL_VALUE");
        const unit = getField(intervalBlock, "TIME_INTERVAL_UNIT");
        jsonData.schedule_type = "interval";
        jsonData.time_interval = toSeconds(val, unit);
      } else if (fixedBlock) {
        const date = getField(fixedBlock, "SCHEDULE_DATE");
        const time = getField(fixedBlock, "SCHEDULE_TIME");
        jsonData.schedule_type = "specific";
        if (date && time) jsonData.specific_schedule = `${date}T${time}`;
      } else if (cronBlock) {
        const expr = getField(cronBlock, "CRON_EXPRESSION");
        jsonData.schedule_type = "cron";
        if (expr) jsonData.cron_expression = expr;
      }

      if (timeframeBlock) {
        const tfVal = getField(timeframeBlock, "TIMEFRAME_VALUE");
        const tfUnit = getField(timeframeBlock, "TIMEFRAME_UNIT");
        jsonData.time_frame = toSeconds(tfVal, tfUnit);
      }

      if (recurringBlock) {
        const isRec = getField(recurringBlock, "IS_RECURRING");
        jsonData.recurring = (isRec || "TRUE").toUpperCase() === "TRUE";
      } else {
        jsonData.recurring = true;
      }

      // Contract Action
      if (contractActionBlock) {
        const addr = getField(contractActionBlock, "TARGET_CONTRACT_ADDRESS");
        const func = getField(contractActionBlock, "TARGET_FUNCTION");
        const argTypeStr = getField(contractActionBlock, "ARG_TYPE"); // "0" static, "1" dynamic
        const isDynamic = argTypeStr === "1";

        jsonData.target_contract_address = addr || "";
        jsonData.abi = null; // fetched by backend via chain+address
        jsonData.target_function = func || "";
        // Align with JobDetails arg_type (1=static, 2=dynamic)
        jsonData.arg_type = isDynamic ? 2 : 1;

        if (isDynamic) {
          const scriptUrl = getField(
            contractActionBlock,
            "DYNAMIC_ARGUMENTS_SCRIPT_URL",
          );
          jsonData.dynamic_arguments_script_url = scriptUrl || "";
          jsonData.arguments = [];
        } else {
          // Try to read sequential ARG_VALUE_i fields until none found
          const args: string[] = [];
          for (let i = 0; i < 10; i++) {
            const v = getField(contractActionBlock, `ARG_VALUE_${i}`);
            if (v === null) break;
            args.push(v);
          }
          // Fallback to raw JSON list if present
          if (args.length === 0) {
            const raw = getField(contractActionBlock, "ARGUMENTS");
            try {
              const parsed = JSON.parse(raw || "[]");
              if (Array.isArray(parsed)) jsonData.arguments = parsed;
            } catch {
              jsonData.arguments = [];
            }
          } else {
            jsonData.arguments = args;
          }
        }
      }

      // Event Job
      if (eventBlock) {
        const tChain = getField(eventBlock, "TRIGGER_CHAIN_ID");
        const tAddr = getField(eventBlock, "TRIGGER_CONTRACT_ADDRESS");
        const tEvent = getField(eventBlock, "TRIGGER_EVENT");
        const fName = getField(eventBlock, "EVENT_FILTER_PARA_NAME");
        const fVal = getField(eventBlock, "EVENT_FILTER_VALUE");
        if (tChain) jsonData.trigger_chain_id = tChain;
        if (tAddr) jsonData.trigger_contract_address = tAddr;
        if (tEvent) jsonData.trigger_event = tEvent;
        if (fName) jsonData.event_filter_para_name = fName;
        if (fName && fVal) jsonData.event_filter_value = fVal;
      } else if (jsonData.target_chain_id) {
        // Default trigger_chain_id to selected chain
        jsonData.trigger_chain_id = jsonData.target_chain_id;
      }

      // Condition Job
      if (conditionBlock) {
        const cType = getField(conditionBlock, "CONDITION_TYPE");
        const srcUrl = getField(conditionBlock, "VALUE_SOURCE_URL");
        const keyRoute = getField(conditionBlock, "SELECTED_KEY_ROUTE");
        const lower = getField(conditionBlock, "LOWER_LIMIT");
        const upper = getField(conditionBlock, "UPPER_LIMIT");
        if (cType) jsonData.condition_type = cType;
        if (srcUrl) jsonData.value_source_type = "api";
        if (srcUrl) jsonData.value_source_url = srcUrl;
        if (keyRoute) jsonData.selected_key_route = keyRoute;
        if (lower) jsonData.lower_limit = Number(lower);
        if (upper) jsonData.upper_limit = Number(upper);
      }

      // task_definition_id (1-6) based on job type and arg_type
      const argTypeForTask = (jsonData.arg_type as number) || 1; // 1=static, 2=dynamic
      const isCondition = !!conditionBlock;
      const isEvent = !!eventBlock;
      let jobTypeNum = 1; // 1 time-based, 2 condition, 3 event
      if (isCondition) jobTypeNum = 2;
      else if (isEvent) jobTypeNum = 3;
      // mirror getTaskDefinitionId
      let taskDef = 1;
      const isStatic = argTypeForTask === 1;
      if (isStatic) {
        taskDef = jobTypeNum === 1 ? 1 : jobTypeNum === 2 ? 5 : 3;
      } else {
        taskDef = jobTypeNum === 1 ? 2 : jobTypeNum === 2 ? 6 : 4;
      }
      jsonData.task_definition_id = taskDef;

      setJsonPreview(JSON.stringify(jsonData, null, 2));

      // Build human-readable preview from XML fields
      const parts: string[] = [];

      // Extract chain and wallet information for human preview
      const chainBlock = findFirstBlockByType("chain_selection");
      const walletBlock = findFirstBlockByType("wallet_selection");

      if (chainBlock) {
        const chainId = getField(chainBlock, "CHAIN_ID") || "(unspecified)";
        // Find the network name from the chain ID
        const network = networksData.supportedNetworks.find(
          (n: { id: number; name: string; type: string }) =>
            n.id.toString() === chainId,
        );
        const chainName = network ? network.name : `Chain ID ${chainId}`;
        parts.push(`This job will run on the ${chainName} blockchain.`);
      }

      if (walletBlock) {
        const walletAddress =
          getField(walletBlock, "WALLET_ADDRESS") || "(unspecified)";
        parts.push(`The job will use wallet address ${walletAddress}.`);
      }

      // reuse previously found cronBlock, fixedBlock, intervalBlock, timeframeBlock

      const pluralize = (valueStr: string | null, unitSingular: string) => {
        if (!valueStr) return unitSingular + "s";
        const v = Number(valueStr);
        return v === 1 ? unitSingular : unitSingular + "s";
      };

      if (cronBlock) {
        const expr = getField(cronBlock, "CRON_EXPRESSION") || "(invalid)";
        parts.push(`Cron-based job scheduled with expression "${expr}".`);
      } else if (fixedBlock) {
        const at =
          getField(fixedBlock, "SCHEDULE_TIME") || "(unspecified time)";
        parts.push(`One-time job scheduled at ${at}.`);
      } else if (intervalBlock) {
        const val = getField(intervalBlock, "TIME_INTERVAL_VALUE") || "0";
        const unit = getField(intervalBlock, "TIME_INTERVAL_UNIT") || "second";
        const untilDate = getField(intervalBlock, "UNTIL_DATE");
        const untilTime = getField(intervalBlock, "UNTIL_TIME");
        const unitLabel = pluralize(val, unit);
        if (untilDate && untilTime) {
          parts.push(
            `Time-based job runs every ${val} ${unitLabel} until ${untilDate} ${untilTime}.`,
          );
        } else {
          parts.push(`Time-based job runs every ${val} ${unitLabel}.`);
        }
      }

      if (timeframeBlock) {
        const tfVal = getField(timeframeBlock, "TIMEFRAME_VALUE") || "0";
        const tfUnit = getField(timeframeBlock, "TIMEFRAME_UNIT") || "second";
        const unitLabel = pluralize(tfVal, tfUnit);
        parts.push(`It continues for ${tfVal} ${unitLabel}.`);
      }

      if (parts.length === 0) {
        parts.push("No job blocks detected yet. Add blocks to see a preview.");
      }
      setHumanPreview(parts.join(" "));
    } catch (e) {
      console.error("Error parsing XML or generating code:", e);
      setJsonPreview(
        JSON.stringify(
          { error: "Failed to parse XML or generate code" },
          null,
          2,
        ),
      );
    }
  }, [xml, jobTitle]);

  useEffect(() => {
    generateJson();
  }, [xml, generateJson]);

  return { jsonPreview, humanPreview };
}
