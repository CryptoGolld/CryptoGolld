import fs from 'fs';
import path from 'path';

import type { PoolCreationConfig, ResolvedPoolCreationConfig } from './types.js';

const DEFAULT_QUOTE_TYPE = '0x2::sui::SUI';
const DEFAULT_CONFIG_PATH = 'pool.config.json';
const DEFAULT_SLIPPAGE = 0.01;

export function loadConfigFromFile(filePath?: string): PoolCreationConfig {
  const candidatePaths = [
    filePath,
    process.env.POOL_CONFIG,
    DEFAULT_CONFIG_PATH,
  ].filter((item): item is string => Boolean(item));

  for (const candidate of candidatePaths) {
    const resolved = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(process.cwd(), candidate);

    if (!fs.existsSync(resolved)) {
      continue;
    }

    const raw = fs.readFileSync(resolved, 'utf8');

    try {
      const parsed = JSON.parse(raw) as PoolCreationConfig;
      return parsed;
    } catch (error) {
      throw new Error(`Unable to parse config file at ${resolved}: ${(error as Error).message}`);
    }
  }

  throw new Error(
    `No configuration file found. Checked: ${candidatePaths
      .map((candidate) => path.resolve(process.cwd(), candidate))
      .join(', ')}`,
  );
}

export function resolveConfig(rawConfig: PoolCreationConfig): ResolvedPoolCreationConfig {
  const {
    network,
    baseCoinType,
    baseAmount,
    initialPrice,
    lowerPrice,
    upperPrice,
    tickSpacing,
  } = rawConfig;

  if (!network) {
    throw new Error('`network` must be set to either "mainnet" or "testnet".');
  }

  if (!baseCoinType) {
    throw new Error('`baseCoinType` is required.');
  }

  if (!baseAmount) {
    throw new Error('`baseAmount` is required.');
  }

  if (!initialPrice) {
    throw new Error('`initialPrice` is required.');
  }

  if (!lowerPrice || !upperPrice) {
    throw new Error('`lowerPrice` and `upperPrice` must both be provided.');
  }

  if (typeof tickSpacing !== 'number' || !Number.isInteger(tickSpacing) || tickSpacing <= 0) {
    throw new Error('`tickSpacing` must be a positive integer.');
  }

  const sourcePrivateKey = rawConfig.privateKey ?? process.env.SUI_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
  if (!sourcePrivateKey) {
    throw new Error('A Sui private key must be supplied via config (`privateKey`) or environment variable `SUI_PRIVATE_KEY`.');
  }

  const quoteCoinType = rawConfig.quoteCoinType ?? DEFAULT_QUOTE_TYPE;

  return {
    ...rawConfig,
    privateKey: sourcePrivateKey,
    quoteCoinType,
    slippage: rawConfig.slippage ?? DEFAULT_SLIPPAGE,
  };
}
