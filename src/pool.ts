import Decimal from 'decimal.js';
import { initCetusSDK, TickMath } from '@cetusprotocol/cetus-sui-clmm-sdk';
import type { CetusClmmSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import type { Keypair } from '@mysten/sui/cryptography';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import type { DevInspectResults, SuiTransactionBlockResponse } from '@mysten/sui/client';

import type { ResolvedPoolCreationConfig } from './types.js';

type TokenInfo = {
  coinType: string;
  decimals: number;
  metadataObjectId: string;
  symbol: string;
};

export type PoolCreationResult =
  | {
      type: 'executed';
      digest: string;
      response: SuiTransactionBlockResponse;
    }
  | {
      type: 'dryRun';
      response: DevInspectResults;
    };

export async function createPoolWithLiquidity(
  config: ResolvedPoolCreationConfig,
  keypair: Keypair,
): Promise<PoolCreationResult> {
  const sender = keypair.getPublicKey().toSuiAddress();
  const rpcUrl = config.fullNodeUrl ?? getFullnodeUrl(config.network);
  const client = new SuiClient({ url: rpcUrl });

  const sdkOptions: Parameters<typeof initCetusSDK>[0] = {
    network: config.network,
    wallet: sender,
  };

  if (config.fullNodeUrl) {
    sdkOptions.fullNodeUrl = config.fullNodeUrl;
  }

  const sdk = initCetusSDK(sdkOptions);

  sdk.senderAddress = sender;

  const baseToken = await resolveTokenInfo(sdk, config.baseCoinType, config.baseMetadataId);
  const quoteToken = await resolveTokenInfo(sdk, config.quoteCoinType, config.quoteMetadataId);

  const baseAmountAtomic = toAtomicUnits(config.baseAmount, baseToken.decimals);
  const quoteAmountAtomic = config.quoteAmount
    ? toAtomicUnits(config.quoteAmount, quoteToken.decimals)
    : deriveQuoteAmount(config.baseAmount, config.initialPrice, quoteToken.decimals);

  await ensureCoinBalance(client, sender, baseToken.coinType, baseAmountAtomic);
  await ensureCoinBalance(client, sender, quoteToken.coinType, quoteAmountAtomic);

  const initialPrice = new Decimal(config.initialPrice);
  const lowerPrice = new Decimal(config.lowerPrice);
  const upperPrice = new Decimal(config.upperPrice);

  if (lowerPrice.greaterThanOrEqualTo(upperPrice)) {
    throw new Error('`lowerPrice` must be strictly less than `upperPrice`.');
  }

  const initializeSqrtPrice = TickMath.priceToSqrtPriceX64(initialPrice, baseToken.decimals, quoteToken.decimals).toString();
  const tickLower = TickMath.priceToInitializableTickIndex(lowerPrice, baseToken.decimals, quoteToken.decimals, config.tickSpacing);
  const tickUpper = TickMath.priceToInitializableTickIndex(upperPrice, baseToken.decimals, quoteToken.decimals, config.tickSpacing);

  if (tickLower >= tickUpper) {
    throw new Error('Computed `tickLower` must be less than `tickUpper`. Check price bounds and tick spacing.');
  }

  const tx = await sdk.Pool.createPoolTransactionPayload({
    coinTypeA: baseToken.coinType,
    coinTypeB: quoteToken.coinType,
    amount_a: baseAmountAtomic,
    amount_b: quoteAmountAtomic,
    tick_spacing: config.tickSpacing,
    initialize_sqrt_price: initializeSqrtPrice,
    tick_lower: tickLower,
    tick_upper: tickUpper,
    uri: config.uri ?? '',
    metadata_a: baseToken.metadataObjectId,
    metadata_b: quoteToken.metadataObjectId,
    fix_amount_a: config.fixAmountOnBase ?? true,
    slippage: config.slippage ?? 0.01,
  });

  if (config.gasBudget) {
    tx.setGasBudget(BigInt(config.gasBudget));
  }

  if (config.dryRun) {
    const simulation = await client.devInspectTransactionBlock({
      sender,
      transactionBlock: tx,
    });

    return {
      type: 'dryRun',
      response: simulation,
    };
  }

  const executionResult = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showEvents: true,
      showBalanceChanges: true,
      showObjectChanges: true,
    },
  });

  return {
    type: 'executed',
    digest: executionResult.digest,
    response: executionResult,
  };
}

async function resolveTokenInfo(
  sdk: CetusClmmSDK,
  coinType: string,
  explicitMetadataId?: string,
): Promise<TokenInfo> {
  const normalized = coinType;

  const tokenFromConfig = await sdk.CetusConfig.getTokenListByCoinTypes([normalized]);
  const tokenFromLegacy = await sdk.Token.getTokenListByCoinTypes([normalized]);

  const candidate = tokenFromConfig[normalized] ?? tokenFromLegacy[normalized];

  const metadata = await sdk.fullClient.getCoinMetadata({ coinType: normalized });

  const decimals = resolveTokenDecimals(candidate, metadata);
  const metadataObjectId = explicitMetadataId ?? candidate?.id ?? metadata?.id ?? undefined;

  if (metadataObjectId === undefined || metadataObjectId === null) {
    throw new Error(
      `Unable to resolve metadata object id for coin ${normalized}. Provide 'baseMetadataId' or 'quoteMetadataId' in the config or ensure the coin is registered in Cetus.`,
    );
  }

  return {
    coinType: normalized,
    decimals,
    metadataObjectId,
    symbol: candidate?.symbol ?? candidate?.official_symbol ?? metadata?.symbol ?? normalized,
  };
}

function resolveTokenDecimals(
  token: { decimals?: number } | undefined,
  metadata: { decimals: number } | null,
): number {
  if (typeof token?.decimals === 'number') {
    return token.decimals;
  }

  if (metadata?.decimals != null) {
    return metadata.decimals;
  }

  throw new Error('Unable to determine token decimals.');
}

function toAtomicUnits(amount: string, decimals: number): string {
  const decimalAmount = new Decimal(amount);
  if (decimalAmount.isNegative()) {
    throw new Error('Token amounts must be non-negative.');
  }

  const factor = new Decimal(10).pow(decimals);
  const atomic = decimalAmount.mul(factor);

  if (!atomic.isInteger()) {
    throw new Error(`Amount ${amount} has more decimal places than supported (${decimals}).`);
  }

  return atomic.toFixed(0);
}

function deriveQuoteAmount(baseAmount: string, price: string, quoteDecimals: number): string {
  const baseAmountDecimal = new Decimal(baseAmount);
  const priceDecimal = new Decimal(price);
  const quoteAtomic = baseAmountDecimal.mul(priceDecimal).mul(new Decimal(10).pow(quoteDecimals));

  if (!quoteAtomic.isInteger()) {
    throw new Error('Derived quote amount is not an integer number of atomic units. Provide `quoteAmount` explicitly.');
  }

  return quoteAtomic.toFixed(0);
}

async function ensureCoinBalance(
  client: SuiClient,
  owner: string,
  coinType: string,
  required: string,
): Promise<void> {
  const balance = await client.getBalance({ owner, coinType });
  const available = BigInt(balance.totalBalance ?? '0');
  const needed = BigInt(required);

  if (available < needed) {
    throw new Error(
      `Insufficient balance for ${coinType}. Required ${needed.toString()} but only ${available.toString()} available.`,
    );
  }
}
