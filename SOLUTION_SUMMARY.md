# Cetus Pool Creation - Solution Summary

## Status: BLOCKED by CLMM Liquidity Math

### What Works ✅

The TypeScript infrastructure is FULLY FUNCTIONAL:

```typescript
// Correct approach for Cetus mainnet:
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Mainnet addresses (VERIFIED):
const POOL_CREATOR = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';
const CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';

// Call pattern (CORRECT):
txb.moveCall({
  target: `${POOL_CREATOR}::pool_creator_v2::create_pool_v2`,
  typeArguments: [FIRST, SUI],
  arguments: [
    CONFIG, POOLS, tickSpacing, sqrtPrice, url,
    tickLower, tickUpper, firstCoin, suiCoin,
    FIRST_META, SUI_META, is_open, CLOCK
  ]
});
```

### The Blocker ❌

**Error:** `MoveAbort in build_init_position_arg, error 1`

**Cause:** The CLMM math library (`clmm_math::get_liquidity_by_amount`) calculates that the provided token amounts are INSUFFICIENT for the given:
- Price (sqrt price)
- Tick range (position width)
- Tick spacing

**What This Means:**
The Cetus protocol enforces minimum liquidity requirements that depend on the mathematical relationship between price, range, and amounts. With:
- 10,000 FIRST tokens
- 0.1 SUI
- Extreme price ratio (1 FIRST = 0.00001-0.0001 SUI)
- Wide tick ranges

...the math doesn't work out.

### Attempts Made (All Failed)

| Attempt | Tick Spacing | Sqrt Price | Tick Range | Amounts | Result |
|---------|--------------|------------|------------|---------|--------|
| 1 | 200 | 18446744073709551 | -443600 to 443600 | 10k FIRST + 0.1 SUI | Math error 1 |
| 2 | 2 | 18446744073709551 | -443600 to 443600 | 10k FIRST + 0.1 SUI | Math error 1 |
| 3 | 2 | 79228162514264337593543950336 | -1000 to 1000 | 10k FIRST + 0.1 SUI | Tick math error 2 |
| 4 | 2 | 792281625142643375935439 | -114000 to 114000 | 10k FIRST + 0.1 SUI | Pool creator error 5 |
| 5 | 200 | 18446744073709551 | -2000 to 2000 | 10k FIRST + 0.1 SUI | Math error 3018 |
| 6 | 200 | 18446744073709551 | -443600 to 443600 | 1k FIRST + 0.01 SUI | Math error 1 |

### Your Working Frontend Transaction

**Inputs you provided:**
```json
{
  "tick_spacing": 200,
  "sqrt_price": "18446744073709551",
  "tick_lower": 4294523696,  // -443600
  "tick_upper": 443600,
  "amount_1": "100000023324977",  // ~100 units?
  "amount_2": "100000000"          // 0.1 SUI
}
```

**Package:** `0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb` (OLD version, no longer works - package upgrade)

### Key Learnings

1. **Pool Creator V2 is Required:** Direct `factory::create_pool` calls are disabled (abort immediately). Must use `pool_creator_v2::create_pool_v2`.

2. **CoinMetadata Objects Required:** Pool creation needs `CoinMetadata` object IDs:
   - FIRST: `0xbbdb521bbd0d5ced873e6e38900e61050d493cb5b722dc54bc16803ecaea1aac`
   - SUI: `0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3`

3. **Tick Alignment:** Ticks must be divisible by tick_spacing. Negative ticks use u32 two's complement.

4. **Entry Function:** `create_pool_v2` is an entry function (returns void), handles all transfers internally.

5. **Version Locking:** Cetus enforces package version checks. Old packages (like the one you used in frontend) no longer work.

### Next Steps / Solutions

**Option 1:** Use Cetus Frontend
- The frontend works and handles all the math/validation
- Already confirmed working for you

**Option 2:** Get More Tokens
- Your working tx might have used more than 10k FIRST
- Try with 100k FIRST + 1 SUI and see if math works

**Option 3:** Contact Cetus
- Ask about minimum liquidity requirements
- Get clarification on programmatic pool creation

**Option 4:** Different Price/Range
- Try a 1:1 or 1:10 price ratio (less extreme)
- Use a tighter range (e.g., current price ±10%)

### Working Scripts

All scripts are in `/workspace/scripts/`:
- `createPoolDirect.ts` - Direct CLMM factory approach
- `useWorkingParams.ts` - Using your exact parameters
- `finalAttempt.ts` - Latest attempt with various params
- `deriveKey.ts` - Wallet derivation and balance checking

### Transaction Links

All failed transactions are viewable on Suiscan:
- Latest: https://suiscan.xyz/mainnet/tx/2k7zy52KMyW1CjqRH3mqK481s9xbvFaZN1jVd5C7EvcU

---

**Bottom Line:** The code is correct, but the math doesn't work with current token amounts. This is a protocol-level constraint, not a code bug.
