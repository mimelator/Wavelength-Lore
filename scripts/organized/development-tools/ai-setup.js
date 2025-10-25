#!/usr/bin/env node

/**
 * AI Configuration Setup and Test Script
 * Helps verify and test AI image generation setup
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class AISetupHelper {
  constructor() {
    this.envPath = path.join(__dirname, '../.env');
  }

  async checkEnvironment() {
    console.log('🔍 Checking AI Configuration...\n');

    try {
      const envContent = await fs.readFile(this.envPath, 'utf8');
      
      const config = {
        apiKey: this.extractEnvValue(envContent, 'AI_API_KEY'),
        endpoint: this.extractEnvValue(envContent, 'AI_API_ENDPOINT'),
        modelKey: this.extractEnvValue(envContent, 'AI_MODEL_KEY'),
        bananaKey: this.extractEnvValue(envContent, 'BANANA_API_KEY')
      };

      console.log('📋 Current Configuration:');
      console.log(`  AI_API_KEY: ${config.apiKey ? '✅ Set' : '❌ Not set'}`);
      console.log(`  AI_API_ENDPOINT: ${config.endpoint || 'Not set'}`);
      console.log(`  AI_MODEL_KEY: ${config.modelKey || 'Not set'}`);
      console.log(`  BANANA_API_KEY: ${config.bananaKey ? '✅ Set (alternative)' : 'Not set'}`);

      // Detect provider
      if (config.endpoint) {
        if (config.endpoint.includes('api.openai.com')) {
          console.log('🔧 Provider: OpenAI DALL-E (Recommended)');
        } else if (config.endpoint.includes('api.stability.ai')) {
          console.log('🔧 Provider: Stability AI');
        } else if (config.endpoint.includes('api.replicate.com')) {
          console.log('🔧 Provider: Replicate');
        } else if (config.endpoint.includes('generativelanguage.googleapis.com')) {
          console.log('🔧 Provider: Google AI Studio (Text only - no image generation)');
        } else if (config.endpoint.includes('banana.dev')) {
          console.log('🔧 Provider: Banana.dev (Third-party)');
        } else {
          console.log('⚠️  Provider: Unknown');
        }
      }

      return config;

    } catch (error) {
      console.error('❌ Error reading .env file:', error.message);
      return null;
    }
  }

  extractEnvValue(content, key) {
    const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].replace(/['"]/g, '') : null;
  }

  async testGoogleAIStudio(apiKey) {
    console.log('\n🧪 Testing Google AI Studio connection...');
    
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage';
    
    try {
      const response = await axios.post(`${endpoint}?key=${apiKey}`, {
        prompt: {
          text: "A simple test image: blue sky with white clouds"
        },
        generationConfig: {
          width: 256,
          height: 256,
          aspectRatio: 'SQUARE'
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data.candidates && response.data.candidates[0]) {
        console.log('✅ Google AI Studio: Connection successful!');
        console.log('🎨 Test image generated successfully');
        return true;
      } else {
        console.log('⚠️  Google AI Studio: Unexpected response format');
        return false;
      }

    } catch (error) {
      console.error('❌ Google AI Studio test failed:');
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
      return false;
    }
  }

  async testBananaAPI(apiKey) {
    console.log('\n🧪 Testing Banana.dev connection...');
    
    try {
      const response = await axios.post('https://api.banana.dev/start/v4/', {
        modelKey: 'google/imagen',
        modelInputs: {
          prompt: "A simple test image: blue sky with white clouds",
          width: 256,
          height: 256,
          num_inference_steps: 20
        }
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data.modelOutputs && response.data.modelOutputs.image_base64) {
        console.log('✅ Banana.dev: Connection successful!');
        console.log('🎨 Test image generated successfully');
        return true;
      } else {
        console.log('⚠️  Banana.dev: Unexpected response format');
        return false;
      }

    } catch (error) {
      console.error('❌ Banana.dev test failed:');
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
      return false;
    }
  }

  showGoogleAIStudioSetup() {
    console.log(`
🔧 Google AI Studio Setup (Recommended):

1. Visit Google AI Studio:
   https://aistudio.google.com/

2. Sign in with your Google account

3. Get API Key:
   • Click "Get API key" in the left sidebar
   • Click "Create API key in new project" (or use existing)
   • Copy the generated API key

4. Update your .env file:
   AI_API_KEY=your_google_ai_studio_api_key_here
   AI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage
   AI_MODEL_KEY=imagen-3.0-generate-001

5. Test the setup:
   node ai-setup.js test

💡 Google AI Studio provides:
   ✅ Direct access to Google's models
   ✅ Generous free tier
   ✅ Fastest response times
   ✅ Latest model versions
`);
  }

  showBananaSetup() {
    console.log(`
🍌 Banana.dev Setup (Alternative):

1. Visit Banana.dev:
   https://banana.dev/

2. Sign up for an account

3. Get API Key:
   • Go to your dashboard
   • Copy your API key

4. Update your .env file:
   AI_API_KEY=your_banana_api_key_here
   AI_API_ENDPOINT=https://api.banana.dev/start/v4/
   AI_MODEL_KEY=google/imagen

5. Test the setup:
   node ai-setup.js test

💡 Banana.dev provides:
   ✅ Easy-to-use API
   ✅ Multiple model providers
   ✅ Good documentation
   ⚠️  Third-party service (additional cost)
`);
  }

  showTroubleshooting() {
    console.log(`
🔧 Troubleshooting:

Common Issues:

1. "API key not configured":
   • Make sure AI_API_KEY is set in .env
   • Remove quotes around the key value
   • Restart your terminal/application

2. "Authentication failed":
   • Verify your API key is correct
   • Check if the key has proper permissions
   • Make sure billing is enabled (if required)

3. "Model not found":
   • Verify AI_MODEL_KEY matches your provider
   • Google AI Studio: imagen-3.0-generate-001
   • Banana.dev: google/imagen

4. "Request timeout":
   • AI generation can take 30-60 seconds
   • Check your internet connection
   • Try with smaller image dimensions

5. "Rate limit exceeded":
   • Wait a few minutes and try again
   • Check your API usage limits
   • Consider upgrading your plan

Need Help?
• Google AI Studio: https://ai.google.dev/docs
• Banana.dev: https://docs.banana.dev/
• Project issues: Check the AI_IMAGE_GENERATION_README.md
`);
  }

  async runFullTest() {
    const config = await this.checkEnvironment();
    
    if (!config) {
      console.log('\n❌ Could not read configuration');
      return false;
    }

    let success = false;

    if (config.apiKey) {
      if (config.endpoint && config.endpoint.includes('generativelanguage.googleapis.com')) {
        success = await this.testGoogleAIStudio(config.apiKey);
      } else if (config.endpoint && config.endpoint.includes('banana.dev')) {
        success = await this.testBananaAPI(config.apiKey);
      } else if (config.bananaKey) {
        success = await this.testBananaAPI(config.bananaKey);
      } else {
        // Default to Google AI Studio if no endpoint specified
        success = await this.testGoogleAIStudio(config.apiKey);
      }
    } else {
      console.log('\n❌ No API key configured');
    }

    if (success) {
      console.log('\n🎉 Setup Complete! You can now use AI image generation:');
      console.log('   ./scripts/ai-image-generator.js generate "test prompt"');
    } else {
      console.log('\n❌ Setup incomplete. See troubleshooting above.');
    }

    return success;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const helper = new AISetupHelper();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎨 AI Configuration Setup Helper

Usage: node ai-setup.js [command]

Commands:
  check                Check current configuration
  test                 Test API connection
  google-setup         Show Google AI Studio setup instructions
  banana-setup         Show Banana.dev setup instructions
  troubleshoot         Show troubleshooting guide
  (no command)         Run full check and test

Examples:
  node ai-setup.js                # Full check and test
  node ai-setup.js check         # Check config only
  node ai-setup.js google-setup  # Setup instructions
`);
    process.exit(0);
  }

  switch (command) {
    case 'check':
      await helper.checkEnvironment();
      break;
    case 'test':
      await helper.runFullTest();
      break;
    case 'google-setup':
      helper.showGoogleAIStudioSetup();
      break;
    case 'banana-setup':
      helper.showBananaSetup();
      break;
    case 'troubleshoot':
      helper.showTroubleshooting();
      break;
    default:
      await helper.runFullTest();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AISetupHelper;