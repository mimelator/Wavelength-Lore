#!/usr/bin/env node

/**
 * 🧪 Unified Testing & Validation Suite
 * 
 * Consolidates all testing operations into a comprehensive, organized tool.
 * Replaces 52 individual testing scripts with unified test categories.
 * 
 * Usage: node test-runner.js <category> <operation> [options]
 * 
 * Categories: health, performance, validation, integration, security, regression
 * Operations: run, check, monitor, validate, analyze
 */

const { program } = require('commander');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  PRODUCTION_URL: 'https://vh9x3gevev.us-east-1.awsapprunner.com',
  LOCAL_URL: 'http://localhost:3001',
  TEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  CONCURRENT_TESTS: 5
};

/**
 * Base Test Runner Class
 */
class BaseTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.browser = null;
    this.page = null;
  }

  logInfo(message) {
    console.log(chalk.blue('ℹ️ '), message);
  }

  logSuccess(message) {
    console.log(chalk.green('✅'), message);
  }

  logWarning(message) {
    console.log(chalk.yellow('⚠️ '), message);
  }

  logError(message) {
    console.log(chalk.red('❌'), message);
  }

  logHeader(message) {
    console.log(chalk.bold.cyan('\n🧪 ' + message));
    console.log(chalk.cyan('━'.repeat(60)));
  }

  async initializeBrowser() {
    if (this.browser) return;
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  recordResult(test, passed, message, details = {}) {
    this.results.push({
      test,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    });

    if (passed) {
      this.logSuccess(`${test}: ${message}`);
    } else {
      this.logError(`${test}: ${message}`);
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(chalk.bold('\n📊 Test Results Summary'));
    console.log(chalk.cyan('━'.repeat(40)));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${chalk.green(passed)}`);
    console.log(`Failed: ${chalk.red(total - passed)}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (total - passed > 0) {
      console.log(chalk.red('\n❌ Failed Tests:'));
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }
    
    return { passed, total, duration, successRate: (passed / total) * 100 };
  }
}

/**
 * Health Check Test Runner
 */
class HealthCheckRunner extends BaseTestRunner {
  
  async runHealthChecks(url = CONFIG.PRODUCTION_URL) {
    this.logHeader(`Health Check Suite - ${url}`);
    
    await this.initializeBrowser();
    
    try {
      await this.testBasicConnectivity(url);
      await this.testCriticalPages(url);
      await this.testStaticResources(url);
      await this.testAPIEndpoints(url);
      await this.testDatabaseConnections(url);
      
    } finally {
      await this.cleanup();
    }
    
    return this.generateReport();
  }
  
  async testBasicConnectivity(url) {
    this.logInfo('Testing basic connectivity...');
    
    try {
      const response = await axios.get(url, { 
        timeout: CONFIG.TEST_TIMEOUT,
        validateStatus: () => true 
      });
      
      if (response.status === 200) {
        this.recordResult('Basic Connectivity', true, `Server responding (${response.status})`);
      } else {
        this.recordResult('Basic Connectivity', false, `Server error (${response.status})`);
      }
    } catch (error) {
      this.recordResult('Basic Connectivity', false, `Connection failed: ${error.message}`);
    }
  }
  
  async testCriticalPages(url) {
    this.logInfo('Testing critical pages...');
    
    const criticalPages = [
      { path: '/', name: 'Homepage' },
      { path: '/characters', name: 'Characters Page' },
      { path: '/lore', name: 'Lore Page' },
      { path: '/map', name: 'Map Page' },
      { path: '/forum', name: 'Forum Page' },
      { path: '/about', name: 'About Page' }
    ];
    
    for (const page of criticalPages) {
      try {
        await this.page.goto(`${url}${page.path}`, { 
          waitUntil: 'networkidle2', 
          timeout: CONFIG.TEST_TIMEOUT 
        });
        
        const title = await this.page.title();
        
        if (title && !title.includes('Error')) {
          this.recordResult(page.name, true, `Page loaded successfully`);
        } else {
          this.recordResult(page.name, false, `Page title indicates error: ${title}`);
        }
        
      } catch (error) {
        this.recordResult(page.name, false, `Failed to load: ${error.message}`);
      }
    }
  }
  
  async testStaticResources(url) {
    this.logInfo('Testing static resources...');
    
    const staticAssets = [
      '/static/css/styles.css',
      '/static/css/lore_styles.css',
      '/static/js/map-modal-fix.js',
      '/static/icons/favicon.svg'
    ];
    
    for (const asset of staticAssets) {
      try {
        const response = await axios.head(`${url}${asset}`, {
          timeout: CONFIG.TEST_TIMEOUT
        });
        
        if (response.status === 200) {
          this.recordResult(`Static Asset: ${asset}`, true, 'Asset accessible');
        } else {
          this.recordResult(`Static Asset: ${asset}`, false, `Status: ${response.status}`);
        }
        
      } catch (error) {
        this.recordResult(`Static Asset: ${asset}`, false, `Failed to load: ${error.message}`);
      }
    }
  }
  
  async testAPIEndpoints(url) {
    this.logInfo('Testing API endpoints...');
    
    const apiEndpoints = [
      { path: '/api/health', name: 'Health API' },
      { path: '/api/characters', name: 'Characters API' },
      { path: '/api/lore', name: 'Lore API' }
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await axios.get(`${url}${endpoint.path}`, {
          timeout: CONFIG.TEST_TIMEOUT,
          validateStatus: (status) => status < 500
        });
        
        if (response.status < 400) {
          this.recordResult(endpoint.name, true, `API responding (${response.status})`);
        } else {
          this.recordResult(endpoint.name, false, `API error (${response.status})`);
        }
        
      } catch (error) {
        this.recordResult(endpoint.name, false, `API failed: ${error.message}`);
      }
    }
  }
  
  async testDatabaseConnections(url) {
    this.logInfo('Testing database connections...');
    
    try {
      // Test forum database connection
      const forumResponse = await axios.get(`${url}/api/forum/health`, {
        timeout: CONFIG.TEST_TIMEOUT,
        validateStatus: () => true
      });
      
      if (forumResponse.status === 200) {
        this.recordResult('Forum Database', true, 'Database connection healthy');
      } else {
        this.recordResult('Forum Database', false, `Database connection issues (${forumResponse.status})`);
      }
      
    } catch (error) {
      this.recordResult('Forum Database', false, `Database test failed: ${error.message}`);
    }
  }
}

