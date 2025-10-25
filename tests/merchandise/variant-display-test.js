#!/usr/bin/env node

/**
 * Variant Display Test - Compact Summary + Modal System
 * Tests if variant display is working as expected
 */

const puppeteer = require('puppeteer');

async function testVariantDisplay() {
    console.log('🧪 Testing Merchandise Variant Display System\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    try {
        console.log('📍 Loading merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for existing products with variants
        console.log('🔍 Checking for products with variant display...');
        const productStatus = await page.evaluate(() => {
            const products = document.querySelectorAll('.product-card');
            const variantSummaries = document.querySelectorAll('.variant-summary');
            const viewVariantsBtns = document.querySelectorAll('.view-variants-btn');
            
            return {
                productCount: products.length,
                variantSummaryCount: variantSummaries.length,
                viewVariantsBtnCount: viewVariantsBtns.length,
                hasCompactDisplay: variantSummaries.length > 0
            };
        });
        
        console.log('📊 Current Status:');
        console.log(`   Products: ${productStatus.productCount}`);
        console.log(`   Variant Summaries: ${productStatus.variantSummaryCount}`);
        console.log(`   View Variants Buttons: ${productStatus.viewVariantsBtnCount}`);
        console.log(`   Compact Display: ${productStatus.hasCompactDisplay ? '✅' : '❌'}`);
        
        if (productStatus.productCount === 0) {
            console.log('\n⚠️ No products found. Testing variant display creation...');
            
            // Try to create a product to test variant display
            const imageSelected = await page.evaluate(() => {
                const selectBtn = document.querySelector('.gallery-image-select');
                if (selectBtn) {
                    selectBtn.click();
                    return true;
                }
                return false;
            });
            
            if (imageSelected) {
                console.log('🖼️ Image selected, waiting for navigator...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try to select a product type
                const productSelected = await page.evaluate(() => {
                    const productBtn = document.querySelector('.select-product-btn, .select-simple-product');
                    if (productBtn) {
                        productBtn.click();
                        return true;
                    }
                    return false;
                });
                
                if (productSelected) {
                    console.log('🎽 Product type selected, checking for customization modal...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        // Test variant modal functionality if products exist
        if (productStatus.viewVariantsBtnCount > 0) {
            console.log('\n🧪 Testing variant modal functionality...');
            
            const modalTest = await page.evaluate(() => {
                const viewBtn = document.querySelector('.view-variants-btn');
                if (viewBtn) {
                    viewBtn.click();
                    return true;
                }
                return false;
            });
            
            if (modalTest) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const modalStatus = await page.evaluate(() => {
                    const modal = document.querySelector('.variants-modal');
                    const variantCards = document.querySelectorAll('.compact-variant-card');
                    
                    return {
                        modalVisible: !!modal && modal.style.display !== 'none',
                        variantCardCount: variantCards.length
                    };
                });
                
                console.log(`   Modal Visible: ${modalStatus.modalVisible ? '✅' : '❌'}`);
                console.log(`   Variant Cards: ${modalStatus.variantCardCount}`);
            }
        }
        
        // Check CSS for compact variant styles
        console.log('\n🎨 Checking CSS implementation...');
        const cssStatus = await page.evaluate(() => {
            const styles = Array.from(document.styleSheets).flatMap(sheet => {
                try {
                    return Array.from(sheet.cssRules).map(rule => rule.cssText);
                } catch (e) {
                    return [];
                }
            });
            
            const hasVariantSummaryStyles = styles.some(rule => 
                rule.includes('.variant-summary') || rule.includes('variant-count')
            );
            const hasCompactVariantStyles = styles.some(rule => 
                rule.includes('.compact-variant-card') || rule.includes('compact-variants-grid')
            );
            
            return {
                hasVariantSummaryStyles,
                hasCompactVariantStyles
            };
        });
        
        console.log(`   Variant Summary Styles: ${cssStatus.hasVariantSummaryStyles ? '✅' : '❌'}`);
        console.log(`   Compact Variant Styles: ${cssStatus.hasCompactVariantStyles ? '✅' : '❌'}`);
        
        // Check for duplicate form field IDs
        console.log('\n🔍 Checking for duplicate form field IDs...');
        const duplicateIds = await page.evaluate(() => {
            const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
            return [...new Set(duplicates)];
        });
        
        console.log(`   Duplicate IDs Found: ${duplicateIds.length > 0 ? '❌' : '✅'}`);
        if (duplicateIds.length > 0) {
            console.log(`   Duplicates: ${duplicateIds.join(', ')}`);
        }
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'variant-display-test-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: variant-display-test-proof.png');
        
        const success = productStatus.hasCompactDisplay && 
                       cssStatus.hasVariantSummaryStyles;
        
        console.log(`\n${success ? '✅' : '❌'} Variant Display Test ${success ? 'PASSED' : 'FAILED'}`);
        
        if (!success) {
            console.log('\n🔧 Issues Found:');
            if (!productStatus.hasCompactDisplay) {
                console.log('   - No compact variant display found');
            }
            if (!cssStatus.hasVariantSummaryStyles) {
                console.log('   - Missing variant summary CSS styles');
            }
        }
        
        // Keep browser open for 5 seconds
        console.log('\n⏳ Keeping browser open for 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return success;
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

// Run test if called directly
if (require.main === module) {
    testVariantDisplay()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testVariantDisplay };