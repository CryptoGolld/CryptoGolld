import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

async function queryMetadata() {
  try {
    // Query for FIRST CoinMetadata using type filter
    console.log('Querying for FIRST CoinMetadata...\n');
    
    const firstMetadataType = `0x2::coin::CoinMetadata<0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST>`;
    
    // Try multiGetObjects with potential IDs, or query the coin registry
    // Actually, CoinMetadata objects are usually at predictable addresses
    // For a package, it's often the package ID itself or derived from it
    
    // Check if there's a TreasuryCap that might lead to metadata
    const treasuryType = `0x2::coin::TreasuryCap<0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST>`;
    
    console.log('Checking published objects from FIRST package creation...');
    
    // Get the publishing transaction
    const firstPackageTx = await client.queryTransactionBlocks({
      filter: {
        FromAddress: '0x488e0c6d14c2334da9d72a309e7b63b37fdf93f2faa910e203aa7f73260df25f',
      },
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
      limit: 50,
      order: 'descending',
    });
    
    console.log(`Checking ${firstPackageTx.data.length} transactions...`);
    
    for (const tx of firstPackageTx.data) {
      if (tx.objectChanges) {
        for (const change of tx.objectChanges) {
          if (change.type === 'published' && 
              change.packageId === '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035') {
            console.log('\nFound FIRST package publishing transaction:', tx.digest);
          }
          
          if (change.type === 'created' && change.objectType?.includes('CoinMetadata')) {
            console.log(`\nFound CoinMetadata:`);
            console.log(`  Type: ${change.objectType}`);
            console.log(`  ID: ${change.objectId}`);
            
            if (change.objectType?.includes('first::FIRST')) {
              console.log(`\n✅ FIRST Metadata ID: ${change.objectId}`);
            }
          }
        }
      }
    }
    
    // SUI metadata
    console.log('\n\nFor SUI, metadata is typically at well-known addresses.');
    console.log('Checking 0x9 and other potential addresses...');
    
    const suiMetadataAddresses = [
      '0x9',
      '0x0000000000000000000000000000000000000000000000000000000000000009',
    ];
    
    for (const addr of suiMetadataAddresses) {
      try {
        const obj = await client.getObject({
          id: addr,
          options: { showType: true },
        });
        
        if (obj.data?.type?.includes('CoinMetadata') && obj.data?.type?.includes('SUI')) {
          console.log(`\n✅ SUI Metadata ID: ${addr}`);
        }
      } catch (e) {
        // Skip
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

queryMetadata();
