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
import { syncBlocklyToJobForm } from "../utils/syncBlocklyToJobForm";
import { JobFormContextType } from "@/contexts/JobFormContext";

export type JobWrapperKind = "time" | "event" | "condition";

export interface WorkspaceStepSnapshot {
  chainComplete: boolean;
  jobTypeComplete: boolean;
  triggerComplete: boolean;
  executionComplete: boolean;
  walletComplete: boolean;
  functionValueComplete: boolean;
  usesSafeExecution: boolean;
  jobWrapperKind: JobWrapperKind | null;
}

interface WorkspaceGuidanceResult {
  snapshot: WorkspaceStepSnapshot;
  highlightConnection: Blockly.RenderedConnection | null;
  guidanceCategoryIds: string[];
  cursorBlock: Blockly.BlockSvg | null;
}

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

const JOB_WRAPPER_KIND_MAP: Record<string, JobWrapperKind> = {
  time_based_job_wrapper: "time",
  event_based_job_wrapper: "event",
  condition_based_job_wrapper: "condition",
};

const TIME_TRIGGER_TYPES = [
  "time_interval_at_job",
  "cron_expression",
  "specific_datetime",
];

type ExecutionSearchResult = {
  executeBlock: Blockly.Block | null;
  pendingConnection: Blockly.RenderedConnection | null;
};

const ACTION_INPUT_NAMES = new Set(["ACTION", "THEN"]);

const CATEGORY_LABELS: Record<string, string> = {
  "chain-category": "Chain block",
  "job-type-category": "Job Type block",
  "duration-category": "Duration block",
  "time-category": "Time trigger block",
  "event-category": "Event Listener block",
  "condition-category": "Condition block",
  "execute-category": "Execute block",
  "function-values-category": "Function Value block",
  "wallet-category": "Wallet block",
  "safe-wallet-category": "Safe wallet block",
};

function asBlockSvg(block: Blockly.Block): block is Blockly.BlockSvg {
  return "getSvgRoot" in block;
}

function toBlockSvg(
  block: Blockly.Block | null | undefined,
): Blockly.BlockSvg | null {
  if (!block) return null;
  return asBlockSvg(block) ? (block as Blockly.BlockSvg) : null;
}

function getFirstRealBlockOfType(
  workspace: Blockly.WorkspaceSvg,
  type: string,
): Blockly.BlockSvg | null {
  const blocks = workspace.getBlocksByType(type, false);
  return (
    (blocks.find((b) => !b.isInFlyout) as Blockly.BlockSvg | undefined) || null
  );
}

function findExecuteBlock(
  block: Blockly.Block | null,
  visited = new Set<string>(),
): ExecutionSearchResult {
  if (!block || visited.has(block.id)) {
    return { executeBlock: null, pendingConnection: null };
  }
  visited.add(block.id);

  if (
    block.type === "execute_function" ||
    block.type === "execute_through_safe_wallet"
  ) {
    return { executeBlock: block, pendingConnection: null };
  }

  for (const input of block.inputList) {
    if (input.connection && input.connection.type === Blockly.NEXT_STATEMENT) {
      const target = input.connection.targetBlock();
      if (target) {
        const result = findExecuteBlock(target, visited);
        if (result.executeBlock || result.pendingConnection) {
          return result;
        }
      } else if (ACTION_INPUT_NAMES.has(input.name || "")) {
        return {
          executeBlock: null,
          pendingConnection: input.connection as Blockly.RenderedConnection,
        };
      }
    }
  }

  const nextBlock = block.getNextBlock();
  if (nextBlock) {
    const result = findExecuteBlock(nextBlock, visited);
    if (result.executeBlock || result.pendingConnection) {
      return result;
    }
  }

  return { executeBlock: null, pendingConnection: null };
}

