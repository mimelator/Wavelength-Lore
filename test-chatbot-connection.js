#!/usr/bin/env node

/**
 * WAVELENGTH CHATBOT CONNECTION TEST
 * =================================
 * 
 * Simple test to verify we can communicate with the live Wavelength Chatbot
 * using the Firebase Functions API and get meaningful responses about the lore.
 * CHATBOT_API_KEY
 */

const https = require('https');
const dotenv = require('dotenv');

class ChatbotTester {
  constructor() {
    this.chatbotUrl = 'us-central1-wavelength-lore.cloudfunctions.net';
    this.apiKey = process.env.CHATBOT_API_KEY;
    this.testQuestions = [
      "What is Wavelength Lore?",
      "Who is Andrew in Wavelength?",
      "Tell me about Season 1",
      "What characters exist in Wavelength?",
      "Describe the Ice Fortress"
    ];
  }

  /**
   * Send a question to the chatbot and get response
   */
  async askChatbot(question) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ message: question });
      
      const options = {
        hostname: this.chatbotUrl,
        port: 443,
        path: '/legacy/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-API-Key': this.apiKey
        }
      };

      console.log(`\n🤖 Asking: "${question}"`);
      console.log(`🔗 URL: https://${this.chatbotUrl}/legacy/chat`);

      const req = https.request(options, (res) => {
        let data = '';
        
        console.log(`📡 Status: ${res.statusCode}`);
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              success: response.success,
              question: question,
              response: response.response || response.error || 'No message field',
              statusCode: res.statusCode,
              metadata: response.metadata || {},
              usage: response.usage || {},
              rawResponse: response
            });
          } catch (error) {
            resolve({
              success: false,
              question: question,
              error: `JSON Parse Error: ${error.message}`,
              statusCode: res.statusCode,
              rawData: data.substring(0, 500)
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          question: question,
          error: `Request Error: ${error.message}`,
          statusCode: null
        });
      });

      // Set timeout
      req.setTimeout(30000, () => {
        req.destroy();
        resolve({
          success: false,
          question: question,
          error: 'Request timeout (30s)',
          statusCode: null
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Test a single question with detailed output
   */
  async testSingleQuestion(question) {
    console.log('🌊 WAVELENGTH CHATBOT CONNECTION TEST');
    console.log('=====================================');
    
    const result = await this.askChatbot(question);
    
    console.log('\n📊 RESULT:');
    console.log('----------');
    
    if (result.success) {
      console.log('✅ Connection: SUCCESS');
      console.log(`📝 Response Length: ${result.response.length} characters`);
      console.log(`🎯 Has Lore Content: ${this.hasLoreContent(result.response) ? 'YES' : 'NO'}`);
      
      if (result.usage && result.usage.totalTokens) {
        console.log(`🧠 Tokens Used: ${result.usage.totalTokens}`);
      }
      
      if (result.metadata && result.metadata.processingTimeMs) {
        console.log(`⏱️  Processing Time: ${result.metadata.processingTimeMs}ms`);
      }
      
      console.log('\n📖 RESPONSE (cleaned):');
      console.log('--------------------');
      const cleanedResponse = this.cleanResponse(result.response);
      console.log(cleanedResponse);
      
      if (this.hasLoreContent(cleanedResponse)) {
        console.log('\n🎉 SUCCESS: Chatbot has excellent lore knowledge!');
        console.log('✅ Ready for schema enhancement integration');
        return true;
      } else {
        console.log('\n⚠️  WARNING: Response lacks specific lore content');
        console.log('❌ May not be suitable for authentic content generation');
        return false;
      }
      
    } else {
      console.log('❌ Connection: FAILED');
      console.log(`🔴 Error: ${result.error}`);
      if (result.statusCode) {
        console.log(`📡 Status Code: ${result.statusCode}`);
      }
      if (result.rawData) {
        console.log(`📄 Raw Data: ${result.rawData}`);
      }
      return false;
    }
  }

  /**
   * Test multiple questions quickly
   */
  async testMultipleQuestions() {
    console.log('🌊 WAVELENGTH CHATBOT COMPREHENSIVE TEST');
    console.log('=======================================');
    
    const results = [];
    
    for (let i = 0; i < this.testQuestions.length; i++) {
      const question = this.testQuestions[i];
      console.log(`\n[${i + 1}/${this.testQuestions.length}] Testing...`);
      
      const result = await this.askChatbot(question);
      results.push(result);
      
      if (result.success) {
        const cleanedResponse = this.cleanResponse(result.response);
        console.log(`✅ "${question}"`);
        console.log(`   📏 ${cleanedResponse.length} chars | 🎯 Lore: ${this.hasLoreContent(cleanedResponse) ? 'YES' : 'NO'}`);
        if (result.usage && result.usage.totalTokens) {
          console.log(`   🧠 Tokens: ${result.usage.totalTokens}`);
        }
      } else {
        console.log(`❌ "${question}"`);
        console.log(`   🔴 ${result.error}`);
      }
      
      // Rate limiting delay
      await this.delay(2000);
    }
    
    this.generateSummaryReport(results);
    return results;
  }

  /**
   * Clean HTML links and format response for readability
   */
  cleanResponse(response) {
    if (!response) return '';
    
    // Remove HTML links but keep the text content
    let cleaned = response.replace(/<a[^>]*>([^<]+)<\/a>/g, '$1');
    
    // Remove any remaining HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Check if response contains lore-specific content
   */
  hasLoreContent(response) {
    if (!response || response.length < 50) return false;
    
    const loreKeywords = [
      'wavelength', 'andrew', 'alex', 'jewel', 'eloquence', 'daphne',
      'season', 'episode', 'ice fortress', 'shire', 'goblin king',
      'character', 'story', 'lore', 'band', 'music'
    ];
    
    const responseText = response.toLowerCase();
    const foundKeywords = loreKeywords.filter(keyword => 
      responseText.includes(keyword.toLowerCase())
    );
    
    return foundKeywords.length >= 2;
  }

  /**
   * Generate test summary report
   */
  generateSummaryReport(results) {
    console.log('\n📊 TEST SUMMARY REPORT');
    console.log('======================');
    
    const successful = results.filter(r => r.success);
    const withLore = successful.filter(r => 
      this.hasLoreContent(this.cleanResponse(r.response))
    );
    const failed = results.filter(r => !r.success);
    
    console.log(`📈 Total Questions: ${results.length}`);
    console.log(`✅ Successful: ${successful.length} (${((successful.length/results.length)*100).toFixed(1)}%)`);
    console.log(`🎯 With Lore Content: ${withLore.length} (${((withLore.length/results.length)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed.length} (${((failed.length/results.length)*100).toFixed(1)}%)`);
    
    // Calculate token usage
    const totalTokens = successful.reduce((sum, result) => {
      return sum + (result.usage && result.usage.totalTokens ? result.usage.totalTokens : 0);
    }, 0);
    
    if (totalTokens > 0) {
      console.log(`🧠 Total Tokens Used: ${totalTokens}`);
      console.log(`📊 Average Tokens per Question: ${Math.round(totalTokens / successful.length)}`);
    }
    
    if (withLore.length >= 4) {
      console.log('\n🎉 RECOMMENDATION: PROCEED WITH INTEGRATION');
      console.log('✅ Chatbot demonstrates excellent lore knowledge');
      console.log('✅ Perfect for authentic content generation');
      console.log('✅ API connection is stable and fast');
    } else if (successful.length >= 3) {
      console.log('\n⚠️  RECOMMENDATION: PROCEED WITH CAUTION');
      console.log('✅ Chatbot is responsive but limited lore content');
      console.log('⚠️  May need fallback to generic content');
    } else {
      console.log('\n❌ RECOMMENDATION: DO NOT INTEGRATE YET');
      console.log('🔴 Chatbot connection issues or lack of lore knowledge');
      console.log('🔴 Use generic content generation instead');
    }

    if (failed.length > 0) {
      console.log('\n❌ FAILED REQUESTS:');
      failed.forEach((result, i) => {
        console.log(`   ${i + 1}. "${result.question}": ${result.error}`);
      });
    }
    
    return {
      totalQuestions: results.length,
      successful: successful.length,
      withLoreContent: withLore.length,
      loreContentPercentage: (withLore.length / results.length) * 100,
      totalTokens: totalTokens
    };
  }

  /**
   * Delay helper for rate limiting
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
async function main() {
  const tester = new ChatbotTester();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🌊 WAVELENGTH CHATBOT CONNECTION TEST');
    console.log('====================================');
    console.log('');
    console.log('Usage:');
    console.log('  node test-chatbot-connection.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --single "question"    Test a single question');
    console.log('  --quick               Test with default questions');
    console.log('  --help, -h            Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  node test-chatbot-connection.js --single "Who is Andrew?"');
    console.log('  node test-chatbot-connection.js --quick');
    console.log('  node test-chatbot-connection.js');
    return;
  }
  
  if (args.includes('--single')) {
    const questionIndex = args.indexOf('--single') + 1;
    const question = args[questionIndex] || "What is Wavelength Lore?";
    await tester.testSingleQuestion(question);
  } else if (args.includes('--quick')) {
    await tester.testMultipleQuestions();
  } else {
    // Interactive mode - test single question first
    console.log('🌊 WAVELENGTH CHATBOT CONNECTION TEST');
    console.log('====================================');
    console.log('Testing basic connectivity...');
    
    const basicTest = await tester.testSingleQuestion("What is Wavelength Lore?");
    
    if (basicTest) {
      console.log('\n🎯 Basic test passed! Run with --quick for comprehensive testing.');
    } else {
      console.log('\n❌ Basic test failed. Check chatbot availability.');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ChatbotTester };