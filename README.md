# Cetus Pool Creator for Sui

A complete TypeScript solution to create Cetus liquidity pools on the Sui blockchain with SUI as the quote token.

## 🎯 Features

- ✅ Create Cetus concentrated liquidity pools (CLMM)
- ✅ SUI as quote token paired with any custom token
- ✅ Configurable initial price, fee rate, and tick spacing
- ✅ Support for mainnet, testnet, and devnet
- ✅ Automatic token type ordering (lexicographic)
- ✅ Balance checking and validation
- ✅ Comprehensive error handling and logging

## 📋 Prerequisites

- Node.js v18 or higher
- npm or yarn
- A Sui wallet with:
  - SUI tokens for gas fees (at least 1 SUI recommended)
  - The custom token you want to pair with SUI
- Cetus protocol deployed on your target network

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Network: mainnet, testnet, or devnet
NETWORK=testnet

# Your wallet private key (KEEP THIS SECURE!)
PRIVATE_KEY=your_private_key_in_hex_format

# Cetus Protocol Addresses (get these from Cetus docs for your network)
CETUS_GLOBAL_CONFIG=0x...
CETUS_FACTORY=0x...
CETUS_POOL_PACKAGE=0x...

# Token Configuration
TOKEN_ADDRESS=0x2::your_token::YOUR_TOKEN
TOKEN_DECIMALS=9

# Pool Settings
INITIAL_PRICE=1.0
FEE_RATE=3000
TICK_SPACING=60
```

### 3. Build the Project

```bash
npm run build
```

### 4. Create Your Pool

```bash
npm start
```

## ⚙️ Configuration Details

### Network Options
- `mainnet` - Production Sui network
- `testnet` - Testing network
- `devnet` - Development network

### Fee Rates
Common fee tiers (in basis points):
- `500` = 0.05% (for stablecoin pairs)
- `3000` = 0.3% (standard pairs)
- `10000` = 1% (exotic/volatile pairs)

### Tick Spacing
Determines price granularity:
- `1` - Finest granularity (stablecoins)
- `10` - Fine granularity
- `60` - Standard (most common)
- `200` - Coarse granularity (volatile pairs)

### Initial Price
The starting price ratio between your token and SUI:
- `1.0` - 1 TOKEN = 1 SUI
- `0.1` - 1 TOKEN = 0.1 SUI (10 tokens per SUI)
- `10.0` - 1 TOKEN = 10 SUI

## 📦 Project Structure

```
.
├── src/
│   └── createPool.ts      # Main pool creation logic
├── dist/                  # Compiled JavaScript output
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env                  # Your configuration (create from .env.example)
└── .env.example          # Example configuration template
```

## 🔧 Advanced Usage

### Using as a Library

You can import and use the `CetusPoolCreator` class in your own code:

```typescript
import { CetusPoolCreator, PoolConfig } from './src/createPool';

const config: PoolConfig = {
  network: 'testnet',
  tokenAddress: '0x2::your_token::YOUR_TOKEN',
  tokenDecimals: 9,
  initialPrice: 1.0,
  feeRate: 3000,
  tickSpacing: 60,
};

const creator = new CetusPoolCreator(yourPrivateKey, config);
await creator.createPool();
```

### Getting Pool Information

```typescript
const poolInfo = await creator.getPoolInfo(poolId);
console.log(poolInfo);
```

### Calculate Tick from Price

```typescript
const tick = creator.calculateTickFromPrice(
  1.5,  // price
  9,    // decimals of token A
  9     // decimals of token B
);
```

## 🔐 Security Best Practices

1. **Never commit your `.env` file** - It contains your private key!
2. **Use environment variables** for sensitive data in production
3. **Test on testnet first** before deploying to mainnet
4. **Keep your private key secure** - Anyone with it can access your funds
5. **Use a dedicated wallet** for pool creation with only necessary funds

## 📚 Key Concepts

### Concentrated Liquidity (CLMM)
Cetus uses a concentrated liquidity market maker (CLMM) model, similar to Uniswap V3. This allows liquidity providers to concentrate their capital within specific price ranges for better capital efficiency.

### Quote vs Base Token
- **Quote Token**: SUI (the token prices are quoted in)
- **Base Token**: Your custom token (being priced)
- Pool automatically orders tokens lexicographically

### Sqrt Price
The protocol uses sqrt(price) * 2^64 as the internal price representation for precision and efficiency in calculations.

## 🐛 Troubleshooting

### "Insufficient SUI balance"
- Ensure your wallet has at least 1 SUI for gas fees
- Check your wallet address matches your private key

### "PRIVATE_KEY not found"
- Make sure you've created a `.env` file from `.env.example`
- Verify your private key is in hex format

### "Transaction failed"
- Verify Cetus contract addresses are correct for your network
- Check that you have the token you're trying to pair
- Ensure tick spacing and fee rate are valid values

### SDK Errors
- Make sure all Cetus package IDs are correct
- Verify you're using compatible SDK versions
- Check network connectivity

## 🔗 Useful Resources

- [Cetus Protocol Documentation](https://cetus-1.gitbook.io/cetus-docs/)
- [Sui Developer Documentation](https://docs.sui.io/)
- [Sui Explorer](https://suiexplorer.com/)
- [Cetus DEX](https://www.cetus.zone/)

## 📝 Notes

- This code uses the Cetus CLMM SDK which may need adjustments based on the protocol version
- Pool creation requires proper Cetus protocol deployment on your target network
- Always test thoroughly on testnet before using on mainnet
- Gas fees vary based on network congestion
- The actual Move function signatures may vary depending on the Cetus version deployed

## ⚠️ Disclaimer

This code is provided as-is for educational purposes. Always:
- Review and understand the code before using it
- Test extensively on testnet
- Audit smart contract interactions
- Use at your own risk
- Never share your private keys

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📄 License

MIT License - feel free to use this code for your projects!
