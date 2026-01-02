"use client";

import React, { useMemo } from "react";
import { Card } from "../../ui/Card";
import { Typography } from "../../ui/Typography";
import { useStepFlow } from "../contexts/StepFlowContext";

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

interface StepItemProps {
  step: StepState;
  index: number;
  isActive: boolean;
  isComplete: boolean;
  showDescription: boolean;
  activeHint: string | null | undefined;
  onStepClick?: (stepId: StepId) => void;
  onHintClick?: (stepId: StepId) => void;
  isMobile?: boolean;
}

function StepItem({
  step,
  index,
  isActive,
  isComplete,
  showDescription,
  activeHint,
  onStepClick,
  onHintClick,
  isMobile = false,
}: StepItemProps) {
  return (
    <li
      className={`relative ${isMobile ? "shrink-0" : ""}`}
      style={isMobile ? { width: "240px" } : undefined}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStepClick?.(step.id);
        }}
        className={`w-full text-left rounded-lg border p-2 transition-all duration-200 ${
          isMobile ? "h-full" : ""
        } ${
          isActive
            ? "bg-white/5 border-[#C07AF6]/50 shadow-sm"
            : isComplete
              ? "bg-white/[0.02] border-white/10 hover:border-white/20"
              : "bg-transparent border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex flex-col gap-1">
          {/* Step indicator and label in same row */}
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div
              className={`mb-0.5 pt-0.5 pr-0.5 w-4 h-4 flex items-center justify-center rounded-full border text-[9px] transition-colors ${
                isComplete
                  ? "bg-[#C07AF6] border-[#C07AF6] text-white"
                  : isActive
                    ? "bg-transparent border-[#C07AF6] text-[#C07AF6]"
                    : "bg-transparent border-white/30 text-gray-400"
              }`}
            >
              {isComplete ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="8"
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
                index + 1
              )}
            </div>

            {/* Step label */}
            <div
              className={`flex items-center gap-2 flex-1 ${isMobile ? "min-w-0" : ""}`}
            >
              <Typography
                variant="caption"
                color={isActive ? "white" : isComplete ? "secondary" : "gray"}
                className={`font-medium text-gray-400 ${isMobile ? "truncate" : ""}`}
                align="left"
              >
                {step.label}
              </Typography>
              {/* {step.optional && (
                <Typography
                  variant="caption"
                  color="gray"
                  className={isMobile ? "shrink-0" : ""}
                  align="left"
                >
                  Optional
                </Typography>
              )} */}
            </div>
          </div>

          {/* Description takes full width */}
          {isActive && showDescription && (
            <p
              className={`text-xs text-gray-400 leading-relaxed ${
                isMobile ? "line-clamp-2" : ""
              }`}
            >
              {activeHint}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {isActive && (
          <div className=" mt-1 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHintClick?.(step.id);
              }}
              className="text-[10px] text-[#C07AF6] hover:text-[#C07AF6]/80 transition-colors"
            >
              Show me where
            </button>
          </div>
        )}
      </button>
    </li>
  );
}

interface ProgressLineProps {
  completedCount: number;
  totalSteps: number;
  isHorizontal?: boolean;
}

function ProgressLine({
  completedCount,
  totalSteps,
  isHorizontal = false,
}: ProgressLineProps) {
  const progress = totalSteps > 1 ? (completedCount / totalSteps) * 100 : 0;

  if (isHorizontal) {
    return (
      <>
        <div
          className="absolute top-0 left-2 right-2 h-[1px] bg-white/10"
          aria-hidden="true"
        />
        <div
          className="absolute top-0 left-2 h-[1px] bg-[#C07AF6] transition-all duration-500 ease-out"
          style={{
            width: progress > 0 ? `calc(${progress}% - 8px)` : "0px",
          }}
          aria-hidden="true"
        />
      </>
    );
  }

  return (
    <>
      <div
        className="absolute left-0 top-2 bottom-2 w-[1px] bg-white/10"
        aria-hidden="true"
      />
      <div
        className="absolute left-0 top-2 w-[1px] bg-[#C07AF6] transition-all duration-500 ease-out"
        style={{
          height: progress > 0 ? `calc(${progress}% - 8px)` : "0px",
        }}
        aria-hidden="true"
      />
    </>
  );
}

export function StepFlowPanel() {
  const { steps, activeStep, activeHint, handleStepClick, handleHintClick } =
    useStepFlow();

  const completedCount = useMemo(() => {
    // Calculate progress based on the last completed step's position
    // This ensures the progress bar extends toward "ready" even if intermediate steps aren't complete
    let lastCompletedIndex = -1;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].complete) {
        lastCompletedIndex = i;
      } else {
        // Once we hit an incomplete step, stop
        break;
      }
    }
    return lastCompletedIndex + 1;
  }, [steps]);

  return (
    <Card className="flex flex-col gap-3 !p-3 !xl:p-4 !border-none w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400 tracking-wider mb-1">
          Job Guide
        </h3>
        {/* <p className="text-xs text-gray-500">
          {completedCount} of {steps.length} steps completed
        </p> */}
      </div>
      {/* Mobile: Horizontal scrollable layout */}
      <div className="xl:hidden relative">
        <ProgressLine
          completedCount={completedCount}
          totalSteps={steps.length}
          isHorizontal={true}
        />
        <div className="overflow-x-auto pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <ol className="flex gap-2 pt-3">
            {steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                index={index}
                isActive={activeStep?.id === step.id}
                isComplete={step.complete}
                showDescription={
                  activeStep?.id === step.id && Boolean(activeHint)
                }
                activeHint={activeHint}
                onStepClick={handleStepClick}
                onHintClick={handleHintClick}
                isMobile={true}
              />
            ))}
          </ol>
        </div>
      </div>

      {/* Desktop: Vertical layout */}
      <div className="hidden xl:block relative pl-2">
        <ProgressLine
          completedCount={completedCount}
          totalSteps={steps.length}
          isHorizontal={false}
        />
        <ol className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <StepItem
              key={step.id}
              step={step}
              index={index}
              isActive={activeStep?.id === step.id}
              isComplete={step.complete}
              showDescription={
                activeStep?.id === step.id && Boolean(activeHint)
              }
              activeHint={activeHint}
              onStepClick={handleStepClick}
              onHintClick={handleHintClick}
              isMobile={false}
            />
          ))}
        </ol>
      </div>
    </Card>
  );
}
