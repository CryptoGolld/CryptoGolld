import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import Decimal from 'decimal.js';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Use current package
const CETUS_CLMM_PACKAGE = '0x157468379cfe5616c063ae39a889dd184ad48350d3e08f8d9b4ade22b8e3fb61';
const CETUS_CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const CETUS_POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';
const CLOCK_OBJECT = '0x6';

const SUI_TYPE = '0x2::sui::SUI';
const FIRST_TYPE = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';

function priceToSqrtPriceX64(price: number): string {
  const sqrtPrice = Math.sqrt(price);
  const Q64 = new Decimal(2).pow(64);
  const sqrtPriceX64 = new Decimal(sqrtPrice).mul(Q64);
  return sqrtPriceX64.floor().toString();
}

function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
}

async function createPoolNoLiquidity() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Creating Pool WITHOUT Initial Liquidity║');
  console.log('║         FIRST/SUI - 1% Fee            ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log('🔑 Wallet:', address, '\n');
  
  const suiBalance = await client.getBalance({ owner: address, coinType: SUI_TYPE });
  const firstBalance = await client.getBalance({ owner: address, coinType: FIRST_TYPE });
  
  console.log(`💰 SUI Balance: ${Number(suiBalance.totalBalance) / 1e9} SUI`);
  console.log(`🪙 FIRST Balance: ${Number(firstBalance.totalBalance) / 1e9} FIRST\n`);
  
  // Sort tokens
  const [coinTypeA, coinTypeB] = sortTokens(FIRST_TYPE, SUI_TYPE);
  const isSuiCoinB = coinTypeB === SUI_TYPE;
  
  // 1% fee with tick spacing 200
  const tickSpacing = 200;
  
  console.log('📋 Pool Configuration:');
  console.log(`   Coin A: ${coinTypeA.split('::').pop()}`);
  console.log(`   Coin B: ${coinTypeB.split('::').pop()}`);
  console.log(`   Fee Rate: 1% (based on tick spacing 200)`);
  console.log(`   Tick Spacing: ${tickSpacing}`);
  console.log(`   Price: 1 FIRST = 0.00001 SUI`);
  
  const targetPrice = isSuiCoinB ? 0.00001 : 100000;
  const sqrtPriceX64 = priceToSqrtPriceX64(targetPrice);
  console.log(`   Sqrt Price X64: ${sqrtPriceX64}\n`);
  
  // Build transaction
  const txb = new TransactionBlock();
  txb.setGasBudget(50000000);
  
  console.log('📝 Building pool (NO initial liquidity)...');
  
  try {
    // Call factory::create_pool (no liquidity)
    txb.moveCall({
      target: `${CETUS_CLMM_PACKAGE}::factory::create_pool`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        txb.object(CETUS_POOLS),
        txb.object(CETUS_CONFIG),
        txb.pure(tickSpacing, 'u32'),
        txb.pure(sqrtPriceX64, 'u128'),
        txb.pure('https://cetus.zone', 'string'),
        txb.object(CLOCK_OBJECT),
      ],
    });
    
    console.log('🔏 Signing and executing...\n');
    
    const response = await client.signAndExecuteTransactionBlock({
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
    console.log(`📋 Digest: ${response.digest}\n`);
    console.log('🔗 Suiscan: https://suiscan.xyz/mainnet/tx/' + response.digest + '\n');
    
    if (response.effects?.status.status === 'success') {
      console.log('🎉🎉🎉 POOL CREATED SUCCESSFULLY! 🎉🎉🎉\n');
      
      if (response.events) {
        for (const event of response.events) {
          if (event.type.includes('CreatePoolEvent')) {
            console.log('📡 Pool Event:');
            console.log(JSON.stringify(event.parsedJson, null, 2));
            
            if (event.parsedJson && typeof event.parsedJson === 'object' && 'pool_id' in event.parsedJson) {
              console.log(`\n🏊 POOL ID: ${event.parsedJson.pool_id}\n`);
              console.log('✨ Pool created! Now you can add liquidity to it separately.');
            }
          }
        }
      }
      
    } else {
      console.error('\n❌ Failed:', response.effects?.status.error);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
  }
}

createPoolNoLiquidity().catch(console.error);
