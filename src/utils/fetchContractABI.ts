import { ethers } from "ethers";

const ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY =
  process.env.NEXT_PUBLIC_ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY;

export async function fetchContractABI(
  address: string,
): Promise<string | null> {
  if (!address || !ethers.isAddress(address)) return null;

  // 1. Try Blockscout
  const blockscoutUrl = `https://optimism-sepolia.blockscout.com/api?module=contract&action=getabi&address=${address}`;
  try {
    const response = await fetch(blockscoutUrl);
    const data = await response.json();
    if (
      data.status === "1" &&
      data.result &&
      typeof data.result === "string" &&
      data.result.startsWith("[")
    ) {
      return data.result;
    }
  } catch {
    // Ignore, try Etherscan next
  }

  // 2. Try Etherscan
  if (ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY) {
    const etherscanUrl = `https://api-sepolia-optimism.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY}`;
    try {
      const response = await fetch(etherscanUrl);
      const data = await response.json();
      if (
        data.status === "1" &&
        data.result &&
        typeof data.result === "string" &&
        data.result.startsWith("[")
      ) {
        return data.result;
      }
    } catch {
      // Ignore
    }
  }
  return null;
}
