"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DropdownOption } from "@/components/ui/Dropdown";
import { InputField } from "@/components/ui/InputField";
import Skeleton from "@/components/ui/Skeleton";
import { useChainId } from "wagmi";
import { useSafeWalletContext } from "@/contexts/SafeWalletContext";
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
import { getSafeWebAppUrl } from "@/utils/safeChains";
import scrollbarStyles from "@/app/styles/scrollbar.module.css";

const SafeWalletSidebar: React.FC = () => {
  const chainId = useChainId();
  const { selection, creation, importFlow, moduleControl } =
    useSafeWalletContext();

  const [editingName, setEditingName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState<string>("");
  const [showList, setShowList] = useState(false);

  // Dropdown options for the safe wallets
  const dropdownOptions: DropdownOption[] = [
    ...selection.safeWallets.map((w) => ({
      id: w,
      name: getWalletDisplayName(w, chainId, selection.safeWallets),
    })),
  ];

  // Selected option for the safe wallet
  const selectedOption = selection.selectedSafe
    ? getWalletDisplayName(
        selection.selectedSafe,
        chainId,
        selection.safeWallets,
      )
    : "Select a wallet";

  // Handle select of a safe wallet from the dropdown
  const handleSelect = async (opt: DropdownOption) => {
    const addr = String(opt.id);
    await selection.selectSafe(addr);
  };

  // Handle open in safe app
  const handleOpenInSafeApp = async () => {
    if (!selection.selectedSafe) return;
    const url = await getSafeWebAppUrl(chainId, selection.selectedSafe);
    if (url) {
      window.open(url, "_blank");
    }
  };

  // Base Sepolia chain ID
  const BASE_SEPOLIA_CHAIN_ID = 84532;
  // Arbitrum One chain ID
  const ARBITRUM_ONE_CHAIN_ID = 42161;

  const isSupportedChain =
    chainId === BASE_SEPOLIA_CHAIN_ID || chainId === ARBITRUM_ONE_CHAIN_ID;

  // Show "Open in Safe App" only when Safe is selected AND chain is supported
  const shouldShowOpenInSafeApp = selection.selectedSafe && isSupportedChain;

  // Show "Import Safe Wallet" only on supported chains
  const shouldShowImportSafeWallet = isSupportedChain;

  return (
    <div className="space-y-6 sm:space-y-8 xl:min-h-[500px]">
      {/* Safe Wallet Selection */}
      <Card>
        {selection.isLoading ? (
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
                        if (!selection.selectedSafe) return;
                        setIsEditingName(true);
                        setNameError("");
                        setEditingName(
                          selection.selectedSafe
                            ? getWalletDisplayName(
                                selection.selectedSafe,
                                chainId,
                                selection.safeWallets,
                              )
                            : "",
                        );
                      }}
                      disabled={!selection.selectedSafe}
                      aria-disabled={!selection.selectedSafe}
                      className={
                        selection.selectedSafe
                          ? "text-[#C07AF6] hover:text-white hover:bg-[#C07AF6]/20 rounded p-1.5 "
                          : "text-white/30 cursor-not-allowed rounded p-1.5"
                      }
                      title={
                        selection.selectedSafe
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
                        if (!selection.selectedSafe) return;
                        if (editingName.trim()) {
                          const result = saveChainWalletName(
                            chainId,
                            selection.selectedSafe,
                            editingName.trim(),
                          );
                          if (result.ok) {
                            setIsEditingName(false);
                            setEditingName("");
                            setNameError("");
                            selection.refreshSafeList();
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
                        {selection.selectedSafe ? (
                          <>
                            {`${selection.selectedSafe.substring(0, 5)}...${selection.selectedSafe.substring(selection.selectedSafe.length - 5)}`}
                            {selection.moduleEnabled === true ? (
                              <span className="inline-flex items-center text-[#C07AF6] px-1">
                                <CheckCircle2 size={10} />
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </Typography>
                      <Typography variant="body" align="left">
                        {selection.selectedSafe
                          ? getWalletDisplayName(
                              selection.selectedSafe,
                              chainId,
                              selection.safeWallets,
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
                  {selection.selectedSafe && !isEditingName && (
                    <SafeWalletCopyButton text={selection.selectedSafe} />
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
        {selection.selectedSafe &&
          !selection.checkingModule &&
          selection.moduleEnabled === false && (
            <div className="mt-0.5 flex justify-end">
              <button
                onClick={moduleControl.handleShowEnableDialog}
                disabled={
                  creation.isSigningEnableModule ||
                  creation.isExecutingEnableModule ||
                  creation.isProposingEnableModule
                }
                className={`text-xs text-[#C07AF6] underline underline-offset-4 ${
                  creation.isSigningEnableModule ||
                  creation.isExecutingEnableModule ||
                  creation.isProposingEnableModule
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {creation.isSigningEnableModule
                  ? "Signing..."
                  : creation.isExecutingEnableModule ||
                      creation.isProposingEnableModule
                    ? "Enabling..."
                    : "Enable TriggerX Module"}
              </button>
            </div>
          )}

        {/* Disable Module Button as inline link */}
        {/* Not used defined button component as we have to show button like inline link*/}
        {selection.selectedSafe &&
          !selection.checkingModule &&
          selection.moduleEnabled === true && (
            <div className="mt-0.5 flex justify-end">
              <button
                onClick={moduleControl.handleShowDisableDialog}
                disabled={
                  moduleControl.isSigningDisableModule ||
                  moduleControl.isExecutingDisableModule ||
                  moduleControl.isProposingDisableModule
                }
                className={`text-xs text-red-300 underline underline-offset-4 ${
                  moduleControl.isSigningDisableModule ||
                  moduleControl.isExecutingDisableModule ||
                  moduleControl.isProposingDisableModule
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:text-red-300"
                }`}
              >
                {moduleControl.isSigningDisableModule
                  ? "Signing..."
                  : moduleControl.isExecutingDisableModule ||
                      moduleControl.isProposingDisableModule
                    ? "Disabling..."
                    : "Disable TriggerX Module"}
              </button>
            </div>
          )}

        {/* Error Message Display*/}
        {selection.error && (
          <Typography variant="caption" color="error" align="left">
            {selection.error}
          </Typography>
        )}

        {/* Separator */}
        <hr className="my-4 border-white/20" />

        {/* Create / Import actions */}
        <div className="space-y-4">
          {/* Open in Safe App - Only show when Safe is selected AND on Base Sepolia */}
          {shouldShowOpenInSafeApp && (
            <Button onClick={handleOpenInSafeApp} className="w-full">
              Open in Safe App
            </Button>
          )}

          {/* Create New Safe Wallet - Always visible */}
          <Button
            onClick={creation.handleCreateNewSafe}
            className="w-full"
            disabled={
              creation.isCreating ||
              creation.isSigningEnableModule ||
              creation.isExecutingEnableModule ||
              creation.isProposingEnableModule ||
              moduleControl.isSigningDisableModule ||
              moduleControl.isExecutingDisableModule ||
              moduleControl.isProposingDisableModule
            }
          >
            {creation.isCreating
              ? "Creating Safe..."
              : creation.isSigningEnableModule ||
                  moduleControl.isSigningDisableModule
                ? "Signing..."
                : creation.isExecutingEnableModule ||
                    creation.isProposingEnableModule ||
                    moduleControl.isExecutingDisableModule ||
                    moduleControl.isProposingDisableModule
                  ? "Processing..."
                  : "Create New Safe Wallet"}
          </Button>

          {/* Import Safe Wallet - Only show on Base Sepolia */}
          {shouldShowImportSafeWallet && (
            <div className="relative flex items-center gap-2">
              {/* Import Safe Wallet Button */}
              <Button
                onClick={importFlow.openImportDialog}
                className="w-full"
                disabled={
                  creation.isCreating ||
                  creation.isSigningEnableModule ||
                  creation.isExecutingEnableModule ||
                  creation.isProposingEnableModule ||
                  moduleControl.isSigningDisableModule ||
                  moduleControl.isExecutingDisableModule ||
                  moduleControl.isProposingDisableModule
                }
              >
                Import Safe Wallet
              </Button>
              {/* Show import wallet progress button when there is an ongoing process and the import dialog is not open */}
              {importFlow.hasImportOngoingProcess && (
                <button
                  onClick={importFlow.openImportDialog}
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
          )}
        </div>
      </Card>

      {/* Import Safe Dialog */}
      <SafeWalletImportDialog
        open={importFlow.showImportDialog}
        onClose={importFlow.closeImportDialog}
        onImported={importFlow.handleImportedSafe}
        onHasOngoingProcessChange={importFlow.setHasImportOngoingProcess}
      />

      {/* Safe Wallet Creation Progress Dialog */}
      <SafeCreationProgressModal
        open={creation.showCreateFlow}
        onClose={creation.closeCreateFlow}
        createStep={creation.createStep}
        signStep={creation.signStep}
        enableStep={creation.enableStep}
        createError={creation.createError}
        signError={creation.signError}
        enableError={creation.enableError}
        onRetryCreate={creation.handleRetryCreate}
        onRetrySign={creation.handleRetrySign}
        onRetryEnable={creation.handleRetryEnable}
      />

      {/* Module Action Dialog (Enable/Disable) */}
      <ModuleActionDialog
        open={moduleControl.showModuleActionDialog}
        onClose={moduleControl.closeModuleActionDialog}
        action={moduleControl.moduleAction}
        onConfirmEnable={() => void moduleControl.handleEnableModule()}
        onConfirmDisable={() => void moduleControl.handleDisableModule()}
        signStep={moduleControl.moduleSignStep}
        executeStep={moduleControl.moduleExecuteStep}
        signError={moduleControl.moduleSignError}
        executeError={moduleControl.moduleExecuteError}
        onRetrySign={moduleControl.handleRetryModuleSign}
        onRetryExecute={moduleControl.handleRetryModuleExecute}
        multisigInfo={moduleControl.moduleMultisigInfo}
        selectedSafe={selection.selectedSafe}
        onManualRefresh={moduleControl.handleManualModuleRefresh}
        isCheckingModuleStatus={moduleControl.isCheckingModuleStatus}
      />
    </div>
  );
};

export default SafeWalletSidebar;
