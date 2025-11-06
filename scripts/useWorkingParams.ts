import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Use pool_creator_v2 (the working helper)
const POOL_CREATOR = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';
const CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';
const CLOCK = '0x6';

const SUI = '0x2::sui::SUI';
const FIRST = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';
const FIRST_META = '0xbbdb521bbd0d5ced873e6e38900e61050d493cb5b722dc54bc16803ecaea1aac';
const SUI_META = '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3';

async function create() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  EXACT PARAMS FROM YOUR WORKING TX!!! ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const firstCoins = await client.getCoins({ owner: address, coinType: FIRST });
  
  const txb = new TransactionBlock();
  txb.setGasBudget(50000000);
  
  // Use tick spacing 2 (current mainnet standard) + narrow range
  const tickSpacing = 2;
  const sqrtPrice = '79228162514264337593543950336';  // 1:1 price (2^96)
  
  // Narrow range: -1000 to 1000 (aligned to 2)
  const tickLower = 4294966296;         // -1000 as u32
  const tickUpper = 1000;
  
  console.log('Using NARROW RANGE (to reduce liquidity requirement):');
  console.log(`  Tick Spacing: ${tickSpacing}`);
  console.log(`  Sqrt Price: ${sqrtPrice}`);
  console.log(`  Tick Lower: ${tickLower} (-2000)`);
  console.log(`  Tick Upper: ${tickUpper}`);
  
  // Use ALL our tokens
  const firstAmount = 10000000000000;  // 10k FIRST (all of it)
  const suiAmount = 100000000;         // 0.1 SUI
  console.log(`  Using: ${firstAmount / 1e9} FIRST + ${suiAmount / 1e9} SUI\n`);
  
  // Split the exact amounts
  const [firstCoin] = txb.splitCoins(txb.object(firstCoins.data[0].coinObjectId), [txb.pure(firstAmount, 'u64')]);
  const [suiCoin] = txb.splitCoins(txb.gas, [txb.pure(suiAmount, 'u64')]);
  
  // Call pool_creator_v2 with these exact params
  txb.moveCall({
    target: `${POOL_CREATOR}::pool_creator_v2::create_pool_v2`,
    typeArguments: [FIRST, SUI],
    arguments: [
      txb.object(CONFIG),
      txb.object(POOLS),
      txb.pure(tickSpacing, 'u32'),
      txb.pure(sqrtPrice, 'u128'),
      txb.pure(''),
      txb.pure(tickLower, 'u32'),
      txb.pure(tickUpper, 'u32'),
      firstCoin,
      suiCoin,
      txb.object(FIRST_META),
      txb.object(SUI_META),
      txb.pure(false, 'bool'),
      txb.object(CLOCK),
    ],
  });
  
  console.log('Executing...\n');
  
  const res = await client.signAndExecuteTransactionBlock({
    transactionBlock: txb,
    signer: keypair,
    options: { showEffects: true, showEvents: true },
    requestType: 'WaitForLocalExecution',
  });
  
  console.log('Digest:', res.digest);
  console.log('https://suiscan.xyz/mainnet/tx/' + res.digest + '\n');
  
  if (res.effects?.status.status === 'success') {
    console.log('🎉🎉🎉 SUCCESS!!! 🎉🎉🎉\n');
    if (res.events) {
      res.events.forEach((e: any) => {
        if (e.type.includes('CreatePoolEvent') && e.parsedJson) {
          console.log('🏊 POOL ID:', e.parsedJson.pool_id);
        }
      });
    }
  } else {
    console.error('Failed:', res.effects?.status.error);
  }
}

create().catch(console.error);
