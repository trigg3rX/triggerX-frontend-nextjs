"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Typography } from "../ui/Typography";
import * as Blockly from "blockly/core";
import { LucideCopyButton } from "../ui/CopyButton";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { JobTitleInput } from "../create-job/form/JobTitleInput";
import { Button } from "../ui/Button";
import { javascriptGenerator } from "blockly/javascript";

import {
  chainSelectionGenerator,
  walletSelectionGenerator,
} from "./blocks/default_blocks";
import { fixedTimeJobGenerator } from "./time and schedule blocks/fixed_time_job";
import { intervalTimeJobGenerator } from "./time and schedule blocks/interval_time_job";
import { cronTimeJobGenerator } from "./time and schedule blocks/cron_time_job";
import { eventJobGenerator } from "./time and schedule blocks/event_job";
import { conditionJobGenerator } from "./time and schedule blocks/condition_job";
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
    toolboxBackgroundColour: "#1A1A1A",
    toolboxForegroundColour: "#ffffff",
    flyoutBackgroundColour: "#303030",
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
  const { jobTitleError, jobTitleErrorRef } = useJobFormContext();

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
        {
          kind: "category",
          name: "Time & Schedule",
          colour: "30",
          contents: [
            { kind: "block", type: "fixed_time_job" },
            { kind: "block", type: "interval_time_job" },
            { kind: "block", type: "cron_time_job" },
            { kind: "block", type: "event_job" },
            { kind: "block", type: "condition_job" },
          ],
        },
        {
          kind: "category",
          name: "Contract Actions", // NEW CATEGORY
          colour: "260", // Matching the block's color
          contents: [
            {
              kind: "block",
              type: "contract_action",
              // Initial values for the fields.
              // The mutator handles initial input creation (Static/Dynamic).
              fields: {
                TARGET_FUNCTION: "transfer",
                TARGET_CONTRACT_ADDRESS: "0x...",
                TARGET_CHAIN_ID: "1",
                ABI: "[]", // Default empty ABI JSON array
              },
              // For the mutator-controlled inputs, you can provide shadow blocks
              // if you want default connected blocks when the mutator is initially set to 'static'.
              extraState: {
                argType: "static", // Default mutator state
                // You might need to provide an initial shadow block for STATIC_ARGUMENTS_INPUT here
                // if you want it to appear with a default value immediately on drag.
                // For example, if you register a `json_array_block` that outputs `[]`.
              },
            },
          ],
        },
        {
          kind: "category",
          name: "TimeFrame",
          colour: "30",
          contents: [{ kind: "block", type: "timeframe_job" }],
        },
        {
          kind: "category",
          name: "Logic",
          colour: "210", // Matching logic block colors
          contents: [
            { kind: "block", type: "logic_not" },
            { kind: "block", type: "logic_compare_equality" },
            { kind: "block", type: "logic_compare_greater_than" },
            { kind: "block", type: "controls_if" },
            { kind: "block", type: "contract_event_check" },
          ],
        },
        {
          kind: "category",
          name: "Loops",
          colour: "120", // Matching loop block colors
          contents: [
            { kind: "block", type: "controls_repeat_until" },
            { kind: "block", type: "controls_forever" },
            { kind: "block", type: "controls_repeat_every_interval" },
          ],
        },
        {
          kind: "category",
          name: "Math",
          colour: "230", // Matching math block colors
          contents: [
            { kind: "block", type: "math_round" },
            { kind: "block", type: "math_number" }, // For numbers like '5000'
          ],
        },
        {
          kind: "category",
          name: "Data / Sensors",
          colour: "0", // Matching data/sensor block colors
          contents: [
            { kind: "block", type: "get_current_time" },
            { kind: "block", type: "job_target_time" },
            { kind: "block", type: "get_price" },
            {
              kind: "block",
              type: "chain_selection", // Re-use existing block, but make it output
              output: "Number", // If it outputs the chain ID
              fields: { CHAIN_ID: "1" },
              tooltip: "Selects a blockchain and outputs its ID.",
            },
            {
              kind: "block",
              type: "wallet_selection", // Re-use existing block, but make it output
              output: "String", // If it outputs the wallet address
              fields: { WALLET_ADDRESS: "0x..." },
              tooltip: "Selects a wallet and outputs its address.",
            },
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

      // NEW: Also generate JavaScript code for demo purposes
      const workspace = new Blockly.Workspace();
      // FIX: Cast Document to Element
      Blockly.Xml.domToWorkspace(
        parser.parseFromString(xml, "text/xml") as unknown as Element,
        workspace,
      );
      const generatedCode = javascriptGenerator.workspaceToCode(workspace);
      console.log("Generated JS Code:", generatedCode); // Log it for now
      // You could update another state variable to display this code
      workspace.dispose(); // Clean up the temporary workspace
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
    <div className="flex flex-col gap-3 -mt-[10px] lg:-mt-[200px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <h1 className="font-sharp text-3xl text-gray-300 text-left">
            Create Automation Job
          </h1>

          <JobTitleInput error={jobTitleError || null} ref={jobTitleErrorRef} />
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
      </div>

      <div className="flex gap-0 h-[80vh]">
        <div className="h-full overflow-hidden w-[80%]">
          <BlocklyWorkspace
            className="w-full h-full bg-[#141414]"
            toolboxConfiguration={toolboxJson}
            initialXml={xml}
            onXmlChange={onXmlChange}
            workspaceConfiguration={{
              theme: triggerxTheme,
              zoom: {
                controls: true,
                wheel: true,
                startScale: 0.9,
                maxScale: 2,
                minScale: 0.3,
                scaleSpeed: 1.2,
              },
              grid: { spacing: 20, length: 3, colour: "#ffffff0d", snap: true },
              trashcan: true,
            }}
          />
        </div>
        <div className="h-full bg-[#1A1A1A] w-[20%] p-6">
          <div className="flex items-center justify-between">
            <Typography
              variant="h2"
              align="left"
              color="yellow"
              className="font-medium mb-2"
            >
              Job JSON
            </Typography>

            <LucideCopyButton text={jsonPreview} />
          </div>
          <pre className="text-sm overflow-auto leading-6 mt-6 p-4 border rounded border-white/10 hover:border-white/20">
            {jsonPreview}
          </pre>
        </div>
      </div>
    </div>
  );
}
