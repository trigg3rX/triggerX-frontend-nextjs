"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { useChainId } from "wagmi";
import { useSafeWalletContext } from "@/contexts/SafeWalletContext";
import { Typography } from "@/components/ui/Typography";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";
import { RadioGroup } from "@/components/ui/RadioGroup";
import Skeleton from "@/components/ui/Skeleton";
import { FormErrorMessage } from "@/components/common/FormErrorMessage";
import { getSafeModuleAddress } from "@/utils/contractAddresses";
import { getSafeChainInfo } from "@/utils/safeChains";
import TriggerXSafeModuleArtifact from "@/artifacts/TriggerXSafeModule.json";
import networksData from "@/utils/networks.json";
import SafeCreationProgressModal from "@/components/safe-wallet/SafeWalletCreationDialog";
import SafeWalletImportDialog from "@/components/safe-wallet/import-wallet-modal/SafeWalletImportDialog";
import {
  getWalletDisplayName,
  saveChainWalletName,
} from "@/utils/safeWalletNames";
import { addExtraSafe } from "@/utils/safeWalletLocal";
import { MdEdit, MdCheck, MdClose } from "react-icons/md";
import { Import } from "lucide-react";

interface SafeWalletSelectorProps {
  disabled?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

const EXTRA_SAFES_KEY_PREFIX = "triggerx_extra_safe_wallets_";

export const SafeWalletSelector: React.FC<SafeWalletSelectorProps> = ({
  disabled = false,
  error = null,
  onClearError,
}) => {
  const chainId = useChainId();
  const {
    executionMode,
    setExecutionMode,
    selectedSafeWallet,
    setSelectedSafeWallet,
    userSafeWallets,
    setUserSafeWallets,
    handleContractAddressChange,
    handleSetContractDetails,
  } = useJobFormContext();

  const { selection, creation, importFlow } = useSafeWalletContext();

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [nameError, setNameError] = useState<string>("");
  const [safeChainInfo, setSafeChainInfo] = useState<{
    shortName: string | null;
    transactionService: string | null;
  } | null>(null);
  const isSafeSupported = useMemo(
    () => Boolean(safeChainInfo?.shortName),
    [safeChainInfo],
  );

  // Update context when Safe wallets are fetched
  useEffect(() => {
    if (selection.safeWallets.length > 0) {
      // Merge API wallets with any locally added extra safes (per chain)
      try {
        const extrasRaw =
          typeof window !== "undefined"
            ? localStorage.getItem(`${EXTRA_SAFES_KEY_PREFIX}${chainId}`)
            : null;
        const extras: string[] = extrasRaw ? JSON.parse(extrasRaw) : [];
        const merged = Array.from(
          new Set([...selection.safeWallets, ...extras]).values(),
        );
        setUserSafeWallets(merged);
      } catch {
        setUserSafeWallets(selection.safeWallets);
      }
    }
  }, [selection.safeWallets, setUserSafeWallets, chainId]);

  useEffect(() => {
    let cancelled = false;

    const fetchChainInfo = async () => {
      try {
        const info = await getSafeChainInfo(chainId);
        if (!cancelled) {
          setSafeChainInfo(info);
        }
      } catch {
        if (!cancelled) {
          setSafeChainInfo(null);
        }
      }
    };

    fetchChainInfo();

    return () => {
      cancelled = true;
    };
  }, [chainId]);

  const handleExecutionModeChange = (mode: "contract" | "safe") => {
    setExecutionMode(mode);
    if (mode === "contract") {
      setSelectedSafeWallet(null);
      // Clear contract address if it was set to Safe module
      if (handleContractAddressChange) {
        handleContractAddressChange("contract", "");
      }
    } else if (mode === "safe") {
      // Set up Safe Module ABI and address
      const moduleAddress = getSafeModuleAddress(chainId);
      if (moduleAddress) {
        handleSetContractDetails(
          "contract",
          moduleAddress,
          JSON.stringify(TriggerXSafeModuleArtifact.abi),
        );
      }
    }
  };

  const handleSafeWalletSelect = async (walletAddress: string) => {
    setSelectedSafeWallet(walletAddress);
    // Set contract address to Safe module address and set ABI
    const moduleAddress = getSafeModuleAddress(chainId);
    if (moduleAddress) {
      handleSetContractDetails(
        "contract",
        moduleAddress,
        JSON.stringify(TriggerXSafeModuleArtifact.abi),
      );
    }
    // Refresh module status after selection (wait a bit for state to update)
    setTimeout(async () => {
      await selection.refreshModuleStatus();
    }, 100);
  };

  // Handle imported safe wallet
  const handleImportedSafe = async (safeAddress: string) => {
    // Add to local storage
    addExtraSafe(chainId, safeAddress);

    // Update the safe wallets list
    const merged = Array.from(
      new Set([...(userSafeWallets || []), safeAddress]).values(),
    );
    setUserSafeWallets(merged);

    // Select the imported safe
    await handleSafeWalletSelect(safeAddress);

    // Refetch the safe wallets list
    await selection.refreshSafeList();

    // Call the context handler
    await importFlow.handleImportedSafe(safeAddress);
  };

  const handleDropdownChange = async (option: DropdownOption) => {
    if (option.id === "create-new") {
      await creation.handleCreateNewSafe();
    } else if (option.id === "add-existing") {
      importFlow.openImportDialog();
    } else {
      const walletAddress = option.id as string;
      await handleSafeWalletSelect(walletAddress);
      // Clear error when wallet is selected
      onClearError?.();
    }
  };

  const handleSaveWalletName = (walletAddress: string) => {
    if (editingName.trim()) {
      const result = saveChainWalletName(
        chainId,
        walletAddress,
        editingName.trim(),
      );
      if (result.ok) {
        setEditingWallet(null);
        setEditingName("");
        setNameError("");
        // Force re-render by refetching (this will update the display)
        selection.refreshSafeList();
      } else {
        setNameError(result.error);
      }
    }
  };

  const dropdownOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = [
      ...userSafeWallets.map((wallet) => ({
        id: wallet,
        name: getWalletDisplayName(wallet, chainId, userSafeWallets),
      })),
      {
        id: "create-new",
        name: "+ Create New Safe Wallet",
      },
    ];

    if (isSafeSupported) {
      options.push({
        id: "add-existing",
        name: "+ Add Existing Safe Wallet",
      });
    }

    return options;
  }, [userSafeWallets, isSafeSupported, chainId]);

  const selectedOption = selectedSafeWallet
    ? getWalletDisplayName(selectedSafeWallet, chainId, userSafeWallets)
    : "Select a Safe Wallet";

  // Check if the connected network is a mainnet
  const currentNetwork = networksData.supportedNetworks.find(
    (network) => network.id === chainId,
  );
  const isMainnet = currentNetwork?.type === "mainnet";

  return (
    <div className="space-y-6">
      <RadioGroup
        label="Execution Mode"
        options={[
          { label: "Smart Contract", value: "contract" },
          {
            label: "Smart Contract Wallet",
            value: "safe",
            disabled: isMainnet,
          },
        ]}
        value={executionMode}
        onChange={(value) =>
          handleExecutionModeChange(value as "contract" | "safe")
        }
        name="execution-mode"
        disabled={disabled}
      />

      {executionMode === "safe" && (
        <div className="space-y-auto" id="safe-wallet-dropdown">
          {selection.isLoading ? (
            <Skeleton height={50} borderRadius={12} />
          ) : (
            <>
              <Dropdown
                label="Safe Wallet"
                options={dropdownOptions}
                selectedOption={selectedOption}
                onChange={handleDropdownChange}
                disabled={
                  disabled ||
                  creation.isCreating ||
                  creation.isSigningEnableModule ||
                  creation.isExecutingEnableModule ||
                  creation.isProposingEnableModule
                }
              />

              {!isSafeSupported && (
                <Typography
                  variant="caption"
                  align="left"
                  color="secondary"
                  className="w-full md:w-[70%] ml-auto mt-2 pl-3"
                >
                  Add Existing Safe Wallet is available only on Safe-supported
                  networks.
                </Typography>
              )}
              <FormErrorMessage
                error={error}
                className="w-full md:w-[70%] ml-auto mt-1 pl-3"
              />

              {/* Import progress indicator */}
              {importFlow.hasImportOngoingProcess && (
                <div className="text-xs bg-yellow-100 text-yellow-800 p-3 rounded mt-6 group">
                  <button
                    onClick={importFlow.openImportDialog}
                    className="w-full text-left flex items-center gap-2 hover:opacity-90 transition-opacity"
                    title="Click to view import wallet progress"
                  >
                    <Import size={16} className="" />
                    <Typography variant="body" color="inherit" align="left">
                      <strong>Note:</strong> Awaiting signatures to complete
                      Safe import —{" "}
                      <span className="group-hover:underline">view status</span>
                    </Typography>
                  </button>
                </div>
              )}

              {selectedSafeWallet && (
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4 md:gap-2 bg-white/5 border border-white/10 rounded-lg p-3 mt-6">
                  <div className="flex gap-2 flex-col items-start">
                    <Typography
                      variant="caption"
                      color="secondary"
                      className="text-[#A2A2A2]"
                    >
                      Selected Safe Wallet:
                    </Typography>

                    <Typography
                      variant="caption"
                      color="primary"
                      align="left"
                      className="break-all md:break-normal whitespace-normal"
                    >
                      {selectedSafeWallet}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {editingWallet === selectedSafeWallet ? (
                      <>
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-1 md:gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleSaveWalletName(selectedSafeWallet);
                                if (e.key === "Escape") {
                                  setEditingWallet(null);
                                  setEditingName("");
                                  setNameError("");
                                }
                              }}
                              className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs md:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/30 transition-colors"
                              placeholder="Enter wallet name"
                              autoFocus
                            />
                            <button
                              onClick={() =>
                                handleSaveWalletName(selectedSafeWallet)
                              }
                              className="md:p-2 p-1 text-[#A2A2A2] hover:text-white hover:bg-white/10 rounded transition-colors mb-0.5"
                              title="Save"
                            >
                              <MdCheck size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingWallet(null);
                                setEditingName("");
                                setNameError("");
                              }}
                              className="md:p-2 p-1 text-[#A2A2A2] hover:text-white hover:bg-white/10 rounded transition-colors mb-0.5"
                              title="Cancel"
                            >
                              <MdClose size={14} />
                            </button>
                          </div>
                          {nameError && (
                            <Typography
                              variant="caption"
                              color="error"
                              align="left"
                              className="mt-1 text-xs"
                            >
                              {nameError}
                            </Typography>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <Typography
                          variant="caption"
                          color="primary"
                          className="text-sm"
                        >
                          {getWalletDisplayName(
                            selectedSafeWallet,
                            chainId,
                            userSafeWallets,
                          )}
                        </Typography>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingWallet(selectedSafeWallet);
                            setNameError("");
                            setEditingName(
                              getWalletDisplayName(
                                selectedSafeWallet,
                                chainId,
                                userSafeWallets,
                              ),
                            );
                          }}
                          className="p-2 text-[#A2A2A2] hover:text-white hover:bg-white/10 rounded transition-colors mb-1 ml-1"
                          title="Edit wallet name"
                        >
                          <MdEdit size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

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

      {/* Import Safe Dialog */}
      <SafeWalletImportDialog
        open={importFlow.showImportDialog}
        onClose={importFlow.closeImportDialog}
        onImported={handleImportedSafe}
        onHasOngoingProcessChange={importFlow.setHasImportOngoingProcess}
      />
    </div>
  );
};
