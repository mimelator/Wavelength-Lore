#!/usr/bin/env node

/**
 * Quick Production Health Check
 * 
 * Fast HTTP-based checks for immediate confidence in production status.
 * No browser automation - just HTTP requests for speed.
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

const PRODUCTION_URL = 'https://vh9x3gevev.us-east-1.awsapprunner.com';
const TIMEOUT = 10000; // 10 seconds

class QuickHealthCheck {
  constructor() {
    this.results = [];
    this.startTime = performance.now();
  }

  /**
   * Log test result
   */
  logResult(test, success, details = '', duration = 0) {
    const result = { test, success, details, duration };
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    const time = duration > 0 ? ` (${Math.round(duration)}ms)` : '';
    console.log(`${status} ${test}${time}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }

  /**
   * Make HTTP request with timeout
   */
  async makeRequest(url, options = {}) {
    const start = performance.now();
    try {
      const response = await axios.get(url, {
        timeout: TIMEOUT,
        validateStatus: () => true, // Don't throw on 4xx/5xx
        ...options
      });
      const duration = performance.now() - start;
      return { response, duration, success: true };
    } catch (error) {
      const duration = performance.now() - start;
      return { error, duration, success: false };
    }
  }

  /**
   * Test 1: Home Page Response
   */
  async testHomePage() {
    const { response, duration, success, error } = await this.makeRequest(PRODUCTION_URL);
    
    if (success && response.status === 200) {
      const hasWavelength = response.data.includes('Wavelength') || response.data.includes('wavelength');
      if (hasWavelength) {
        this.logResult('Home Page', true, `Status 200, contains Wavelength content`, duration);
        return true;
      } else {
        this.logResult('Home Page', false, `Status 200 but content missing`, duration);
        return false;
      }
    } else {
      const message = success ? `Status ${response.status}` : error.message;
      this.logResult('Home Page', false, message, duration);
      return false;
    }
  }

  /**
   * Test 2: Radio Page
   */
  async testRadioPage() {
    const { response, duration, success, error } = await this.makeRequest(`${PRODUCTION_URL}/radio`);
    
    if (success && response.status === 200) {
      const hasRadio = response.data.includes('radio') || response.data.includes('Radio') || response.data.includes('player');
      if (hasRadio) {
        this.logResult('Radio Page', true, `Radio page accessible`, duration);
        return true;
      } else {
        this.logResult('Radio Page', false, `Page loads but radio content missing`, duration);
        return false;
      }
    } else {
      const message = success ? `Status ${response.status}` : error.message;
      this.logResult('Radio Page', false, message, duration);
      return false;
    }
  }

  /**
   * Test 3: Episodes API
   */
  async testEpisodesAPI() {
    const { response, duration, success, error } = await this.makeRequest(`${PRODUCTION_URL}/api/episodes`);
    
    if (success && response.status === 200) {
      try {
        const data = response.data;
        if (data.episodes && Array.isArray(data.episodes)) {
          this.logResult('Episodes API', true, `${data.episodes.length} episodes available`, duration);
          return true;
        } else {
          this.logResult('Episodes API', false, `Invalid response format`, duration);
          return false;
        }
      } catch (parseError) {
        this.logResult('Episodes API', false, `Response parse error`, duration);
        return false;
      }
    } else {
      const message = success ? `Status ${response.status}` : error.message;
      this.logResult('Episodes API', false, message, duration);
      return false;
    }
  }

  /**
   * Test 4: Deployment Status API
   */
  async testDeploymentStatus() {
    const { response, duration, success, error } = await this.makeRequest(`${PRODUCTION_URL}/api/deployment/status`);
    
    if (success && response.status === 200) {
      try {
        const data = response.data;
        if (data.version || data.build) {
          this.logResult('Deployment Status', true, `Version info available`, duration);
          return true;
        } else {
          this.logResult('Deployment Status', true, `Status endpoint responding`, duration);
          return true;
        }
      } catch (parseError) {
        this.logResult('Deployment Status', true, `Endpoint responding (parse issue)`, duration);
        return true;
      }
    } else {
      const message = success ? `Status ${response.status}` : error.message;
      this.logResult('Deployment Status', false, message, duration);
      return false;
    }
  }

  /**
   * Test 5: Characters Page
   */
  async testCharactersPage() {
    const { response, duration, success, error } = await this.makeRequest(`${PRODUCTION_URL}/characters`);
    
    if (success && response.status === 200) {
      const hasCharacters = response.data.includes('character') || response.data.includes('Character') || 
                           response.data.includes('Andrew') || response.data.includes('Jewel');
      if (hasCharacters) {
        this.logResult('Characters Page', true, `Character content found`, duration);
        return true;
      } else {
        this.logResult('Characters Page', false, `Page loads but character content missing`, duration);
        return false;
      }
    } else {
      const message = success ? `Status ${response.status}` : error.message;
      this.logResult('Characters Page', false, message, duration);
      return false;
    }
  }

  /**
   * Test 6: Static Assets (CSS)
   */
  async testStaticAssets() {
    const { response, duration, success, error } = await this.makeRequest(`${PRODUCTION_URL}/css/styles.css`);
    
    if (success && response.status === 200) {
      const isCSS = response.data.includes('{') && response.data.includes('}');
      if (isCSS) {
        this.logResult('Static Assets', true, `CSS files serving correctly`, duration);
        return true;
      } else {
        this.logResult('Static Assets', false, `CSS endpoint returns non-CSS content`, duration);
        return false;
      }
    } else {
      const message = success ? `Status ${response.status}` : error.message;
      this.logResult('Static Assets', false, message, duration);
      return false;
    }
  }

  /**
   * Test 7: Forum Health (if accessible)
   */
  async testForumHealth() {
    const { response, duration, success, error } = await this.makeRequest(`${PRODUCTION_URL}/forum`);
    
    if (success && [200, 301, 302].includes(response.status)) {
      this.logResult('Forum Access', true, `Forum endpoint accessible (status ${response.status})`, duration);
      return true;
    } else {
      const message = success ? `Status ${response.status}` : error.message;
      this.logResult('Forum Access', false, message, duration);
      return false;
    }
  }

  /**
   * Run all quick tests
   */
  async runAllTests() {
    console.log('⚡ Quick Production Health Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 Testing: ${PRODUCTION_URL}`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

    const tests = [
      () => this.testHomePage(),
      () => this.testRadioPage(),
      () => this.testEpisodesAPI(),
      () => this.testDeploymentStatus(),
      () => this.testCharactersPage(),
      () => this.testStaticAssets(),
      () => this.testForumHealth()
    ];

    for (const test of tests) {
      await test();
    }

    this.displaySummary();
  }

  /**
   * Display summary
   */
  displaySummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = performance.now() - this.startTime;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    console.log('\n📊 Quick Health Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${failedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log(`⏱️  Total Time: ${Math.round(totalDuration)}ms`);
    console.log(`📡 Avg Response: ${Math.round(avgResponseTime)}ms`);

    if (failedTests === 0) {
      console.log('\n🎉 All quick checks passed! Site is responding well.');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('\n⚠️  Most endpoints healthy, minor issues detected.');
    } else {
      console.log('\n🚨 Multiple endpoints failing. Investigation needed!');
    }

    console.log(`\n🌐 Site: ${PRODUCTION_URL}`);
    console.log(`📅 Completed: ${new Date().toLocaleString()}`);

    // Exit with appropriate code
    process.exit(failedTests === 0 ? 0 : 1);
  }
}

// CLI interface
async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
⚡ Quick Production Health Check

Usage:
  npm run health:quick

Tests (HTTP only):
  ✓ Home page response
  ✓ Radio page accessibility
  ✓ Episodes API endpoint
  ✓ Deployment status API
  ✓ Characters page content
  ✓ Static asset delivery
  ✓ Forum endpoint health

Options:
  --help, -h     Show this help message

For comprehensive browser-based testing, use: npm run health:check
`);
    process.exit(0);
  }

  const healthCheck = new QuickHealthCheck();

  try {
    await healthCheck.runAllTests();
  } catch (error) {
    console.error('❌ Fatal error during quick health check:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = QuickHealthCheck;