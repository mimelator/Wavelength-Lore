/**
 * Rate Limiting Test Suite
 * Tests the implemented rate limiting functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

class RateLimitTester {
  constructor() {
    this.results = [];
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testEndpoint(name, url, method = 'GET', data = null, expectedLimit = 5) {
    console.log(`\n🧪 Testing ${name}`);
    console.log(`📍 Endpoint: ${method} ${url}`);
    console.log(`⚠️ Expected limit: ${expectedLimit} requests`);

    let successCount = 0;
    let rateLimitHit = false;
    let rateLimitStatus = null;

    try {
      // Make requests until we hit the rate limit
      for (let i = 1; i <= expectedLimit + 2; i++) {
        try {
          const config = {
            method: method.toLowerCase(),
            url: `${BASE_URL}${url}`,
            timeout: 5000
          };

          if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
            config.data = data;
          }

          const response = await axios(config);
          
          if (response.status === 200 || response.status === 201) {
            successCount++;
            console.log(`✅ Request ${i}: Success (${response.status})`);
          }
        } catch (error) {
          if (error.response && error.response.status === 429) {
            rateLimitHit = true;
            rateLimitStatus = error.response.status;
            console.log(`🚫 Request ${i}: Rate limit hit (429)`);
            
            if (error.response.data) {
              console.log(`   Message: ${error.response.data.message || error.response.data.error}`);
            }
            break;
          } else {
            console.log(`❌ Request ${i}: Error (${error.response?.status || error.message})`);
          }
        }

        // Small delay between requests
        await this.sleep(100);
      }

      const result = {
        test: name,
        successCount,
        rateLimitHit,
        rateLimitStatus,
        expectedLimit,
        status: rateLimitHit ? 'PASS' : 'FAIL'
      };

      this.results.push(result);

      if (rateLimitHit) {
        console.log(`✅ PASS: Rate limit properly enforced after ${successCount} requests`);
      } else {
        console.log(`❌ FAIL: Rate limit not enforced (made ${successCount} successful requests)`);
      }

      return result;

    } catch (error) {
      console.log(`💥 Test error: ${error.message}`);
      this.results.push({
        test: name,
        status: 'ERROR',
        error: error.message
      });
      return null;
    }
  }

  async runAllTests() {
    console.log('🛡️ Rate Limiting Test Suite');
    console.log('============================\n');

    // Test 1: General page rate limiting
    await this.testEndpoint(
      'General Page Access',
      '/',
      'GET',
      null,
      100 // General limit is 100 per 15 minutes
    );

    await this.sleep(1000);

    // Test 2: API endpoint rate limiting
    await this.testEndpoint(
      'API Cache Status',
      '/api/cache/status',
      'GET',
      null,
      50 // API limit is 50 per 10 minutes
    );

    await this.sleep(1000);

    // Test 3: Admin endpoint rate limiting (very strict)
    await this.testEndpoint(
      'Admin Cache Bust',
      '/api/cache/bust',
      'POST',
      { type: 'characters' },
      5 // Admin limit is 5 per hour
    );

    await this.sleep(1000);

    // Test 4: Static content rate limiting
    await this.testEndpoint(
      'Static CSS File',
      '/css/styles.css',
      'GET',
      null,
      200 // Static limit is 200 per 5 minutes
    );

    // Summary
    console.log('\n📊 Rate Limiting Test Results');
    console.log('==============================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`📈 Success Rate: ${Math.round((passed / this.results.length) * 100)}%`);

    if (failed > 0 || errors > 0) {
      console.log('\n❌ Failed/Error Tests:');
      this.results
        .filter(r => r.status === 'FAIL' || r.status === 'ERROR')
        .forEach(r => {
          console.log(`   - ${r.test}: ${r.error || 'Rate limit not enforced'}`);
        });
    }

    console.log('\n🔍 Detailed Results:');
    this.results.forEach(r => {
      if (r.status === 'PASS') {
        console.log(`   ✅ ${r.test}: ${r.successCount}/${r.expectedLimit} requests allowed`);
      }
    });

    return failed === 0 && errors === 0;
  }
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Main test execution
async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ Server is not running at http://localhost:3001');
    console.log('   Please start the server with: npm start');
    process.exit(1);
  }

  console.log('✅ Server is running, starting rate limit tests...\n');

  const tester = new RateLimitTester();
  const allTestsPassed = await tester.runAllTests();
  
  if (allTestsPassed) {
    console.log('\n🎉 All rate limiting tests passed! Your endpoints are protected.');
    process.exit(0);
  } else {
    console.log('\n💥 Some rate limiting tests failed. Please review the configuration.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Test suite error:', error.message);
  process.exit(1);
});