"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../ui/Card";

export type StepId =
  | "jobTitle"
  | "chain"
  | "jobType"
  | "trigger"
  | "execution"
  | "functionValue"
  | "wallet"
  | "ready";

export interface StepState {
  id: StepId;
  label: string;
  description?: string;
  optional?: boolean;
  complete: boolean;
}

interface StepFlowPanelProps {
  steps: StepState[];
  onStepClick?: (stepId: StepId) => void;
  activeStepId?: StepId;
  activeHint?: string | null;
  onHintClick?: (stepId: StepId) => void;
}

export function StepFlowPanel({
  steps,
  onStepClick,
  activeStepId,
  activeHint,
  onHintClick,
}: StepFlowPanelProps) {
  const [openHelpStep, setOpenHelpStep] = useState<StepId | null>(null);
  const [celebratingIds, setCelebratingIds] = useState<Set<StepId>>(
    () => new Set(),
  );
  const prevCompletionRef = useRef<Record<StepId, boolean>>({
    jobTitle: false,
    chain: false,
    jobType: false,
    trigger: false,
    execution: false,
    functionValue: false,
    wallet: false,
    ready: false,
  });

  useEffect(() => {
    const newlyCompleted: StepId[] = [];
    steps.forEach((step) => {
      const prev = prevCompletionRef.current[step.id];
      if (step.complete && !prev) {
        newlyCompleted.push(step.id);
      }
      prevCompletionRef.current[step.id] = step.complete;
    });

    if (newlyCompleted.length) {
      setCelebratingIds((prev) => {
        const next = new Set(prev);
        newlyCompleted.forEach((id) => next.add(id));
        return next;
      });

      newlyCompleted.forEach((id) => {
        window.setTimeout(() => {
          setCelebratingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 1200);
      });
    }
  }, [steps]);

  useEffect(() => {
    setOpenHelpStep(null);
  }, [activeStepId]);

  const completedCount = useMemo(
    () => steps.filter((step) => step.complete).length,
    [steps],
  );

  return (
    <Card className="flex flex-col gap-4 p-4 w-full bg-[#161616]/80 border border-white/10">
      <div>
        <p className="text-sm uppercase tracking-wide text-gray-400">
          Job Builder Flow
        </p>
        <p className="text-base font-semibold text-white">Follow the steps</p>
      </div>
      <div className="relative pl-5">
        <span
          className="pointer-events-none absolute left-[11px] top-3 bottom-3 w-px bg-white/10"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute left-[11px] top-3 w-px bg-gradient-to-b from-[#C07AF6] to-[#c07af6]/20 transition-[height]"
          style={{
            height:
              steps.length > 1
                ? `calc(${(completedCount / (steps.length - 1)) * 100}% - 8px)`
                : "0px",
          }}
          aria-hidden="true"
        />
        <ol className="flex flex-col gap-3">
          {steps.map((step, index) => {
            const isActive = activeStepId === step.id;
            const isComplete = step.complete;
            const isCelebrating = celebratingIds.has(step.id);
            const showDescription = isActive && Boolean(activeHint);
            const isHelpOpen = openHelpStep === step.id;

            const basePadding = isActive ? "py-4" : "py-2";
            const cardClasses = [
              "step-card",
              "relative",
              "rounded-2xl",
              "border",
              "px-3",
              basePadding,
              "transition-all",
              "duration-300",
              "focus-within:outline",
              "focus-within:outline-2",
              "focus-within:outline-[#C07AF6]",
            ];

            if (isActive) {
              cardClasses.push(
                "bg-[#1f1a26]",
                "border-[#C07AF6]",
                "shadow-[0_0_12px_rgba(192,122,246,0.35)]",
                "animate-none",
              );
            }

            if (isComplete) {
              cardClasses.push(
                "bg-[#111111]",
                "border-white/10",
                "text-gray-200",
                "step-card-complete",
              );
            }

            if (isCelebrating) {
              cardClasses.push("step-card-celebrate");
            }

            return (
              <li key={step.id} className="relative pl-4">
                {index < steps.length - 1 && (
                  <span
                    className={`pointer-events-none absolute left-[11px] top-10 bottom-[-8px] w-px origin-top transition-transform duration-700 ${
                      isComplete ? "bg-[#C07AF6]" : "bg-white/10"
                    }`}
                    style={{
                      transform: isComplete ? "scaleY(1)" : "scaleY(0)",
                    }}
                    aria-hidden="true"
                  />
                )}
                <article className={cardClasses.join(" ")}>
                  <button
                    type="button"
                    onClick={() => onStepClick?.(step.id)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <div
                      className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
                        isComplete
                          ? "bg-[#C07AF6] border-[#C07AF6] text-black"
                          : "bg-transparent border-white/30 text-gray-300"
                      } ${isCelebrating ? "step-check-celebrate" : ""}`}
                    >
                      {isComplete ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {step.label}
                        </span>
                        {step.optional && (
                          <span className="text-[10px] uppercase tracking-wide text-gray-400">
                            Optional
                          </span>
                        )}
                      </div>
                      {isActive && showDescription && (
                        <p className="mt-1 text-xs text-gray-200">
                          {activeHint}
                        </p>
                      )}
                      {isComplete && (
                        <span className="text-[11px] uppercase tracking-wide text-emerald-300">
                          Completed
                        </span>
                      )}
                    </div>
                  </button>
                  {isActive && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onHintClick?.(step.id);
                        }}
                        className="rounded-full border border-[#C07AF6]/60 px-3 py-1 text-xs font-semibold text-[#C07AF6] transition-colors hover:bg-[#C07AF6]/10"
                      >
                        Show me where
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenHelpStep((prev) =>
                              prev === step.id ? null : step.id,
                            )
                          }
                          className="rounded-full border border-white/20 px-3 py-1 text-xs text-gray-300 transition-colors hover:bg-white/5"
                        >
                          Help
                        </button>
                        {isHelpOpen && (
                          <div className="absolute z-20 mt-2 w-56 rounded-xl border border-white/10 bg-black/90 p-3 text-xs text-gray-200 shadow-lg">
                            {step.description ||
                              "Use this step to keep your automation on track."}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}
