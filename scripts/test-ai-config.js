#!/usr/bin/env node

/**
 * AI Configuration Test Script
 * Validates environment variables and tests AI provider connection
 */

// Try to load dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, continue without it
}

const chalk = require('chalk');
const path = require('path');

// Add the parent directory to the path so we can require the generator
const aiGeneratorPath = path.join(__dirname, '../recovered-content-creator-code/ai-image-generator.js');

console.log(chalk.cyan.bold('\n🔍 AI Image Generation Configuration Test\n'));
console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

// Test 1: Check Environment Variables
console.log(chalk.yellow('1️⃣  Checking Environment Variables...\n'));

const requiredVars = {
  'AI_API_KEY': process.env.AI_API_KEY,
  'AI_API_ENDPOINT': process.env.AI_API_ENDPOINT,
  'AI_PROVIDER': process.env.AI_PROVIDER,
  'AI_MODEL_KEY': process.env.AI_MODEL_KEY
};

let hasRequired = false;
let missingVars = [];

// Check AI_API_KEY (required)
if (!requiredVars['AI_API_KEY']) {
  console.log(chalk.red('  ❌ AI_API_KEY: NOT SET (required)'));
  missingVars.push('AI_API_KEY');
} else {
  const keyLength = requiredVars['AI_API_KEY'].length;
  const maskedKey = requiredVars['AI_API_KEY'].substring(0, 8) + '...' + requiredVars['AI_API_KEY'].substring(keyLength - 4);
  console.log(chalk.green(`  ✅ AI_API_KEY: Set (${maskedKey})`));
  hasRequired = true;
}

// Check AI_API_ENDPOINT (optional but helpful)
if (!requiredVars['AI_API_ENDPOINT']) {
  console.log(chalk.yellow('  ⚠️  AI_API_ENDPOINT: Not set (will use defaults based on provider)'));
} else {
  console.log(chalk.green(`  ✅ AI_API_ENDPOINT: ${requiredVars['AI_API_ENDPOINT']}`));
}

// Check AI_PROVIDER (optional)
if (!requiredVars['AI_PROVIDER']) {
  console.log(chalk.yellow('  ⚠️  AI_PROVIDER: Not set (defaults to openai-dalle)'));
} else {
  console.log(chalk.green(`  ✅ AI_PROVIDER: ${requiredVars['AI_PROVIDER']}`));
}

// Check AI_MODEL_KEY (optional)
if (!requiredVars['AI_MODEL_KEY']) {
  console.log(chalk.yellow('  ⚠️  AI_MODEL_KEY: Not set (defaults to dall-e-3)'));
} else {
  console.log(chalk.green(`  ✅ AI_MODEL_KEY: ${requiredVars['AI_MODEL_KEY']}`));
}

if (!hasRequired) {
  console.log(chalk.red('\n❌ Missing required environment variable: AI_API_KEY'));
  console.log(chalk.yellow('\n💡 Please set AI_API_KEY in your .env file'));
  console.log(chalk.gray('   Example: AI_API_KEY=sk-...'));
  process.exit(1);
}

// Test 2: Load and Initialize Generator
console.log(chalk.yellow('\n2️⃣  Initializing AI Image Generator...\n'));

let AIImageGenerator;
try {
  // Clear require cache to ensure fresh load
  delete require.cache[require.resolve(aiGeneratorPath)];
  AIImageGenerator = require(aiGeneratorPath);
  console.log(chalk.green('  ✅ Successfully loaded ai-image-generator.js'));
} catch (error) {
  console.log(chalk.red(`  ❌ Failed to load ai-image-generator.js: ${error.message}`));
  console.log(chalk.gray(`     Path: ${aiGeneratorPath}`));
  process.exit(1);
}

let generator;
try {
  generator = new AIImageGenerator();
  console.log(chalk.green('  ✅ Generator initialized successfully'));
  
  // Show detected provider
  const detectedProvider = generator.isOpenAI ? 'OpenAI DALL-E' :
                          generator.isStabilityAI ? 'Stability AI' :
                          generator.isReplicate ? 'Replicate' :
                          generator.isBananaAPI ? 'Banana.dev' :
                          generator.isGoogleAI ? 'Google AI Studio' :
                          'Unknown';
  
  console.log(chalk.cyan(`  📋 Detected Provider: ${detectedProvider}`));
  
  if (generator.apiEndpoint) {
    console.log(chalk.cyan(`  📋 API Endpoint: ${generator.apiEndpoint}`));
  }
  
  if (generator.modelKey) {
    console.log(chalk.cyan(`  📋 Model: ${generator.modelKey}`));
  }
  
} catch (error) {
  console.log(chalk.red(`  ❌ Failed to initialize generator: ${error.message}`));
  process.exit(1);
}

// Test 3: Test API Connection (Optional - only if user wants to)
console.log(chalk.yellow('\n3️⃣  Testing API Connection...\n'));

const args = process.argv.slice(2);
const skipTest = args.includes('--skip-test') || args.includes('--no-test');

if (skipTest) {
  console.log(chalk.gray('  ⏭️  Skipping API connection test (--skip-test flag)'));
} else {
  console.log(chalk.gray('  🔄 Attempting a test generation...'));
  console.log(chalk.gray('     (This will use your API credits, use --skip-test to skip)\n'));
  
  // Small test prompt (DALL-E 3 requires specific sizes: 1024x1024, 1024x1792, or 1792x1024)
  const testPrompt = 'A simple red circle on a white background';
  
  generator.generateImage(testPrompt, {
    width: 1024,
    height: 1024  // DALL-E 3 minimum size
  }).then(result => {
    if (result.success) {
      console.log(chalk.green('  ✅ API Connection Test: SUCCESS'));
      console.log(chalk.green(`     Generated image successfully (${result.metadata?.provider || 'unknown provider'})`));
      
      if (result.metadata) {
        console.log(chalk.gray(`     Provider: ${result.metadata.provider}`));
        console.log(chalk.gray(`     Model: ${result.metadata.model || 'N/A'}`));
      }
    } else {
      console.log(chalk.red('  ❌ API Connection Test: FAILED'));
      console.log(chalk.red(`     Error: ${result.error}`));
      if (result.details) {
        console.log(chalk.gray(`     Details: ${JSON.stringify(result.details, null, 2)}`));
      }
      process.exit(1);
    }
    
    // Summary
    console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green.bold('✅ Configuration Test Complete!'));
    console.log(chalk.green('   Your AI image generation is properly configured.\n'));
    
  }).catch(error => {
    console.log(chalk.red('  ❌ API Connection Test: FAILED'));
    console.log(chalk.red(`     Error: ${error.message}`));
    
    if (error.response) {
      console.log(chalk.gray(`     Status: ${error.response.status}`));
      if (error.response.data) {
        console.log(chalk.gray(`     Response: ${JSON.stringify(error.response.data, null, 2)}`));
      }
    }
    
    console.log(chalk.yellow('\n💡 Common Issues:'));
    console.log(chalk.gray('   - Invalid API key'));
    console.log(chalk.gray('   - Incorrect API endpoint'));
    console.log(chalk.gray('   - Network connectivity issues'));
    console.log(chalk.gray('   - Provider API quota exceeded'));
    
    process.exit(1);
  });
  
  // Return early since we're doing async test
  return;
}

// Summary if skipped
console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.green.bold('✅ Configuration Check Complete!'));
console.log(chalk.yellow('   Run without --skip-test to verify API connection.\n'));

