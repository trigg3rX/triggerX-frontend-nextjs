"use client";

import React, { useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import * as Blockly from "blockly/core";
import {
  ContinuousFlyout,
  ContinuousMetrics,
  ContinuousToolbox,
} from "@blockly/continuous-toolbox";
import DisableInteractions from "@/app/DisableInteractions";
import {
  setConnectedChainId,
  setConnectedWalletAddress,
} from "../blocks/default_blocks";
import { setImportSafeChainId } from "../blocks/utility/safe-wallet/import_safe_wallet";
import { SmartSuggestions } from "./SmartSuggestions";
import { syncBlocklyToJobForm } from "../utils/syncBlocklyToJobForm";
import { JobFormContextType } from "@/contexts/JobFormContext";

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
  connectedAddress?: string;
  connectedChainId?: number;
  jobFormContext: JobFormContextType;
}

export function BlocklyWorkspaceSection({
  xml,
  onXmlChange,
  workspaceScopeRef,
  connectedAddress,
  connectedChainId,
  jobFormContext,
}: BlocklyWorkspaceSectionProps) {
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                WALLET_ADDRESS: "0x...", // Always show placeholder in flyout
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
                CHAIN_ID: connectedChainId?.toString() || "11155420", // Use connected chain or OP Sepolia as default
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
        // --- DURATION UTILITIES ---
        {
          kind: "category",
          name: "Duration",
          colour: "240",
          contents: [{ kind: "block", type: "timeframe_job" }],
        },
        // --- RECURRING UTILITIES ---
        {
          kind: "category",
          name: "Recurring",
          colour: "260",
          contents: [{ kind: "block", type: "recurring_job" }],
        },
        // --- ABI UTILITIES ---
        {
          kind: "category",
          name: "ABI",
          colour: "160",
          contents: [{ kind: "block", type: "manual_abi_input" }],
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
          contents: [
            { kind: "block", type: "event_listener" },
            { kind: "block", type: "event_filter" },
          ],
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
            {
              kind: "block",
              type: "execute_through_safe_wallet",
            },
            { kind: "block", type: "execute_function" },
            { kind: "block", type: "safe_transaction" },
            { kind: "block", type: "static_arguments" },
            { kind: "block", type: "dynamic_arguments" },
          ],
        },
        // --- SAFE WALLET CATEGORY ---
        // Tools for creating and managing Safe wallets
        {
          kind: "category",
          name: "Safe Wallet",
          colour: "#9C27B0",
          contents: [
            {
              kind: "block",
              type: "create_safe_wallet",
            },
            {
              kind: "block",
              type: "import_safe_wallet",
            },
            {
              kind: "block",
              type: "select_safe_wallet",
            },
          ],
        },
      ],
    }),
    [connectedChainId],
  );

  // Sync function with debouncing
  const syncToJobForm = useCallback(
    async (workspaceXml: string) => {
      // Clear any pending sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Debounce sync calls - wait 500ms after last change
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await syncBlocklyToJobForm(workspaceXml, jobFormContext);
        } catch (error) {
          console.error(
            "Error syncing Blockly to JobForm on block change:",
            error,
          );
        }
      }, 500);
    },
    [jobFormContext],
  );

  // Keep flyout always open and disable click-to-place
  useEffect(() => {
    let workspaceChangeListener:
      | ((event: Blockly.Events.Abstract) => void)
      | null = null;
    let workspace: Blockly.WorkspaceSvg | null = null;

    const timer = setTimeout(() => {
      try {
        // Get the primary workspace
        workspace = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
        if (workspace && workspace.getToolbox()) {
          workspaceRef.current = workspace;

          // Set up workspace change listener to sync on block changes
          workspaceChangeListener = (event: Blockly.Events.Abstract) => {
            // Only sync on meaningful changes that affect job configuration
            let shouldSync = false;

            if (event.type === Blockly.Events.BLOCK_CHANGE) {
              // Field value changes - always sync
              shouldSync = true;
            } else if (event.type === Blockly.Events.BLOCK_CREATE) {
              // New blocks added - always sync
              shouldSync = true;
            } else if (event.type === Blockly.Events.BLOCK_DELETE) {
              // Blocks removed - always sync
              shouldSync = true;
            } else if (event.type === Blockly.Events.BLOCK_MOVE) {
              // Only sync on block moves if blocks are being connected/disconnected
              // (not just repositioning)
              const moveEvent = event as Blockly.Events.BlockMove;
              if (
                moveEvent.newParentId !== moveEvent.oldParentId ||
                moveEvent.newInputName !== moveEvent.oldInputName
              ) {
                // Block connection changed - sync
                shouldSync = true;
              }
              // Otherwise, it's just repositioning - don't sync
            } else if (event.type === Blockly.Events.FINISHED_LOADING) {
              // Workspace loaded - sync initial state
              shouldSync = true;
            }

            if (shouldSync && workspace) {
              // Get current XML and sync
              const currentXml = Blockly.Xml.workspaceToDom(workspace);
              const xmlText = Blockly.Xml.domToText(currentXml);
              syncToJobForm(xmlText);
            }
          };

          workspace.addChangeListener(workspaceChangeListener);

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

            // Remove spacing between blocks in flyout
            if ("spacing" in flyout) {
              (flyout as { spacing: number }).spacing = 0;
            }

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
          // Tag toolbox and flyout for guided tour selectors
          const tagTourTargets = () => {
            const ws = workspaceRef.current;
            if (!ws) return false;

            // Toolbox DOM
            const toolboxDiv =
              (
                ws.getToolbox() as unknown as {
                  getHtmlDiv?: () => HTMLElement | null;
                }
              )?.getHtmlDiv?.() ||
              workspaceScopeRef.current?.querySelector(".blocklyToolbox") ||
              workspaceScopeRef.current?.querySelector(".blocklyToolboxDiv");
            toolboxDiv?.setAttribute("data-tour-id", "toolbox");

            // Flyout SVG group (use svg element so we can highlight its bounds)
            const flyout = ws.getFlyout() as unknown as {
              svgGroup_?: SVGElement | null;
            };
            const flyoutSvg = flyout?.svgGroup_;
            if (flyoutSvg) {
              flyoutSvg.setAttribute("data-tour-id", "flyout");
            }

            return Boolean(toolboxDiv && flyoutSvg);
          };

          // Attempt immediately and retry shortly in case Blockly hasn't rendered yet
          const tagged = tagTourTargets();
          if (!tagged) {
            setTimeout(() => tagTourTargets(), 300);
          }
        }
      } catch (error) {
        console.error("Error configuring flyout:", error);
      }
    }, 500); // Wait for workspace to be fully initialized

    return () => {
      clearTimeout(timer);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      // Remove workspace change listener if it was added
      if (workspace && workspaceChangeListener) {
        workspace.removeChangeListener(workspaceChangeListener);
      }
    };
  }, [workspaceScopeRef, syncToJobForm]);

  // Sync wallet blocks with connected address
  useEffect(() => {
    // Update global wallet address so new wallet_selection blocks can use it on creation
    setConnectedWalletAddress(connectedAddress || null);

    if (!workspaceRef.current || !connectedAddress) return;

    const workspace = workspaceRef.current;
    const allBlocks = workspace.getAllBlocks(false);

    // Update all existing wallet_selection blocks with the connected address
    allBlocks.forEach((block) => {
      if (block.type === "wallet_selection") {
        const currentValue = block.getFieldValue("WALLET_ADDRESS");
        // Only update if different to avoid unnecessary re-renders
        if (currentValue !== connectedAddress) {
          block.setFieldValue(connectedAddress, "WALLET_ADDRESS");
        }
      }
    });
  }, [connectedAddress]);

  // Update the global connected chain ID for validation and import safe button
  useEffect(() => {
    setConnectedChainId(connectedChainId?.toString() || null);
    setImportSafeChainId(connectedChainId || null);
  }, [connectedChainId]);

  // Sync chain blocks with connected chain
  useEffect(() => {
    if (!workspaceRef.current || !connectedChainId) return;

    const workspace = workspaceRef.current;
    const allBlocks = workspace.getAllBlocks(false);
    const chainIdStr = connectedChainId.toString();

    // Update all chain_selection blocks with the connected chain
    allBlocks.forEach((block) => {
      if (block.type === "chain_selection") {
        const currentValue = block.getFieldValue("CHAIN_ID");
        // Only update if different to avoid unnecessary re-renders
        if (currentValue !== chainIdStr) {
          block.setFieldValue(chainIdStr, "CHAIN_ID");
        }
      }
    });
  }, [connectedChainId]);

  return (
    <>
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
            // Continuous toolbox + scrollable workspace
            plugins: {
              toolbox: ContinuousToolbox,
              flyoutsVerticalToolbox: ContinuousFlyout,
              metricsManager: ContinuousMetrics,
            },
            move: {
              scrollbars: {
                horizontal: true,
                vertical: true,
              },
              drag: true,
              wheel: false,
            },
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
            sounds: false,
          }}
        />
      </div>
      <SmartSuggestions workspace={workspaceRef.current} />
    </>
  );
}
