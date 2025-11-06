import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const CLMM_PACKAGE = '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb';

async function readFactory() {
  const normalized = await client.getNormalizedMoveModulesByPackage({
    package: CLMM_PACKAGE,
  });
  
  const factory = normalized['factory'];
  
  console.log('=== factory::create_pool_with_liquidity ===\n');
  
  const func = factory.exposedFunctions['create_pool_with_liquidity'];
  
  console.log('Parameters:');
  func.parameters.forEach((param, i) => {
    console.log(`  ${i}:`, JSON.stringify(param, null, 2));
  });
  
  console.log('\nReturn:');
  console.log(JSON.stringify(func.return, null, 2));
}

readFactory();
