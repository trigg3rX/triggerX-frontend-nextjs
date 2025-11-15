import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import { getSafeWalletFactoryAddress } from "@/utils/contractAddresses";
import TriggerXSafeFactoryArtifact from "@/artifacts/TriggerXSafeFactory.json";
import { mergeApiAndExtraSafes } from "@/utils/safeWalletLocal";

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
        // 1) Try API from Safe accounts by network if configured
        const getBaseUrlForChain = (id: number): string | undefined => {
          switch (id) {
            // OP Sepolia
            case 11155420:
              return process.env.NEXT_PUBLIC_OP_SEPOLIA_SAFE_ACCOUNTS_BASE_URL;
            // Base Sepolia
            case 84532:
              return process.env
                .NEXT_PUBLIC_BASE_SEPOLIA_SAFE_ACCOUNTS_BASE_URL;
            // Arbitrum mainnet
            case 42161:
              return process.env
                .NEXT_PUBLIC_ARBITRUM_MAINNET_SAFE_ACCOUNTS_BASE_URL;
            // Arbitrum Sepolia not supported yet
            default:
              return undefined;
          }
        };

        const baseUrl = getBaseUrlForChain(Number(chainId));

        let fetchedViaApi = false;
        if (baseUrl) {
          // Ensure checksum address for API compatibility
          // Skipped that part for now as wagmi hook useAccount() returns the checksum address
          // TODO: If not using wagmi hook, we need to add the checksum address validation here for the API request

          const normalized = baseUrl.replace(/\/$/, "");
          const url = `${normalized}/api/v1/owners/${address}/safes`;
          const resp = await fetch(url, { method: "GET" });
          if (!resp.ok) {
            throw new Error(`API responded with ${resp.status}`);
          }
          const data = (await resp.json()) as { safes?: string[] };
          if (Array.isArray(data?.safes)) {
            const merged = mergeApiAndExtraSafes(data.safes, Number(chainId));
            setSafeWallets(merged);
            fetchedViaApi = true;
          } else {
            throw new Error("Malformed API response: missing safes array");
          }
        }

        // 2) Fallback to contract method (or primary for unsupported networks)
        if (!fetchedViaApi) {
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
          const merged = mergeApiAndExtraSafes(wallets, Number(chainId));
          setSafeWallets(merged);
        }
      } catch (err) {
        // Retry logic for network issues
        if (retryCount < 2) {
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
