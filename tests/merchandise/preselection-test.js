#!/usr/bin/env node

/**
 * Preselection Test - Test duplicate form field IDs in preselection scenario
 */

const puppeteer = require('puppeteer');

async function testPreselection() {
    console.log('🧪 Testing Preselection Scenario for Duplicate Form Field IDs\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    try {
        console.log('📍 Loading merchandise page with preselection...');
        await page.goto('http://localhost:3001/merchandise?preselect=test-image.jpg', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for duplicate IDs immediately after preselection
        const initialDuplicates = await page.evaluate(() => {
            const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
            return [...new Set(duplicates)];
        });
        
        console.log(`Initial Preselection - Duplicate IDs: ${initialDuplicates.length > 0 ? '❌' : '✅'}`);
        if (initialDuplicates.length > 0) {
            console.log(`Duplicates: ${initialDuplicates.join(', ')}`);
        }
        
        // Wait for product navigator to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check for duplicates after navigator initialization
        const postNavDuplicates = await page.evaluate(() => {
            const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
            return [...new Set(duplicates)];
        });
        
        console.log(`Post-Navigator - Duplicate IDs: ${postNavDuplicates.length > 0 ? '❌' : '✅'}`);
        if (postNavDuplicates.length > 0) {
            console.log(`Duplicates: ${postNavDuplicates.join(', ')}`);
        }
        
        // Try to trigger product selection
        const productSelected = await page.evaluate(() => {
            const productBtn = document.querySelector('.select-product-btn, .select-simple-product');
            if (productBtn) {
                productBtn.click();
                return true;
            }
            return false;
        });
        
        if (productSelected) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check for duplicates after product selection
            const postSelectionDuplicates = await page.evaluate(() => {
                const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
                const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
                
                // Get form field details with specific focus on size/color fields
                const formFields = Array.from(document.querySelectorAll('select, input')).map(el => ({
                    id: el.id,
                    name: el.name,
                    tagName: el.tagName.toLowerCase(),
                    className: el.className
                }));
                
                // Check specifically for productSize/productColor duplicates
                const sizeFields = formFields.filter(f => f.id === 'productSize' || f.name === 'productSize');
                const colorFields = formFields.filter(f => f.id === 'productColor' || f.name === 'productColor');
                
                return {
                    duplicates: [...new Set(duplicates)],
                    formFields: formFields,
                    sizeFieldCount: sizeFields.length,
                    colorFieldCount: colorFields.length,
                    sizeFields: sizeFields,
                    colorFields: colorFields
                };
            });
            
            console.log(`Post-Selection - Duplicate IDs: ${postSelectionDuplicates.duplicates.length > 0 ? '❌' : '✅'}`);
            if (postSelectionDuplicates.duplicates.length > 0) {
                console.log(`Duplicates: ${postSelectionDuplicates.duplicates.join(', ')}`);
            }
            
            console.log('\n📋 Form Field Analysis:');
            console.log(`  Size Fields: ${postSelectionDuplicates.sizeFieldCount} (should be 1)`);
            console.log(`  Color Fields: ${postSelectionDuplicates.colorFieldCount} (should be 1)`);
            
            if (postSelectionDuplicates.sizeFieldCount > 1) {
                console.log('  ❌ DUPLICATE SIZE FIELDS:');
                postSelectionDuplicates.sizeFields.forEach((field, i) => {
                    console.log(`    ${i+1}. ${field.tagName}: id="${field.id}", name="${field.name}", class="${field.className}"`);
                });
            }
            
            if (postSelectionDuplicates.colorFieldCount > 1) {
                console.log('  ❌ DUPLICATE COLOR FIELDS:');
                postSelectionDuplicates.colorFields.forEach((field, i) => {
                    console.log(`    ${i+1}. ${field.tagName}: id="${field.id}", name="${field.name}", class="${field.className}"`);
                });
            }
        }
        
        // Take screenshot for proof
        await page.screenshot({ 
            path: 'preselection-test-proof.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved: preselection-test-proof.png');
        
        console.log('\n⏳ Keeping browser open for 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        let hasIssues = initialDuplicates.length > 0 || postNavDuplicates.length > 0;
        
        if (productSelected && typeof postSelectionDuplicates !== 'undefined') {
            hasIssues = hasIssues || postSelectionDuplicates.duplicates.length > 0 ||
                       postSelectionDuplicates.sizeFieldCount > 1 ||
                       postSelectionDuplicates.colorFieldCount > 1;
        }
        
        return !hasIssues;
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testPreselection()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testPreselection };