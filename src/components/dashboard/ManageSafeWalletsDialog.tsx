"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { TextInput } from "../ui/TextInput";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useSafeAssetBalances } from "@/hooks/useSafeAssetBalances";
import { useSafeTransact } from "@/hooks/useSafeTransact";
import { useChainId } from "wagmi";
import { TokenBalance } from "@/utils/fetchTokenBalances";
import TokenRow from "./TokenRow";
import { ethers } from "ethers";

interface ManageSafeWalletsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManageSafeWalletsDialog: React.FC<ManageSafeWalletsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const chainId = useChainId();
  const { safeWallets, isLoading } = useSafeWallets();
  const [selectedSafe, setSelectedSafe] = useState<string>("");

  // Asset balances
  const {
    balances,
    isLoading: isLoadingBalances,
    error: balancesError,
    hideZeroBalances,
    setHideZeroBalances,
    refetch: refetchBalances,
  } = useSafeAssetBalances(selectedSafe);

  // Transaction handling
  const { sendNativeFromSafe, sendErc20FromSafe, isSending } =
    useSafeTransact();

  // Send form state
  const [showSendForm, setShowSendForm] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sendError, setSendError] = useState("");

  // Reset selected safe when dialog opens
  useEffect(() => {
    if (open && safeWallets.length > 0) {
      setSelectedSafe(safeWallets[0]);
    }
  }, [open, safeWallets]);

  // Reset send form when dialog closes or safe changes
  useEffect(() => {
    if (!open || !selectedSafe) {
      setShowSendForm(false);
      setSelectedToken(null);
      setRecipient("");
      setAmount("");
      setSendError("");
    }
  }, [open, selectedSafe]);

  const formatSafeAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const dropdownOptions: DropdownOption[] = safeWallets.map((wallet) => ({
    id: wallet,
    name: formatSafeAddress(wallet),
  }));

  const handleSafeSelect = (option: DropdownOption) => {
    setSelectedSafe(option.id as string);
  };

  const handleSendClick = (token: TokenBalance) => {
    setSelectedToken(token);
    setShowSendForm(true);
    setSendError("");
  };

  const handleSendSubmit = async () => {
    if (!selectedToken || !selectedSafe) return;

    setSendError("");

    // Validation
    if (!recipient.trim()) {
      setSendError("Recipient address is required");
      return;
    }

    if (!ethers.isAddress(recipient)) {
      setSendError("Invalid recipient address");
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      setSendError("Amount must be greater than 0");
      return;
    }

    if (parseFloat(amount) > parseFloat(selectedToken.balanceFormatted)) {
      setSendError("Insufficient balance");
      return;
    }

    try {
      let success = false;

      if (selectedToken.isNative) {
        success = await sendNativeFromSafe(selectedSafe, recipient, amount);
      } else {
        success = await sendErc20FromSafe(
          selectedSafe,
          selectedToken.address,
          recipient,
          amount,
          selectedToken.decimals,
        );
      }

      if (success) {
        // Reset form and refresh balances
        setShowSendForm(false);
        setSelectedToken(null);
        setRecipient("");
        setAmount("");
        // Refresh balances after a delay to allow blockchain to update
        setTimeout(() => {
          refetchBalances();
        }, 3000);
      }
    } catch (error) {
      console.error("Send transaction error:", error);
      setSendError(
        error instanceof Error ? error.message : "Transaction failed",
      );
    }
  };

  const handleCancelSend = () => {
    setShowSendForm(false);
    setSelectedToken(null);
    setRecipient("");
    setAmount("");
    setSendError("");
  };

  const getSafeWebUrl = (safeAddress: string) => {
    // Only Arbitrum mainnet is supported by Safe web app for now
    if (chainId === 42161) {
      return `https://app.safe.global/home?safe=arb1:${safeAddress}`;
    }
    return null;
  };

  const safeWebUrl = selectedSafe ? getSafeWebUrl(selectedSafe) : null;

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      className="max-w-2xl w-[95%] sm:w-full"
    >
      <div className="space-y-6">
        <Typography variant="h2" color="white" align="left">
          Manage Safe Wallets
        </Typography>

        {isLoading ? (
          <div className="text-center py-8">
            <Typography variant="body" color="secondary">
              Loading Safe wallets...
            </Typography>
          </div>
        ) : safeWallets.length === 0 ? (
          <div className="text-center py-8">
            <Typography variant="body" color="secondary">
              No Safe wallets found. Create one first to manage assets.
            </Typography>
          </div>
        ) : (
          <>
            {/* Safe Wallet Selector */}
            <div className="space-y-2">
              <Typography variant="body" color="white">
                Select Safe Wallet
              </Typography>
              <Dropdown
                options={dropdownOptions}
                selectedOption={
                  selectedSafe ? formatSafeAddress(selectedSafe) : ""
                }
                onChange={handleSafeSelect}
                className="w-full"
              />
            </div>

            {selectedSafe && (
              <>
                {/* Safe Web Link */}
                {safeWebUrl && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => window.open(safeWebUrl, "_blank")}
                      className="text-sm px-4 py-2"
                    >
                      Open in Safe
                    </Button>
                  </div>
                )}

                {/* Balances Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography variant="h3" color="white">
                      Asset Balances
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => refetchBalances()}
                        disabled={isLoadingBalances}
                        className="text-xs px-3 py-1"
                      >
                        Refresh
                      </Button>
                      <Button
                        onClick={() => setHideZeroBalances(!hideZeroBalances)}
                        className="text-xs px-3 py-1"
                      >
                        {hideZeroBalances ? "Show All" : "Hide Zero"}
                      </Button>
                    </div>
                  </div>

                  {isLoadingBalances ? (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
                      <Typography
                        variant="body"
                        color="secondary"
                        align="center"
                      >
                        Loading balances...
                      </Typography>
                    </div>
                  ) : balancesError ? (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-red-500/20">
                      <Typography variant="body" color="error" align="center">
                        Error loading balances: {balancesError}
                      </Typography>
                    </div>
                  ) : balances.length === 0 ? (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
                      <Typography
                        variant="body"
                        color="secondary"
                        align="center"
                      >
                        No assets found
                      </Typography>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {balances.map((token) => (
                        <TokenRow
                          key={token.address}
                          token={token}
                          onSendClick={handleSendClick}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Send Form */}
                {showSendForm && selectedToken && (
                  <div className="space-y-4 bg-[#0a0a0a] rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <Typography variant="h3" color="white">
                        Send {selectedToken.symbol}
                      </Typography>
                      <Button
                        onClick={handleCancelSend}
                        className="text-sm px-2 py-1"
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Typography
                          variant="body"
                          color="white"
                          className="mb-2"
                        >
                          Recipient Address
                        </Typography>
                        <TextInput
                          value={recipient}
                          onChange={setRecipient}
                          placeholder="0x..."
                        />
                      </div>

                      <div>
                        <Typography
                          variant="body"
                          color="white"
                          className="mb-2"
                        >
                          Amount
                        </Typography>
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <TextInput
                              value={amount}
                              onChange={setAmount}
                              placeholder="0.0"
                              type="number"
                            />
                          </div>
                          <Button
                            onClick={() =>
                              setAmount(selectedToken.balanceFormatted)
                            }
                            className="text-sm px-3 py-2 whitespace-nowrap"
                          >
                            Max
                          </Button>
                        </div>
                        <Typography
                          variant="body"
                          color="secondary"
                          className="text-sm mt-1"
                        >
                          Available: {selectedToken.balanceFormatted}{" "}
                          {selectedToken.symbol}
                        </Typography>
                      </div>

                      {sendError && (
                        <Typography
                          variant="body"
                          color="error"
                          className="text-sm"
                        >
                          {sendError}
                        </Typography>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSendSubmit}
                          disabled={isSending || !recipient || !amount}
                          className="flex-1"
                        >
                          {isSending ? "Sending..." : "Send"}
                        </Button>
                        <Button
                          onClick={handleCancelSend}
                          disabled={isSending}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ManageSafeWalletsDialog;
