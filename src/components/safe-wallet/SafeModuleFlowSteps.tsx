import React from "react";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  Loader2,
  FilePen,
  BadgeCheck,
  Plus,
  RefreshCw,
  Ban,
  ExternalLink,
  Shield,
  Rocket,
  Clock,
} from "lucide-react";
import { useChainId } from "wagmi";
import {
  getSafeModuleAddress,
  getExplorerUrl,
} from "@/utils/contractAddresses";
import Link from "next/link";
import type {
  SafeCreationStepStatus,
  StepId,
  MultisigInfo,
} from "@/types/safe";
import type { SafeModuleFlowMode } from "@/hooks/useSafeModuleFlow";

interface SafeModuleFlowStepsProps {
  mode: SafeModuleFlowMode;

  // For create mode (step-by-step progress)
  createStep?: SafeCreationStepStatus;
  signStep?: SafeCreationStepStatus;
  executeStep?: SafeCreationStepStatus;
  createError?: string;
  signError?: string;
  executeError?: string;
  onRetryCreate?: () => void;
  onRetrySign?: () => void;
  onRetryExecute?: () => void;

  // For import/enable/disable modes (unified step tracking)
  currentStep?: StepId | null;
  completedSteps?: Set<StepId>;
  isValidating?: boolean;
  isSigning?: boolean;
  isExecuting?: boolean;
  isProposing?: boolean;

  // Multisig
  multisigInfo?: MultisigInfo | null;
  moduleStatus?: boolean | null;
  isCheckingModuleStatus?: boolean;
  onManualRefresh?: () => void;
}

// Helper to get step status for create mode
const StatusIcon: React.FC<{
  status: SafeCreationStepStatus;
  kind: "create" | "sign" | "enable";
}> = ({ status, kind }) => {
  if (status === "pending")
    return <Loader2 className="animate-spin text-white/70" size={20} />;
  if (status === "success")
    return <CheckCircle2 className="text-green-400" size={20} />;
  const colorClass = status === "error" ? "text-red-600" : "text-white/70";
  if (kind === "create") return <Plus size={20} className={colorClass} />;
  if (kind === "sign") return <FilePen size={20} className={colorClass} />;
  if (kind === "enable") return <BadgeCheck size={20} className={colorClass} />;
  return null;
};

// Helper to get step icon for import/enable/disable modes
const StepIcon: React.FC<{
  step: StepId;
  state: "pending" | "current" | "completed";
}> = ({ step, state }) => {
  if (state === "current") {
    return <Loader2 className="animate-spin text-white" size={16} />;
  }
  if (state === "completed") {
    return <CheckCircle2 className="text-green-400" size={16} />;
  }

  // Pending state
  const icons: Record<StepId, React.ReactNode> = {
    validate: <Shield size={16} className="text-white" />,
    sign: <FilePen size={16} className="text-white" />,
    execute: <Rocket size={16} className="text-white" />,
  };

  return <>{icons[step]}</>;
};

