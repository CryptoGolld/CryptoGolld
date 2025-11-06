import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const CETUS_CLMM_PACKAGE = '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb';

async function getFactoryFunctions() {
  try {
    const normalized = await client.getNormalizedMoveModulesByPackage({
      package: CETUS_CLMM_PACKAGE,
    });
    
    const factory = normalized['factory'];
    console.log('=== Factory Module Functions ===\n');
    
    if (factory.exposedFunctions) {
      const createPool = factory.exposedFunctions['create_pool'];
      const createPoolWithLiquidity = factory.exposedFunctions['create_pool_with_liquidity'];
      
      console.log('create_pool:');
      console.log(JSON.stringify(createPool, null, 2));
      
      console.log('\n\ncreate_pool_with_liquidity:');
      console.log(JSON.stringify(createPoolWithLiquidity, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getFactoryFunctions();
