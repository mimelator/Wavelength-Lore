#!/usr/bin/env node

/**
 * 🔐 Automated SSO Chatbot Test Suite
 * 
 * Purpose: Test chatbot functionality in production SSO environment
 * Features: Automated login, session management, chat validation
 * 
 * Usage: node tests/chatbot/sso-chatbot-test.js [options]
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class SSOChatbotTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://wavelengthlore.com';
    this.isLocalhost = this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
    this.headless = options.headless !== false; // Default to headless
    this.timeout = options.timeout || 30000;
    this.testResults = [];
    this.sessionData = null;
    this.browser = null;
    this.page = null;
    
    // Test configuration
    this.testPrompts = [
      "Hello! Can you tell me about the Wavelength universe?",
      "Who are the main characters in Wavelength?",
      "What happened in Season 1?",
      "Tell me about the lore of this universe.",
      "Can you help me understand the story?"
    ];
    
    this.expectedKeywords = [
      ['wavelength', 'universe', 'story', 'character'],
      ['character', 'main', 'protagonist', 'hero'],
      ['season', 'episode', 'story', 'plot'],
      ['lore', 'world', 'universe', 'history'],
      ['help', 'story', 'understand', 'explain']
    ];
  }

  /**
   * Initialize browser and page for testing
   */
  async initialize() {
    console.log(chalk.blue('🔧 Initializing SSO Chatbot Test Suite...'));
    
    this.browser = await puppeteer.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set user agent and viewport
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Enable request interception for debugging
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      if (req.url().includes('/api/chat') || req.url().includes('/chat')) {
        console.log(chalk.gray(`🔍 Chat API Request: ${req.method()} ${req.url()}`));
      }
      req.continue();
    });
    
    // Listen for console logs from the page
    this.page.on('console', (msg) => {
      if (msg.text().includes('chat') || msg.text().includes('error')) {
        console.log(chalk.gray(`🖥️  Browser: ${msg.text()}`));
      }
    });

    console.log(chalk.green('✅ Browser initialized successfully'));
  }

  /**
   * Perform SSO authentication flow
   */
  async authenticateSSO() {
    console.log(chalk.blue('\n🔐 Starting SSO Authentication Flow...'));
    
    try {
      // Navigate to the main site
      console.log(chalk.gray('  📍 Navigating to wavelengthlore.com...'));
      await this.page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: this.timeout 
      });

      // For localhost, bypass SSO authentication entirely
      if (this.isLocalhost) {
        console.log(chalk.yellow('🏠 Localhost detected - skipping SSO authentication'));
        console.log(chalk.gray(`  📍 Navigating directly to localhost: ${this.baseUrl}`));
        await this.page.goto(this.baseUrl, { 
          waitUntil: 'networkidle2',
          timeout: this.timeout 
        });
        console.log(chalk.green('✅ Successfully navigated to localhost'));
        return true;
      }

      // Look for login button or check if already authenticated (production only)
      const loginButton = await this.page.$('a[href*="login"], .login-btn');
      
      if (!loginButton) {
        // Check if we're already authenticated by looking for user indicators
        const userIndicator = await this.page.$('.user-menu, .profile, [data-user], .authenticated');
        if (userIndicator) {
          console.log(chalk.green('✅ Already authenticated - skipping login'));
          return true;
        }
      }

      // Attempt to find and click login
      console.log(chalk.gray('  🔑 Looking for login options...'));
      
      // Try multiple login selectors (CSS-only, no jQuery-style selectors)
      const loginSelectors = [
        'a[href*="login"]',
        'button[class*="login" i]',
        '.login-btn',
        '.auth-login',
        'nav a[href*="login"]',
        '.header-login',
        'input[type="button"][value*="Login" i]',
        'input[type="submit"][value*="Login" i]'
      ];

      let loginFound = false;
      for (const selector of loginSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          await this.page.click(selector);
          console.log(chalk.green(`✅ Clicked login: ${selector}`));
          loginFound = true;
          break;
        } catch (error) {
          // Try next selector
          continue;
        }
      }

      if (!loginFound) {
        // Try to access chatbot directly and see if it redirects to login
        console.log(chalk.yellow('  ⚠️  No login button found, trying direct chatbot access...'));
        await this.page.goto(`${this.baseUrl}/chat`, { 
          waitUntil: 'networkidle2',
          timeout: this.timeout 
        });
      }

      // Wait for authentication to complete
      // This could be SSO redirect, login form, or direct access
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check current URL for auth indicators
      const currentUrl = this.page.url();
      console.log(chalk.gray(`  📍 Current URL: ${currentUrl}`));

      if (currentUrl.includes('login') || currentUrl.includes('auth')) {
        console.log(chalk.yellow('  ⚠️  Redirected to login - manual authentication may be required'));
        console.log(chalk.blue('  💡 You may need to complete authentication manually in the browser'));
        
        if (!this.headless) {
          console.log(chalk.green('  🖥️  Browser is visible - please complete login and press Enter to continue...'));
          // Wait for user input in non-headless mode
          await new Promise(resolve => {
            process.stdin.once('data', resolve);
          });
        }
      }

      // Verify authentication by checking for user session indicators
      await new Promise(resolve => setTimeout(resolve, 2000));
      const authSuccess = await this.checkAuthenticationStatus();
      
      return authSuccess;

    } catch (error) {
      console.error(chalk.red(`❌ Authentication failed: ${error.message}`));
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthenticationStatus() {
    console.log(chalk.gray('  🔍 Verifying authentication status...'));
    
    try {
      // For localhost, check for development authentication indicators
      if (this.isLocalhost) {
        console.log(chalk.blue('  🏠 Localhost detected - checking for development authentication...'));
        
        // Check development mode logs or indicators
        const devAuthResponse = await this.page.evaluate(async () => {
          try {
            // Check for development authentication in console or DOM
            const scripts = Array.from(document.scripts);
            const hasDevAuth = scripts.some(script => 
              script.textContent.includes('Development bypass') || 
              script.textContent.includes('Auto-authenticating')
            );
            
            // Also check for any authentication API endpoints
            const res = await fetch('/api/user/profile');
            return { 
              hasDevAuth, 
              apiStatus: res.status, 
              apiOk: res.ok,
              url: window.location.href
            };
          } catch (error) {
            return { error: error.message };
          }
        });

        if (devAuthResponse.apiOk || devAuthResponse.hasDevAuth) {
          console.log(chalk.green('✅ Development authentication verified'));
          return true;
        }
      }

      // Look for authentication indicators
      const authIndicators = [
        '.user-menu',
        '.profile-menu', 
        '[data-user]',
        '.authenticated',
        '.user-avatar',
        '.logout-btn',
        '.user-name'
      ];

      for (const indicator of authIndicators) {
        const element = await this.page.$(indicator);
        if (element) {
          console.log(chalk.green(`✅ Authentication verified: Found ${indicator}`));
          return true;
        }
      }

      // Try to access a protected endpoint
      const response = await this.page.evaluate(async () => {
        try {
          const res = await fetch('/api/user/profile');
          return { status: res.status, ok: res.ok };
        } catch (error) {
          return { error: error.message };
        }
      });

      if (response.ok || response.status === 200) {
        console.log(chalk.green('✅ Authentication verified: API access granted'));
        return true;
      }

      if (this.isLocalhost) {
        console.log(chalk.yellow('⚠️  Localhost: Proceeding without strict authentication'));
        return true; // More lenient for localhost testing
      }

      console.log(chalk.yellow('⚠️  Authentication status unclear - proceeding with tests'));
      return true; // Proceed anyway for testing

    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not verify authentication: ${error.message}`));
      return true; // Proceed anyway
    }
  }

  /**
   * Test chatbot functionality
   */
  async testChatbotFunctionality() {
    console.log(chalk.blue('\n💬 Testing Chatbot Functionality...'));
    
    try {
      // Navigate to chat interface
      console.log(chalk.gray('  📍 Navigating to chatbot interface...'));
      
      // Try multiple possible chatbot URLs/interfaces
      const chatUrls = [
        `${this.baseUrl}/chatbot/widget`,
        `${this.baseUrl}/chat`,
        `${this.baseUrl}/chatbot`,
        `${this.baseUrl}/#chat`,
        `${this.baseUrl}/`
      ];

      let chatFound = false;
      for (const url of chatUrls) {
        try {
          await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
          
          // Look for chat interface elements
          const chatElements = await this.page.$$('.chat-widget, .chatbot, .chat-container, .chat-interface, #chat');
          if (chatElements.length > 0) {
            console.log(chalk.green(`✅ Found chat interface at: ${url}`));
            chatFound = true;
            break;
          }
        } catch (error) {
          continue; // Try next URL
        }
      }

      if (!chatFound) {
        console.log(chalk.yellow('  ⚠️  No dedicated chat page found, looking for chat widget...'));
      }

      // Look for chat widget or interface elements with expanded selectors
      const chatSelectors = [
        '.chat-widget',
        '.chatbot-widget', 
        '.chat-container',
        '.chat-interface',
        '#chat-widget',
        '#chatbot',
        '[data-chatbot]',
        '.ai-chat',
        '.sso-chat-widget',
        '.wavelength-chat',
        '.chat-section',
        '.chat-area',
        'iframe[src*="chat"]',
        '[class*="chat"]',
        '[id*="chat"]'
      ];

      let chatInterface = null;
      let foundSelector = '';
      
      for (const selector of chatSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          chatInterface = await this.page.$(selector);
          if (chatInterface) {
            foundSelector = selector;
            console.log(chalk.green(`✅ Found chat interface: ${selector}`));
            break;
          }
        } catch (error) {
          continue;
        }
      }

      // If no dedicated chat interface, look for any input that might be chat-related
      if (!chatInterface) {
        console.log(chalk.yellow('  🔍 No dedicated chat widget found, scanning for chat inputs...'));
        
        const inputSelectors = [
          'input[placeholder*="message" i]',
          'input[placeholder*="chat" i]',
          'textarea[placeholder*="message" i]',
          'textarea[placeholder*="chat" i]',
          'input[name*="chat" i]',
          'input[id*="chat" i]'
        ];
        
        for (const selector of inputSelectors) {
          try {
            const input = await this.page.$(selector);
            if (input) {
              console.log(chalk.green(`✅ Found potential chat input: ${selector}`));
              chatInterface = input;
              foundSelector = selector;
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }

      if (!chatInterface) {
        // For localhost, be more lenient and try to find any form inputs
        if (this.isLocalhost) {
          console.log(chalk.yellow('  🏠 Localhost: Looking for any available input fields...'));
          const anyInputs = await this.page.$$('input[type="text"], textarea');
          if (anyInputs.length > 0) {
            chatInterface = anyInputs[0];
            console.log(chalk.yellow(`✅ Using first available input field for localhost testing`));
          }
        }
      }

      if (!chatInterface) {
        throw new Error('No chat interface or input field found on any page');
      }

      // Run chat tests
      console.log(chalk.blue('\n  🧪 Running Chat Response Tests...'));
      
      for (let i = 0; i < this.testPrompts.length; i++) {
        const prompt = this.testPrompts[i];
        const expectedKeywords = this.expectedKeywords[i];
        
        console.log(chalk.gray(`\n  Test ${i + 1}: "${prompt}"`));
        
        const result = await this.sendChatMessage(prompt, expectedKeywords);
        this.testResults.push({
          test: `Chat Test ${i + 1}`,
          prompt,
          expectedKeywords,
          ...result
        });
        
        // Wait between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return true;

    } catch (error) {
      console.error(chalk.red(`❌ Chatbot functionality test failed: ${error.message}`));
      this.testResults.push({
        test: 'Chatbot Functionality',
        status: 'FAIL',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send a chat message and validate response
   */
  async sendChatMessage(message, expectedKeywords = []) {
    try {
      // Look for input field
      const inputSelectors = [
        '.chat-input input',
        '.chatbot-input',
        '#chat-input',
        '.message-input',
        'input[placeholder*="message" i]',
        'input[placeholder*="chat" i]',
        'textarea[placeholder*="message" i]',
        'textarea[placeholder*="chat" i]',
        'input[type="text"]',
        'textarea',
        '.chat-container input',
        '.chat-widget input',
        '#chatbot-input',
        '.ai-input',
        '.bot-input'
      ];

      let inputField = null;
      for (const selector of inputSelectors) {
        inputField = await this.page.$(selector);
        if (inputField) break;
      }

      if (!inputField) {
        throw new Error('Chat input field not found');
      }

      // Clear and type message
      await inputField.click();
      await inputField.evaluate(el => el.value = '');
      await inputField.type(message);

      // Look for send button
      const sendSelectors = [
        '.chat-send',
        '.send-btn',
        'button[type="submit"]',
        '.chat-submit',
        '.message-send'
      ];

      let sendButton = null;
      for (const selector of sendSelectors) {
        sendButton = await this.page.$(selector);
        if (sendButton) break;
      }

      if (sendButton) {
        await sendButton.click();
      } else {
        // Try pressing Enter
        await inputField.press('Enter');
      }

      console.log(chalk.gray(`    💬 Sent: "${message}"`));

      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Look for response in various possible containers
      const responseSelectors = [
        '.chat-messages .bot-message:last-child',
        '.chatbot-response:last-child',
        '.ai-response:last-child',
        '.chat-response:last-child',
        '.message.bot:last-child',
        '.response:last-child'
      ];

      let response = '';
      for (const selector of responseSelectors) {
        try {
          const responseElement = await this.page.$(selector);
          if (responseElement) {
            response = await responseElement.evaluate(el => el.textContent);
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!response) {
        // Try to get any recent text that might be a response
        const allMessages = await this.page.$$('.chat-messages div, .chatbot div, .message');
        if (allMessages.length > 0) {
          const lastMessage = allMessages[allMessages.length - 1];
          response = await lastMessage.evaluate(el => el.textContent);
        }
      }

      console.log(chalk.gray(`    🤖 Response: "${response.substring(0, 100)}..."`));

      // Validate response
      const validation = this.validateResponse(response, expectedKeywords);
      
      return {
        status: validation.isValid ? 'PASS' : 'FAIL',
        response: response,
        validation: validation,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(chalk.red(`    ❌ Failed to send message: ${error.message}`));
      return {
        status: 'FAIL',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate chatbot response quality
   */
  validateResponse(response, expectedKeywords = []) {
    const validation = {
      isValid: true,
      issues: [],
      score: 0,
      details: {}
    };

    // Check if response exists
    if (!response || response.trim().length === 0) {
      validation.isValid = false;
      validation.issues.push('No response received');
      return validation;
    }

    // Check response length (should be substantial)
    if (response.length < 20) {
      validation.issues.push('Response too short');
      validation.score -= 10;
    } else {
      validation.score += 20;
    }

    // Check for expected keywords
    const lowerResponse = response.toLowerCase();
    let keywordMatches = 0;
    
    for (const keyword of expectedKeywords) {
      if (lowerResponse.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }

    if (expectedKeywords.length > 0) {
      const keywordScore = (keywordMatches / expectedKeywords.length) * 40;
      validation.score += keywordScore;
      validation.details.keywordMatches = `${keywordMatches}/${expectedKeywords.length}`;
      
      if (keywordMatches === 0) {
        validation.issues.push('No expected keywords found');
      }
    }

    // Check for error indicators
    const errorIndicators = ['error', 'sorry', 'unable', 'cannot', 'failed'];
    const hasErrors = errorIndicators.some(indicator => 
      lowerResponse.includes(indicator)
    );

    if (hasErrors) {
      validation.issues.push('Response contains error indicators');
      validation.score -= 20;
    } else {
      validation.score += 20;
    }

    // Check for helpful content
    const helpfulIndicators = ['wavelength', 'character', 'story', 'lore', 'season', 'episode'];
    const helpfulMatches = helpfulIndicators.filter(indicator =>
      lowerResponse.includes(indicator)
    ).length;

    validation.score += helpfulMatches * 5;
    validation.details.helpfulContent = helpfulMatches;

    // Final validation
    validation.isValid = validation.score >= 40 && validation.issues.length === 0;
    validation.details.finalScore = validation.score;

    return validation;
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    console.log(chalk.blue('\n📊 Generating Test Report...'));
    
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'SSO Chatbot Functionality',
      baseUrl: this.baseUrl,
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.status === 'PASS').length,
      failedTests: this.testResults.filter(r => r.status === 'FAIL').length,
      results: this.testResults
    };

    const reportPath = path.join(__dirname, `sso-chatbot-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Console report
    console.log(chalk.green.bold('\n✅ TEST REPORT SUMMARY'));
    console.log(chalk.yellow('═══════════════════════════════════'));
    console.log(chalk.blue(`📊 Total Tests: ${report.totalTests}`));
    console.log(chalk.green(`✅ Passed: ${report.passedTests}`));
    console.log(chalk.red(`❌ Failed: ${report.failedTests}`));
    console.log(chalk.yellow(`📈 Success Rate: ${Math.round((report.passedTests / report.totalTests) * 100)}%`));
    console.log(chalk.gray(`📄 Report saved: ${reportPath}`));

    // Detailed results
    console.log(chalk.blue('\n🔍 Detailed Results:'));
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? chalk.green('✅') : chalk.red('❌');
      console.log(`${status} ${result.test}: ${result.status}`);
      
      if (result.validation && result.validation.details) {
        console.log(chalk.gray(`   Score: ${result.validation.details.finalScore}/100`));
        if (result.validation.details.keywordMatches) {
          console.log(chalk.gray(`   Keywords: ${result.validation.details.keywordMatches}`));
        }
      }
      
      if (result.validation && result.validation.issues.length > 0) {
        console.log(chalk.yellow(`   Issues: ${result.validation.issues.join(', ')}`));
      }
    });

    return report;
  }

  /**
   * Run complete test suite
   */
  async runTests() {
    try {
      console.log(chalk.blue.bold('🚀 Starting SSO Chatbot Test Suite'));
      console.log(chalk.yellow('════════════════════════════════════'));
      
      await this.initialize();
      
      const authSuccess = await this.authenticateSSO();
      if (!authSuccess && this.headless) {
        throw new Error('Authentication failed in headless mode');
      }
      
      await this.testChatbotFunctionality();
      
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error(chalk.red.bold(`\n💥 Test Suite Failed: ${error.message}`));
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    headless: !args.includes('--visible'),
    baseUrl: args.includes('--url') ? args[args.indexOf('--url') + 1] : 'https://wavelengthlore.com',
    timeout: args.includes('--timeout') ? parseInt(args[args.indexOf('--timeout') + 1]) : 30000
  };

  console.log(chalk.blue('🔐 SSO Chatbot Test Configuration:'));
  console.log(chalk.gray(`   URL: ${options.baseUrl}`));
  console.log(chalk.gray(`   Mode: ${options.headless ? 'Headless' : 'Visible'}`));
  console.log(chalk.gray(`   Timeout: ${options.timeout}ms`));
  
  const tester = new SSOChatbotTester(options);
  
  try {
    const report = await tester.runTests();
    
    if (report.failedTests === 0) {
      console.log(chalk.green.bold('\n🎉 All tests passed! Chatbot is working correctly.'));
      process.exit(0);
    } else {
      console.log(chalk.yellow.bold(`\n⚠️  ${report.failedTests} test(s) failed. Check report for details.`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red.bold('\n💥 Test suite execution failed!'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SSOChatbotTester;