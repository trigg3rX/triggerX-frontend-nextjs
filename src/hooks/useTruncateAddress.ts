import { useCallback } from "react";

/**
 * useTruncateAddress - React hook to get a function for truncating addresses
 * Usage:
 *   const truncateAddress = useTruncateAddress();
 *   const short = truncateAddress(address);
 */
const useTruncateAddress = () => {
  return useCallback((address: string): string => {
    if (!address) return "";
    if (address.length < 10) return address;
    return `${address.slice(0, 10)}...${address.slice(-4)}`;
  }, []);
};

export default useTruncateAddress;
