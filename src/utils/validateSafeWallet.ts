import { ethers } from "ethers";
import SafeArtifact from "@/artifacts/Safe.json";

export interface ValidateSafeWalletResult {
  success: boolean;
  safeAddress: string;
  owners: string[];
  error?: string;
}

/**
 * Validates a Safe wallet address on the current network
 *
 * @param safeAddress - The Safe wallet address to validate
 * @param provider - The ethers provider instance
 * @param connectedAddress - The connected wallet address to verify ownership
 * @returns Promise with validation result including owners list or error
 */
export async function validateSafeWallet(
  safeAddress: string,
  provider: ethers.Provider,
  connectedAddress: string | undefined,
): Promise<ValidateSafeWalletResult> {
  // Step 1: Validate address format
  let safeAddr: string;
  try {
    safeAddr = ethers.getAddress(safeAddress.trim());
  } catch {
    return {
      success: false,
      safeAddress: safeAddress.trim(),
      owners: [],
      error: "Please enter a valid Ethereum address",
    };
  }

  // Step 2: Check if wallet is connected
  if (!connectedAddress) {
    return {
      success: false,
      safeAddress: safeAddr,
      owners: [],
      error: "Please connect your wallet to verify ownership",
    };
  }

  // Step 3: Check if contract exists on current chain
  let code: string;
  try {
    code = await provider.getCode(safeAddr);
  } catch {
    return {
      success: false,
      safeAddress: safeAddr,
      owners: [],
      error: "Failed to check contract on network. Please try again.",
    };
  }

  if (!code || code === "0x") {
    return {
      success: false,
      safeAddress: safeAddr,
      owners: [],
      error:
        "No Safe contract found at this address on the current network. Please verify the address or switch to the correct network.",
    };
  }

  // Step 4: Verify it's a Safe wallet by checking for getOwners function
  const safe = new ethers.Contract(safeAddr, SafeArtifact.abi, provider);
  let owners: string[];
  try {
    owners = await safe.getOwners();
  } catch {
    return {
      success: false,
      safeAddress: safeAddr,
      owners: [],
      error:
        "This address exists but is not a Safe wallet contract. Please enter a valid Safe wallet address.",
    };
  }

  // Step 5: Verify ownership
  const isOwner = owners
    .map((o) => o.toLowerCase())
    .includes(connectedAddress.toLowerCase());

  if (!isOwner) {
    return {
      success: false,
      safeAddress: safeAddr,
      owners,
      error: "Connected wallet is not an owner of this Safe",
    };
  }

  // All validation passed
  return {
    success: true,
    safeAddress: safeAddr,
    owners,
  };
}
