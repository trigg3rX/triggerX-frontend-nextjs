import React, { useEffect, useMemo, useState } from "react";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { useAccount, useChainId } from "wagmi";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import type { EnableModuleResult } from "@/hooks/useCreateSafeWallet";
import { Typography } from "@/components/ui/Typography";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";
import { RadioGroup } from "@/components/ui/RadioGroup";
import Skeleton from "@/components/ui/Skeleton";
import { getSafeModuleAddress } from "@/utils/contractAddresses";
import { getSafeChainInfo } from "@/utils/safeChains";
import TriggerXSafeModuleArtifact from "@/artifacts/TriggerXSafeModule.json";
import SafeArtifact from "@/artifacts/Safe.json";
import {
  MdEdit,
  MdCheck,
  MdClose,
  MdOpenInNew,
  MdRefresh,
} from "react-icons/md";
import { ethers } from "ethers";
import toast from "react-hot-toast";

interface SafeWalletSelectorProps {
  disabled?: boolean;
}

// Local storage key for wallet names
const WALLET_NAMES_KEY = "triggerx_safe_wallet_names";
const EXTRA_SAFES_KEY_PREFIX = "triggerx_extra_safe_wallets_";

// Helper functions for wallet names
const getWalletNames = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(WALLET_NAMES_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveWalletName = (address: string, name: string) => {
  const names = getWalletNames();
  names[address.toLowerCase()] = name;
  localStorage.setItem(WALLET_NAMES_KEY, JSON.stringify(names));
};

const getWalletDisplayName = (address: string): string => {
  const names = getWalletNames();
  const customName = names[address.toLowerCase()];
  if (customName) return customName;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

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
    enableModule,
    isCreating,
    isEnablingModule,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
  } = useCreateSafeWallet();

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isValidatingExisting, setIsValidatingExisting] = useState(false);
  const [showAddExistingForm, setShowAddExistingForm] = useState(false);
  const [existingSafeAddress, setExistingSafeAddress] = useState("");
  const [addExistingError, setAddExistingError] = useState("");
  const [safeChainInfo, setSafeChainInfo] = useState<{
    shortName: string | null;
    transactionService: string | null;
  } | null>(null);
  const [multisigInfo, setMultisigInfo] = useState<MultisigInfo | null>(null);
  const [isCheckingModuleStatus, setIsCheckingModuleStatus] = useState(false);
  const isSafeSupported = useMemo(
    () => Boolean(safeChainInfo?.shortName),
    [safeChainInfo],
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
      } catch (e) {
        console.error("Error merging Safe wallets:", e);
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
      } catch (error) {
        console.error("Error fetching Safe chain info:", error);
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

  useEffect(() => {
    if (executionMode !== "safe") {
      setMultisigInfo(null);
    }
  }, [executionMode]);

  // Poll for module enablement when in multisig state
  useEffect(() => {
    if (!multisigInfo) return;

    let cancelled = false;

    const checkModuleStatus = async () => {
      if (cancelled || !multisigInfo) return;

      try {
        setIsCheckingModuleStatus(true);

        if (typeof window.ethereum === "undefined") return;
        const provider = new ethers.BrowserProvider(window.ethereum);

        const moduleAddress = getSafeModuleAddress(chainId);
        if (!moduleAddress) return;

        const SAFE_ABI = SafeArtifact.abi;

        const safeContract = new ethers.Contract(
          multisigInfo.safeAddress,
          SAFE_ABI,
          provider,
        );

        const isEnabled = await safeContract.isModuleEnabled(moduleAddress);

        if (isEnabled && !cancelled) {
          // Module has been enabled!
          toast.success("Module enabled successfully by Safe owners!");
          setMultisigInfo(null);

          // Auto-select the Safe wallet to continue the flow
          await handleSafeWalletSelect(multisigInfo.safeAddress);
        }
      } catch (error) {
        console.error("Error checking module status:", error);
      } finally {
        if (!cancelled) {
          setIsCheckingModuleStatus(false);
        }
      }
    };

    // Check immediately
    checkModuleStatus();

    // Then poll every 10 seconds
    const pollInterval = setInterval(checkModuleStatus, 10000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      setIsCheckingModuleStatus(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multisigInfo, chainId]);

  useEffect(() => {
    if (!isSafeSupported && showAddExistingForm) {
      setShowAddExistingForm(false);
      setExistingSafeAddress("");
      setAddExistingError("");
    }
  }, [isSafeSupported, showAddExistingForm]);

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
  };

  const handleCreateNewSafe = async () => {
    if (!address) return;

    const safeAddress = await createSafeWallet(address);
    if (safeAddress) {
      const enableResult = await enableModule(safeAddress);
      const { moduleActive } = applyEnableModuleResult(
        enableResult,
        safeAddress,
      );

      if (enableResult && moduleActive) {
        await handleSafeWalletSelect(safeAddress);
        // Wait a bit for blockchain state to update, then refetch
        setTimeout(async () => {
          await refetch();
        }, 3000);
      }
    }
  };

  const SAFE_INFO_ABI = [
    {
      inputs: [],
      name: "getThreshold",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getOwners",
      outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

  type StepId = "create" | "sign" | "execute";

  const STEP_ORDER: StepId[] = ["create", "sign", "execute"];

  const STEP_LABELS: Record<StepId, string> = {
    create: "Creating Safe Wallet",
    sign: "Signing the EIP-712 transaction to enable TriggerX Module",
    execute: "Executing the tx",
  };

  interface MultisigInfo {
    safeAddress: string;
    threshold: number;
    safeTxHash: string;
    queueUrl: string | null;
    fallbackUrl: string | null;
    owners: string[];
  }

  const addExtraSafeToLocal = (safeAddr: string) => {
    if (typeof window === "undefined") return;
    const key = `${EXTRA_SAFES_KEY_PREFIX}${chainId}`;
    const raw = localStorage.getItem(key);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.find((s) => s.toLowerCase() === safeAddr.toLowerCase())) {
      const updated = [...list, safeAddr];
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

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
      return { moduleActive: false, status: result.status };
    }

    setMultisigInfo(null);
    return { moduleActive: true, status: result.status };
  };

  const handleAddExistingSafe = async () => {
    setShowAddExistingForm(true);
    setAddExistingError("");
  };

  const handleSubmitExistingSafe = async () => {
    if (!existingSafeAddress.trim()) {
      setAddExistingError("Please enter a Safe address");
      return;
    }

    try {
      const safeAddr = ethers.getAddress(existingSafeAddress.trim());
      setIsValidatingExisting(true);
      setAddExistingError("");

      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);

      const code = await provider.getCode(safeAddr);
      if (!code || code === "0x") {
        throw new Error("No contract found at this address");
      }

      const safe = new ethers.Contract(safeAddr, SAFE_INFO_ABI, provider);
      const owners: string[] = await safe.getOwners();

      if (!address) {
        throw new Error("Connect your wallet to verify ownership");
      }
      const isOwner = owners
        .map((o) => o.toLowerCase())
        .includes(address.toLowerCase());
      if (!isOwner) {
        throw new Error("Connected wallet is not an owner of this Safe");
      }

      const enableResult = await enableModule(safeAddr);
      const { moduleActive } = applyEnableModuleResult(enableResult, safeAddr);

      if (enableResult) {
        const merged = Array.from(
          new Set([...(userSafeWallets || []), safeAddr]).values(),
        );
        setUserSafeWallets(merged);
        addExtraSafeToLocal(safeAddr);

        if (moduleActive) {
          await handleSafeWalletSelect(safeAddr);
        }

        setShowAddExistingForm(false);
        setExistingSafeAddress("");
        setAddExistingError("");
      }
    } catch (err) {
      console.error("Add existing Safe failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to add Safe";
      setAddExistingError(msg);
    } finally {
      setIsValidatingExisting(false);
    }
  };

  const handleCancelAddExisting = () => {
    setShowAddExistingForm(false);
    setExistingSafeAddress("");
    setAddExistingError("");
  };

  const handleManualRefresh = async () => {
    if (!multisigInfo) return;

    try {
      setIsCheckingModuleStatus(true);

      if (typeof window.ethereum === "undefined") {
        toast.error("Please connect your wallet");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const moduleAddress = getSafeModuleAddress(chainId);

      if (!moduleAddress) {
        toast.error("Module address not configured");
        return;
      }

      const safeContract = new ethers.Contract(
        multisigInfo.safeAddress,
        SafeArtifact.abi,
        provider,
      );

      const isEnabled = await safeContract.isModuleEnabled(moduleAddress);

      if (isEnabled) {
        toast.success("Module enabled successfully!");
        setMultisigInfo(null);
        await handleSafeWalletSelect(multisigInfo.safeAddress);
      } else {
        toast("Still waiting for signatures...", { icon: "⏳" });
      }
    } catch (error) {
      console.error("Error checking module status:", error);
      toast.error("Failed to check status");
    } finally {
      setIsCheckingModuleStatus(false);
    }
  };

  const handleDropdownChange = async (option: DropdownOption) => {
    if (option.id === "create-new") {
      await handleCreateNewSafe();
    } else if (option.id === "add-existing") {
      await handleAddExistingSafe();
    } else {
      const walletAddress = option.id as string;
      let moduleActive = false;
      try {
        const enableResult = await enableModule(walletAddress);
        const resultMeta = applyEnableModuleResult(enableResult, walletAddress);
        moduleActive = resultMeta.moduleActive;

        if (moduleActive) {
          await handleSafeWalletSelect(walletAddress);
        }
      } catch (error) {
        console.error("Error in handleDropdownChange:", error);
        if (!moduleActive) {
          // Still try to select the wallet as the user mentioned it works on retry
          await handleSafeWalletSelect(walletAddress);
        }
      }
    }
  };

  const handleSaveWalletName = (address: string) => {
    if (editingName.trim()) {
      saveWalletName(address, editingName.trim());
      setEditingWallet(null);
      setEditingName("");
      // Force re-render by refetching (this will update the display)
      refetch();
    }
  };

  const dropdownOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = [
      ...userSafeWallets.map((wallet) => ({
        id: wallet,
        name: getWalletDisplayName(wallet),
      })),
      {
        id: "create-new",
        name: "+ Create New Safe Wallet",
      },
    ];

    if (!showAddExistingForm && isSafeSupported) {
      options.push({
        id: "add-existing",
        name: "+ Add Existing Safe Wallet",
      });
    }

    return options;
  }, [userSafeWallets, showAddExistingForm, isSafeSupported]);

  const shouldShowStatus = useMemo(
    () =>
      isCreating ||
      isValidatingExisting ||
      isEnablingModule ||
      isSigningEnableModule ||
      isExecutingEnableModule ||
      isProposingEnableModule ||
      Boolean(multisigInfo),
    [
      isCreating,
      isValidatingExisting,
      isEnablingModule,
      isSigningEnableModule,
      isExecutingEnableModule,
      isProposingEnableModule,
      multisigInfo,
    ],
  );

  const currentStep: StepId | null = useMemo(() => {
    if (isCreating || isValidatingExisting) {
      return "create";
    }
    if (isExecutingEnableModule || isProposingEnableModule || multisigInfo) {
      return "execute";
    }
    if (isSigningEnableModule) {
      return "sign";
    }
    if (isEnablingModule) {
      return "sign";
    }
    return null;
  }, [
    isCreating,
    isValidatingExisting,
    isEnablingModule,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
    multisigInfo,
  ]);

  const getStepState = (step: StepId): "pending" | "current" | "completed" => {
    if (!currentStep) {
      return "pending";
    }

    const stepIndex = STEP_ORDER.indexOf(step);
    const currentIndex = STEP_ORDER.indexOf(currentStep);

    if (stepIndex < currentIndex) {
      return "completed";
    }

    if (stepIndex === currentIndex) {
      return "current";
    }

    return "pending";
  };

  const stepDescriptions = useMemo(
    () => ({
      create: isCreating
        ? "Deploying Safe wallet..."
        : isValidatingExisting
          ? "Validating Safe ownership..."
          : "Ready",
      sign: isSigningEnableModule
        ? "Sign the enable-module request in your wallet."
        : isEnablingModule
          ? "Preparing the enable-module request..."
          : isExecutingEnableModule || isProposingEnableModule || multisigInfo
            ? "Signature collected."
            : "Awaiting action",
      execute: isExecutingEnableModule
        ? "Executing module enable transaction..."
        : isProposingEnableModule
          ? "Publishing to Safe Transaction Service..."
          : multisigInfo
            ? `Awaiting co-signers (threshold: ${multisigInfo.threshold}).`
            : "Ready",
    }),
    [
      isCreating,
      isValidatingExisting,
      isEnablingModule,
      isSigningEnableModule,
      isExecutingEnableModule,
      isProposingEnableModule,
      multisigInfo,
    ],
  );

  const selectedOption = selectedSafeWallet
    ? getWalletDisplayName(selectedSafeWallet)
    : "Select a Safe Wallet";

  return (
    <div className="space-y-6">
      <RadioGroup
        label="Execution Mode"
        options={[
          { label: "Smart Contract", value: "contract" },
          { label: "Smart Contract Wallet", value: "safe" },
        ]}
        value={executionMode}
        onChange={(value) =>
          handleExecutionModeChange(value as "contract" | "safe")
        }
        name="execution-mode"
        disabled={disabled}
      />

      {executionMode === "safe" && (
        <div className="space-y-6">
          {isLoading ? (
            <Skeleton height={50} borderRadius={12} />
          ) : (
            <>
              {shouldShowStatus && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <Typography
                    variant="caption"
                    color="secondary"
                    className="uppercase tracking-wide text-xs text-[#A2A2A2]"
                  >
                    Status
                  </Typography>
                  <div className="space-y-3">
                    {STEP_ORDER.map((step) => {
                      const state = getStepState(step);
                      const isCurrent = state === "current";
                      const indicatorClass =
                        state === "completed"
                          ? "bg-emerald-400"
                          : state === "current"
                            ? "bg-blue-500 animate-pulse"
                            : "bg-white/30";

                      return (
                        <div key={step} className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${indicatorClass}`}
                          />
                          <div className="flex-1 space-y-1">
                            <Typography
                              variant="caption"
                              color="secondary"
                              className={
                                isCurrent ? "text-white" : "text-[#A2A2A2]"
                              }
                              align="left"
                            >
                              {STEP_LABELS[step]}
                            </Typography>
                            {(isCurrent ||
                              (step === "execute" && multisigInfo)) && (
                              <Typography
                                variant="caption"
                                color="secondary"
                                className="text-xs text-[#A2A2A2]"
                                align="left"
                              >
                                {stepDescriptions[step]}
                              </Typography>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Dropdown
                label="Safe Wallet"
                options={dropdownOptions}
                selectedOption={selectedOption}
                onChange={handleDropdownChange}
                disabled={
                  disabled ||
                  isCreating ||
                  isEnablingModule ||
                  isValidatingExisting ||
                  isSigningEnableModule ||
                  isExecutingEnableModule ||
                  isProposingEnableModule
                }
              />

              {!isSafeSupported && (
                <Typography
                  variant="caption"
                  color="secondary"
                  className="text-xs text-[#A2A2A2] pl-3"
                  align="left"
                >
                  Add Existing Safe Wallet is available only on Safe-supported
                  networks.
                </Typography>
              )}

              {showAddExistingForm && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
                  <Typography variant="h4" color="primary">
                    Add Existing Safe Wallet
                  </Typography>

                  <div className="space-y-2">
                    <Typography variant="caption" color="secondary">
                      Safe Address
                    </Typography>
                    <input
                      type="text"
                      value={existingSafeAddress}
                      onChange={(e) => setExistingSafeAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/30 transition-colors"
                      disabled={isValidatingExisting}
                    />
                  </div>

                  {addExistingError && (
                    <Typography variant="caption" className="text-red-400">
                      {addExistingError}
                    </Typography>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitExistingSafe}
                      disabled={
                        isValidatingExisting || !existingSafeAddress.trim()
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isValidatingExisting ? "Validating..." : "Add Safe"}
                    </button>
                    <button
                      onClick={handleCancelAddExisting}
                      disabled={isValidatingExisting}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    <Typography variant="caption" color="secondary">
                      Requirements:
                    </Typography>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Safe contract must exist on this network</li>
                      <li>Your connected wallet must be an owner</li>
                      <li>
                        The TriggerX module will be prepared for enablement
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {multisigInfo && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Typography variant="h4" color="primary">
                      Pending Transaction ({multisigInfo.threshold} of{" "}
                      {multisigInfo.owners.length} signatures required)
                    </Typography>
                    <button
                      onClick={handleManualRefresh}
                      disabled={isCheckingModuleStatus}
                      className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/60 bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Check if module has been enabled"
                    >
                      <MdRefresh
                        size={14}
                        className={isCheckingModuleStatus ? "animate-spin" : ""}
                      />
                      {isCheckingModuleStatus ? "Checking..." : "Refresh"}
                    </button>
                  </div>
                  <Typography variant="caption" color="secondary" align="left">
                    The module enablement transaction has been created and is
                    waiting for{" "}
                    {multisigInfo.threshold === 1
                      ? "1 more signature"
                      : `${multisigInfo.threshold - 1} more signatures`}{" "}
                    from the Safe owners.
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {multisigInfo.queueUrl && (
                      <a
                        href={multisigInfo.queueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-blue-500/60 bg-blue-500/20 px-4 py-2.5 text-sm font-medium text-blue-100 hover:bg-blue-500/30 transition-colors"
                      >
                        Open in Safe App
                        <MdOpenInNew size={16} />
                      </a>
                    )}
                  </div>
                  <Typography
                    variant="caption"
                    color="secondary"
                    className="text-xs text-[#A2A2A2]"
                    align="left"
                  >
                    Other Safe owners can sign this transaction in the Safe App.
                  </Typography>
                </div>
              )}

              {!multisigInfo && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                      <svg
                        className="w-4 h-4 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Typography
                        variant="h4"
                        color="primary"
                        className="text-sm font-medium"
                      >
                        About TriggerX Safe Module
                      </Typography>
                      <Typography
                        variant="caption"
                        color="secondary"
                        align="left"
                        className="text-xs text-[#A2A2A2] leading-relaxed"
                      >
                        The TriggerX module enables automated job execution
                        through your Safe wallet. It operates with{" "}
                        <span className="text-blue-400">
                          limited permissions
                        </span>{" "}
                        - only executing the tasks you define in the jobs.
                      </Typography>
                      <div className="space-y-1.5 text-xs text-[#A2A2A2]">
                        <div className="flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>
                            You maintain full ownership and control of your Safe
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>
                            Module only executes jobs you create and approve
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span>
                            You can disable the module anytime in Safe dashboard
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedSafeWallet && (
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-lg p-3">
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
                      color="secondary"
                      className="text-[#A2A2A2]"
                    >
                      {selectedSafeWallet}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {editingWallet === selectedSafeWallet ? (
                      <>
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
                            }
                          }}
                          className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/30 transition-colors"
                          placeholder="Enter wallet name"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            handleSaveWalletName(selectedSafeWallet)
                          }
                          className="p-2 text-[#A2A2A2] hover:text-white hover:bg-white/10 rounded transition-colors mb-0.5"
                          title="Save"
                        >
                          <MdCheck size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingWallet(null);
                            setEditingName("");
                          }}
                          className="p-2 text-[#A2A2A2] hover:text-white hover:bg-white/10 rounded transition-colors mb-0.5"
                          title="Cancel"
                        >
                          <MdClose size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Typography
                          variant="caption"
                          color="primary"
                          className="text-sm"
                        >
                          {getWalletDisplayName(selectedSafeWallet)}
                        </Typography>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingWallet(selectedSafeWallet);
                            setEditingName(
                              getWalletDisplayName(selectedSafeWallet),
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
    </div>
  );
};
