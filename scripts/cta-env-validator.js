#!/usr/bin/env node

/**
 * CTA Environment Validator
 * Thoroughly validates .env configuration and API key setup
 * Checks for common issues and misconfigurations
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ENV_FILE = path.join(__dirname, '../.env');

class EnvValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.success = true;
  }

  /**
   * Check if .env file exists
   */
  checkEnvFileExists() {
    console.log('\n📋 Checking .env file...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!fs.existsSync(ENV_FILE)) {
      this.issues.push('❌ .env file not found');
      this.success = false;
      return false;
    }

    console.log(`✅ .env file exists: ${ENV_FILE}`);
    const stats = fs.statSync(ENV_FILE);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Modified: ${stats.mtime.toISOString()}\n`);
    return true;
  }

  /**
   * Read raw .env content
   */
  readRawEnv() {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const lines = content.split('\n');

    console.log('📄 Raw .env content (CHATBOT_* variables):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let foundChatbot = false;
    lines.forEach((line, index) => {
      if (line.includes('CHATBOT')) {
        foundChatbot = true;
        // Hide most of the key
        const masked = line.replace(/(CHATBOT_API_KEY=)(.+)/i, (match, key, val) => {
          if (val.length > 20) {
            return `${key}${val.substring(0, 10)}...${val.substring(val.length - 4)}`;
          }
          return match;
        });
        console.log(`  Line ${index + 1}: ${masked}`);
      }
    });

    if (!foundChatbot) {
      this.warnings.push('⚠️  No CHATBOT_* variables found in raw .env file');
    }

    console.log();
    return content;
  }

  /**
   * Check environment variables loaded by dotenv
   */
  checkLoadedEnv() {
    console.log('🔑 Loaded Environment Variables:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiKey = process.env.CHATBOT_API_KEY;
    const apiUrl = process.env.CHATBOT_URL;

    if (!apiKey) {
      this.issues.push('❌ CHATBOT_API_KEY not loaded into process.env');
      this.success = false;
      console.log('❌ CHATBOT_API_KEY: NOT FOUND');
    } else {
      console.log(`✅ CHATBOT_API_KEY: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
      console.log(`   Length: ${apiKey.length} characters`);
      console.log(`   Type: ${typeof apiKey}`);

      // Check for common issues
      if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
        this.warnings.push('⚠️  API key has quotes - will need to be stripped');
        console.log(`   ⚠️  Starts with quote (may need stripping)`);
      }
    }

    if (apiUrl) {
      console.log(`✅ CHATBOT_URL: ${apiUrl}`);
    } else {
      console.log(`ℹ️  CHATBOT_URL: Using default (us-central1-wavelength-lore.cloudfunctions.net)`);
    }

    console.log();
  }

  /**
   * Test API key format
   */
  checkApiKeyFormat() {
    console.log('🔍 API Key Format Validation:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiKey = process.env.CHATBOT_API_KEY;

    if (!apiKey) {
      console.log('❌ No API key to validate\n');
      return false;
    }

    // Remove quotes if present
    const cleanKey = apiKey.replace(/^"(.*)"$/, '$1').trim();

    // Check length
    if (cleanKey.length < 10) {
      this.issues.push(`❌ API key is too short (${cleanKey.length} chars, expected 40+)`);
      this.success = false;
    } else if (cleanKey.length < 30) {
      this.warnings.push(`⚠️  API key seems short (${cleanKey.length} chars, expected 40+)`);
    } else {
      console.log(`✅ Key length: ${cleanKey.length} characters`);
    }

    // Check characters
    const hexMatch = cleanKey.match(/^[a-f0-9]+$/i);
    if (hexMatch) {
      console.log(`✅ Key format: Hexadecimal (valid)`);
    } else if (cleanKey.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      console.log(`✅ Key format: Alphanumeric (valid)`);
    } else {
      this.warnings.push(`⚠️  Key contains unusual characters`);
      console.log(`⚠️  Key format: Contains special characters`);
    }

    // Check for spaces
    if (cleanKey.includes(' ')) {
      this.issues.push('❌ API key contains spaces - this is invalid');
      this.success = false;
      console.log('❌ Contains spaces (INVALID)');
    } else {
      console.log('✅ No spaces');
    }

    console.log();
    return true;
  }

  /**
   * Verify key is being sent correctly to API
   */
  async testKeyTransmission() {
    console.log('📤 API Key Transmission Test:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiKey = process.env.CHATBOT_API_KEY;
    if (!apiKey) {
      console.log('⚠️  Cannot test transmission without API key\n');
      return;
    }

    const cleanKey = apiKey.replace(/^"(.*)"$/, '$1').trim();
    const authHeader = `Bearer ${cleanKey}`;

    console.log(`Key being sent: ${cleanKey.substring(0, 10)}...${cleanKey.substring(cleanKey.length - 4)}`);
    console.log(`Auth Header: Bearer ${cleanKey.substring(0, 10)}...${cleanKey.substring(cleanKey.length - 4)}`);
    console.log(`Header format: "Authorization: ${authHeader.substring(0, 20)}..."`);
    console.log();
  }

  /**
   * Check for common .env issues
   */
  checkCommonIssues() {
    console.log('⚠️  Common Issues Check:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const content = fs.readFileSync(ENV_FILE, 'utf8');

    // Check for BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      this.warnings.push('⚠️  .env file has BOM (Byte Order Mark)');
      console.log('⚠️  BOM detected - may cause issues');
    } else {
      console.log('✅ No BOM');
    }

    // Check for CRLF vs LF
    if (content.includes('\r\n')) {
      console.log('ℹ️  File uses CRLF line endings (Windows)');
    } else {
      console.log('✅ File uses LF line endings (Unix)');
    }

    // Check file permissions
    try {
      const stats = fs.statSync(ENV_FILE);
      console.log(`✅ File is readable`);
    } catch (error) {
      this.issues.push('❌ .env file is not readable');
      this.success = false;
    }

    console.log();
  }

  /**
   * Display summary
   */
  displaySummary() {
    console.log('📊 Validation Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('✅ All checks passed!\n');
      console.log('Your .env configuration looks good.');
      console.log('If API returns 401, it\'s due to the API key itself,');
      console.log('not the .env configuration.\n');
      return true;
    }

    if (this.issues.length > 0) {
      console.log('❌ ISSUES FOUND:\n');
      this.issues.forEach(issue => console.log(`  ${issue}`));
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
      console.log();
    }

    return this.success;
  }

  /**
   * Run all validations
   */
  async runAll() {
    this.checkEnvFileExists();
    this.readRawEnv();
    this.checkLoadedEnv();
    this.checkApiKeyFormat();
    await this.testKeyTransmission();
    this.checkCommonIssues();
    return this.displaySummary();
  }
}

/**
 * Main
 */
async function main() {
  const validator = new EnvValidator();
  const allGood = await validator.runAll();

  if (!allGood) {
    console.log('💡 To fix issues:');
    console.log('  npm run cta:setup -- --interactive\n');
  }

  process.exit(allGood ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { EnvValidator };
