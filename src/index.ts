import 'dotenv/config';

import { loadConfigFromFile, resolveConfig } from './config.js';
import { loadKeypair } from './keypair.js';
import { createPoolWithLiquidity } from './pool.js';
import type { CliArgs } from './types.js';

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const cliArgs: CliArgs = {};

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (current === '--config' || current === '-c') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --config option.');
      }
      cliArgs.configPath = value;
      index += 1;
      continue;
    }

    if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  return cliArgs;
}

function printHelp(): void {
  console.log(`Create a Cetus CLMM pool with SUI as the quote token.

Usage:
  npm start -- --config ./pool.config.json

Options:
  -c, --config <path>   Path to the pool configuration JSON file (default: pool.config.json)
  -h, --help            Show this help message
`);
}

async function main(): Promise<void> {
  try {
    const args = parseArgs();
    const rawConfig = loadConfigFromFile(args.configPath);
    const config = resolveConfig(rawConfig);
    const keypair = loadKeypair(config.privateKey);

    console.log(`Loaded configuration for network: ${config.network}`);
    console.log(`Creating pool for ${config.baseCoinType} / ${config.quoteCoinType}`);

    const result = await createPoolWithLiquidity(config, keypair);

    if (result.type === 'dryRun') {
      console.log('Simulation completed successfully. Inspect the `response` object for details.');
      console.dir(result.response, { depth: 4 });
      return;
    }

    console.log(`Transaction submitted. Digest: ${result.digest}`);
    console.dir(result.response, { depth: 4 });
  } catch (error) {
    console.error('Failed to create pool:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

await main();
