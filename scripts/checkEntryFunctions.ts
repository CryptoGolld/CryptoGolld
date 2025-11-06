import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const CETUS_CLMM_PACKAGE = '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb';

async function checkEntryFunctions() {
  try {
    const normalized = await client.getNormalizedMoveModulesByPackage({
      package: CETUS_CLMM_PACKAGE,
    });
    
    console.log('=== Entry Functions (can be called directly) ===\n');
    
    for (const [moduleName, module] of Object.entries(normalized)) {
      if (module.exposedFunctions) {
        const entryFunctions = Object.entries(module.exposedFunctions).filter(
          ([name, fn]) => (fn as any).isEntry
        );
        
        if (entryFunctions.length > 0) {
          console.log(`Module: ${moduleName}`);
          entryFunctions.forEach(([fnName, fn]) => {
            console.log(`  ✓ ${fnName}`);
            console.log(`    Parameters: ${(fn as any).parameters.length}`);
            console.log(`    Type Params: ${(fn as any).typeParameters.length}`);
          });
          console.log('');
        }
      }
    }
    
    // Also check router module if it exists
    console.log('\n=== Looking for router/interface modules ===');
    const routerModules = Object.keys(normalized).filter(name => 
      name.includes('router') || name.includes('interface') || name.includes('entry')
    );
    console.log('Found modules:', routerModules);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEntryFunctions();
