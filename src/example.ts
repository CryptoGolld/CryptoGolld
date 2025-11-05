/**
 * Example: How to use the Cetus Pool Creator programmatically
 * 
 * This file demonstrates various ways to create and interact with Cetus pools
 */

import { CetusPoolCreator, PoolConfig } from './createPool';
import { 
  FEE_TIERS, 
  TICK_SPACINGS, 
  priceToTick, 
  formatTokenAmount,
  parseTokenAmount,
  sortTokens,
  getRecommendedTickSpacing
} from './utils';

// Example 1: Create a standard pool with 0.3% fee
async function createStandardPool() {
  const privateKey = process.env.PRIVATE_KEY!;
  
  const config: PoolConfig = {
    network: 'testnet',
    tokenAddress: '0x2::mycoin::MYCOIN', // Replace with your token
    tokenDecimals: 9,
    initialPrice: 1.0, // 1 MYCOIN = 1 SUI
    feeRate: FEE_TIERS.MEDIUM, // 0.3%
    tickSpacing: TICK_SPACINGS.STANDARD, // 60
  };

  const creator = new CetusPoolCreator(privateKey, config);
  const txDigest = await creator.createPool();
  
  console.log('Pool created:', txDigest);
}

// Example 2: Create a stablecoin-like pool with low fee
async function createStablecoinPool() {
  const privateKey = process.env.PRIVATE_KEY!;
  
  const config: PoolConfig = {
    network: 'testnet',
    tokenAddress: '0x2::usdc::USDC', // Example stablecoin
    tokenDecimals: 6, // USDC typically has 6 decimals
    initialPrice: 1.0, // 1 USDC should equal roughly 1 SUI in value
    feeRate: FEE_TIERS.LOW, // 0.05% for stable pairs
    tickSpacing: TICK_SPACINGS.FINE, // Fine granularity
  };

  const creator = new CetusPoolCreator(privateKey, config);
  const txDigest = await creator.createPool();
  
  console.log('Stablecoin pool created:', txDigest);
}

// Example 3: Create a high-volatility pool
async function createVolatilePool() {
  const privateKey = process.env.PRIVATE_KEY!;
  
  const config: PoolConfig = {
    network: 'testnet',
    tokenAddress: '0x2::meme::MEME', // Example meme token
    tokenDecimals: 9,
    initialPrice: 0.001, // 1 MEME = 0.001 SUI (1000 MEME per SUI)
    feeRate: FEE_TIERS.HIGH, // 1% for volatile pairs
    tickSpacing: TICK_SPACINGS.COARSE, // Coarse granularity
  };

  const creator = new CetusPoolCreator(privateKey, config);
  const txDigest = await creator.createPool();
  
  console.log('Volatile pool created:', txDigest);
}

// Example 4: Calculate optimal pool parameters
async function calculateOptimalParameters() {
  const targetPrice = 0.5; // 1 TOKEN = 0.5 SUI
  const expectedVolatility = 'medium'; // low, medium, high
  
  // Determine fee based on volatility
  let feeRate: number;
  let tickSpacing: number;
  
  switch (expectedVolatility) {
    case 'low':
      feeRate = FEE_TIERS.LOW;
      tickSpacing = TICK_SPACINGS.FINE;
      break;
    case 'high':
      feeRate = FEE_TIERS.HIGH;
      tickSpacing = TICK_SPACINGS.COARSE;
      break;
    default:
      feeRate = FEE_TIERS.MEDIUM;
      tickSpacing = TICK_SPACINGS.STANDARD;
  }
  
  // Or use recommended tick spacing for the fee tier
  tickSpacing = getRecommendedTickSpacing(feeRate);
  
  console.log('Optimal parameters:');
  console.log(`  Price: ${targetPrice} TOKEN per SUI`);
  console.log(`  Fee Rate: ${feeRate / 10000}%`);
  console.log(`  Tick Spacing: ${tickSpacing}`);
  
  // Calculate the tick for this price
  const tick = priceToTick(targetPrice, 9, 9);
  console.log(`  Initial Tick: ${tick}`);
}

// Example 5: Work with token amounts
function tokenAmountExamples() {
  // Format raw amounts to human-readable
  const rawAmount = BigInt('1000000000'); // 1 token with 9 decimals
  const formatted = formatTokenAmount(rawAmount, 9);
  console.log(`Formatted amount: ${formatted}`);
  
  // Parse human-readable to raw amounts
  const humanAmount = '1.5';
  const parsed = parseTokenAmount(humanAmount, 9);
  console.log(`Parsed amount: ${parsed}`);
}

