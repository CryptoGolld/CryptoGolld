import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";

// Derive keypair from mnemonic
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();
const privateKey = Buffer.from(keypair.export().privateKey).toString('hex');

console.log('Address:', address);
console.log('Private Key:', privateKey);

// Check balance on different networks
async function checkBalances() {
  const networks = ['mainnet', 'testnet', 'devnet'] as const;
  
  for (const network of networks) {
    try {
      const client = new SuiClient({ url: getFullnodeUrl(network) });
      
      // Get SUI balance
      const suiBalance = await client.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      
      // Get token balance
      const tokenBalance = await client.getBalance({
        owner: address,
        coinType: '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST',
      });
      
      if (BigInt(suiBalance.totalBalance) > 0 || BigInt(tokenBalance.totalBalance) > 0) {
        console.log(`\n=== ${network.toUpperCase()} ===`);
        console.log(`SUI Balance: ${Number(suiBalance.totalBalance) / 1e9} SUI`);
        console.log(`FIRST Token: ${Number(tokenBalance.totalBalance) / 1e9} FIRST`);
      }
    } catch (error) {
      // Network might not be accessible, skip
    }
  }
}

checkBalances();
