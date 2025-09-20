import { ethers } from "ethers";
import { devLog } from "@/lib/devLog";
import { getRpcUrl } from "./contractAddresses";

// Common proxy storage slot patterns for different proxy types
const PROXY_STORAGE_SLOTS = {
  // EIP-1967 Transparent Proxy Pattern
  EIP1967_IMPLEMENTATION:
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
  EIP1967_BEACON:
    "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50",

  // OpenZeppelin Upgradeable Proxy
  OZ_IMPLEMENTATION:
    "0x7050c9e0f4ca76934e74a37d62716d2c4a0e8a0b0b0b0b0b0b0b0b0b0b0b0b0b",

  // EIP-1822 Universal Upgradeable Proxy Standard
  EIP1822_IMPLEMENTATION:
    "0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7",

  // Custom patterns (less common)
  CUSTOM_IMPLEMENTATION:
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
};

export interface ProxyInfo {
  isProxy: boolean;
  implementationAddress?: string;
  proxyType?: string;
  error?: string;
}

/**
 * Detects if a contract is a proxy and returns implementation address
 */
export async function detectProxyAndGetImplementation(
  contractAddress: string,
  provider: ethers.Provider,
): Promise<ProxyInfo> {
  try {
    devLog(`Detecting proxy for contract: ${contractAddress}`);

    if (!ethers.isAddress(contractAddress)) {
      return { isProxy: false, error: "Invalid contract address" };
    }

    // Method 1: Check storage slots for EIP-1967 and other patterns
    const storageResult = await checkStorageSlots(contractAddress, provider);
    if (storageResult.isProxy) {
      return storageResult;
    }

    // Method 2: Check function calls for proxy methods
    const functionResult = await checkProxyFunctions(contractAddress, provider);
    if (functionResult.isProxy) {
      return functionResult;
    }

    // Method 3: Check for common proxy bytecode patterns
    const bytecodeResult = await checkBytecodePatterns(
      contractAddress,
      provider,
    );
    if (bytecodeResult.isProxy) {
      return bytecodeResult;
    }

    return { isProxy: false };
  } catch (error) {
    devLog(`Error detecting proxy: ${error}`);
    return {
      isProxy: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check storage slots for proxy implementation addresses
 */
async function checkStorageSlots(
  contractAddress: string,
  provider: ethers.Provider,
): Promise<ProxyInfo> {
  try {
    // Check EIP-1967 implementation slot
    const eip1967Slot = await provider.getStorage(
      contractAddress,
      PROXY_STORAGE_SLOTS.EIP1967_IMPLEMENTATION,
    );
    if (
      eip1967Slot &&
      eip1967Slot !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      const implementationAddress = ethers.getAddress(
        "0x" + eip1967Slot.slice(-40),
      );
      if (ethers.isAddress(implementationAddress)) {
        devLog(`Found EIP-1967 proxy implementation: ${implementationAddress}`);
        return {
          isProxy: true,
          implementationAddress,
          proxyType: "EIP-1967",
        };
      }
    }

    // Check EIP-1967 beacon slot
    const beaconSlot = await provider.getStorage(
      contractAddress,
      PROXY_STORAGE_SLOTS.EIP1967_BEACON,
    );
    if (
      beaconSlot &&
      beaconSlot !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      const beaconAddress = ethers.getAddress("0x" + beaconSlot.slice(-40));
      if (ethers.isAddress(beaconAddress)) {
        devLog(`Found EIP-1967 beacon proxy: ${beaconAddress}`);
        // For beacon proxies, we need to get the implementation from the beacon
        try {
          const beaconContract = new ethers.Contract(
            beaconAddress,
            ["function implementation() view returns (address)"],
            provider,
          );
          const implementationAddress = await beaconContract.implementation();
          if (ethers.isAddress(implementationAddress)) {
            return {
              isProxy: true,
              implementationAddress,
              proxyType: "EIP-1967 Beacon",
            };
          }
        } catch (beaconError) {
          devLog(`Error getting implementation from beacon: ${beaconError}`);
        }
      }
    }

    // Check EIP-1822 slot
    const eip1822Slot = await provider.getStorage(
      contractAddress,
      PROXY_STORAGE_SLOTS.EIP1822_IMPLEMENTATION,
    );
    if (
      eip1822Slot &&
      eip1822Slot !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      const implementationAddress = ethers.getAddress(
        "0x" + eip1822Slot.slice(-40),
      );
      if (ethers.isAddress(implementationAddress)) {
        devLog(`Found EIP-1822 proxy implementation: ${implementationAddress}`);
        return {
          isProxy: true,
          implementationAddress,
          proxyType: "EIP-1822",
        };
      }
    }

    return { isProxy: false };
  } catch (error) {
    devLog(`Error checking storage slots: ${error}`);
    return { isProxy: false, error: "Failed to check storage slots" };
  }
}

/**
 * Check for proxy functions like implementation()
 */
async function checkProxyFunctions(
  contractAddress: string,
  provider: ethers.Provider,
): Promise<ProxyInfo> {
  try {
    const contract = new ethers.Contract(
      contractAddress,
      [
        "function implementation() view returns (address)",
        "function admin() view returns (address)",
        "function proxiableUUID() view returns (bytes32)",
      ],
      provider,
    );

    // Try to call implementation() function
    try {
      const implementationAddress = await contract.implementation();
      if (
        ethers.isAddress(implementationAddress) &&
        implementationAddress !== ethers.ZeroAddress
      ) {
        devLog(
          `Found proxy via implementation() function: ${implementationAddress}`,
        );
        return {
          isProxy: true,
          implementationAddress,
          proxyType: "Function-based",
        };
      }
    } catch (error) {
      console.log("error", error);
      // implementation() function doesn't exist or failed
    }

    // Try to call admin() function (common in OpenZeppelin proxies)
    try {
      const adminAddress = await contract.admin();
      if (
        ethers.isAddress(adminAddress) &&
        adminAddress !== ethers.ZeroAddress
      ) {
        devLog(`Found proxy via admin() function: ${adminAddress}`);
        return {
          isProxy: true,
          implementationAddress: contractAddress, // For admin-based proxies, the contract itself might be the implementation
          proxyType: "Admin-based",
        };
      }
    } catch (error) {
      console.log("error", error);
      // admin() function doesn't exist or failed
    }

    // Try to call proxiableUUID() function (EIP-1822)
    try {
      const uuid = await contract.proxiableUUID();
      if (
        uuid &&
        uuid !==
          "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        devLog(`Found EIP-1822 proxy via proxiableUUID(): ${uuid}`);
        return {
          isProxy: true,
          implementationAddress: contractAddress, // For EIP-1822, we need to check storage
          proxyType: "EIP-1822",
        };
      }
    } catch (error) {
      console.log("error", error);
      // proxiableUUID() function doesn't exist or failed
    }

    return { isProxy: false };
  } catch (error) {
    devLog(`Error checking proxy functions: ${error}`);
    return { isProxy: false, error: "Failed to check proxy functions" };
  }
}

/**
 * Check bytecode patterns for common proxy implementations
 */
async function checkBytecodePatterns(
  contractAddress: string,
  provider: ethers.Provider,
): Promise<ProxyInfo> {
  try {
    const code = await provider.getCode(contractAddress);

    // Check for common proxy bytecode patterns
    // This is a simplified check - in practice, you'd want more sophisticated pattern matching
    const proxyPatterns = [
      "608060405234801561001057600080fd5b50", // Common proxy constructor pattern
      "608060405234801561001057600080fd5b50", // Another common pattern
    ];

    for (const pattern of proxyPatterns) {
      if (code.includes(pattern)) {
        devLog(`Found potential proxy via bytecode pattern: ${pattern}`);
        return {
          isProxy: true,
          implementationAddress: contractAddress, // We can't determine implementation from bytecode alone
          proxyType: "Bytecode-pattern",
        };
      }
    }

    return { isProxy: false };
  } catch (error) {
    devLog(`Error checking bytecode patterns: ${error}`);
    return { isProxy: false, error: "Failed to check bytecode patterns" };
  }
}

/**
 * Get a provider for the given chain ID
 * Uses RPC URLs from contractAddresses.ts configuration
 */
export function getProviderForChain(chainId: number): ethers.Provider {
  try {
    const rpcUrl = getRpcUrl(chainId);
    devLog(
      `Getting provider for chain ${chainId}, RPC URL: ${rpcUrl ? "configured" : "not configured"}`,
    );

    if (!rpcUrl || rpcUrl.trim() === "") {
      throw new Error(
        `No RPC URL configured for chain ID: ${chainId}. Please check your environment variables.`,
      );
    }

    return new ethers.JsonRpcProvider(rpcUrl);
  } catch (error) {
    devLog(`Error getting provider for chain ${chainId}:`, error);
    throw new Error(
      `Failed to get provider for chain ID: ${chainId}. ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
