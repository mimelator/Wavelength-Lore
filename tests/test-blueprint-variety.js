#!/usr/bin/env node

/**
 * Test: Blueprint Variety
 * 
 * Verifies that products are created with DIFFERENT blueprint IDs,
 * not just blueprint ID 5
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testBlueprintVariety() {
  console.log('\n🧪 TEST: Blueprint Variety\n');
  console.log('='.repeat(80));

  try {
    // Fetch catalog page
    const response = await axios.get(`${BASE_URL}/admin/vendor-research/catalog`);
    const catalogHtml = response.data;
    
    // Extract blueprint IDs from data attributes
    const blueprintMatches = catalogHtml.match(/data-blueprint="(\d+)"/g) || [];
    const blueprintIds = blueprintMatches.map(m => m.match(/data-blueprint="(\d+)"/)[1]);
    
    console.log(`\nFound ${blueprintIds.length} products\n`);
    
    // Count occurrences of each blueprint
    const blueprintCounts = {};
    blueprintIds.forEach(id => {
      blueprintCounts[id] = (blueprintCounts[id] || 0) + 1;
    });
    
    console.log('Blueprint distribution:');
    Object.keys(blueprintCounts).sort().forEach(id => {
      const count = blueprintCounts[id];
      const percent = ((count / blueprintIds.length) * 100).toFixed(1);
      console.log(`  Blueprint ${id}: ${count} products (${percent}%)`);
    });
    
    const uniqueBlueprints = Object.keys(blueprintCounts).length;
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 RESULTS: ${uniqueBlueprints} unique blueprint(s)\n`);
    
    // REQUIREMENT: Must have at least 2 different blueprints
    const MIN_BLUEPRINTS = 2;
    
    if (blueprintIds.length === 0) {
      console.log('❌ FAIL: No products found\n');
      process.exit(1);
    } else if (uniqueBlueprints < MIN_BLUEPRINTS) {
      console.log(`❌ FAIL: Only ${uniqueBlueprints} unique blueprint(s), need at least ${MIN_BLUEPRINTS}\n`);
      if (blueprintCounts['5'] === blueprintIds.length) {
        console.log('   ALL products are blueprint ID 5 - batch builder not creating variety\n');
      }
      process.exit(1);
    } else {
      console.log(`✅ PASS: Products use ${uniqueBlueprints} different blueprints (minimum ${MIN_BLUEPRINTS})\n`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testBlueprintVariety();
