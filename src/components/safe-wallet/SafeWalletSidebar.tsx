"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DropdownOption } from "@/components/ui/Dropdown";
import { InputField } from "@/components/ui/InputField";
import Skeleton from "@/components/ui/Skeleton";
import { useAccount } from "wagmi";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import { getWalletDisplayName, saveWalletName } from "@/utils/safeWalletNames";
import { Save, ChevronDown, ChevronUp, Edit, CheckCircle2 } from "lucide-react";
import { LucideCopyButton } from "@/components/ui/CopyButton";
import SafeCreationProgressModal from "@/components/safe-wallet/SafeWalletCreationDialog";
import type { SafeCreationStepStatus } from "@/types/safe";
import {
  useSafeModuleStatus,
  setModuleStatus,
  clearModuleStatusCache,
} from "@/hooks/useSafeModuleStatus";
interface SafeWalletSidebarProps {
  selectedSafe: string | null;
  onSafeSelect: (safe: string | null) => void;
}

const SafeWalletSidebar: React.FC<SafeWalletSidebarProps> = ({
  selectedSafe,
  onSafeSelect,
}) => {
  const { address } = useAccount();
  const { safeWallets, isLoading, error, refetch } = useSafeWallets();
  const {
    createSafeWallet,
    signEnableModule,
    submitEnableModule,
    isCreating,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
  } = useCreateSafeWallet();
  const [editingName, setEditingName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importAddress, setImportAddress] = useState("");
  const [importError, setImportError] = useState("");
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

  // Dropdown options for the safe wallets
  const dropdownOptions: DropdownOption[] = [
    ...safeWallets.map((w) => ({
      id: w,
      name: getWalletDisplayName(w, safeWallets),
    })),
  ];

  // Selected option for the safe wallet
  const selectedOption = selectedSafe
    ? getWalletDisplayName(selectedSafe, safeWallets)
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
        // Clear cache and update module status in localStorage for executed transactions (module is enabled)
        clearModuleStatusCache(safeAddress);
        setModuleStatus(safeAddress, true);
      } else if (submitResult.data?.status === "multisig") {
        // For multisig, module is not enabled yet - don't set status (will be enabled when approved)
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
        clearModuleStatusCache(safeAddress);
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

  const openImportModal = () => {
    setShowImportModal(true);
    setImportAddress("");
    setImportError("");
  };

  const handleImportSafe = async () => {
    if (!importAddress || !/^0x[a-fA-F0-9]{40}$/.test(importAddress)) {
      setImportError("Please enter a valid Ethereum address");
      return;
    }

    try {
      setImportError("");
      // Store friendly name and select the imported safe
      saveWalletName(importAddress, getWalletDisplayName(importAddress));
      onSafeSelect(importAddress);
      setShowImportModal(false);

      // Try to enable module on imported safe (two-step flow)
      try {
        const signResult = await signEnableModule(importAddress);
        if (signResult.success) {
          const submitResult = await submitEnableModule();
          if (submitResult.success) {
            if (submitResult.data?.status === "executed") {
            } else if (submitResult.data?.status === "multisig") {
            }
          } else {
          }
        } else {
        }
      } catch (moduleError) {
        console.warn("Failed to enable module on imported safe:", moduleError);
      }
    } catch (importErr) {
      console.error("Import error:", importErr);
      setImportError("Failed to import safe wallet");
    }
  };

  // Handle enable module on created safe wallet
  const handleEnableModule = async () => {
    if (!selectedSafe) return;

    // Use two-step flow for enabling module on existing Safe
    const signResult = await signEnableModule(selectedSafe);
    if (signResult.success) {
      const submitResult = await submitEnableModule();
      if (submitResult.success) {
        setModuleStatus(selectedSafe, true); // update localStorage
        await refreshModuleStatus();
        if (submitResult.data?.status === "executed") {
        } else if (submitResult.data?.status === "multisig") {
        }
      } else {
      }
    } else {
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab-style header for alignment with main content tabs */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1 w-full">
          <button
            className="px-4 py-2 rounded-lg text-xs sm:text-sm bg-white/10 text-white w-full"
            aria-pressed
            disabled
          >
            Safe Wallet Management
          </button>
        </div>
      </div>

      {/* Safe Wallet Selection */}
      <Card className="p-3 sm:p-4">
        {isLoading ? (
          <Skeleton height={50} borderRadius={12} />
        ) : (
          <>
            {/* Custom selector with inline edit and dropdown toggle */}
            <div className="mb-4">
              <div className="relative w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-2 sm:px-3 py-2.5 flex items-center gap-2 sm:gap-3 overflow-hidden">
                {/* Left: edit/save */}
                <div className="shrink-0">
                  {!isEditingName ? (
                    <button
                      onClick={() => {
                        if (!selectedSafe) return;
                        setIsEditingName(true);
                        setEditingName(
                          selectedSafe
                            ? getWalletDisplayName(selectedSafe, safeWallets)
                            : "",
                        );
                      }}
                      disabled={!selectedSafe}
                      aria-disabled={!selectedSafe}
                      className={`p-1.5 sm:p-2 rounded transition-colors ${
                        selectedSafe
                          ? "text-purple-300 hover:text-white hover:bg-purple-500/20"
                          : "text-white/30 cursor-not-allowed"
                      }`}
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
                          saveWalletName(selectedSafe, editingName.trim());
                          setIsEditingName(false);
                          setEditingName("");
                          refetch();
                        }
                      }}
                      className="p-1.5 sm:p-2 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded transition-colors"
                      title="Save"
                    >
                      <Save size={16} />
                    </button>
                  )}
                </div>

                {/* Middle: identity */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  {!isEditingName ? (
                    <div
                      className="flex flex-col cursor-pointer select-none min-w-0"
                      onClick={() => setShowList((prev) => !prev)}
                      role="button"
                      aria-label="Open wallet list"
                    >
                      <Typography
                        variant="caption"
                        color="secondary"
                        align="left"
                        className="truncate"
                      >
                        {/* This shortens the address to 12 characters only for sufficient display space on the UI for other text */}
                        {selectedSafe ? (
                          <>
                            {`${selectedSafe.substring(0, 7)}...${selectedSafe.substring(selectedSafe.length - 5)}`}
                            {moduleEnabled === true ? (
                              <span className="inline-flex items-center gap-1 text-purple-300 px-2 py-0.5">
                                <CheckCircle2 size={10} />
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </Typography>
                      <Typography
                        variant="body"
                        align="left"
                        className="truncate text-sm sm:text-base"
                      >
                        {selectedSafe
                          ? getWalletDisplayName(selectedSafe, safeWallets)
                          : selectedOption}
                      </Typography>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <InputField
                        label=""
                        placeholder="Wallet Nickname"
                        value={editingName}
                        onChange={setEditingName}
                      />
                    </div>
                  )}
                </div>

                {/* Right: copy and arrow icon to toggle dropdown list */}
                {selectedSafe && !isEditingName && (
                  <div
                    className="shrink-0 mr-1 hidden sm:block"
                    title="Copy address"
                  >
                    <LucideCopyButton text={selectedSafe} />
                  </div>
                )}
                <button
                  onClick={() => {
                    if (!isEditingName) setShowList((prev) => !prev);
                  }}
                  className={`shrink-0 p-1 rounded ${
                    isEditingName
                      ? "text-white/40 cursor-not-allowed"
                      : "text-white/80 hover:text-white"
                  }`}
                  aria-label="Toggle wallet list"
                  aria-disabled={isEditingName}
                  disabled={isEditingName}
                >
                  {showList ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
              {/* Dropdown list */}
              {showList && (
                <div className="mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {dropdownOptions.length === 0 ? (
                    <div className="py-3 px-4 text-[#A2A2A2] text-sm">
                      No wallets found
                    </div>
                  ) : (
                    dropdownOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="py-2.5 px-4 hover:bg-[#333] cursor-pointer text-sm"
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

            {/* Inline link to enable module when not verified */}
            {selectedSafe && !checkingModule && moduleEnabled === false && (
              <div className="mt-0.5 flex justify-end">
                <button
                  onClick={() => void handleEnableModule()}
                  className="text-xs text-purple-300 hover:text-white underline underline-offset-4 cursor-pointer"
                >
                  Enable Module
                </button>
              </div>
            )}

            {error && (
              <Typography
                variant="caption"
                color="error"
                align="left"
                className="mb-3"
              >
                {error}
              </Typography>
            )}

            {/* Separator */}
            <hr className="my-3 border-white/20" />

            {/* Create / Import actions - always visible */}
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-2">
              <Button
                onClick={handleCreateNewSafe}
                className="w-full text-sm sm:text-base"
                disabled={
                  isCreating ||
                  isSigningEnableModule ||
                  isExecutingEnableModule ||
                  isProposingEnableModule
                }
              >
                {isCreating
                  ? "Creating Safe..."
                  : isSigningEnableModule
                    ? "Signing..."
                    : isExecutingEnableModule || isProposingEnableModule
                      ? "Enabling Module..."
                      : "Create New Safe Wallet"}
              </Button>
              <Button
                onClick={openImportModal}
                className="w-full text-sm sm:text-base"
                disabled={
                  isCreating ||
                  isSigningEnableModule ||
                  isExecutingEnableModule ||
                  isProposingEnableModule
                }
              >
                Import Safe Wallet
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Import Safe Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-4 sm:p-6 w-full max-w-md">
            <div className="space-y-4">
              <Typography variant="h3" color="primary">
                Import Existing Safe
              </Typography>
              <Typography variant="caption" color="secondary">
                Enter the address of an existing Safe wallet to import it.
              </Typography>

              <InputField
                label="Safe Address"
                placeholder="0x..."
                value={importAddress}
                onChange={setImportAddress}
                error={importError}
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleImportSafe}
                  disabled={
                    !importAddress ||
                    isSigningEnableModule ||
                    isExecutingEnableModule ||
                    isProposingEnableModule
                  }
                  className="flex-1"
                >
                  {isSigningEnableModule
                    ? "Signing..."
                    : isExecutingEnableModule || isProposingEnableModule
                      ? "Enabling..."
                      : "Import Safe"}
                </Button>
                <Button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportAddress("");
                    setImportError("");
                  }}
                  color="purple"
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
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
    </div>
  );
};

export default SafeWalletSidebar;
