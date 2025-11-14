interface SafeChain {
  chainId: string;
  shortName: string;
  transactionService: string;
}

interface SafeChainsResponse {
  next: string | null;
  results: SafeChain[];
}

// In-memory cache for Safe chains
interface SafeChainInfo {
  shortName: string | null;
  transactionService: string | null;
}

let safeChainCache: Map<number, SafeChainInfo> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const SAFE_CONFIG_BASE_URL = "https://safe-config.safe.global/api/v1/chains/";

async function fetchSafeChains(): Promise<Map<number, SafeChainInfo>> {
  try {
    let nextUrl: string | null = SAFE_CONFIG_BASE_URL;
    const chainMap = new Map<number, SafeChainInfo>();

    while (nextUrl) {
      const response = await fetch(nextUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch Safe chains: ${response.status}`);
      }

      const data: SafeChainsResponse = await response.json();

      for (const chain of data.results) {
        const chainId = Number.parseInt(chain.chainId, 10);
        if (Number.isNaN(chainId)) {
          continue;
        }

        const shortName = chain.shortName?.trim() || null;
        const transactionService = chain.transactionService?.trim() || null;

        chainMap.set(chainId, {
          shortName,
          transactionService,
        });
      }

      nextUrl = data.next;
    }

    return chainMap;
  } catch {
    return new Map();
  }
}

export async function getSafeChainInfo(
  chainId: number,
): Promise<SafeChainInfo> {
  const now = Date.now();

  if (!safeChainCache || now - cacheTimestamp >= CACHE_DURATION) {
    safeChainCache = await fetchSafeChains();
    cacheTimestamp = now;
  }

  return (
    safeChainCache.get(chainId) || {
      shortName: null,
      transactionService: null,
    }
  );
}

export async function getSafeShortName(
  chainId: number,
): Promise<string | null> {
  const info = await getSafeChainInfo(chainId);
  return info.shortName;
}

/**
 * Builds a Safe web app URL for a given chain and Safe address
 * @param chainId - The chain ID
 * @param safeAddress - The Safe contract address
 * @returns Promise resolving to the URL or null if chain is not supported
 */
export async function getSafeWebAppUrl(
  chainId: number,
  safeAddress: string,
): Promise<string | null> {
  const shortName = await getSafeShortName(chainId);

  if (!shortName) {
    return null;
  }

  return `https://app.safe.global/home?safe=${shortName}:${safeAddress}`;
}

export async function getSafeQueueUrl(
  chainId: number,
  safeAddress: string,
): Promise<string | null> {
  const shortName = await getSafeShortName(chainId);

  if (!shortName) {
    return null;
  }

  return `https://app.safe.global/transactions/queue?safe=${shortName}:${safeAddress}`;
}

/**
 * Clears the Safe chains cache (useful for testing or forcing refresh)
 */
export function clearSafeChainCache(): void {
  safeChainCache = null;
  cacheTimestamp = 0;
}
