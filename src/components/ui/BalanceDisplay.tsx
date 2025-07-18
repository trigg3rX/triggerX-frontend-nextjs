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
      refetch();
    }
  }, [address, refreshBalance, refetch]);

  if (!address || !data || isLoading) {
    return null; // Or a loading indicator
  }

  return (
    <div
      className={`bg-[#f8ff7c] text-black px-3 xl:px-4 py-[9px] xl:py-[8px] hover:scale-[1.03] rounded-full border border-[#f8ff7c] text-nowrap text-sm xl:text-base ${className}`}
    >
      <span className=" h-[24px]">
        {Number(data.formatted).toFixed(4)} {data.symbol}
      </span>
    </div>
  );
};

export default BalanceDisplay;
