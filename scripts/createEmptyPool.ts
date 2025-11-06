import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

const CLMM_PKG = '0x157468379cfe5616c063ae39a889dd184ad48350d3e08f8d9b4ade22b8e3fb61';
const CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';
const CLOCK = '0x6';

const SUI = '0x2::sui::SUI';
const FIRST = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';

async function createEmptyPool() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Creating EMPTY Pool (No Liquidity)   ║');
  console.log('║  Then Add Liquidity Separately        ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const txb = new TransactionBlock();
  txb.setGasBudget(50000000);
  
  // Use exact params from user's working tx
  const tickSpacing = 200;
  const sqrtPrice = '18446744073709551';
  
  console.log('Creating pool WITHOUT initial liquidity...');
  console.log(`  Tick Spacing: ${tickSpacing} (1% fee)`);
  console.log(`  Sqrt Price: ${sqrtPrice}\n`);
  
  // Call factory::create_pool (NOT create_pool_with_liquidity)
  txb.moveCall({
    target: `${CLMM_PKG}::factory::create_pool`,
    typeArguments: [FIRST, SUI],
    arguments: [
      txb.object(POOLS),
      txb.object(CONFIG),
      txb.pure(tickSpacing, 'u32'),
      txb.pure(sqrtPrice, 'u128'),
      txb.pure(''),
      txb.object(CLOCK),
    ],
  });
  
  console.log('Executing...\n');
  
  const res = await client.signAndExecuteTransactionBlock({
    transactionBlock: txb,
    signer: keypair,
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
    requestType: 'WaitForLocalExecution',
  });
  
  console.log('Digest:', res.digest);
  console.log('https://suiscan.xyz/mainnet/tx/' + res.digest + '\n');
  
  if (res.effects?.status.status === 'success') {
    console.log('🎉🎉🎉 POOL CREATED!!! 🎉🎉🎉\n');
    
    if (res.events) {
      for (const event of res.events) {
        if (event.type.includes('CreatePoolEvent') && event.parsedJson) {
          const poolData = event.parsedJson as any;
          console.log('📡 Pool Created:');
          console.log(`   Pool ID: ${poolData.pool_id}`);
          console.log(`   Tick Spacing: ${poolData.tick_spacing}`);
          console.log(`\n🏊 YOUR POOL: ${poolData.pool_id}`);
          console.log('\n✨ Empty pool created! Now add liquidity separately.');
        }
      }
    }
    
    if (res.objectChanges) {
      console.log('\n📦 Created Objects:');
      res.objectChanges.forEach((change: any) => {
        if (change.type === 'created' && change.objectType?.includes('Pool')) {
          console.log(`   POOL OBJECT: ${change.objectId}`);
        }
      });
    }
    
  } else {
    console.error('Failed:', res.effects?.status.error);
  }
}

createEmptyPool().catch(console.error);
