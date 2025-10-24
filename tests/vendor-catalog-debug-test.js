#!/usr/bin/env node
const { chromium } = require('playwright');

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const logs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (msg.type() === 'error') errors.push(text);
  });
  
  await page.goto('http://localhost:3001/admin/vendor-research/catalog', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(3000);
  
  const buttons = await page.$$eval('.product-card .btn', btns => 
    btns.map(btn => ({
      text: btn.textContent.trim(),
      href: btn.getAttribute('href'),
      onclick: btn.getAttribute('onclick')
    }))
  );
  
  const images = await page.$$eval('.product-image-preview img', imgs =>
    imgs.map(img => ({
      src: img.src.substring(0, 80),
      dataSource: img.getAttribute('data-source-image'),
      resolvedType: img.getAttribute('data-resolved-type')
    }))
  );
  
  console.log('BUTTONS:', JSON.stringify(buttons, null, 2));
  console.log('\nIMAGES:', JSON.stringify(images, null, 2));
  console.log('\nERRORS:', errors);
  console.log('\nLOGS:', logs.slice(-10));
  
  await browser.close();
}

runTest().catch(console.error);
