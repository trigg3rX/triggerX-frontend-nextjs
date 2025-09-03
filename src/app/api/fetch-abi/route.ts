import { devLog } from "@/lib/devLog";
import {
  getBlockscoutApiUrl,
  getEtherScanApiKey,
  getEtherScanApiUrl,
} from "@/utils/contractAddresses";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const chainId = searchParams.get("chainId");
  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }
  if (!chainId) {
    return NextResponse.json({ error: "Missing chainId" }, { status: 400 });
  }

  const chainIdNum = Number(chainId);
  const blockscoutBaseUrl = getBlockscoutApiUrl(chainIdNum);
  const etherscanBaseUrl = getEtherScanApiUrl(chainIdNum);
  const etherscanApiKey = getEtherScanApiKey(chainIdNum);

  if (!blockscoutBaseUrl && !etherscanBaseUrl) {
    return NextResponse.json(
      { error: `Chain ID ${chainIdNum} is not supported for ABI fetching.` },
      { status: 400 },
    );
  }

  // 1. Try Blockscout
  if (blockscoutBaseUrl) {
    const blockscoutUrl = `${blockscoutBaseUrl}?module=contract&action=getabi&address=${address}`;
    devLog(
      `Fetching ABI from Blockscout-like API for chain ${chainIdNum}:`,
      blockscoutUrl,
    );
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
      devLog(
        `Error fetching ABI from Blockscout-like API for chain ${chainIdNum}:`,
        e,
      );
      // Ignore, try Etherscan next
    }
  }

  // 2. Try Etherscan
  if (etherscanBaseUrl && etherscanApiKey) {
    const etherscanUrl = `${etherscanBaseUrl}module=contract&action=getabi&address=${address}&apikey=${etherscanApiKey}`;
    devLog(
      `Fetching ABI from Etherscan-like API for chain ${chainIdNum}:`,
      etherscanUrl,
    );
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
      devLog(
        `Error fetching ABI from Etherscan-like API for chain ${chainIdNum}:`,
        e,
      );
      // Ignore
    }
  }

  return NextResponse.json(
    { error: "ABI not found on any configured explorer for this chain." },
    { status: 404 },
  );
}
