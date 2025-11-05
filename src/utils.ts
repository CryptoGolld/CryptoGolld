import { Decimal } from 'decimal.js';
import { ClmmPoolUtil } from '@cetusprotocol/cetus-sui-clmm-sdk';

/**
 * Utility functions for Cetus pool operations
 */

/**
 * Convert price to sqrt price X64 format used by Cetus
 */
export function priceToSqrtPriceX64(
  price: number,
  decimalsA: number,
  decimalsB: number
): string {
  const sqrtPrice = ClmmPoolUtil.priceToSqrtPriceX64(
    new Decimal(price),
    decimalsA,
    decimalsB
  );
  return sqrtPrice.toString();
}

/**
 * Convert sqrt price X64 back to regular price
 */
export function sqrtPriceX64ToPrice(
  sqrtPriceX64: string,
  decimalsA: number,
  decimalsB: number
): number {
  const price = ClmmPoolUtil.sqrtPriceX64ToPrice(
    new Decimal(sqrtPriceX64),
    decimalsA,
    decimalsB
  );
  return price.toNumber();
}

/**
 * Convert price to tick index
 */
export function priceToTick(
  price: number,
  decimalsA: number,
  decimalsB: number
): number {
  const tick = ClmmPoolUtil.priceToTickIndex(
    new Decimal(price),
    decimalsA,
    decimalsB
  );
  return tick;
}

/**
 * Convert tick index to price
 */
export function tickToPrice(
  tick: number,
  decimalsA: number,
  decimalsB: number
): number {
  const price = ClmmPoolUtil.tickIndexToPrice(
    tick,
    decimalsA,
    decimalsB
  );
  return price.toNumber();
}

/**
 * Calculate the nearest valid tick based on tick spacing
 */
export function getNearestValidTick(tick: number, tickSpacing: number): number {
  return Math.round(tick / tickSpacing) * tickSpacing;
}

/**
 * Validate if a tick is valid for given tick spacing
 */
export function isValidTick(tick: number, tickSpacing: number): boolean {
  return tick % tickSpacing === 0;
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: bigint | string, decimals: number): string {
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const wholePart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  return `${wholePart}.${fractionalStr}`;
}

/**
 * Parse token amount string to raw amount with decimals
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [whole, fractional = ''] = amount.split('.');
  const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
  const rawAmount = BigInt(whole + fractionalPadded);
  return rawAmount;
}

/**
 * Calculate price impact for a given trade amount
 */
export function calculatePriceImpact(
  amountIn: number,
  reserveIn: number,
  reserveOut: number
): number {
  const k = reserveIn * reserveOut;
  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = k / newReserveIn;
  const amountOut = reserveOut - newReserveOut;
  
  const executionPrice = amountIn / amountOut;
  const marketPrice = reserveIn / reserveOut;
  const priceImpact = Math.abs((executionPrice - marketPrice) / marketPrice) * 100;
  
  return priceImpact;
}

/**
 * Common fee tiers for Cetus pools
 */
export const FEE_TIERS = {
  LOWEST: 100,      // 0.01% - for very stable pairs
  LOW: 500,         // 0.05% - for stable pairs
  MEDIUM: 3000,     // 0.3% - for most pairs
  HIGH: 10000,      // 1% - for exotic pairs
} as const;

/**
 * Common tick spacings
 */
export const TICK_SPACINGS = {
  FINEST: 1,        // Stablecoins
  FINE: 10,         // Low volatility
  STANDARD: 60,     // Most pairs
  COARSE: 200,      // High volatility
} as const;

/**
 * Get recommended tick spacing for fee tier
 */
export function getRecommendedTickSpacing(feeRate: number): number {
  if (feeRate <= 500) return TICK_SPACINGS.FINE;
  if (feeRate <= 3000) return TICK_SPACINGS.STANDARD;
  return TICK_SPACINGS.COARSE;
}

/**
 * Sort two token addresses in lexicographic order (required by Cetus)
 */
export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA.toLowerCase() < tokenB.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];
}

/**
 * Validate Sui address format
 */
export function isValidSuiAddress(address: string): boolean {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return /^[0-9a-fA-F]{64}$/.test(cleanAddress);
}

/**
 * Normalize Sui address to standard format (0x + 64 hex chars)
 */
export function normalizeSuiAddress(address: string): string {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return '0x' + cleanAddress.padStart(64, '0');
}

/**
 * Calculate liquidity for a given amount in a price range
 */
export function calculateLiquidity(
  amountA: number,
  amountB: number,
  priceLower: number,
  priceUpper: number,
  currentPrice: number
): number {
  const sqrtPriceLower = Math.sqrt(priceLower);
  const sqrtPriceUpper = Math.sqrt(priceUpper);
  const sqrtPriceCurrent = Math.sqrt(currentPrice);
  
  let liquidity: number;
  
  if (currentPrice < priceLower) {
    // Only token A
    liquidity = amountA / (1 / sqrtPriceLower - 1 / sqrtPriceUpper);
  } else if (currentPrice > priceUpper) {
    // Only token B
    liquidity = amountB / (sqrtPriceUpper - sqrtPriceLower);
  } else {
    // Both tokens
    const liquidityA = amountA / (1 / sqrtPriceCurrent - 1 / sqrtPriceUpper);
    const liquidityB = amountB / (sqrtPriceCurrent - sqrtPriceLower);
    liquidity = Math.min(liquidityA, liquidityB);
  }
  
  return liquidity;
}

/**
 * Network RPC URLs
 */
export const NETWORK_URLS = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
} as const;

/**
 * Common Cetus addresses (these need to be updated based on actual deployments)
 */
export const CETUS_ADDRESSES = {
  mainnet: {
    globalConfig: '0x6f4149091a5aea0e818e7243a13adcfb403842d670b9a2089de058512620687a',
    poolPackage: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
  },
  testnet: {
    globalConfig: '0x6f4149091a5aea0e818e7243a13adcfb403842d670b9a2089de058512620687a',
    poolPackage: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
  },
} as const;

/**
 * SUI token type constant
 */
export const SUI_TYPE = '0x2::sui::SUI';

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
