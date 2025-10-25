/**
 * 🧪 TEST UTILITIES
 * Shared utilities for all test suites
 */

const puppeteer = require('puppeteer');
const http = require('http');

/**
 * Common test configuration
 */
const TEST_CONFIG = {
    BASE_URL: 'http://localhost:3001',
    TIMEOUT: 30000,
    VIEWPORT: { width: 1200, height: 800 },
    PERFORMANCE_BUDGET: {
        PAGE_LOAD: 5000,  // 5 seconds
        API_RESPONSE: 2000, // 2 seconds
        INTERACTION: 100   // 100ms
    }
};

/**
 * Browser utilities
 */
class BrowserUtils {
    static async createBrowser(options = {}) {
        return await puppeteer.launch({
            headless: process.env.NODE_ENV === 'test',
            defaultViewport: TEST_CONFIG.VIEWPORT,
            ...options
        });
    }

    static async createPage(browser, enableConsoleLogging = true) {
        const page = await browser.newPage();
        
        if (enableConsoleLogging) {
            page.on('console', msg => {
                if (msg.text().includes('🗺️') || msg.text().includes('🎯') || 
                    msg.text().includes('✅') || msg.text().includes('❌')) {
                    console.log('   Browser:', msg.text());
                }
            });
        }
        
        return page;
    }

    static async waitForSelector(page, selector, timeout = 5000) {
        try {
            await page.waitForSelector(selector, { timeout });
            return true;
        } catch (e) {
            console.warn(`   ⚠️ Selector not found within ${timeout}ms: ${selector}`);
            return false;
        }
    }

    static async safeClick(page, selector) {
        try {
            await page.waitForSelector(selector, { timeout: 5000 });
            await page.click(selector);
            return true;
        } catch (e) {
            console.warn(`   ⚠️ Click failed on: ${selector}`);
            return false;
        }
    }
}

/**
 * HTTP utilities
 */
class HttpUtils {
    static makeRequest(url) {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({
                    status: res.statusCode,
                    data: data,
                    headers: res.headers
                }));
            }).on('error', reject);
        });
    }

    static async checkEndpoint(endpoint) {
        try {
            const response = await this.makeRequest(`${TEST_CONFIG.BASE_URL}${endpoint}`);
            return {
                available: response.status === 200,
                status: response.status,
                responseTime: Date.now() // Would need to measure properly
            };
        } catch (e) {
            return {
                available: false,
                error: e.message
            };
        }
    }
}

/**
 * Test assertion utilities
 */
class AssertUtils {
    static expectWithinRange(actual, expected, tolerance = 0.1) {
        const diff = Math.abs(actual - expected);
        const maxDiff = expected * tolerance;
        return diff <= maxDiff;
    }

    static expectPerformance(actualTime, budgetTime, testName = '') {
        const within = actualTime <= budgetTime;
        if (within) {
            console.log(`✅ ${testName} performance: ${actualTime}ms (budget: ${budgetTime}ms)`);
        } else {
            console.warn(`⚠️ ${testName} performance exceeded: ${actualTime}ms > ${budgetTime}ms`);
        }
        return within;
    }

    static expectElementExists(element, description = '') {
        const exists = !!element;
        if (exists) {
            console.log(`✅ Element found: ${description}`);
        } else {
            console.warn(`❌ Element missing: ${description}`);
        }
        return exists;
    }
}

/**
 * Mock data generators
 */
class MockData {
    static generateUser(overrides = {}) {
        return {
            uid: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            groups: ['user'],
            isContentCreator: false,
            ...overrides
        };
    }

    static generateProduct(overrides = {}) {
        return {
            id: 'test-product-123',
            title: 'Test Product',
            type: 'mug',
            price: 1999, // cents
            imageId: 'test-image-123',
            createdBy: 'test-user-123',
            ...overrides
        };
    }

    static generateMapLocation(overrides = {}) {
        return {
            id: 'test-location',
            name: 'Test Location',
            x: 100,
            y: 100,
            type: 'location',
            ...overrides
        };
    }
}

/**
 * Test environment setup
 */
class TestEnvironment {
    static async waitForServer(maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await HttpUtils.checkEndpoint('/');
                if (response.available) {
                    console.log('✅ Server is ready');
                    return true;
                }
            } catch (e) {
                // Server not ready yet
            }
            
            console.log(`   ⏳ Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        throw new Error('Server did not become available within timeout');
    }

    static async setup() {
        console.log('🔧 Setting up test environment...');
        await this.waitForServer();
        console.log('✅ Test environment ready');
    }

    static async cleanup() {
        console.log('🧹 Cleaning up test environment...');
        // Add any cleanup logic here
        console.log('✅ Test environment cleaned');
    }
}

/**
 * Performance monitoring utilities
 */
class PerformanceUtils {
    static async measurePageLoad(page, url) {
        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'networkidle0' });
        const loadTime = Date.now() - startTime;
        
        return {
            loadTime,
            withinBudget: loadTime <= TEST_CONFIG.PERFORMANCE_BUDGET.PAGE_LOAD,
            budget: TEST_CONFIG.PERFORMANCE_BUDGET.PAGE_LOAD
        };
    }

    static async measureInteraction(page, interactionFn) {
        const startTime = Date.now();
        await interactionFn(page);
        const interactionTime = Date.now() - startTime;
        
        return {
            interactionTime,
            withinBudget: interactionTime <= TEST_CONFIG.PERFORMANCE_BUDGET.INTERACTION,
            budget: TEST_CONFIG.PERFORMANCE_BUDGET.INTERACTION
        };
    }
}

/**
 * Test suite runner utilities
 */
class SuiteRunner {
    static logSuiteStart(suiteName) {
        console.log(`\n🧪 ${suiteName.toUpperCase()}`);
        console.log('='.repeat(50));
    }

    static logTestResult(testName, passed, details = '') {
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} ${testName}${details ? ` - ${details}` : ''}`);
    }

    static logSectionStart(sectionName) {
        console.log(`\n📋 ${sectionName}`);
        console.log('-'.repeat(30));
    }

    static summarizeResults(results) {
        const total = results.length;
        const passed = results.filter(r => r.passed).length;
        const failed = total - passed;
        
        console.log(`\n📊 RESULTS SUMMARY:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        return { total, passed, failed, successRate: (passed / total) * 100 };
    }
}

module.exports = {
    TEST_CONFIG,
    BrowserUtils,
    HttpUtils,
    AssertUtils,
    MockData,
    TestEnvironment,
    PerformanceUtils,
    SuiteRunner
};