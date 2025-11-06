import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import Decimal from 'decimal.js';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Use the pool_creator_v2 helper package
const POOL_CREATOR_PACKAGE = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';
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

async function createPool() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Cetus Pool Creator - Mainnet        ║');
  console.log('║   FIRST/SUI Pool (Using V2 Creator)   ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  console.log('Wallet:', address, '\n');
  
  // Get balances
  const suiBalance = await client.getBalance({ owner: address, coinType: SUI_TYPE });
  const firstBalance = await client.getBalance({ owner: address, coinType: FIRST_TYPE });
  
  console.log(`💰 SUI Balance: ${Number(suiBalance.totalBalance) / 1e9} SUI`);
  console.log(`🪙 FIRST Balance: ${Number(firstBalance.totalBalance) / 1e9} FIRST\n`);
  
  // Get coin objects
  const suiCoins = await client.getCoins({ owner: address, coinType: SUI_TYPE });
  const firstCoins = await client.getCoins({ owner: address, coinType: FIRST_TYPE });
  
  if (suiCoins.data.length === 0 || firstCoins.data.length === 0) {
    console.error('❌ No coin objects found!');
    return;
  }
  
  const suiCoin = suiCoins.data[0].coinObjectId;
  const firstCoin = firstCoins.data[0].coinObjectId;
  
  console.log(`Using SUI coin: ${suiCoin}`);
  console.log(`Using FIRST coin: ${firstCoin}\n`);
  
  // Sort tokens
  const [coinTypeA, coinTypeB] = sortTokens(FIRST_TYPE, SUI_TYPE);
  const isSuiCoinB = coinTypeB === SUI_TYPE;
  
  console.log('📋 Pool Configuration:');
  console.log(`   Coin A: ${coinTypeA.split('::').pop()}`);
  console.log(`   Coin B: ${coinTypeB.split('::').pop()}`);
  
  // Target: 1 FIRST = 0.00001 SUI (100,000 FIRST per SUI)
  const targetPrice = isSuiCoinB ? 0.00001 : 100000;
  console.log(`   Initial Price: ${targetPrice}`);
  console.log(`   (1 FIRST = 0.00001 SUI)`);
  
  const sqrtPriceX64 = priceToSqrtPriceX64(targetPrice);
  console.log(`   Sqrt Price X64: ${sqrtPriceX64}`);
  
  // Use tick_spacing 2 like other recent pools
  const tickSpacing = 2;
  console.log(`   Tick Spacing: ${tickSpacing}\n`);
  
  // Build transaction
  const txb = new TransactionBlock();
  txb.setGasBudget(200000000); // 0.2 SUI gas budget
  
  console.log('📝 Building transaction with pool_creator_v2...');
  
  try {
    // Split coins for initial liquidity
    // 0.1 SUI = 100,000,000 MIST
    const [suiCoinSplit] = txb.splitCoins(txb.object(suiCoin), [txb.pure(100000000, 'u64')]);
    
    // 10,000 FIRST = 10,000,000,000,000 (with 9 decimals)
    const [firstCoinSplit] = txb.splitCoins(txb.object(firstCoin), [txb.pure(10000000000000, 'u64')]);
    
    // Call create_pool_v2
    // Based on the successful transaction, the parameters are:
    // coinA, coinB, GlobalConfig, Pools, tick_spacing, sqrt_price, url, tick_lower, tick_upper, is_open, Clock
    txb.moveCall({
      target: `${POOL_CREATOR_PACKAGE}::pool_creator_v2::create_pool_v2`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        isSuiCoinB ? firstCoinSplit : suiCoinSplit,  // coin A
        isSuiCoinB ? suiCoinSplit : firstCoinSplit,  // coin B
        txb.object(CETUS_CONFIG),
        txb.object(CETUS_POOLS),
        txb.pure(tickSpacing, 'u32'),
        txb.pure(sqrtPriceX64, 'u128'),
        txb.pure('https://cetus.zone', 'string'),
        txb.pure(4294523660, 'u32'),  // tick_lower (same as example)
        txb.pure(443636, 'u32'),      // tick_upper (same as example)
        txb.pure(false, 'bool'),       // is_open
        txb.object(CLOCK_OBJECT),
      ],
    });
    
    console.log('🔏 Signing and submitting transaction...\n');
    
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
    console.log('🔗 View on Explorer:');
    console.log(`   https://suiscan.xyz/mainnet/tx/${response.digest}`);
    console.log(`   https://suiexplorer.com/txblock/${response.digest}?network=mainnet\n`);
    
    if (response.effects?.status.status === 'success') {
      console.log('🎉 Pool created successfully!\n');
      
      if (response.events) {
        for (const event of response.events) {
          if (event.type.includes('CreatePoolEvent')) {
            console.log('📡 CreatePoolEvent:');
            console.log(JSON.stringify(event.parsedJson, null, 2));
            
            if (event.parsedJson && typeof event.parsedJson === 'object' && 'pool_id' in event.parsedJson) {
              console.log(`\n🏊 POOL ID: ${event.parsedJson.pool_id}\n`);
            }
          }
        }
      }
      
      console.log('✨ Success! Your FIRST/SUI pool is now live on Cetus!');
      console.log('🔗 View on Cetus: https://app.cetus.zone/liquidity/');
      
    } else {
      console.error('\n❌ Transaction failed!');
      console.error('Status:', response.effects?.status);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    if (error.cause) {
      console.error('Cause:', JSON.stringify(error.cause, null, 2));
    }
  }
}

createPool().catch(console.error);
