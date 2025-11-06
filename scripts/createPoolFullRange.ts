import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import Decimal from 'decimal.js';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Addresses
const POOL_CREATOR_PACKAGE = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';
const UTILS_PACKAGE = '0x2d8c2e0fc6dd25b0214b3fa747e0fd27fd54608142cd2e4f64c1cd350cc4add4';
const CETUS_CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const CETUS_POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';
const CLOCK_OBJECT = '0x6';

const SUI_TYPE = '0x2::sui::SUI';
const FIRST_TYPE = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';

// Metadata IDs
const FIRST_METADATA = '0xbbdb521bbd0d5ced873e6e38900e61050d493cb5b722dc54bc16803ecaea1aac';
const SUI_METADATA = '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3';

function priceToSqrtPriceX64(price: number): string {
  const sqrtPrice = Math.sqrt(price);
  const Q64 = new Decimal(2).pow(64);
  const sqrtPriceX64 = new Decimal(sqrtPrice).mul(Q64);
  return sqrtPriceX64.floor().toString();
}

function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
}

async function createFullRangePool() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║    FULL RANGE POOL - 1% FEE (10000)   ║');
  console.log('║        FIRST/SUI on Mainnet           ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log('🔑 Wallet:', address, '\n');
  
  const suiBalance = await client.getBalance({ owner: address, coinType: SUI_TYPE });
  const firstBalance = await client.getBalance({ owner: address, coinType: FIRST_TYPE });
  
  console.log(`💰 SUI Balance: ${Number(suiBalance.totalBalance) / 1e9} SUI`);
  console.log(`🪙 FIRST Balance: ${Number(firstBalance.totalBalance) / 1e9} FIRST\n`);
  
  const suiCoins = await client.getCoins({ owner: address, coinType: SUI_TYPE, limit: 10 });
  const firstCoins = await client.getCoins({ owner: address, coinType: FIRST_TYPE });
  
  if (suiCoins.data.length === 0 || firstCoins.data.length === 0) {
    console.error('❌ No coin objects found!');
    return;
  }
  
  console.log(`Found ${suiCoins.data.length} SUI coins`);
  console.log(`Found ${firstCoins.data.length} FIRST coins\n`);
  
  // Sort tokens
  const [coinTypeA, coinTypeB] = sortTokens(FIRST_TYPE, SUI_TYPE);
  const isSuiCoinB = coinTypeB === SUI_TYPE;
  
  // 1% fee = 10000 basis points
  // Tick spacing for 1% fee is typically 200
  const feeRate = 10000;
  const tickSpacing = 200;
  
  console.log('📋 Pool Configuration:');
  console.log(`   Coin A: ${coinTypeA.split('::').pop()}`);
  console.log(`   Coin B: ${coinTypeB.split('::').pop()}`);
  console.log(`   Fee Rate: 1% (10000)`);
  console.log(`   Tick Spacing: ${tickSpacing}`);
  console.log(`   Price: 1 FIRST = 0.00001 SUI`);
  
  const targetPrice = isSuiCoinB ? 0.00001 : 100000;
  const sqrtPriceX64 = priceToSqrtPriceX64(targetPrice);
  console.log(`   Sqrt Price X64: ${sqrtPriceX64}`);
  console.log(`   Liquidity: 0.09 SUI + ALL FIRST\n`);
  
  // Build transaction
  const txb = new TransactionBlock();
  txb.setGasBudget(50000000);
  
  console.log('📝 Building FULL RANGE pool...');
  
  try {
    // Split coins
    const [suiForPool] = txb.splitCoins(txb.gas, [txb.pure(90000000, 'u64')]); // 0.09 SUI
    const [firstForPool] = txb.splitCoins(
      txb.object(firstCoins.data[0].coinObjectId), 
      [txb.pure(10000000000000, 'u64')]
    );
    
    // FULL RANGE TICKS
    // For full range with tick spacing 200, use maximum bounds
    // Cetus typically uses -443636 to 443636 for full range (aligned to spacing)
    // With spacing 200: -443600 to 443600
    const FULL_RANGE_LOWER = -443600;
    const FULL_RANGE_UPPER = 443600;
    
    const tickLowerU32 = FULL_RANGE_LOWER < 0 ? 4294967296 + FULL_RANGE_LOWER : FULL_RANGE_LOWER;
    const tickUpperU32 = FULL_RANGE_UPPER;
    
    console.log(`   Full Range Ticks: ${FULL_RANGE_LOWER} to ${FULL_RANGE_UPPER}`);
    console.log(`   As u32: ${tickLowerU32} to ${tickUpperU32}\n`);
    
    // Call create_pool_v2
    txb.moveCall({
      target: `${POOL_CREATOR_PACKAGE}::pool_creator_v2::create_pool_v2`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        txb.object(CETUS_CONFIG),
        txb.object(CETUS_POOLS),
        txb.pure(tickSpacing, 'u32'),
        txb.pure(sqrtPriceX64, 'u128'),
        txb.pure('https://cetus.zone', 'string'),
        txb.pure(tickLowerU32, 'u32'),
        txb.pure(tickUpperU32, 'u32'),
        isSuiCoinB ? firstForPool : suiForPool,
        isSuiCoinB ? suiForPool : firstForPool,
        txb.object(isSuiCoinB ? FIRST_METADATA : SUI_METADATA),
        txb.object(isSuiCoinB ? SUI_METADATA : FIRST_METADATA),
        txb.pure(false, 'bool'),
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
            console.log('📡 Pool Event:', JSON.stringify(event.parsedJson, null, 2));
            
            if (event.parsedJson && typeof event.parsedJson === 'object' && 'pool_id' in event.parsedJson) {
              console.log(`\n🏊 POOL ID: ${event.parsedJson.pool_id}\n`);
            }
          }
        }
      }
      
      console.log('✨ Your FIRST/SUI pool is LIVE on Cetus!');
      
    } else {
      console.error('\n❌ Failed:', response.effects?.status.error);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
  }
}

createFullRangePool().catch(console.error);
