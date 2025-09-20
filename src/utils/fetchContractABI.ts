import { devLog } from "@/lib/devLog";
import { ethers } from "ethers";
import {
  detectProxyAndGetImplementation,
  getProviderForChain,
} from "./proxyDetection";

// Now fetches ABI via Next.js API route to avoid CORS
export async function fetchContractABI(
  address: string,
  chainId?: number,
  skipProxyDetection: boolean = false,
): Promise<string | null> {
  if (!address || !ethers.isAddress(address)) return null;
  try {
    devLog(
      `fetchContractABI (frontend): address=${address}, chainId=${chainId}, skipProxyDetection=${skipProxyDetection}`,
    );

    // First, try to fetch ABI for the given address
    const params = new URLSearchParams({ address });
    if (chainId) params.append("chainId", String(chainId));
    const res = await fetch(`/api/fetch-abi?${params.toString()}`);
    const data = await res.json();

    if (data.abi && typeof data.abi === "string" && data.abi.startsWith("[")) {
      devLog(`ABI fetch succeeded from ${data.source}`);
      return data.abi;
    }

    // If ABI fetch failed and we haven't skipped proxy detection, check if it's a proxy contract
    if (chainId && !skipProxyDetection) {
      try {
        devLog(
          `ABI not found for ${address}, checking if it's a proxy contract...`,
        );
        const provider = getProviderForChain(chainId);
        const proxyInfo = await detectProxyAndGetImplementation(
          address,
          provider,
        );

        if (proxyInfo.isProxy && proxyInfo.implementationAddress) {
          devLog(
            `Detected ${proxyInfo.proxyType} proxy. Implementation address: ${proxyInfo.implementationAddress}`,
          );

          // Try to fetch ABI for the implementation address
          const implParams = new URLSearchParams({
            address: proxyInfo.implementationAddress,
          });
          implParams.append("chainId", String(chainId));
          const implRes = await fetch(
            `/api/fetch-abi?${implParams.toString()}`,
          );
          const implData = await implRes.json();

          if (
            implData.abi &&
            typeof implData.abi === "string" &&
            implData.abi.startsWith("[")
          ) {
            devLog(
              `ABI fetch succeeded for implementation from ${implData.source}`,
            );
            return implData.abi;
          } else {
            devLog(
              `ABI fetch failed for implementation: ${implData.error || "Unknown error"}`,
            );
          }
        } else {
          devLog(
            `Contract is not a proxy or implementation address not found: ${proxyInfo.error || "Not a proxy"}`,
          );
        }
      } catch (proxyError) {
        devLog(`Error checking for proxy: ${proxyError}`);
        // If it's an RPC URL error, provide more helpful information
        if (proxyError instanceof Error) {
          if (proxyError.message.includes("No RPC URL configured")) {
            devLog(
              `RPC URL not configured for chain ${chainId}, proxy detection unavailable`,
            );
          } else if (proxyError.message.includes("Failed to get provider")) {
            devLog(
              `Provider setup failed for chain ${chainId}, proxy detection unavailable`,
            );
          } else {
            devLog(
              `Proxy detection failed for chain ${chainId}: ${proxyError.message}`,
            );
          }
        }
        // Continue with original error handling
      }
    }

    devLog(`ABI fetch failed: ${data.error || "Unknown error"}`);
    return null;
  } catch (e) {
    devLog(`fetchContractABI error: ${e}`);
    return null;
  }
}
