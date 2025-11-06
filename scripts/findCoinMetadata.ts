import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

const FIRST_TYPE = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';
const SUI_TYPE = '0x2::sui::SUI';

async function findMetadata() {
  try {
    console.log('Looking for CoinMetadata objects...\n');
    
    // For FIRST token - query by type
    console.log('Searching for FIRST metadata...');
    const firstMetadata = await client.getObject({
      id: '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035',
      options: {
        showContent: true,
      },
    });
    
    console.log('FIRST Package:', JSON.stringify(firstMetadata, null, 2).substring(0, 500));
    
    // Try to find metadata in package objects
    console.log('\nSearching for FIRST CoinMetadata by querying objects...');
    const objects = await client.getOwnedObjects({
      owner: '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035',
      options: {
        showType: true,
        showContent: true,
      },
    });
    
    console.log(`Found ${objects.data.length} objects`);
    objects.data.forEach((obj: any) => {
      console.log('  -', obj.data?.type);
    });
    
    // For SUI, metadata is at a well-known address
    console.log('\n\nSUI CoinMetadata should be at: 0x9');
    const suiMetadata = await client.getObject({
      id: '0x9',
      options: {
        showType: true,
        showContent: true,
      },
    });
    
    console.log('SUI Metadata Type:', suiMetadata.data?.type);
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

findMetadata();
