"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { TokenBalance } from "@/utils/fetchTokenBalances";

interface SendTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenBalance | null;
  recipient: string;
  onRecipientChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  onMax: () => void;
  onSubmit: () => void;
  isSending: boolean;
  sendError?: string;
}

const SendTokenModal: React.FC<SendTokenModalProps> = ({
  isOpen,
  onClose,
  token,
  recipient,
  onRecipientChange,
  amount,
  onAmountChange,
  onMax,
  onSubmit,
  isSending,
  sendError,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <Typography variant="h2" color="primary" align="left">
          {token ? `Send ${token.symbol}` : "Send"}
        </Typography>
        <hr className="border-white/20" />

        {/* Form Container */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            {/* Recipient Address Label */}
            <Typography variant="body" color="gray" align="left">
              Recipient Address
            </Typography>
            {/* Recipient Address Input */}
            <InputField
              value={recipient}
              onChange={onRecipientChange}
              placeholder="0x..."
              className="w-full"
            />
          </div>

          {/* Amount Input Container */}
          <div className="space-y-2">
            {/* Amount Input Label */}
            <Typography variant="body" color="gray" align="left">
              {token ? `Amount (${token.symbol})` : "Amount"}
            </Typography>
            {/* Amount Input Container (Relative Position) */}
            <div className="relative w-full">
              {/* Amount Input */}
              <InputField
                type="number"
                value={amount}
                onChange={onAmountChange}
                placeholder="Enter amount"
                className="pr-24"
              />
              {/* Max Button */}
              {token && (
                // Not used default button from UI
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray text-white border border-gray-500 text-xs font-semibold px-3 py-1 rounded-lg hover:scale-105 transition-all duration-200"
                  style={{ minWidth: 40 }}
                  onClick={onMax}
                >
                  Max
                </button>
              )}
            </div>

            {/* Available Balance */}
            {token && (
              <Typography variant="body" color="gray" align="left">
                Available Balance:{" "}
                <span className="text-white">
                  {token.balanceFormatted} {token.symbol}
                </span>
              </Typography>
            )}

            {/* Error Message */}
            {sendError && (
              <div className="p-3 bg-red-100 rounded-lg">
                <Typography
                  variant="caption"
                  color="error"
                  align="left"
                  className="!m-0"
                >
                  <strong>Error:</strong> {sendError}
                </Typography>
              </div>
            )}
          </div>

          {/*  Buttons Container */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSending || !recipient || !amount}
              className="flex-1"
            >
              {isSending ? "Sending..." : "Send"}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              color="purple"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SendTokenModal;
