"use client";

import React, { useState, useCallback } from "react";
import { useSafeModuleFlow } from "@/hooks/useSafeModuleFlow";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/Dailog";
import { Lightbulb, WalletMinimal, AlertCircle } from "lucide-react";
import Link from "next/link";
import { InputField } from "@/components/ui/InputField";
import { ImportWalletRequirements } from "@/components/safe-wallet/import-wallet-modal/ImportWalletRequirements";
import { SafeModuleFlowSteps } from "@/components/safe-wallet/SafeModuleFlowSteps";
import type { SafeWalletImportDialogProps } from "@/types/safe";

export const SafeWalletImportDialog: React.FC<SafeWalletImportDialogProps> = ({
  open,
  onClose,
  onImported,
  onHasOngoingProcessChange,
}) => {
  const [existingSafeAddress, setExistingSafeAddress] = useState("");

  // Use unified flow hook
  const flow = useSafeModuleFlow({
    mode: "import",
    onSuccess: (safeAddress, moduleEnabled) => {
      // Notify parent
      if (onImported) {
        onImported(safeAddress, moduleEnabled);
      }

      setTimeout(() => {
        flow.reset();
        setExistingSafeAddress("");
        onClose();
      }, 1500);
    },
    onHasOngoingProcessChange,
  });

  const handleClose = useCallback(() => {
    // Only reset state if there's no ongoing process
    if (!flow.hasOngoingProcess) {
      flow.reset();
      setExistingSafeAddress("");
    }

    // Always allow closing the dialog
    onClose();
  }, [flow, onClose]);

  // Handle submission
  const handleSubmitImport = async () => {
    if (!existingSafeAddress.trim()) {
      return;
    }

    try {
      await flow.start({ validationAddress: existingSafeAddress });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import Safe";

      // Check if user rejected
      if (
        msg.toLowerCase().includes("rejected") ||
        msg.toLowerCase().includes("denied")
      ) {
        flow.reset();
        setExistingSafeAddress("");
        onClose();
      }
    }
  };

  // Determine if the status should be shown
  const shouldShowStatus =
    flow.isValidating ||
    flow.isSigning ||
    flow.isExecuting ||
    flow.isProposing ||
    Boolean(flow.multisigInfo);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent>
        {/* Dialog Header */}
        <DialogHeader>
          <DialogTitle>Import an Existing Safe Wallet</DialogTitle>
          <DialogDescription>
            Enter the address of an existing Safe Wallet and follow the steps
            below to enable the TriggerX module.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Safe Address Input */}
          <div>
            <label className="block mb-2">
              <Typography variant="body" color="gray" align="left">
                Safe Wallet Address
              </Typography>
            </label>
            <div className="relative w-full">
              <InputField
                value={existingSafeAddress}
                onChange={(value) => setExistingSafeAddress(value)}
                placeholder="Enter Safe Wallet Address"
                type="text"
                readOnly={shouldShowStatus}
                className="rounded-xl w-full pr-12"
              />
              <WalletMinimal
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F8FF7C] pointer-events-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {flow.validationError && (
            <Typography variant="caption" color="error" align="left">
              <AlertCircle
                size={16}
                className="inline-block mr-2 text-red-500"
              />
              {flow.validationError}
            </Typography>
          )}

          {/* Requirements - Hide when import process starts */}
          {!shouldShowStatus && <ImportWalletRequirements />}

          {/* Status Display */}
          {shouldShowStatus && (
            <SafeModuleFlowSteps
              mode="import"
              currentStep={flow.currentStep}
              completedSteps={flow.completedSteps}
              isValidating={flow.isValidating}
              isSigning={flow.isSigning}
              isExecuting={flow.isExecuting}
              isProposing={flow.isProposing}
              multisigInfo={flow.multisigInfo}
              moduleStatus={flow.moduleStatus}
              isCheckingModuleStatus={flow.isCheckingModuleStatus}
              onManualRefresh={flow.refreshModuleStatus}
            />
          )}

          {/* Action Buttons - Only show when no process has started */}
          {!shouldShowStatus && (
            <div className="flex gap-3 pt-2">
              <Button
                color="purple"
                onClick={handleSubmitImport}
                disabled={!existingSafeAddress.trim()}
                className="flex-1"
              >
                Import Safe Wallet
              </Button>
            </div>
          )}

          {/* Documentation Link */}
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

export default SafeWalletImportDialog;
