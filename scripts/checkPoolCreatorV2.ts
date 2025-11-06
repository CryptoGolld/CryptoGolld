import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const POOL_CREATOR_PACKAGE = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';

async function checkSignature() {
  try {
    const normalized = await client.getNormalizedMoveModulesByPackage({
      package: POOL_CREATOR_PACKAGE,
    });
    
    const poolCreatorV2 = normalized['pool_creator_v2'];
    
    console.log('=== pool_creator_v2 Module ===\n');
    
    if (poolCreatorV2.exposedFunctions) {
      const createPoolV2 = poolCreatorV2.exposedFunctions['create_pool_v2'];
      
      console.log('create_pool_v2 function:');
      console.log(JSON.stringify(createPoolV2, null, 2));
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

checkSignature();
