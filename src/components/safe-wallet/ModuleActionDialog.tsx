"use client";

import React, { useState, useEffect, useRef } from "react";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/Dailog";
import type { SafeCreationStepStatus, MultisigInfo } from "@/types/safe";
import Link from "next/link";
import { useSafeModuleStatus } from "@/hooks/useSafeModuleStatus";
import { SafeModuleFlowSteps } from "@/components/safe-wallet/SafeModuleFlowSteps";

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
  const [showConfirmation, setShowConfirmation] = useState(true);

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

  // Handle internal manual refresh
  const handleInternalRefresh = async () => {
    if (!selectedSafe || !onManualRefresh) return;

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
          <SafeModuleFlowSteps
            mode={action}
            signStep={signStep}
            executeStep={executeStep}
            signError={signError}
            executeError={executeError}
            onRetrySign={onRetrySign}
            onRetryExecute={onRetryExecute}
            multisigInfo={multisigInfo || undefined}
            moduleStatus={moduleStatus}
            isCheckingModuleStatus={isCheckingModuleStatus}
            onManualRefresh={handleInternalRefresh}
          />

          <Typography variant="caption" color="gray" align="left">
            <Lightbulb size={16} className="inline-block mr-2 text-[#F8FF7C]" />
            Refer to the{" "}
            <Link
              href="https://triggerx.gitbook.io/triggerx-docs/create-your-first-job/triggerx-safe-automation-wallet"
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
