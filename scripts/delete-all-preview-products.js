#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function deleteAllPreviews() {
  console.log('\n🗑️  Deleting all preview products via API...\n');

  try {
    // Get all products
    const catalogResponse = await axios.get(`${BASE_URL}/admin/vendor-research/catalog`);
    const html = catalogResponse.data;
    
    // Extract cache keys from delete buttons
    const deleteMatches = html.match(/deleteProduct\('([^']+)'/g) || [];
    const cacheKeys = deleteMatches.map(m => m.match(/deleteProduct\('([^']+)'/)[1]);
    
    console.log(`Found ${cacheKeys.length} products to delete\n`);
    
    if (cacheKeys.length === 0) {
      console.log('No products to delete\n');
      process.exit(0);
    }
    
    // Delete each product via API
    for (const cacheKey of cacheKeys) {
      console.log(`Deleting ${cacheKey}...`);
      
      try {
        const response = await axios.delete(`${BASE_URL}/admin/vendor-research/delete-preview`, {
          data: { cacheKey }
        });
        
        if (response.data.success) {
          console.log(`  ✅ Deleted from both Printify and Firebase`);
        } else {
          console.log(`  ❌ Failed: ${response.data.error}`);
        }
      } catch (err) {
        console.log(`  ❌ Failed: ${err.response?.data?.error || err.message}`);
      }
    }
    
    console.log(`\n✅ Deleted ${cacheKeys.length} products\n`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

deleteAllPreviews();
