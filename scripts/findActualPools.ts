import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Search for pools by querying recent transactions or objects
async function findActualPools() {
  try {
    console.log('Searching for actual Cetus pools on mainnet...\n');
    
    // Search for Pool objects
    const pools = await client.queryEvents({
      query: {
        MoveEventType: `0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::factory::CreatePoolEvent`
      },
      limit: 5,
      order: 'descending',
    });
    
    console.log(`Found ${pools.data.length} pool creation events:\n`);
    
    for (const event of pools.data) {
      console.log('Event:', event.id.txDigest);
      console.log('Data:', JSON.stringify(event.parsedJson, null, 2), '\n');
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
    
    // Try alternative: search for SUI pools specifically
    console.log('\nTrying alternative: searching for objects with Pool type...');
    
    try {
      // Search using multiGetObjects with known pool addresses from Cetus
      const knownPools = [
        // SUI/USDC pool (commonly exists)
        '0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630',
        '0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f21ef002cebf857bded',
      ];
      
      const pools = await client.multiGetObjects({
        ids: knownPools,
        options: {
          showType: true,
          showContent: true,
        },
      });
      
      console.log('\nKnown pool structures:');
      pools.forEach((pool, i) => {
        console.log(`\nPool ${i + 1}:`);
        console.log('Type:', pool.data?.type);
        console.log('ID:', pool.data?.objectId);
      });
      
    } catch (e2: any) {
      console.error('Also failed:', e2.message);
    }
  }
}

findActualPools();
