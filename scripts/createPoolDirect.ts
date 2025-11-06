import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Use CURRENT CLMM package (from recent mainnet pools)
const CLMM_PACKAGE = '0x157468379cfe5616c063ae39a889dd184ad48350d3e08f8d9b4ade22b8e3fb61';
const CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';
const CLOCK = '0x6';

const SUI = '0x2::sui::SUI';
const FIRST = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';

async function createPoolDirect() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  USING EXACT WORKING PARAMETERS!!!    ║');
  console.log('║  Direct CLMM Package - 1% Fee         ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const firstCoins = await client.getCoins({ owner: address, coinType: FIRST });
  
  console.log(`Wallet: ${address}`);
  console.log(`FIRST coins available: ${firstCoins.data.length}\n`);
  
  const txb = new TransactionBlock();
  txb.setGasBudget(50000000); // 0.05 SUI gas
  
  // Split coins
  const [firstCoin] = txb.splitCoins(
    txb.object(firstCoins.data[0].coinObjectId),
    [txb.pure(10000000000000, 'u64')]  // 10k FIRST
  );
  
  const [suiCoin] = txb.splitCoins(
    txb.gas,
    [txb.pure(90000000, 'u64')]  // 0.09 SUI (leaving room for gas)
  );
  
  // Use tick spacing 2 (current mainnet standard)
  const tickSpacing = 2;
  const sqrtPrice = '18446744073709551';  // From working tx
  const tickLower = 4294523660;  // -443636 (aligned to 2)
  const tickUpper = 443636;        // Aligned to 2
  
  console.log('Parameters (from YOUR working tx):');
  console.log(`  Tick Spacing: ${tickSpacing} (1% fee)`);
  console.log(`  Sqrt Price: ${sqrtPrice}`);
  console.log(`  Tick Lower: ${tickLower}`);
  console.log(`  Tick Upper: ${tickUpper}`);
  console.log(`  Amounts: 10k FIRST + 0.1 SUI\n`);
  
  console.log('🔏 Calling factory::create_pool_with_liquidity...\n');
  
  // Call the CLMM factory directly (correct parameter order!)
  // Params: Pools, GlobalConfig, tick_spacing, sqrt_price, url, tick_lower, tick_upper,
  //         coin_a, coin_b, amount_a_min, amount_b_min, is_open, Clock
  txb.moveCall({
    target: `${CLMM_PACKAGE}::factory::create_pool_with_liquidity`,
    typeArguments: [FIRST, SUI],
    arguments: [
      txb.object(POOLS),          // 0: Pools (FIRST!)
      txb.object(CONFIG),         // 1: GlobalConfig
      txb.pure(tickSpacing, 'u32'),  // 2: tick_spacing
      txb.pure(sqrtPrice, 'u128'),   // 3: sqrt_price
      txb.pure(''),                  // 4: url string
      txb.pure(tickLower, 'u32'),    // 5: tick_lower
      txb.pure(tickUpper, 'u32'),    // 6: tick_upper
      firstCoin,                     // 7: Coin<FIRST>
      suiCoin,                       // 8: Coin<SUI>
      txb.pure(0, 'u64'),           // 9: amount_a_min (0 for now)
      txb.pure(0, 'u64'),           // 10: amount_b_min (0 for now)
      txb.pure(false, 'bool'),       // 11: is_open
      txb.object(CLOCK),             // 12: Clock
    ],
  });
  
  const res = await client.signAndExecuteTransactionBlock({
    transactionBlock: txb,
    signer: keypair,
    options: {
      showEffects: true,
      showObjectChanges: true,
      showEvents: true,
    },
    requestType: 'WaitForLocalExecution',
  });
  
  console.log('✅ Transaction submitted!');
  console.log(`📋 Digest: ${res.digest}\n`);
  console.log('🔗 View on Explorer:');
  console.log(`   https://suiscan.xyz/mainnet/tx/${res.digest}\n`);
  
  if (res.effects?.status.status === 'success') {
    console.log('🎉🎉🎉 POOL CREATED SUCCESSFULLY!!! 🎉🎉🎉\n');
    
    if (res.events) {
      for (const event of res.events) {
        if (event.type.includes('CreatePoolEvent') && event.parsedJson) {
          const poolData = event.parsedJson as any;
          console.log('📡 Pool Details:');
          console.log(`   Pool ID: ${poolData.pool_id}`);
          console.log(`   Tick Spacing: ${poolData.tick_spacing}`);
          console.log(`\n🏊 YOUR POOL: ${poolData.pool_id}`);
          console.log('\n✨ FIRST/SUI pool is LIVE on Cetus mainnet!');
          console.log('🔗 Trade: https://app.cetus.zone/');
        }
      }
    }
    
    if (res.objectChanges) {
      console.log('\n📦 Created Objects:');
      res.objectChanges.forEach(change => {
        if (change.type === 'created') {
          console.log(`   - ${change.objectType?.split('::').pop()}: ${change.objectId}`);
        }
      });
    }
    
  } else {
    console.error('\n❌ Transaction FAILED!');
    console.error('Error:', res.effects?.status.error);
  }
}

createPoolDirect().catch(console.error);
