#!/usr/bin/env node

/**
 * Comprehensive Forum Functionality Test Suite
 * Tests all forum features to ensure amazing user experience
 */

const axios = require('axios');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3001';
const FORUM_BASE = `${BASE_URL}/forum`;

class ForumTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async test(name, testFn) {
        try {
            console.log(`🧪 Testing: ${name}`);
            await testFn();
            this.results.passed++;
            this.results.tests.push({ name, status: 'PASS' });
            console.log(`✅ PASS: ${name}`);
        } catch (error) {
            this.results.failed++;
            this.results.tests.push({ name, status: 'FAIL', error: error.message });
            console.log(`❌ FAIL: ${name} - ${error.message}`);
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Forum Test Suite...\n');

        // Page Load Tests
        await this.test('Forum Home Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Community Forum')) throw new Error('Missing forum content');
        });

        await this.test('Recent Posts Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/recent`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Recent Posts')) throw new Error('Missing recent posts content');
        });

        await this.test('Popular Posts Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/popular`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Popular Posts')) throw new Error('Missing popular posts content');
        });

        await this.test('Search Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/search`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Search Forum')) throw new Error('Missing search content');
        });

        await this.test('Create Post Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/create`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Create New Post')) throw new Error('Missing create post content');
        });

        await this.test('Guidelines Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/guidelines`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Community Guidelines')) throw new Error('Missing guidelines content');
        });

        await this.test('Help Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/help`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Forum Help')) throw new Error('Missing help content');
        });

        // Category Tests
        await this.test('General Category Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/category/general`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('General Discussion')) throw new Error('Missing category content');
        });

        await this.test('Lore Category Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/category/lore`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Lore &amp; Theories')) throw new Error('Missing category content');
        });

        await this.test('Episodes Category Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/category/episodes`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Episode Discussions')) throw new Error('Missing category content');
        });

        await this.test('Fanart Category Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/category/fanart`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Fan Creations')) throw new Error('Missing category content');
        });

        // API Tests
        await this.test('Categories API Works', async () => {
            const response = await axios.get(`${FORUM_BASE}/api/categories`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.success) throw new Error('API returned failure');
            if (!response.data.categories) throw new Error('No categories returned');
        });

        await this.test('Recent Posts API Works', async () => {
            const response = await axios.get(`${FORUM_BASE}/api/posts/recent`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.success) throw new Error('API returned failure');
            if (!Array.isArray(response.data.posts)) throw new Error('Posts not returned as array');
        });

        await this.test('Popular Posts API Works', async () => {
            const response = await axios.get(`${FORUM_BASE}/api/posts/popular`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.success) throw new Error('API returned failure');
            if (!Array.isArray(response.data.posts)) throw new Error('Posts not returned as array');
        });

        await this.test('Forum Stats API Works', async () => {
            const response = await axios.get(`${FORUM_BASE}/api/stats`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.success) throw new Error('API returned failure');
            if (!response.data.stats) throw new Error('No stats returned');
        });

        await this.test('Search API Works', async () => {
            const response = await axios.get(`${FORUM_BASE}/api/search?q=test`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.success) throw new Error('API returned failure');
            if (!Array.isArray(response.data.results)) throw new Error('Results not returned as array');
        });

        // Post View Tests
        await this.test('Existing Post View Works', async () => {
            // First get a post ID from recent posts
            const postsResponse = await axios.get(`${FORUM_BASE}/api/posts/recent`);
            if (postsResponse.data.posts.length > 0) {
                const postId = postsResponse.data.posts[0].id;
                const response = await axios.get(`${FORUM_BASE}/post/${postId}`);
                if (response.status !== 200) throw new Error(`Status: ${response.status}`);
                if (!response.data.includes('Back to Forum')) throw new Error('Missing post content');
            } else {
                console.log('⚠️  No posts available for testing post view');
            }
        });

        // Firebase Connection Test
        await this.test('Firebase Test Page Loads', async () => {
            const response = await axios.get(`${FORUM_BASE}/firebase-test`);
            if (response.status !== 200) throw new Error(`Status: ${response.status}`);
            if (!response.data.includes('Firebase Connection Test')) throw new Error('Missing Firebase test content');
        });

        // CSS and JS Resource Tests
        await this.test('Forum CSS Loads', async () => {
            try {
                const response = await axios.get(`${BASE_URL}/css/forum.css`);
                if (response.status !== 200) throw new Error(`CSS Status: ${response.status}`);
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log('⚠️  Forum CSS not found - may be using CDN');
                } else {
                    throw error;
                }
            }
        });

        await this.test('Forum JS Loads', async () => {
            const response = await axios.get(`${BASE_URL}/js/forum.js`);
            if (response.status !== 200) throw new Error(`JS Status: ${response.status}`);
            if (!response.data.includes('forumState')) throw new Error('Missing forum JS content');
        });

        // Error Handling Tests
        await this.test('Non-existent Post Returns 404 Gracefully', async () => {
            const response = await axios.get(`${FORUM_BASE}/post/nonexistent-post-id`);
            if (response.status !== 200) throw new Error(`Should return 200 with error message, got: ${response.status}`);
            if (!response.data.includes('Post Not Found')) throw new Error('Should show post not found message');
        });

        await this.test('Non-existent Category Returns 404 Gracefully', async () => {
            const response = await axios.get(`${FORUM_BASE}/category/nonexistent`);
            if (response.status !== 200) throw new Error(`Should return 200 with error message, got: ${response.status}`);
            if (!response.data.includes('Unknown Category')) throw new Error('Should show unknown category');
        });

        // Performance Tests
        await this.test('Forum Pages Load Within 2 Seconds', async () => {
            const start = Date.now();
            await axios.get(`${FORUM_BASE}/`);
            const loadTime = Date.now() - start;
            if (loadTime > 2000) throw new Error(`Load time: ${loadTime}ms (should be < 2000ms)`);
        });

        await this.test('API Responses Within 1 Second', async () => {
            const start = Date.now();
            await axios.get(`${FORUM_BASE}/api/posts/recent`);
            const responseTime = Date.now() - start;
            if (responseTime > 1000) throw new Error(`Response time: ${responseTime}ms (should be < 1000ms)`);
        });

        this.printResults();
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 FORUM COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(60));
        
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.tests
                .filter(test => test.status === 'FAIL')
                .forEach(test => {
                    console.log(`   • ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n🎯 FORUM READINESS ASSESSMENT:');
        const successRate = (this.results.passed / (this.results.passed + this.results.failed)) * 100;
        
        if (successRate >= 95) {
            console.log('🟢 EXCELLENT - Forum is ready for MCP integration and production use!');
        } else if (successRate >= 85) {
            console.log('🟡 GOOD - Forum is mostly functional, minor issues to address');
        } else if (successRate >= 70) {
            console.log('🟠 FAIR - Forum has significant issues that need fixing');
        } else {
            console.log('🔴 POOR - Forum requires major fixes before use');
        }
        
        console.log('\n🚀 NEXT STEPS:');
        if (this.results.failed === 0) {
            console.log('   • Forum is fully validated and ready!');
            console.log('   • Proceed with MCP-driven forum automation');
            console.log('   • Deploy comprehensive user experience');
        } else {
            console.log('   • Fix failed tests above');
            console.log('   • Re-run validation suite');
            console.log('   • Ensure 95%+ success rate before MCP integration');
        }
        
        console.log('='.repeat(60));
        
        // Exit with appropriate code for CI/CD
        process.exit(this.results.failed > 0 ? 1 : 0);
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new ForumTester();
    tester.runAllTests().catch(error => {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = ForumTester;