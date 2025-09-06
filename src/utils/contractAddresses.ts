export const CONTRACT_ADDRESSES = {
  // OP Sepolia (chainId: 11155420)
  11155420: {
    TRIGGER_GAS_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS || "",
    JOB_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_JOB_CREATION_CONTRACT_ADDRESS || "",
    RPC_URL: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC_URL || "",
    API_NETWORK_NAME: "op_sepolia", // Add this for the API call
    DISPLAY_NETWORK_NAME: "Optimism Sepolia", // Add this for display
    EXPLORER_URL: "https://sepolia-optimism.etherscan.io/address/",

    ETHERSCAN_API_KEY:
      process.env.NEXT_PUBLIC_ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY || "",
    BLOCKSCOUT_API_URL: "https://optimism-sepolia.blockscout.com/api",
    ETHERSCAN_API_URL: "https://api-sepolia-optimism.etherscan.io/api?",
  },
  // Base Sepolia (chainId: 84532)
  84532: {
    TRIGGER_GAS_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS || "",
    JOB_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_JOB_CREATION_CONTRACT_ADDRESS || "",
    RPC_URL: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "",
    API_NETWORK_NAME: "base_sepolia", // Add this for the API call
    DISPLAY_NETWORK_NAME: "Base Sepolia", // Add this for display
    EXPLORER_URL: "https://sepolia.basescan.org/address/",

    ETHERSCAN_API_KEY:
      process.env.NEXT_PUBLIC_ETHERSCAN_BASE_SEPOLIA_API_KEY || "",
    BLOCKSCOUT_API_URL: "https://base-sepolia.blockscout.com/api",
    ETHERSCAN_API_URL: "https://api.etherscan.io/v2/api?chainid=84532&",
  },
  // Arbitrum Sepolia (chainId: 421614)
  421614: {
    TRIGGER_GAS_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS || "",
    JOB_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_JOB_CREATION_CONTRACT_ADDRESS || "",
    RPC_URL: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || "",
    API_NETWORK_NAME: "arbitrum_sepolia", // Add this for the API call
    DISPLAY_NETWORK_NAME: "Arbitrum Sepolia", // Add this for display
    EXPLORER_URL: "https://sepolia.arbiscan.io/address/",

    ETHERSCAN_API_KEY:
      process.env.NEXT_PUBLIC_ETHERSCAN_ARBITRUM_SEPOLIA_API_KEY || "",
    BLOCKSCOUT_API_URL: "https://sepolia.arbiscan.io/api",
    ETHERSCAN_API_URL: "https://api.etherscan.io/v2/api?chainid=421614&",
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddress(
  chainId: number,
  contractName: keyof (typeof CONTRACT_ADDRESSES)[SupportedChainId],
): string {
  const chainAddresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  if (!chainAddresses) {
    console.warn(
      `Chain ID ${chainId} not supported, falling back to environment variable`,
    );
    return process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS || "";
  }

  return chainAddresses[contractName] || "";
}

export function getTriggerGasRegistryAddress(chainId: number): string {
  return getContractAddress(chainId, "TRIGGER_GAS_REGISTRY_ADDRESS");
}

export function getJobRegistryAddress(chainId: number): string {
  return getContractAddress(chainId, "JOB_REGISTRY_ADDRESS");
}

export function getRpcUrl(chainId: number): string {
  return getContractAddress(chainId, "RPC_URL");
}

export function getApiNetworkName(chainId: number): string {
  return getContractAddress(chainId, "API_NETWORK_NAME");
}

export function getDisplayNetworkName(chainId: number): string {
  return getContractAddress(chainId, "DISPLAY_NETWORK_NAME");
}

export function getExplorerUrl(chainId: number): string {
  return getContractAddress(chainId, "EXPLORER_URL");
}

export function getEtherScanApiKey(chainId: number): string {
  return getContractAddress(chainId, "ETHERSCAN_API_KEY");
}

export function getBlockscoutApiUrl(chainId: number): string {
  return getContractAddress(chainId, "BLOCKSCOUT_API_URL");
}

export function getEtherScanApiUrl(chainId: number): string {
  return getContractAddress(chainId, "ETHERSCAN_API_URL");
}
