"use client";

import React, { useState, useEffect, useRef } from "react";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FilePen,
  BadgeCheck,
  RefreshCw,
  Ban,
  ExternalLink,
  Lightbulb,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/Dailog";
import type { SafeCreationStepStatus } from "@/types/safe";
import { useChainId } from "wagmi";
import {
  getSafeModuleAddress,
  getExplorerUrl,
} from "@/utils/contractAddresses";
import Link from "next/link";
import {
  useSafeModuleStatus,
  clearModuleStatusCache,
} from "@/hooks/useSafeModuleStatus";

interface MultisigInfo {
  safeAddress: string;
  threshold: number;
  safeTxHash: string;
  queueUrl: string | null;
  fallbackUrl: string | null;
  owners: string[];
}

interface ModuleActionDialogProps {
  open: boolean;
  onClose: () => void;
  action: "enable" | "disable";
  onConfirmEnable: () => void;
  onConfirmDisable: () => void;
  signStep: SafeCreationStepStatus;
  executeStep: SafeCreationStepStatus;
  signError?: string;
  executeError?: string;
  onRetrySign?: () => void;
  onRetryExecute?: () => void;
  multisigInfo?: MultisigInfo | null;
  selectedSafe?: string | null;
  onManualRefresh?: () => void;
  isCheckingModuleStatus?: boolean;
}

type StepKind = "sign" | "execute";

// StatusIcon component for displaying step status
const StatusIcon: React.FC<{
  status: SafeCreationStepStatus;
  kind: StepKind;
}> = ({ status, kind }) => {
  if (status === "pending")
    return <Loader2 className="animate-spin text-white/70" size={20} />;
  if (status === "success")
    return <CheckCircle2 className="text-green-400" size={20} />;
  const colorClass = status === "error" ? "text-red-600" : "text-white/70";
  if (kind === "sign") return <FilePen size={20} className={colorClass} />;
  if (kind === "execute")
    return <BadgeCheck size={20} className={colorClass} />;
  return null;
};