function computeWorkspaceStepState(
  workspace: Blockly.WorkspaceSvg,
): WorkspaceGuidanceResult {
  const chainBlock = getFirstRealBlockOfType(workspace, "chain_selection");
  const renderedChain = toBlockSvg(chainBlock);
  let walletInputConnection: Blockly.RenderedConnection | null = null;
  let walletValueValid = false;

  if (chainBlock) {
    const walletInput = chainBlock.getInput("WALLET_INPUT");
    walletInputConnection =
      walletInput?.connection as Blockly.RenderedConnection | null;
    const walletBlock = walletInputConnection?.targetBlock() || null;
    const walletAddress = walletBlock?.getFieldValue("WALLET_ADDRESS") || "";
    walletValueValid =
      !!walletBlock && !!walletAddress && walletAddress !== "0x...";
  }

  const jobWrapperBlock = chainBlock?.getNextBlock() || null;
  const jobWrapperKind = jobWrapperBlock
    ? JOB_WRAPPER_KIND_MAP[jobWrapperBlock.type] || null
    : null;

  const jobTypeComplete = Boolean(jobWrapperBlock && jobWrapperKind);

  const timeframeConnection = jobWrapperBlock?.getInput("STATEMENT")
    ?.connection as Blockly.RenderedConnection | null;
  const timeframeBlock = timeframeConnection?.targetBlock() || null;
  const hasTimeframe = timeframeBlock?.type === "timeframe_job";

  const triggerConnection = timeframeBlock?.getInput("STATEMENT")
    ?.connection as Blockly.RenderedConnection | null;
  const triggerBlock = triggerConnection?.targetBlock() || null;

  let hasValidTrigger = false;
  if (jobWrapperKind === "time") {
    hasValidTrigger = Boolean(
      triggerBlock && TIME_TRIGGER_TYPES.includes(triggerBlock.type),
    );
  } else if (jobWrapperKind === "event") {
    hasValidTrigger = triggerBlock?.type === "event_listener";
  } else if (jobWrapperKind === "condition") {
    hasValidTrigger = triggerBlock?.type === "condition_monitor";
  }

  const executionSearch = hasValidTrigger
    ? findExecuteBlock(triggerBlock)
    : { executeBlock: null, pendingConnection: null };
  const executionBlock = executionSearch.executeBlock;
  const executionComplete = Boolean(executionBlock);
  const usesSafeExecution =
    executionBlock?.type === "execute_through_safe_wallet";

  let functionValueConnection: Blockly.RenderedConnection | null = null;
  let functionValueComplete = executionComplete;
  if (executionBlock?.type === "execute_function") {
    const argsConn = executionBlock.getInput("ARGUMENTS")
      ?.connection as Blockly.RenderedConnection | null;
    functionValueConnection = argsConn;
    const target = argsConn?.targetBlock();
    functionValueComplete = Boolean(target);
  } else if (executionBlock?.type === "execute_through_safe_wallet") {
    const safeConn = executionBlock.getInput("FUNCTION_CALL")
      ?.connection as Blockly.RenderedConnection | null;
    functionValueConnection = safeConn;
    const target = safeConn?.targetBlock();
    functionValueComplete = Boolean(target);
  }

  let walletComplete = walletValueValid;
  if (usesSafeExecution && executionBlock) {
    const safeWalletBlock = executionBlock
      .getInput("SAFE_WALLET")
      ?.connection?.targetBlock();
    const safeWalletValue = safeWalletBlock?.getFieldValue("SAFE_WALLET") || "";
    walletComplete = !!safeWalletBlock && safeWalletValue !== "";
  }

  const snapshot: WorkspaceStepSnapshot = {
    chainComplete: Boolean(chainBlock),
    jobTypeComplete,
    triggerComplete: Boolean(
      jobTypeComplete && hasTimeframe && hasValidTrigger,
    ),
    executionComplete: Boolean(
      jobTypeComplete && hasTimeframe && hasValidTrigger && executionComplete,
    ),
    functionValueComplete: Boolean(
      jobTypeComplete &&
      hasTimeframe &&
      hasValidTrigger &&
      executionComplete &&
      functionValueComplete,
    ),
    walletComplete,
    usesSafeExecution,
    jobWrapperKind,
  };

  let highlightConnection: Blockly.RenderedConnection | null = null;
  let cursorBlock: Blockly.BlockSvg | null = renderedChain || null;

  if (chainBlock) {
    if (!jobTypeComplete) {
      highlightConnection = (chainBlock.nextConnection ||
        null) as Blockly.RenderedConnection | null;
      cursorBlock = renderedChain;
    } else if (!hasTimeframe) {
      highlightConnection = timeframeConnection;
      cursorBlock = toBlockSvg(jobWrapperBlock);
    } else if (!triggerBlock || !hasValidTrigger) {
      highlightConnection = triggerConnection;
      cursorBlock = toBlockSvg(timeframeBlock);
    } else if (!executionComplete) {
      highlightConnection = executionSearch.pendingConnection;
      cursorBlock = toBlockSvg(triggerBlock);
    } else if (!functionValueComplete) {
      highlightConnection = functionValueConnection;
      cursorBlock = toBlockSvg(executionBlock);
    } else if (!walletComplete && usesSafeExecution) {
      const safeWalletConn = executionBlock?.getInput("SAFE_WALLET")
        ?.connection as Blockly.RenderedConnection | null;
      highlightConnection = safeWalletConn;
      cursorBlock = toBlockSvg(executionBlock);
    } else if (!walletComplete && walletInputConnection) {
      highlightConnection = walletInputConnection;
      cursorBlock = renderedChain;
    } else {
      cursorBlock = toBlockSvg(executionBlock) || renderedChain;
    }
  }

  const guidanceCategoryIds: string[] = [];
  if (!chainBlock) {
    guidanceCategoryIds.push("chain-category");
  } else if (!jobTypeComplete) {
    guidanceCategoryIds.push("job-type-category");
  } else if (!hasTimeframe) {
    guidanceCategoryIds.push("duration-category");
  } else if (!triggerBlock || !hasValidTrigger) {
    if (jobWrapperKind === "event") {
      guidanceCategoryIds.push("event-category");
    } else if (jobWrapperKind === "condition") {
      guidanceCategoryIds.push("condition-category");
    } else {
      guidanceCategoryIds.push("time-category");
    }
  } else if (!executionComplete) {
    guidanceCategoryIds.push("execute-category");
  } else if (!functionValueComplete) {
    guidanceCategoryIds.push("function-values-category");
  } else if (!walletComplete) {
    guidanceCategoryIds.push(
      usesSafeExecution ? "safe-wallet-category" : "wallet-category",
    );
  }

  return {
    snapshot,
    highlightConnection,
    guidanceCategoryIds,
    cursorBlock,
  };
}

