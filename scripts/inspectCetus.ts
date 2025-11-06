import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

const CETUS_CLMM_PACKAGE = '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb';

async function inspectCetusPackage() {
  try {
    console.log('Inspecting Cetus CLMM Package...\n');
    
    const normalized = await client.getNormalizedMoveModulesByPackage({
      package: CETUS_CLMM_PACKAGE,
    });
    
    console.log('Available modules:');
    Object.keys(normalized).forEach(moduleName => {
      console.log(`  - ${moduleName}`);
      
      const module = normalized[moduleName];
      if (module.exposedFunctions) {
        const createFunctions = Object.keys(module.exposedFunctions).filter(fn => 
          fn.includes('create') || fn.includes('init') || fn.includes('open')
        );
        if (createFunctions.length > 0) {
          console.log(`    Functions: ${createFunctions.join(', ')}`);
        }
      }
    });
    
    // Look specifically at pool-related modules
    const poolModules = Object.keys(normalized).filter(name => 
      name.includes('pool') || name.includes('factory')
    );
    
    console.log('\n=== Pool/Factory Modules ===');
    for (const moduleName of poolModules) {
      console.log(`\nModule: ${moduleName}`);
      const module = normalized[moduleName];
      if (module.exposedFunctions) {
        console.log('Functions:');
        Object.entries(module.exposedFunctions).forEach(([fnName, fn]) => {
          if ((fn as any).isEntry) {
            console.log(`  ✓ ${fnName} (entry function)`);
            console.log(`    Parameters: ${(fn as any).parameters.length}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectCetusPackage();
