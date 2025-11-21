import { useState, useEffect, useCallback } from "react";
import { useChainId } from "wagmi";
import {
  TokenBalance,
  fetchAllTokenBalances,
} from "@/utils/fetchTokenBalances";

export const useSafeAssetBalances = (safeAddress: string | null) => {
  const chainId = useChainId();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideZeroBalances, setHideZeroBalances] = useState(true);

  const fetchBalances = useCallback(
    async (retryCount = 0) => {
      if (!safeAddress) {
        setBalances([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tokenBalances = await fetchAllTokenBalances(safeAddress, chainId);
        setBalances(tokenBalances);
      } catch (err) {
        // Retry logic for network issues
        if (retryCount < 2) {
          setTimeout(
            () => {
              fetchBalances(retryCount + 1);
            },
            2000 * (retryCount + 1),
          );
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to fetch asset balances",
        );
        setBalances([]);
      } finally {
        setIsLoading(false);
      }
    },
    [safeAddress, chainId],
  );

  // Fetch balances when safeAddress or chainId changes
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Filter balances based on hideZeroBalances setting
  const filteredBalances = hideZeroBalances
    ? balances.filter((balance) => parseFloat(balance.balanceFormatted) > 0)
    : balances;

  return {
    balances: filteredBalances,
    allBalances: balances,
    isLoading,
    error,
    hideZeroBalances,
    setHideZeroBalances,
    refetch: fetchBalances,
  };
};
