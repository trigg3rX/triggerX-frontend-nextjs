"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  selector: string;
}

export const STORAGE_KEY_QUICK = "blockly-demo-tour-dismissed";

// Initial quick orientation tour
const defaultSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the Triggerx Visual-Job-Builder",
    description:
      "This is your canvas for creating automated Web3 workflows. Drag and drop blocks to define logic without writing code.",
    selector: '[data-tour-id="workspace-area"]',
  },
  {
    id: "job-title",
    title: "Name your job",
    description:
      "Give the automation a clear name. You can click the pen icon to edit and we auto-save it for you.",
    selector: '[data-tour-id="job-title-input"]',
  },
  {
    id: "toolbox",
    title: "Pick a block category",
    description:
      "Use the toolbox to browse Wallet, Chain, Job Type and more. Categories stay open so you can drag blocks out.",
    selector: '[data-tour-id="toolbox"]',
  },
  {
    id: "flyout",
    title: "Drag blocks from the flyout",
    description:
      "Click a category to see its blocks here. Drag blocks into the canvas to build your automation logic.",
    selector: '[data-tour-id="flyout"]',
  },
  {
    id: "permission",
    title: "Confirm permissions",
    description:
      "Make sure the TriggerX executor address has the right to call your target contract. Tick this box to confirm.",
    selector: '[data-tour-id="permission-card"]',
  },
  {
    id: "create",
    title: "Create the job",
    description:
      "When the blocks are valid, click Create Job to estimate fees and submit your automation.",
    selector: '[data-tour-id="create-job-button"]',
  },
];

interface VisualBuilderTourProps {
  steps?: TourStep[];
}

export function VisualBuilderTour({
  steps = defaultSteps,
}: VisualBuilderTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[activeIndex];

  const openTour = useCallback((startIndex = 0) => {
    setActiveIndex(startIndex);
    setIsOpen(true);
    localStorage.removeItem(STORAGE_KEY_QUICK);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);

    // Mark the quick tour as dismissed in storage
    localStorage.setItem(STORAGE_KEY_QUICK, "1");

    // Notify any listeners (e.g. follow-up tours) that the quick tour finished or was skipped
    try {
      window.dispatchEvent(new CustomEvent("blockly-quick-tour-closed"));
    } catch {
      // no-op in non-browser environments
    }
  }, []);

  const goToStep = useCallback(
    (delta: number) => {
      setActiveIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return 0;
        if (next >= steps.length) {
          closeTour();
          return prev;
        }
        return next;
      });
    },
    [steps.length, closeTour],
  );

  // (Previously we blocked body scroll here; removed so the page can still scroll while the tour is open.)

  // Auto-open once per browser
  useEffect(() => {
    const hasDismissedQuick = localStorage.getItem(STORAGE_KEY_QUICK);
    if (!hasDismissedQuick) {
      setActiveIndex(0);
      setIsOpen(true);
    }
  }, []);

  // Allow manual opening from header ("Visual guide" button)
  useEffect(() => {
    const handleQuickTourOpen = () => {
      openTour(0);
    };

    window.addEventListener(
      "blockly-quick-tour-open",
      handleQuickTourOpen as EventListener,
    );

    return () => {
      window.removeEventListener(
        "blockly-quick-tour-open",
        handleQuickTourOpen as EventListener,
      );
    };
  }, [openTour]);

  // Allow manual opening from header ("Visual guide" button)
  useEffect(() => {
    const handleQuickTourOpen = () => {
      openTour(0);
    };

    window.addEventListener(
      "blockly-quick-tour-open",
      handleQuickTourOpen as EventListener,
    );

    return () => {
      window.removeEventListener(
        "blockly-quick-tour-open",
        handleQuickTourOpen as EventListener,
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

      // Only scroll if the element is meaningfully out of view to avoid jarring jumps
      const viewportHeight = window.innerHeight || 0;
      const viewportWidth = window.innerWidth || 0;
      const isVerticallyVisible =
        rect.top >= 0 && rect.bottom <= viewportHeight;
      const isHorizontallyVisible =
        rect.left >= 0 && rect.right <= viewportWidth;

      if (!isVerticallyVisible || !isHorizontallyVisible) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
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

  const totalSteps = useMemo(() => steps.length, [steps.length]);

  const getTooltipTop = () => {
    if (!targetRect) return 80;

    // For the welcome/workspace step, show the tooltip above the workspace
    if (currentStep?.id === "welcome") {
      return Math.max(targetRect.top, 24);
    }

    // For toolbox and flyout, keep it in view vertically near the target
    if (currentStep?.id === "toolbox" || currentStep?.id === "flyout") {
      const preferredTop = targetRect.top;
      const maxTop = window.innerHeight - 240; // avoid going off-screen
      return Math.min(Math.max(preferredTop, 24), maxTop);
    }

    // Default: show below the target
    return Math.max(targetRect.bottom + 16, 24);
  };

  const getTooltipLeft = () => {
    if (!targetRect) return 24;

    // For toolbox and flyout, place to the right of the target if possible
    if (currentStep?.id === "toolbox" || currentStep?.id === "flyout") {
      return Math.min(targetRect.right + 16, window.innerWidth - 380);
    }

    // Default: align with the target's left edge
    return Math.min(targetRect.left, window.innerWidth - 380);
  };

  const getHighlightWidth = () => {
    if (!targetRect) return 0;

    // For the job title step, make the purple border a bit wider
    if (currentStep?.id === "job-title") {
      return targetRect.width + 80;
    }

    return targetRect.width + 24;
  };

  return (
    <>
      {isOpen && currentStep && (
        <div className="fixed inset-0 z-[99999] pointer-events-none">
          <div className="absolute inset-0 bg-black/60" onClick={closeTour} />

          {targetRect && (
            <div
              className="absolute border-2 border-[#C07AF6] rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out pointer-events-none"
              style={{
                top: `${Math.max(targetRect.top - 12, 8)}px`,
                left: `${Math.max(targetRect.left - 12, 8)}px`,
                width: `${getHighlightWidth()}px`,
                height: `${targetRect.height + 24}px`,
              }}
            />
          )}

          <div
            className="absolute pointer-events-auto max-w-[360px] bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-5 text-white"
            style={{
              top: getTooltipTop(),
              left: getTooltipLeft(),
            }}
          >
            <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">
              Step {activeIndex + 1} of {totalSteps}
            </div>
            <div className="text-lg font-semibold mb-2">
              {currentStep.title}
            </div>
            <div className="text-sm text-gray-200 mb-4 leading-relaxed">
              {currentStep.description}
            </div>
            <div className="flex justify-between items-center gap-2">
              <button
                type="button"
                className="text-xs text-gray-300 hover:text-white underline-offset-4 underline"
                onClick={closeTour}
              >
                Skip tour
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-full bg-white/10 text-sm hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => goToStep(-1)}
                  disabled={activeIndex === 0}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-full bg-[#C07AF6] text-sm hover:bg-[#a46be0] transition-colors"
                  onClick={() => goToStep(1)}
                >
                  {activeIndex === totalSteps - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
