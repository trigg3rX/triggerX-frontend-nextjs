import { useState, useCallback, useEffect, useRef } from "react";
import type { InterfaceAbi, Eip1193Provider } from "ethers";
import { ethers, BrowserProvider, Contract } from "ethers";
import { useChainId } from "wagmi";
import SafeArtifact from "@/artifacts/Safe.json";
import { getSafeModuleAddress } from "@/utils/contractAddresses";

function toChecksum(address: string): string {
  return ethers.getAddress(address);
}

/**
 * Get the status of the Safe module for a given safe address
 * Always fetches fresh data from blockchain (no caching)
 * @param safeAddress - The address of the Safe wallet
 * @param chainId - The chain ID
 * @returns The status of the Safe module, or null if the contract call fails
 */
export async function getModuleStatus(
  safeAddress: string,
  chainId: number,
): Promise<boolean | null> {
  try {
    const key = toChecksum(safeAddress);

    // Fetch from blockchain (always fresh, no cache)
    const moduleAddress = getSafeModuleAddress(chainId);
    if (!moduleAddress) return null;
    if (typeof window === "undefined") return null;
    const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
    if (!eth) return null;
    const provider = new BrowserProvider(eth);
    const abi = (SafeArtifact as { abi: InterfaceAbi }).abi;
    const contract = new Contract(key, abi, await provider.getSigner());
    const enabled: boolean = await contract.isModuleEnabled(moduleAddress);

    return enabled;
  } catch {
    return null;
  }
}

// Hook to get the status of the Safe module for a given safe address
export function useSafeModuleStatus(
  safeAddress?: string,
): [boolean | null, () => Promise<void>, boolean] {
  const chainId = useChainId();
  const [status, setStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!safeAddress) {
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      const stat = await getModuleStatus(safeAddress, chainId);
      if (mountedRef.current) {
        setStatus(stat);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [safeAddress, chainId]);

  // Reset status when address changes (but don't auto-fetch)
  useEffect(() => {
    mountedRef.current = true;

    if (!safeAddress) {
      setStatus(null);
      return;
    }

    // Status will be fetched manually when needed (on dialog close, dropdown select, etc.)
    setStatus(null);

    return () => {
      mountedRef.current = false;
    };
  }, [safeAddress, chainId]);

  return [status, refresh, loading];
}
