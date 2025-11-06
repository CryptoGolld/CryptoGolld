import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Check one of the existing pools to see its structure
const EXISTING_POOL = '0x63b732b0610147b61b991616d6c9ac8b02029954ff869896a896aa8a9097efc0';
const CETUS_CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';

async function checkPoolDetails() {
  try {
    console.log('Checking existing pool structure...\n');
    
    const pool = await client.getObject({
      id: EXISTING_POOL,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    console.log('Pool Type:', pool.data?.type);
    console.log('\nPool Content:');
    console.log(JSON.stringify(pool.data?.content, null, 2));
    
    // Check GlobalConfig package_version
    console.log('\n\nChecking GlobalConfig...');
    const config = await client.getObject({
      id: CETUS_CONFIG,
      options: {
        showContent: true,
      },
    });
    
    if (config.data && config.data.content && 'fields' in config.data.content) {
      const fields = config.data.content.fields as any;
      console.log('Package Version in Config:', fields.package_version);
      console.log('Protocol Fee Rate:', fields.protocol_fee_rate);
      
      // Check which package version corresponds to what
      console.log('\n💡 The package_version field indicates the EXPECTED package to use');
      console.log('   Version 12 might correspond to a specific package ID');
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

checkPoolDetails();
