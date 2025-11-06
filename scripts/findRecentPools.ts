import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const CETUS_POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';

async function findRecentPools() {
  try {
    console.log('Checking recent pools object...\n');
    
    const poolsObject = await client.getObject({
      id: CETUS_POOLS,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    console.log('Pools Object Type:', poolsObject.data?.type);
    
    // Get dynamic fields to see recent pools
    const dynamicFields = await client.getDynamicFields({
      parentId: CETUS_POOLS,
    });
    
    console.log(`\nFound ${dynamicFields.data.length} pools\n`);
    
    // Get a few recent pools
    if (dynamicFields.data.length > 0) {
      console.log('Recent pools (last 5):');
      const recentPools = dynamicFields.data.slice(-5);
      
      for (const field of recentPools) {
        console.log(`  - ${field.objectId}`);
        
        // Get the pool object
        const pool = await client.getObject({
          id: field.objectId,
          options: {
            showType: true,
            showContent: true,
          },
        });
        
        if (pool.data?.type) {
          // Extract package ID from the type
          const packageId = pool.data.type.split('::')[0];
          console.log(`    Package: ${packageId}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

findRecentPools();
