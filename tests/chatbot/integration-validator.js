#!/usr/bin/env node

/**
 * 🔗 Chatbot Integration Validator
 * Tests both localhost and production chatbot integrations
 */

const chalk = require('chalk');
const fetch = require('node-fetch');

class ChatbotIntegrationValidator {
  constructor() {
    this.results = [];
  }

  async validateIntegrations() {
    console.log(chalk.blue('🔗 Chatbot Integration Validation'));
    console.log(chalk.yellow('════════════════════════════════════'));
    
    // Test 1: Localhost Server Health
    await this.testLocalhostHealth();
    
    // Test 2: Firebase Functions Health
    await this.testFirebaseHealth();
    
    // Test 3: Widget Integration Points
    await this.testWidgetIntegration();
    
    this.generateSummary();
  }

  async testLocalhostHealth() {
    console.log(chalk.blue('\n🏠 Testing Localhost Server...'));
    
    try {
      const response = await fetch('http://localhost:3001/health', {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(chalk.green('✅ Localhost server healthy'));
        console.log(chalk.gray(`   Uptime: ${Math.round(data.uptime)}s`));
        
        // Test chatbot widget endpoint
        const widgetResponse = await fetch('http://localhost:3001/chatbot/widget');
        if (widgetResponse.ok) {
          console.log(chalk.green('✅ Localhost chatbot widget accessible'));
          this.results.push({ test: 'Localhost Integration', status: 'PASS' });
        } else {
          console.log(chalk.yellow('⚠️ Localhost chatbot widget not accessible'));
          this.results.push({ test: 'Localhost Integration', status: 'PARTIAL' });
        }
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      console.log(chalk.red('❌ Localhost server not accessible'));
      console.log(chalk.gray(`   Error: ${error.message}`));
      this.results.push({ test: 'Localhost Integration', status: 'FAIL', error: error.message });
    }
  }

  async testFirebaseHealth() {
    console.log(chalk.blue('\n🔥 Testing Firebase Functions...'));
    
    try {
      const response = await fetch('https://us-central1-wavelength-lore.cloudfunctions.net/health', {
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(chalk.green('✅ Firebase Functions healthy'));
        console.log(chalk.gray(`   Service: ${data.service}`));
        console.log(chalk.gray(`   SSO Enabled: ${data.security?.ssoEnabled}`));
        console.log(chalk.gray(`   Active Sessions: ${data.sessions?.active || 0}`));
        
        this.results.push({ 
          test: 'Firebase Functions', 
          status: 'PASS',
          details: data
        });
      } else {
        throw new Error(`Firebase returned ${response.status}`);
      }
    } catch (error) {
      console.log(chalk.red('❌ Firebase Functions not accessible'));
      console.log(chalk.gray(`   Error: ${error.message}`));
      this.results.push({ test: 'Firebase Functions', status: 'FAIL', error: error.message });
    }
  }

  async testWidgetIntegration() {
    console.log(chalk.blue('\n🖥️ Testing Widget Integration...'));
    
    try {
      // Test production widget
      const prodResponse = await fetch('https://wavelengthlore.com/chatbot/widget');
      
      if (prodResponse.ok) {
        console.log(chalk.green('✅ Production widget page accessible'));
        
        // Test if it contains SSO widget code
        const content = await prodResponse.text();
        const hasSSO = content.includes('sso-chat-widget') || 
                      content.includes('SSOChatWidget') ||
                      content.includes('wavelength-chatbot');
        
        if (hasSSO) {
          console.log(chalk.green('✅ SSO chatbot integration detected'));
          this.results.push({ test: 'Widget Integration', status: 'PASS' });
        } else {
          console.log(chalk.yellow('⚠️ SSO chatbot integration not clearly detected'));
          this.results.push({ test: 'Widget Integration', status: 'PARTIAL' });
        }
      } else {
        throw new Error(`Widget page returned ${prodResponse.status}`);
      }
    } catch (error) {
      console.log(chalk.red('❌ Widget integration test failed'));
      console.log(chalk.gray(`   Error: ${error.message}`));
      this.results.push({ test: 'Widget Integration', status: 'FAIL', error: error.message });
    }
  }

  generateSummary() {
    console.log(chalk.blue('\n📊 Integration Validation Summary'));
    console.log(chalk.yellow('═══════════════════════════════════'));
    
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const partial = this.results.filter(r => r.status === 'PARTIAL').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(chalk.gray(`📊 Total Tests: ${total}`));
    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.yellow(`⚠️ Partial: ${partial}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    
    const successRate = Math.round(((passed + partial * 0.5) / total) * 100);
    console.log(chalk.blue(`📈 Overall Health: ${successRate}%`));
    
    console.log(chalk.blue('\n🎯 Architecture Summary:'));
    console.log(chalk.gray('  • Localhost: Development server with widget integration'));
    console.log(chalk.gray('  • Firebase: Production chatbot backend with SSO authentication'));
    console.log(chalk.gray('  • Integration: Widget embeds Firebase chatbot with VIP+ requirements'));
    
    if (passed === total) {
      console.log(chalk.green.bold('\n🎉 All integrations are healthy! Chatbot architecture is operational.'));
    } else if (failed === 0) {
      console.log(chalk.yellow.bold('\n⚠️ Integrations mostly healthy with minor issues.'));
    } else {
      console.log(chalk.red.bold('\n❌ Some integrations have issues that need attention.'));
    }
  }
}

// CLI execution
async function main() {
  const validator = new ChatbotIntegrationValidator();
  await validator.validateIntegrations();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ChatbotIntegrationValidator };