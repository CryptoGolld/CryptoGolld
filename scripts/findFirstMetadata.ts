import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

async function findFirstMetadata() {
  try {
    console.log('Searching for FIRST token CoinMetadata...\n');
    
    // Try to query events from the FIRST package deployment
    const packageId = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035';
    
    // Query for all objects with CoinMetadata type
    // Unfortunately we need to know the exact object ID
    // Let's try common patterns for metadata IDs
    
    const potentialIds = [
      // Sometimes it's based on the package ID with modifications
      '0x3e7e59a80efc4a38e9dfa95440f9d767e2eadad3dee5e3b75e5f5099af72cb23',  // Random guess based on FIRST package
    ];
    
    console.log('Trying to query coin supply to find metadata...');
    
    // Actually, let's try a different approach - get objects owned by the package or check supply
    try {
      const supply = await client.getCoinMetadata({
        coinType: '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST',
      });
      
      console.log('\n✅ Found FIRST CoinMetadata via getCoinMetadata:');
      console.log(JSON.stringify(supply, null, 2));
      
      if (supply && supply.id) {
        console.log(`\n🎯 FIRST Metadata ID: ${supply.id}`);
      }
      
    } catch (e: any) {
      console.error('getCoinMetadata failed:', e.message);
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

findFirstMetadata();
