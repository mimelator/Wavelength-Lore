#!/usr/bin/env node

/**
 * Quick Forum Status Check
 * Fast validation without browser automation
 */

const http = require('http');

async function checkForumStatus() {
    console.log('🚀 Quick Forum Status Check...\n');
    
    const tests = [
        { name: 'Forum Home Page', path: '/forum' },
        { name: 'Recent Posts API', path: '/forum/api/posts/recent?limit=3' },
        { name: 'Forum Stats API', path: '/forum/api/stats' },
        { name: 'Categories API', path: '/forum/api/categories' }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await makeRequest(test.path);
            const success = result.statusCode === 200;
            
            let details = '';
            if (test.path.includes('api/posts/recent')) {
                try {
                    const data = JSON.parse(result.data);
                    details = `${data.posts?.length || 0} posts found`;
                } catch (e) {
                    details = 'Invalid JSON response';
                }
            } else if (test.path.includes('api/stats')) {
                try {
                    const data = JSON.parse(result.data);
                    details = `${data.stats?.totalPosts || 0} total posts, ${data.stats?.totalUsers || 0} users`;
                } catch (e) {
                    details = 'Invalid JSON response';
                }
            } else if (test.path === '/forum') {
                details = `${result.data.length} bytes HTML`;
            }
            
            results.push({
                name: test.name,
                success,
                status: result.statusCode,
                details
            });
            
            console.log(`${success ? '✅' : '❌'} ${test.name}: ${result.statusCode} - ${details}`);
            
        } catch (error) {
            results.push({
                name: test.name,
                success: false,
                error: error.message
            });
            console.log(`❌ ${test.name}: ${error.message}`);
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    console.log(`\n📊 FORUM STATUS SUMMARY:`);
    console.log(`✅ Passed: ${successCount}/${totalTests}`);
    console.log(`📈 Success Rate: ${Math.round((successCount/totalTests) * 100)}%`);
    
    if (successCount === totalTests) {
        console.log(`🎯 STATUS: ✅ FORUM FULLY OPERATIONAL`);
        console.log(`🚀 Ready for visual testing and production use!`);
    } else {
        console.log(`🎯 STATUS: ⚠️ ISSUES DETECTED`);
        console.log(`🔧 Check failed endpoints and server status`);
    }
    
    // Auto-exit to prevent hanging
    process.exit(successCount === totalTests ? 0 : 1);
}

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: data
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.setTimeout(5000);
        req.end();
    });
}

if (require.main === module) {
    checkForumStatus().catch(error => {
        console.error('❌ Status check failed:', error.message);
        process.exit(1);
    });
}

module.exports = { checkForumStatus };