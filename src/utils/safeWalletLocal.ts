const EXTRA_SAFES_KEY_PREFIX = "triggerx_extra_safe_wallets_";

/**
 * Get list of user-imported Safe wallets for a specific chain
 */
export const getExtraSafes = (chainId: number): string[] => {
  if (typeof window === "undefined") return [];
  const key = `${EXTRA_SAFES_KEY_PREFIX}${chainId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};

/**
 * Add a Safe wallet address to the extra safes list for a specific chain
 */
export const addExtraSafe = (chainId: number, safeAddr: string): void => {
  if (typeof window === "undefined") return;
  const key = `${EXTRA_SAFES_KEY_PREFIX}${chainId}`;
  const list = getExtraSafes(chainId);
  const normalized = safeAddr.toLowerCase();

  if (!list.find((s) => s.toLowerCase() === normalized)) {
    const updated = [...list, safeAddr];
    localStorage.setItem(key, JSON.stringify(updated));
  }
};

/**
 * Merge API-fetched Safe wallets with locally imported ones
 */
export const mergeApiAndExtraSafes = (
  apiSafes: string[],
  chainId: number,
): string[] => {
  const extras = getExtraSafes(chainId);
  return Array.from(new Set([...apiSafes, ...extras]));
};
