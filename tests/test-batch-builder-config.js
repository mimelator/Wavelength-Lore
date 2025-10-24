require('dotenv').config();

console.log('🧪 TEST: Batch Builder Configuration');
console.log('====================================\n');

console.log('Environment Variables:');
console.log(`PRINTIFY_API_TOKEN: ${process.env.PRINTIFY_API_TOKEN ? 'SET' : 'NOT SET'}`);
console.log(`PRINTIFY_SHOP_ID: ${process.env.PRINTIFY_SHOP_ID ? 'SET' : 'NOT SET'}`);
console.log(`PRINTIFY_API_URL: ${process.env.PRINTIFY_API_URL || 'NOT SET'}\n`);

if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID) {
    console.error('❌ TEST FAILED: Required environment variables not set');
    process.exit(1);
}

console.log('✅ TEST PASSED: Environment variables are set');
