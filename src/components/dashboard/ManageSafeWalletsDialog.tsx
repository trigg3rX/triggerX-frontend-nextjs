"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../common/Dailog";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { TextInput } from "../ui/TextInput";
import { InputField } from "../ui/InputField";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useSafeAssetBalances } from "@/hooks/useSafeAssetBalances";
import { useSafeTransact } from "@/hooks/useSafeTransact";
import { useChainId } from "wagmi";
import { TokenBalance } from "@/utils/fetchTokenBalances";
import TokenRow from "./TokenRow";
import { ethers } from "ethers";
import Skeleton from "../ui/Skeleton";
import { IoMdRefresh } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";

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

  // Render main view
  const renderMainView = () => (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-6">
          {/* Safe Wallet Selector Skeleton */}
          <div className="space-y-2">
            <Skeleton height={20} width="40%" />
            <Skeleton height={48} borderRadius={8} />
          </div>

          {/* Asset Balances Section Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton height={24} width="30%" />
              <div className="flex items-center space-x-2">
                <Skeleton height={32} width={80} borderRadius={6} />
                <Skeleton height={32} width={90} borderRadius={6} />
              </div>
            </div>

            {/* Token rows skeleton */}
            <div className="space-y-2">
              <Skeleton height={60} borderRadius={8} />
              <Skeleton height={60} borderRadius={8} />
              <Skeleton height={60} borderRadius={8} />
            </div>
          </div>
        </div>
      ) : safeWallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[200px] text-[#A2A2A2] w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <Typography variant="h4" color="gray" className="text-center mb-2">
            ❌ No Safe wallets found
          </Typography>
          <Typography variant="body" color="gray" className="text-center">
            Create one first to manage assets.
          </Typography>
        </div>
      ) : (
        <>
          {/* Safe Wallet Selector */}
          <div className="space-y-4">
            <Dropdown
              label="Select Safe Wallet"
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
                    color="yellow"
                    onClick={() => window.open(safeWebUrl, "_blank")}
                    className="text-sm px-4 py-2 w-full"
                  >
                    Open in Safe
                  </Button>
                </div>
              )}

              {/* Balances Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Typography variant="h3" color="white">
                    Assets
                  </Typography>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => refetchBalances()}
                      disabled={isLoadingBalances}
                      className="h-[36px] xs:h-[42px] sm:h-[48px]"
                    >
                      <IoMdRefresh className="text-sm" />
                    </Button>
                    <Button
                      onClick={() => setHideZeroBalances(!hideZeroBalances)}
                    >
                      {hideZeroBalances ? "Show All" : "Hide Zero Balances"}
                    </Button>
                  </div>
                </div>

                {isLoadingBalances ? (
                  <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
                    <Typography variant="body" color="secondary" align="center">
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
                    <Typography variant="body" color="secondary" align="center">
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
            </>
          )}
        </>
      )}
    </div>
  );

  // Render send form view
  const renderSendFormView = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSendSubmit();
      }}
      className="space-y-6"
    >
      {/* Send Form */}
      {selectedToken && (
        <div className="space-y-6">
          <div>
            <label className="block mb-2">
              <Typography variant="body" color="gray" align="left">
                Recipient Address
              </Typography>
            </label>
            <TextInput
              value={recipient}
              onChange={setRecipient}
              placeholder="0x..."
              className="rounded-xl w-full"
            />
          </div>

          <div>
            <label className="block mb-2">
              <Typography variant="body" color="gray" align="left">
                Amount ({selectedToken.symbol})
              </Typography>
            </label>
            <div className="relative w-full">
              <InputField
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="Enter amount"
                className="rounded-xl w-full pr-16"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray text-white border border-gray-500 text-xs font-semibold px-3 py-1 rounded-lg hover:scale-105 transition-all duration-200"
                style={{ minWidth: 40 }}
                onClick={() => setAmount(selectedToken.balanceFormatted)}
              >
                Max
              </button>
            </div>

            <Typography
              variant="body"
              color="gray"
              align="left"
              className="mt-3"
            >
              Available Balance:{" "}
              <span className="text-white">
                {selectedToken.balanceFormatted} {selectedToken.symbol}
              </span>
            </Typography>

            {sendError && (
              <div className="mt-3 p-3 bg-red-100 text-red-800 rounded-xl">
                <Typography
                  variant="body"
                  color="inherit"
                  align="left"
                  className="!m-0"
                >
                  <strong>Error:</strong> {sendError}
                </Typography>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {showSendForm ? (
            <DialogTitle>
              <button
                onClick={handleCancelSend}
                className="w-fit h-fit text-secondary hover:text-primary hover:scale-105 transition-all duration-200 hover:bg-[#ffffff0d] rounded-full p-1"
              >
                <IoArrowBack className="text-xl" />
              </button>
              <span className="ml-2">
                Send {selectedToken?.symbol || "Token"}
              </span>
            </DialogTitle>
          ) : (
            <DialogTitle>Manage Safe Wallets</DialogTitle>
          )}
        </DialogHeader>
        {showSendForm ? (
          <>
            {renderSendFormView()}
            <DialogFooter>
              <Button
                onClick={handleCancelSend}
                disabled={isSending}
                className="w-full"
                color="white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendSubmit}
                disabled={isSending || !recipient || !amount}
                className="w-full"
                color="yellow"
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          renderMainView()
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageSafeWalletsDialog;
