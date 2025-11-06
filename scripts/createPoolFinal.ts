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
const CETUS_CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const CETUS_POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';
const CLOCK_OBJECT = '0x6';

// Coin types
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

async function createPool() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║      Cetus Pool Creator - LIVE        ║');
  console.log('║        FIRST/SUI Pool on Mainnet      ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log('🔑 Wallet:', address, '\n');
  
  // Get balances
  const suiBalance = await client.getBalance({ owner: address, coinType: SUI_TYPE });
  const firstBalance = await client.getBalance({ owner: address, coinType: FIRST_TYPE });
  
  console.log(`💰 SUI Balance: ${Number(suiBalance.totalBalance) / 1e9} SUI`);
  console.log(`🪙 FIRST Balance: ${Number(firstBalance.totalBalance) / 1e9} FIRST\n`);
  
  // Get coin objects
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
  
  console.log('📋 Pool Configuration:');
  console.log(`   Coin A: ${coinTypeA.split('::').pop()}`);
  console.log(`   Coin B: ${coinTypeB.split('::').pop()}`);
  
  // Target: 1 FIRST = 0.00001 SUI
  const targetPrice = isSuiCoinB ? 0.00001 : 100000;
  console.log(`   Price: 1 FIRST = 0.00001 SUI`);
  console.log(`   (100,000 FIRST per SUI)`);
  
  const sqrtPriceX64 = priceToSqrtPriceX64(targetPrice);
  const tickSpacing = 2;
  console.log(`   Sqrt Price X64: ${sqrtPriceX64}`);
  console.log(`   Tick Spacing: ${tickSpacing}`);
  console.log(`   Initial Liquidity: 0.09 SUI + 10,000 FIRST\n`);
  
  // Build transaction
  const txb = new TransactionBlock();
  txb.setGasBudget(50000000); // 0.05 SUI
  
  console.log('📝 Building transaction...');
  
  try {
    // Split from gas coin for SUI liquidity  
    // Using slightly less to leave room for gas: 0.09 SUI
    const [suiForPool] = txb.splitCoins(txb.gas, [txb.pure(90000000, 'u64')]); // 0.09 SUI
    
    // Split FIRST tokens - use all 10k
    const [firstForPool] = txb.splitCoins(
      txb.object(firstCoins.data[0].coinObjectId), 
      [txb.pure(10000000000000, 'u64')]
    ); // 10k FIRST
    
    // Calculate proper tick range (as u32 two's complement)
    // For price 0.00001, current tick is around -57568
    // Use full range ticks
    // tick_lower = -78784 -> u32: 4294888512
    // tick_upper = 21216 -> u32: 21216
    const tickLowerU32 = 4294888512;
    const tickUpperU32 = 21216;
    
    // Call create_pool_v2
    // Parameters: GlobalConfig, Pools, tick_spacing, sqrt_price, url, tick_lower, tick_upper,
    //             coinA_mut_ref, coinB_mut_ref, metadataA_ref, metadataB_ref, is_open, Clock
    txb.moveCall({
      target: `${POOL_CREATOR_PACKAGE}::pool_creator_v2::create_pool_v2`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        txb.object(CETUS_CONFIG),           // GlobalConfig
        txb.object(CETUS_POOLS),            // Pools
        txb.pure(tickSpacing, 'u32'),       // tick_spacing
        txb.pure(sqrtPriceX64, 'u128'),     // initialize_sqrt_price
        txb.pure('https://cetus.zone', 'string'), // url
        txb.pure(tickLowerU32, 'u32'),      // tick_lower
        txb.pure(tickUpperU32, 'u32'),      // tick_upper
        isSuiCoinB ? firstForPool : suiForPool,  // coin A
        isSuiCoinB ? suiForPool : firstForPool,  // coin B
        txb.object(isSuiCoinB ? FIRST_METADATA : SUI_METADATA),  // metadata A
        txb.object(isSuiCoinB ? SUI_METADATA : FIRST_METADATA),  // metadata B
        txb.pure(false, 'bool'),            // is_open
        txb.object(CLOCK_OBJECT),           // Clock
      ],
    });
    
    console.log('🔏 Signing and executing transaction...\n');
    
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
    console.log('🔗 View on Explorers:');
    console.log(`   Suiscan: https://suiscan.xyz/mainnet/tx/${response.digest}`);
    console.log(`   SuiVision: https://suivision.xyz/txblock/${response.digest}`);
    console.log(`   Sui Explorer: https://suiexplorer.com/txblock/${response.digest}?network=mainnet\n`);
    
    if (response.effects?.status.status === 'success') {
      console.log('🎉🎉🎉 POOL CREATED SUCCESSFULLY! 🎉🎉🎉\n');
      
      if (response.events) {
        for (const event of response.events) {
          if (event.type.includes('CreatePoolEvent')) {
            console.log('📡 Pool Creation Event:');
            console.log(JSON.stringify(event.parsedJson, null, 2));
            
            if (event.parsedJson && typeof event.parsedJson === 'object' && 'pool_id' in event.parsedJson) {
              const poolId = event.parsedJson.pool_id;
              console.log(`\n🏊 POOL ID: ${poolId}\n`);
              console.log('🔗 Trade on Cetus:');
              console.log(`   https://app.cetus.zone/swap?from=FIRST&to=SUI`);
              console.log('\n🔗 Add Liquidity:');
              console.log(`   https://app.cetus.zone/liquidity/`);
            }
          }
        }
      }
      
      console.log('\n✨ Congratulations! Your FIRST/SUI pool is now LIVE on Cetus!');
      
    } else {
      console.error('\n❌ Transaction failed!');
      console.error('Status:', response.effects?.status);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    if (error.cause) {
      console.error('\nDetails:', JSON.stringify(error.cause, null, 2));
    }
  }
}

createPool().catch(console.error);
