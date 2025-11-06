import Decimal from 'decimal.js';

// Calculate tick from price
// tick = log(sqrt(price)) / log(1.0001)
function priceToTick(price: number): number {
  const sqrtPrice = Math.sqrt(price);
  const tick = Math.log(sqrtPrice) / Math.log(1.0001);
  return Math.floor(tick);
}

// Round tick to nearest valid tick given spacing
function roundTickToSpacing(tick: number, spacing: number): number {
  return Math.floor(tick / spacing) * spacing;
}

// Our price: 1 FIRST = 0.00001 SUI (price of FIRST in terms of SUI)
const targetPrice = 0.00001;
const tickSpacing = 2;

const currentTick = priceToTick(targetPrice);
console.log('Current tick (from price):', currentTick);
console.log('Rounded to spacing:', roundTickToSpacing(currentTick, tickSpacing));

// For initial liquidity, we want a wide range
// Let's use +/- 10000 ticks, aligned to spacing
const tickLower = roundTickToSpacing(currentTick - 10000, tickSpacing);
const tickUpper = roundTickToSpacing(currentTick + 10000, tickSpacing);

console.log('\nProposed tick range:');
console.log('  tick_lower:', tickLower);
console.log('  current_tick:', roundTickToSpacing(currentTick, tickSpacing));
console.log('  tick_upper:', tickUpper);
console.log('\nValid:', tickLower < currentTick && currentTick < tickUpper);
console.log('Aligned:', tickLower % tickSpacing === 0 && tickUpper % tickSpacing === 0);