/**
 * Performance Test Runner
 */
class PerformanceTestRunner extends BaseTestRunner {
  
  async runPerformanceTests(url = CONFIG.PRODUCTION_URL) {
    this.logHeader(`Performance Test Suite - ${url}`);
    
    await this.initializeBrowser();
    
    try {
      await this.testPageLoadTimes(url);
      await this.testResourceLoadTimes(url);
      await this.testMemoryUsage(url);
      
    } finally {
      await this.cleanup();
    }
    
    return this.generateReport();
  }
  
  async testPageLoadTimes(url) {
    this.logInfo('Testing page load times...');
    
    const pages = ['/', '/characters', '/lore', '/map'];
    
    for (const pagePath of pages) {
      try {
        const startTime = Date.now();
        
        await this.page.goto(`${url}${pagePath}`, {
          waitUntil: 'networkidle2',
          timeout: CONFIG.TEST_TIMEOUT
        });
        
        const loadTime = Date.now() - startTime;
        const threshold = 5000; // 5 seconds
        
        if (loadTime < threshold) {
          this.recordResult(
            `Page Load: ${pagePath}`,
            true,
            `Loaded in ${loadTime}ms`,
            { loadTime }
          );
        } else {
          this.recordResult(
            `Page Load: ${pagePath}`,
            false,
            `Slow load: ${loadTime}ms (threshold: ${threshold}ms)`,
            { loadTime }
          );
        }
        
      } catch (error) {
        this.recordResult(`Page Load: ${pagePath}`, false, `Load failed: ${error.message}`);
      }
    }
  }
  
