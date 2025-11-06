import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const POOL_CREATOR = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';

async function readContract() {
  try {
    console.log('Reading pool_creator_v2 contract...\n');
    
    const normalized = await client.getNormalizedMoveModulesByPackage({
      package: POOL_CREATOR,
    });
    
    const poolCreatorV2 = normalized['pool_creator_v2'];
    
    console.log('=== pool_creator_v2 Module ===\n');
    
    // Get the create_pool_v2 function
    const createPoolV2 = poolCreatorV2.exposedFunctions['create_pool_v2'];
    
    console.log('create_pool_v2 Function Details:\n');
    console.log('Visibility:', createPoolV2.visibility);
    console.log('Is Entry:', createPoolV2.isEntry);
    console.log('\nType Parameters:', createPoolV2.typeParameters.length);
    
    console.log('\nParameters:');
    createPoolV2.parameters.forEach((param, i) => {
      console.log(`  ${i}:`, JSON.stringify(param, null, 2));
    });
    
    console.log('\nReturn Values:');
    if (createPoolV2.return && createPoolV2.return.length > 0) {
      createPoolV2.return.forEach((ret, i) => {
        console.log(`  ${i}:`, JSON.stringify(ret, null, 2));
      });
    } else {
      console.log('  None (void)');
    }
    
    // Also check if there's source code
    console.log('\n\n=== Checking for source code ===');
    const pkg = await client.getObject({
      id: POOL_CREATOR,
      options: {
        showContent: true,
      },
    });
    
    if (pkg.data && pkg.data.content && 'disassembled' in pkg.data.content) {
      const disassembled = (pkg.data.content as any).disassembled;
      if (disassembled && disassembled.pool_creator_v2) {
        console.log('\npool_creator_v2 bytecode (first 2000 chars):');
        console.log(disassembled.pool_creator_v2.substring(0, 2000));
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

readContract();
