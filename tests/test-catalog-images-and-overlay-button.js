#!/usr/bin/env node

/**
 * Test: Catalog Images and Overlay Button
 * 
 * Tests that:
 * 1. Product cards have preview images
 * 2. Add Overlay button exists on each card
 */

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'http://localhost:3001';
const CATALOG_URL = `${BASE_URL}/admin/vendor-research/catalog`;

async function testImagesAndOverlay() {
  console.log('\n🧪 TEST: Catalog Images and Overlay Button\n');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  try {
    const response = await axios.get(CATALOG_URL);
    const $ = cheerio.load(response.data);
    
    const productCards = $('.product-card, .preview-card');
    console.log(`\nFound ${productCards.length} product cards\n`);

    if (productCards.length === 0) {
      console.log('❌ FAIL: No product cards found');
      process.exit(1);
    }

    // TEST 1: Images on cards
    console.log('TEST 1: Preview Images');
    console.log('-'.repeat(80));
    
    let cardsWithImages = 0;
    
    productCards.each((i, card) => {
      const $card = $(card);
      const img = $card.find('img').first();
      const imgSrc = img.attr('src');
      
      if (imgSrc) {
        cardsWithImages++;
        console.log(`Card ${i + 1}: ✅ Has image (${imgSrc.substring(0, 50)}...)`);
      } else {
        console.log(`Card ${i + 1}: ❌ NO IMAGE`);
      }
    });
    
    if (cardsWithImages === productCards.length) {
      console.log(`\n✅ PASS: All ${productCards.length} cards have images`);
      passed++;
    } else {
      console.log(`\n❌ FAIL: Only ${cardsWithImages}/${productCards.length} cards have images`);
      failed++;
    }

    // TEST 2: Add Overlay button
    console.log('\n\nTEST 2: Add Overlay Button');
    console.log('-'.repeat(80));
    
    let cardsWithOverlayButton = 0;
    
    productCards.each((i, card) => {
      const $card = $(card);
      const overlayBtn = $card.find('button:contains("Overlay"), a:contains("Overlay")').first();
      
      if (overlayBtn.length > 0) {
        cardsWithOverlayButton++;
        console.log(`Card ${i + 1}: ✅ Has Overlay button`);
      } else {
        console.log(`Card ${i + 1}: ❌ NO Overlay button`);
      }
    });
    
    if (cardsWithOverlayButton === productCards.length) {
      console.log(`\n✅ PASS: All ${productCards.length} cards have Overlay button`);
      passed++;
    } else {
      console.log(`\n❌ FAIL: Only ${cardsWithOverlayButton}/${productCards.length} cards have Overlay button`);
      failed++;
    }

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed\n`);
  
  process.exit(failed > 0 ? 1 : 0);
}

testImagesAndOverlay();
