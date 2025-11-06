// Convert signed i32 to u32 (two's complement)
function i32ToU32(value: number): number {
  if (value >= 0) {
    return value;
  }
  // Two's complement for negative numbers
  return (1 << 32) + value;  // 2^32 + value
}

const tickLower = -67568;
const tickUpper = -47568;

console.log('Tick Lower:', tickLower, '-> u32:', i32ToU32(tickLower));
console.log('Tick Upper:', tickUpper, '-> u32:', i32ToU32(tickUpper));

// Verify conversion
console.log('\nVerify:', i32ToU32(-67568).toString(), '(should be u32 representation)');
