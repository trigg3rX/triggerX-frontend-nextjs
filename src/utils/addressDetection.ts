import { ethers } from "ethers";
import { devLog } from "@/lib/devLog";
import { getRpcUrl } from "@/utils/contractAddresses";
import networksData from "@/utils/networks.json";

type SimpleAddressType = "contract" | "eoa";

export interface AddressDetectionResult {
  addressType: SimpleAddressType;
  detectedType: SimpleAddressType | null;
  shouldFetchABI: boolean;
}

/**
 * Detects whether an on-chain address is a contract or an EOA for the given
 * network name. Returns the computed address type, the detected type (or null
 * if detection failed), and whether the caller should attempt to fetch an ABI.
 */
export const detectAddressTypeHelper = async (
  address: string,
  networkName: string,
): Promise<AddressDetectionResult> => {
  if (!address || !ethers.isAddress(address)) {
    throw new Error("Invalid address provided for detection");
  }

  const network = networksData.supportedNetworks.find(
    (n) => n.name === networkName,
  );
  if (!network) {
    devLog("[detectAddressTypeHelper] Network not found:", networkName);
    return {
      addressType: "eoa",
      detectedType: "eoa",
      shouldFetchABI: false,
    };
  }

  const rpcUrl = getRpcUrl(network.id);
  if (!rpcUrl || rpcUrl.trim() === "") {
    devLog("[detectAddressTypeHelper] No RPC URL for chain:", network.id);
    return {
      addressType: "eoa",
      detectedType: null,
      shouldFetchABI: false,
    };
  }

  devLog(
    "[detectAddressTypeHelper] Using RPC:",
    rpcUrl,
    "for chain:",
    network.id,
  );

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const code = await provider.getCode(address);

  devLog(
    "[detectAddressTypeHelper] Code for",
    address,
    ":",
    code.slice(0, 50) + (code.length > 50 ? "..." : ""),
  );

  const isContract =
    typeof code === "string" && code !== "0x" && code.length > 2;
  const detectedType: SimpleAddressType = isContract ? "contract" : "eoa";

  devLog("[detectAddressTypeHelper] Detected as:", detectedType);

  return {
    addressType: detectedType,
    detectedType,
    shouldFetchABI: isContract,
  };
};
