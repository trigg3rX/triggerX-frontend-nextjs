import React, { useState, useEffect } from "react";
import { Typography } from "@/components/ui/Typography";
import {
  RefreshCw,
  CheckCircle2,
  Loader2,
  Shield,
  FilePen,
  Rocket,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import type { StepId, ImportWalletStatusProps } from "@/types/safe";
import Link from "next/link";

const STEP_ORDER: StepId[] = ["validate", "sign", "execute"];

const STEP_LABELS: Record<StepId, string> = {
  validate: "Validating Safe wallet requirements",
  sign: "Signing the enableModule message",
  execute: "Waiting for other signers to sign enableModule transaction",
};

const STEP_ICONS: Record<
  StepId,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  validate: Shield,
  sign: FilePen,
  execute: Rocket,
};

/**
 * @description
 * ImportWalletStatus component displays the status of the import wallet process.
 * @note Used tailwind classes in typography component to style the text for custom styling.
 * @note Not used defined button component for the refresh button.
 * @note not maintained vertical padding for the expandable section.
 */

export const ImportWalletStatus: React.FC<ImportWalletStatusProps> = ({
  currentStep,
  completedSteps,
  isValidating,
  isEnablingModule,
  isSigningEnableModule,
  isExecutingEnableModule,
  isProposingEnableModule,
  multisigInfo,
  isCheckingModuleStatus,
  onManualRefresh,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<StepId>>(new Set());

  // Determine if we need to show third step (only for multisig scenarios)
  const isMultisigNeeded =
    multisigInfo &&
    (multisigInfo.threshold > 1 || multisigInfo.owners.length > 1);

  // Auto-expand third step when transitioning to it (only if multisig is needed)
  useEffect(() => {
    if (currentStep === "execute" && isMultisigNeeded) {
      setExpandedSteps((prev) => {
        const next = new Set(prev);
        next.add("execute");
        return next;
      });
    }
  }, [currentStep, isMultisigNeeded]);

  // Get the state of the step based on the current step and completed steps.
  const getStepState = (step: StepId): "pending" | "current" | "completed" => {
    if (completedSteps.has(step)) {
      return "completed";
    }
    if (currentStep === step) {
      return "current";
    }
    return "pending";
  };

  // Step descriptions to display the status of the step based on the current state.
  const stepDescriptions: Record<StepId, string> = {
    validate: isValidating
      ? "Checking Safe wallet ownership and network compatibility."
      : "Ready",
    sign: isSigningEnableModule
      ? "Sign the enableModule request message in your connected wallet to proceed."
      : isEnablingModule
        ? "Confirm the transaction in your connected wallet to enable the TriggerX module."
        : isExecutingEnableModule || isProposingEnableModule || multisigInfo
          ? "Signature collected. Waiting for other signers to sign the enableModule transaction."
          : "Ready",
    execute: isExecutingEnableModule
      ? "Executing the enableModule transaction in your connected wallet to activate the TriggerX module."
      : isProposingEnableModule
        ? "Publishing the enableModule transaction to the Safe Transaction Service to activate the TriggerX module."
        : multisigInfo
          ? `Waiting for ${multisigInfo.threshold - 1} more signatures to complete the process to enable the TriggerX module.`
          : "Ready",
  };

  // Toggle the step to expand or collapse the details section.
  const toggleStep = (step: StepId) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(step)) {
        next.delete(step);
      } else {
        next.add(step);
      }
      return next;
    });
  };

  // StatusIcon component to display the status of the step.
  const StatusIcon: React.FC<{ step: StepId }> = ({ step }) => {
    const state = getStepState(step);
    const StepIcon = STEP_ICONS[step];

    if (state === "current") {
      return <Loader2 className="animate-spin text-white" size={16} />;
    }
    if (state === "completed") {
      return <CheckCircle2 className="text-green-400" size={16} />;
    }
    return <StepIcon size={16} className="text-white" />;
  };

  // Filter steps - exclude execute step if not multisig
  const visibleSteps = STEP_ORDER.filter(
    (step) => step !== "execute" || isMultisigNeeded,
  );

  return (
    <>
      {/* Status Display */}
      <div className="space-y-4">
        {visibleSteps.map((step) => {
          const state = getStepState(step);
          const isCurrent = state === "current";
          const isExpanded = expandedSteps.has(step);

          // Only execute step should have expandable section
          const shouldShowExpand = step === "execute" && multisigInfo;
          const hasDescription =
            isCurrent || (step === "execute" && multisigInfo);

          return (
            <div
              key={step}
              className="bg-white/5 border border-white/10 rounded-lg transition-all"
            >
              {/* Step Header - Always Visible, Compact */}
              <div className="flex items-start gap-2 p-3">
                <div className="mt-0.5 shrink-0">
                  <StatusIcon step={step} />
                </div>

                {/* Step Title */}
                <div className="flex-1 min-w-0 text-left px-2">
                  <Typography variant="body" align="justify">
                    {STEP_LABELS[step]}
                  </Typography>

                  {/* Show description inline for first two steps, or execute step when not expanded */}
                  {hasDescription && (!shouldShowExpand || !isExpanded) && (
                    <Typography
                      variant="caption"
                      color="secondary"
                      align="justify"
                    >
                      {stepDescriptions[step]}
                    </Typography>
                  )}
                </div>

                {/* Expand/Collapse Button - Only show for execute step with multisig */}
                {shouldShowExpand && (
                  <button
                    onClick={() => toggleStep(step)}
                    className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                    aria-label={
                      isExpanded ? "Collapse details" : "Expand details"
                    }
                  >
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                )}
              </div>

              {/* Expandable Details Section - Only for Multisig scenarios*/}
              {isExpanded && shouldShowExpand && multisigInfo && (
                <div className="border-t border-white/10 mt-2 pt-4 pb-4 px-4 sm:px-5">
                  <div className="space-y-4">
                    {/* Multisig Details Card */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <Typography
                          variant="body"
                          color="yellow"
                          className="text-sm font-semibold"
                          align="left"
                        >
                          Pending Transaction
                        </Typography>
                        <Typography
                          variant="caption"
                          color="secondary"
                          className="text-xs"
                          align="left"
                        >
                          {multisigInfo.threshold - 1} out of{" "}
                          {multisigInfo.threshold} more signatures required
                        </Typography>
                      </div>

                      {onManualRefresh && (
                        <button
                          onClick={onManualRefresh}
                          disabled={isCheckingModuleStatus}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#F8FF7C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Check if module has been enabled"
                        >
                          <RefreshCw
                            size={16}
                            className={
                              isCheckingModuleStatus ? "animate-spin" : ""
                            }
                          />
                        </button>
                      )}
                    </div>

                    {multisigInfo.queueUrl && (
                      <Typography
                        variant="caption"
                        color="secondary"
                        align="center"
                      >
                        <Link
                          href={multisigInfo.queueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-[#C07AF6] transition-colors underline"
                        >
                          Open in Safe App
                          <ExternalLink
                            size={16}
                            className="inline-block mb-1"
                          />
                        </Link>
                      </Typography>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ImportWalletStatus;
