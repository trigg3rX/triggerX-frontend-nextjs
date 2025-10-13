import React, { useEffect, useState } from "react";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { useAccount, useChainId } from "wagmi";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import { Typography } from "@/components/ui/Typography";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { getSafeModuleAddress } from "@/utils/contractAddresses";
import TriggerXSafeModuleArtifact from "@/artifacts/TriggerXSafeModule.json";

interface SafeWalletSelectorProps {
  disabled?: boolean;
}

// Local storage key for wallet names
const WALLET_NAMES_KEY = "triggerx_safe_wallet_names";

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

export const SafeWalletSelector: React.FC<SafeWalletSelectorProps> = ({ disabled = false }) => {
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
  const { createSafeWallet, enableModule, isCreating, isEnablingModule } =
    useCreateSafeWallet();

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Update context when Safe wallets are fetched
  useEffect(() => {
    if (safeWallets.length > 0) {
      setUserSafeWallets(safeWallets);
    }
  }, [safeWallets, setUserSafeWallets]);

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
          JSON.stringify(TriggerXSafeModuleArtifact.abi)
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
        JSON.stringify(TriggerXSafeModuleArtifact.abi)
      );
    }
  };

  const handleCreateNewSafe = async () => {
    if (!address) return;

    const safeAddress = await createSafeWallet(address);
    if (safeAddress) {
      // Enable module on the newly created Safe
      const moduleEnabled = await enableModule(safeAddress);
      if (moduleEnabled) {
        // Refetch Safe wallets to include the new one
        await refetch();
        // Auto-select the newly created Safe
        await handleSafeWalletSelect(safeAddress);
      }
    }
  };

  const handleDropdownChange = async (option: DropdownOption) => {
    if (option.id === "create-new") {
      await handleCreateNewSafe();
    } else {
      const walletAddress = option.id as string;
      // Enable module first
      const moduleEnabled = await enableModule(walletAddress);
      if (moduleEnabled) {
        await handleSafeWalletSelect(walletAddress);
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

  // Build dropdown options
  const dropdownOptions: DropdownOption[] = [
    ...userSafeWallets.map((wallet) => ({
      id: wallet,
      name: getWalletDisplayName(wallet),
    })),
    {
      id: "create-new",
      name: "+ Create New Safe Wallet",
    },
  ];

  const selectedOption = selectedSafeWallet 
    ? getWalletDisplayName(selectedSafeWallet)
    : "Select a Safe Wallet";

  return (
    <div className="space-y-6">
      <RadioGroup
        label="Execution Mode"
        options={[
          { label: "Regular Contract", value: "contract" },
          { label: "Safe Wallet", value: "safe" },
        ]}
        value={executionMode}
        onChange={(value) => handleExecutionModeChange(value as "contract" | "safe")}
        name="execution-mode"
        disabled={disabled}
      />

      {executionMode === "safe" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
              <Typography variant="body" color="secondary" className="pl-2">
                Loading Safe wallets...
              </Typography>
            </div>
          ) : (
            <>
              <Dropdown
                label="Safe Wallet"
                options={dropdownOptions}
                selectedOption={selectedOption}
                onChange={handleDropdownChange}
                disabled={disabled || isCreating || isEnablingModule}
              />

              {(isCreating || isEnablingModule) && (
                <Typography variant="caption" color="secondary" className="ml-auto w-full md:w-[70%]">
                  {isCreating ? "Creating Safe wallet..." : "Enabling module..."}
                </Typography>
              )}

              {selectedSafeWallet && (
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <Typography variant="body" color="secondary">
                      Selected Safe:
                    </Typography>
                    <div className="flex items-center gap-2">
                      {editingWallet === selectedSafeWallet ? (
                        <>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveWalletName(selectedSafeWallet);
                              if (e.key === "Escape") {
                                setEditingWallet(null);
                                setEditingName("");
                              }
                            }}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                            placeholder="Enter wallet name"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveWalletName(selectedSafeWallet)}
                            className="text-green-500 hover:text-green-400 text-sm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditingWallet(null);
                              setEditingName("");
                            }}
                            className="text-red-500 hover:text-red-400 text-sm"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <Typography variant="body" color="primary" className="font-mono">
                            {selectedSafeWallet}
                          </Typography>
                          <button
                            onClick={() => {
                              setEditingWallet(selectedSafeWallet);
                              setEditingName(getWalletDisplayName(selectedSafeWallet));
                            }}
                            className="text-blue-500 hover:text-blue-400 text-sm"
                            title="Edit wallet name"
                          >
                            ✏️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Typography variant="caption" color="secondary" className="text-blue-400">
              <strong>Note:</strong> When using Safe wallet execution:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The contract address will be automatically set to the Safe Module</li>
                <li>Only dynamic parameters from IPFS are supported</li>
                <li>The Safe wallet will execute actions on your behalf</li>
              </ul>
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
};

