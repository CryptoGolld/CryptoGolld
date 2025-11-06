import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const mnemonic = "royal stairs eye dizzy response educate fire edge smooth cruise skill say";
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
const address = keypair.getPublicKey().toSuiAddress();
const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

const POOL_CREATOR = '0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d';
const UTILS = '0x2d8c2e0fc6dd25b0214b3fa747e0fd27fd54608142cd2e4f64c1cd350cc4add4';
const CONFIG = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const POOLS = '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0';
const CLOCK = '0x6';

const SUI = '0x2::sui::SUI';
const FIRST = '0x0826010998190523e7fce54d54c4cd32d7d79192ffa43bebac39c102c2290035::first::FIRST';
const FIRST_META = '0xbbdb521bbd0d5ced873e6e38900e61050d493cb5b722dc54bc16803ecaea1aac';
const SUI_META = '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3';

// EXACT params from successful transaction:
// tick_spacing: 2
// sqrt_price: 23809880791181703
// tick_lower: 4294523660
// tick_upper: 443636

async function create() {
  console.log('🏊 Creating with EXACT successful parameters\n');
  
  const firstCoins = await client.getCoins({ owner: address, coinType: FIRST });
  
  const txb = new TransactionBlock();
  txb.setGasBudget(50000000);
  
  // Use our actual amounts
  const [coinFIRST] = txb.splitCoins(txb.object(firstCoins.data[0].coinObjectId), [txb.pure(10000000000000, 'u64')]); // 10k FIRST
  const [coinSUI] = txb.splitCoins(txb.gas, [txb.pure(90000000, 'u64')]); // 0.09 SUI
  
  txb.moveCall({
    target: `${POOL_CREATOR}::pool_creator_v2::create_pool_v2`,
    typeArguments: [FIRST, SUI],
    arguments: [
      txb.object(CONFIG),
      txb.object(POOLS),
      txb.pure(2, 'u32'),                    // tick_spacing from successful tx
      txb.pure(23809880791181703, 'u128'),   // sqrt_price from successful tx
      txb.pure('https://cetus.zone'),
      txb.pure(4294523660, 'u32'),           // tick_lower from successful tx
      txb.pure(443636, 'u32'),               // tick_upper from successful tx
      coinFIRST,
      coinSUI,
      txb.object(FIRST_META),
      txb.object(SUI_META),
      txb.pure(false, 'bool'),
      txb.object(CLOCK),
    ],
  });
  
  console.log('Executing with exact params from working tx...\n');
  
  const res = await client.signAndExecuteTransactionBlock({
    transactionBlock: txb,
    signer: keypair,
    options: { showEffects: true, showEvents: true },
    requestType: 'WaitForLocalExecution',
  });
  
  console.log('Digest:', res.digest);
  console.log('https://suiscan.xyz/mainnet/tx/' + res.digest + '\n');
  
  if (res.effects?.status.status === 'success') {
    console.log('🎉🎉🎉 SUCCESS! 🎉🎉🎉\n');
    if (res.events) {
      res.events.forEach(e => {
        if (e.type.includes('CreatePoolEvent') && e.parsedJson) {
          console.log('POOL ID:', (e.parsedJson as any).pool_id);
        }
      });
    }
  } else {
    console.error('Failed:', res.effects?.status.error);
  }
}

create().catch(console.error);
