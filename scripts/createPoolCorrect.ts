import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import Decimal from 'decimal.js';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

const POOL_CREATOR = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';
const CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';
const CLOCK = '0x6';

const SUI = '0x2::sui::SUI';
const FIRST = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';
const FIRST_META = '0xbbdb521bbd0d5ced873e6e38900e61050d493cb5b722dc54bc16803ecaea1aac';
const SUI_META = '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3';

function sqrtPrice(p: number): string {
  return new Decimal(Math.sqrt(p)).mul(new Decimal(2).pow(64)).floor().toString();
}

async function create() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  CREATING FIRST/SUI POOL - 1% FEE    ║');
  console.log('║     Using Entry Function (No Returns) ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const firstCoins = await client.getCoins({ owner: address, coinType: FIRST });
  const suiCoins = await client.getCoins({ owner: address, coinType: SUI, limit: 5 });
  
  console.log(`FIRST coins: ${firstCoins.data.length}`);
  console.log(`SUI coins: ${suiCoins.data.length}\n`);
  
  const txb = new TransactionBlock();
  txb.setGasBudget(40000000); // 0.04 SUI for gas
  
  // Merge SUI coins if multiple
  if (suiCoins.data.length > 1) {
    const primarySui = suiCoins.data[0].coinObjectId;
    const toMerge = suiCoins.data.slice(1).map(c => txb.object(c.coinObjectId));
    txb.mergeCoins(txb.object(primarySui), toMerge);
  }
  
  // Price: 1 FIRST = 0.0001 SUI (less extreme 1:10,000 ratio)
  const price = 0.0001;
  const sqrt = sqrtPrice(price);
  
  // Current tick for this price is around -46054
  // Use range -46060 to -46048 (aligned to 2)
  const tickLower = 4294921236;  // -46060 as u32
  const tickUpper = 4294921248;  // -46048 as u32
  
  console.log(`Price: 1 FIRST = ${price} SUI`);
  console.log(`Sqrt Price: ${sqrt}`);
  console.log(`Tick Range: ${tickLower} to ${tickUpper}`);
  console.log(`Tick Spacing: 2\n`);
  
  // Call entry function - it takes MUTABLE REFERENCES to coins
  // and handles everything internally (no return values)
  txb.moveCall({
    target: `${POOL_CREATOR}::pool_creator_v2::create_pool_v2`,
    typeArguments: [FIRST, SUI],
    arguments: [
      txb.object(CONFIG),
      txb.object(POOLS),
      txb.pure(2, 'u32'),
      txb.pure(sqrt, 'u128'),
      txb.pure('https://cetus.zone'),
      txb.pure(tickLower, 'u32'),
      txb.pure(tickUpper, 'u32'),
      txb.object(firstCoins.data[0].coinObjectId),  // ALL FIRST tokens
      txb.gas,  // Use gas coin (has most SUI)
      txb.object(FIRST_META),
      txb.object(SUI_META),
      txb.pure(false, 'bool'),
      txb.object(CLOCK),
    ],
  });
  
  console.log('🔏 Executing transaction...\n');
  
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
          console.log('📡 Pool Created:');
          console.log(`   Pool ID: ${poolData.pool_id}`);
          console.log(`   Coin A: ${poolData.coin_type_a?.split('::').pop() || 'FIRST'}`);
          console.log(`   Coin B: ${poolData.coin_type_b?.split('::').pop() || 'SUI'}`);
          console.log(`   Tick Spacing: ${poolData.tick_spacing}`);
          console.log(`\n🏊 YOUR POOL: ${poolData.pool_id}`);
          console.log('\n🔗 Trade on Cetus: https://app.cetus.zone/');
          console.log('✨ Your FIRST/SUI pool is now LIVE on mainnet!');
        }
      }
    }
    
    if (res.objectChanges) {
      console.log('\n📦 Objects Created:');
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

create().catch(console.error);
