# Quick Start Guide

Get your Cetus pool up and running in 5 minutes! 🚀

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] Have a Sui wallet with private key
- [ ] Have at least 1 SUI in your wallet for gas
- [ ] Know your token's address and decimals

## Step-by-Step Setup

### 1️⃣ Install Dependencies (2 minutes)

```bash
npm install
```

### 2️⃣ Create .env File (1 minute)

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
NETWORK=testnet
PRIVATE_KEY=your_64_character_hex_private_key_here
TOKEN_ADDRESS=0x2::your_token::YOUR_TOKEN
TOKEN_DECIMALS=9
INITIAL_PRICE=1.0
FEE_RATE=3000
TICK_SPACING=60
```

### 3️⃣ Update Cetus Addresses (1 minute)

Get the correct Cetus protocol addresses for your network from [Cetus Documentation](https://cetus-1.gitbook.io/cetus-docs/):

```env
CETUS_GLOBAL_CONFIG=0x...actual_address...
CETUS_FACTORY=0x...actual_address...
CETUS_POOL_PACKAGE=0x...actual_address...
```

### 4️⃣ Build & Run (1 minute)

```bash
npm run build
npm start
```

## Common Configurations

### Stablecoin Pair
```env
INITIAL_PRICE=1.0
FEE_RATE=500
TICK_SPACING=10
```

### Standard Token Pair
```env
INITIAL_PRICE=1.0
FEE_RATE=3000
TICK_SPACING=60
```

### Meme/Volatile Token
```env
INITIAL_PRICE=0.001
FEE_RATE=10000
TICK_SPACING=200
```

## Troubleshooting

### ❌ "PRIVATE_KEY not found"
→ Make sure you created `.env` file from `.env.example`

### ❌ "Insufficient SUI balance"
→ Add more SUI to your wallet (need at least 1 SUI)

### ❌ "Transaction failed"
→ Verify Cetus addresses are correct for your network

### ❌ "Module not found"
→ Run `npm install` again

## Understanding Price

The `INITIAL_PRICE` is how many SUI one unit of your token is worth:

- `INITIAL_PRICE=1.0` → 1 TOKEN = 1 SUI
- `INITIAL_PRICE=0.1` → 1 TOKEN = 0.1 SUI (10 tokens per SUI)
- `INITIAL_PRICE=10.0` → 1 TOKEN = 10 SUI

## What Happens When You Run?

1. ✅ Validates your configuration
2. ✅ Checks your SUI balance
3. ✅ Sorts tokens in correct order
4. ✅ Calculates sqrt price
5. ✅ Creates transaction
6. ✅ Submits to blockchain
7. ✅ Returns pool ID and transaction digest

## Next Steps

After creating your pool:

1. **View on Explorer**: The script provides a link to view your transaction
2. **Add Liquidity**: Use Cetus UI or SDK to add liquidity
3. **Enable Trading**: Your pool is ready for swaps!

## Need Help?

- Check the full [README.md](./README.md) for detailed documentation
- Review [examples](./src/example.ts) for advanced usage
- Visit [Cetus Documentation](https://cetus-1.gitbook.io/cetus-docs/)

## Security Reminder 🔐

- **NEVER** commit your `.env` file
- **NEVER** share your private key
- **ALWAYS** test on testnet first
- Use a dedicated wallet with limited funds

---

**Ready to create your pool? Run `npm start`!** 🎉
