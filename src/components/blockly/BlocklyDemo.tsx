"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { Typography } from "../ui/Typography";
import * as Blockly from "blockly/core";
import { LucideCopyButton } from "../ui/CopyButton";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { Button } from "../ui/Button";
import { javascriptGenerator } from "blockly/javascript";

import {
  chainSelectionGenerator,
  walletSelectionGenerator,
} from "./blocks/default_blocks";

import { fixedTimeJobGenerator } from "./blocks/job-type/fixed_time_job";
import { intervalTimeJobGenerator } from "./blocks/job-type/interval_time_job";
import { cronTimeJobGenerator } from "./blocks/job-type/cron_time_job";
import { eventJobGenerator } from "./blocks/job-type/event_job";
import { conditionJobGenerator } from "./blocks/job-type/condition_job";

import { contractActionGenerator } from "./blocks/utility/contract_action";
import { timeframeJobGenerator } from "./blocks/utility/timeframe_job";
import { recurringJobGenerator } from "./blocks/utility/recurring_job";
import { manualAbiInputGenerator } from "./blocks/utility/manual_abi_input";
import {
  controlsIfGenerator,
  logicCompareEqualityGenerator,
  logicCompareGreaterThanGenerator,
  logicNotGenerator,
} from "./blocks/logic_blocks";
import {
  controlsForeverGenerator,
  controlsRepeatEveryIntervalGenerator,
  controlsRepeatUntilGenerator,
} from "./blocks/loop_blocks";
import { mathNumberGenerator, mathRoundGenerator } from "./blocks/math_blocks";
import {
  getCurrentTimeGenerator,
  getPriceGenerator,
  jobTargetTimeGenerator,
} from "./blocks/dynamic_data_blocks";

import { operatorAddGenerator } from "./blocks/operators/operator_add_block";
import { operatorSubtractGenerator } from "./blocks/operators/operator_subtract_block";
import { operatorMultiplyGenerator } from "./blocks/operators/operator_multiply_block";
import { operatorDivideGenerator } from "./blocks/operators/operator_divide_block";
import { operatorLtGenerator } from "./blocks/operators/operator_lt_block";
import { operatorEqualsGenerator } from "./blocks/operators/operator_equals_block";
import { operatorGtGenerator } from "./blocks/operators/operator_gt_block";
import { Card } from "../ui/Card";
import "./customToolbox";
import networksData from "@/utils/networks.json";
import DisableInteractions from "@/app/DisableInteractions";
import { validateBlocklyWorkspace } from "./validateBlocklyWorkspace";
import JobFeeModal from "../create-job/JobFeeModal";
import { useTGBalance } from "@/contexts/TGBalanceContext";
import { useAccount } from "wagmi";

// react-blockly uses window, so ensure client-only dynamic import
const BlocklyWorkspace = dynamic(
  () => import("react-blockly").then((m) => m.BlocklyWorkspace),
  {
    ssr: false,
  },
);

type SerializedState = {
  xml: string;
};

const LOCAL_STORAGE_KEY = "triggerx:blockly-demo:xml";

const triggerxTheme = Blockly.Theme.defineTheme("triggerx_theme", {
  name: "triggerx_theme",
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: "#141414",
    toolboxBackgroundColour: "#1C1C1C",
    toolboxForegroundColour: "#ffffff",
    flyoutBackgroundColour: "#313334",
    flyoutForegroundColour: "#ffffff",
    flyoutOpacity: 1,
    scrollbarColour: "transparent",
    insertionMarkerColour: "#ffffff",
    insertionMarkerOpacity: 0.3,
    cursorColour: "#ffffff",
    markerColour: "#ffffff",
  },
});

