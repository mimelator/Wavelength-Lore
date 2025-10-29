#!/usr/bin/env node

/**
 * CTA Debug Script
 * Tests API connectivity and authentication one CTA at a time
 * Helps diagnose 401 and other API issues
 * Usage:
 *   npm run cta:debug [--cta-index 0] [--verbose] [--url-only] [--test-request]
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const AUDIT_FILE = path.join(__dirname, '../reports/cta-audit.json');

/**
 * Debug Manager
 */
class CTADebugger {
  constructor() {
    // Use the same endpoint as the working chat CLI
    this.chatbotUrl = 'us-central1-wavelength-lore.cloudfunctions.net';
    this.apiKey = process.env.CHATBOT_API_KEY;
    this.verbose = false;
    this.ctaIndex = 0;
  }

  /**
   * Load audit data
   */
  loadAuditData() {
    if (!fs.existsSync(AUDIT_FILE)) {
      throw new Error(`Audit file not found: ${AUDIT_FILE}`);
    }
    const data = fs.readFileSync(AUDIT_FILE, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Display API configuration
   */
  displayConfig() {
    console.log('\n📋 API Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`🔗 API URL: ${this.chatbotUrl}`);
    console.log(`🔑 API Key: ${this.apiKey ? `${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'NOT SET'}`);
    console.log(`📏 Key Length: ${this.apiKey ? this.apiKey.length : 0} chars`);
    console.log(`🔐 Auth Method: Bearer token in Authorization header`);
    console.log(`⏱️  Timeout: 30 seconds`);

    if (!this.apiKey) {
      console.log('\n❌ ERROR: CHATBOT_API_KEY not set in .env');
      return false;
    }

    console.log('\n✅ Configuration looks good\n');
    return true;
  }

  /**
   * Display selected CTA
   */
  displayCTA(auditData, index) {
    const ctas = auditData.ctas || [];
    if (index >= ctas.length) {
      console.log(`❌ CTA index ${index} out of range (0-${ctas.length - 1})`);
      return null;
    }

    const cta = ctas[index];
    console.log(`\n📌 CTA #${index + 1} of ${ctas.length}:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Type: ${cta.type}`);
    console.log(`ID: ${cta.id}`);
    console.log(`Title: ${cta.title}`);
    console.log(`Source: ${cta.source}`);

    if (cta.type === 'episode') {
      console.log(`Season: ${cta.season}`);
      if (cta.cta_tagline) console.log(`CTA Tagline: "${cta.cta_tagline}"`);
      if (cta.cliffhanger_hook) console.log(`Cliffhanger: "${cta.cliffhanger_hook.substring(0, 80)}..."`);
    } else if (cta.type === 'lore') {
      console.log(`Category: ${cta.category}`);
      if (cta.intrigue_hook) console.log(`Hook: "${cta.intrigue_hook}"`);
    }

    console.log();
    return cta;
  }

  /**
   * Build validation prompt
   */
  buildPrompt(cta) {
    let prompt = `Evaluate this CTA (Call-to-Action) for consistency with Wavelength lore:\n\n`;
    prompt += `Type: ${cta.type}\n`;
    prompt += `Title: ${cta.title}\n`;

    if (cta.type === 'episode') {
      if (cta.cta_tagline) prompt += `CTA Tagline: "${cta.cta_tagline}"\n`;
      if (cta.cliffhanger_hook) prompt += `Cliffhanger: "${cta.cliffhanger_hook}"\n`;
      prompt += `Season: ${cta.season}\n`;
    } else if (cta.type === 'lore') {
      if (cta.intrigue_hook) prompt += `Intrigue Hook: "${cta.intrigue_hook}"\n`;
      prompt += `Category: ${cta.category}\n`;
    }

    prompt += `\nPlease provide a brief assessment:\n`;
    prompt += `1. Is this consistent with lore?\n`;
    prompt += `2. Any concerns or issues?\n`;
    prompt += `3. Rate consistency (1-4 scale)`;

    return prompt;
  }

  /**
   * Test API request with detailed output
   */
  async testRequest(cta) {
    console.log('\n📤 Sending Request:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const url = `https://${this.chatbotUrl}/legacy/chat`;
    const prompt = this.buildPrompt(cta);

    console.log(`POST ${url}`);
    console.log(`\nHeaders:`);
    console.log(`  X-API-Key: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    console.log(`  Content-Type: application/json`);

    if (this.verbose) {
      console.log(`\nRequest Body:`);
      console.log(JSON.stringify({
        message: prompt.substring(0, 100) + '...',
        conversationHistory: []
      }, null, 2));
    }

    try {
      console.log(`\n⏳ Sending request... (timeout: 30s)\n`);

      const startTime = Date.now();
      const response = await axios.post(
        url,
        {
          message: prompt,
          conversationHistory: []
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      const duration = Date.now() - startTime;

      console.log('📥 Response Received:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Duration: ${duration}ms`);
      console.log(`\nContent-Type: ${response.headers['content-type']}`);

      if (response.data.response) {
        console.log(`\nChatbot Response:`);
        console.log('─────────────────────────────────────────────────\n');
        console.log(response.data.response);
        console.log('\n─────────────────────────────────────────────────\n');
      }

      console.log('\n✅ SUCCESS: API call worked!\n');
      return { success: true, data: response.data };
    } catch (error) {
      console.log('❌ Error Response:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (error.response) {
        // API responded with error
        console.log(`Status: ${error.response.status} ${error.response.statusText}`);
        console.log(`\nError Headers:`);
        Object.entries(error.response.headers).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });

        if (error.response.data) {
          console.log(`\nError Body:`);
          if (typeof error.response.data === 'string') {
            console.log(error.response.data);
          } else {
            console.log(JSON.stringify(error.response.data, null, 2));
          }
        }

        console.log(`\n🔍 Diagnosis:`);
        if (error.response.status === 401) {
          console.log('  - Authentication failed (401 Unauthorized)');
          console.log('  - Possible causes:');
          console.log('    1. API key is invalid or expired');
          console.log('    2. API key is revoked');
          console.log('    3. API may not use "Bearer" token format');
          console.log('    4. API key may need different header format');
        } else if (error.response.status === 404) {
          console.log('  - Endpoint not found (404)');
          console.log('  - URL might be incorrect');
        } else if (error.response.status === 500) {
          console.log('  - Server error (500)');
          console.log('  - API might be down');
        }
      } else if (error.request) {
        // Request made but no response
        console.log(`No response from server`);
        console.log(`Error: ${error.message}`);
        console.log(`\n🔍 Diagnosis:`);
        console.log('  - Network timeout or no connection');
        console.log('  - URL might be unreachable');
        console.log('  - Try: curl -I https://...');
      } else {
        // Error in request setup
        console.log(`Request Error: ${error.message}`);
      }

      console.log();
      return { success: false, error: error.message };
    }
  }

  /**
   * Display curl command for testing
   */
  displayCurlCommand(cta) {
    const url = `https://${this.chatbotUrl}/chat`;
    const prompt = this.buildPrompt(cta).substring(0, 50) + '...';

    console.log('\n🧪 Test with curl:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`curl -X POST ${url} \\`);
    console.log(`  -H "Authorization: Bearer YOUR_KEY_HERE" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"message":"${prompt}"}'`);
    console.log();
  }

  /**
   * Show available CTAs
   */
  showAvailableCTAs(auditData) {
    const ctas = auditData.ctas || [];
    console.log('\n📚 Available CTAs:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    ctas.forEach((cta, index) => {
      console.log(`[${index}] ${cta.type.padEnd(8)} - ${cta.title}`);
    });

    console.log(`\nTotal: ${ctas.length} CTAs`);
    console.log(`\nRun: npm run cta:debug -- --cta-index [0-${ctas.length - 1}]\n`);
  }
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const debug = new CTADebugger();

  // Parse arguments
  let ctaIndex = 0;
  let showList = false;
  let urlOnly = false;
  let testRequest = true;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--cta-index' && args[i + 1]) {
      ctaIndex = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--verbose') {
      debug.verbose = true;
    } else if (args[i] === '--list') {
      showList = true;
    } else if (args[i] === '--url-only') {
      urlOnly = true;
      testRequest = false;
    } else if (args[i] === '--no-request') {
      testRequest = false;
    } else if (args[i] === '--help') {
      console.log(`
CTA Debug Script - Test API connectivity one CTA at a time

Usage: npm run cta:debug [options]

Options:
  --cta-index <n>     Test specific CTA (0-35, default: 0)
  --list              Show all available CTAs
  --verbose           Show detailed request/response
  --url-only          Just show the API URL
  --no-request        Don't send request, just show config
  --help              Show this help

Examples:
  npm run cta:debug                    # Test first CTA
  npm run cta:debug -- --cta-index 5   # Test CTA #5
  npm run cta:debug -- --list          # List all CTAs
  npm run cta:debug -- --verbose       # Detailed output
  npm run cta:debug -- --url-only      # Show API URL only

      `);
      process.exit(0);
    }
  }

  try {
    const auditData = debug.loadAuditData();

    // Show list and exit
    if (showList) {
      debug.showAvailableCTAs(auditData);
      process.exit(0);
    }

    // Show config
    const configOk = debug.displayConfig();
    if (!configOk) process.exit(1);

    // Show CTA
    const cta = debug.displayCTA(auditData, ctaIndex);
    if (!cta) process.exit(1);

    // Show URL only
    if (urlOnly) {
      console.log(`\n🔗 API Endpoint: https://${debug.chatbotUrl}/chat\n`);
      process.exit(0);
    }

    // Send request
    if (testRequest) {
      const result = await debug.testRequest(cta);
      debug.displayCurlCommand(cta);

      if (!result.success) {
        console.log('\n💡 Tips:');
        console.log('  1. Verify CHATBOT_API_KEY in .env');
        console.log('  2. Check if API key is expired');
        console.log('  3. Test endpoint with curl (command above)');
        console.log('  4. Check API documentation for auth format');
        console.log('  5. Run: npm run cta:setup -- --check\n');
        process.exit(1);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CTADebugger };
