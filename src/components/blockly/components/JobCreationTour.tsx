"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import * as Blockly from "blockly/core";
import { STORAGE_KEY_QUICK } from "./VisualBuilderTour";

const STORAGE_KEY_JOB = "blockly-demo-job-tour-dismissed";

const jobCreationSteps = [
  {
    id: "job-chain-block",
    description: "Start by adding a chain block to the workspace.",
    selector: '[data-tour-id="chain-category"]',
  },
  {
    id: "job-wallet-block",
    description:
      "Great! Now add a Wallet block and fit it inside your chain block so the job knows which wallet to use.",
    selector: '[data-tour-id="chain-category"]',
  },
  {
    id: "job-type-block",
    description: "Next choose any Job Type block and add it to the workspace.",
    selector: '[data-tour-id="job-type-category"]',
  },
  {
    id: "job-duration-block",
    description:
      "Finally, add a duration block so this job knows how long to run.",
    selector: '[data-tour-id="duration-category"]',
  },
];

export function JobCreationTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [selectedJobTypeLabel, setSelectedJobTypeLabel] = useState<
    string | null
  >(null);

  const currentStep = jobCreationSteps[activeIndex];

  const openTour = useCallback((startIndex = 0) => {
    setActiveIndex(startIndex);
    setIsOpen(true);
    localStorage.removeItem(STORAGE_KEY_JOB);
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
      setActiveIndex(0);
      setIsOpen(true);
    }

    // Listen for quick tour close to immediately trigger job tour
    const handleQuickTourClosed = () => {
      const jobDismissed = localStorage.getItem(STORAGE_KEY_JOB);
      if (!jobDismissed) {
        setTimeout(() => openTour(0), 300);
      }
    };

    // Manual trigger from UI (e.g., "Job guide" button)
    const handleJobTourOpen = () => {
      // Allow re-opening even if previously dismissed
      localStorage.removeItem(STORAGE_KEY_JOB);
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
  }, [openTour]);

  // Track target element position
  useLayoutEffect(() => {
    if (!isOpen || !currentStep) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const el = document.querySelector(
        currentStep.selector,
      ) as HTMLElement | null;
      if (!el) {
        setTargetRect(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    };

    findTarget();
    const handle = () => findTarget();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [isOpen, currentStep]);

  // Auto-advance based on workspace state:
  // step 1 -> step 2 when a chain_selection block exists,
  // step 2 -> step 3 when a wallet_selection block is nested inside a chain_selection,
  // step 3 -> step 4 when any job type wrapper block is present,
  // step 4 -> finish when a timeframe_job (duration) block is present.
  useEffect(() => {
    if (!isOpen) return;

    const workspace = Blockly.getMainWorkspace?.();
    if (!workspace) return;

    const checkWorkspace = () => {
      const allBlocks = workspace.getAllBlocks(false);

      const hasChainBlock = allBlocks.some(
        (b) => b.type === "chain_selection" && !b.isInFlyout,
      );

      if (!hasChainBlock) return;

      // If we're on the first step and a chain block exists, move to wallet step
      if (activeIndex === 0) {
        setActiveIndex(1);
        return;
      }

      // For the wallet step, look for a wallet_selection block that is a descendant of a chain_selection block
      if (activeIndex === 1) {
        const hasNestedWallet = allBlocks.some((block) => {
          if (block.type !== "chain_selection" || block.isInFlyout)
            return false;

          // Check value and statement inputs for a wallet_selection block
          const inputs = block.inputList || [];
          for (const input of inputs) {
            const target = input.connection?.targetBlock();
            if (!target) continue;

            let child: Blockly.Block | null = target;
            while (child) {
              if (child.type === "wallet_selection") return true;
              child = child.getNextBlock?.() || null;
            }
          }

          return false;
        });

        if (hasNestedWallet) {
          setActiveIndex(2);
          return;
        }
      }

      // For the job type step, check for any job-type wrapper block in the workspace
      if (activeIndex === 2) {
        const jobTypeBlock = allBlocks.find(
          (b) =>
            !b.isInFlyout &&
            (b.type === "time_based_job_wrapper" ||
              b.type === "event_based_job_wrapper" ||
              b.type === "condition_based_job_wrapper"),
        );

        if (jobTypeBlock) {
          let label: string | null = null;
          if (jobTypeBlock.type === "time_based_job_wrapper") {
            label = "time-based";
          } else if (jobTypeBlock.type === "event_based_job_wrapper") {
            label = "event-based";
          } else if (jobTypeBlock.type === "condition_based_job_wrapper") {
            label = "condition-based";
          }

          setSelectedJobTypeLabel(label);
          setActiveIndex(3);
          return;
        }
      }

      // For the duration step, check for a timeframe_job block anywhere in the workspace
      if (activeIndex === 3) {
        const hasDurationBlock = allBlocks.some(
          (b) => !b.isInFlyout && b.type === "timeframe_job",
        );

        if (hasDurationBlock) {
          closeTour();
        }
      }
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
  }, [isOpen, activeIndex, closeTour]);

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

  const descriptionText =
    currentStep.id === "job-duration-block" && selectedJobTypeLabel
      ? `You are creating a ${selectedJobTypeLabel} job. Finally, add a duration block so this job knows how long to run.`
      : currentStep.description;

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none">
      {/* Subtle highlight around the Chain category row */}
      {targetRect && (
        <div
          className="absolute border-2 border-[#C07AF6] rounded-xl shadow-[0_0_0_2px_rgba(192,122,246,0.35)] transition-all duration-200 ease-out pointer-events-none"
          style={{
            top: `${Math.max(targetRect.top - 4, 4)}px`,
            left: `${Math.max(targetRect.left - 4, 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
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
