"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DropdownOption } from "@/components/ui/Dropdown";
import { InputField } from "@/components/ui/InputField";
import Skeleton from "@/components/ui/Skeleton";
import { useAccount, useChainId } from "wagmi";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import {
  getWalletDisplayName,
  saveChainWalletName,
} from "@/utils/safeWalletNames";
import {
  Save,
  ChevronDown,
  ChevronUp,
  Edit,
  CheckCircle2,
  Import,
} from "lucide-react";
import { SafeWalletCopyButton } from "@/components/ui/CopyButton";
import SafeCreationProgressModal from "@/components/safe-wallet/SafeWalletCreationDialog";
import SafeWalletImportDialog from "@/components/safe-wallet/import-wallet-modal/SafeWalletImportDialog";
import ModuleActionDialog from "@/components/safe-wallet/ModuleActionDialog";
import type { SafeCreationStepStatus } from "@/types/safe";
import {
  useSafeModuleStatus,
  clearModuleStatusCache,
} from "@/hooks/useSafeModuleStatus";
import { getSafeWebAppUrl } from "@/utils/safeChains";
interface SafeWalletSidebarProps {
  selectedSafe: string | null;
  onSafeSelect: (safe: string | null) => void;
}

const SafeWalletSidebar: React.FC<SafeWalletSidebarProps> = ({
  selectedSafe,
  onSafeSelect,
}) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { safeWallets, isLoading, error, refetch } = useSafeWallets();
  const {
    createSafeWallet,
    signEnableModule,
    submitEnableModule,
    signDisableModule,
    submitDisableModule,
    isCreating,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
    isSigningDisableModule,
    isExecutingDisableModule,
    isProposingDisableModule,
  } = useCreateSafeWallet();
  const [editingName, setEditingName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showList, setShowList] = useState(false);
  const [moduleEnabled, refreshModuleStatus, checkingModule] =
    useSafeModuleStatus(selectedSafe || undefined);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [createStep, setCreateStep] = useState<SafeCreationStepStatus>("idle");
  const [signStep, setSignStep] = useState<SafeCreationStepStatus>("idle");
  const [enableStep, setEnableStep] = useState<SafeCreationStepStatus>("idle");
  const [createError, setCreateError] = useState<string | undefined>(undefined);
  const [signError, setSignError] = useState<string | undefined>(undefined);
  const [enableError, setEnableError] = useState<string | undefined>(undefined);
  const [currentSafeAddress, setCurrentSafeAddress] = useState<string | null>(
    null,
  );
  const [hasImportOngoingProcess, setHasImportOngoingProcess] = useState(false);

  // Module action dialog states
  const [showModuleActionDialog, setShowModuleActionDialog] = useState(false);
  const [moduleAction, setModuleAction] = useState<"enable" | "disable">(
    "enable",
  );
  const [moduleSignStep, setModuleSignStep] =
    useState<SafeCreationStepStatus>("idle");
  const [moduleExecuteStep, setModuleExecuteStep] =
    useState<SafeCreationStepStatus>("idle");
  const [moduleSignError, setModuleSignError] = useState<string | undefined>(
    undefined,
  );
  const [moduleExecuteError, setModuleExecuteError] = useState<
    string | undefined
  >(undefined);
  const [moduleMultisigInfo, setModuleMultisigInfo] = useState<{
    safeAddress: string;
    threshold: number;
    safeTxHash: string;
    queueUrl: string | null;
    fallbackUrl: string | null;
    owners: string[];
  } | null>(null);
  const [isCheckingModuleStatus, setIsCheckingModuleStatus] = useState(false);
  const [hasOngoingModuleProcess, setHasOngoingModuleProcess] = useState(false);

  // Ref to track if we've already processed module completion
  const moduleCompletionProcessedRef = useRef(false);

  // Clear selection when chain switches
  useEffect(() => {
    onSafeSelect(null);
  }, [chainId, onSafeSelect]);

  // Dropdown options for the safe wallets
  const dropdownOptions: DropdownOption[] = [
    ...safeWallets.map((w) => ({
      id: w,
      name: getWalletDisplayName(w, chainId, safeWallets),
    })),
  ];

  // Selected option for the safe wallet
  const selectedOption = selectedSafe
    ? getWalletDisplayName(selectedSafe, chainId, safeWallets)
    : "Select a wallet";

  // Handle select of a safe wallet from the dropdown
  const handleSelect = async (opt: DropdownOption) => {
    const addr = String(opt.id);
    onSafeSelect(addr);
    // Refresh the module status
    refreshModuleStatus();
  };

  // Create new Safe wallet
  const handleCreateNewSafe = async () => {
    if (!address) return;
    // Show the create flow
    setShowCreateFlow(true);
    setCreateStep("pending");
    setSignStep("idle");
    setEnableStep("idle");
    setCreateError(undefined);
    setSignError(undefined);
    setEnableError(undefined);
    setCurrentSafeAddress(null);

    // Step 1: Create Safe wallet
    const createResult = await createSafeWallet(address);

    // If the creation fails, set the error and return
    if (!createResult.success || !createResult.safeAddress) {
      setCreateStep("error");
      setCreateError(createResult.error || "Failed to create Safe wallet");
      return;
    }

    // Set the current safe address
    const newSafe = createResult.safeAddress;
    setCurrentSafeAddress(newSafe);
    setCreateStep("success");

    // Continue to sign step
    await handleSignStep(newSafe);
  };

  // Handle sign step - can be called independently for retry
  const handleSignStep = async (safeAddress: string) => {
    setSignStep("pending");
    setSignError(undefined);

    // Step 2: Sign enable module transaction
    const signResult = await signEnableModule(safeAddress);

    // If the signing fails, set the error and return
    if (!signResult.success) {
      setSignStep("error");
      setSignError(signResult.error || "Failed to sign transaction");
      // Still try to select the wallet even if module enabling fails
      setTimeout(async () => {
        await refetch();
        onSafeSelect(safeAddress);
      }, 3000);
      return;
    }

    setSignStep("success");

    // Continue to enable step
    await handleEnableStep(safeAddress);
  };

  // Handle enable step - can be called independently for retry
  const handleEnableStep = async (safeAddress: string) => {
    setEnableStep("pending");
    setEnableError(undefined);

    // Step 3: Submit (execute or propose) the transaction
    const submitResult = await submitEnableModule();

    // If the submission fails, set the error and return
    if (!submitResult.success) {
      setEnableStep("error");
      setEnableError(submitResult.error || "Failed to submit transaction");
    } else {
      // If the submission succeeds, set the success step
      setEnableStep("success");
      if (submitResult.data?.status === "executed") {
        // Clear cache and let refresh fetch fresh from blockchain
        clearModuleStatusCache(safeAddress, chainId);
      } else if (submitResult.data?.status === "multisig") {
        // For multisig, module is not enabled yet - will be enabled when approved or on manual refresh
      }

      // Auto-close dialog after successful completion of all steps
      setTimeout(() => {
        setShowCreateFlow(false);
      }, 2000);
    }

    // Wait for blockchain state to update, then select wallet and refresh module status
    setTimeout(async () => {
      // First select the safe wallet
      onSafeSelect(safeAddress);

      // Refetch the safe wallets list
      await refetch();

      // Wait a bit more for the selection to take effect, then force refresh module status from blockchain
      setTimeout(async () => {
        // Clear cache again to ensure fresh check (to show as enabled)
        clearModuleStatusCache(safeAddress, chainId);
        await refreshModuleStatus();
      }, 500);
    }, 3000);
  };

  // Retry handlers for create safe wallet
  const handleRetryCreate = async () => {
    if (!address) return;
    setCreateStep("pending");
    setCreateError(undefined);

    const createResult = await createSafeWallet(address);
    if (!createResult.success || !createResult.safeAddress) {
      setCreateStep("error");
      setCreateError(createResult.error || "Failed to create Safe wallet");
      return;
    }

    const newSafe = createResult.safeAddress;
    setCurrentSafeAddress(newSafe);
    setCreateStep("success");

    // Continue to sign step
    await handleSignStep(newSafe);
  };

  // Retry handler for sign step
  const handleRetrySign = async () => {
    if (!currentSafeAddress) return;
    await handleSignStep(currentSafeAddress);
  };

  // Retry handler for enable step
  const handleRetryEnable = async () => {
    if (!currentSafeAddress) return;
    await handleEnableStep(currentSafeAddress);
  };

  const handleImportedSafe = async (
    safeAddress: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _moduleActive: boolean,
  ) => {
    // Select the imported safe
    onSafeSelect(safeAddress);

    // Refetch the safe wallets list
    await refetch();

    // Refresh module status - clear cache to fetch fresh from blockchain
    setTimeout(async () => {
      clearModuleStatusCache(safeAddress, chainId);
      await refreshModuleStatus();
    }, 500);
  };

  // Helper: Reset all module action state
  const resetModuleActionState = useCallback(() => {
    setModuleSignStep("idle");
    setModuleExecuteStep("idle");
    setModuleSignError(undefined);
    setModuleExecuteError(undefined);
    setModuleMultisigInfo(null);
    setHasOngoingModuleProcess(false);
    moduleCompletionProcessedRef.current = false;
  }, []);

  // Show enable module dialog
  const handleShowEnableDialog = () => {
    setModuleAction("enable");
    setShowModuleActionDialog(true);
    resetModuleActionState();
  };

  // Execute enable module
  const handleEnableModule = async () => {
    if (!selectedSafe) return;

    // Reset states and start process
    setModuleSignStep("pending");
    setModuleExecuteStep("idle");
    setModuleSignError(undefined);
    setModuleExecuteError(undefined);
    setHasOngoingModuleProcess(true);

    try {
      // Step 1: Sign enable module transaction
      const signResult = await signEnableModule(selectedSafe);
      if (!signResult.success) {
        setModuleSignStep("error");
        setModuleSignError(signResult.error || "Failed to sign transaction");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleSignStep("success");

      // Check if module was already enabled (empty safeTxHash)
      if (signResult.data && !signResult.data.safeTxHash) {
        // Module already enabled - clear cache and let refresh fetch from blockchain
        clearModuleStatusCache(selectedSafe, chainId);
        setModuleExecuteStep("success");
        setHasOngoingModuleProcess(false);

        // Refresh status and close
        setTimeout(async () => {
          await refreshModuleStatus();
          // Wait a bit more and refresh again to ensure UI updates
          setTimeout(async () => {
            clearModuleStatusCache(selectedSafe, chainId);
            await refreshModuleStatus();
            handleModuleActionDialogClose();
          }, 1000);
        }, 1000);
        return;
      }

      // Step 2: Submit enable module transaction
      setModuleExecuteStep("pending");
      const submitResult = await submitEnableModule();
      if (!submitResult.success) {
        setModuleExecuteStep("error");
        setModuleExecuteError(submitResult.error || "Failed to enable module");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleExecuteStep("success");

      // Check if it's multisig or executed
      if (submitResult.data?.status === "executed") {
        // Single-sig: module enabled immediately - clear cache and let refresh fetch from blockchain
        clearModuleStatusCache(selectedSafe, chainId);
        setHasOngoingModuleProcess(false);

        // Immediate refresh attempt
        await refreshModuleStatus();

        // Wait for blockchain to update, then refresh and close
        setTimeout(async () => {
          // First refresh after blockchain update
          clearModuleStatusCache(selectedSafe, chainId);
          await refreshModuleStatus();
          // Wait a bit more and refresh again to ensure UI updates
          setTimeout(async () => {
            clearModuleStatusCache(selectedSafe, chainId);
            await refreshModuleStatus();
            handleModuleActionDialogClose();
          }, 1000);
        }, 2000);
      } else if (submitResult.data?.status === "multisig") {
        // Multisig: keep dialog open and show waiting state
        setModuleMultisigInfo({
          safeAddress: selectedSafe,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners || [],
        });
        // Keep hasOngoingModuleProcess true for multisig
      }
    } catch (err) {
      setHasOngoingModuleProcess(false);
      throw err;
    }
  };

  // Show disable module dialog
  const handleShowDisableDialog = () => {
    setModuleAction("disable");
    setShowModuleActionDialog(true);
    resetModuleActionState();
  };

  // Execute disable module - called after user confirms in dialog
  const handleDisableModule = async () => {
    if (!selectedSafe) return;

    // Reset states and start process
    setModuleSignStep("pending");
    setModuleExecuteStep("idle");
    setModuleSignError(undefined);
    setModuleExecuteError(undefined);
    setHasOngoingModuleProcess(true);

    try {
      // Step 1: Sign disable module transaction
      const signResult = await signDisableModule(selectedSafe);
      if (!signResult.success) {
        setModuleSignStep("error");
        setModuleSignError(signResult.error || "Failed to sign transaction");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleSignStep("success");

      // Step 2: Submit disable module transaction
      setModuleExecuteStep("pending");
      const submitResult = await submitDisableModule();
      if (!submitResult.success) {
        setModuleExecuteStep("error");
        setModuleExecuteError(submitResult.error || "Failed to disable module");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleExecuteStep("success");

      // Check if it's multisig or executed
      if (submitResult.data?.status === "executed") {
        // Single-sig: module disabled immediately - clear cache and let refresh fetch from blockchain
        clearModuleStatusCache(selectedSafe, chainId);
        setHasOngoingModuleProcess(false);

        // Immediate refresh attempt
        await refreshModuleStatus();

        // Wait for blockchain to update, then refresh and close
        setTimeout(async () => {
          // First refresh after blockchain update
          clearModuleStatusCache(selectedSafe, chainId);
          await refreshModuleStatus();
          // Wait a bit more and refresh again to ensure UI updates
          setTimeout(async () => {
            clearModuleStatusCache(selectedSafe, chainId);
            await refreshModuleStatus();
            handleModuleActionDialogClose();
          }, 1000);
        }, 2000);
      } else if (submitResult.data?.status === "multisig") {
        // Multisig: keep dialog open and show waiting state
        setModuleMultisigInfo({
          safeAddress: selectedSafe,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners || [],
        });
        // Keep hasOngoingModuleProcess true for multisig
      }
    } catch (err) {
      setHasOngoingModuleProcess(false);
      throw err;
    }
  };

  // Retry handler for sign step - retries sign and continues to execute
  const handleRetryModuleSign = async () => {
    if (!selectedSafe) return;

    setModuleSignStep("pending");
    setModuleSignError(undefined);
    setHasOngoingModuleProcess(true);

    try {
      const signResult =
        moduleAction === "enable"
          ? await signEnableModule(selectedSafe)
          : await signDisableModule(selectedSafe);

      if (!signResult.success) {
        setModuleSignStep("error");
        setModuleSignError(signResult.error || "Failed to sign transaction");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleSignStep("success");

      // Check if module was already in desired state (for enable only)
      if (
        moduleAction === "enable" &&
        signResult.data &&
        !signResult.data.safeTxHash
      ) {
        clearModuleStatusCache(selectedSafe, chainId);
        setModuleExecuteStep("success");
        setHasOngoingModuleProcess(false);
        setTimeout(async () => {
          await refreshModuleStatus();
          handleModuleActionDialogClose();
        }, 1500);
        return;
      }

      // Continue to execute step
      setModuleExecuteStep("pending");
      const submitResult =
        moduleAction === "enable"
          ? await submitEnableModule()
          : await submitDisableModule();

      if (!submitResult.success) {
        setModuleExecuteStep("error");
        setModuleExecuteError(
          submitResult.error ||
            `Failed to ${moduleAction === "enable" ? "enable" : "disable"} module`,
        );
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        // Clear cache and let refresh fetch from blockchain
        clearModuleStatusCache(selectedSafe, chainId);
        setHasOngoingModuleProcess(false);
        setTimeout(async () => {
          // First refresh after blockchain update
          await refreshModuleStatus();
          // Wait a bit more and refresh again to ensure UI updates
          setTimeout(async () => {
            clearModuleStatusCache(selectedSafe, chainId);
            await refreshModuleStatus();
            handleModuleActionDialogClose();
          }, 1000);
        }, 2000);
      } else if (submitResult.data?.status === "multisig") {
        setModuleMultisigInfo({
          safeAddress: selectedSafe,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners || [],
        });
        // Keep hasOngoingModuleProcess true for multisig
      }
    } catch (err) {
      setHasOngoingModuleProcess(false);
      throw err;
    }
  };

  // Retry handler for execute step
  const handleRetryModuleExecute = async () => {
    if (!selectedSafe) return;

    setModuleExecuteStep("pending");
    setModuleExecuteError(undefined);
    setHasOngoingModuleProcess(true);

    try {
      const submitResult =
        moduleAction === "enable"
          ? await submitEnableModule()
          : await submitDisableModule();

      if (!submitResult.success) {
        setModuleExecuteStep("error");
        setModuleExecuteError(
          submitResult.error ||
            `Failed to ${moduleAction === "enable" ? "enable" : "disable"} module`,
        );
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        // Clear cache and let refresh fetch from blockchain
        clearModuleStatusCache(selectedSafe, chainId);
        setHasOngoingModuleProcess(false);
        setTimeout(async () => {
          // First refresh after blockchain update
          await refreshModuleStatus();
          // Wait a bit more and refresh again to ensure UI updates
          setTimeout(async () => {
            clearModuleStatusCache(selectedSafe, chainId);
            await refreshModuleStatus();
            handleModuleActionDialogClose();
          }, 1000);
        }, 2000);
      } else if (submitResult.data?.status === "multisig") {
        setModuleMultisigInfo({
          safeAddress: selectedSafe,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners || [],
        });
        // Keep hasOngoingModuleProcess true for multisig
      }
    } catch (err) {
      setHasOngoingModuleProcess(false);
      throw err;
    }
  };

  // Handle manual refresh of module status for multisig
  const handleManualModuleRefresh = useCallback(async () => {
    if (!selectedSafe) return;

    setIsCheckingModuleStatus(true);
    try {
      // Clear cache to force fresh blockchain check
      clearModuleStatusCache(selectedSafe, chainId);

      // Refresh module status
      await refreshModuleStatus();
    } finally {
      setIsCheckingModuleStatus(false);
    }
  }, [selectedSafe, chainId, refreshModuleStatus]);

  // Handle module action dialog close
  const handleModuleActionDialogClose = useCallback(() => {
    // Only reset state if there's no ongoing process
    if (!hasOngoingModuleProcess) {
      resetModuleActionState();
    }
    setShowModuleActionDialog(false);

    // Refresh module status when closing (if we have a selected safe)
    // Give it more time to ensure blockchain state is updated
    if (selectedSafe) {
      setTimeout(async () => {
        clearModuleStatusCache(selectedSafe, chainId);
        await refreshModuleStatus();
        // Refresh again after a short delay to ensure UI is updated
        setTimeout(async () => {
          clearModuleStatusCache(selectedSafe, chainId);
          await refreshModuleStatus();
        }, 1500);
      }, 1000);
    }
  }, [
    selectedSafe,
    chainId,
    hasOngoingModuleProcess,
    resetModuleActionState,
    refreshModuleStatus,
  ]);

  // Watch for module status completion (for multisig scenarios)
  useEffect(() => {
    if (
      !hasOngoingModuleProcess ||
      !moduleMultisigInfo?.safeAddress ||
      !selectedSafe ||
      moduleExecuteStep !== "success" ||
      moduleCompletionProcessedRef.current
    ) {
      return;
    }

    const isCompleted =
      (moduleAction === "enable" && moduleEnabled === true) ||
      (moduleAction === "disable" && moduleEnabled === false);

    if (isCompleted) {
      // Mark as processed immediately to prevent duplicate processing
      moduleCompletionProcessedRef.current = true;

      // Clear cache and let refresh fetch fresh from blockchain
      clearModuleStatusCache(selectedSafe, chainId);

      // Refresh status to update UI
      refreshModuleStatus();

      // Close dialog after a short delay
      setTimeout(() => {
        handleModuleActionDialogClose();
      }, 1500);
    }
  }, [
    hasOngoingModuleProcess,
    moduleMultisigInfo?.safeAddress,
    selectedSafe,
    moduleEnabled,
    moduleAction,
    moduleExecuteStep,
    chainId,
    handleModuleActionDialogClose,
    refreshModuleStatus,
  ]);

  // Handle open in safe app
  const handleOpenInSafeApp = async () => {
    if (!selectedSafe) return;
    const url = await getSafeWebAppUrl(chainId, selectedSafe);
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab-style header for alignment with main content tabs */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1 w-full">
          <Typography
            variant="body"
            color="white"
            align="center"
            className="px-4 py-2 rounded-lg text-xs sm:text-sm bg-white/10 w-full"
          >
            Safe Wallet Management
          </Typography>
        </div>
      </div>

      {/* Safe Wallet Selection */}
      <Card className="p-2 sm:p-4">
        {isLoading ? (
          <Skeleton height={50} borderRadius={12} />
        ) : (
          <>
            {/* Custom selector with inline edit and dropdown toggle */}
            <div className="mb-4">
              <div className="relative w-full bg-background border border-white/20 rounded-lg px-2 sm:px-3 py-2.5 flex items-center gap-2 sm:gap-3 overflow-hidden">
                {/* Not used defined button component as we have to show button like icon*/}
                {/* Left: edit/save button */}
                <div className="flex items-center gap-2">
                  {!isEditingName ? (
                    <button
                      onClick={() => {
                        if (!selectedSafe) return;
                        setIsEditingName(true);
                        setNameError("");
                        setEditingName(
                          selectedSafe
                            ? getWalletDisplayName(
                                selectedSafe,
                                chainId,
                                safeWallets,
                              )
                            : "",
                        );
                      }}
                      disabled={!selectedSafe}
                      aria-disabled={!selectedSafe}
                      className={
                        selectedSafe
                          ? "text-[#C07AF6] hover:text-white hover:bg-[#C07AF6]/20 rounded p-1.5 sm:p-2"
                          : "text-white/30 cursor-not-allowed rounded p-1.5 sm:p-2"
                      }
                      title={
                        selectedSafe
                          ? "Edit wallet name"
                          : "Select a wallet first"
                      }
                    >
                      <Edit size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!selectedSafe) return;
                        if (editingName.trim()) {
                          const result = saveChainWalletName(
                            chainId,
                            selectedSafe,
                            editingName.trim(),
                          );
                          if (result.ok) {
                            setIsEditingName(false);
                            setEditingName("");
                            setNameError("");
                            refetch();
                          } else {
                            setNameError(result.error);
                          }
                        }
                      }}
                      className="text-[#C07AF6] hover:text-white hover:bg-[#C07AF6]/20 rounded p-1.5 sm:p-2"
                      title="Save"
                    >
                      <Save size={16} />
                    </button>
                  )}
                </div>

                {/* Middle: identity */}
                <div className="flex-1 overflow-hidden">
                  {!isEditingName ? (
                    <div
                      className="flex flex-col cursor-pointer select-none"
                      onClick={() => setShowList((prev) => !prev)}
                      role="button"
                      aria-label="Open wallet list"
                    >
                      <Typography
                        variant="caption"
                        color="secondary"
                        align="left"
                      >
                        {selectedSafe ? (
                          <>
                            {`${selectedSafe.substring(0, 5)}...${selectedSafe.substring(selectedSafe.length - 5)}`}
                            {moduleEnabled === true ? (
                              <span className="inline-flex items-center text-[#C07AF6] px-1">
                                <CheckCircle2 size={10} />
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </Typography>
                      <Typography variant="body" align="left">
                        {selectedSafe
                          ? getWalletDisplayName(
                              selectedSafe,
                              chainId,
                              safeWallets,
                            )
                          : selectedOption}
                      </Typography>
                    </div>
                  ) : (
                    <div>
                      <InputField
                        label=""
                        placeholder="Wallet Nickname"
                        value={editingName}
                        onChange={setEditingName}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-0">
                  {/* Right: copy and arrow icon to toggle dropdown list */}
                  {selectedSafe && !isEditingName && (
                    <SafeWalletCopyButton text={selectedSafe} />
                  )}

                  {/* Toggle wallet list button */}
                  {/* Not used defined button component as we have to show button like icon*/}
                  <button
                    onClick={() => {
                      if (!isEditingName) setShowList((prev) => !prev);
                    }}
                    disabled={isEditingName}
                    aria-disabled={isEditingName}
                    className={`p-1.5 sm:p-2 rounded transition-colors ${
                      isEditingName
                        ? "text-white/30 cursor-not-allowed"
                        : "text-[#C07AF6] hover:text-white hover:bg-[#C07AF6]/20"
                    }`}
                    aria-label="Show wallet list"
                    title={
                      isEditingName
                        ? "Change wallet name first"
                        : "Show wallet list"
                    }
                  >
                    {showList ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
              </div>
              {nameError && (
                <Typography
                  variant="caption"
                  color="error"
                  align="left"
                  className="mt-1"
                >
                  {nameError}
                </Typography>
              )}
              {/* Dropdown list */}
              {/* Custom dropdown list with custom styles*/}
              {showList && (
                <div className="mt-2 text-sm text-white bg-background border border-white/20 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {dropdownOptions.length === 0 ? (
                    <div className="py-4 px-4">No wallets found</div>
                  ) : (
                    dropdownOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="py-4 px-4 hover:bg-gray-500/20 cursor-pointer"
                        onClick={() => {
                          handleSelect(opt);
                          setShowList(false);
                        }}
                      >
                        {opt.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Enable Module Button as inline link */}
            {/* Not used defined button component as we have to show button like inline link*/}
            {selectedSafe && !checkingModule && moduleEnabled === false && (
              <div className="mt-0.5 flex justify-end">
                <button
                  onClick={handleShowEnableDialog}
                  disabled={
                    isSigningEnableModule ||
                    isExecutingEnableModule ||
                    isProposingEnableModule
                  }
                  className={`text-xs text-[#C07AF6] underline underline-offset-4 ${
                    isSigningEnableModule ||
                    isExecutingEnableModule ||
                    isProposingEnableModule
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {isSigningEnableModule
                    ? "Signing..."
                    : isExecutingEnableModule || isProposingEnableModule
                      ? "Enabling..."
                      : "Enable TriggerX Module"}
                </button>
              </div>
            )}

            {/* Disable Module Button as inline link */}
            {/* Not used defined button component as we have to show button like inline link*/}
            {selectedSafe && !checkingModule && moduleEnabled === true && (
              <div className="mt-0.5 flex justify-end">
                <button
                  onClick={handleShowDisableDialog}
                  disabled={
                    isSigningDisableModule ||
                    isExecutingDisableModule ||
                    isProposingDisableModule
                  }
                  className={`text-xs text-red-300 underline underline-offset-4 ${
                    isSigningDisableModule ||
                    isExecutingDisableModule ||
                    isProposingDisableModule
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:text-red-300"
                  }`}
                >
                  {isSigningDisableModule
                    ? "Signing..."
                    : isExecutingDisableModule || isProposingDisableModule
                      ? "Disabling..."
                      : "Disable TriggerX Module"}
                </button>
              </div>
            )}

            {/* Error Message Display*/}
            {error && (
              <Typography variant="caption" color="error" align="left">
                {error}
              </Typography>
            )}

            {/* Separator */}
            <hr className="my-4 border-white/20" />

            {/* Create / Import actions - always visible */}
            <div className="space-y-3">
              <Button
                onClick={handleOpenInSafeApp}
                className="w-full"
                disabled={!selectedSafe}
              >
                Open in Safe App
              </Button>
              <Button
                onClick={handleCreateNewSafe}
                className="w-full"
                disabled={
                  isCreating ||
                  isSigningEnableModule ||
                  isExecutingEnableModule ||
                  isProposingEnableModule ||
                  isSigningDisableModule ||
                  isExecutingDisableModule ||
                  isProposingDisableModule
                }
              >
                {isCreating
                  ? "Creating Safe..."
                  : isSigningEnableModule || isSigningDisableModule
                    ? "Signing..."
                    : isExecutingEnableModule ||
                        isProposingEnableModule ||
                        isExecutingDisableModule ||
                        isProposingDisableModule
                      ? "Processing..."
                      : "Create New Safe Wallet"}
              </Button>

              {/* Import Safe Wallet Button and Progress Button */}
              <div className="relative flex items-center gap-2">
                {/* Import Safe Wallet Button */}
                <Button
                  onClick={() => setShowImportDialog(true)}
                  className="w-full"
                  disabled={
                    isCreating ||
                    isSigningEnableModule ||
                    isExecutingEnableModule ||
                    isProposingEnableModule ||
                    isSigningDisableModule ||
                    isExecutingDisableModule ||
                    isProposingDisableModule
                  }
                >
                  Import Safe Wallet
                </Button>

                {/* Show import wallet progress button when there is an ongoing process and the import dialog is not open */}
                {hasImportOngoingProcess && (
                  <button
                    onClick={() => setShowImportDialog(true)}
                    className="shrink-0 p-2 rounded-lg text-[#C07AF6] bg-[#F8FF7C] border border-white/20"
                    title="Click to view import wallet progress"
                  >
                    <Import size={24} className="animate-pulse" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Import Safe Dialog */}
      <SafeWalletImportDialog
        open={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
        }}
        onImported={handleImportedSafe}
        onHasOngoingProcessChange={setHasImportOngoingProcess}
      />

      {/* Safe Wallet Creation Progress Dialog */}
      <SafeCreationProgressModal
        open={showCreateFlow}
        onClose={() => setShowCreateFlow(false)}
        createStep={createStep}
        signStep={signStep}
        enableStep={enableStep}
        createError={createError}
        signError={signError}
        enableError={enableError}
        onRetryCreate={handleRetryCreate}
        onRetrySign={handleRetrySign}
        onRetryEnable={handleRetryEnable}
      />

      {/* Module Action Dialog (Enable/Disable) */}
      <ModuleActionDialog
        open={showModuleActionDialog}
        onClose={handleModuleActionDialogClose}
        action={moduleAction}
        onConfirmEnable={() => void handleEnableModule()}
        onConfirmDisable={() => void handleDisableModule()}
        signStep={moduleSignStep}
        executeStep={moduleExecuteStep}
        signError={moduleSignError}
        executeError={moduleExecuteError}
        onRetrySign={handleRetryModuleSign}
        onRetryExecute={handleRetryModuleExecute}
        multisigInfo={moduleMultisigInfo}
        selectedSafe={selectedSafe}
        onManualRefresh={handleManualModuleRefresh}
        isCheckingModuleStatus={isCheckingModuleStatus}
      />
    </div>
  );
};

export default SafeWalletSidebar;