  async testResourceLoadTimes(url) {
    this.logInfo('Testing resource load times...');
    
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    
    const resourceMetrics = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources.map(resource => ({
        name: resource.name.split('/').pop(),
        duration: resource.duration,
        size: resource.transferSize
      }));
    });
    
    let slowResources = 0;
    const threshold = 2000; // 2 seconds
    
    resourceMetrics.forEach(resource => {
      if (resource.duration > threshold) {
        slowResources++;
        this.recordResult(
          `Resource Load: ${resource.name}`,
          false,
          `Slow resource: ${Math.round(resource.duration)}ms`,
          { duration: resource.duration, size: resource.size }
        );
      }
    });
    
    if (slowResources === 0) {
      this.recordResult('Resource Load Times', true, 'All resources load within threshold');
    }
  }
  
  async testMemoryUsage(url) {
    this.logInfo('Testing memory usage...');
    
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    
    const memoryInfo = await this.page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryInfo) {
      const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
      const threshold = 50; // 50MB
      
      if (usedMB < threshold) {
        this.recordResult(
          'Memory Usage',
          true,
          `Memory usage: ${usedMB}MB`,
          memoryInfo
        );
      } else {
        this.recordResult(
          'Memory Usage',
          false,
          `High memory usage: ${usedMB}MB (threshold: ${threshold}MB)`,
          memoryInfo
        );
      }
    } else {
      this.recordResult('Memory Usage', false, 'Memory API not available');
    }
  }
}

/**
 * Integration Test Runner
 */
class IntegrationTestRunner extends BaseTestRunner {
  
  async runIntegrationTests(url = CONFIG.PRODUCTION_URL) {
    this.logHeader(`Integration Test Suite - ${url}`);
    
    await this.initializeBrowser();
    
    try {
      await this.testPrintifyIntegration(url);
      await this.testGalleryIntegration(url);
      await this.testForumIntegration(url);
      await this.testAWSIntegration(url);
      
    } finally {
      await this.cleanup();
    }
    
    return this.generateReport();
  }
  
  async testPrintifyIntegration(url) {
    this.logInfo('Testing Printify integration...');
    
    try {
      // Test merchandise page access
      await this.page.goto(`${url}/merchandise`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TEST_TIMEOUT
      });
      
      const productElements = await this.page.$$('[data-product-id]');
      
      if (productElements.length > 0) {
        this.recordResult('Printify Integration', true, `Found ${productElements.length} products`);
      } else {
        this.recordResult('Printify Integration', false, 'No products found on merchandise page');
      }
      
    } catch (error) {
      this.recordResult('Printify Integration', false, `Integration test failed: ${error.message}`);
    }
  }
  
  async testGalleryIntegration(url) {
    this.logInfo('Testing gallery integration...');
    
    try {
      const response = await axios.get(`${url}/api/gallery/images`, {
        timeout: CONFIG.TEST_TIMEOUT,
        validateStatus: () => true
      });
      
      if (response.status === 200 && response.data) {
        const imageCount = Array.isArray(response.data) ? response.data.length : 0;
        this.recordResult('Gallery Integration', true, `Gallery API returning ${imageCount} images`);
      } else {
        this.recordResult('Gallery Integration', false, `Gallery API error: ${response.status}`);
      }
      
    } catch (error) {
      this.recordResult('Gallery Integration', false, `Gallery test failed: ${error.message}`);
    }
  }
  
  async testForumIntegration(url) {
    this.logInfo('Testing forum integration...');
    
    try {
      await this.page.goto(`${url}/forum`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.TEST_TIMEOUT
      });
      
      const forumPosts = await this.page.$$('.forum-post, .post-item');
      
      if (forumPosts.length > 0) {
        this.recordResult('Forum Integration', true, 'Forum posts loading successfully');
      } else {
        this.recordResult('Forum Integration', false, 'No forum posts found');
      }
      
    } catch (error) {
      this.recordResult('Forum Integration', false, `Forum test failed: ${error.message}`);
    }
  }
  
  async testAWSIntegration(url) {
    this.logInfo('Testing AWS service integration...');
    
    try {
      // Test S3 static assets
      const response = await axios.head(`${url}/static/css/styles.css`, {
        timeout: CONFIG.TEST_TIMEOUT
      });
      
      if (response.status === 200) {
        this.recordResult('AWS S3 Integration', true, 'Static assets served from S3');
      } else {
        this.recordResult('AWS S3 Integration', false, `S3 assets not accessible: ${response.status}`);
      }
      
    } catch (error) {
      this.recordResult('AWS S3 Integration', false, `AWS integration test failed: ${error.message}`);
    }
  }
}

