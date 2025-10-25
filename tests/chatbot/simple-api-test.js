#!/usr/bin/env node

/**
 * 🤖 Simple Chatbot API Test
 * Tests if chatbot endpoints are responding without complex UI automation
 */

const chalk = require('chalk');
const fetch = require('node-fetch');

class SimpleChatbotAPITest {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async testEndpoint(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(chalk.gray(`🔍 Testing: ${method} ${url}`));
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ChatbotTester/1.0'
        }
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      const statusCode = response.status;
      const contentType = response.headers.get('content-type');
      
      let responseData = '';
      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (e) {
        responseData = 'Unable to parse response';
      }
      
      const result = {
        endpoint,
        method,
        status: statusCode,
        success: statusCode >= 200 && statusCode < 400,
        contentType,
        response: typeof responseData === 'string' ? responseData.substring(0, 200) : responseData
      };
      
      this.results.push(result);
      
      if (result.success) {
        console.log(chalk.green(`✅ ${statusCode} - ${endpoint}`));
      } else {
        console.log(chalk.red(`❌ ${statusCode} - ${endpoint}`));
      }
      
      return result;
      
    } catch (error) {
      const result = {
        endpoint,
        method,
        status: 0,
        success: false,
        error: error.message,
        response: null
      };
      
      this.results.push(result);
      console.log(chalk.red(`❌ ERROR - ${endpoint}: ${error.message}`));
      return result;
    }
  }

  async runAPITests() {
    console.log(chalk.blue('🤖 Simple Chatbot API Tests'));
    console.log(chalk.yellow('════════════════════════════'));
    console.log(chalk.gray(`Base URL: ${this.baseUrl}`));
    console.log('');
    
    // Test basic endpoints
    await this.testEndpoint('/');
    await this.testEndpoint('/health');
    await this.testEndpoint('/api/health');
    await this.testEndpoint('/chatbot');
    await this.testEndpoint('/chatbot/widget');
    await this.testEndpoint('/chat');
    
    // Test potential API endpoints
    await this.testEndpoint('/api/chat', 'POST', { message: 'Hello' });
    await this.testEndpoint('/api/chatbot', 'POST', { message: 'Hello' });
    await this.testEndpoint('/api/chat/message', 'POST', { message: 'Hello' });
    
    // Test authentication endpoints
    await this.testEndpoint('/api/auth/status');
    await this.testEndpoint('/api/user/profile');
    
    console.log('');
    this.generateReport();
  }

  generateReport() {
    console.log(chalk.blue('📊 API Test Results Summary'));
    console.log(chalk.yellow('═══════════════════════════'));
    
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    
    console.log(chalk.gray(`📊 Total Endpoints: ${total}`));
    console.log(chalk.green(`✅ Successful: ${successful}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.yellow(`📈 Success Rate: ${Math.round((successful / total) * 100)}%`));
    console.log('');
    
    // Detailed results
    console.log(chalk.blue('🔍 Detailed Results:'));
    this.results.forEach(result => {
      const status = result.success ? chalk.green('✅') : chalk.red('❌');
      const statusCode = result.status || 'ERR';
      console.log(`${status} ${statusCode} ${result.method} ${result.endpoint}`);
      
      if (result.error) {
        console.log(chalk.red(`    Error: ${result.error}`));
      } else if (result.response && typeof result.response === 'object') {
        console.log(chalk.gray(`    Response: ${JSON.stringify(result.response).substring(0, 100)}...`));
      }
    });
    
    console.log('');
    
    // Recommendations
    const workingEndpoints = this.results.filter(r => r.success);
    if (workingEndpoints.length > 0) {
      console.log(chalk.green('🎉 Working Endpoints Found:'));
      workingEndpoints.forEach(result => {
        console.log(chalk.green(`  • ${result.method} ${result.endpoint} (${result.status})`));
      });
    }
    
    const chatEndpoints = this.results.filter(r => 
      r.endpoint.includes('chat') && r.success
    );
    
    if (chatEndpoints.length > 0) {
      console.log(chalk.blue('💬 Chat-related endpoints available:'));
      chatEndpoints.forEach(result => {
        console.log(chalk.blue(`  • ${result.method} ${result.endpoint}`));
      });
    } else {
      console.log(chalk.yellow('⚠️  No working chat endpoints found'));
      console.log(chalk.gray('💡 The chatbot may use WebSocket connections or client-side JavaScript'));
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args.includes('--url') ? args[args.indexOf('--url') + 1] : 'http://localhost:3001';
  
  const tester = new SimpleChatbotAPITest(baseUrl);
  
  try {
    await tester.runAPITests();
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('💥 Test suite failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SimpleChatbotAPITest };