function getConnectionLabelForCategory(
  categoryId?: string | null,
): string | null {
  if (!categoryId) return null;
  return CATEGORY_LABELS[categoryId] || null;
}

interface BlocklyWorkspaceSectionProps {
  xml: string;
  onXmlChange: (newXml: string) => void;
  workspaceScopeRef: React.RefObject<HTMLDivElement | null>;
  connectedAddress?: string;
  connectedChainId?: number;
  jobFormContext: JobFormContextType;
  onWorkspaceStepChange?: (snapshot: WorkspaceStepSnapshot) => void;
}

export function BlocklyWorkspaceSection({
  xml,
  onXmlChange,
  workspaceScopeRef,
  connectedAddress,
  connectedChainId,
  jobFormContext,
  onWorkspaceStepChange,
}: BlocklyWorkspaceSectionProps) {
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ensureBlocksTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightedConnectionRef = useRef<Blockly.RenderedConnection | null>(
    null,
  );
  const lastStepSnapshotRef = useRef<WorkspaceStepSnapshot | null>(null);
  const highlightedCategoryIdsRef = useRef<Set<string>>(new Set());
  const pendingCategoryHighlightRef = useRef<number | null>(null);
  const highlightedTargetBlockRef = useRef<Blockly.BlockSvg | null>(null);
  const cursorSignatureRef = useRef<string | null>(null);
  const cursorScrollDoneRef = useRef<boolean>(false);
  const connectionHintRef = useRef<SVGGElement | null>(null);
  const setHighlightedConnection = useCallback(
    (conn: Blockly.RenderedConnection | null, labelText?: string | null) => {
      if (
        highlightedConnectionRef.current &&
        highlightedConnectionRef.current !== conn
      ) {
        highlightedConnectionRef.current.unhighlight();
      }
      if (highlightedTargetBlockRef.current) {
        highlightedTargetBlockRef.current
          .getSvgRoot()
          ?.classList.remove("blockly-guidance-target");
        highlightedTargetBlockRef.current = null;
      }
      if (conn && highlightedConnectionRef.current !== conn) {
        conn.highlight();
        const sourceBlock = conn.getSourceBlock();
        if (sourceBlock && asBlockSvg(sourceBlock)) {
          sourceBlock.getSvgRoot()?.classList.add("blockly-guidance-target");
          highlightedTargetBlockRef.current = sourceBlock;
        }
      }
      highlightedConnectionRef.current = conn || null;

      if (!conn) {
        if (connectionHintRef.current) {
          connectionHintRef.current.remove();
          connectionHintRef.current = null;
        }
        return;
      }

      const sourceBlock = conn.getSourceBlock();
      if (!sourceBlock || !asBlockSvg(sourceBlock)) {
        return;
      }
      const svgRoot = sourceBlock.getSvgRoot();
      const offset = conn.getOffsetInBlock();
      if (!svgRoot || !offset) return;

      if (connectionHintRef.current) {
        connectionHintRef.current.remove();
        connectionHintRef.current = null;
      }

      const labelGroup = Blockly.utils.dom.createSvgElement(
        "g",
        { class: "blockly-guidance-connection-label" },
        svgRoot,
      ) as SVGGElement;
      labelGroup.setAttribute(
        "transform",
        `translate(${offset.x + 14}, ${offset.y - 12})`,
      );
      Blockly.utils.dom.createSvgElement(
        "rect",
        { width: 150, height: 26 },
        labelGroup,
      );
      const text = Blockly.utils.dom.createSvgElement(
        "text",
        { x: 10, y: 16 },
        labelGroup,
      );
      text.textContent = labelText || "Drop next block here";
      connectionHintRef.current = labelGroup;
    },
    [],
  );

  const clearCategoryHighlights = useCallback(() => {
    if (typeof document === "undefined") {
      highlightedCategoryIdsRef.current.clear();
      return;
    }
    highlightedCategoryIdsRef.current.forEach((id) => {
      const el = document.querySelector(
        `[data-tour-id="${id}"]`,
      ) as HTMLElement | null;
      el?.classList.remove("blockly-toolbox-guidance");
      el?.removeAttribute("data-guidance-active");
    });
    highlightedCategoryIdsRef.current.clear();
  }, []);

  const highlightCategories = useCallback(
    (categoryIds: string[], attempt = 0) => {
      if (typeof document === "undefined") return;
      const nextIds = new Set(categoryIds.filter(Boolean));
      const prevIds = highlightedCategoryIdsRef.current;
      let missing = false;

      prevIds.forEach((id) => {
        if (!nextIds.has(id)) {
          const el = document.querySelector(
            `[data-tour-id="${id}"]`,
          ) as HTMLElement | null;
          el?.classList.remove("blockly-toolbox-guidance");
          el?.removeAttribute("data-guidance-active");
        }
      });

      nextIds.forEach((id) => {
        const el = document.querySelector(
          `[data-tour-id="${id}"]`,
        ) as HTMLElement | null;
        if (!el) {
          missing = true;
        } else {
          el.classList.add("blockly-toolbox-guidance");
          el.setAttribute("data-guidance-active", "true");
        }
      });

      highlightedCategoryIdsRef.current = nextIds;

      if (missing && attempt < 3) {
        if (pendingCategoryHighlightRef.current) {
          cancelAnimationFrame(pendingCategoryHighlightRef.current);
        }
        pendingCategoryHighlightRef.current = requestAnimationFrame(() =>
          highlightCategories(categoryIds, attempt + 1),
        );
      }
    },
    [],
  );

  const applyCategoryHighlights = useCallback(
    (categoryIds: string[]) => {
      if (pendingCategoryHighlightRef.current) {
        cancelAnimationFrame(pendingCategoryHighlightRef.current);
        pendingCategoryHighlightRef.current = null;
      }
      highlightCategories(categoryIds);
    },
    [highlightCategories],
  );

  const emitWorkspaceSteps = useCallback(
    (snapshot: WorkspaceStepSnapshot) => {
      if (!onWorkspaceStepChange) return;
      const prev = lastStepSnapshotRef.current;
      const hasChanged =
        !prev ||
        prev.chainComplete !== snapshot.chainComplete ||
        prev.jobTypeComplete !== snapshot.jobTypeComplete ||
        prev.triggerComplete !== snapshot.triggerComplete ||
        prev.executionComplete !== snapshot.executionComplete ||
        prev.walletComplete !== snapshot.walletComplete ||
        prev.usesSafeExecution !== snapshot.usesSafeExecution ||
        prev.jobWrapperKind !== snapshot.jobWrapperKind;
      if (hasChanged) {
        lastStepSnapshotRef.current = { ...snapshot };
        onWorkspaceStepChange(snapshot);
      }
    },
    [onWorkspaceStepChange],
  );

  const isBlockInView = useCallback(
    (workspace: Blockly.WorkspaceSvg, block: Blockly.BlockSvg) => {
      const metricsManager = (
        workspace as unknown as {
          getMetricsManager?: () => {
            getViewMetrics?: () => {
              left?: number;
              top?: number;
              width?: number;
              height?: number;
            };
          };
        }
      ).getMetricsManager?.();

      const rawMetrics =
        metricsManager?.getViewMetrics?.() ?? workspace.getMetrics?.();

      if (!rawMetrics) return true;

      const viewLeft =
        (rawMetrics as { viewLeft?: number; left?: number }).viewLeft ??
        (rawMetrics as { left?: number }).left ??
        0;
      const viewTop =
        (rawMetrics as { viewTop?: number; top?: number }).viewTop ??
        (rawMetrics as { top?: number }).top ??
        0;
      const viewWidth =
        (rawMetrics as { viewWidth?: number; width?: number }).viewWidth ??
        (rawMetrics as { width?: number }).width ??
        0;
      const viewHeight =
        (rawMetrics as { viewHeight?: number; height?: number }).viewHeight ??
        (rawMetrics as { height?: number }).height ??
        0;

      const rect = block.getBoundingRectangle();
      const scale = workspace.scale || 1;
      const blockLeft = rect.left * scale;
      const blockRight = rect.right * scale;
      const blockTop = rect.top * scale;
      const blockBottom = rect.bottom * scale;

      const viewRight = viewLeft + viewWidth;
      const viewBottom = viewTop + viewHeight;

      const horizontallyVisible =
        blockRight >= viewLeft && blockLeft <= viewRight;
      const verticallyVisible =
        blockBottom >= viewTop && blockTop <= viewBottom;

      return horizontallyVisible && verticallyVisible;
    },
    [],
  );

  const ensureCursorVisibility = useCallback(
    (workspace: Blockly.WorkspaceSvg, cursorBlock: Blockly.BlockSvg | null) => {
      const signature = cursorBlock ? cursorBlock.id : null;
      if (signature !== cursorSignatureRef.current) {
        cursorSignatureRef.current = signature;
        cursorScrollDoneRef.current = false;
      }

      if (!cursorBlock || cursorScrollDoneRef.current) {
        return;
      }

      if (!isBlockInView(workspace, cursorBlock)) {
        try {
          workspace.centerOnBlock(cursorBlock.id);
        } catch {
          // centerOnBlock unavailable
        }
      }
      cursorScrollDoneRef.current = true;
    },
    [isBlockInView],
  );

  const evaluateWorkspaceSteps = useCallback(
    (workspace: Blockly.WorkspaceSvg) => {
      const {
        snapshot,
        highlightConnection,
        guidanceCategoryIds,
        cursorBlock,
      } = computeWorkspaceStepState(workspace);
      emitWorkspaceSteps(snapshot);
      const connectionLabel = getConnectionLabelForCategory(
        guidanceCategoryIds[0],
      );
      setHighlightedConnection(highlightConnection, connectionLabel);
      applyCategoryHighlights(guidanceCategoryIds);
      ensureCursorVisibility(workspace, cursorBlock);
    },
    [
      emitWorkspaceSteps,
      setHighlightedConnection,
      applyCategoryHighlights,
      ensureCursorVisibility,
    ],
  );

  const ensureChainWalletBlocks = useCallback(
    (workspace: Blockly.WorkspaceSvg) => {
      // Debounce to avoid rapid create/delete loops
      if (ensureBlocksTimeoutRef.current) {
        clearTimeout(ensureBlocksTimeoutRef.current);
      }

      ensureBlocksTimeoutRef.current = setTimeout(() => {
        const chainBlocks = workspace.getBlocksByType("chain_selection", false);
        const walletBlocks = workspace.getBlocksByType(
          "wallet_selection",
          false,
        );

        const chainIdFieldValue = connectedChainId?.toString() || "11155420"; // OP Sepolia default

        // Helper to create a wallet block
        const createWalletBlock = () => {
          const walletBlock = workspace.newBlock("wallet_selection");
          walletBlock.initSvg();
          walletBlock.render();
          return walletBlock;
        };

        // Helper to create a chain block with optional wallet attached
        const createChainWithWallet = () => {
          const chainBlock = workspace.newBlock("chain_selection");
          const chainField = chainBlock.getField("CHAIN_ID");
          chainField?.setValue(chainIdFieldValue);
          const walletBlock = createWalletBlock();
          const walletInput = chainBlock.getInput("WALLET_INPUT");
          if (walletInput?.connection && walletBlock.outputConnection) {
            walletInput.connection.connect(walletBlock.outputConnection);
          }
          chainBlock.initSvg();
          chainBlock.render();
          // Position blocks in the middle between flyout (ends at ~400px) and workspace
          chainBlock.moveBy(500, 200);
        };

        if (chainBlocks.length === 0) {
          // Create both chain and wallet if chain is missing
          createChainWithWallet();
          return;
        }

        // Ensure at least one wallet exists; attach to first chain if possible
        if (walletBlocks.length === 0) {
          const walletBlock = createWalletBlock();
          const firstChain = chainBlocks[0] as Blockly.BlockSvg;
          const walletInput = firstChain.getInput("WALLET_INPUT");
          if (walletInput?.connection && walletBlock.outputConnection) {
            try {
              walletInput.connection.connect(walletBlock.outputConnection);
            } catch {
              // If connection fails, leave wallet unconnected
            }
          }
        }
      }, 50);
    },
    [connectedChainId],
  );

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
        // --- EXECUTION CATEGORY ---
        {
          kind: "category",
          name: "Execute",
          colour: "190",
          contents: [
            { kind: "block", type: "execute_through_safe_wallet" },
            { kind: "block", type: "execute_function" },
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
        // --- SAFE TRANSACTIONS ---
        {
          kind: "category",
          name: "Safe Transaction",
          colour: "200",
          contents: [{ kind: "block", type: "safe_transaction" }],
        },
        // --- FUNCTION VALUES ---
        {
          kind: "category",
          name: "Function Value",
          colour: "340",
          contents: [
            { kind: "block", type: "static_arguments" },
            { kind: "block", type: "dynamic_arguments" },
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

          // Ensure chain + wallet blocks exist on load
          ensureChainWalletBlocks(workspace);

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
              // Ensure chain + wallet always present (handles deletes)
              if (
                event.type === Blockly.Events.BLOCK_DELETE ||
                event.type === Blockly.Events.BLOCK_CREATE
              ) {
                ensureChainWalletBlocks(workspace);
              }

              // Get current XML and sync
              const currentXml = Blockly.Xml.workspaceToDom(workspace);
              const xmlText = Blockly.Xml.domToText(currentXml);
              syncToJobForm(xmlText);
              evaluateWorkspaceSteps(workspace);
            }
          };

          workspace.addChangeListener(workspaceChangeListener);

          // Remove comment option from context menu
          try {
            const ContextMenuRegistry =
              Blockly.ContextMenuRegistry as unknown as {
                registry?: Record<
                  string,
                  { displayText?: string | (() => string) }
                >;
              };
            if (ContextMenuRegistry?.registry) {
              const registry = ContextMenuRegistry.registry;
              // Remove "Add Comment" and "Remove Comment" menu items
              const commentMenuIds = ["blockComment", "blockCommentRemove"];
              commentMenuIds.forEach((id) => {
                if (registry[id]) {
                  delete registry[id];
                }
              });
              // Also remove any items with comment-related display text
              Object.keys(registry).forEach((key) => {
                const item = registry[key];
                if (item && typeof item === "object" && "displayText" in item) {
                  const displayText =
                    typeof item.displayText === "function"
                      ? item.displayText()
                      : item.displayText;
                  if (
                    displayText === "Add Comment" ||
                    displayText === "Remove Comment"
                  ) {
                    delete registry[key];
                  }
                }
              });
            }
          } catch (error) {
            // Silently fail if context menu registry is not available
            console.warn(
              "Could not remove comment option from context menu:",
              error,
            );
          }

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

            // Ensure click-to-place works by using Blockly's default createBlock
            // (users expect clicking a block to insert it into the workspace).
            flyout.createBlock =
              Blockly.Flyout.prototype.createBlock.bind(flyout);
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
          evaluateWorkspaceSteps(workspace);
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
      setHighlightedConnection(null);
      clearCategoryHighlights();
      if (connectionHintRef.current) {
        connectionHintRef.current.remove();
        connectionHintRef.current = null;
      }
      if (pendingCategoryHighlightRef.current) {
        cancelAnimationFrame(pendingCategoryHighlightRef.current);
      }
    };
  }, [
    workspaceScopeRef,
    syncToJobForm,
    ensureChainWalletBlocks,
    evaluateWorkspaceSteps,
    setHighlightedConnection,
    clearCategoryHighlights,
  ]);

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
              startScale: 0.7,
              maxScale: 1,
              minScale: 1,
              scaleSpeed: 1,
            },
            grid: { spacing: 25, length: 3, colour: "#1f1f1f", snap: true },
            renderer: "zelos",
            trashcan: false,
            sounds: false,
            comments: false,
          }}
        />
      </div>
    </>
  );
}
