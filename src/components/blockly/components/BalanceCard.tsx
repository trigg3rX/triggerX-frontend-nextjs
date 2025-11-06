import React from "react";
import { Card } from "../../ui/Card";
import { Typography } from "../../ui/Typography";
import { LucideCopyButton } from "../../ui/CopyButton";

interface BalanceCardProps {
  address: string | undefined;
  userBalance: string | null;
  onRefresh: () => void;
}

export function BalanceCard({
  address,
  userBalance,
  onRefresh,
}: BalanceCardProps) {
  if (!address) return null;

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#C07AF6]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex flex-col items-start">
            <Typography variant="body" className="font-medium">
              Your TG Balance
            </Typography>
            <Typography variant="caption" color="secondary" className="text-xs">
              {address.slice(0, 6)}...{address.slice(-4)}
              <LucideCopyButton text={address} />
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Typography variant="body" color="secondary" className="font-mono">
            {userBalance !== null && userBalance !== undefined
              ? Number(userBalance).toFixed(6)
              : "0.000000"}{" "}
            TG
          </Typography>
          <button
            onClick={onRefresh}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Refresh balance"
            title="Refresh balance"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}
