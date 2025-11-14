"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSafeAssetBalances } from "@/hooks/useSafeAssetBalances";
import { useSafeTransact } from "@/hooks/useSafeTransact";
import { TokenBalance } from "@/utils/fetchTokenBalances";
import TokenRow from "@/components/dashboard/TokenRow";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import { RefreshCw } from "lucide-react";
import SendTokenModal from "@/components/safe-wallet/safe-tokens/SendTokenModal";
import CreateJobModal from "@/components/safe-wallet/safe-tokens/CreateJobModal";

interface SafeTokensProps {
  selectedSafe: string | null;
}

const SafeTokens: React.FC<SafeTokensProps> = ({ selectedSafe }) => {
  // Asset balances
  const {
    balances,
    isLoading: isLoadingBalances,
    error: balancesError,
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
  const [successMessage, setSuccessMessage] = useState("");
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [jobToken, setJobToken] = useState<TokenBalance | null>(null);

  // Reset send form when safe changes
  React.useEffect(() => {
    if (!selectedSafe) {
      setShowSendForm(false);
      setSelectedToken(null);
      setRecipient("");
      setAmount("");
      setSendError("");
      setSuccessMessage("");
    }
  }, [selectedSafe]);

  // Handler to open the send token modal
  const handleSendClick = (token: TokenBalance) => {
    setSelectedToken(token);
    setShowSendForm(true);
    setSendError("");
    setSuccessMessage("");
  };

  // Handler to open the create job modal
  const handleCreateJobClick = (token: TokenBalance) => {
    setJobToken(token);
    setShowCreateJobModal(true);
  };

  // Handler to send tokens from safe wallet to a recipient address
  const handleSendSubmit = async () => {
    if (!selectedToken || !selectedSafe || !recipient || !amount) {
      setSendError("Please fill in all fields");
      return;
    }

    try {
      setSendError("");
      setSuccessMessage("");
      let result:
        | { success: true; txHash: string; message?: string }
        | { success: false; error: string };
      if (selectedToken.isNative) {
        result = await sendNativeFromSafe(selectedSafe, recipient, amount);
      } else {
        result = await sendErc20FromSafe(
          selectedSafe,
          selectedToken.address,
          recipient,
          amount,
          selectedToken.decimals,
        );
      }

      if (result.success) {
        setSuccessMessage(
          result.message ?? "Transaction executed successfully",
        );
        // Refresh balances and close after a brief delay
        setTimeout(() => {
          refetchBalances();
          setShowSendForm(false);
          setSelectedToken(null);
          setRecipient("");
          setAmount("");
          setSendError("");
          setSuccessMessage("");
        }, 2000);
      } else {
        setSendError(result.error);
      }
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Transaction failed",
      );
    }
  };

  // Handler to close the send token modal
  const handleBackToTokens = () => {
    setShowSendForm(false);
    setSelectedToken(null);
    setRecipient("");
    setAmount("");
    setSendError("");
    setSuccessMessage("");
  };

  // If no safe is selected, show the token empty state with message "Select a safe wallet to view token balances"
  if (!selectedSafe) {
    return (
      <Card className="p-6">
        <EmptyState type="token" hasSelectedSafe={false} />
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between">
            <Typography variant="h2" color="primary" align="left">
              Token Balances
            </Typography>
            <Button
              onClick={() => refetchBalances()}
              disabled={isLoadingBalances}
            >
              <RefreshCw size={16} />
            </Button>
          </div>

          {/* Token List with skeleton loading for 5 tokens default */}
          {isLoadingBalances ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={60} borderRadius={8} />
              ))}
            </div>
          ) : balances.length === 0 || balancesError ? (
            // Empty state with message "No token data available" when no tokens are found
            <EmptyState type="token" hasSelectedSafe={true} />
          ) : (
            // Token List
            <div className="space-y-4">
              {balances.map((token) => (
                <TokenRow
                  key={token.address}
                  token={token}
                  onSendClick={handleSendClick}
                  onCreateJobClick={handleCreateJobClick}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Send Token Modal */}
      <SendTokenModal
        isOpen={showSendForm}
        onClose={handleBackToTokens}
        token={selectedToken}
        recipient={recipient}
        onRecipientChange={setRecipient}
        amount={amount}
        onAmountChange={setAmount}
        onMax={() => selectedToken && setAmount(selectedToken.balanceFormatted)}
        onSubmit={handleSendSubmit}
        isSending={isSending}
        sendError={sendError}
        successMessage={successMessage}
      />

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={showCreateJobModal}
        onClose={() => {
          setShowCreateJobModal(false);
          setJobToken(null);
        }}
        token={jobToken}
        safeAddress={selectedSafe}
      />
    </>
  );
};

export default SafeTokens;
