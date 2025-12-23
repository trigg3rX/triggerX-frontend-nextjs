"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Blockly from "blockly/core";
import { STORAGE_KEY_QUICK } from "./VisualBuilderTour";

const STORAGE_KEY_JOB = "blockly-demo-job-tour-dismissed";

const jobCreationSteps = [
  {
    id: "job-type-block",
    description:
      "Start by picking exactly one Job Type block and connect it with the below notch of the Chain block.",
    selector: '[data-tour-id="job-type-category"]',
  },
  {
    id: "job-duration-block",
    description:
      "Step 2: Add a Duration block and snap it into the inner curve of the selected Job Type.",
    selector: '[data-tour-id="duration-category"]',
  },
  {
    id: "job-recurring-block",
    description:
      "Add a Recurring block to the recurring input of the Job Type.",
    selector: '[data-tour-id="recurring-category"]',
  },
  {
    id: "job-trigger-block",
    description:
      "Set when to trigger. For Time-based, add one execution block from Time. For Event, add a Listen block (optionally add a filter). For Condition, add a Condition block. Event/Condition must include Recurring.",
    selector: '[data-tour-id="duration-category"]',
  },
  {
    id: "job-execution-block",
    description:
      "Next is to choose what to execute. Use either Execute Function OR Execute through Safe Wallet",
    selector: '[data-tour-id="execute-category"]',
  },
  {
    id: "job-final-block",
    description: "All required details are set. You can now create the job.",
    // selector: "body",
  },
];

