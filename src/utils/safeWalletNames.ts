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

export const deleteWalletName = (address: string) => {
  const names = getWalletNames();
  delete names[address.toLowerCase()];
  localStorage.setItem(WALLET_NAMES_KEY, JSON.stringify(names));
};

export const getWalletDisplayName = (address: string): string => {
  const names = getWalletNames();
  const customName = names[address.toLowerCase()];
  if (customName) return customName;
  const prefix = address.slice(0, 6);
  const suffix = address.slice(-4);
  return `${prefix}...${suffix}`;
};