const ModuleActionDialog: React.FC<ModuleActionDialogProps> = ({
  open,
  onClose,
  action,
  onConfirmEnable,
  onConfirmDisable,
  signStep,
  executeStep,
  signError,
  executeError,
  onRetrySign,
  onRetryExecute,
  multisigInfo,
  selectedSafe,
  onManualRefresh,
  isCheckingModuleStatus = false,
}) => {
  const chainId = useChainId();
  const [showConfirmation, setShowConfirmation] = useState(true);
  const safeModuleAddress = getSafeModuleAddress(chainId);
  const explorerUrl = getExplorerUrl(chainId);

  const safeModuleExplorerUrl = safeModuleAddress
    ? `${explorerUrl}${safeModuleAddress}#code`
    : "#";

  const isDisableAction = action === "disable";
  const isEnableAction = action === "enable";
  const isMultisig = Boolean(multisigInfo);
  const isProcessing = signStep === "pending" || executeStep === "pending";

  // Use hook to check module status for the selected Safe (only when we have multisig info)
  const [moduleStatus, refreshModuleStatusInternal] = useSafeModuleStatus(
    isMultisig && selectedSafe ? selectedSafe : undefined,
  );

  // Ref to track if we've already triggered the action
  const actionTriggeredRef = useRef(false);

  // Handle internal manual refresh with proper cache clearing
  const handleInternalRefresh = async () => {
    if (!selectedSafe || !onManualRefresh) return;

    // Clear cache first to force fresh blockchain check
    clearModuleStatusCache(selectedSafe, chainId);

    // Call parent's refresh handler
    await onManualRefresh();

    // Also refresh internal status
    await refreshModuleStatusInternal();
  };

  // Reset state when dialog opens or action changes
  useEffect(() => {
    if (open) {
      // For enable, skip confirmation and go straight to progress
      // For disable, show confirmation first
      setShowConfirmation(isDisableAction);
      actionTriggeredRef.current = false;
    } else {
      // Reset state when dialog closes
      setShowConfirmation(true);
      actionTriggeredRef.current = false;
    }
  }, [open, isDisableAction, action]);

  // For enable action, trigger immediately when dialog opens (only once)
  useEffect(() => {
    if (open && isEnableAction && !actionTriggeredRef.current) {
      setShowConfirmation(false);
      actionTriggeredRef.current = true;
      onConfirmEnable();
    }
  }, [open, isEnableAction, onConfirmEnable]);

  // Handle confirmation and start process
  const handleConfirm = () => {
    setShowConfirmation(false);
    actionTriggeredRef.current = true;
    if (isDisableAction) {
      onConfirmDisable();
    } else {
      onConfirmEnable();
    }
  };

  // Show confirmation screen for disable action (only if not started and dialog is open)
  if (
    showConfirmation &&
    isDisableAction &&
    open &&
    !actionTriggeredRef.current
  ) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <div
          className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div className="flex-1">
              <Typography variant="h3" color="white" className="mb-2">
                Disable TriggerX Module?
              </Typography>
              <Typography variant="body" color="secondary" className="text-sm">
                This will prevent automated job execution for this Safe wallet.
                You can re-enable it anytime.
              </Typography>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 border-0"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Don't show progress dialog if we haven't started the process yet
  if (!actionTriggeredRef.current && isDisableAction) {
    return null;
  }

  // Show progress dialog for both enable and disable actions
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isProcessing) {
          onClose();
        }
      }}
    >
      <DialogContent
        onPointerDownOutside={(e) => {
          if (isProcessing) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isProcessing) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isProcessing) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEnableAction ? "Enable" : "Disable"} TriggerX Module
          </DialogTitle>
          <DialogDescription>
            Follow the steps below to {isEnableAction ? "enable" : "disable"}{" "}
            the TriggerX module for your Safe wallet.
          </DialogDescription>
        </DialogHeader>

        {/* Steps */}
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
                  href={safeModuleExplorerUrl}
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

          {/* Execute/Submit transaction step */}
          <Card className="flex items-start gap-2 p-4 sm:px-5">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={executeStep} kind="execute" />
            </div>
            <div className="min-w-0 text-left px-2">
              <Typography variant="body" align="left">
                {isEnableAction ? "Enable" : "Disable"} Module
              </Typography>
              <Typography variant="caption" color="secondary" align="justify">
                Execute the transaction to{" "}
                {isEnableAction ? "activate" : "deactivate"} the module.
                You&apos;ll need to confirm the transaction in your connected
                wallet.
              </Typography>
              {executeStep === "error" && executeError && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Typography variant="caption" color="error" align="left">
                    <Ban size={12} className="inline-block mr-1" />{" "}
                    {executeError}
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
            </div>
          </Card>

          {/* Multisig Waiting Step - Matches ImportWalletStatus style */}
          {isMultisig && multisigInfo && executeStep === "success" && (
            <Card className="flex items-start gap-2 p-4 sm:px-5">
              <div className="mt-0.5 shrink-0">
                <Clock className="text-yellow-400" size={20} />
              </div>
              <div className="min-w-0 text-left px-2 flex-1">
                <Typography variant="body" align="left">
                  Waiting for Approvals
                </Typography>
                <Typography variant="caption" color="secondary" align="left">
                  This Safe requires {multisigInfo.threshold} of{" "}
                  {multisigInfo.owners.length} signatures. The transaction has
                  been proposed and needs approval from other owners.
                </Typography>

                {/* Multisig Details Section - Matches ImportWalletStatus style */}
                <div className="mt-3 pt-3 border-t border-white/10">
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
                          onClick={handleInternalRefresh}
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

                    {/* Queue URL - Matches ImportWalletStatus style */}
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

                    {/* Module Status Result */}
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
                              <CheckCircle2
                                size={12}
                                className="inline-block"
                              />
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
              </div>
            </Card>
          )}

          <Typography variant="caption" color="gray" align="left">
            <Lightbulb size={16} className="inline-block mr-2 text-[#F8FF7C]" />
            Refer to the{" "}
            <Link
              href="https://triggerx.gitbook.io/triggerx-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C07AF6] underline inline-flex items-center gap-1 transition-colors"
            >
              documentation
            </Link>{" "}
            to learn more about the TriggerX Module.
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleActionDialog;
