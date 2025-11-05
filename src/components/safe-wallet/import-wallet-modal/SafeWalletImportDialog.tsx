"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { addExtraSafe } from "@/utils/safeWalletLocal";
import { validateSafeWallet } from "@/utils/validateSafeWallet";
import { ethers } from "ethers";
import {
  useSafeModuleStatus,
  clearModuleStatusCache,
} from "@/hooks/useSafeModuleStatus";
import toast from "react-hot-toast";
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
import { ImportWalletStatus } from "@/components/safe-wallet/import-wallet-modal/ImportWalletStatus";
import type {
  StepId,
  MultisigInfo,
  SafeWalletImportDialogProps,
} from "@/types/safe";

const STEP_ORDER: StepId[] = ["validate", "sign", "execute"];

export const SafeWalletImportDialog: React.FC<SafeWalletImportDialogProps> = ({
  open,
  onClose,
  onImported,
  onHasOngoingProcessChange,
}) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const {
    signEnableModule,
    submitEnableModule,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
  } = useCreateSafeWallet();

  const [existingSafeAddress, setExistingSafeAddress] = useState("");
  const [addExistingError, setAddExistingError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [multisigInfo, setMultisigInfo] = useState<MultisigInfo | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [hasOngoingProcess, setHasOngoingProcess] = useState(false);

  // Ref to track if we've already processed module completion
  const completionProcessedRef = useRef(false);

  // Use hook to check module status for multisig Safe
  const [moduleStatus, refreshModuleStatus, isCheckingModuleStatus] =
    useSafeModuleStatus(multisigInfo?.safeAddress);

  // Notify parent about ongoing process changes
  useEffect(() => {
    if (onHasOngoingProcessChange) {
      onHasOngoingProcessChange(hasOngoingProcess);
    }
  }, [hasOngoingProcess, onHasOngoingProcessChange]);

  // Helper: Check if error is a user rejection
  const isUserRejection = (errorMessage: string): boolean => {
    const msg = errorMessage.toLowerCase();
    return msg.includes("rejected") || msg.includes("denied");
  };

  // Helper: Reset all state to initial values
  const resetAllState = useCallback(() => {
    setExistingSafeAddress("");
    setAddExistingError("");
    setIsValidating(false);
    setMultisigInfo(null);
    setCurrentStep(null);
    setCompletedSteps(new Set());
    setHasOngoingProcess(false);
    completionProcessedRef.current = false; // Reset completion flag
  }, []);

  // Helper: Reset and close the dialog
  const resetAndClose = useCallback(() => {
    resetAllState();
    onClose();
  }, [resetAllState, onClose]);

  const handleClose = useCallback(() => {
    // Only reset state if there's no ongoing process
    // If there's an ongoing process, keep the state so it can be restored when reopened
    if (!hasOngoingProcess) {
      resetAllState();
    }

    // Always allow closing the dialog
    onClose();
  }, [hasOngoingProcess, onClose, resetAllState]);

  // Watch for module status becoming enabled (for multisig scenarios)
  useEffect(() => {
    if (
      moduleStatus === true &&
      multisigInfo?.safeAddress &&
      hasOngoingProcess &&
      !completionProcessedRef.current // Guard against duplicate processing
    ) {
      // Mark as processed immediately
      completionProcessedRef.current = true;

      const safeAddr = multisigInfo.safeAddress;

      // Persist to localStorage
      addExtraSafe(chainId, safeAddr);

      // Notify parent
      if (onImported) {
        onImported(safeAddr, true);
      }

      // Mark as complete and reset
      setCompletedSteps(new Set(STEP_ORDER));
      setCurrentStep(null);

      // Close modal first, then show success toast
      setTimeout(() => {
        resetAndClose();
        // Show toast after modal closes
        setTimeout(() => {
          toast.success("TriggerX module enabled successfully!");
        }, 300);
      }, 1500);
    }
  }, [
    moduleStatus,
    multisigInfo?.safeAddress,
    hasOngoingProcess,
    chainId,
    onImported,
    resetAndClose,
  ]);

  // Handle manual refresh of the module status for multisig Safe.
  const handleManualRefresh = async () => {
    if (!multisigInfo?.safeAddress) return;

    try {
      // Clear cache to force fresh blockchain check
      clearModuleStatusCache(multisigInfo.safeAddress, chainId);

      // Use hook's refresh function to check module status
      await refreshModuleStatus();
    } catch (error) {
      console.error("Error checking module status:", error);
      toast.error("Failed to check module status");
    }
  };

  /**
   * @description
   * Handles the submission of the import safe wallet process with robust error handling.
   * @note Uses two-step flow: signEnableModule then submitEnableModule for granular error handling.
   * @note Auto-closes on user rejection; shows inline error for other failures.
   * @note Preserves multisig progress across dialog close/reopen.
   */
  const handleSubmitImport = async () => {
    if (!existingSafeAddress.trim()) {
      setAddExistingError("Please enter a Safe address");
      return;
    }

    setIsValidating(true);
    setAddExistingError("");
    setCurrentStep("validate");
    setHasOngoingProcess(true);

    try {
      // Step 1: Validate Safe wallet
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please connect your wallet");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      const validationResult = await validateSafeWallet(
        existingSafeAddress,
        provider,
        address,
      );

      if (!validationResult.success) {
        throw new Error(validationResult.error || "Validation failed");
      }

      const { safeAddress: safeAddr } = validationResult;

      // Validation complete
      setCompletedSteps(new Set(["validate"]));
      setIsValidating(false);
      setCurrentStep("sign");

      // Step 2: Sign enable module transaction
      const signResult = await signEnableModule(safeAddr);

      if (!signResult.success) {
        const errorMsg = signResult.error || "Failed to sign transaction";

        // Check if user rejected the signature
        if (isUserRejection(errorMsg)) {
          console.log("User rejected signature, closing dialog");
          resetAndClose();
          // Show error toast after modal closes
          setTimeout(() => {
            toast.error("Sign message rejected by user");
          }, 300);
          return;
        }

        // Non-rejection error: show inline and allow retry
        throw new Error(errorMsg);
      }

      // Check if module was already enabled (empty safeTxHash)
      if (signResult.data && !signResult.data.safeTxHash) {
        // Module already enabled
        addExtraSafe(chainId, safeAddr);
        setCompletedSteps(new Set(STEP_ORDER));
        setCurrentStep(null);
        setHasOngoingProcess(false);

        if (onImported) {
          onImported(safeAddr, true);
        }

        // Close modal first, then show success toast
        setTimeout(() => {
          resetAndClose();
          setTimeout(() => {
            toast.success("Safe wallet imported successfully!");
          }, 300);
        }, 1500);
        return;
      }

      // Sign complete
      setCompletedSteps(new Set(["validate", "sign"]));
      setCurrentStep("execute");

      // Step 3: Submit (execute or propose) the transaction
      const submitResult = await submitEnableModule();

      if (!submitResult.success) {
        const errorMsg = submitResult.error || "Failed to submit transaction";

        // Check if user rejected the transaction
        if (isUserRejection(errorMsg)) {
          console.log("User rejected transaction, closing dialog");
          resetAndClose();
          // Show error toast after modal closes
          setTimeout(() => {
            toast.error("Transaction rejected by user");
          }, 300);
          return;
        }

        // Non-rejection error: show inline and allow retry
        throw new Error(errorMsg);
      }

      // Persist to localStorage
      addExtraSafe(chainId, safeAddr);

      if (submitResult.data?.status === "executed") {
        // Single-sig: module enabled immediately
        setCompletedSteps(new Set(STEP_ORDER));
        setCurrentStep(null);
        setHasOngoingProcess(false);

        if (onImported) {
          onImported(safeAddr, true);
        }

        // Close modal first, then show success toast
        setTimeout(() => {
          resetAndClose();
          setTimeout(() => {
            toast.success("Safe wallet imported successfully!");
          }, 300);
        }, 1500);
      } else if (submitResult.data?.status === "multisig") {
        // Multisig: keep dialog state, allow close/reopen
        setMultisigInfo({
          safeAddress: safeAddr,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners,
        });
        setCompletedSteps(new Set(["validate", "sign"]));
        setCurrentStep("execute");
        setHasOngoingProcess(true);
      }
    } catch (err) {
      console.error("Import Safe failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to import Safe";

      // Show inline error and reset progress UI (but keep address input)
      setAddExistingError(msg);
      setCurrentStep(null);
      setCompletedSteps(new Set());
      setHasOngoingProcess(false);
      setMultisigInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Determine if the status should be shown based on the current state.
  const shouldShowStatus =
    isValidating ||
    isSigningEnableModule ||
    isExecutingEnableModule ||
    isProposingEnableModule ||
    Boolean(multisigInfo);

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
          {addExistingError && (
            <Typography variant="caption" color="error" align="left">
              <AlertCircle
                size={16}
                className="inline-block mr-2 text-red-500"
              />
              {addExistingError}
            </Typography>
          )}

          {/* Requirements - Hide when import process starts */}
          {!shouldShowStatus && <ImportWalletRequirements />}

          {/* Status Display */}
          {shouldShowStatus && (
            <ImportWalletStatus
              currentStep={currentStep}
              completedSteps={completedSteps}
              isValidating={isValidating}
              isEnablingModule={false}
              isSigningEnableModule={isSigningEnableModule}
              isExecutingEnableModule={isExecutingEnableModule}
              isProposingEnableModule={isProposingEnableModule}
              multisigInfo={multisigInfo}
              isCheckingModuleStatus={isCheckingModuleStatus}
              onManualRefresh={handleManualRefresh}
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

export default SafeWalletImportDialog;
