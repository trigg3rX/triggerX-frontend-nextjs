"use client";

import React, { useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { useWallet } from "@/contexts/WalletContext";

interface BalanceDisplayProps {
  className?: string;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ className }) => {
  const { address } = useAccount();
  const { refreshBalance } = useWallet();

  const { data, refetch, isLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    query: {
      refetchInterval: 5000,
    },
  });

  useEffect(() => {
    if (address) {
      // console.log("BalanceDisplay: Balance refresh triggered by address or context's refreshBalance");
      refetch();
    }
  }, [address, refreshBalance, refetch]);

  if (!address || !data || isLoading) {
    return null; // Or a loading indicator
  }

  return (
    <div
      className={`bg-[#f8ff7c] px-4 py-[5px] rounded-full border border-[#f8ff7c] text-nowrap ${className}`}
    >
      <span className="text-black text-sm font-bold h-[24px]">
        {Number(data.formatted).toFixed(2)} {data.symbol}
      </span>
    </div>
  );
};

export default BalanceDisplay;
