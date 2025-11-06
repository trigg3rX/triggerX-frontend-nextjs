"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import * as Blockly from "blockly/core";
import DisableInteractions from "@/app/DisableInteractions";

// react-blockly uses window, so ensure client-only dynamic import
const BlocklyWorkspace = dynamic(
  () => import("react-blockly").then((m) => m.BlocklyWorkspace),
  {
    ssr: false,
  },
);

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

interface BlocklyWorkspaceSectionProps {
  xml: string;
  onXmlChange: (newXml: string) => void;
  workspaceScopeRef: React.RefObject<HTMLDivElement | null>;
}

export function BlocklyWorkspaceSection({
  xml,
  onXmlChange,
  workspaceScopeRef,
}: BlocklyWorkspaceSectionProps) {
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
      ],
    }),
    [],
  );

  return (
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
  );
}
