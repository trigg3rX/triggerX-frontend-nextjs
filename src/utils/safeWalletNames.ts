// Per-chain key prefix for safe wallet names
const WALLET_NAMES_KEY_PREFIX = "triggerx_safe_wallet_names_";

/**
 * Get wallet names for a specific chain
 */
export const getChainWalletNames = (
  chainId: number,
): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const key = `${WALLET_NAMES_KEY_PREFIX}${chainId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : {};
};

/**
 * Check if a wallet name is already taken on a specific chain
 * @param chainId - The chain ID
 * @param name - The name to check
 * @param excludeAddress - Optional address to exclude from the check (for renaming)
 */
export const isWalletNameTakenOnChain = (
  chainId: number,
  name: string,
  excludeAddress?: string,
): boolean => {
  const names = getChainWalletNames(chainId);
  const nameLower = name.trim().toLowerCase();
  const excludeLower = excludeAddress?.toLowerCase();

  for (const [addr, existingName] of Object.entries(names)) {
    if (addr === excludeLower) continue; // Skip the address being renamed
    if (existingName.trim().toLowerCase() === nameLower) {
      return true;
    }
  }
  return false;
};

/**
 * Save a wallet name for a specific chain with uniqueness validation
 * @returns Success object or error object with message
 */
export const saveChainWalletName = (
  chainId: number,
  address: string,
  name: string,
): { ok: true } | { ok: false; error: string } => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { ok: false, error: "Name cannot be empty" };
  }

  const addressLower = address.toLowerCase();

  // Check if name is taken by another wallet on this chain
  if (isWalletNameTakenOnChain(chainId, trimmedName, addressLower)) {
    return {
      ok: false,
      error:
        "Name assigned to another wallet address. Please use a different name.",
    };
  }

  // Save to chain-specific key
  const names = getChainWalletNames(chainId);
  names[addressLower] = trimmedName;
  const key = `${WALLET_NAMES_KEY_PREFIX}${chainId}`;
  localStorage.setItem(key, JSON.stringify(names));

  return { ok: true };
};

/**
 * Returns a user-friendly display name for a Safe wallet addresses like most wallet providers provide.
 * Priority:
 * 1) User-defined custom name from chain-specific storage
 * 2) Default sequential name based on its index in the provided list ("Account N")
 * 3) Truncated address (0x1234...abcd)
 */
export const getWalletDisplayName = (
  address: string,
  chainId: number,
  orderedWalletAddresses?: string[],
): string => {
  const lower = address.toLowerCase();

  // 1) Chain-specific custom name
  const chainNames = getChainWalletNames(chainId);
  const chainCustom = chainNames[lower];
  if (chainCustom && chainCustom.trim()) return chainCustom.trim();

  // 2) If an ordered list is provided, use its index for a default label
  if (orderedWalletAddresses && orderedWalletAddresses.length > 0) {
    const idx = orderedWalletAddresses.findIndex(
      (w) => w.toLowerCase() === lower,
    );
    if (idx >= 0) return `Account ${idx + 1}`;
  }

  // 3) Fallback to truncated address
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
