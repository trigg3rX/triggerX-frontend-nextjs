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
import { useSafeModuleStatus } from "@/hooks/useSafeModuleStatus";
import { getSafeWebAppUrl } from "@/utils/safeChains";
import scrollbarStyles from "@/app/styles/scrollbar.module.css";
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
    // Refresh the module status after selection (wait a bit for state to update)
    setTimeout(async () => {
      await refreshModuleStatus();
    }, 100);
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
      // Module enabled - refresh will happen when dialog closes

      // Wait for blockchain state to update, then select wallet
      setTimeout(async () => {
        // First select the safe wallet
        onSafeSelect(safeAddress);

        // Refetch the safe wallets list
        await refetch();

        // Refresh module status immediately after selection (wait a bit for state to update)
        setTimeout(async () => {
          await refreshModuleStatus();
        }, 200);

        // Auto-close dialog after selecting wallet
        setTimeout(() => {
          setShowCreateFlow(false);
        }, 500);
      }, 2000);
    }
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

    // Refresh module status immediately after selection (wait a bit for state to update)
    setTimeout(async () => {
      await refreshModuleStatus();
    }, 200);
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
        // Module already enabled
        setModuleExecuteStep("success");
        setHasOngoingModuleProcess(false);

        // Close dialog - refresh will happen in handleModuleActionDialogClose
        setTimeout(() => {
          handleModuleActionDialogClose();
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
        // Single-sig: module enabled immediately
        setHasOngoingModuleProcess(false);

        // Wait for blockchain to update, then close (refresh will happen in close handler)
        setTimeout(() => {
          handleModuleActionDialogClose();
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
        // Single-sig: module disabled immediately
        setHasOngoingModuleProcess(false);

        // Wait for blockchain to update, then close (refresh will happen in close handler)
        setTimeout(() => {
          handleModuleActionDialogClose();
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
        setModuleExecuteStep("success");
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          handleModuleActionDialogClose();
        }, 1000);
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
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          handleModuleActionDialogClose();
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
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          handleModuleActionDialogClose();
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
      // Refresh module status
      await refreshModuleStatus();
    } finally {
      setIsCheckingModuleStatus(false);
    }
  }, [selectedSafe, refreshModuleStatus]);

  // Handle module action dialog close
  const handleModuleActionDialogClose = useCallback(() => {
    // Only reset state if there's no ongoing process
    if (!hasOngoingModuleProcess) {
      resetModuleActionState();
    }
    setShowModuleActionDialog(false);

    // Refresh module status when closing (if we have a selected safe)
    // Wait for blockchain state to update before refreshing
    if (selectedSafe) {
      setTimeout(async () => {
        await refreshModuleStatus();
      }, 1500);
    }
  }, [
    selectedSafe,
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

      // Close dialog after a short delay (refresh will happen in close handler)
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
    handleModuleActionDialogClose,
  ]);

  // Handle open in safe app
  const handleOpenInSafeApp = async () => {
    if (!selectedSafe) return;
    const url = await getSafeWebAppUrl(chainId, selectedSafe);
    console.log("safe url", url);
    if (url) {
      window.open(url, "_blank");
    }
  };

  // Check if the current chain is not supported by Safe App
  // OP Sepolia (11155420) and Arbitrum Sepolia (421614) are not supported
  const isSafeAppUnsupported = [11155420, 421614].includes(chainId);

  return (
    <div className="space-y-6 sm:space-y-8 xl:min-h-[500px]">
      {/* Safe Wallet Selection */}
      <Card>
        {isLoading ? (
          <Skeleton height={50} borderRadius={12} />
        ) : (
          <>
            {/* Custom selector with inline edit and dropdown toggle */}
            <div className="mb-4">
              <div
                className="relative w-full bg-[#1a1a1a] border border-white/10 rounded-md sm:rounded-lg px-4 py-2.5 sm:py-3 flex items-center gap-2 overflow-hidden cursor-pointer"
                onClick={() => {
                  if (!isEditingName) setShowList((prev) => !prev);
                }}
              >
                {/* Not used defined button component as we have to show button like icon*/}
                {/* Left: edit/save button */}
                <div className="flex items-center gap-2">
                  {!isEditingName ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                          ? "text-[#C07AF6] hover:text-white hover:bg-[#C07AF6]/20 rounded p-1.5 "
                          : "text-white/30 cursor-not-allowed rounded p-1.5"
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
                      onClick={(e) => {
                        e.stopPropagation();
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
                    <div className="flex flex-col select-none">
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <InputField
                        label=""
                        placeholder="Wallet Nickname"
                        value={editingName}
                        onChange={setEditingName}
                      />
                    </div>
                  )}
                </div>

                <div
                  className="flex items-center gap-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Right: copy and arrow icon to toggle dropdown list */}
                  {selectedSafe && !isEditingName && (
                    <SafeWalletCopyButton text={selectedSafe} />
                  )}

                  {/* Toggle wallet list button */}
                  {/* Not used defined button component as we have to show button like icon*/}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEditingName) setShowList((prev) => !prev);
                    }}
                    disabled={isEditingName}
                    aria-disabled={isEditingName}
                    className={`p-1.5 rounded transition-colors ${
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
                <div
                  className={`mt-2 text-xs xs:text-sm sm:text-base text-white bg-[#1a1a1a] border border-white/10 rounded-md sm:rounded-xl overflow-hidden shadow-lg max-h-52 overflow-y-auto ${scrollbarStyles.whiteScrollbar}`}
                >
                  {dropdownOptions.length === 0 ? (
                    <div className="py-2.5 sm:py-3 px-4">No wallets found</div>
                  ) : (
                    dropdownOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="py-2.5 sm:py-3 px-4 hover:bg-[#333] cursor-pointer rounded-md sm:rounded-lg text-xs xs:text-sm sm:text-base"
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
          </>
        )}
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
        <div className="space-y-4">
          <Button
            onClick={handleOpenInSafeApp}
            className="w-full"
            disabled={!selectedSafe || isSafeAppUnsupported}
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
                className="shrink-0 p-2 rounded-lg text-[#222222] bg-[#F8FF7C] border border-[#222222]"
                title="Click to view import wallet progress"
              >
                <Import
                  size={24}
                  className="animate-[bounce_2s_ease-in-out_infinite]"
                />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Import Safe Dialog */}
      <SafeWalletImportDialog
        open={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          // Refresh module status when import dialog closes
          if (selectedSafe) {
            setTimeout(async () => {
              await refreshModuleStatus();
            }, 1000);
          }
        }}
        onImported={handleImportedSafe}
        onHasOngoingProcessChange={setHasImportOngoingProcess}
      />

      {/* Safe Wallet Creation Progress Dialog */}
      <SafeCreationProgressModal
        open={showCreateFlow}
        onClose={() => {
          setShowCreateFlow(false);
          // Refresh module status when create dialog closes
          if (selectedSafe) {
            setTimeout(async () => {
              await refreshModuleStatus();
            }, 1000);
          }
        }}
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
