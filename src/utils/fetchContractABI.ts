import { devLog } from "@/lib/devLog";
import { ethers } from "ethers";

// Now fetches ABI via Next.js API route to avoid CORS
export async function fetchContractABI(
  address: string,
  chainId?: number,
): Promise<string | null> {
  if (!address || !ethers.isAddress(address)) return null;
  try {
    devLog(
      `fetchContractABI (frontend): address=${address}, chainId=${chainId}`,
    );
    const params = new URLSearchParams({ address });
    if (chainId) params.append("chainId", String(chainId));
    const res = await fetch(`/api/fetch-abi?${params.toString()}`);
    const data = await res.json();
    if (data.abi && typeof data.abi === "string" && data.abi.startsWith("[")) {
      devLog(`ABI fetch succeeded from ${data.source}`);
      return data.abi;
    } else {
      devLog(`ABI fetch failed: ${data.error || "Unknown error"}`);
      return null;
    }
  } catch (e) {
    devLog(`fetchContractABI error: ${e}`);
    return null;
  }
}
