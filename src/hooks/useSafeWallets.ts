import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import { getSafeWalletFactoryAddress } from "@/utils/contractAddresses";
import TriggerXSafeFactoryArtifact from "@/artifacts/TriggerXSafeFactory.json";

export const useSafeWallets = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [safeWallets, setSafeWallets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSafeWallets = useCallback(
    async (retryCount = 0) => {
      if (!address) {
        setSafeWallets([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const factoryAddress = getSafeWalletFactoryAddress(chainId);
        if (!factoryAddress) {
          throw new Error(
            "Safe Wallet Factory address not configured for this network",
          );
        }

        if (typeof window.ethereum === "undefined") {
          throw new Error("Please install MetaMask");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          factoryAddress,
          TriggerXSafeFactoryArtifact.abi,
          provider,
        );

        const wallets = await contract.getSafeWallets(address);
        setSafeWallets(wallets);
      } catch (err) {
        console.error("Error fetching Safe wallets:", err);

        // Retry logic for network issues
        if (retryCount < 2) {
          console.log(`Retrying fetchSafeWallets, attempt ${retryCount + 1}`);
          setTimeout(
            () => {
              fetchSafeWallets(retryCount + 1);
            },
            2000 * (retryCount + 1),
          );
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to fetch Safe wallets",
        );
        setSafeWallets([]);
      } finally {
        setIsLoading(false);
      }
    },
    [address, chainId],
  );

  useEffect(() => {
    fetchSafeWallets();
  }, [fetchSafeWallets]);

  return { safeWallets, isLoading, error, refetch: fetchSafeWallets };
};
