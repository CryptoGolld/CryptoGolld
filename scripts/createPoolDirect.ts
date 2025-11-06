import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import Decimal from 'decimal.js';
import * as dotenv from 'dotenv';

dotenv.config();

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Cetus mainnet addresses
const CETUS_CLMM_PACKAGE = '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb';
const CETUS_CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const CETUS_POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';

const SUI_TYPE = '0x2::sui::SUI';
const FIRST_TYPE = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';

// Calculate sqrt price X64
function priceToSqrtPriceX64(price: number, decimalsA: number, decimalsB: number): string {
  // Adjust price for decimals
  const adjustedPrice = price * Math.pow(10, decimalsB - decimalsA);
  
  // Calculate sqrt price
  const sqrtPrice = Math.sqrt(adjustedPrice);
  
  // Multiply by 2^64
  const Q64 = new Decimal(2).pow(64);
  const sqrtPriceX64 = new Decimal(sqrtPrice).mul(Q64);
  
  return sqrtPriceX64.floor().toString();
}

// Sort tokens lexicographically (Cetus requirement)
function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
}

async function createCetusPool() {
  console.log('🏊 Creating Cetus Pool on Mainnet...\n');
  console.log('Wallet:', address);
  
  // Get balances
  const suiBalance = await client.getBalance({ owner: address, coinType: SUI_TYPE });
  const firstBalance = await client.getBalance({ owner: address, coinType: FIRST_TYPE });
  
  console.log(`SUI Balance: ${Number(suiBalance.totalBalance) / 1e9} SUI`);
  console.log(`FIRST Balance: ${Number(firstBalance.totalBalance) / 1e9} FIRST\n`);
  
  // Sort tokens
  const [coinTypeA, coinTypeB] = sortTokens(FIRST_TYPE, SUI_TYPE);
  const isSuiCoinB = coinTypeB === SUI_TYPE;
  
  console.log('Token Order:');
  console.log('  Coin A:', coinTypeA);
  console.log('  Coin B:', coinTypeB);
  
  // Calculate price
  // We want: 1 FIRST = 0.00001 SUI
  // If FIRST is CoinA and SUI is CoinB: price = 0.00001
  // If SUI is CoinA and FIRST is CoinB: price = 100000
  const targetPrice = isSuiCoinB ? 0.00001 : 100000;
  
  console.log(`\nPrice: 1 ${coinTypeA.split('::').pop()} = ${targetPrice} ${coinTypeB.split('::').pop()}`);
  
  // Calculate sqrt price X64
  const sqrtPriceX64 = priceToSqrtPriceX64(targetPrice, 9, 9);
  console.log(`Sqrt Price X64: ${sqrtPriceX64}\n`);
  
  // Build transaction
  const txb = new TransactionBlock();
  txb.setGasBudget(100000000); // 0.1 SUI gas budget
  
  try {
    // Call create_pool function
    // The exact function signature may vary, this is a common pattern
    const result = txb.moveCall({
      target: `${CETUS_CLMM_PACKAGE}::factory::create_pool`,
      typeArguments: [coinTypeA, coinTypeB],
      arguments: [
        txb.object(CETUS_CONFIG),
        txb.pure(60, 'u32'), // tick_spacing
        txb.pure(sqrtPriceX64, 'u128'), // initialize_sqrt_price
        txb.pure('', 'string'), // url/metadata
      ],
    });
    
    console.log('📝 Signing and submitting transaction...');
    
    // Execute transaction
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
    
    console.log('\n✅ Transaction submitted!');
    console.log('Digest:', response.digest);
    console.log(`Explorer: https://suiexplorer.com/txblock/${response.digest}?network=mainnet`);
    
    if (response.effects?.status.status === 'success') {
      console.log('\n🎉 Pool created successfully!');
      
      // Find created pool object
      if (response.objectChanges) {
        for (const change of response.objectChanges) {
          if (change.type === 'created' && change.objectType?.includes('Pool')) {
            console.log(`\n🏊 Pool ID: ${change.objectId}`);
          }
        }
      }
    } else {
      console.error('\n❌ Transaction failed:', response.effects?.status);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    
    // Try alternative approach - maybe the function signature is different
    console.log('\n🔄 Trying alternative pool creation method...');
    
    const txb2 = new TransactionBlock();
    txb2.setGasBudget(100000000);
    
    try {
      // Alternative: create_pool_v2 or create_pool_with_liquidity
      txb2.moveCall({
        target: `${CETUS_CLMM_PACKAGE}::pool::create_pool`,
        typeArguments: [coinTypeA, coinTypeB],
        arguments: [
          txb2.object(CETUS_POOLS),
          txb2.pure(60, 'u32'),
          txb2.pure(sqrtPriceX64, 'u128'),
        ],
      });
      
      const response2 = await client.signAndExecuteTransactionBlock({
        transactionBlock: txb2,
        signer: keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
        requestType: 'WaitForLocalExecution',
      });
      
      console.log('Digest:', response2.digest);
      console.log(`Explorer: https://suiexplorer.com/txblock/${response2.digest}?network=mainnet`);
      
    } catch (error2: any) {
      console.error('Alternative method also failed:', error2.message || error2);
    }
  }
}

createCetusPool().catch(console.error);
