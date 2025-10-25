#!/usr/bin/env node
/**
 * Vendor Catalog Browser Test
 * Tests the admin vendor catalog interface and analyzes product variations
 */

const puppeteer = require('puppeteer');

async function testVendorCatalogBrowser() {
    console.log('🧪 VENDOR CATALOG BROWSER TEST');
    console.log('==============================\n');

    let browser;
    let page;

    try {
        // Launch browser
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Show browser for visual inspection
            defaultViewport: { width: 1400, height: 900 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        
        // Navigate to vendor catalog
        console.log('📋 Navigating to vendor catalog...');
        await page.goto('http://localhost:3001/admin/vendor-catalog', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for products to load
        await page.waitForSelector('.products-grid', { timeout: 10000 });
        console.log('✅ Catalog page loaded');

        // Get total product count
        const totalProducts = await page.evaluate(() => {
            const statsCard = document.querySelector('.stat-card .stat-number');
            return statsCard ? parseInt(statsCard.textContent) : 0;
        });
        console.log(`📊 Total products found: ${totalProducts}`);

        // Analyze product variations
        console.log('\n🔍 ANALYZING PRODUCT VARIATIONS');
        console.log('===============================');

        const productAnalysis = await page.evaluate(() => {
            const products = Array.from(document.querySelectorAll('.product-card'));
            const analysis = {
                totalProducts: products.length,
                blueprintTypes: new Set(),
                providerTypes: new Set(),
                titles: new Set(),
                productTypes: new Set(),
                sampleProducts: []
            };

            products.forEach((product, index) => {
                // Extract blueprint info
                const blueprintText = product.querySelector('.product-meta:nth-child(3)')?.textContent || '';
                const blueprintMatch = blueprintText.match(/Product Type:\s*(.+)/);
                if (blueprintMatch) {
                    analysis.blueprintTypes.add(blueprintMatch[1].trim());
                }

                // Extract provider info
                const providerText = product.querySelector('.product-meta:nth-child(4)')?.textContent || '';
                const providerMatch = providerText.match(/Print Provider:\s*(.+)/);
                if (providerMatch) {
                    analysis.providerTypes.add(providerMatch[1].trim());
                }

                // Extract title
                const title = product.querySelector('.product-title')?.textContent?.trim() || '';
                analysis.titles.add(title);

                // Extract product ID
                const productId = product.querySelector('.product-meta:first-child')?.textContent?.replace('Product ID:', '').trim() || '';

                // Store sample for detailed analysis
                if (index < 10) {
                    analysis.sampleProducts.push({
                        index: index + 1,
                        title,
                        productId,
                        blueprint: blueprintMatch ? blueprintMatch[1].trim() : 'Unknown',
                        provider: providerMatch ? providerMatch[1].trim() : 'Unknown'
                    });
                }
            });

            // Convert Sets to Arrays for JSON serialization
            analysis.blueprintTypes = Array.from(analysis.blueprintTypes);
            analysis.providerTypes = Array.from(analysis.providerTypes);
            analysis.titles = Array.from(analysis.titles);

            return analysis;
        });

        // Display analysis results
        console.log(`📦 Products displayed: ${productAnalysis.totalProducts}`);
        console.log(`🎨 Blueprint types: ${productAnalysis.blueprintTypes.length}`);
        console.log(`🏭 Provider types: ${productAnalysis.providerTypes.length}`);
        console.log(`📝 Unique titles: ${productAnalysis.titles.length}`);

        console.log('\n📋 BLUEPRINT TYPES FOUND:');
        productAnalysis.blueprintTypes.forEach((type, i) => {
            console.log(`  ${i + 1}. ${type}`);
        });

        console.log('\n🏭 PROVIDER TYPES FOUND:');
        productAnalysis.providerTypes.forEach((type, i) => {
            console.log(`  ${i + 1}. ${type}`);
        });

        console.log('\n📝 UNIQUE TITLES FOUND:');
        productAnalysis.titles.forEach((title, i) => {
            console.log(`  ${i + 1}. "${title}"`);
        });

        console.log('\n🔍 SAMPLE PRODUCTS (First 10):');
        productAnalysis.sampleProducts.forEach(product => {
            console.log(`  ${product.index}. ${product.title}`);
            console.log(`     ID: ${product.productId}`);
            console.log(`     Type: ${product.blueprint}`);
            console.log(`     Provider: ${product.provider}`);
            console.log('');
        });

        // Final summary
        console.log('\n📊 FINAL ANALYSIS SUMMARY');
        console.log('=========================');
        console.log(`Total Products: ${productAnalysis.totalProducts}`);
        console.log(`Blueprint Variety: ${productAnalysis.blueprintTypes.length} types`);
        console.log(`Provider Variety: ${productAnalysis.providerTypes.length} providers`);
        console.log(`Title Variety: ${productAnalysis.titles.length} unique titles`);
        
        // Identify the issue
        if (productAnalysis.blueprintTypes.length <= 3) {
            console.log('\n⚠️ ISSUE IDENTIFIED:');
            console.log('Limited blueprint variety - most products are T-shirts!');
            console.log('This confirms vendor compatibility is forcing fallback to T-shirt blueprints.');
        }
        
        if (productAnalysis.titles.length === 1) {
            console.log('\n⚠️ ISSUE IDENTIFIED:');
            console.log('All products have the same generic title "Vendor Preview"!');
            console.log('Enhanced titles from the generator are not being applied.');
        }

        if (productAnalysis.providerTypes.length === 1) {
            console.log('\n⚠️ ISSUE IDENTIFIED:');
            console.log('All products use the same provider (Monster Digital)!');
            console.log('This explains why mugs/posters become T-shirts - vendor 3 only supports apparel.');
        }

        console.log('\n✅ Browser test completed successfully');
        console.log('🔗 Catalog URL: http://localhost:3001/admin/vendor-catalog');

        // Keep browser open for inspection
        console.log('\n👁️ Browser left open for manual inspection');
        console.log('Press Ctrl+C to close when done');
        
        // Wait for manual close
        await new Promise(() => {});

    } catch (error) {
        console.error('❌ Browser test failed:', error.message);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testVendorCatalogBrowser()
        .catch(error => {
            console.error('💥 Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = testVendorCatalogBrowser;