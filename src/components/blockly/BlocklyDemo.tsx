"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { contractActionGenerator } from "./blocks/contract_action";
import { timeframeJobGenerator } from "./blocks/timeframe_job";

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
import { contractEventCheckGenerator } from "./blocks/event_blocks/contract_event_check";
import { recurringJobGenerator } from "./blocks/recurring_job";
import { operatorAddGenerator } from "./blocks/operators/operator_add_block";
import { operatorSubtractGenerator } from "./blocks/operators/operator_subtract_block";
import { operatorMultiplyGenerator } from "./blocks/operators/operator_multiply_block";
import { operatorDivideGenerator } from "./blocks/operators/operator_divide_block";
import { operatorLtGenerator } from "./blocks/operators/operator_lt_block";
import { operatorEqualsGenerator } from "./blocks/operators/operator_equals_block";
import { operatorGtGenerator } from "./blocks/operators/operator_gt_block";
import { Card } from "../ui/Card";
import "./customToolbox";

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
    insertionMarkerColour: "#ffffff0d",
    insertionMarkerOpacity: 0.3,
    cursorColour: "#ffffff0d",
    markerColour: "#ffffff0d",
  },
});

export default function BlocklyDemo() {
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
  } = useJobFormContext();

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

    javascriptGenerator.forBlock["contract_event_check"] =
      contractEventCheckGenerator;

    javascriptGenerator.forBlock["controls_repeat_every_interval"] =
      controlsRepeatEveryIntervalGenerator;

    javascriptGenerator.forBlock["recurring_job"] = recurringJobGenerator;

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

  const toolboxJson = useMemo(
    () => ({
      kind: "categoryToolbox",
      contents: [
        // --- DEFAULT BLOCKS CATEGORY ---
        // These are required for validation and define the core context (Chain, Wallet)
        {
          kind: "category",
          name: "Default",
          colour: "65",
          contents: [
            {
              kind: "block",
              type: "wallet_selection",
              fields: {
                WALLET_ADDRESS: "0x...",
              },
            },
            {
              kind: "block",
              type: "chain_selection",
              fields: {
                CHAIN_ID: "1",
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
          ],
        },
        // --- LOGIC CATEGORY ---
        // For conditional logic and event-based checks.
        {
          kind: "category",
          name: "Logic",
          colour: "210",
          contents: [
            { kind: "block", type: "logic_not" },
            { kind: "block", type: "logic_compare_equality" },
            { kind: "block", type: "logic_compare_greater_than" },
            { kind: "block", type: "controls_if" },
            { kind: "block", type: "contract_event_check" },
          ],
        },
        // --- LOOPS CATEGORY ---
        // For repeating actions or conditions.
        {
          kind: "category",
          name: "Loops",
          colour: "120",
          contents: [
            { kind: "block", type: "controls_repeat_until" },
            { kind: "block", type: "controls_forever" },
            { kind: "block", type: "controls_repeat_every_interval" },
          ],
        },
        // --- MATH CATEGORY ---
        // For numerical operations and constants.
        {
          kind: "category",
          name: "Math",
          colour: "230",
          contents: [
            { kind: "block", type: "math_round" },
            { kind: "block", type: "math_number" },
          ],
        },
        // --- OPERATORS CATEGORY ---
        {
          kind: "category",
          name: "Operators",
          colour: "230",
          contents: [
            { kind: "block", type: "operator_add" },
            { kind: "block", type: "operator_subtract" },
            { kind: "block", type: "operator_multiply" },
            { kind: "block", type: "operator_divide" },
            { kind: "block", type: "operator_lt" },
            { kind: "block", type: "operator_equals" },
            { kind: "block", type: "operator_gt" },
          ],
        },
        // --- DATA INPUTS CATEGORY ---
        // Blocks that fetch or provide values for other blocks.
        {
          kind: "category",
          name: "Data Inputs",
          colour: "0",
          contents: [
            { kind: "block", type: "get_current_time" },
            { kind: "block", type: "job_target_time" },
            { kind: "block", type: "get_price" },
          ],
        },
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
    // For demo: convert XML to a very naive JSON structure (counts blocks)
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");
      const blockNodes = Array.from(doc.getElementsByTagName("block"));
      const summary = blockNodes.reduce<Record<string, number>>((acc, node) => {
        const type = node.getAttribute("type") || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      setJsonPreview(JSON.stringify({ blockCounts: summary }, null, 2));

      // Build human-readable preview from XML fields
      const getField = (blockEl: Element, name: string): string | null => {
        const fields = Array.from(blockEl.getElementsByTagName("field"));
        const match = fields.find((f) => f.getAttribute("name") === name);
        return match ? (match.textContent || "").trim() : null;
      };

      const findFirstBlockByType = (type: string): Element | undefined =>
        blockNodes.find((b) => (b.getAttribute("type") || "") === type);

      const parts: string[] = [];

      const cronBlock = findFirstBlockByType("cron_time_job");
      const fixedBlock = findFirstBlockByType("fixed_time_job");
      const intervalBlock = findFirstBlockByType("interval_time_job");
      const timeframeBlock = findFirstBlockByType("timeframe_job");

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
        const unitLabel = pluralize(val, unit);
        parts.push(`Time-based job runs every ${val} ${unitLabel}.`);
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
  }, [xml]);

  useEffect(() => {
    generateJson();
  }, [xml, generateJson]);

  return (
    <div className="flex flex-col gap-2 -mt-[10px] lg:-mt-[200px]">
      <Typography variant="h1">Create Automation Job</Typography>

      <Card className="flex items-center justify-between gap-4 !border-0 !p-3 mt-5">
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
            type="submit"
            color="white"
            className="min-w-[120px] md:min-w-[170px]"
          >
            Save Job
          </Button>

          <Button
            type="button"
            color="yellow"
            className="min-w-[120px] md:min-w-[170px]"
          >
            Create Job
          </Button>
        </div>
      </Card>

      <div className="flex gap-2 h-[80vh]">
        <div className="h-full overflow-hidden w-[75%] rounded-2xl">
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
                startScale: 0.8,
                maxScale: 1,
                minScale: 1,
                scaleSpeed: 1,
              },
              grid: { spacing: 25, length: 3, colour: "#1f1f1f", snap: true },
              renderer: "zelos",
              trashcan: true,
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
    </div>
  );
}
