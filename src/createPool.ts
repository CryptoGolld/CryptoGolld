import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromHEX } from '@mysten/sui.js/utils';
import { CetusClmmSDK, SdkOptions, ClmmPoolUtil } from '@cetusprotocol/cetus-sui-clmm-sdk';
import Decimal from 'decimal.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface PoolConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  tokenAddress: string;
  tokenDecimals: number;
  initialPrice: number;
  feeRate: number;
  tickSpacing: number;
}

class CetusPoolCreator {
  private sdk: CetusClmmSDK;
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private config: PoolConfig;

  constructor(privateKey: string, config: PoolConfig) {
    // Initialize Sui client
    const network = config.network;
    this.client = new SuiClient({ url: getFullnodeUrl(network) });

    // Initialize keypair from private key
    const privateKeyBytes = fromHEX(privateKey.replace('0x', ''));
    this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

    this.config = config;

    // Initialize Cetus SDK
    const sdkOptions: SdkOptions = {
      fullRpcUrl: getFullnodeUrl(network),
      simulationAccount: {
        address: this.keypair.getPublicKey().toSuiAddress(),
      },
      cetus_config: {
        package_id: process.env.CETUS_POOL_PACKAGE || '',
        published_at: process.env.CETUS_POOL_PACKAGE || '',
        config: {
          pools_id: process.env.CETUS_GLOBAL_CONFIG || '',
          global_config_id: process.env.CETUS_GLOBAL_CONFIG || '',
          global_vault_id: process.env.CETUS_FACTORY || '',
        },
      },
    };

    this.sdk = new CetusClmmSDK(sdkOptions);
  }

  /**
   * Get the wallet address
   */
  getAddress(): string {
    return this.keypair.getPublicKey().toSuiAddress();
  }

