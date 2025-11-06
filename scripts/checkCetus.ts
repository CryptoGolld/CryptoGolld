import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

// These are the known Cetus mainnet addresses from their documentation
const CETUS_MAINNET = {
  // Cetus CLMM package
  clmmPackage: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
  // Global config
  globalConfig: '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f',
  // Pools registry
  pools: '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0',
  // Integrated package for swap, add liquidity etc
  integratedPackage: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
};

async function verifyCetusContracts() {
  const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
  
  console.log('Checking Cetus contracts on mainnet...\n');
  
  for (const [name, address] of Object.entries(CETUS_MAINNET)) {
    try {
      const object = await client.getObject({
        id: address,
        options: { showType: true, showOwner: true },
      });
      console.log(`✅ ${name}: ${address}`);
      console.log(`   Type: ${object.data?.type || 'N/A'}`);
    } catch (error) {
      console.log(`❌ ${name}: ${address} - NOT FOUND`);
    }
  }
}

verifyCetusContracts();