export default function BlocklyDemo() {
  const workspaceScopeRef = useRef<HTMLDivElement | null>(null);
  const [xml, setXml] = useState<string>(
    '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
  );
  const [jsonPreview, setJsonPreview] = useState<string>("{}");
  const [humanPreview, setHumanPreview] = useState<string>("");
  const {
    jobTitle,
    setJobTitle,
    setJobTitleError,
    jobTitleError,
    jobTitleErrorRef,
    selectedNetwork,
  } = useJobFormContext();

  // TG Balance context
  const { userBalance, fetchTGBalance } = useTGBalance();
  const { address, chain } = useAccount();

  // Permission and modal state
  const [hasConfirmedPermission, setHasConfirmedPermission] =
    useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);
  const permissionCheckboxRef = useRef<HTMLDivElement | null>(null);

  // Register the custom block's generators
  useEffect(() => {
    javascriptGenerator.forBlock["chain_selection"] = chainSelectionGenerator;
    javascriptGenerator.forBlock["wallet_selection"] = walletSelectionGenerator;

    javascriptGenerator.forBlock["fixed_time_job"] = fixedTimeJobGenerator;
    javascriptGenerator.forBlock["interval_time_job"] =
      intervalTimeJobGenerator;
    javascriptGenerator.forBlock["cron_time_job"] = cronTimeJobGenerator;
    javascriptGenerator.forBlock["event_job"] = eventJobGenerator;
    javascriptGenerator.forBlock["condition_job"] = conditionJobGenerator;

    javascriptGenerator.forBlock["contract_action"] = contractActionGenerator;
    javascriptGenerator.forBlock["timeframe_job"] = timeframeJobGenerator;

    javascriptGenerator.forBlock["logic_not"] = logicNotGenerator;
    javascriptGenerator.forBlock["logic_compare_equality"] =
      logicCompareEqualityGenerator;
    javascriptGenerator.forBlock["logic_compare_greater_than"] =
      logicCompareGreaterThanGenerator;
    javascriptGenerator.forBlock["controls_if"] = controlsIfGenerator;

    // Loop Blocks
    javascriptGenerator.forBlock["controls_repeat_until"] =
      controlsRepeatUntilGenerator;
    javascriptGenerator.forBlock["controls_forever"] = controlsForeverGenerator;

    // Math Blocks
    javascriptGenerator.forBlock["math_round"] = mathRoundGenerator;
    javascriptGenerator.forBlock["math_number"] = mathNumberGenerator;

    // Dynamic Data Blocks
    javascriptGenerator.forBlock["get_current_time"] = getCurrentTimeGenerator;
    javascriptGenerator.forBlock["job_target_time"] = jobTargetTimeGenerator;
    javascriptGenerator.forBlock["get_price"] = getPriceGenerator;

    javascriptGenerator.forBlock["controls_repeat_every_interval"] =
      controlsRepeatEveryIntervalGenerator;

    javascriptGenerator.forBlock["recurring_job"] = recurringJobGenerator;
    javascriptGenerator.forBlock["manual_abi_input"] = manualAbiInputGenerator;

    // operator blocks
    javascriptGenerator.forBlock["operator_add"] = operatorAddGenerator;
    javascriptGenerator.forBlock["operator_subtract"] =
      operatorSubtractGenerator;
    javascriptGenerator.forBlock["operator_multiply"] =
      operatorMultiplyGenerator;
    javascriptGenerator.forBlock["operator_divide"] = operatorDivideGenerator;
    javascriptGenerator.forBlock["operator_lt"] = operatorLtGenerator;
    javascriptGenerator.forBlock["operator_equals"] = operatorEqualsGenerator;
    javascriptGenerator.forBlock["operator_gt"] = operatorGtGenerator;
  }, []);

  // Load any previously saved workspace
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: SerializedState = JSON.parse(saved);
        if (parsed?.xml) setXml(parsed.xml);
      } catch {
        // ignore corrupt state
      }
    }
  }, []);

  // Fetch TG balance on mount and when wallet changes
  useEffect(() => {
    if (address) {
      fetchTGBalance();
    }
  }, [address, chain, fetchTGBalance]);

  // Refetch TG balance when modal opens
  useEffect(() => {
    if (isModalOpen && address) {
      fetchTGBalance();
    }
  }, [isModalOpen, address, fetchTGBalance]);

  const toolboxJson = useMemo(
    () => ({
      kind: "categoryToolbox",
      contents: [
        // --- WALLET CATEGORY ---
        // Required for job configuration - defines the wallet address
        {
          kind: "category",
          name: "Wallet",
          colour: "#F57F17",
          contents: [
            {
              kind: "block",
              type: "wallet_selection",
              fields: {
                WALLET_ADDRESS: "0x...",
              },
            },
          ],
        },
        // --- CHAIN CATEGORY ---
        // Required for job configuration - defines the target blockchain
        {
          kind: "category",
          name: "Chain",
          colour: "#1CD35F",
          contents: [
            {
              kind: "block",
              type: "chain_selection",
              fields: {
                CHAIN_ID: "11155420", // OP Sepolia chain ID as default (first in networks.json)
              },
            },
          ],
        },
        // --- JOB TYPE CATEGORY ---
        // Any one of these is required for validation, defining *how* the job is triggered.
        {
          kind: "category",
          name: "Job Type",
          colour: "30",
          contents: [
            { kind: "block", type: "fixed_time_job" },
            { kind: "block", type: "interval_time_job" },
            { kind: "block", type: "cron_time_job" },
            { kind: "block", type: "event_job" },
            { kind: "block", type: "condition_job" },
          ],
        },
        // --- UTILITY CATEGORY ---
        // Contains essential actions and parameters for the job's execution.
        {
          kind: "category",
          name: "Utility",
          colour: "260",
          contents: [
            {
              kind: "block",
              type: "contract_action",
              fields: {
                TARGET_FUNCTION: "transfer",
                TARGET_CONTRACT_ADDRESS: "0x...",
                TARGET_CHAIN_ID: "1",
                ABI: "[]",
              },
              extraState: {
                argType: "static",
              },
            },
            { kind: "block", type: "timeframe_job" },
            { kind: "block", type: "recurring_job" },
            { kind: "block", type: "manual_abi_input" },
          ],
        },
        // --- LOGIC CATEGORY ---
        // For conditional logic and event-based checks.
        // {
        //   kind: "category",
        //   name: "Logic",
        //   colour: "210",
        //   contents: [
        //     { kind: "block", type: "logic_not" },
        //     { kind: "block", type: "logic_compare_equality" },
        //     { kind: "block", type: "logic_compare_greater_than" },
        //     { kind: "block", type: "controls_if" },
        //   ],
        // },
        // --- LOOPS CATEGORY ---
        // For repeating actions or conditions.
        // {
        //   kind: "category",
        //   name: "Loops",
        //   colour: "120",
        //   contents: [
        //     { kind: "block", type: "controls_repeat_until" },
        //     { kind: "block", type: "controls_forever" },
        //     { kind: "block", type: "controls_repeat_every_interval" },
        //   ],
        // },
        // --- MATH CATEGORY ---
        // For numerical operations and constants.
        // {
        //   kind: "category",
        //   name: "Math",
        //   colour: "230",
        //   contents: [
        //     { kind: "block", type: "math_round" },
        //     { kind: "block", type: "math_number" },
        //   ],
        // },
        // --- OPERATORS CATEGORY ---
        // {
        //   kind: "category",
        //   name: "Operators",
        //   colour: "230",
        //   contents: [
        //     { kind: "block", type: "operator_add" },
        //     { kind: "block", type: "operator_subtract" },
        //     { kind: "block", type: "operator_multiply" },
        //     { kind: "block", type: "operator_divide" },
        //     { kind: "block", type: "operator_lt" },
        //     { kind: "block", type: "operator_equals" },
        //     { kind: "block", type: "operator_gt" },
        //   ],
        // },
        // --- DATA INPUTS CATEGORY ---
        // Blocks that fetch or provide values for other blocks.
        // {
        //   kind: "category",
        //   name: "Data Inputs",
        //   colour: "0",
        //   contents: [
        //     { kind: "block", type: "get_current_time" },
        //     { kind: "block", type: "job_target_time" },
        //     { kind: "block", type: "get_price" },
        //   ],
        // },
      ],
    }),
    [],
  );

  const onXmlChange = useCallback((newXml: string) => {
    setXml(newXml);
    // persist
    try {
      const snapshot: SerializedState = { xml: newXml };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(snapshot),
        );
      }
    } catch {
      // ignore quota errors
    }
  }, []);

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

  /**
   * Handle Create Job button click
   * Validates workspace and opens fee modal if validation passes
   */
  const handleCreateJob = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Reset all errors
      setJobTitleError(null);
      setPermissionError(null);
      setWorkspaceError(null);

      // Check permission checkbox
      if (!hasConfirmedPermission) {
        const errorMsg =
          "Please confirm that the address has the required role/permission.";
        setPermissionError(errorMsg);
        // Scroll to permission checkbox
        setTimeout(() => {
          permissionCheckboxRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
        return;
      }

      // Validate workspace blocks
      const validationResult = validateBlocklyWorkspace({
        xml,
        jobTitle,
        connectedAddress: address, // Pass connected wallet address for validation
      });

      if (validationResult) {
        const { errorKey, errorValue } = validationResult;

        // Set appropriate error state
        if (errorKey === "jobTitle") {
          setJobTitleError(errorValue);
          // Scroll to job title input
          setTimeout(() => {
            jobTitleErrorRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        } else {
          // For workspace-related errors
          setWorkspaceError(errorValue);
          // Scroll to workspace
          setTimeout(() => {
            workspaceScopeRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }
        return;
      }

      // All validation passed - open fee modal
      setEstimatedFee(0);
      setIsModalOpen(true);
      // JobFeeModal will handle fee estimation and final submission
    },
    [
      setJobTitleError,
      hasConfirmedPermission,
      xml,
      jobTitle,
      address,
      jobTitleErrorRef,
    ],
  );

  /**
   * Handle Save Job button click
   * Saves the current workspace state
   */
  const handleSaveJob = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Simple save - the workspace XML is already being saved to localStorage
    // in the onXmlChange callback
    // We can add additional validation or backend save here if needed

    // For now, just show a success message
    alert("Workspace saved successfully!");
  }, []);

  return (
    <div className="flex flex-col gap-2 -mt-[10px] lg:-my-[200px] pt-[100px] pb-[400px]">
      <Typography variant="h1">Create Automation Job</Typography>

      <Card className="flex items-center justify-between gap-4 !border-0 !p-3 mt-10">
        <div
          className="flex items-center gap-6 w-full md:w-auto"
          ref={jobTitleErrorRef}
        >
          <div className="flex items-center w-full md:w-[300px]">
            <input
              type="text"
              placeholder="Untitled Job"
              value={jobTitle}
              onChange={(e) => {
                const value = e.target.value;
                setJobTitle(value);
                if (value.trim() !== "") setJobTitleError(null);
              }}
              className="bg-[#181818] text-[#EDEDED] border border-[#A2A2A2] placeholder-[#A2A2A2] rounded-l-full px-6 py-2.5 focus:outline-none text-sm sm:text-base shadow-none w-full"
            />
            <button
              type="button"
              className="bg-[#C07AF6] hover:bg-[#a46be0] transition-colors w-12 h-12 aspect-square flex items-center justify-center -ml-8 z-10 rounded-full"
              aria-label="Set job title"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#fff"
                strokeWidth="2"
              >
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                <path d="M20.71 7.04a1.004 1.004 0 0 0 0-1.42l-2.34-2.34a1.004 1.004 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
              </svg>
            </button>
          </div>
          {jobTitleError && (
            <div className="text-red-500 text-xs sm:text-sm mt-2">
              {jobTitleError}
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-center items-center relative z-10">
          <Button
            type="button"
            color="white"
            className="min-w-[120px] md:min-w-[170px]"
            onClick={handleSaveJob}
          >
            Save Job
          </Button>

          <Button
            type="button"
            color="yellow"
            className="min-w-[120px] md:min-w-[170px]"
            onClick={handleCreateJob}
            disabled={isModalOpen}
          >
            {isModalOpen ? "Estimating fees..." : "Create Job"}
          </Button>
        </div>
      </Card>

      {/* Error display for workspace validation */}
      {workspaceError && (
        <Card className="!border-red-500 !bg-red-500/10 mt-4">
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-red-500 text-sm sm:text-base font-medium">
                Validation Error
              </p>
              <p className="text-red-400 text-xs sm:text-sm mt-1">
                {workspaceError}
              </p>
            </div>
            <button
              onClick={() => setWorkspaceError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
              aria-label="Close error"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </Card>
      )}

      {/* TG Balance Display */}
      {address && (
        <Card className="mt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#C07AF6]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex flex-col items-start">
                <Typography variant="body" className="font-medium">
                  Your TG Balance
                </Typography>
                <Typography
                  variant="caption"
                  color="secondary"
                  className="text-xs"
                >
                  {address.slice(0, 6)}...{address.slice(-4)}
                  <LucideCopyButton text={address} />
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Typography
                variant="body"
                color="secondary"
                className="font-mono"
              >
                {userBalance !== null && userBalance !== undefined
                  ? Number(userBalance).toFixed(6)
                  : "0.000000"}{" "}
                TG
              </Typography>
              <button
                onClick={() => fetchTGBalance()}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="Refresh balance"
                title="Refresh balance"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Permission Checkbox Card */}
      <div ref={permissionCheckboxRef}>
        <Card className="flex flex-col items-start gap-2 mt-4">
          <div className="flex items-start gap-2">
            <input
              id="blockly-permission-checkbox"
              type="checkbox"
              checked={hasConfirmedPermission}
              onChange={(e) => {
                setHasConfirmedPermission(e.target.checked);
                if (e.target.checked) setPermissionError(null);
              }}
              className="w-4 h-4 mt-1"
            />
            <label
              htmlFor="blockly-permission-checkbox"
              className="text-sm select-none text-gray-400 cursor-pointer"
            >
              If your target function contains a modifier or requires certain
              address for calling the function, then make sure that this
              <span className="ml-2 text-white break-all">
                {networksData.supportedNetworks.find(
                  (n) => n.name === selectedNetwork,
                )?.type === "mainnet"
                  ? "0x3509F38e10eB3cDcE7695743cB7e81446F4d8A33"
                  : "0x179c62e83c3f90981B65bc12176FdFB0f2efAD54"}
              </span>
              <LucideCopyButton
                text={
                  networksData.supportedNetworks.find(
                    (n) => n.name === selectedNetwork,
                  )?.type === "mainnet"
                    ? "0x3509F38e10eB3cDcE7695743cB7e81446F4d8A33"
                    : "0x179c62e83c3f90981B65bc12176FdFB0f2efAD54"
                }
                className="align-middle inline-block !px-2"
              />
              address have role/permission to call that function.
            </label>
          </div>
          {permissionError && (
            <div className="text-red-500 text-xs sm:text-sm ml-6">
              {permissionError}
            </div>
          )}
        </Card>
      </div>

      <div className="flex gap-2 h-[80vh]">
        <div
          className="h-full overflow-hidden w-[75%] rounded-2xl"
          ref={workspaceScopeRef}
        >
          <DisableInteractions
            scopeRef={
              workspaceScopeRef as unknown as React.MutableRefObject<HTMLElement | null>
            }
          />
          <BlocklyWorkspace
            className="w-full h-full bg-[#141414]"
            toolboxConfiguration={toolboxJson}
            initialXml={xml}
            onXmlChange={onXmlChange}
            workspaceConfiguration={{
              theme: triggerxTheme,
              zoom: {
                controls: false,
                wheel: false,
                pinch: false,
                startScale: 0.6,
                maxScale: 1,
                minScale: 1,
                scaleSpeed: 1,
              },
              grid: { spacing: 25, length: 3, colour: "#1f1f1f", snap: true },
              renderer: "zelos",
              trashcan: false,
            }}
          />
        </div>

        <div className="h-full bg-[#141414] w-[25%] rounded-2xl p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex flex-col h-1/2">
            <div className="flex items-center justify-between">
              <Typography variant="h2" align="left">
                Job Preview
              </Typography>
            </div>
            <pre className="text-sm overflow-auto leading-6 mt-4 p-5 sm:p-6 rounded-2xl bg-[#1C1C1C] whitespace-pre-wrap break-words flex-1">
              {humanPreview}
            </pre>
          </div>

          <div className="flex flex-col h-1/2">
            <div className="flex items-center justify-between">
              <Typography variant="h2" align="left">
                Job JSON
              </Typography>
              <div className="p-1 aspect-square rounded-full bg-[#C07AF6] hover:bg-[#a46be0] transition-colors flex items-center justify-center">
                <LucideCopyButton text={jsonPreview} />
              </div>
            </div>
            <pre className="text-sm overflow-auto leading-6 mt-4 p-5 sm:p-6 rounded-2xl bg-[#1C1C1C] flex-1">
              {jsonPreview}
            </pre>
          </div>
        </div>
      </div>

      {/* Job Fee Modal */}
      <JobFeeModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        estimatedFee={estimatedFee}
      />
    </div>
  );
}
