import { devLog } from "@/lib/devLog";
import { NextRequest, NextResponse } from "next/server";

const ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY =
  process.env.NEXT_PUBLIC_ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY;
const ETHERSCAN_BASE_SEPOLIA_API_KEY =
  process.env.NEXT_PUBLIC_ETHERSCAN_BASE_SEPOLIA_API_KEY;
const ETHERSCAN_ARBITRUM_SEPOLIA_API_KEY =
  process.env.NEXT_PUBLIC_ETHERSCAN_ARBITRUM_SEPOLIA_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const chainId = searchParams.get("chainId");
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }
  const chainIdNum = chainId ? Number(chainId) : undefined;
  const isBaseSepolia = chainIdNum === 84532 || chainIdNum === 8453;
  const isArbitrumSepolia = chainIdNum === 421614;

  // 1. Try Blockscout
  let blockscoutUrl = "";
  if (isBaseSepolia) {
    blockscoutUrl = `https://base-sepolia.blockscout.com/api?module=contract&action=getabi&address=${address}`;
    devLog("base", blockscoutUrl);
  } else if (isArbitrumSepolia) {
    blockscoutUrl = `https://sepolia.arbiscan.io/api?module=contract&action=getabi&address=${address}`;
    devLog("arbitrum", blockscoutUrl);
  } else {
    blockscoutUrl = `https://optimism-sepolia.blockscout.com/api?module=contract&action=getabi&address=${address}`;
    devLog("op", blockscoutUrl);
  }
  try {
    const response = await fetch(blockscoutUrl);
    const data = await response.json();
    if (
      data.status === "1" &&
      data.result &&
      typeof data.result === "string" &&
      data.result.startsWith("[")
    ) {
      return NextResponse.json({ abi: data.result, source: "blockscout" });
    }
  } catch (e) {
    devLog("blockscout", e);
    // Ignore, try Etherscan next
  }

  // 2. Try Etherscan
  let etherscanUrl = "";
  if (isBaseSepolia && ETHERSCAN_BASE_SEPOLIA_API_KEY) {
    etherscanUrl = `https://api.etherscan.io/v2/api?chainid=84532&module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_BASE_SEPOLIA_API_KEY}`;
    devLog("base", etherscanUrl);
  } else if (isArbitrumSepolia && ETHERSCAN_ARBITRUM_SEPOLIA_API_KEY) {
    etherscanUrl = `https://api.etherscan.io/v2/api?chainid=421614&module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_ARBITRUM_SEPOLIA_API_KEY}`;
    devLog("arbitrum", etherscanUrl);
  } else if (ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY) {
    etherscanUrl = `https://api-sepolia-optimism.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_OPTIMISM_SEPOLIA_API_KEY}`;
    devLog("op", etherscanUrl);
  }

  if (etherscanUrl) {
    try {
      const response = await fetch(etherscanUrl);
      const data = await response.json();
      if (
        data.status === "1" &&
        data.result &&
        typeof data.result === "string" &&
        data.result.startsWith("[")
      ) {
        return NextResponse.json({ abi: data.result, source: "etherscan" });
      }
    } catch (e) {
      devLog("Etherscan", e);
      // Ignore
    }
  }
  return NextResponse.json(
    { error: "ABI not found on Blockscout or Etherscan" },
    { status: 404 },
  );
}