// Example 6: Verify token ordering
function checkTokenOrdering() {
  const suiType = '0x2::sui::SUI';
  const customToken = '0x2::mycoin::MYCOIN';
  
  const [tokenA, tokenB] = sortTokens(customToken, suiType);
  
  console.log('Token ordering:');
  console.log(`  Token A: ${tokenA}`);
  console.log(`  Token B: ${tokenB}`);
  
  if (tokenA === suiType) {
    console.log('  SUI is Token A (need to invert price)');
  } else {
    console.log('  SUI is Token B (price is direct)');
  }
}

// Example 7: Get pool information after creation
async function getPoolDetails(poolId: string) {
  const privateKey = process.env.PRIVATE_KEY!;
  
  const config: PoolConfig = {
    network: 'testnet',
    tokenAddress: '0x2::sui::SUI', // Placeholder
    tokenDecimals: 9,
    initialPrice: 1.0,
    feeRate: 3000,
    tickSpacing: 60,
  };

  const creator = new CetusPoolCreator(privateKey, config);
  
  try {
    const poolInfo = await creator.getPoolInfo(poolId);
    
    console.log('Pool Information:');
    console.log(`  Pool ID: ${poolId}`);
    console.log(`  Current Sqrt Price: ${poolInfo.current_sqrt_price}`);
    console.log(`  Current Tick: ${poolInfo.current_tick_index}`);
    console.log(`  Fee Rate: ${poolInfo.fee_rate}`);
    console.log(`  Liquidity: ${poolInfo.liquidity}`);
  } catch (error) {
    console.error('Failed to fetch pool info:', error);
  }
}

// Example 8: Create multiple pools in sequence
async function createMultiplePools() {
  const privateKey = process.env.PRIVATE_KEY!;
  
  const tokens = [
    { address: '0x2::token1::TOKEN1', decimals: 9, price: 1.0 },
    { address: '0x2::token2::TOKEN2', decimals: 6, price: 0.5 },
    { address: '0x2::token3::TOKEN3', decimals: 9, price: 10.0 },
  ];
  
  for (const token of tokens) {
    const config: PoolConfig = {
      network: 'testnet',
      tokenAddress: token.address,
      tokenDecimals: token.decimals,
      initialPrice: token.price,
      feeRate: FEE_TIERS.MEDIUM,
      tickSpacing: TICK_SPACINGS.STANDARD,
    };
    
    try {
      const creator = new CetusPoolCreator(privateKey, config);
      const txDigest = await creator.createPool();
      console.log(`✅ Created pool for ${token.address}: ${txDigest}`);
      
      // Wait a bit between creations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Failed to create pool for ${token.address}:`, error);
    }
  }
}

// Example 9: Check wallet balance before creating pool
async function createPoolWithBalanceCheck() {
  const privateKey = process.env.PRIVATE_KEY!;
  
  const config: PoolConfig = {
    network: 'testnet',
    tokenAddress: '0x2::mycoin::MYCOIN',
    tokenDecimals: 9,
    initialPrice: 1.0,
    feeRate: FEE_TIERS.MEDIUM,
    tickSpacing: TICK_SPACINGS.STANDARD,
  };

  const creator = new CetusPoolCreator(privateKey, config);
  
  // Check balance first
  const balance = await creator.getSuiBalance();
  const balanceInSui = Number(balance) / 1e9;
  
  console.log(`Current SUI balance: ${balanceInSui} SUI`);
  
  if (balanceInSui < 1) {
    console.error('Insufficient balance! Need at least 1 SUI for gas.');
    return;
  }
  
  // Proceed with pool creation
  const txDigest = await creator.createPool();
  console.log('Pool created successfully:', txDigest);
}

// Run examples
async function main() {
  console.log('=== Cetus Pool Creator Examples ===\n');
  
  // Uncomment the example you want to run:
  
  // await createStandardPool();
  // await createStablecoinPool();
  // await createVolatilePool();
  // await calculateOptimalParameters();
  // tokenAmountExamples();
  // checkTokenOrdering();
  // await getPoolDetails('YOUR_POOL_ID_HERE');
  // await createMultiplePools();
  // await createPoolWithBalanceCheck();
  
  console.log('\n✨ Examples completed!');
}

// Only run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  createStandardPool,
  createStablecoinPool,
  createVolatilePool,
  calculateOptimalParameters,
  tokenAmountExamples,
  checkTokenOrdering,
  getPoolDetails,
  createMultiplePools,
  createPoolWithBalanceCheck,
};
