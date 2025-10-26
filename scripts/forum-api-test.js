#!/usr/bin/env node

/**
 * Simple Forum API Test
 * Tests if the forum API endpoints are working
 */

const http = require('http');

function testAPI(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data.substring(0, 200) });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Forum API Endpoints...\n');

    const tests = [
        '/forum/api/posts/recent',
        '/forum/api/stats',
        '/forum/api/categories'
    ];

    for (const endpoint of tests) {
        try {
            console.log(`📡 Testing ${endpoint}...`);
            const result = await testAPI(endpoint);
            console.log(`✅ Status: ${result.status}`);
            
            if (result.data && result.data.posts) {
                console.log(`📊 Posts found: ${result.data.posts.length}`);
                if (result.data.posts.length > 0) {
                    console.log(`📝 First post: "${result.data.posts[0].title}"`);
                }
            } else if (result.data && result.data.stats) {
                console.log(`📊 Stats: ${result.data.stats.totalPosts} posts, ${result.data.stats.totalUsers} users`);
            }
            console.log('');
        } catch (error) {
            console.log(`❌ Error: ${error.message}\n`);
        }
    }
}

runTests().catch(console.error);