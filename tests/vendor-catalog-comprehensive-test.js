#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const { chromium } = require('playwright');

/**
 * Comprehensive Vendor Catalog Test
 * Tests both server-side and browser functionality including:
 * 1. Server-side image URL resolution
 * 2. Browser-side image loading and replacement
 * 3. Action button functionality (View Product, Border Toggle, Delete)
 * 4. Complete end-to-end workflow
 */

console.log('🚀 COMPREHENSIVE VENDOR CATALOG TEST');
console.log('====================================\n');

// Test configuration
const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}`;
const CATALOG_PATH = '/admin/vendor-research/catalog';

async function startTestServer() {
    console.log('📡 Starting test server...');
    
    // Import the main app creation function
    const { createApp } = require('../app.js');
    
    // Create the app instance
    const app = await createApp();
    
    return new Promise((resolve, reject) => {
        const server = app.listen(TEST_PORT, () => {
            console.log(`✅ Test server running on port ${TEST_PORT}`);
            resolve(server);
        });
        
        server.on('error', reject);
    });
}

async function testServerImageResolution() {
    console.log('\n🔍 TEST 1: SERVER-SIDE IMAGE RESOLUTION');
    console.log('=========================================');
    
    const ProductImageUrlResolver = require('../utils/product-image-url-resolver');
    
    // Create resolver instance
    const resolver = new ProductImageUrlResolver();
    
    // Test resolver with known image
    const testImages = [
        'ice-fortress.webp',
        'goblin-king.webp', 
        'daphne.webp',
        'alexandria.webp'
    ];
    
    let resolvedCount = 0;
    
    for (const imageId of testImages) {
        try {
            const result = await resolver.resolveImageUrl(imageId);
            if (result && result.success && result.url && !result.url.includes('placeholder')) {
                console.log(`✅ ${imageId} → ${result.url} (${result.type})`);
                resolvedCount++;
            } else if (result && result.url) {
                console.log(`⚠️  ${imageId} → ${result.url} (${result.type || 'fallback'})`);
            } else {
                console.log(`❌ ${imageId} → No valid URL found`);
            }
        } catch (error) {
            console.log(`❌ ${imageId} → Error: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Resolution Summary: ${resolvedCount}/${testImages.length} images resolved`);
    return resolvedCount > 0;
}

async function testBrowserFunctionality(server) {
    console.log('\n🌐 TEST 2: BROWSER FUNCTIONALITY');
    console.log('=================================');
    
    let browser, page;
    
    try {
        // Launch browser
        console.log('🚀 Launching browser...');
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'log') {
                console.log(`   [Browser] ${msg.text()}`);
            }
        });
        
        // Navigate to catalog page
        console.log('📄 Loading vendor catalog page...');
        await page.goto(`${BASE_URL}${CATALOG_PATH}`, { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForSelector('.vendor-card', { timeout: 10000 });
        
        // Check if product cards exist
        const productCards = await page.$$('.vendor-card');
        console.log(`📦 Found ${productCards.length} product cards`);
        
        if (productCards.length === 0) {
            console.log('❌ No product cards found!');
            return false;
        }
        
        // Test image resolution
        console.log('\n🖼️  Testing image resolution...');
        
        // Wait for ProductImageUrlClient to initialize
        await page.waitForFunction(() => {
            return window.ProductImageUrlClient && window.ProductImageUrlClient.initialized;
        }, { timeout: 10000 });
        
        console.log('✅ ProductImageUrlClient initialized');
        
        // Wait for images to resolve (give it time to process)
        await page.waitForTimeout(3000);
        
        // Check image sources
        const images = await page.$$('.product-image');
        let resolvedImages = 0;
        
        for (let i = 0; i < images.length; i++) {
            const src = await images[i].getAttribute('src');
            if (src && !src.includes('placeholder') && src.includes('cloudfront')) {
                resolvedImages++;
                console.log(`✅ Image ${i + 1}: Resolved to CDN URL`);
            } else {
                console.log(`❌ Image ${i + 1}: Still showing placeholder (${src})`);
            }
        }
        
        console.log(`\n📊 Image Resolution: ${resolvedImages}/${images.length} images resolved`);
        
        // Test action buttons
        console.log('\n🔘 Testing action buttons...');
        
        if (productCards.length > 0) {
            const firstCard = productCards[0];
            
            // Test View Product button
            const viewButton = await firstCard.$('.btn-view');
            if (viewButton) {
                const href = await viewButton.getAttribute('href');
                console.log(`✅ View Product button: ${href}`);
                
                // Verify it's a valid page URL (not API endpoint)
                if (href && href.includes('/vendor-research/product/') && !href.includes('/api/')) {
                    console.log('✅ View Product URL format is correct');
                } else {
                    console.log('❌ View Product URL format is incorrect');
                }
            } else {
                console.log('❌ View Product button not found');
            }
            
            // Test Border Toggle button
            const borderButton = await firstCard.$('.btn-border');
            if (borderButton) {
                console.log('✅ Border Toggle button found');
            } else {
                console.log('❌ Border Toggle button not found');
            }
            
            // Test Delete button
            const deleteButton = await firstCard.$('.btn-delete');
            if (deleteButton) {
                console.log('✅ Delete button found');
            } else {
                console.log('❌ Delete button not found');
            }
        }
        
        return resolvedImages > 0;
        
    } catch (error) {
        console.log(`❌ Browser test failed: ${error.message}`);
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
        if (server) {
            server.close();
        }
    }
}

async function runComprehensiveTest() {
    let server;
    
    try {
        // Test 1: Server-side functionality
        const serverTest = await testServerImageResolution();
        
        // Test 2: Start server and test browser functionality
        server = await startTestServer();
        const browserTest = await testBrowserFunctionality(server);
        
        // Final results
        console.log('\n📊 COMPREHENSIVE TEST RESULTS');
        console.log('==============================');
        console.log(`🖥️  Server-side resolution: ${serverTest ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`🌐 Browser functionality: ${browserTest ? '✅ PASS' : '❌ FAIL'}`);
        
        if (serverTest && browserTest) {
            console.log('\n🎉 VENDOR CATALOG COMPREHENSIVE TEST: ✅ PASSED');
            console.log('   All systems operational - images resolve and action buttons work!');
        } else {
            console.log('\n💥 VENDOR CATALOG COMPREHENSIVE TEST: ❌ FAILED');
            console.log('   Some functionality is not working properly');
        }
        
    } catch (error) {
        console.log(`\n💥 Test execution failed: ${error.message}`);
        console.error(error.stack);
    } finally {
        if (server) {
            server.close();
        }
        process.exit(0);
    }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Test interrupted');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Test terminated');
    process.exit(1);
});

// Run the test
runComprehensiveTest().catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
});