  /**
   * Get SUI balance
   */
  async getSuiBalance(): Promise<bigint> {
    const address = this.getAddress();
    const balance = await this.client.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI',
    });
    return BigInt(balance.totalBalance);
  }

  /**
   * Create a new Cetus pool with SUI as quote token
   */
  async createPool(): Promise<string> {
    try {
      console.log('🚀 Starting Cetus Pool Creation...');
      console.log(`📍 Network: ${this.config.network}`);
      console.log(`💼 Wallet Address: ${this.getAddress()}`);

      // Check SUI balance
      const suiBalance = await this.getSuiBalance();
      console.log(`💰 SUI Balance: ${suiBalance} MIST (${Number(suiBalance) / 1e9} SUI)`);

      if (suiBalance < BigInt(1e9)) {
        throw new Error('Insufficient SUI balance. Need at least 1 SUI for gas fees.');
      }

      // SUI is always the quote token (token B)
      const suiType = '0x2::sui::SUI';
      const tokenType = this.config.tokenAddress;

      // Determine correct order (Cetus requires lexicographic ordering)
      const [coinTypeA, coinTypeB] = this.sortTokenTypes(tokenType, suiType);
      const isSuiCoinA = coinTypeA === suiType;

      console.log(`\n📊 Pool Configuration:`);
      console.log(`   Token A: ${coinTypeA}`);
      console.log(`   Token B: ${coinTypeB}`);
      console.log(`   Initial Price: ${this.config.initialPrice}`);
      console.log(`   Fee Rate: ${this.config.feeRate / 10000}%`);
      console.log(`   Tick Spacing: ${this.config.tickSpacing}`);

      // Calculate initial sqrt price
      // If SUI is coin A, we need to invert the price
      const adjustedPrice = isSuiCoinA ? 1 / this.config.initialPrice : this.config.initialPrice;
      const sqrtPrice = ClmmPoolUtil.priceToSqrtPriceX64(
        new Decimal(adjustedPrice),
        this.config.tokenDecimals,
        9 // SUI has 9 decimals
      );

      console.log(`\n🔢 Calculated sqrt price: ${sqrtPrice.toString()}`);

      // Build transaction to create pool
      const txb = new TransactionBlock();

      // Create pool initialization transaction
      // This is a simplified version - actual implementation depends on Cetus protocol version
      const createPoolPayload = {
        pool_type: `${coinTypeA}, ${coinTypeB}`,
        tick_spacing: this.config.tickSpacing,
        initialize_sqrt_price: sqrtPrice.toString(),
        fee_rate: this.config.feeRate,
      };

      console.log('\n⚙️  Building transaction...');

      // Call Cetus factory to create pool
      // Note: The actual Move function call depends on the Cetus protocol version
      // This is a generic structure that needs to be adapted to your specific Cetus deployment
      txb.moveCall({
        target: `${process.env.CETUS_POOL_PACKAGE}::factory::create_pool`,
        typeArguments: [coinTypeA, coinTypeB],
        arguments: [
          txb.object(process.env.CETUS_GLOBAL_CONFIG || ''),
          txb.pure(this.config.tickSpacing),
          txb.pure(sqrtPrice.toString()),
          txb.pure(''),
          txb.pure(this.config.feeRate),
        ],
      });

      console.log('📝 Signing transaction...');

      // Sign and execute transaction
      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        signer: this.keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });

      console.log('\n✅ Transaction submitted!');
      console.log(`📋 Transaction Digest: ${result.digest}`);

      // Check if transaction was successful
      if (result.effects?.status.status === 'success') {
        console.log('\n🎉 Pool created successfully!');

        // Extract pool ID from created objects
        const createdObjects = result.objectChanges?.filter(
          (change) => change.type === 'created'
        );

        if (createdObjects && createdObjects.length > 0) {
          console.log('\n📦 Created Objects:');
          createdObjects.forEach((obj: any) => {
            if (obj.objectType?.includes('Pool')) {
              console.log(`   🏊 Pool ID: ${obj.objectId}`);
            }
          });
        }

        return result.digest;
      } else {
        throw new Error(`Transaction failed: ${result.effects?.status.error}`);
      }
    } catch (error) {
      console.error('\n❌ Error creating pool:', error);
      throw error;
    }
  }

  /**
   * Sort token types in lexicographic order (required by Cetus)
   */
  private sortTokenTypes(tokenA: string, tokenB: string): [string, string] {
    return tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];
  }

  /**
   * Get pool information by pool ID
   */
  async getPoolInfo(poolId: string): Promise<any> {
    try {
      const pool = await this.sdk.Pool.getPool(poolId);
      return pool;
    } catch (error) {
      console.error('Error fetching pool info:', error);
      throw error;
    }
  }

  /**
   * Calculate tick from price
   */
  calculateTickFromPrice(price: number, decimalsA: number, decimalsB: number): number {
    const tick = ClmmPoolUtil.priceToTickIndex(
      new Decimal(price),
      decimalsA,
      decimalsB
    );
    return tick;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Validate environment variables
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in environment variables');
    }

    // Build pool configuration from environment
    const poolConfig: PoolConfig = {
      network: (process.env.NETWORK as any) || 'testnet',
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      tokenDecimals: parseInt(process.env.TOKEN_DECIMALS || '9'),
      initialPrice: parseFloat(process.env.INITIAL_PRICE || '1.0'),
      feeRate: parseInt(process.env.FEE_RATE || '3000'),
      tickSpacing: parseInt(process.env.TICK_SPACING || '60'),
    };

    // Validate configuration
    if (!poolConfig.tokenAddress) {
      throw new Error('TOKEN_ADDRESS not specified in environment');
    }

    // Create pool creator instance
    const creator = new CetusPoolCreator(privateKey, poolConfig);

    // Create the pool
    const txDigest = await creator.createPool();

    console.log('\n✨ Pool creation complete!');
    console.log(`🔗 View transaction: https://suiexplorer.com/txblock/${txDigest}?network=${poolConfig.network}`);
  } catch (error) {
    console.error('\n💥 Failed to create pool:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CetusPoolCreator, PoolConfig };
