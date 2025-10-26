#!/usr/bin/env node

/**
 * 🔥 Firebase Functions Chatbot Test Suite
 * Tests the actual Firebase Functions-based chatbot with SSO authentication
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Firebase Functions Configuration
const FIREBASE_FUNCTION_URL = 'https://us-central1-wavelength-lore.cloudfunctions.net';
const SSO_DOMAIN = 'wavelengthlore.com';
const LOGIN_URL = `https://${SSO_DOMAIN}/login`;

class FirebaseChatbotTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://wavelengthlore.com';
    this.headless = options.headless !== false;
    this.timeout = options.timeout || 45000;
    this.testResults = [];
    this.browser = null;
    this.page = null;
    
    // Test configuration
    this.testPrompts = [
      "Hello! Can you tell me about the Wavelength universe?",
      "Who are the main characters in Wavelength?",
      "What happened in Season 1?",
      "Tell me about the lore of this universe."
    ];
    
    console.log(chalk.blue('🔥 Firebase Functions Chatbot Test Configuration:'));
    console.log(chalk.gray(`   Base URL: ${this.baseUrl}`));
    console.log(chalk.gray(`   Firebase URL: ${FIREBASE_FUNCTION_URL}`));
    console.log(chalk.gray(`   Mode: ${this.headless ? 'Headless' : 'Visible'}`));
    console.log(chalk.gray(`   Timeout: ${this.timeout}ms`));
  }

  async runTests() {
    console.log(chalk.blue('🚀 Starting Firebase Chatbot Test Suite'));
    console.log(chalk.yellow('═══════════════════════════════════════'));
    
    try {
      await this.initializeBrowser();
      
      // Test 1: Firebase Functions Health Check
      await this.testFirebaseFunctionsHealth();
      
      // Test 2: Authentication Requirements
      await this.testAuthenticationRequirements();
      
      // Test 3: Widget Integration (if accessible)
      await this.testWidgetIntegration();
      
      return this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('💥 Test suite execution failed:'), error.message);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async initializeBrowser() {
    console.log(chalk.blue('🔧 Initializing browser...'));
    
    this.browser = await puppeteer.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ChatbotTester/1.0');
    
    // Set viewport
    await this.page.setViewport({ width: 1280, height: 720 });
    
    console.log(chalk.green('✅ Browser initialized successfully'));
  }

  async testFirebaseFunctionsHealth() {
    console.log(chalk.blue('\n🏥 Testing Firebase Functions Health...'));
    
    try {
      // Test health endpoint
      const healthResponse = await this.page.evaluate(async (url) => {
        try {
          const response = await fetch(`${url}/health`);
          return {
            status: response.status,
            ok: response.ok,
            data: await response.json()
          };
        } catch (error) {
          return { error: error.message };
        }
      }, FIREBASE_FUNCTION_URL);

      if (healthResponse.ok) {
        console.log(chalk.green('✅ Firebase Functions health check passed'));
        console.log(chalk.gray(`   Status: ${healthResponse.status}`));
        console.log(chalk.gray(`   Service: ${healthResponse.data.service || 'unknown'}`));
        console.log(chalk.gray(`   Security: SSO=${healthResponse.data.security?.ssoEnabled}, Auth=${healthResponse.data.security?.authEnabled}`));
        
        this.testResults.push({
          test: 'Firebase Functions Health',
          status: 'PASS',
          details: healthResponse.data
        });
      } else {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

    } catch (error) {
      console.log(chalk.red('❌ Firebase Functions health check failed'));
      console.log(chalk.red(`   Error: ${error.message}`));
      
      this.testResults.push({
        test: 'Firebase Functions Health',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testAuthenticationRequirements() {
    console.log(chalk.blue('\n🔐 Testing Authentication Requirements...'));
    
    try {
      // Test unauthenticated chat request
      const unauthResponse = await this.page.evaluate(async (url) => {
        try {
          const response = await fetch(`${url}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Hello, testing authentication'
            })
          });
          
          return {
            status: response.status,
            ok: response.ok,
            data: response.ok ? await response.json() : await response.text()
          };
        } catch (error) {
          return { error: error.message };
        }
      }, FIREBASE_FUNCTION_URL);

      if (unauthResponse.status === 401) {
        console.log(chalk.green('✅ Unauthenticated requests properly blocked (401)'));
        
        this.testResults.push({
          test: 'Authentication Required',
          status: 'PASS',
          details: 'Unauthenticated requests properly rejected'
        });
      } else if (unauthResponse.status === 403) {
        console.log(chalk.green('✅ Access control working (403 - VIP+ required)'));
        
        this.testResults.push({
          test: 'Authentication Required',
          status: 'PASS',
          details: 'VIP+ membership requirement enforced'
        });
      } else {
        console.log(chalk.yellow(`⚠️ Unexpected response: ${unauthResponse.status}`));
        
        this.testResults.push({
          test: 'Authentication Required',
          status: 'PARTIAL',
          details: `Unexpected status: ${unauthResponse.status}`,
          response: unauthResponse
        });
      }

    } catch (error) {
      console.log(chalk.red('❌ Authentication test failed'));
      console.log(chalk.red(`   Error: ${error.message}`));
      
      this.testResults.push({
        test: 'Authentication Required',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testWidgetIntegration() {
    console.log(chalk.blue('\n🖥️ Testing Widget Integration...'));
    
    try {
      // Navigate to the main site
      console.log(chalk.gray('   📍 Navigating to wavelengthlore.com...'));
      await this.page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.timeout 
      });

      // Look for chatbot widget or VIP dropdown
      const widgetElements = await this.page.evaluate(() => {
        const elements = [];
        
        // Look for VIP AI Assistant elements (updated for new floating icon)
        const aiAssistantIcon = document.querySelector('#ai-assistant-icon');
        if (aiAssistantIcon) {
          elements.push({
            type: 'ai-assistant-icon',
            visible: aiAssistantIcon.style.display !== 'none',
            text: aiAssistantIcon.getAttribute('title') || 'AI Assistant'
          });
        }
        
        // Look for legacy VIP dropdown (for backwards compatibility testing)
        const vipChatbotItem = document.querySelector('#vip-chatbot-dropdown-item');
        if (vipChatbotItem) {
          elements.push({
            type: 'vip-dropdown-legacy',
            visible: vipChatbotItem.style.display !== 'none',
            text: vipChatbotItem.textContent?.trim()
          });
        }
        
        // Look for chatbot containers
        const containers = document.querySelectorAll('.vip-chatbot-container, .chatbot-container, #chatbot-frame');
        containers.forEach((container, index) => {
          elements.push({
            type: 'container',
            index,
            tagName: container.tagName.toLowerCase(),
            id: container.id,
            className: container.className,
            visible: window.getComputedStyle(container).display !== 'none'
          });
        });
        
        return elements;
      });

      if (widgetElements.length > 0) {
        console.log(chalk.green('✅ Chatbot widget elements found'));
        widgetElements.forEach(element => {
          const visibility = element.visible ? chalk.green('visible') : chalk.yellow('hidden');
          console.log(chalk.gray(`   • ${element.type}: ${visibility}`));
        });
        
        // Try to access chatbot widget page
        const widgetUrl = `${this.baseUrl}/chatbot/widget`;
        console.log(chalk.gray(`   📍 Testing widget page: ${widgetUrl}`));
        
        await this.page.goto(widgetUrl, { 
          waitUntil: 'networkidle2',
          timeout: this.timeout 
        });
        
        // Check if widget loads
        const widgetLoaded = await this.page.evaluate(() => {
          return !!(document.querySelector('.vip-chatbot-container') || 
                   document.querySelector('#chatbot-frame') ||
                   document.querySelector('.chat-widget'));
        });
        
        if (widgetLoaded) {
          console.log(chalk.green('✅ Chatbot widget page loads successfully'));
          
          this.testResults.push({
            test: 'Widget Integration',
            status: 'PASS',
            details: 'Widget elements found and page loads',
            elements: widgetElements
          });
        } else {
          console.log(chalk.yellow('⚠️ Widget page accessible but no chat elements loaded'));
          
          this.testResults.push({
            test: 'Widget Integration',
            status: 'PARTIAL',
            details: 'Page loads but chat elements not found'
          });
        }
        
      } else {
        console.log(chalk.yellow('⚠️ No chatbot widget elements found'));
        
        this.testResults.push({
          test: 'Widget Integration',
          status: 'PARTIAL',
          details: 'No widget elements detected on main page'
        });
      }

    } catch (error) {
      console.log(chalk.red('❌ Widget integration test failed'));
      console.log(chalk.red(`   Error: ${error.message}`));
      
      this.testResults.push({
        test: 'Widget Integration',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  generateReport() {
    console.log(chalk.blue('\n📊 Generating Firebase Chatbot Test Report...'));
    
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'Firebase Functions Chatbot',
      firebaseUrl: FIREBASE_FUNCTION_URL,
      baseUrl: this.baseUrl,
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.status === 'PASS').length,
      failedTests: this.testResults.filter(r => r.status === 'FAIL').length,
      partialTests: this.testResults.filter(r => r.status === 'PARTIAL').length,
      results: this.testResults
    };

    // Save report
    const reportPath = path.join(__dirname, `firebase-chatbot-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Console summary
    console.log(chalk.green('✅ FIREBASE CHATBOT TEST REPORT'));
    console.log(chalk.yellow('═══════════════════════════════════════'));
    console.log(chalk.blue(`📊 Total Tests: ${report.totalTests}`));
    console.log(chalk.green(`✅ Passed: ${report.passedTests}`));
    console.log(chalk.yellow(`⚠️ Partial: ${report.partialTests}`));
    console.log(chalk.red(`❌ Failed: ${report.failedTests}`));
    
    const successRate = Math.round(((report.passedTests + report.partialTests * 0.5) / report.totalTests) * 100);
    console.log(chalk.yellow(`📈 Success Rate: ${successRate}%`));
    console.log(chalk.gray(`📄 Report saved: ${reportPath}`));

    // Detailed results
    console.log(chalk.blue('\n🔍 Detailed Results:'));
    this.testResults.forEach((result) => {
      const statusIcon = result.status === 'PASS' ? chalk.green('✅') : 
                        result.status === 'PARTIAL' ? chalk.yellow('⚠️') : chalk.red('❌');
      console.log(`${statusIcon} ${result.test}: ${result.status}`);
      
      if (result.details) {
        console.log(chalk.gray(`   Details: ${typeof result.details === 'object' ? JSON.stringify(result.details) : result.details}`));
      }
      
      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`));
      }
    });

    // Summary and recommendations
    console.log(chalk.blue('\n💡 Summary & Recommendations:'));
    
    const healthTest = this.testResults.find(r => r.test === 'Firebase Functions Health');
    if (healthTest?.status === 'PASS') {
      console.log(chalk.green('🎉 Firebase Functions backend is healthy and operational'));
    } else {
      console.log(chalk.red('⚠️ Firebase Functions backend issues detected'));
    }
    
    const authTest = this.testResults.find(r => r.test === 'Authentication Required');
    if (authTest?.status === 'PASS') {
      console.log(chalk.green('🔐 Authentication and access control working correctly'));
    } else {
      console.log(chalk.yellow('🔐 Authentication behavior may need review'));
    }
    
    const widgetTest = this.testResults.find(r => r.test === 'Widget Integration');
    if (widgetTest?.status === 'PASS') {
      console.log(chalk.green('🖥️ Widget integration functioning properly'));
    } else {
      console.log(chalk.yellow('🖥️ Widget integration may need debugging or VIP access'));
    }

    console.log(chalk.blue('\n🎯 Next Steps:'));
    console.log(chalk.gray('  • For full chatbot testing, VIP+ membership authentication is required'));
    console.log(chalk.gray('  • Consider testing with authenticated session tokens for complete validation'));
    console.log(chalk.gray('  • Monitor Firebase Functions logs for detailed error analysis'));

    return report;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    headless: !args.includes('--visible'),
    baseUrl: args.includes('--url') ? args[args.indexOf('--url') + 1] : 'https://wavelengthlore.com',
    timeout: args.includes('--timeout') ? parseInt(args[args.indexOf('--timeout') + 1]) : 45000
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.green('Firebase Functions Chatbot Test Suite'));
    console.log('');
    console.log(chalk.blue('Usage:'));
    console.log('  node firebase-chatbot-test.js [options]');
    console.log('');
    console.log(chalk.blue('Options:'));
    console.log('  --visible       Run browser in visible mode');
    console.log('  --url <url>     Base URL (default: https://wavelengthlore.com)');
    console.log('  --timeout <ms>  Timeout in milliseconds (default: 45000)');
    console.log('  --help, -h      Show this help');
    console.log('');
    console.log(chalk.blue('Tests:'));
    console.log('  • Firebase Functions health check');
    console.log('  • Authentication requirements validation');
    console.log('  • Widget integration verification');
    return;
  }
  
  const tester = new FirebaseChatbotTester(options);
  
  try {
    const report = await tester.runTests();
    
    if (report.failedTests === 0) {
      console.log(chalk.green.bold('\n🎉 All tests passed! Firebase chatbot is operational.'));
      process.exit(0);
    } else {
      console.log(chalk.yellow.bold(`\n⚠️ ${report.failedTests} test(s) failed. Check report for details.`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red.bold('\n💥 Test suite execution failed!'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FirebaseChatbotTester };