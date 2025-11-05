# Cetus Pool Creator

TypeScript tooling that composes and submits a Cetus CLMM pool creation transaction on Sui, pairing any base token with SUI as the quote asset.

## Prerequisites

- Node.js 18+
- An on-chain Sui account funded with the base token and enough SUI for liquidity and gas
- The base token must already exist on-chain (with published metadata)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure credentials:

   - Copy `.env.example` to `.env`
   - Set `SUI_PRIVATE_KEY` to your wallet private key (`suiprivkey...` or 32-byte hex)

3. Create a pool configuration file:

   ```bash
   cp pool.config.example.json pool.config.json
   ```

   Edit the copy with your pool parameters:

   - `network`: `mainnet` or `testnet`
   - `fullNodeUrl` (optional): custom RPC endpoint override
   - `baseCoinType`: coin type you want to pair with SUI (coin A)
   - `baseAmount`: human-readable amount of the base token to deposit
   - `quoteCoinType`: defaults to `0x2::sui::SUI`
   - `initialPrice`: price of base token denominated in SUI
   - `lowerPrice` / `upperPrice`: price bounds for the initial liquidity position
   - `tickSpacing`: Cetus tick spacing (e.g. 60, 120, 300)
   - `slippage`: deposit slippage tolerance (decimal form, default 0.01)
   - `fixAmountOnBase`: `true` fixes the base deposit amount; otherwise the quote side is fixed
   - `baseMetadataId` / `quoteMetadataId` (optional): override metadata object IDs when they cannot be auto-resolved
   - `uri`: optional metadata URI for the pool

## Running the script

Execute the pool creation flow:

```bash
npm start -- --config pool.config.json
```

The script will:

- Resolve token metadata and decimals
- Validate balance sufficiency for both coins
- Derive the initial sqrt price and tick range
- Build the Cetus `create_pool_v2` transaction and add initial liquidity
- Submit the transaction (or simulate when `dryRun: true` is set in the config)

Successful execution prints the transaction digest and full response payload. When `dryRun` is enabled the dev-inspect output is displayed instead.

## Dry-run / simulation

Set `"dryRun": true` in your config to simulate the transaction without broadcasting it. This is recommended for verifying metadata IDs, tick math, and liquidity amounts before committing funds.

## Notes

- Ensure the wallet holds enough SUI to cover the quote-side liquidity and gas fees.
- If the base token is not registered in Cetus, supply `baseMetadataId` manually (the ID of the `CoinMetadata` object).
- Tick spacing must align with Cetus pool requirements; consult Cetus documentation for supported values.
