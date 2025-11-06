import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
const POOL_CREATOR = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';

async function readMore() {
  const pkg = await client.getObject({
    id: POOL_CREATOR,
    options: { showContent: true },
  });
  
  if (pkg.data && pkg.data.content && 'disassembled' in pkg.data.content) {
    const disassembled = (pkg.data.content as any).disassembled;
    if (disassembled && disassembled.pool_creator_v2) {
      const code = disassembled.pool_creator_v2;
      
      // Find build_init_position_arg function
      const startIdx = code.indexOf('build_init_position_arg');
      if (startIdx !== -1) {
        console.log('build_init_position_arg function:');
        console.log(code.substring(startIdx, startIdx + 3000));
      }
    }
  }
}

readMore();
