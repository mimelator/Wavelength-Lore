#!/usr/bin/env node

/**
 * CTA Setup & Validation Script
 * Ensures CHATBOT_API_KEY is properly configured before running validations
 * Usage: node scripts/cta-setup.js [--add-key <key>] [--check] [--help]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '../.env');
const ENV_EXAMPLE = path.join(__dirname, '../.env.example');

/**
 * Setup Manager Class
 */
class CTASetupManager {
  constructor() {
    this.envPath = ENV_FILE;
    this.envContent = {};
  }

  /**
   * Load existing .env file
   */
  loadEnv() {
    if (fs.existsSync(this.envPath)) {
      const content = fs.readFileSync(this.envPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach(line => {
        // Skip comments and empty lines
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key) {
            this.envContent[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    }
  }

  /**
   * Check if API key is set and valid
   */
  checkApiKey() {
    const key = this.envContent.CHATBOT_API_KEY;

    if (!key) {
      return {
        valid: false,
        status: 'missing',
        message: '❌ CHATBOT_API_KEY not found in .env'
      };
    }

    if (key.length < 10) {
      return {
        valid: false,
        status: 'invalid',
        message: '⚠️  CHATBOT_API_KEY appears too short (< 10 chars)'
      };
    }

    return {
      valid: true,
      status: 'configured',
      message: `✅ CHATBOT_API_KEY is configured (${key.length} chars, ...${key.slice(-4)})`
    };
  }

  /**
   * Display current configuration
   */
  displayStatus() {
    console.log('\n📋 Current Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const keyCheck = this.checkApiKey();
    console.log(keyCheck.message);

    if (this.envContent.CHATBOT_URL) {
      console.log(`✅ CHATBOT_URL: ${this.envContent.CHATBOT_URL}`);
    } else {
      console.log('ℹ️  CHATBOT_URL: Using default (us-central1-wavelength-lore.cloudfunctions.net)');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return keyCheck.valid;
  }

  /**
   * Set API key in .env file
   */
  setApiKey(key) {
    this.loadEnv();
    this.envContent.CHATBOT_API_KEY = key;

    const lines = [];
    const existingKeys = new Set();

    // Read existing file and update CHATBOT_API_KEY if present
    if (fs.existsSync(this.envPath)) {
      const content = fs.readFileSync(this.envPath, 'utf8');
      content.split('\n').forEach(line => {
        if (line.startsWith('CHATBOT_API_KEY=')) {
          lines.push(`CHATBOT_API_KEY=${key}`);
          existingKeys.add('CHATBOT_API_KEY');
        } else if (line.trim()) {
          lines.push(line);
          const [k] = line.split('=');
          existingKeys.add(k.trim());
        } else {
          lines.push(line);
        }
      });
    }

    // Add CHATBOT_API_KEY if it wasn't in the file
    if (!existingKeys.has('CHATBOT_API_KEY')) {
      lines.push(`CHATBOT_API_KEY=${key}`);
    }

    fs.writeFileSync(this.envPath, lines.join('\n'));
    console.log(`✅ CHATBOT_API_KEY saved to ${this.envPath}`);
  }

  /**
   * Interactive setup wizard
   */
  async interactiveSetup() {
    console.log('\n🎵 CTA Audit Setup Wizard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter your CHATBOT_API_KEY: ', (key) => {
        rl.close();

        if (!key || key.trim().length === 0) {
          console.log('\n❌ API key cannot be empty');
          resolve(false);
          return;
        }

        this.setApiKey(key.trim());
        this.loadEnv();
        const check = this.checkApiKey();
        console.log(`\n${check.message}\n`);
        resolve(true);
      });
    });
  }

  /**
   * Create .env.example file
   */
  createExampleEnv() {
    const example = `# Wavelength Lore Configuration

# Chatbot API Configuration
# Get your API key from Firebase Cloud Functions
# This is required for CTA validation to work
CHATBOT_API_KEY=your_api_key_here

# Optional: Custom chatbot URL
# Default: us-central1-wavelength-lore.cloudfunctions.net
# CHATBOT_URL=custom-url.cloudfunctions.net
`;

    fs.writeFileSync(ENV_EXAMPLE, example);
    console.log(`✅ Created ${ENV_EXAMPLE}`);
  }
}

/**
 * Validate setup before running validation
 */
async function validateSetup() {
  console.log('🎵 Wavelength Lore CTA Audit - Setup Check\n');

  const manager = new CTASetupManager();
  manager.loadEnv();

  const isValid = manager.displayStatus();

  if (!isValid) {
    console.log('⚠️  API Key is not properly configured\n');
    console.log('To fix this, run one of the following:\n');
    console.log('1. Interactive setup (recommended):');
    console.log('   npm run cta:setup\n');

    console.log('2. Set API key directly:');
    console.log('   npm run cta:setup -- --add-key your_actual_key_here\n');

    console.log('3. Manually edit .env file:');
    console.log(`   CHATBOT_API_KEY=your_key_here\n`);

    return false;
  }

  return true;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const manager = new CTASetupManager();

  if (args.length === 0 || args[0] === '--check') {
    // Just check current setup
    manager.loadEnv();
    const isValid = manager.displayStatus();
    process.exit(isValid ? 0 : 1);
  } else if (args[0] === '--add-key' && args[1]) {
    // Add key from command line
    const key = args[1];
    manager.setApiKey(key);
    manager.loadEnv();
    manager.displayStatus();
    process.exit(0);
  } else if (args[0] === '--interactive') {
    // Interactive setup
    const success = await manager.interactiveSetup();
    process.exit(success ? 0 : 1);
  } else if (args[0] === '--example') {
    // Create .env.example
    manager.createExampleEnv();
    process.exit(0);
  } else if (args[0] === '--help') {
    console.log(`
CTA Setup & Validation Tool

Usage: npm run cta:setup [command]

Commands:
  (no args)              Check current configuration status
  --check                Check if API key is properly set
  --add-key <key>        Set API key from command line
  --interactive          Interactive setup wizard
  --example              Create .env.example template
  --help                 Show this help message

Examples:
  npm run cta:setup                    # Check status
  npm run cta:setup -- --check         # Verify configuration
  npm run cta:setup -- --interactive   # Interactive setup
  npm run cta:setup -- --add-key abc123xyz  # Set key directly

Environment Variables:
  CHATBOT_API_KEY        Required for validation (set in .env)
  CHATBOT_URL            Optional, defaults to us-central1-wavelength-lore.cloudfunctions.net

For more info, see CTA_AUDIT_GUIDE.md
    `);
    process.exit(0);
  } else {
    console.error(`Unknown command: ${args[0]}`);
    console.error('Run: npm run cta:setup -- --help');
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { CTASetupManager, validateSetup };

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
