import { CetusClmmSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';

// Try to get mainnet config from SDK
const sdkOptions = {
  fullRpcUrl: 'https://fullnode.mainnet.sui.io:443',
  simulationAccount: {
    address: '0x0',
  },
};

try {
  const sdk = new CetusClmmSDK(sdkOptions);
  console.log('SDK Config:', JSON.stringify(sdk, null, 2));
} catch (error) {
  console.error('Error:', error);
}

// Known Cetus mainnet addresses from documentation
console.log('\n=== Known Cetus Mainnet Addresses ===');
console.log('Clmm Package:', '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb');
console.log('Clmm Global Config:', '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f');
console.log('Clmm Pools:', '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0');
console.log('Clmm Factory:', '0x1098fac992eab3a0ab7acf15bb654fc1cf29b5a6142c4ef1058e6c408dd15115');