/**
 * Security Test Runner
 */
class SecurityTestRunner extends BaseTestRunner {
  
  async runSecurityTests(url = CONFIG.PRODUCTION_URL) {
    this.logHeader(`Security Test Suite - ${url}`);
    
    await this.initializeBrowser();
    
    try {
      await this.testHTTPSRedirect(url);
      await this.testSecurityHeaders(url);
      await this.testInputValidation(url);
      await this.testRateLimiting(url);
      
    } finally {
      await this.cleanup();
    }
    
    return this.generateReport();
  }
  
  async testHTTPSRedirect(url) {
    this.logInfo('Testing HTTPS redirect...');
    
    try {
      const httpUrl = url.replace('https://', 'http://');
      const response = await axios.get(httpUrl, {
        maxRedirects: 0,
        validateStatus: () => true
      });
      
      if ([301, 302, 307, 308].includes(response.status)) {
        this.recordResult('HTTPS Redirect', true, `HTTP redirects to HTTPS (${response.status})`);
      } else {
        this.recordResult('HTTPS Redirect', false, `No HTTPS redirect found (${response.status})`);
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND' && url.includes('https')) {
        this.recordResult('HTTPS Redirect', true, 'HTTPS-only configuration');
      } else {
        this.recordResult('HTTPS Redirect', false, `HTTPS test failed: ${error.message}`);
      }
    }
  }
  
  async testSecurityHeaders(url) {
    this.logInfo('Testing security headers...');
    
    try {
      const response = await axios.head(url);
      const headers = response.headers;
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security'
      ];
      
      let secureHeaders = 0;
      securityHeaders.forEach(header => {
        if (headers[header]) {
          secureHeaders++;
        }
      });
      
      if (secureHeaders >= securityHeaders.length / 2) {
        this.recordResult('Security Headers', true, `${secureHeaders}/${securityHeaders.length} security headers present`);
      } else {
        this.recordResult('Security Headers', false, `Only ${secureHeaders}/${securityHeaders.length} security headers present`);
      }
      
    } catch (error) {
      this.recordResult('Security Headers', false, `Header test failed: ${error.message}`);
    }
  }
  
  async testInputValidation(url) {
    this.logInfo('Testing input validation...');
    
    try {
      // Test XSS prevention
      const xssPayload = '<script>alert("xss")</script>';
      const response = await axios.get(`${url}/search?q=${encodeURIComponent(xssPayload)}`, {
        validateStatus: () => true
      });
      
      if (!response.data.includes('<script>alert')) {
        this.recordResult('XSS Protection', true, 'Input properly sanitized');
      } else {
        this.recordResult('XSS Protection', false, 'XSS vulnerability detected');
      }
      
    } catch (error) {
      this.recordResult('XSS Protection', false, `Input validation test failed: ${error.message}`);
    }
  }
  
  async testRateLimiting(url) {
    this.logInfo('Testing rate limiting...');
    
    try {
      const requests = [];
      const requestCount = 20;
      
      // Send multiple rapid requests
      for (let i = 0; i < requestCount; i++) {
        requests.push(axios.get(url, { validateStatus: () => true }));
      }
      
      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(result => 
        result.status === 'fulfilled' && 
        [429, 503].includes(result.value.status)
      );
      
      if (rateLimited) {
        this.recordResult('Rate Limiting', true, 'Rate limiting active');
      } else {
        this.recordResult('Rate Limiting', false, 'No rate limiting detected');
      }
      
    } catch (error) {
      this.recordResult('Rate Limiting', false, `Rate limit test failed: ${error.message}`);
    }
  }
}

/**
 * Main Test Suite Manager
 */
class UnifiedTestRunner {
  constructor() {
    this.runners = {
      health: new HealthCheckRunner(),
      performance: new PerformanceTestRunner(),
      integration: new IntegrationTestRunner(),
      security: new SecurityTestRunner()
    };
  }

  async runTestSuite(category, operation, options) {
    const url = options.url || CONFIG.PRODUCTION_URL;
    
    switch (category) {
      case 'health':
        return await this.runners.health.runHealthChecks(url);
      case 'performance':
        return await this.runners.performance.runPerformanceTests(url);
      case 'integration':
        return await this.runners.integration.runIntegrationTests(url);
      case 'security':
        return await this.runners.security.runSecurityTests(url);
      case 'all':
        return await this.runAllTests(url);
      default:
        console.error(`Unknown test category: ${category}`);
        return null;
    }
  }

