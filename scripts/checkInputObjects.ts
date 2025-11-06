import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// From the successful transaction
const INPUT_10 = '0x6f88faa4ce2e70c57adc47937f67558c83fa5a43586af03997149c206a2e4afa';
const INPUT_11 = '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3';

async function checkInputs() {
  try {
    console.log('Checking input objects from successful transaction...\n');
    
    console.log('Input 10:');
    const obj10 = await client.getObject({
      id: INPUT_10,
      options: { showType: true, showContent: true },
    });
    console.log('  Type:', obj10.data?.type);
    
    console.log('\nInput 11:');
    const obj11 = await client.getObject({
      id: INPUT_11,
      options: { showType: true, showContent: true },
    });
    console.log('  Type:', obj11.data?.type);
    
    if (obj11.data?.type?.includes('CoinMetadata')) {
      console.log('\n✅ Input 11 is CoinMetadata!');
      console.log('   This is the metadata for the custom token');
    }
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

checkInputs();
