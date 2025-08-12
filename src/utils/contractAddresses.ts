export const CONTRACT_ADDRESSES = {
  // OP Sepolia (chainId: 11155420)
  11155420: {
    TRIGGER_GAS_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS || "",
    JOB_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_JOB_CREATION_CONTRACT_ADDRESS || "",
    // Add other contract addresses for OP Sepolia here
  },
  // Base Sepolia (chainId: 84532)
  84532: {
    TRIGGER_GAS_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS || "",
    JOB_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_JOB_CREATION_CONTRACT_ADDRESS || "",
    // Add other contract addresses for Base Sepolia here
  },
  // Arbitrum Sepolia (chainId: 421614)
  421614: {
    TRIGGER_GAS_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_ARBITRUM_TRIGGER_GAS_REGISTRY_ADDRESS || "",
    JOB_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_ARBITRUM_JOB_CREATION_CONTRACT_ADDRESS || "",
    // Add other contract addresses for Arbitrum Sepolia here
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
