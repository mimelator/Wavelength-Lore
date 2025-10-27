#!/usr/bin/env node

/**
 * 🤖 WAVELENGTH CHATBOT ADMIN TOOL
 * ================================
 * Admin interface for interacting with the Wavelength Lore chatbot
 * Provides testing, querying, and health checking capabilities
 */

const https = require('https');
const readline = require('readline');
const chalk = require('chalk');

class ChatbotAdminTool {
  constructor() {
    // Load environment variables
    this.loadEnvVars();
    
    this.config = {
      apiUrl: process.env.CHATBOT_API_URL || 'https://ai-wavelengthlore.web.app',
      apiKey: process.env.CHATBOT_API_KEY || process.env.CHATBOT_JWT_SECRET,
      timeout: 30000
    };

    this.testQuestions = [
      "What is Wavelength Lore about?",
      "Who is Andrew in the story?",
      "Tell me about Season 1",
      "What characters exist in Wavelength?",
      "Describe the Ice Fortress",
      "What happened in the latest episode?"
    ];
  }

  /**
   * Load environment variables from .env files
   */
  loadEnvVars() {
    const fs = require('fs');
    const path = require('path');
    
    const projectRoot = path.resolve(__dirname, '../');
    const envFiles = [
      path.join(projectRoot, '.env'),
      path.join(projectRoot, '.env.production')
    ];
    
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        content.split('\n').forEach(line => {
          line = line.trim();
          if (!line || line.startsWith('#')) return;
          
          const match = line.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // Remove surrounding quotes
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            // Only set if not already in process.env
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        });
      } catch (error) {
        // File doesn't exist or can't be read - that's okay
      }
    }
  }

  /**
   * 🔍 Check chatbot service health
   */
  async checkHealth() {
    console.log(chalk.cyan('🤖 WAVELENGTH CHATBOT HEALTH CHECK'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.white('📋 Configuration:'));
    console.log(chalk.white(`   API URL: ${this.config.apiUrl}`));
    console.log(chalk.white(`   API Key: ${this.config.apiKey ? this.config.apiKey.substring(0, 8) + '...' : 'Not configured'}`));
    console.log(chalk.white(`   Timeout: ${this.config.timeout}ms`));
    console.log('');

    if (!this.config.apiKey) {
      console.log(chalk.red('❌ API Key not configured'));
      console.log(chalk.yellow('   Set CHATBOT_API_KEY or CHATBOT_JWT_SECRET in .env'));
      return false;
    }

    try {
      console.log(chalk.white('🔍 Testing connection...'));
      const response = await this.sendMessage('Health check');
      
      if (response.success) {
        console.log(chalk.green('✅ Chatbot is healthy and responding'));
        console.log(chalk.white(`   Response time: ${response.responseTime}ms`));
        console.log(chalk.white(`   Response: "${response.message.substring(0, 100)}..."`));
        return true;
      } else {
        console.log(chalk.red('❌ Chatbot health check failed'));
        console.log(chalk.red(`   Error: ${response.error}`));
        return false;
      }
    } catch (error) {
      console.log(chalk.red('❌ Connection failed'));
      console.log(chalk.red(`   Error: ${error.message}`));
      return false;
    }
  }

  /**
   * 🧪 Run chatbot functionality tests
   */
  async runTests() {
    console.log(chalk.cyan('🧪 WAVELENGTH CHATBOT FUNCTIONALITY TESTS'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    const results = {
      passed: 0,
      failed: 0,
      total: this.testQuestions.length,
      details: []
    };

    for (let i = 0; i < this.testQuestions.length; i++) {
      const question = this.testQuestions[i];
      console.log(chalk.white(`\n${i + 1}/${this.testQuestions.length} Testing: "${question}"`));
      
      try {
        const response = await this.sendMessage(question);
        
        if (response.success && response.message && response.message.length > 10) {
          console.log(chalk.green('   ✅ PASS'));
          console.log(chalk.gray(`   Response: "${response.message.substring(0, 80)}..."`));
          console.log(chalk.gray(`   Time: ${response.responseTime}ms`));
          results.passed++;
          results.details.push({ question, status: 'PASS', responseTime: response.responseTime });
        } else {
          console.log(chalk.red('   ❌ FAIL - No meaningful response'));
          console.log(chalk.red(`   Error: ${response.error || 'Empty response'}`));
          results.failed++;
          results.details.push({ question, status: 'FAIL', error: response.error || 'Empty response' });
        }
      } catch (error) {
        console.log(chalk.red('   ❌ FAIL - Connection error'));
        console.log(chalk.red(`   Error: ${error.message}`));
        results.failed++;
        results.details.push({ question, status: 'FAIL', error: error.message });
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log(chalk.cyan('\n📊 TEST RESULTS SUMMARY:'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green(`✅ Passed: ${results.passed}/${results.total}`));
    console.log(chalk.red(`❌ Failed: ${results.failed}/${results.total}`));
    
    const successRate = (results.passed / results.total * 100).toFixed(1);
    console.log(chalk.white(`📈 Success Rate: ${successRate}%`));
    
    if (results.passed === results.total) {
      console.log(chalk.green('\n🎉 All tests passed! Chatbot is fully functional.'));
    } else if (results.passed > 0) {
      console.log(chalk.yellow('\n⚠️  Some tests failed. Chatbot has partial functionality.'));
    } else {
      console.log(chalk.red('\n💥 All tests failed. Chatbot is not responding correctly.'));
    }

    return results;
  }

  /**
   * 💬 Interactive chat mode
   */
  async startInteractiveChat() {
    console.log(chalk.cyan('💬 WAVELENGTH CHATBOT INTERACTIVE MODE'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white('Ask questions about Wavelength Lore! Type "exit" to quit.'));
    console.log(chalk.yellow('Example: "Who is Andrew?" or "What happened in Season 1?"'));
    console.log('');

    // First check if chatbot is accessible
    console.log(chalk.gray('🔍 Checking chatbot connection...'));
    try {
      const healthCheck = await this.sendMessage('Hello');
      if (!healthCheck.success) {
        console.log(chalk.red('❌ Chatbot connection failed. Please check configuration.'));
        console.log(chalk.red(`   Error: ${healthCheck.error}`));
        return;
      }
      console.log(chalk.green('✅ Chatbot connected successfully!\n'));
    } catch (error) {
      console.log(chalk.red('❌ Cannot connect to chatbot. Please check your configuration.'));
      console.log(chalk.red(`   Error: ${error.message}`));
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    // Ensure proper cleanup
    const cleanup = () => {
      rl.close();
      process.exit(0);
    };

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Interrupted by user. Goodbye!'));
      cleanup();
    });

    const askQuestion = () => {
      rl.question(chalk.cyan('🤖 Ask: '), async (question) => {
        if (!question) {
          console.log(chalk.yellow('Please enter a question or "exit" to quit.'));
          askQuestion();
          return;
        }

        if (question.toLowerCase().trim() === 'exit') {
          console.log(chalk.green('\n👋 Goodbye! Chat session ended.'));
          cleanup();
          return;
        }

        if (!question.trim()) {
          console.log(chalk.yellow('Please enter a question or "exit" to quit.'));
          askQuestion();
          return;
        }

        try {
          console.log(chalk.gray('🤔 Thinking...'));
          const response = await this.sendMessage(question.trim());
          
          if (response.success) {
            console.log(chalk.green(`💡 Answer: ${response.message}`));
            console.log(chalk.gray(`⏱️  Response time: ${response.responseTime}ms\n`));
          } else {
            console.log(chalk.red(`❌ Error: ${response.error}\n`));
          }
        } catch (error) {
          console.log(chalk.red(`❌ Connection error: ${error.message}\n`));
        }

        // Continue the conversation
        setImmediate(askQuestion);
      });
    };

    // Start the conversation
    askQuestion();
  }

  /**
   * 🎯 Send a single query and get response
   */
  async sendQuery(question) {
    console.log(chalk.cyan(`🎯 CHATBOT QUERY: "${question}"`));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    try {
      const response = await this.sendMessage(question);
      
      if (response.success) {
        console.log(chalk.green('✅ Response received:'));
        console.log(chalk.white(response.message));
        console.log(chalk.gray(`\n⏱️  Response time: ${response.responseTime}ms`));
        return response;
      } else {
        console.log(chalk.red('❌ Query failed:'));
        console.log(chalk.red(response.error));
        return response;
      }
    } catch (error) {
      console.log(chalk.red('❌ Connection error:'));
      console.log(chalk.red(error.message));
      return { success: false, error: error.message };
    }
  }

  /**
   * 📡 Send message to chatbot API
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const postData = JSON.stringify({
        message: message,
        context: 'admin-tool'
      });

      // Parse the API URL properly
      const url = new URL(this.config.apiUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/legacy/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-API-Key': this.config.apiKey,
          'User-Agent': 'Wavelength-Admin-Tool'
        },
        timeout: this.config.timeout
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200 && (response.response || response.success)) {
              resolve({
                success: true,
                message: response.response || response.message || 'Response received',
                responseTime: responseTime,
                metadata: response.metadata,
                usage: response.usage
              });
            } else {
              resolve({
                success: false,
                error: response.error || response.message || `HTTP ${res.statusCode}`,
                responseTime: responseTime
              });
            }
          } catch (parseError) {
            resolve({
              success: false,
              error: `Parse error: ${parseError.message}. Raw response: ${data.substring(0, 200)}...`,
              responseTime: responseTime
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 📋 Show usage help
   */
  showHelp() {
    console.log(chalk.cyan('🤖 WAVELENGTH CHATBOT ADMIN TOOL'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white('Available Commands:\n'));
    
    console.log(chalk.white('  🔍 health     - Check chatbot service health'));
    console.log(chalk.white('  🧪 test       - Run functionality tests'));
    console.log(chalk.white('  💬 chat       - Interactive chat mode'));
    console.log(chalk.white('  🎯 query      - Send single query'));
    console.log(chalk.white('  🎭 demo       - Demo mode (mock responses)'));
    console.log(chalk.white('  📋 help       - Show this help\n'));
    
    console.log(chalk.yellow('Usage Examples:'));
    console.log(chalk.white('  npm run cli:admin chatbot health'));
    console.log(chalk.white('  npm run cli:admin chatbot test'));
    console.log(chalk.white('  npm run cli:admin chatbot chat'));
    console.log(chalk.white('  npm run cli:admin chatbot query "Who is Andrew?"'));
    console.log('');
    
    console.log(chalk.green('🌊 Interactive Wavelength Lore chatbot administration'));
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const chatbot = new ChatbotAdminTool();
  
  switch (command) {
    case 'health':
      await chatbot.checkHealth();
      break;
      
    case 'test':
      await chatbot.runTests();
      break;
      
    case 'chat':
      await chatbot.startInteractiveChat();
      break;
      
    case 'query':
      const question = args.slice(1).join(' ');
      if (!question) {
        console.log(chalk.red('❌ Please provide a question'));
        console.log(chalk.yellow('Example: npm run cli:admin chatbot query "Who is Andrew?"'));
        process.exit(1);
      }
      await chatbot.sendQuery(question);
      break;
      
    case 'help':
    default:
      chatbot.showHelp();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = ChatbotAdminTool;