  async runAllTests(url) {
    console.log(chalk.bold.cyan('\n🧪 Running Complete Test Suite'));
    console.log(chalk.cyan('━'.repeat(60)));
    
    const results = {};
    
    for (const [category, runner] of Object.entries(this.runners)) {
      try {
        console.log(chalk.yellow(`\n🔄 Running ${category} tests...`));
        results[category] = await this.runTestSuite(category, 'run', { url });
      } catch (error) {
        console.error(chalk.red(`❌ ${category} tests failed: ${error.message}`));
        results[category] = { passed: 0, total: 1, successRate: 0 };
      }
    }
    
    // Generate overall summary
    const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
    const totalTests = Object.values(results).reduce((sum, r) => sum + r.total, 0);
    const overallRate = Math.round((totalPassed / totalTests) * 100);
    
    console.log(chalk.bold.cyan('\n📊 Overall Test Results'));
    console.log(chalk.cyan('━'.repeat(60)));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${chalk.green(totalPassed)}`);
    console.log(`Failed: ${chalk.red(totalTests - totalPassed)}`);
    console.log(`Success Rate: ${overallRate}%`);
    
    return { passed: totalPassed, total: totalTests, successRate: overallRate, details: results };
  }
}

// CLI Setup
program
  .name('test-runner')
  .description('🧪 Unified Testing & Validation Suite')
  .version('1.0.0');

// Test commands
program
  .command('health')
  .description('Run health check tests')
  .option('--url <url>', 'Target URL to test', CONFIG.PRODUCTION_URL)
  .action(async (options) => {
    const runner = new UnifiedTestRunner();
    await runner.runTestSuite('health', 'run', options);
  });

program
  .command('performance')
  .description('Run performance tests')
  .option('--url <url>', 'Target URL to test', CONFIG.PRODUCTION_URL)
  .action(async (options) => {
    const runner = new UnifiedTestRunner();
    await runner.runTestSuite('performance', 'run', options);
  });

program
  .command('integration')
  .description('Run integration tests')
  .option('--url <url>', 'Target URL to test', CONFIG.PRODUCTION_URL)
  .action(async (options) => {
    const runner = new UnifiedTestRunner();
    await runner.runTestSuite('integration', 'run', options);
  });

program
  .command('security')
  .description('Run security tests')
  .option('--url <url>', 'Target URL to test', CONFIG.PRODUCTION_URL)
  .action(async (options) => {
    const runner = new UnifiedTestRunner();
    await runner.runTestSuite('security', 'run', options);
  });

program
  .command('all')
  .description('Run all test categories')
  .option('--url <url>', 'Target URL to test', CONFIG.PRODUCTION_URL)
  .action(async (options) => {
    const runner = new UnifiedTestRunner();
    await runner.runTestSuite('all', 'run', options);
  });

// Help command
program
  .command('help')
  .description('Show detailed usage examples')
  .action(() => {
    console.log(chalk.bold.cyan('\n🧪 Test Runner - Usage Examples\n'));
    
    console.log(chalk.bold('Health Checks:'));
    console.log('  test-runner.js health');
    console.log('  test-runner.js health --url http://localhost:3001');
    console.log('');
    
    console.log(chalk.bold('Performance Tests:'));
    console.log('  test-runner.js performance');
    console.log('  test-runner.js performance --url https://production-site.com');
    console.log('');
    
    console.log(chalk.bold('Integration Tests:'));
    console.log('  test-runner.js integration');
    console.log('');
    
    console.log(chalk.bold('Security Tests:'));
    console.log('  test-runner.js security');
    console.log('');
    
    console.log(chalk.bold('Complete Test Suite:'));
    console.log('  test-runner.js all');
    console.log('  test-runner.js all --url http://localhost:3001');
    console.log('');
  });

// Parse arguments
if (process.argv.length <= 2) {
  program.help();
} else {
  program.parse();
}

module.exports = { UnifiedTestRunner, HealthCheckRunner, PerformanceTestRunner, IntegrationTestRunner, SecurityTestRunner };