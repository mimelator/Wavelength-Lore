const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:3001/merchandise', {waitUntil: 'networkidle2'});
  await page.waitForSelector('.edit-product-btn', {timeout: 5000});

  console.log('\n=== FIRST CLICK ===');
  await page.click('.edit-product-btn');
  await page.waitForSelector('.modal-close-btn', {timeout: 5000});

  // Get modal ID
  const modalId = await page.$eval('[data-modal-id]', el => el.dataset.modalId);
  console.log('Modal ID:', modalId);

  // Click close
  console.log('Clicking close button...');
  await page.click('.modal-close-btn');

  // Wait for logs and animation
  await new Promise(r => setTimeout(r, 1500));

  // Check if modal exists
  const modalExists = await page.$('[data-modal-id]');
  console.log('Modal exists after first click:', !!modalExists);

  if (modalExists) {
    console.log('\n=== SECOND CLICK ===');
    await page.click('.modal-close-btn');
    await new Promise(r => setTimeout(r, 1500));
    const modalExists2 = await page.$('[data-modal-id]');
    console.log('Modal exists after second click:', !!modalExists2);
  }

  await browser.close();
})();