export const SafeModuleFlowSteps: React.FC<SafeModuleFlowStepsProps> = ({
  mode,
  createStep = "idle",
  signStep = "idle",
  executeStep = "idle",
  createError,
  signError,
  executeError,
  onRetryCreate,
  onRetrySign,
  onRetryExecute,
  currentStep,
  completedSteps = new Set(),
  isValidating = false,
  isSigning = false,
  isExecuting = false,
  isProposing = false,
  multisigInfo,
  moduleStatus,
  isCheckingModuleStatus = false,
  onManualRefresh,
}) => {
  const chainId = useChainId();
  const createSafeModuleAddress = getSafeModuleAddress(chainId);
  const createExplorerUrl = getExplorerUrl(chainId);

  const createSafeModuleExplorerUrl = createSafeModuleAddress
    ? `${createExplorerUrl}${createSafeModuleAddress}#code`
    : "#";

  // Determine if this is an enable or disable action
  const isEnableAction =
    mode === "create" || mode === "import" || mode === "enable";
  const isDisableAction = mode === "disable";

  // Get step state for import/enable/disable modes
  const getStepState = (step: StepId): "pending" | "current" | "completed" => {
    if (completedSteps.has(step)) {
      return "completed";
    }
    if (currentStep === step) {
      return "current";
    }
    return "pending";
  };

  // Step labels based on mode
  const getStepLabels = (): Record<StepId, string> => {
    if (mode === "import") {
      return {
        validate: "Validating Safe wallet requirements",
        sign: "Signing the enableModule message",
        execute: "Executing the enableModule transaction",
      };
    } else if (mode === "enable") {
      return {
        validate: "Validation",
        sign: "Signing the enableModule message",
        execute: "Executing the enableModule transaction",
      };
    } else if (mode === "disable") {
      return {
        validate: "Validation",
        sign: "Signing the disableModule message",
        execute: "Executing the disableModule transaction",
      };
    }
    // create mode doesn't use this
    return {
      validate: "Validation",
      sign: "Signing",
      execute: "Execution",
    };
  };

  const stepLabels = getStepLabels();

  // Step descriptions based on mode and current state
  const getStepDescriptions = (): Record<StepId, string> => {
    if (mode === "import") {
      return {
        validate: isValidating
          ? "Checking Safe wallet ownership and network compatibility."
          : "Ready",
        sign: isSigning
          ? "Sign the enableModule request message in your connected wallet to proceed."
          : isExecuting || isProposing || multisigInfo
            ? "Signature collected. Waiting for other signers to sign the enableModule transaction."
            : "Ready",
        execute: isExecuting
          ? "Executing the enableModule transaction in your connected wallet to activate the TriggerX module."
          : isProposing
            ? "Publishing the enableModule transaction to the Safe Transaction Service."
            : multisigInfo && multisigInfo.threshold > 1
              ? `Waiting for ${multisigInfo.threshold - 1} more signatures to complete the process.`
              : "Activating the TriggerX module on-chain.",
      };
    } else if (mode === "enable") {
      return {
        validate: "Ready",
        sign: isSigning
          ? "Sign the enableModule request message in your connected wallet."
          : "Ready",
        execute: isExecuting
          ? "Executing the enableModule transaction to activate the TriggerX module."
          : isProposing
            ? "Publishing the transaction to the Safe Transaction Service."
            : multisigInfo && multisigInfo.threshold > 1
              ? `Waiting for ${multisigInfo.threshold - 1} more signatures.`
              : "Activating the TriggerX module.",
      };
    } else if (mode === "disable") {
      return {
        validate: "Ready",
        sign: isSigning
          ? "Sign the disableModule request message in your connected wallet."
          : "Ready",
        execute: isExecuting
          ? "Executing the disableModule transaction to deactivate the TriggerX module."
          : isProposing
            ? "Publishing the transaction to the Safe Transaction Service."
            : multisigInfo && multisigInfo.threshold > 1
              ? `Waiting for ${multisigInfo.threshold - 1} more signatures.`
              : "Deactivating the TriggerX module.",
      };
    }
    return {
      validate: "Ready",
      sign: "Ready",
      execute: "Ready",
    };
  };

  const stepDescriptions = getStepDescriptions();

  // Render CREATE mode (SafeWalletCreationDialog style)
  if (mode === "create") {
    return (
      <div className="space-y-6">
        {/* Deploy Safe contract */}
        <Card className="flex items-start gap-2 p-4 sm:px-5">
          <div className="mt-0.5 shrink-0">
            <StatusIcon status={createStep} kind="create" />
          </div>
          <div className="min-w-0 text-left px-2">
            <Typography variant="body" align="left">
              Deploy Safe Contract
            </Typography>
            <Typography variant="caption" color="secondary" align="justify">
              This step creates your Safe Wallet. You&apos;ll need to confirm a
              transaction in your connected wallet.
            </Typography>
            {createStep === "error" && createError && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <Typography variant="caption" color="error" align="left">
                  <Ban size={12} className="inline-block mr-1" /> {createError}
                </Typography>
                {onRetryCreate && (
                  <button
                    onClick={onRetryCreate}
                    className="text-[#F8FF7C] transition-colors cursor-pointer shrink-0"
                    title="Retry Deploy"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Sign module enable message */}
        <Card className="flex items-start gap-2 p-4 sm:px-5">
          <div className="mt-0.5 shrink-0">
            <StatusIcon status={signStep} kind="sign" />
          </div>
          <div className="min-w-0 text-left px-2">
            <Typography variant="body" align="left">
              Sign Message
            </Typography>
            <Typography variant="caption" color="secondary" align="left">
              Sign a simple, gasless authorization message to approve the{" "}
              <Link
                href={createSafeModuleExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C07AF6] underline inline-flex items-center gap-1 transition-colors"
              >
                TriggerX module
                <ExternalLink size={12} className="inline-block" />
              </Link>
            </Typography>
            {signStep === "error" && signError && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <Typography variant="caption" color="error" align="left">
                  <Ban size={12} className="inline-block mr-1" /> {signError}
                </Typography>
                {onRetrySign && (
                  <button
                    onClick={onRetrySign}
                    className="text-[#F8FF7C] transition-colors cursor-pointer shrink-0"
                    title="Retry Sign"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Enable module */}
        <Card className="flex items-start gap-2 p-4 sm:px-5">
          <div className="mt-0.5 shrink-0">
            <StatusIcon status={executeStep} kind="enable" />
          </div>
          <div className="min-w-0 text-left px-2">
            <Typography variant="body" align="left">
              Enable Module
            </Typography>
            <Typography variant="caption" color="secondary" align="justify">
              Execute the transaction to activate the module. You&apos;ll need
              to confirm the transaction in your connected wallet.
            </Typography>
            {executeStep === "error" && executeError && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <Typography variant="caption" color="error" align="left">
                  <Ban size={12} className="inline-block mr-1" /> {executeError}
                </Typography>
                {onRetryExecute && (
                  <button
                    onClick={onRetryExecute}
                    className="text-[#F8FF7C] transition-colors cursor-pointer shrink-0"
                    title="Retry Enable"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Render IMPORT mode (compact style)
  if (mode === "import") {
    const visibleSteps: StepId[] = ["validate", "sign", "execute"];

    return (
      <div className="space-y-4">
        {visibleSteps.map((step) => {
          const state = getStepState(step);
          const isCurrent = state === "current";

          return (
            <div
              key={step}
              className="bg-white/5 border border-white/10 rounded-lg transition-all"
            >
              {/* Step Header */}
              <div className="flex items-start gap-2 p-3">
                <div className="mt-0.5 shrink-0">
                  <StepIcon step={step} state={state} />
                </div>

                <div className="flex-1 min-w-0 text-left px-2">
                  <Typography variant="body" align="justify">
                    {stepLabels[step]}
                  </Typography>

                  {(isCurrent || step === "execute") && (
                    <Typography
                      variant="caption"
                      color="secondary"
                      align="justify"
                    >
                      {stepDescriptions[step]}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Multisig Details - Only for execute step */}
              {step === "execute" &&
                multisigInfo &&
                multisigInfo.threshold > 1 &&
                currentStep === "execute" && (
                  <div className="border-t border-white/10 mt-2 pt-4 pb-4 px-4 sm:px-5">
                    <div className="space-y-4">
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

                      {moduleStatus !== null && (
                        <div className="pt-2">
                          <Typography
                            variant="caption"
                            color={
                              moduleStatus === true ? "success" : "secondary"
                            }
                            align="left"
                            className="flex items-center gap-1"
                          >
                            {moduleStatus === true ? (
                              <>
                                <CheckCircle2
                                  size={12}
                                  className="inline-block"
                                />
                                Module is now enabled!
                              </>
                            ) : (
                              <>
                                <Clock size={12} className="inline-block" />
                                Module not yet enabled. Waiting for approvals...
                              </>
                            )}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    );
  }

  // Render ENABLE/DISABLE modes (Card style - same as create flow)
  return (
    <div className="space-y-6">
      {/* Sign message step */}
      <Card className="flex items-start gap-2 p-4 sm:px-5">
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={signStep} kind="sign" />
        </div>
        <div className="min-w-0 text-left px-2">
          <Typography variant="body" align="left">
            Sign Message
          </Typography>
          <Typography variant="caption" color="secondary" align="left">
            Sign a simple, gasless authorization message to{" "}
            {isEnableAction ? "approve" : "remove"} the{" "}
            <Link
              href={createSafeModuleExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C07AF6] underline inline-flex items-center gap-1 transition-colors"
            >
              TriggerX module
              <ExternalLink size={12} className="inline-block" />
            </Link>
          </Typography>
          {signStep === "error" && signError && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <Typography variant="caption" color="error" align="left">
                <Ban size={12} className="inline-block mr-1" /> {signError}
              </Typography>
              {onRetrySign && (
                <button
                  onClick={onRetrySign}
                  className="text-[#F8FF7C] transition-colors cursor-pointer shrink-0"
                  title="Retry Sign"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Enable/Disable module step */}
      <Card className="flex items-start gap-2 p-4 sm:px-5">
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={executeStep} kind="enable" />
        </div>
        <div className="min-w-0 text-left px-2 flex-1">
          <Typography variant="body" align="left">
            {isEnableAction ? "Enable" : "Disable"} Module
          </Typography>
          <Typography variant="caption" color="secondary" align="justify">
            Execute the transaction to{" "}
            {isEnableAction ? "activate" : "deactivate"} the module. You&apos;ll
            need to confirm the transaction in your connected wallet.
          </Typography>
          {executeStep === "error" && executeError && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <Typography variant="caption" color="error" align="left">
                <Ban size={12} className="inline-block mr-1" /> {executeError}
              </Typography>
              {onRetryExecute && (
                <button
                  onClick={onRetryExecute}
                  className="text-[#F8FF7C] transition-colors cursor-pointer shrink-0"
                  title="Retry Execute"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          )}

          {/* Multisig Details - Only for execute step when multisig */}
          {executeStep === "success" &&
            multisigInfo &&
            multisigInfo.threshold > 1 && (
              <div className="border-t border-white/10 mt-2 pt-4 pb-4">
                <div className="space-y-4">
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
                        title={
                          isEnableAction
                            ? "Check if module has been enabled"
                            : "Check if module has been disabled"
                        }
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
                        <ExternalLink size={16} className="inline-block mb-1" />
                      </Link>
                    </Typography>
                  )}

                  {moduleStatus !== null && (
                    <div className="pt-2">
                      <Typography
                        variant="caption"
                        color={
                          (isEnableAction && moduleStatus === true) ||
                          (isDisableAction && moduleStatus === false)
                            ? "success"
                            : "secondary"
                        }
                        align="left"
                        className="flex items-center gap-1"
                      >
                        {(isEnableAction && moduleStatus === true) ||
                        (isDisableAction && moduleStatus === false) ? (
                          <>
                            <CheckCircle2 size={12} className="inline-block" />
                            {isEnableAction
                              ? "Module is now enabled!"
                              : "Module is now disabled!"}
                          </>
                        ) : (
                          <>
                            <Clock size={12} className="inline-block" />
                            {isEnableAction
                              ? "Module not yet enabled. Waiting for approvals..."
                              : "Module not yet disabled. Waiting for approvals..."}
                          </>
                        )}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </Card>
    </div>
  );
};

export default SafeModuleFlowSteps;
