"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { addExtraSafe } from "@/utils/safeWalletLocal";
import { validateSafeWallet } from "@/utils/validateSafeWallet";
import type { EnableModuleResult } from "@/types/safe";
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
    enableModule,
    isEnablingModule,
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

  // Use hook to check module status for multisig Safe
  const [moduleStatus, refreshModuleStatus, isCheckingModuleStatus] =
    useSafeModuleStatus(multisigInfo?.safeAddress);

  // Notify parent about ongoing process changes
  useEffect(() => {
    if (onHasOngoingProcessChange) {
      onHasOngoingProcessChange(hasOngoingProcess);
    }
  }, [hasOngoingProcess, onHasOngoingProcessChange]);

  const handleClose = useCallback(() => {
    // Only reset state if there's no ongoing process
    // If there's an ongoing process, keep the state so it can be restored when reopened
    if (!hasOngoingProcess) {
      // Reset all state
      setExistingSafeAddress("");
      setAddExistingError("");
      setIsValidating(false);
      setMultisigInfo(null);
      setCurrentStep(null);
      setCompletedSteps(new Set());
    }

    // Always allow closing the dialog
    onClose();
  }, [hasOngoingProcess, onClose]);

  // Watch for module status becoming enabled (for multisig scenarios)
  useEffect(() => {
    if (
      moduleStatus === true &&
      multisigInfo?.safeAddress &&
      hasOngoingProcess
    ) {
      // Module has been enabled!
      toast.success("Module enabled successfully!");
      setMultisigInfo(null);
      setCompletedSteps(new Set(STEP_ORDER));
      setCurrentStep(null);
      setHasOngoingProcess(false);

      // Persist to localStorage
      addExtraSafe(chainId, multisigInfo.safeAddress);

      // Notify parent
      if (onImported) {
        onImported(multisigInfo.safeAddress, true);
      }

      // Auto-close
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  }, [
    moduleStatus,
    multisigInfo?.safeAddress,
    hasOngoingProcess,
    chainId,
    onImported,
    handleClose,
  ]);

  // Apply the enable module result to the state.
  const applyEnableModuleResult = (
    result: EnableModuleResult | null,
    safeAddr: string,
  ): { moduleActive: boolean; status: EnableModuleResult["status"] | null } => {
    if (!result) {
      return { moduleActive: false, status: null };
    }

    if (result.status === "multisig") {
      setMultisigInfo({
        safeAddress: safeAddr,
        threshold: result.threshold,
        safeTxHash: result.safeTxHash,
        queueUrl: result.queueUrl,
        fallbackUrl: result.fallbackUrl,
        owners: result.owners,
      });
      setHasOngoingProcess(true);
      return { moduleActive: false, status: result.status };
    }

    setMultisigInfo(null);
    return { moduleActive: true, status: result.status };
  };

  // Handle manual refresh of the module status for multisig Safe.
  const handleManualRefresh = async () => {
    if (!multisigInfo?.safeAddress) return;

    try {
      // Clear cache to force fresh blockchain check
      clearModuleStatusCache(multisigInfo.safeAddress);

      // Use hook's refresh function to check module status
      await refreshModuleStatus();
    } catch (error) {
      console.error("Error checking module status:", error);
      toast.error("Failed to check status");
    }
  };

  /**
   * @description
   * Handles the submission of the import safe wallet process.
   * @note Validates the safe wallet address using the validateSafeWallet helper function.
   * @note Enables the module using the enableModule function.
   * @note Applies the enable module result using the applyEnableModuleResult function.
   * @note Persists the safe wallet address to localStorage using the addExtraSafe function.
   * @note Notifies the parent component using the onImported function.
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
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please connect your wallet");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Validate Safe wallet using helper function
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
      setCurrentStep("sign");

      // Enable module
      const enableResult = await enableModule(safeAddr);
      const { moduleActive } = applyEnableModuleResult(enableResult, safeAddr);

      if (enableResult) {
        // Persist to localStorage
        addExtraSafe(chainId, safeAddr);

        if (moduleActive) {
          // All steps complete
          setCompletedSteps(new Set(STEP_ORDER));
          setCurrentStep(null);
          setHasOngoingProcess(false);

          // Notify parent
          if (onImported) {
            onImported(safeAddr, true);
          }

          // Auto-close after success
          setTimeout(() => {
            handleClose();
          }, 2000);
        } else if (enableResult.status === "multisig") {
          // Multisig flow - keep dialog open with minimize option
          setCompletedSteps(new Set(["validate", "sign"]));
          setCurrentStep("execute");
        }
      }
    } catch (err) {
      console.error("Import Safe failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to import Safe";
      setAddExistingError(msg);
      setCurrentStep(null);
      setHasOngoingProcess(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Determine if the status should be shown based on the current state.
  const shouldShowStatus =
    isValidating ||
    isEnablingModule ||
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
          <div className="flex items-center gap-2">
            <WalletMinimal size={24} className=" mr-1 text-[#F8FF7C]" />
            <InputField
              value={existingSafeAddress}
              onChange={(value) => setExistingSafeAddress(value)}
              placeholder="Enter Safe Wallet Address"
              type="text"
              readOnly={shouldShowStatus}
            />
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
              isEnablingModule={isEnablingModule}
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
