import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import * as dotenv from 'dotenv';

dotenv.config();

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

async function checkAndCreatePool() {
  console.log('🔍 Checking wallet status...');
  console.log('Address:', address);
  
  // Get SUI balance
  const suiBalance = await client.getBalance({
    owner: address,
    coinType: '0x2::sui::SUI',
  });
  
  // Get FIRST token balance  
  const firstBalance = await client.getBalance({
    owner: address,
    coinType: '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST',
  });
  
  console.log(`💰 SUI Balance: ${Number(suiBalance.totalBalance) / 1e9} SUI`);
  console.log(`🪙 FIRST Balance: ${Number(firstBalance.totalBalance) / 1e9} FIRST`);
  
  // Check if we have the coins needed
  const suiAvailable = Number(suiBalance.totalBalance);
  const firstAvailable = Number(firstBalance.totalBalance);
  
  if (suiAvailable < 1e8) { // Need at least 0.1 SUI
    console.error('❌ Insufficient SUI balance');
    return;
  }
  
  if (firstAvailable < 1e13) { // Need at least 10,000 FIRST
    console.error('❌ Insufficient FIRST token balance');
    return;
  }
  
  console.log('\n✅ Balances confirmed!');
  console.log('📊 Pool will use:');
  console.log('   - 0.1 SUI');
  console.log('   - 10,000 FIRST');
  console.log('   - Price: 1 FIRST = 0.00001 SUI (100,000 FIRST per SUI)');
  
  // Now let's try creating the pool using Cetus
  console.log('\n🏊 Attempting to create pool...');
  
  // The actual pool creation will use the main createPool.ts
  // For now, let's just verify everything is ready
  console.log('✅ Ready to create pool!');
}

checkAndCreatePool().catch(console.error);
