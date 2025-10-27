#!/usr/bin/env node

/**
 * WAVELENGTH SCHEMA ENHANCER TEST (SAFE VERSION)
 * ==============================================
 * 
 * Based on the pattern from chat-lore-bulk-query.js
 * Tests authentic content generation safely before full integration
 */

const { WavelengthChatCLI } = require('./wavelength-chat-cli.js');
const fs = require('fs').promises;
const path = require('path');

class WavelengthSchemaEnhancerTest {
  constructor() {
    this.chatCLI = new WavelengthChatCLI();
    this.rateLimitDelay = 1500; // Same as your bulk query script
  }

  /**
   * Test authentic content generation for a small set of items
   */
  async testAuthenticContentGeneration() {
    console.log('🌊 WAVELENGTH SCHEMA ENHANCER TEST');
    console.log('=================================');
    console.log('🧪 Testing authentic content generation with rate limiting...\n');

    // Test with a small set of sample data
    const testData = [
      {
        type: 'character',
        name: 'Andrew',
        prompt: 'Generate a compelling tagline (5-8 words max) for Andrew from Wavelength Lore. Make it mysterious and character-specific. Return only the tagline, no explanation.'
      },
      {
        type: 'character',
        name: 'Jewel', 
        prompt: 'What are the key stakes or challenges facing Jewel in Wavelength Lore? Write 1-2 sentences describing what\'s at risk for this character.'
      },
      {
        type: 'episode',
        name: 'My Lucky Charm',
        prompt: 'What cliffhanger or dramatic moment in "My Lucky Charm" from Wavelength would leave viewers wanting more? Write 1-2 compelling sentences.'
      }
    ];

    const results = [];

    for (let i = 0; i < testData.length; i++) {
      const item = testData[i];
      
      console.log(`\n--- [${i + 1}/${testData.length}] Processing: ${item.type} - ${item.name} ---`);
      console.log(`   📝 Prompt: "${item.prompt.substring(0, 80)}..."`);
      
      // Core Chatbot Call (following your pattern)
      const result = await this.chatCLI.askChatbot(item.prompt);
      
      const testResult = {
        type: item.type,
        name: item.name,
        prompt_sent: item.prompt,
        chatbot_response: result.success ? result.response : `ERROR: ${result.error}`,
        success: result.success,
        metadata: result.metadata || {},
        usage: result.usage || {}
      };

      results.push(testResult);
      
      // Display result feedback
      if (result.success) {
        console.log(`   ✅ Success. Tokens: ${result.usage.totalTokens || 'N/A'}`);
        console.log(`   🤖 Response: ${result.response.substring(0, 100)}...`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
      
      // Rate limiting delay (following your pattern)
      if (i < testData.length - 1) {
        console.log(`   ⏳ Waiting ${this.rateLimitDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      }
    }

    return results;
  }

  /**
   * Save test results to file
   */
  async saveResults(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(__dirname, `schema-enhancer-test-${timestamp}.json`);
    
    console.log(`\n💾 Saving ${results.length} test results to ${outputPath}...`);
    
    try {
      await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
      console.log(`🎉 Test results saved: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`❌ Error saving results: ${error.message}`);
      return null;
    }
  }

  /**
   * Analyze results and provide recommendations
   */
  analyzeResults(results) {
    console.log('\n📊 TEST ANALYSIS');
    console.log('================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalTokens = successful.reduce((sum, r) => sum + (r.usage.totalTokens || 0), 0);
    
    console.log(`📈 Total Tests: ${results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`🧠 Total Tokens: ${totalTokens}`);
    console.log(`📊 Average Tokens: ${successful.length > 0 ? Math.round(totalTokens / successful.length) : 0}`);
    
    console.log('\n🎯 SAMPLE RESPONSES:');
    console.log('-------------------');
    successful.slice(0, 3).forEach((result, i) => {
      console.log(`${i + 1}. ${result.type.toUpperCase()} - ${result.name}:`);
      console.log(`   "${result.chatbot_response.substring(0, 120)}..."`);
    });
    
    if (successful.length >= 2) {
      console.log('\n🎉 RECOMMENDATION: Proceed with caution');
      console.log('✅ Chatbot is generating authentic content');
      console.log('✅ Rate limiting is working properly');
      console.log('💡 Ready for larger-scale testing');
    } else {
      console.log('\n⚠️  RECOMMENDATION: Investigation needed');
      console.log('❌ Too many failures or connection issues');
      console.log('🔍 Check chatbot availability and API keys');
    }
  }

  /**
   * Main test execution
   */
  async runTest() {
    try {
      console.log('🔍 Testing chatbot connection first...');
      
      // Quick connection test
      const connectionTest = await this.chatCLI.askChatbot('Hello, are you working?');
      
      if (!connectionTest.success) {
        console.error(`❌ Connection test failed: ${connectionTest.error}`);
        console.log('🚫 Cannot proceed with authentic content testing');
        return;
      }
      
      console.log('✅ Connection test passed!\n');
      
      // Run authentic content tests
      const results = await this.testAuthenticContentGeneration();
      
      // Save and analyze results
      await this.saveResults(results);
      this.analyzeResults(results);
      
    } catch (error) {
      console.error(`💥 Test failed with error: ${error.message}`);
    }
  }
}

// CLI execution
async function main() {
  const tester = new WavelengthSchemaEnhancerTest();
  await tester.runTest();
}

if (require.main === module) {
  main().catch(console.error);
}