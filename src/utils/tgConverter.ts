// Conversion constants
const TG_PER_ETH = 1000;
const WEI_PER_ETH = 1e18;
const WEI_PER_TG = 1e15;

/**
 * Converts Wei (bigint) to TG (number) for display purposes
 * @param wei - Amount in Wei as bigint
 * @returns Amount in TG as number
 * @example weiToTg(1000000000000000n) // returns 1
 */
export function weiToTg(wei: bigint): number {
  return Number(wei) / WEI_PER_TG;
}

/**
 * Converts TG (number) to Wei (bigint) for transactions and calculations
 * @param tg - Amount in TG as number
 * @returns Amount in Wei as bigint
 * @example tgToWei(1) // returns 1000000000000000n
 */
export function tgToWei(tg: number): bigint {
  return BigInt(Math.floor(tg * WEI_PER_TG));
}

/**
 * Converts Wei (bigint) to ETH (number) for display purposes
 * @param wei - Amount in Wei as bigint
 * @returns Amount in ETH as number
 * @example weiToEth(1000000000000000000n) // returns 1
 */
export function weiToEth(wei: bigint): number {
  return Number(wei) / WEI_PER_ETH;
}

/**
 * Converts ETH (number) to Wei (bigint) for transactions and calculations
 * @param eth - Amount in ETH as number
 * @returns Amount in Wei as bigint
 * @example ethToWei(1) // returns 1000000000000000000n
 */
export function ethToWei(eth: number): bigint {
  return BigInt(Math.floor(eth * WEI_PER_ETH));
}

/**
 * Formats TG amount for display with appropriate decimal places
 * @param tg - Amount in TG
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted TG string
 * @example formatTg(1.23456789) // returns "1.2346 TG"
 */
export function formatTg(tg: number, decimals: number = 4): string {
  return `${tg.toFixed(decimals)} TG`;
}

/**
 * Formats Wei as TG for display
 * @param wei - Amount in Wei as bigint
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted TG string
 * @example formatWeiAsTg(1000000000000000n) // returns "1.0000 TG"
 */
export function formatWeiAsTg(wei: bigint, decimals: number = 4): string {
  return formatTg(weiToTg(wei), decimals);
}

/**
 * Formats Wei as ETH for display
 * @param wei - Amount in Wei as bigint
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted ETH string
 * @example formatWeiAsEth(1000000000000000000n) // returns "1.000000 ETH"
 */
export function formatWeiAsEth(wei: bigint, decimals: number = 6): string {
  return `${weiToEth(wei).toFixed(decimals)} ETH`;
}

// Export constants for external use if needed
export { TG_PER_ETH, WEI_PER_ETH, WEI_PER_TG };