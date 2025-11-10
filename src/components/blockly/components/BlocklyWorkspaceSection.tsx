"use client";

import React, { useMemo, useEffect, useRef } from "react";
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
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

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
            { kind: "block", type: "time_based_job_wrapper" },
            { kind: "block", type: "event_based_job_wrapper" },
            { kind: "block", type: "condition_based_job_wrapper" },
          ],
        },
        // --- TIME UTILITIES ---
        {
          kind: "category",
          name: "Time",
          colour: "300",
          contents: [
            { kind: "block", type: "specific_datetime" },
            { kind: "block", type: "cron_expression" },
            { kind: "block", type: "time_interval_at_job" },
          ],
        },
        // --- EVENT UTILITIES ---
        {
          kind: "category",
          name: "Event",
          colour: "220",
          contents: [{ kind: "block", type: "event_listener" }],
        },
        // --- CONDITION UTILITIES ---
        {
          kind: "category",
          name: "Condition",
          colour: "110",
          contents: [{ kind: "block", type: "condition_monitor" }],
        },
        // --- CONTRACT UTILITIES ---
        {
          kind: "category",
          name: "Contract",
          colour: "190",
          contents: [
            { kind: "block", type: "execute_function" },
            { kind: "block", type: "argument_type" },
            { kind: "block", type: "static_arguments" },
            { kind: "block", type: "dynamic_arguments" },
            { kind: "block", type: "manual_abi_input" },
          ],
        },
        // --- COMMON UTILITIES ---
        {
          kind: "category",
          name: "Common",
          colour: "260",
          contents: [
            { kind: "block", type: "recurring_job" },
            { kind: "block", type: "timeframe_job" },
          ],
        },
      ],
    }),
    [],
  );

  // Keep flyout always open and disable click-to-place
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Get the primary workspace
        const workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
        if (workspace && workspace.getToolbox()) {
          workspaceRef.current = workspace;

          // Get the toolbox and select the first category to open the flyout
          const toolbox = workspace.getToolbox() as unknown as Blockly.Toolbox;
          if (toolbox) {
            // Get the first category and select it
            const firstCategory = toolbox.getToolboxItems?.()?.[0];
            if (firstCategory) {
              toolbox.setSelectedItem?.(firstCategory);
            }

            // Override the clearSelection method to prevent deselection
            toolbox.clearSelection = function () {
              // Don't clear selection - keep a category always selected
              // This keeps the flyout always visible
              return;
            };
          }

          // Prevent flyout from auto-closing and disable click-to-place
          const flyout = workspace.getFlyout() as unknown as Blockly.Flyout;
          if (flyout) {
            // Set autoClose to false
            flyout.autoClose = false;

            // Disable click-to-place by overriding the createBlock method
            // This forces users to drag blocks instead of clicking them
            const originalCreateBlock = flyout.createBlock;
            flyout.createBlock = function (
              originalBlock: Blockly.BlockSvg,
            ): Blockly.BlockSvg {
              // Only create blocks when dragging, not when clicking
              // Check if this is a drag operation by checking if there's a current gesture
              const currentGesture = Blockly.Gesture.inProgress();
              if (!currentGesture) {
                // This is a click, not a drag - prevent block creation
                throw new Error(
                  "Click-to-place is disabled. Please drag to create blocks.",
                );
              }
              // This is a drag - allow normal behavior
              return originalCreateBlock.call(flyout, originalBlock);
            };
          }
        }
      } catch (error) {
        console.error("Error configuring flyout:", error);
      }
    }, 500); // Wait for workspace to be fully initialized

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="h-full overflow-hidden w-full rounded-2xl"
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
