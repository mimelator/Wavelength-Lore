#!/usr/bin/env node

/**
 * Final Verification Script
 * 
 * Verify that all parts of the site are now loading images correctly
 */

const http = require('http');

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          hasImages: data.includes('<img src="http://localhost:3001/images/'),
          hasBackgrounds: data.includes('background-image: url(\'http://localhost:3001/images/'),
          content: data.length
        });
      });
    });
    req.on('error', () => resolve({ status: 'ERROR', hasImages: false, hasBackgrounds: false }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', hasImages: false, hasBackgrounds: false });
    });
  });
}

async function main() {
  console.log('🔍 Final Verification: Testing Image Loading\n');
  
  const pages = [
    { name: 'Home Page', url: 'http://localhost:3001/' },
    { name: 'Lore Gallery', url: 'http://localhost:3001/lore' },
    { name: 'Character Gallery', url: 'http://localhost:3001/characters' },
    { name: 'Specific Lore', url: 'http://localhost:3001/lore/the-shire' },
    { name: 'Specific Character', url: 'http://localhost:3001/character/lucky' }
  ];
  
  for (const page of pages) {
    console.log(`Testing: ${page.name}`);
    const result = await checkUrl(page.url);
    
    if (result.status === 200) {
      console.log(`✅ Status: OK (${result.content} bytes)`);
      console.log(`   Has CDN images: ${result.hasImages ? '✅' : '❌'}`);
      console.log(`   Has CDN backgrounds: ${result.hasBackgrounds ? '✅' : 'ℹ️ '}`);
    } else {
      console.log(`❌ Status: ${result.status}`);
    }
    console.log('');
  }
  
  // Test a few specific image URLs
  console.log('🖼️  Testing Specific Image URLs:');
  const imageUrls = [
    'http://localhost:3001/images/seasons/season3/episodes/episode5/images/RebuildTheShire-08.webp',
    'http://localhost:3001/images/seasons/season3/episodes/episode3/images/Sneak_Attack-16.webp',
    'http://localhost:3001/images/characters/lucky/lucky.webp'
  ];
  
  for (const url of imageUrls) {
    const result = await checkUrl(url);
    const imageName = url.split('/').pop();
    console.log(`   ${imageName}: ${result.status === 200 ? '✅' : '❌'} (${result.status})`);
  }
}

main();