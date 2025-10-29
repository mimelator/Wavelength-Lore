#!/usr/bin/env node

/**
 * CTA Auth Tester
 * Tests multiple authentication methods to find what works
 * Helps diagnose authentication issues with the API
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.CHATBOT_URL || 'us-central1-wavelength-lore.cloudfunctions.net';
const API_KEY = process.env.CHATBOT_API_KEY;

class AuthTester {
  constructor() {
    this.results = [];
  }

  /**
   * Test 1: Bearer token in Authorization header (current method)
   */
  async testBearerToken() {
    console.log('\n🧪 Test 1: Bearer Token in Authorization Header');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const response = await axios.post(
        `https://${API_BASE}/chat`,
        { message: 'test', conversation_history: [] },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ SUCCESS with Bearer Token');
      this.results.push({ method: 'Bearer Token', status: 'SUCCESS', code: response.status });
      return true;
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED: ${error.response.status} ${error.response.statusText}`);
        this.results.push({ method: 'Bearer Token', status: 'FAILED', code: error.response.status });
        console.log(`   Error: ${error.response.data?.message || 'No message'}`);
      } else {
        console.log(`❌ ERROR: ${error.message}`);
        this.results.push({ method: 'Bearer Token', status: 'ERROR', code: error.code });
      }
      return false;
    }
  }

  /**
   * Test 2: Plain token in Authorization header
   */
  async testPlainToken() {
    console.log('\n🧪 Test 2: Plain Token in Authorization Header');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const response = await axios.post(
        `https://${API_BASE}/chat`,
        { message: 'test', conversation_history: [] },
        {
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ SUCCESS with Plain Token');
      this.results.push({ method: 'Plain Token', status: 'SUCCESS', code: response.status });
      return true;
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED: ${error.response.status} ${error.response.statusText}`);
        this.results.push({ method: 'Plain Token', status: 'FAILED', code: error.response.status });
      } else {
        console.log(`❌ ERROR: ${error.message}`);
        this.results.push({ method: 'Plain Token', status: 'ERROR', code: error.code });
      }
      return false;
    }
  }

  /**
   * Test 3: X-API-Key header
   */
  async testXApiKeyHeader() {
    console.log('\n🧪 Test 3: X-API-Key Header');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const response = await axios.post(
        `https://${API_BASE}/chat`,
        { message: 'test', conversation_history: [] },
        {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ SUCCESS with X-API-Key Header');
      this.results.push({ method: 'X-API-Key', status: 'SUCCESS', code: response.status });
      return true;
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED: ${error.response.status} ${error.response.statusText}`);
        this.results.push({ method: 'X-API-Key', status: 'FAILED', code: error.response.status });
      } else {
        console.log(`❌ ERROR: ${error.message}`);
        this.results.push({ method: 'X-API-Key', status: 'ERROR', code: error.code });
      }
      return false;
    }
  }

  /**
   * Test 4: Query parameter
   */
  async testQueryParam() {
    console.log('\n🧪 Test 4: API Key as Query Parameter');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const response = await axios.post(
        `https://${API_BASE}/chat?api_key=${API_KEY}`,
        { message: 'test', conversation_history: [] },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ SUCCESS with Query Parameter');
      this.results.push({ method: 'Query Param', status: 'SUCCESS', code: response.status });
      return true;
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED: ${error.response.status} ${error.response.statusText}`);
        this.results.push({ method: 'Query Param', status: 'FAILED', code: error.response.status });
      } else {
        console.log(`❌ ERROR: ${error.message}`);
        this.results.push({ method: 'Query Param', status: 'ERROR', code: error.code });
      }
      return false;
    }
  }

  /**
   * Test 5: Custom Header
   */
  async testCustomHeader() {
    console.log('\n🧪 Test 5: Custom Chatbot-Auth Header');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const response = await axios.post(
        `https://${API_BASE}/chat`,
        { message: 'test', conversation_history: [] },
        {
          headers: {
            'Chatbot-Auth': API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ SUCCESS with Chatbot-Auth Header');
      this.results.push({ method: 'Chatbot-Auth', status: 'SUCCESS', code: response.status });
      return true;
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED: ${error.response.status} ${error.response.statusText}`);
        this.results.push({ method: 'Chatbot-Auth', status: 'FAILED', code: error.response.status });
      } else {
        console.log(`❌ ERROR: ${error.message}`);
        this.results.push({ method: 'Chatbot-Auth', status: 'ERROR', code: error.code });
      }
      return false;
    }
  }

  /**
   * Test 6: No authentication
   */
  async testNoAuth() {
    console.log('\n🧪 Test 6: No Authentication');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const response = await axios.post(
        `https://${API_BASE}/chat`,
        { message: 'test', conversation_history: [] },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ SUCCESS with No Auth');
      this.results.push({ method: 'No Auth', status: 'SUCCESS', code: response.status });
      return true;
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED: ${error.response.status} ${error.response.statusText}`);
        this.results.push({ method: 'No Auth', status: 'FAILED', code: error.response.status });
      } else {
        console.log(`❌ ERROR: ${error.message}`);
        this.results.push({ method: 'No Auth', status: 'ERROR', code: error.code });
      }
      return false;
    }
  }

  /**
   * Display results summary
   */
  displayResults() {
    console.log('\n\n📊 Authentication Test Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const successful = this.results.filter(r => r.status === 'SUCCESS');

    if (successful.length > 0) {
      console.log('✅ SUCCESSFUL METHODS:\n');
      successful.forEach(r => {
        console.log(`  ${r.method} - HTTP ${r.code}`);
      });
      console.log('\n💡 Use one of these methods in your API client!\n');
    } else {
      console.log('All methods failed. Summary:\n');
      this.results.forEach(r => {
        console.log(`  ${r.method}: ${r.status} (${r.code})`);
      });
      console.log();
    }
  }

  /**
   * Run all tests
   */
  async runAll() {
    console.log('🔐 CTA Authentication Method Tester');
    console.log('Testing different auth methods to find what works...\n');
    console.log(`API: ${API_BASE}`);
    console.log(`Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

    await this.testBearerToken();
    await this.testPlainToken();
    await this.testXApiKeyHeader();
    await this.testQueryParam();
    await this.testCustomHeader();
    await this.testNoAuth();

    this.displayResults();
  }
}

/**
 * Main
 */
async function main() {
  if (!API_KEY) {
    console.error('❌ CHATBOT_API_KEY not set in .env');
    process.exit(1);
  }

  const tester = new AuthTester();
  await tester.runAll();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { AuthTester };
