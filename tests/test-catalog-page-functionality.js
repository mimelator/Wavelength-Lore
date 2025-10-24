#!/usr/bin/env node

/**
 * Test: Catalog Page Full Functionality
 * 
 * USER REQUIREMENTS:
 * 1. Preview images MUST be visible on product cards (not broken)
 * 2. All buttons/links MUST go to valid HTML pages (NOT JSON feeds)
 * 3. Add Overlays button MUST exist
 * 4. Product cards MUST have complete structure
 */

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'http://localhost:3001';
const CATALOG_URL = `${BASE_URL}/admin/vendor-research/catalog`;

async function testCatalogPage() {
  console.log('\n🧪 CATALOG PAGE FUNCTIONALITY TEST\n');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  const errors = [];

  try {
    console.log(`\n📋 Fetching: ${CATALOG_URL}`);
    const response = await axios.get(CATALOG_URL);
    const $ = cheerio.load(response.data);
    const html = response.data;
    
    console.log(`✅ Page loaded (${html.length} bytes)\n`);

    // TEST 1: PREVIEW IMAGES ON CARDS
    console.log('TEST 1: Preview Images on Product Cards');
    console.log('-'.repeat(80));
    const productCards = $('.product-card');
    console.log(`Found ${productCards.length} product cards`);
    
    if (productCards.length === 0) {
      console.log('❌ FAIL: No product cards found');
      failed++;
      errors.push('No product cards on page');
    } else {
      let cardsWithImages = 0;
      let cardsWithBrokenImages = 0;
      
      for (let i = 0; i < productCards.length; i++) {
        const card = $(productCards[i]);
        const img = card.find('img').first();
        const dataSourceImg = card.find('[data-source-image]').first();
        const productImage = card.find('.product-image').first();
        
        const imgSrc = img.attr('src');
        const dataSrc = dataSourceImg.attr('data-source-image');
        
        console.log(`\nCard ${i + 1}:`);
        console.log(`  <img> tag: ${img.length > 0 ? 'YES' : 'NO'} ${imgSrc ? `(src="${imgSrc.substring(0, 60)}...")` : ''}`);
        console.log(`  [data-source-image]: ${dataSourceImg.length > 0 ? 'YES' : 'NO'} ${dataSrc ? `(${dataSrc.substring(0, 60)}...)` : ''}`);
        console.log(`  .product-image: ${productImage.length > 0 ? 'YES' : 'NO'}`);
        
        const imageSrc = imgSrc || dataSrc;
        
        if (imageSrc) {
          cardsWithImages++;
          
          // Test if image is accessible
          try {
            const imageUrl = imageSrc.startsWith('http') ? imageSrc : `${BASE_URL}${imageSrc}`;
            const imgResponse = await axios.head(imageUrl, { timeout: 5000 });
            
            if (imgResponse.status === 200) {
              console.log(`  ✅ Image accessible: ${imgResponse.headers['content-type']}`);
            } else {
              console.log(`  ❌ Image returns status ${imgResponse.status}`);
              cardsWithBrokenImages++;
            }
          } catch (err) {
            console.log(`  ❌ Image broken: ${err.message}`);
            cardsWithBrokenImages++;
          }
        } else {
          console.log(`  ❌ NO IMAGE FOUND`);
        }
      }
      
      if (cardsWithImages === 0) {
        console.log(`\n❌ FAIL: NO PREVIEW IMAGES on any product cards`);
        failed++;
        errors.push('No preview images on product cards');
      } else if (cardsWithBrokenImages > 0) {
        console.log(`\n❌ FAIL: ${cardsWithBrokenImages}/${cardsWithImages} images are broken`);
        failed++;
        errors.push(`${cardsWithBrokenImages} broken images`);
      } else {
        console.log(`\n✅ PASS: All ${cardsWithImages} cards have working preview images`);
        passed++;
      }
    }

    // TEST 2: ADD OVERLAYS BUTTON
    console.log('\n\nTEST 2: Add Overlays Button');
    console.log('-'.repeat(80));
    
    const overlayButtons = $('button:contains("Overlay"), a:contains("Overlay"), button:contains("overlay"), a:contains("overlay")');
    console.log(`Searching for buttons/links containing "Overlay"...`);
    console.log(`Found ${overlayButtons.length} elements`);
    
    overlayButtons.each((i, btn) => {
      const $btn = $(btn);
      console.log(`  ${i + 1}. <${btn.name}> "${$btn.text().trim()}"`);
    });
    
    if (overlayButtons.length > 0) {
      console.log(`\n✅ PASS: Add Overlays button exists`);
      passed++;
    } else {
      console.log(`\n❌ FAIL: Add Overlays button NOT FOUND`);
      failed++;
      errors.push('Add Overlays button missing');
    }

    // TEST 3: BUTTONS/LINKS GO TO VALID PAGES (NOT JSON)
    console.log('\n\nTEST 3: All Buttons/Links Go to Valid HTML Pages');
    console.log('-'.repeat(80));
    
    const allLinks = $('.product-card a[href], .product-actions a[href], button[data-url]');
    console.log(`Found ${allLinks.length} links/buttons to test`);
    
    let validPages = 0;
    let jsonFeeds = 0;
    let brokenLinks = 0;
    
    for (let i = 0; i < allLinks.length; i++) {
      const link = $(allLinks[i]);
      const href = link.attr('href') || link.attr('data-url');
      const text = link.text().trim() || link.attr('title') || 'unnamed';
      
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        continue;
      }
      
      console.log(`\n  ${i + 1}. "${text}" → ${href}`);
      
      try {
        const linkUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        const linkResponse = await axios.get(linkUrl, { 
          timeout: 5000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500
        });
        
        const contentType = linkResponse.headers['content-type'] || '';
        
        if (contentType.includes('application/json')) {
          console.log(`     ❌ RETURNS JSON FEED (not a page)`);
          jsonFeeds++;
        } else if (contentType.includes('text/html')) {
          console.log(`     ✅ Valid HTML page`);
          validPages++;
        } else {
          console.log(`     ⚠️  Content-Type: ${contentType}`);
          validPages++;
        }
      } catch (err) {
        console.log(`     ❌ BROKEN: ${err.message}`);
        brokenLinks++;
      }
    }
    
    console.log(`\nResults: ${validPages} valid pages, ${jsonFeeds} JSON feeds, ${brokenLinks} broken`);
    
    if (jsonFeeds > 0 || brokenLinks > 0) {
      console.log(`\n❌ FAIL: ${jsonFeeds} links return JSON, ${brokenLinks} links broken`);
      failed++;
      errors.push(`${jsonFeeds} JSON feeds, ${brokenLinks} broken links`);
    } else if (validPages > 0) {
      console.log(`\n✅ PASS: All ${validPages} links go to valid HTML pages`);
      passed++;
    } else {
      console.log(`\n⚠️  WARN: No links to test`);
    }

    // TEST 4: PRODUCT CARD STRUCTURE
    console.log('\n\nTEST 4: Product Card Structure');
    console.log('-'.repeat(80));
    
    let completeCards = 0;
    
    productCards.each((i, card) => {
      const $card = $(card);
      const hasImage = $card.find('img, [data-source-image]').length > 0;
      const hasTitle = $card.find('.product-title, h3, h4, h5').length > 0;
      const hasActions = $card.find('.product-actions, button, a').length > 0;
      
      console.log(`Card ${i + 1}: Image=${hasImage}, Title=${hasTitle}, Actions=${hasActions}`);
      
      if (hasImage && hasTitle && hasActions) {
        completeCards++;
      }
    });
    
    if (completeCards === productCards.length && productCards.length > 0) {
      console.log(`\n✅ PASS: All ${productCards.length} cards have complete structure`);
      passed++;
    } else {
      console.log(`\n❌ FAIL: Only ${completeCards}/${productCards.length} cards complete`);
      failed++;
      errors.push('Incomplete product card structure');
    }

  } catch (error) {
    console.error(`\n❌ TEST ERROR: ${error.message}`);
    failed++;
    errors.push(`Test error: ${error.message}`);
  }

  // SUMMARY
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 RESULTS: ${passed} passed, ${failed} failed`);
  
  if (errors.length > 0) {
    console.log('\n❌ FAILURES:');
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }
  
  if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED\n');
    process.exit(0);
  } else {
    console.log('\n❌ TESTS FAILED\n');
    process.exit(1);
  }
}

testCatalogPage().catch(error => {
  console.error('❌ Fatal:', error);
  process.exit(1);
});
