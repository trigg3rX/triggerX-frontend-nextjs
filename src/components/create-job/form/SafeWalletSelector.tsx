"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { useAccount, useChainId } from "wagmi";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import { Typography } from "@/components/ui/Typography";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";
import { RadioGroup } from "@/components/ui/RadioGroup";
import Skeleton from "@/components/ui/Skeleton";
import { getSafeModuleAddress } from "@/utils/contractAddresses";
import { getSafeChainInfo } from "@/utils/safeChains";
import TriggerXSafeModuleArtifact from "@/artifacts/TriggerXSafeModule.json";
import networksData from "@/utils/networks.json";
import SafeCreationProgressModal from "@/components/safe-wallet/SafeWalletCreationDialog";
import SafeWalletImportDialog from "@/components/safe-wallet/import-wallet-modal/SafeWalletImportDialog";
import type { SafeCreationStepStatus } from "@/types/safe";
import {
  getWalletDisplayName,
  saveChainWalletName,
} from "@/utils/safeWalletNames";
import { addExtraSafe } from "@/utils/safeWalletLocal";
import { MdEdit, MdCheck, MdClose } from "react-icons/md";
import { Import } from "lucide-react";
import { useSafeModuleStatus } from "@/hooks/useSafeModuleStatus";

interface SafeWalletSelectorProps {
  disabled?: boolean;
}

const EXTRA_SAFES_KEY_PREFIX = "triggerx_extra_safe_wallets_";

export const SafeWalletSelector: React.FC<SafeWalletSelectorProps> = ({
  disabled = false,
}) => {
  const { address } = useAccount();
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

  const { safeWallets, isLoading, refetch } = useSafeWallets();
  const {
    createSafeWallet,
    signEnableModule,
    submitEnableModule,
    isCreating,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
  } = useCreateSafeWallet();

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

  // Dialog states
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
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

  // Module status hook - same as SafeWalletSidebar
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_moduleEnabled, refreshModuleStatus] = useSafeModuleStatus(
    selectedSafeWallet || undefined,
  );

  // Update context when Safe wallets are fetched
  useEffect(() => {
    if (safeWallets.length > 0) {
      // Merge API wallets with any locally added extra safes (per chain)
      try {
        const extrasRaw =
          typeof window !== "undefined"
            ? localStorage.getItem(`${EXTRA_SAFES_KEY_PREFIX}${chainId}`)
            : null;
        const extras: string[] = extrasRaw ? JSON.parse(extrasRaw) : [];
        const merged = Array.from(
          new Set([...safeWallets, ...extras]).values(),
        );
        setUserSafeWallets(merged);
      } catch {
        setUserSafeWallets(safeWallets);
      }
    }
  }, [safeWallets, setUserSafeWallets, chainId]);

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
      await refreshModuleStatus();
    }, 100);
  };

  // Create new Safe wallet with three-step flow
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
        await handleSafeWalletSelect(safeAddress);
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

      // Wait for blockchain state to update, then select wallet and refresh
      setTimeout(async () => {
        // First select the safe wallet
        await handleSafeWalletSelect(safeAddress);

        // Refetch the safe wallets list
        await refetch();

        // Refresh module status immediately after selection (wait a bit for state to update)
        setTimeout(async () => {
          await refreshModuleStatus();
        }, 200);
      }, 2000);

      // Auto-close dialog after selecting wallet
      setTimeout(() => {
        setShowCreateFlow(false);
      }, 500);
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

  // Handle imported safe wallet
  const handleImportedSafe = async (
    safeAddress: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _moduleActive: boolean,
  ) => {
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
    await refetch();

    // Refresh module status immediately after selection (wait a bit for state to update)
    setTimeout(async () => {
      await refreshModuleStatus();
    }, 200);
  };

  const handleDropdownChange = async (option: DropdownOption) => {
    if (option.id === "create-new") {
      await handleCreateNewSafe();
    } else if (option.id === "add-existing") {
      setShowImportDialog(true);
    } else {
      const walletAddress = option.id as string;
      await handleSafeWalletSelect(walletAddress);
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
        refetch();
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
        <div className="space-y-auto">
          {isLoading ? (
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
                  isCreating ||
                  isSigningEnableModule ||
                  isExecutingEnableModule ||
                  isProposingEnableModule
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

              {/* Import progress indicator */}
              {hasImportOngoingProcess && (
                <div className="text-xs bg-yellow-100 text-yellow-800 p-3 rounded mt-6 group">
                  <button
                    onClick={() => setShowImportDialog(true)}
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
        open={showCreateFlow}
        onClose={() => {
          setShowCreateFlow(false);
          // Refresh module status when create dialog closes
          if (selectedSafeWallet) {
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

      {/* Import Safe Dialog */}
      <SafeWalletImportDialog
        open={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          // Refresh module status when import dialog closes
          if (selectedSafeWallet) {
            setTimeout(async () => {
              await refreshModuleStatus();
            }, 1000);
          }
        }}
        onImported={handleImportedSafe}
        onHasOngoingProcessChange={setHasImportOngoingProcess}
      />
    </div>
  );
};
