import React, { useEffect, useState } from "react";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { useAccount, useChainId } from "wagmi";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import { Typography } from "@/components/ui/Typography";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";
import { RadioGroup } from "@/components/ui/RadioGroup";
import Skeleton from "@/components/ui/Skeleton";
import { getSafeModuleAddress } from "@/utils/contractAddresses";
import TriggerXSafeModuleArtifact from "@/artifacts/TriggerXSafeModule.json";
import { MdEdit, MdCheck, MdClose } from "react-icons/md";

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
      // Enable module on the newly created Safe
      const moduleEnabled = await enableModule(safeAddress);
      if (moduleEnabled) {
        // Wait a bit for blockchain state to update, then refetch
        setTimeout(async () => {
          await refetch();
          // Auto-select the newly created Safe
          await handleSafeWalletSelect(safeAddress);
        }, 3000);
      }
    }
  };

  const handleDropdownChange = async (option: DropdownOption) => {
    if (option.id === "create-new") {
      await handleCreateNewSafe();
    } else {
      const walletAddress = option.id as string;
      try {
        // Enable module first
        const moduleEnabled = await enableModule(walletAddress);
        if (moduleEnabled) {
          await handleSafeWalletSelect(walletAddress);
        } else {
          // Even if module enabling reports failure, try to select the wallet
          // The user reported that it works on second attempt
          console.warn(
            "Module enabling reported failure, but attempting to select wallet anyway",
          );
          await handleSafeWalletSelect(walletAddress);
        }
      } catch (error) {
        console.error("Error in handleDropdownChange:", error);
        // Still try to select the wallet as the user mentioned it works on retry
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
                disabled={disabled || isCreating || isEnablingModule}
              />

              {(isCreating || isEnablingModule) && (
                <Typography
                  variant="caption"
                  color="secondary"
                  align="left"
                  className="ml-auto w-full md:w-[70%] mt-2 pl-3"
                >
                  {isCreating
                    ? "Creating Safe wallet..."
                    : "Enabling module..."}
                </Typography>
              )}

              {selectedSafeWallet && (
                <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-lg p-3 my-6">
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

          <div className="text-xs bg-yellow-100 text-yellow-800 p-4 rounded-lg my-6">
            <Typography
              variant="caption"
              className="text-yellow-800"
              align="left"
            >
              When using Safe wallet execution:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  The contract address will be automatically set to the Safe
                  Module
                </li>
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
