import { useState, useCallback, useEffect } from "react";
import type { InterfaceAbi, Eip1193Provider } from "ethers";
import { ethers, BrowserProvider, Contract } from "ethers";
import SafeArtifact from "@/artifacts/Safe.json";

const LOCALSTORAGE_KEY = "triggerx_safe_module_status";
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_SAFE_MODULE_ADDRESS as
  | string
  | undefined;

function toChecksum(address: string): string {
  return ethers.getAddress(address);
}

// Get dict from storage
function getAllStoredStatuses(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(LOCALSTORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Set dict to storage
function setAllStoredStatuses(obj: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(obj));
}

/**
 * Get the status of the Safe module for a given safe address
 * If the status is not in the local storage, it will call the contract to get the status otherwise it will return the status from the local storage
 * @param safeAddress - The address of the Safe wallet
 * @returns The status of the Safe module, or null if the contract call fails
 */
export async function getModuleStatus(
  safeAddress: string,
): Promise<boolean | null> {
  try {
    // First check if the status is in the local storage
    const key = toChecksum(safeAddress);
    const fromStore = getAllStoredStatuses();
    if (fromStore[key] !== undefined) {
      return fromStore[key];
    }
    // If not in storage, call contract once
    if (!MODULE_ADDRESS) return null;
    if (typeof window === "undefined") return null;
    const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
    if (!eth) return null;
    const provider = new BrowserProvider(eth);
    const abi = (SafeArtifact as { abi: InterfaceAbi }).abi;
    const contract = new Contract(key, abi, await provider.getSigner());
    const enabled: boolean = await contract.isModuleEnabled(MODULE_ADDRESS);
    // Update localStorage
    setModuleStatus(key, enabled);
    return enabled;
  } catch {
    return null;
  }
}

// To set the status of the Safe module for a given safe address in the local storage
export function setModuleStatus(safeAddress: string, enabled: boolean) {
  const key = toChecksum(safeAddress);
  const data = getAllStoredStatuses();
  data[key] = enabled;
  setAllStoredStatuses(data);
}

// Hook to get the status of the Safe module for a given safe address
export function useSafeModuleStatus(
  safeAddress?: string,
): [boolean | null, () => Promise<void>, boolean] {
  const [status, setStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!safeAddress) {
      setStatus(null);
      return;
    }
    setLoading(true);
    const stat = await getModuleStatus(safeAddress);
    setStatus(stat);
    setLoading(false);
  }, [safeAddress]);

  useEffect(() => {
    if (!safeAddress) {
      setStatus(null);
      return;
    }
    // When address changes, fetch (fast if in storage)
    //  only refresh when safeAddress changes so we don't need to refresh when other dependencies change
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeAddress]);

  return [status, refresh, loading];
}
