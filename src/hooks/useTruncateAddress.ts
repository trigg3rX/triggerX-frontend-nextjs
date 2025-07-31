import { useCallback } from "react";

const useTruncateAddress = () => {
  return useCallback((address: string): string => {
    if (!address) return "";
    if (address.length < 10) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  }, []);
};

export default useTruncateAddress;
