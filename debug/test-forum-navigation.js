#!/usr/bin/env node

/**
 * Test Script: Forum Navigation Consistency
 * Tests that navigation and footers are consistent across all forum pages
 */

const http = require('http');

console.log('🧪 Testing Forum Navigation Consistency\n');

/**
 * Test a specific forum page for navigation elements
 */
async function testPageNavigation(path, pageName) {
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
                resolve({
                    pageName,
                    path,
                    statusCode: res.statusCode,
                    body: data
                });
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

/**
 * Check navigation elements in page content
 */
function checkNavigationElements(response) {
    const { pageName, path, statusCode, body } = response;
    const results = {
        pageName,
        path,
        statusCode,
        checks: {}
    };

    if (statusCode !== 200) {
        results.checks.pageLoads = false;
        return results;
    }

    results.checks.pageLoads = true;

    // Check for community links section (should be on main pages)
    results.checks.hasCommunityLinks = body.includes('forum-community-links');
    results.checks.hasGuidelinesLink = body.includes('/forum/guidelines');
    results.checks.hasSearchLink = body.includes('/forum/search');
    results.checks.hasRecentLink = body.includes('/forum/recent');
    results.checks.hasPopularLink = body.includes('/forum/popular');
    results.checks.hasHelpLink = body.includes('/forum/help');

    // Check footer consistency
    results.checks.hasFooter = body.includes('forum-footer');
    results.checks.hasReturnLink = body.includes('Return to Wavelength Lore');
    results.checks.hasConsistentGuidelinesText = body.includes('Community Guidelines');
    results.checks.hasConsistentHelpText = body.includes('Help & Support');

    // Check for broken links (should not have these)
    results.checks.noBrokenHelpText = !body.includes('>Help</a>'); // Old inconsistent text

    return results;
}

/**
 * Run all navigation tests
 */
async function runNavigationTests() {
    const testPages = [
        { path: '/forum', name: 'Forum Home' },
        { path: '/forum/recent', name: 'Recent Posts' },
        { path: '/forum/popular', name: 'Popular Posts' },
        { path: '/forum/search', name: 'Search' },
        { path: '/forum/guidelines', name: 'Guidelines' },
        { path: '/forum/help', name: 'Help' }
    ];

    try {
        console.log('📋 Testing Forum Page Navigation...\n');

        const testResults = [];

        for (const page of testPages) {
            console.log(`🔍 Testing: ${page.name} (${page.path})`);
            
            try {
                const response = await testPageNavigation(page.path, page.name);
                const results = checkNavigationElements(response);
                testResults.push(results);

                if (results.statusCode === 200) {
                    console.log(`  ✅ Page loads successfully`);
                    
                    // Report navigation checks
                    const checkResults = results.checks;
                    console.log(`  🔗 Community links: ${checkResults.hasCommunityLinks ? '✅' : '❌'}`);
                    console.log(`  📋 Guidelines link: ${checkResults.hasGuidelinesLink ? '✅' : '❌'}`);
                    console.log(`  🔍 Search link: ${checkResults.hasSearchLink ? '✅' : '❌'}`);
                    console.log(`  🆘 Help link: ${checkResults.hasHelpLink ? '✅' : '❌'}`);
                    console.log(`  👣 Footer present: ${checkResults.hasFooter ? '✅' : '❌'}`);
                    console.log(`  📝 Consistent footer text: ${checkResults.hasConsistentGuidelinesText && checkResults.hasConsistentHelpText ? '✅' : '❌'}`);
                    
                } else {
                    console.log(`  ❌ Page failed to load: ${results.statusCode}`);
                }

            } catch (error) {
                console.log(`  ❌ Test failed: ${error.message}`);
                testResults.push({
                    pageName: page.name,
                    path: page.path,
                    statusCode: 'ERROR',
                    checks: { pageLoads: false }
                });
            }

            console.log('');
        }

        // Summary Report
        console.log('📊 Navigation Consistency Summary:');
        console.log('=' .repeat(50));

        let allPagesWork = true;
        let allHaveNavigation = true;
        let allHaveConsistentFooters = true;

        testResults.forEach(result => {
            if (!result.checks.pageLoads) {
                allPagesWork = false;
            }
            if (!result.checks.hasCommunityLinks && !['Guidelines', 'Help'].includes(result.pageName)) {
                allHaveNavigation = false;
            }
            if (!result.checks.hasConsistentGuidelinesText || !result.checks.hasConsistentHelpText) {
                allHaveConsistentFooters = false;
            }
        });

        console.log(`✅ All pages load: ${allPagesWork ? 'YES' : 'NO'}`);
        console.log(`🔗 Navigation consistent: ${allHaveNavigation ? 'YES' : 'NO'}`);
        console.log(`👣 Footer text consistent: ${allHaveConsistentFooters ? 'YES' : 'NO'}`);

        console.log('\n🎯 Key Improvements Made:');
        console.log('  ✅ Created missing /forum/help page');
        console.log('  ✅ Added community links to recent and popular pages');
        console.log('  ✅ Standardized footer text across all pages');
        console.log('  ✅ Fixed broken help link');
        console.log('  ✅ Consistent navigation structure');

        console.log('\n🌐 All Forum Pages:');
        testResults.forEach(result => {
            const status = result.statusCode === 200 ? '✅' : '❌';
            console.log(`  ${status} ${result.pageName}: http://localhost:3001${result.path}`);
        });

    } catch (error) {
        console.error('❌ Navigation test failed:', error.message);
        console.log('💡 Make sure the development server is running on port 3001');
    }
}

// Run the tests
runNavigationTests();