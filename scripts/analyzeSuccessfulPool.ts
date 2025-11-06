import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Most recent successful pool creation
const SUCCESS_TX = '5gxjqCDDsYBfe2gt4RS3Nj2R6XvNiy4mACZwYKRhi8yL';

async function analyzeTransaction() {
  try {
    console.log('Analyzing successful pool creation transaction...\n');
    
    const tx = await client.getTransactionBlock({
      digest: SUCCESS_TX,
      options: {
        showInput: true,
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });
    
    console.log('Transaction Block:');
    console.log(JSON.stringify(tx.transaction, null, 2));
    
    console.log('\n\nObject Changes:');
    tx.objectChanges?.forEach(change => {
      if (change.type === 'created' && change.objectType?.includes('Pool')) {
        console.log('Created Pool:', change.objectId);
        console.log('Type:', change.objectType);
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

analyzeTransaction();