export function JobCreationTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [selectedJobTypeLabel, setSelectedJobTypeLabel] = useState<
    string | null
  >(null);
  const [executionSelection, setExecutionSelection] = useState<
    "safe" | "contract" | null
  >(null);
  const [hasSafeWallet, setHasSafeWallet] = useState(false);
  const [hasSafeTransactions, setHasSafeTransactions] = useState(false);
  const [hasFunctionArgs, setHasFunctionArgs] = useState(false);
  const lastActivatedCategoryRef = useRef<string | null>(null);
  const highlightStyle = useMemo(() => {
    if (!targetRect) return null;

    const padding = 4;
    const baseLeft = Math.max(targetRect.left - padding, padding);
    const baseTop = Math.max(targetRect.top - padding, padding);
    const baseRight = baseLeft + targetRect.width + padding * 2;
    const baseBottom = baseTop + targetRect.height + padding * 2;

    const toolboxEl = document.querySelector(
      '[data-tour-id="toolbox"]',
    ) as HTMLElement | null;
    const toolboxRect = toolboxEl?.getBoundingClientRect();

    const left = Math.max(baseLeft, toolboxRect?.left ?? baseLeft);
    const right = Math.min(baseRight, toolboxRect?.right ?? baseRight);
    const top = Math.max(baseTop, toolboxRect?.top ?? baseTop);
    const bottom = Math.min(baseBottom, toolboxRect?.bottom ?? baseBottom);

    if (right <= left || bottom <= top) return null;

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
    };
  }, [targetRect]);

  const currentStep = jobCreationSteps[activeIndex];

  const triggerSelector =
    currentStep?.id === "job-trigger-block"
      ? selectedJobTypeLabel === "time-based"
        ? '[data-tour-id="time-category"]'
        : selectedJobTypeLabel === "event-based"
          ? '[data-tour-id="event-category"]'
          : selectedJobTypeLabel === "condition-based"
            ? '[data-tour-id="condition-category"]'
            : currentStep?.selector
      : currentStep?.selector;

  const executionSelector =
    currentStep?.id === "job-execution-block" && executionSelection === "safe"
      ? !hasSafeWallet
        ? '[data-tour-id="safe-wallet-category"]'
        : !hasSafeTransactions
          ? '[data-tour-id="safe-transaction-category"]'
          : currentStep?.selector
      : currentStep?.id === "job-execution-block" &&
          executionSelection === "contract"
        ? hasFunctionArgs
          ? currentStep?.selector
          : '[data-tour-id="function-values-category"]'
        : currentStep?.selector;

  const getTriggerSelector = useCallback(
    () => triggerSelector || currentStep?.selector,
    [triggerSelector, currentStep],
  );

  const getExecutionSelector = useCallback(
    () => executionSelector || currentStep?.selector,
    [executionSelector, currentStep],
  );

  const scrollFlyoutToTop = useCallback(() => {
    try {
      const ws = Blockly.getMainWorkspace?.() as unknown as {
        getFlyout?: () => unknown;
      } | null;
      const flyout = ws?.getFlyout?.() as unknown as {
        scrollToStart?: () => void;
        getWorkspace?: () => Blockly.WorkspaceSvg | undefined;
        svgGroup_?: SVGElement | null;
      } | null;
      if (!flyout) return;

      // Use API if available
      if (typeof flyout.scrollToStart === "function") {
        flyout.scrollToStart();
      }

      // Try scrollbar on flyout workspace
      const flyoutWorkspace = flyout.getWorkspace?.();
      const vScrollbar =
        // @ts-expect-error private in typings
        flyoutWorkspace?.scrollbar?.vScrollBar ||
        // some builds expose set on scrollbar directly
        flyoutWorkspace?.scrollbar;
      if (vScrollbar?.set) {
        vScrollbar.set(0);
      } else if (vScrollbar?.setY) {
        vScrollbar.setY(0);
      }

      // Fallback: scroll DOM container if present
      const svgGroup = flyout.svgGroup_ as unknown as HTMLElement | null;
      const scrollContainer =
        (svgGroup?.parentElement as HTMLElement | null) ||
        (svgGroup?.closest?.(".blocklyFlyout") as HTMLElement | null);
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    } catch {
      // no-op
    }
  }, []);

  const scrollCategoryIntoView = useCallback((el: HTMLElement) => {
    try {
      const container =
        (el.closest(".blocklyFlyout") as HTMLElement | null) ||
        (el.closest(".blocklyToolboxDiv") as HTMLElement | null) ||
        (el.closest('[role="tree"]') as HTMLElement | null) ||
        (el.parentElement as HTMLElement | null);
      const target =
        (el.closest('[role="treeitem"]') as HTMLElement | null) || el;

      if (container && target) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const padding = 12;
        const isAbove = targetRect.top < containerRect.top + padding;
        const isBelow = targetRect.bottom > containerRect.bottom - padding;
        if (isAbove || isBelow) {
          const delta =
            targetRect.top -
            containerRect.top -
            (container.clientHeight - targetRect.height) / 2;
          container.scrollTo({
            top: container.scrollTop + delta,
            behavior: "smooth",
          });
          return;
        }
      }

      // Fallback to default browser behavior
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch {
      // no-op
    }
  }, []);

  const activateCategoryIfNeeded = useCallback(
    (el: HTMLElement, selector: string | null | undefined): boolean => {
      if (!selector || !selector.includes("category")) return false;

      const selectedEl = document.querySelector(
        ".blocklyTreeSelected",
      ) as HTMLElement | null;
      if (selectedEl?.matches?.(selector)) {
        lastActivatedCategoryRef.current = selector;
        return false;
      }

      const isAlreadySelected =
        el.getAttribute("aria-selected") === "true" ||
        el.classList.contains("blocklyTreeSelected");

      if (isAlreadySelected && lastActivatedCategoryRef.current === selector) {
        return false;
      }

      const candidates = [
        el,
        el.closest('[role="treeitem"]') as HTMLElement | null,
        el.parentElement,
      ].filter(Boolean) as HTMLElement[];

      const fireEvents = (target: HTMLElement) => {
        try {
          target.dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles: true,
              cancelable: true,
            }),
          );
          target.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true, cancelable: true }),
          );
          target.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true }),
          );
        } catch {
          try {
            target.click();
          } catch {
            // no-op
          }
        }
      };

      let activated = false;
      for (const candidate of candidates) {
        if (!candidate) continue;
        fireEvents(candidate);
        activated = true;
      }

      if (activated) {
        lastActivatedCategoryRef.current = selector;
        scrollCategoryIntoView(el);
      }

      return activated;
    },
    [scrollCategoryIntoView],
  );

  const findTargetWithRetry = useCallback(
    (attempt = 0) => {
      if (!isOpen || !currentStep) {
        setTargetRect(null);
        return;
      }

      const selector =
        currentStep.id === "job-trigger-block"
          ? getTriggerSelector()
          : currentStep.id === "job-execution-block"
            ? getExecutionSelector()
            : currentStep.selector;

      if (!selector) {
        setTargetRect(null);
        return;
      }

      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        if (attempt < 6) {
          setTimeout(() => findTargetWithRetry(attempt + 1), 180);
        } else {
          setTargetRect(null);
        }
        return;
      }

      const targetEl =
        (el.closest("[data-tour-id]") as HTMLElement | null) || el;

      const activated = activateCategoryIfNeeded(targetEl, selector);
      if (activated) {
        scrollFlyoutToTop();
      }
      const rect = targetEl.getBoundingClientRect();
      setTargetRect(rect);
    },
    [
      isOpen,
      currentStep,
      getTriggerSelector,
      getExecutionSelector,
      activateCategoryIfNeeded,
      scrollFlyoutToTop,
    ],
  );

  const deriveWorkspaceStep = useCallback((): {
    startIndex: number;
    jobTypeLabel: string | null;
    execution: "safe" | "contract" | null;
    safeWallet: boolean;
    safeTransactions: boolean;
    functionArgs: boolean;
  } => {
    const workspace = Blockly.getMainWorkspace?.();
    if (!workspace) {
      return {
        startIndex: 0,
        jobTypeLabel: null as string | null,
        execution: null as "safe" | "contract" | null,
        safeWallet: false,
        safeTransactions: false,
        functionArgs: false,
      };
    }

    const allBlocks = workspace.getAllBlocks(false);
    const chainBlock = allBlocks.find(
      (b) => b.type === "chain_selection" && !b.isInFlyout,
    );
    const jobTypeBlocks = allBlocks.filter(
      (b) =>
        !b.isInFlyout &&
        (b.type === "time_based_job_wrapper" ||
          b.type === "event_based_job_wrapper" ||
          b.type === "condition_based_job_wrapper"),
    );
    const jobTypeBlock = jobTypeBlocks[0];

    const isDescendantOf = (
      block: Blockly.Block | null | undefined,
      ancestor: Blockly.Block | undefined,
    ): boolean => {
      if (!block || !ancestor) return false;
      let current: Blockly.Block | null = block;
      while (current) {
        if (current === ancestor) return true;
        current = current.getParent?.() || null;
      }
      return false;
    };

    const chainHasJobType =
      !!chainBlock &&
      !!jobTypeBlock &&
      chainBlock.getNextBlock?.() === jobTypeBlock &&
      jobTypeBlocks.length === 1;

    const durationBlock = allBlocks.find(
      (b) => !b.isInFlyout && b.type === "timeframe_job",
    );
    const durationAttached =
      durationBlock && isDescendantOf(durationBlock, jobTypeBlock);

    const recurringBlock = allBlocks.find(
      (b) => !b.isInFlyout && b.type === "recurring_job",
    );

    const timeExecutionBlock = allBlocks.find(
      (b) =>
        !b.isInFlyout &&
        (b.type === "time_interval_at_job" ||
          b.type === "cron_expression" ||
          b.type === "specific_datetime"),
    );

    const eventBlock = allBlocks.find(
      (b) => !b.isInFlyout && b.type === "event_listener",
    );
    const conditionBlock = allBlocks.find(
      (b) => !b.isInFlyout && b.type === "condition_monitor",
    );

    const executeFunctionBlock = allBlocks.find(
      (b) => !b.isInFlyout && b.type === "execute_function",
    );
    const executeSafeBlock = allBlocks.find(
      (b) => !b.isInFlyout && b.type === "execute_through_safe_wallet",
    );

    const staticArgsBlock = allBlocks.find(
      (b) => !b.isInFlyout && b.type === "static_arguments",
    );
    const dynamicArgsBlock = allBlocks.find(
      (b) => !b.isInFlyout && b.type === "dynamic_arguments",
    );

    const safeWalletBlock = allBlocks.find(
      (b) =>
        !b.isInFlyout &&
        (b.type === "create_safe_wallet" ||
          b.type === "import_safe_wallet" ||
          b.type === "select_safe_wallet"),
    );
    const safeTxBlocks = allBlocks.filter(
      (b) => !b.isInFlyout && b.type === "safe_transaction",
    );

    const hasValidTimeTrigger =
      jobTypeBlock?.type === "time_based_job_wrapper" &&
      !!timeExecutionBlock &&
      isDescendantOf(timeExecutionBlock, jobTypeBlock);

    const hasValidEventTrigger =
      jobTypeBlock?.type === "event_based_job_wrapper" &&
      !!eventBlock &&
      isDescendantOf(eventBlock, jobTypeBlock) &&
      !!recurringBlock &&
      isDescendantOf(recurringBlock, jobTypeBlock);

    const hasValidConditionTrigger =
      jobTypeBlock?.type === "condition_based_job_wrapper" &&
      !!conditionBlock &&
      isDescendantOf(conditionBlock, jobTypeBlock) &&
      !!recurringBlock &&
      isDescendantOf(recurringBlock, jobTypeBlock);

    const executeChoiceCount =
      (executeFunctionBlock ? 1 : 0) + (executeSafeBlock ? 1 : 0);

    const hasValidExecuteFunction =
      !!executeFunctionBlock &&
      isDescendantOf(executeFunctionBlock, jobTypeBlock) &&
      (staticArgsBlock || dynamicArgsBlock);

    const hasValidExecuteSafe =
      !!executeSafeBlock &&
      isDescendantOf(executeSafeBlock, jobTypeBlock) &&
      !!safeWalletBlock &&
      safeTxBlocks.length > 0;

    const selectedJobTypeLabel =
      jobTypeBlock?.type === "time_based_job_wrapper"
        ? "time-based"
        : jobTypeBlock?.type === "event_based_job_wrapper"
          ? "event-based"
          : jobTypeBlock?.type === "condition_based_job_wrapper"
            ? "condition-based"
            : null;

    let startIndex = 0;
    if (!chainHasJobType) {
      return {
        startIndex,
        jobTypeLabel: selectedJobTypeLabel,
        execution: executeSafeBlock
          ? "safe"
          : executeFunctionBlock
            ? "contract"
            : null,
        safeWallet: !!safeWalletBlock,
        safeTransactions: safeTxBlocks.length > 0,
        functionArgs: !!staticArgsBlock || !!dynamicArgsBlock,
      };
    }

    startIndex = 1;
    if (!durationAttached) {
      return {
        startIndex,
        jobTypeLabel: selectedJobTypeLabel,
        execution: executeSafeBlock
          ? "safe"
          : executeFunctionBlock
            ? "contract"
            : null,
        safeWallet: !!safeWalletBlock,
        safeTransactions: safeTxBlocks.length > 0,
        functionArgs: !!staticArgsBlock || !!dynamicArgsBlock,
      };
    }

    const needsRecurring =
      jobTypeBlock?.type === "event_based_job_wrapper" ||
      jobTypeBlock?.type === "condition_based_job_wrapper";
    const hasRecurringAttached =
      recurringBlock && isDescendantOf(recurringBlock, jobTypeBlock);

    if (needsRecurring && !hasRecurringAttached) {
      return {
        startIndex: 2,
        jobTypeLabel: selectedJobTypeLabel,
        execution: executeSafeBlock
          ? "safe"
          : executeFunctionBlock
            ? "contract"
            : null,
        safeWallet: !!safeWalletBlock,
        safeTransactions: safeTxBlocks.length > 0,
        functionArgs: !!staticArgsBlock || !!dynamicArgsBlock,
      };
    }

    // Skip recurring for time-based jobs
    startIndex = 3;
    if (
      !hasValidTimeTrigger &&
      !hasValidEventTrigger &&
      !hasValidConditionTrigger
    ) {
      return {
        startIndex,
        jobTypeLabel: selectedJobTypeLabel,
        execution: executeSafeBlock
          ? "safe"
          : executeFunctionBlock
            ? "contract"
            : null,
        safeWallet: !!safeWalletBlock,
        safeTransactions: safeTxBlocks.length > 0,
        functionArgs: !!staticArgsBlock || !!dynamicArgsBlock,
      };
    }

    startIndex = 4;
    if (
      executeChoiceCount !== 1 ||
      !(hasValidExecuteFunction || hasValidExecuteSafe)
    ) {
      return {
        startIndex,
        jobTypeLabel: selectedJobTypeLabel,
        execution: executeSafeBlock
          ? "safe"
          : executeFunctionBlock
            ? "contract"
            : null,
        safeWallet: !!safeWalletBlock,
        safeTransactions: safeTxBlocks.length > 0,
        functionArgs: !!staticArgsBlock || !!dynamicArgsBlock,
      };
    }

    return {
      startIndex: jobCreationSteps.length - 1,
      jobTypeLabel: selectedJobTypeLabel,
      execution: executeSafeBlock
        ? "safe"
        : executeFunctionBlock
          ? "contract"
          : null,
      safeWallet: !!safeWalletBlock,
      safeTransactions: safeTxBlocks.length > 0,
      functionArgs: !!staticArgsBlock || !!dynamicArgsBlock,
    };
  }, []);

  const openTour = useCallback((startIndex = 0) => {
    setActiveIndex(startIndex);
    setIsOpen(true);
    localStorage.removeItem(STORAGE_KEY_JOB);
  }, []);

  const openTourAlignedToWorkspace = useCallback(() => {
    const {
      startIndex,
      jobTypeLabel,
      execution,
      safeWallet,
      safeTransactions,
      functionArgs,
    } = deriveWorkspaceStep();

    setSelectedJobTypeLabel(jobTypeLabel);
    setExecutionSelection(execution);
    setHasSafeWallet(safeWallet);
    setHasSafeTransactions(safeTransactions);
    setHasFunctionArgs(functionArgs);
    openTour(startIndex);
  }, [deriveWorkspaceStep, openTour]);

  const resetGuideState = useCallback(() => {
    setSelectedJobTypeLabel(null);
    setExecutionSelection(null);
    setHasSafeWallet(false);
    setHasSafeTransactions(false);
    setHasFunctionArgs(false);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY_JOB, "1");
  }, []);

  const goToStep = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return 0;
        if (next >= jobCreationSteps.length) {
          closeTour();
          return prev;
        }
        return next;
      });
    },
    [closeTour],
  );

  // Auto-open when quick tour is done (either from storage on refresh or custom events)
  useEffect(() => {
    const hasDismissedQuick = localStorage.getItem(STORAGE_KEY_QUICK);
    const hasDismissedJob = localStorage.getItem(STORAGE_KEY_JOB);

    // On refresh: quick tour already dismissed, job tour not yet seen
    if (hasDismissedQuick && !hasDismissedJob) {
      const openWithWorkspaceReady = (attempt = 0) => {
        const workspace = Blockly.getMainWorkspace?.();
        const hasBlocks = workspace?.getAllBlocks(false).length;

        // Wait a few times for blocks to restore after refresh
        if (!hasBlocks && attempt < 8) {
          setTimeout(() => openWithWorkspaceReady(attempt + 1), 220);
          return;
        }

        openTourAlignedToWorkspace();
      };

      openWithWorkspaceReady();
    }

    // Listen for quick tour close to immediately trigger job tour
    const handleQuickTourClosed = () => {
      const jobDismissed = localStorage.getItem(STORAGE_KEY_JOB);
      if (!jobDismissed) {
        setTimeout(() => openTourAlignedToWorkspace(), 300);
      }
    };

    // Manual trigger from UI (e.g., "Job guide" button)
    const handleJobTourOpen = () => {
      // Allow re-opening even if previously dismissed; start from the first step
      localStorage.removeItem(STORAGE_KEY_JOB);
      resetGuideState();
      openTour(0);
    };

    window.addEventListener(
      "blockly-quick-tour-closed",
      handleQuickTourClosed as EventListener,
    );
    window.addEventListener(
      "blockly-job-tour-open",
      handleJobTourOpen as EventListener,
    );

    return () => {
      window.removeEventListener(
        "blockly-quick-tour-closed",
        handleQuickTourClosed as EventListener,
      );
      window.removeEventListener(
        "blockly-job-tour-open",
        handleJobTourOpen as EventListener,
      );
    };
  }, [openTourAlignedToWorkspace, openTour, resetGuideState]);

  // Track target element position
  useLayoutEffect(() => {
    if (!isOpen || !currentStep) {
      setTargetRect(null);
      return;
    }

    findTargetWithRetry();
    const handle = () => findTargetWithRetry();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [
    isOpen,
    currentStep,
    getTriggerSelector,
    getExecutionSelector,
    findTargetWithRetry,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const workspace = Blockly.getMainWorkspace?.();
    if (!workspace) return;

    const checkWorkspace = () => {
      const {
        startIndex,
        jobTypeLabel,
        execution,
        safeWallet,
        safeTransactions,
        functionArgs,
      } = deriveWorkspaceStep();

      setSelectedJobTypeLabel(jobTypeLabel);
      setExecutionSelection(execution);
      setHasSafeWallet(safeWallet);
      setHasSafeTransactions(safeTransactions);
      setHasFunctionArgs(functionArgs);

      setActiveIndex((prev) => {
        if (startIndex === prev) return prev;
        return startIndex;
      });
    };

    // Run immediately and also on future workspace changes
    checkWorkspace();
    const listener = (e: Blockly.Events.Abstract) => {
      if (
        e.type === Blockly.Events.BLOCK_CREATE ||
        e.type === Blockly.Events.BLOCK_MOVE ||
        e.type === Blockly.Events.BLOCK_CHANGE ||
        e.type === Blockly.Events.BLOCK_DELETE
      ) {
        checkWorkspace();
      }
    };

    workspace.addChangeListener(listener);
    return () => {
      workspace.removeChangeListener(listener);
    };
  }, [isOpen, deriveWorkspaceStep]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour();
      if (e.key === "ArrowRight") goToStep(1);
      if (e.key === "ArrowLeft") goToStep(-1);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, closeTour, goToStep]);

  if (!isOpen || !currentStep) return null;

  const triggerDescription =
    selectedJobTypeLabel === "time-based"
      ? "Add any one execution block from the Time category"
      : selectedJobTypeLabel === "event-based"
        ? "Add an event Listener block from the Event category, optionally you can add a filter block inside the Listener block"
        : selectedJobTypeLabel === "condition-based"
          ? "Add a Condition block from the Condition category."
          : currentStep.description;

  const descriptionText =
    currentStep.id === "job-duration-block" && selectedJobTypeLabel
      ? `Great! You are creating a ${selectedJobTypeLabel} job. Now, add a Duration block inside so this job knows how long to run.`
      : currentStep.id === "job-trigger-block"
        ? triggerDescription
        : currentStep.id === "job-execution-block" &&
            executionSelection === "safe"
          ? !hasSafeWallet
            ? "You selected Safe Wallet execution. Add a Safe Wallet block from the Safe Wallet category"
            : !hasSafeTransactions
              ? "Safe wallet selected. Now add one or more Safe Transactions."
              : "You selected Safe Wallet execution. Safe wallet and transactions are set."
          : currentStep.id === "job-execution-block" &&
              executionSelection === "contract"
            ? "You selected Execute Function. Provide static or dynamic arguments for the function."
            : currentStep.id === "job-final-block"
              ? "All required details are set. You can now create the job."
              : currentStep.description;

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      {/* Subtle highlight around the Chain category row */}
      {highlightStyle && (
        <div
          className="absolute border-2 border-[#C07AF6] rounded-xl shadow-[0_0_0_2px_rgba(192,122,246,0.35)] transition-all duration-200 ease-out pointer-events-none"
          style={highlightStyle}
        />
      )}

      {/* Tooltip – does not block interaction with the toolbox */}
      <div
        className="absolute pointer-events-auto max-w-[360px] bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-5 text-white"
        style={{
          bottom: 50,
          right: 24,
        }}
      >
        <div className="text-sm text-gray-200 mb-4 leading-relaxed">
          {descriptionText}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-gray-300 hover:text-white underline-offset-4 underline"
            onClick={closeTour}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
