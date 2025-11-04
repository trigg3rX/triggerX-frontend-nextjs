import { useState, useCallback, useEffect } from "react";
import type { InterfaceAbi, Eip1193Provider } from "ethers";
import { ethers, BrowserProvider, Contract } from "ethers";
import { useChainId } from "wagmi";
import SafeArtifact from "@/artifacts/Safe.json";
import { getSafeModuleAddress } from "@/utils/contractAddresses";

// Per-chain storage key prefix
const STORAGE_PREFIX = "triggerx_safe_module_status_";

function toChecksum(address: string): string {
  return ethers.getAddress(address);
}

// Get dict from storage for a specific chain
function getAllStoredStatuses(chainId: number): Record<string, boolean> {
  if (typeof window === "undefined") return {};

  // Try chain-specific storage first
  const chainKey = `${STORAGE_PREFIX}${chainId}`;
  const chainRaw = window.localStorage.getItem(chainKey);
  try {
    if (chainRaw) return JSON.parse(chainRaw);
  } catch {}
  return {};
}

// Set dict to storage for a specific chain
function setAllStoredStatuses(chainId: number, obj: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  const chainKey = `${STORAGE_PREFIX}${chainId}`;
  window.localStorage.setItem(chainKey, JSON.stringify(obj));
}

/**
 * Get the status of the Safe module for a given safe address
 * If the status is not in the local storage, it will call the contract to get the status otherwise it will return the status from the local storage
 * @param safeAddress - The address of the Safe wallet
 * @param chainId - The chain ID
 * @returns The status of the Safe module, or null if the contract call fails
 */
export async function getModuleStatus(
  safeAddress: string,
  chainId: number,
): Promise<boolean | null> {
  try {
    // First check if the status is in the local storage
    const key = toChecksum(safeAddress);
    const fromStore = getAllStoredStatuses(chainId);
    if (fromStore[key] !== undefined) {
      return fromStore[key];
    }
    // If not in storage, call contract once
    const moduleAddress = getSafeModuleAddress(chainId);
    if (!moduleAddress) return null;
    if (typeof window === "undefined") return null;
    const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
    if (!eth) return null;
    const provider = new BrowserProvider(eth);
    const abi = (SafeArtifact as { abi: InterfaceAbi }).abi;
    const contract = new Contract(key, abi, await provider.getSigner());
    const enabled: boolean = await contract.isModuleEnabled(moduleAddress);
    // Update localStorage
    setModuleStatus(key, chainId, enabled);
    return enabled;
  } catch {
    return null;
  }
}

// To set the status of the Safe module for a given safe address in the local storage
export function setModuleStatus(
  safeAddress: string,
  chainId: number,
  enabled: boolean,
) {
  const key = toChecksum(safeAddress);
  const data = getAllStoredStatuses(chainId);
  data[key] = enabled;
  setAllStoredStatuses(chainId, data);
}

// To clear the cached status and force a fresh check from blockchain
export function clearModuleStatusCache(safeAddress: string, chainId: number) {
  const key = toChecksum(safeAddress);
  const data = getAllStoredStatuses(chainId);
  delete data[key];
  setAllStoredStatuses(chainId, data);
}

// Hook to get the status of the Safe module for a given safe address
export function useSafeModuleStatus(
  safeAddress?: string,
): [boolean | null, () => Promise<void>, boolean] {
  const chainId = useChainId();
  const [status, setStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!safeAddress) {
      setStatus(null);
      return;
    }
    setLoading(true);
    const stat = await getModuleStatus(safeAddress, chainId);
    setStatus(stat);
    setLoading(false);
  }, [safeAddress, chainId]);

  useEffect(() => {
    if (!safeAddress) {
      setStatus(null);
      return;
    }
    // When address or chain changes, fetch (fast if in storage)
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeAddress, chainId]);

  return [status, refresh, loading];
}
