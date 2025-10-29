export const WALLET_NAMES_KEY = "triggerx_safe_wallet_names";

export const getWalletNames = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(WALLET_NAMES_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const saveWalletName = (address: string, name: string) => {
  const names = getWalletNames();
  names[address.toLowerCase()] = name;
  localStorage.setItem(WALLET_NAMES_KEY, JSON.stringify(names));
};

/**
 * Returns a user-friendly display name for a Safe wallet addresses like most wallet providers provide.
 * Priority:
 * 1) User-defined custom name (from localStorage)
 * 2) Default sequential name based on its index in the provided list ("Account N")
 * 3) Truncated address (0x1234...abcd)
 */
export const getWalletDisplayName = (
  address: string,
  orderedWalletAddresses?: string[],
): string => {
  const lower = address.toLowerCase();

  // 1) Custom name, if present
  const customNames = getWalletNames();
  const custom = customNames[lower];
  if (custom && custom.trim()) return custom.trim();

  // 2) If an ordered list is provided, use its index for a default label
  if (orderedWalletAddresses && orderedWalletAddresses.length > 0) {
    const idx = orderedWalletAddresses.findIndex(
      (w) => w.toLowerCase() === lower,
    );
    if (idx >= 0) return `Account ${idx + 1}`;
  }

  // 3) Fallback to truncated address
  return getWalletDisplayName(address);
};
