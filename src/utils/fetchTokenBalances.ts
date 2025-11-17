import { ethers } from "ethers";
import {
  getEtherScanApiUrl,
  getEtherScanApiKey,
  getBlockscoutApiUrl,
  getRpcUrl,
} from "./contractAddresses";
import { devLog } from "@/lib/devLog";

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  isNative?: boolean;
}

// Standard ERC-20 ABI for balance and metadata calls
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
];

/**
 * Fetch native token balance for a given address
 */
export async function fetchNativeBalance(
  address: string,
  chainId: number,
): Promise<TokenBalance | null> {
  try {
    const rpcUrl = getRpcUrl(chainId);
    if (!rpcUrl) {
      throw new Error(`No RPC URL configured for chain ${chainId}`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(address);

    // Get native token symbol based on chain
    const nativeTokens: Record<number, { symbol: string; name: string }> = {
      11155420: { symbol: "ETH", name: "Ethereum" }, // OP Sepolia
      84532: { symbol: "ETH", name: "Ethereum" }, // Base Sepolia
      421614: { symbol: "ETH", name: "Ethereum" }, // Arbitrum Sepolia
      42161: { symbol: "ETH", name: "Ethereum" }, // Arbitrum
    };

    const nativeToken = nativeTokens[chainId] || {
      symbol: "ETH",
      name: "Ethereum",
    };

    return {
      address: ethers.ZeroAddress,
      symbol: nativeToken.symbol,
      name: nativeToken.name,
      decimals: 18,
      balance: balance.toString(),
      balanceFormatted: ethers.formatEther(balance),
      isNative: true,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch ERC-20 token balances using Etherscan API
 */
export async function fetchTokenBalancesEtherscan(
  address: string,
  chainId: number,
): Promise<TokenBalance[]> {
  try {
    const apiUrl = getEtherScanApiUrl(chainId);
    const apiKey = getEtherScanApiKey(chainId);

    if (!apiUrl || !apiKey) {
      throw new Error(`Etherscan API not configured for chain ${chainId}`);
    }

    const url = `${apiUrl}module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "1" || !data.result) {
      throw new Error("Failed to fetch token transactions");
    }

    // Extract unique token addresses from transactions
    const tokenAddresses = Array.from(
      new Set(
        data.result
          .map((tx: { contractAddress: string }) => tx.contractAddress)
          .filter((addr: string) => addr && ethers.isAddress(addr)),
      ),
    ) as string[];

    // Fetch balances for each token
    const balances: TokenBalance[] = [];
    const rpcUrl = getRpcUrl(chainId);
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    for (const tokenAddress of tokenAddresses) {
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

        const [balance, symbol, name, decimals] = await Promise.all([
          contract.balanceOf(address),
          contract.symbol(),
          contract.name(),
          contract.decimals(),
        ]);

        if (balance > 0) {
          balances.push({
            address: tokenAddress,
            symbol,
            name,
            decimals: Number(decimals),
            balance: balance.toString(),
            balanceFormatted: ethers.formatUnits(balance, decimals),
          });
        }
      } catch (error) {
        devLog(`Failed to fetch balance for token ${tokenAddress}:`, error);
      }
    }

    return balances;
  } catch (error) {
    devLog("Error fetching token balances from Etherscan:", error);
    throw error;
  }
}

/**
 * Fetch ERC-20 token balances using Blockscout API (fallback)
 */
export async function fetchTokenBalancesBlockscout(
  address: string,
  chainId: number,
): Promise<TokenBalance[]> {
  try {
    const apiUrl = getBlockscoutApiUrl(chainId);
    if (!apiUrl) {
      throw new Error(`Blockscout API not configured for chain ${chainId}`);
    }

    const url = `${apiUrl}?module=account&action=tokenlist&address=${address}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "1" || !data.result) {
      throw new Error("Failed to fetch token list from Blockscout");
    }

    const balances: TokenBalance[] = [];

    for (const token of data.result) {
      if (token.balance && BigInt(token.balance) > 0) {
        const decimals = parseInt(token.decimals) || 18;
        balances.push({
          address: token.contractAddress,
          symbol: token.symbol || "UNKNOWN",
          name: token.name || "Unknown Token",
          decimals,
          balance: token.balance,
          balanceFormatted: ethers.formatUnits(token.balance, decimals),
        });
      }
    }

    return balances;
  } catch (error) {
    devLog("Error fetching token balances from Blockscout:", error);
    throw error;
  }
}

/**
 * Fetch all token balances (native + ERC-20) with fallback strategy
 */
export async function fetchAllTokenBalances(
  address: string,
  chainId: number,
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];

  // Fetch native balance
  const nativeBalance = await fetchNativeBalance(address, chainId);
  if (nativeBalance) {
    balances.push(nativeBalance);
  }

  // Try Etherscan first, fallback to Blockscout
  try {
    const erc20Balances = await fetchTokenBalancesEtherscan(address, chainId);
    balances.push(...erc20Balances);
  } catch (error) {
    devLog("Etherscan failed, trying Blockscout:", error);
    try {
      const erc20Balances = await fetchTokenBalancesBlockscout(
        address,
        chainId,
      );
      balances.push(...erc20Balances);
    } catch (blockscoutError) {
      devLog("Both Etherscan and Blockscout failed:", blockscoutError);
    }
  }

  // Sort by balance value (descending), with native token first
  return balances.sort((a, b) => {
    if (a.isNative) return -1;
    if (b.isNative) return 1;
    return parseFloat(b.balanceFormatted) - parseFloat(a.balanceFormatted);
  });
}
