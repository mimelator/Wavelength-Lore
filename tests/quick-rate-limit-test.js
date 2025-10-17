/**
 * Quick Rate Limiting Test
 * Test admin endpoint rate limiting specifically
 */

const axios = require('axios');

async function testAdminRateLimit() {
  console.log('🧪 Testing Admin Rate Limiting');
  console.log('===============================\n');

  const url = 'http://localhost:3001/api/cache/bust';
  
  console.log('📍 Testing POST /api/cache/bust (Admin endpoint)');
  console.log('⚠️  Expected limit: 5 requests per hour\n');

  for (let i = 1; i <= 7; i++) {
    try {
      const response = await axios.post(url, { type: 'characters' });
      console.log(`✅ Request ${i}: Success (${response.status})`);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`🚫 Request ${i}: Rate limit hit! (429)`);
        console.log(`   Message: ${error.response.data.message}`);
        console.log(`   ✅ Rate limiting is working correctly!`);
        return;
      } else {
        console.log(`❌ Request ${i}: Error (${error.response?.status || error.message})`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('❌ Rate limit was not hit - this may indicate an issue');
}

async function testGeneralRateLimit() {
  console.log('\n🧪 Testing General Rate Limiting');
  console.log('=================================\n');

  const url = 'http://localhost:3001/api/cache/status';
  
  console.log('📍 Testing GET /api/cache/status (API endpoint)');
  console.log('⚠️  Expected limit: 50 requests per 10 minutes\n');

  for (let i = 1; i <= 52; i++) {
    try {
      const response = await axios.get(url);
      console.log(`✅ Request ${i}: Success (${response.status})`);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`🚫 Request ${i}: Rate limit hit! (429)`);
        console.log(`   Message: ${error.response.data.message}`);
        console.log(`   ✅ API rate limiting is working correctly!`);
        return;
      } else {
        console.log(`❌ Request ${i}: Error (${error.response?.status || error.message})`);
      }
    }
    
    // Small delay between requests
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('❌ Rate limit was not hit - this may indicate an issue');
}

async function main() {
  try {
    // Test server availability
    await axios.get('http://localhost:3001/', { timeout: 3000 });
    console.log('✅ Server is running\n');

    // Test admin rate limiting
    await testAdminRateLimit();

    // Test API rate limiting
    await testGeneralRateLimit();

    console.log('\n🎉 Rate limiting tests completed!');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running at http://localhost:3001');
      console.log('   Please start the server with: npm start');
    } else {
      console.error('💥 Test error:', error.message);
    }
  }
}

main();