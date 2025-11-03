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
        // For multisig, module is not enabled yet - don't set status (will be enabled when approved or on manual refresh)
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

  const handleImportedSafe = async (
    safeAddress: string,
    moduleActive: boolean,
  ) => {
    // Select the imported safe
    onSafeSelect(safeAddress);

    // Refetch the safe wallets list
    await refetch();

    // Refresh module status
    setTimeout(async () => {
      if (moduleActive) {
        clearModuleStatusCache(safeAddress);
        setModuleStatus(safeAddress, true);
      }
      await refreshModuleStatus();
    }, 500);
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
      }
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
                        setEditingName(
                          selectedSafe
                            ? getWalletDisplayName(selectedSafe, safeWallets)
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
                          saveWalletName(selectedSafe, editingName.trim());
                          setIsEditingName(false);
                          setEditingName("");
                          refetch();
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
                          ? getWalletDisplayName(selectedSafe, safeWallets)
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
                  onClick={() => void handleEnableModule()}
                  className="text-xs text-[#C07AF6] underline underline-offset-4 cursor-pointer"
                >
                  Enable TriggerX Module
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
                onClick={handleCreateNewSafe}
                className="w-full"
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
                    isProposingEnableModule
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
    </div>
  );
};

export default SafeWalletSidebar;
