import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Check the GlobalConfig to find the current package
const CETUS_CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';

async function findCurrentCetusPackage() {
  try {
    console.log('Checking Cetus GlobalConfig for current package...\n');
    
    const configObject = await client.getObject({
      id: CETUS_CONFIG,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    console.log('GlobalConfig Object:');
    console.log(JSON.stringify(configObject, null, 2));
    
    // The config should contain the package_version field
    if (configObject.data && configObject.data.content && 'fields' in configObject.data.content) {
      const fields = configObject.data.content.fields as any;
      console.log('\n=== Config Fields ===');
      console.log('Package Version:', fields.package_version);
      console.log('Protocol Fee Rate:', fields.protocol_fee_rate);
      
      // Check the package that this config belongs to
      const configType = configObject.data.type;
      console.log('\nConfig Type:', configType);
      
      if (configType) {
        const packageId = configType.split('::')[0];
        console.log('Package ID from type:', packageId);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

findCurrentCetusPackage();
