/**
 * Simple API Endpoint Test for Input Sanitization
 * This test bypasses the complex test framework and directly tests the API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSanitizationAPI() {
  console.log('🧪 Testing Input Sanitization API Endpoint');
  console.log('==========================================\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/sanitize/health`, { timeout: 3000 });
      console.log('✅ Health endpoint: OK');
      console.log('   Status:', healthResponse.data.status);
    } catch (error) {
      console.log('ℹ️  Health endpoint not accessible (expected)');
    }

    // Test 2: Basic server connectivity
    console.log('\n2. Testing server connectivity...');
    try {
      await axios.get(`${BASE_URL}/`, { 
        timeout: 3000,
        validateStatus: () => true
      });
      console.log('✅ Server is responding');
    } catch (error) {
      throw new Error('❌ Server not running at http://localhost:3001');
    }

    // Test 3: Sanitization endpoint
    console.log('\n3. Testing sanitization endpoint...');
    const testPayload = {
      content: '<script>alert("XSS")</script><p>Valid content</p><blockquote>A quote</blockquote>',
      type: 'html'
    };

    const response = await axios.post(`${BASE_URL}/api/sanitize/test`, testPayload, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.success) {
      throw new Error('❌ Sanitization API endpoint failed');
    }

    const { result } = response.data;
    
    console.log('✅ Sanitization endpoint: Working');
    console.log('   Original:', testPayload.content);
    console.log('   Sanitized:', result.sanitized);
    console.log('   XSS Removed:', result.checks.xssRemoved);
    console.log('   Profanity Check:', result.checks.profanity.isProfane ? 'Contains profanity' : 'Clean');
    console.log('   Spam Check:', result.checks.spam.isSpam ? 'Detected as spam' : 'Not spam');
    
    if (result.sanitized.includes('<script')) {
      throw new Error('❌ XSS payload not properly sanitized by API');
    }

    console.log('\n🎉 All API endpoint tests passed!');
    console.log('Input sanitization API is working correctly.');
    
    return true;

  } catch (error) {
    console.error('\n❌ API Test Failed:');
    console.error('   Error:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testSanitizationAPI().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testSanitizationAPI;