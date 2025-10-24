#!/usr/bin/env node
const { chromium } = require('playwright');

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🌐 Opening catalog page...');
  await page.goto('http://localhost:3001/admin/vendor-research/catalog', { waitUntil: 'networkidle' });
  
  console.log('📸 Taking screenshot...');
  await page.screenshot({ path: 'catalog-screenshot.png', fullPage: true });
  
  console.log('🔍 Checking page elements...');
  
  // Get all buttons
  const buttons = await page.$$eval('.product-card .btn', btns => 
    btns.map(btn => ({
      text: btn.textContent.trim(),
      href: btn.getAttribute('href'),
      onclick: btn.getAttribute('onclick'),
      classes: btn.className
    }))
  );
  
  console.log('\n📋 Buttons found:');
  buttons.forEach((btn, i) => {
    console.log(`\n${i+1}. "${btn.text}"`);
    console.log(`   href: ${btn.href || 'none'}`);
    console.log(`   onclick: ${btn.onclick || 'none'}`);
    console.log(`   classes: ${btn.classes}`);
  });
  
  // Get image sources
  const images = await page.$$eval('.product-image-preview img', imgs =>
    imgs.map(img => ({
      src: img.src.substring(0, 80),
      dataSource: img.getAttribute('data-source-image'),
      resolvedType: img.getAttribute('data-resolved-type'),
      resolvedSuccess: img.getAttribute('data-resolved-success')
    }))
  );
  
  console.log('\n🖼️  Images found:');
  images.forEach((img, i) => {
    console.log(`\n${i+1}. ${img.dataSource}`);
    console.log(`   src: ${img.src}...`);
    console.log(`   resolved-type: ${img.resolvedType || 'NOT SET'}`);
    console.log(`   resolved-success: ${img.resolvedSuccess || 'NOT SET'}`);
  });
  
  // Check console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.waitForTimeout(2000);
  
  if (errors.length > 0) {
    console.log('\n❌ JavaScript Errors:');
    errors.forEach(err => console.log(`   ${err}`));
  }
  
  console.log('\n📸 Screenshot saved to: catalog-screenshot.png');
  console.log('Press Ctrl+C to close browser...');
  
  await page.waitForTimeout(30000);
  await browser.close();
}

runTest().catch(console.error);
