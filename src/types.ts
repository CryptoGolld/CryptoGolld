/**
 * Type definitions for Cetus pool operations
 */

export interface PoolConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  tokenAddress: string;
  tokenDecimals: number;
  initialPrice: number;
  feeRate: number;
  tickSpacing: number;
}

export interface CetusConfig {
  package_id: string;
  published_at: string;
  config: {
    pools_id: string;
    global_config_id: string;
    global_vault_id: string;
  };
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply?: bigint;
}

export interface PoolInfo {
  poolId: string;
  coinTypeA: string;
  coinTypeB: string;
  currentSqrtPrice: string;
  currentTick: number;
  feeRate: number;
  tickSpacing: number;
  liquidity: string;
  feeProtocolCoinA: number;
  feeProtocolCoinB: number;
}

export interface Position {
  positionId: string;
  poolId: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  feeOwedA: string;
  feeOwedB: string;
}

export interface SwapResult {
  amountIn: string;
  amountOut: string;
  feeAmount: string;
  priceImpact: number;
  sqrtPriceAfter: string;
  tickAfter: number;
}

export interface LiquidityRange {
  lowerPrice: number;
  upperPrice: number;
  lowerTick: number;
  upperTick: number;
}

export interface TransactionResult {
  digest: string;
  status: 'success' | 'failure';
  gasUsed?: bigint;
  objectChanges?: ObjectChange[];
  events?: any[];
}

export interface ObjectChange {
  type: 'created' | 'mutated' | 'deleted' | 'wrapped' | 'published';
  objectType?: string;
  objectId?: string;
  sender?: string;
  owner?: string | { AddressOwner: string } | { ObjectOwner: string } | { Shared: { initial_shared_version: number } };
  previousVersion?: string;
  version?: string;
  digest?: string;
}

export interface NetworkConfig {
  name: 'mainnet' | 'testnet' | 'devnet';
  rpcUrl: string;
  explorerUrl: string;
  cetusConfig: CetusConfig;
}

export interface WalletInfo {
  address: string;
  suiBalance: bigint;
  tokens: Map<string, bigint>;
}

export interface PriceRange {
  lower: number;
  upper: number;
  current: number;
}

export interface FeeTier {
  fee: number;
  tickSpacing: number;
  label: string;
}

export const FEE_TIER_INFO: Record<number, FeeTier> = {
  100: { fee: 100, tickSpacing: 1, label: '0.01%' },
  500: { fee: 500, tickSpacing: 10, label: '0.05%' },
  3000: { fee: 3000, tickSpacing: 60, label: '0.3%' },
  10000: { fee: 10000, tickSpacing: 200, label: '1%' },
};

export interface CreatePoolParams {
  coinTypeA: string;
  coinTypeB: string;
  tickSpacing: number;
  initialPrice: number;
  feeRate: number;
}

export interface AddLiquidityParams {
  poolId: string;
  amountA: bigint;
  amountB: bigint;
  tickLower: number;
  tickUpper: number;
  slippage: number;
}

export interface RemoveLiquidityParams {
  positionId: string;
  liquidity: bigint;
  slippage: number;
}

export interface SwapParams {
  poolId: string;
  amountIn: bigint;
  amountOutMinimum: bigint;
  sqrtPriceLimit?: string;
  aToB: boolean;
}

export type NetworkType = 'mainnet' | 'testnet' | 'devnet';

export type TransactionStatus = 'pending' | 'success' | 'failure';

export interface GasEstimate {
  gasPrice: bigint;
  gasBudget: bigint;
  computationCost: bigint;
  storageCost: bigint;
  storageRebate: bigint;
  totalCost: bigint;
}
