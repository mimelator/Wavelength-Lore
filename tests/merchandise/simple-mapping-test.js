#!/usr/bin/env node

/**
 * Simple Mapping Test - Focus on product type mapping issue
 */

const puppeteer = require('puppeteer');

async function testSimpleMapping() {
    console.log('🧪 Simple Product Type Mapping Test\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    // Only capture mapping-related logs
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Product selected from navigator') ||
            text.includes('Mapped product type') ||
            text.includes('showProductCustomizationModal') ||
            text.includes('productTypeName result')) {
            console.log(`🖥️ ${text}`);
        }
    });
    
    try {
        await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Quick navigation to pillow
        await page.evaluate(() => {
            const selectBtn = document.querySelector('.gallery-image-select');
            if (selectBtn) selectBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.evaluate(() => {
            const homeCategory = document.querySelector('[data-category="home"]');
            if (homeCategory) homeCategory.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.evaluate(() => {
            const pillowSubcategory = document.querySelector('[data-subcategory="bedding"]');
            if (pillowSubcategory) pillowSubcategory.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n🚀 Clicking pillow product...');
        
        await page.evaluate(() => {
            const selectBtn = document.querySelector('.select-product-btn');
            if (selectBtn) selectBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check final modal title
        const modalTitle = await page.evaluate(() => {
            const modal = document.querySelector('.product-customization-modal h2');
            return modal ? modal.textContent : 'No modal found';
        });
        
        console.log(`\n📋 Final Modal Title: "${modalTitle}"`);
        console.log(`   Contains 'pillow': ${modalTitle.toLowerCase().includes('pillow')}`);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return modalTitle.toLowerCase().includes('pillow');
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testSimpleMapping()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testSimpleMapping };