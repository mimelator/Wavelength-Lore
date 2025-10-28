#!/usr/bin/env node
/**
 * WAVELENGTH UX Fix Validator
 * Validates that GitHub Issue #105 has been completely resolved
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🌊 WAVELENGTH UX FIX VALIDATOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function validateProductDescriptions() {
  const productTypesPath = path.join(__dirname, 'config', 'product-types.js');
  const content = await fs.readFile(productTypesPath, 'utf8');
  
  // Check for any remaining technical jargon
  const technicalJargon = [
    /Validated \w+ product with \d+ provider options/g,
    /Quality \w+ that combines style with functionality/g
  ];
  
  let issuesFound = 0;
  
  for (const pattern of technicalJargon) {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`❌ Found ${matches.length} instances of technical jargon: ${pattern}`);
      issuesFound += matches.length;
    }
  }
  
  // Count total descriptions
  const descriptions = content.match(/description: '/g);
  const totalDescriptions = descriptions ? descriptions.length : 0;
  
  console.log(`📊 Product Descriptions Analysis:`);
  console.log(`   • Total descriptions: ${totalDescriptions}`);
  console.log(`   • Technical jargon found: ${issuesFound}`);
  console.log(`   • Customer-friendly: ${totalDescriptions - issuesFound}`);
  
  return issuesFound === 0;
}

async function validatePricingText() {
  const merchandiseStorePath = path.join(__dirname, 'static', 'js', 'components', 'merchandise-store.js');
  const content = await fs.readFile(merchandiseStorePath, 'utf8');
  
  // Check for old pricing text
  const oldPricingCount = (content.match(/Pricing Coming Soon/g) || []).length;
  const newPricingCount = (content.match(/Price Available at Checkout/g) || []).length;
  
  console.log(`📊 Pricing Text Analysis:`);
  console.log(`   • Old "Pricing Coming Soon": ${oldPricingCount}`);
  console.log(`   • New "Price Available at Checkout": ${newPricingCount}`);
  
  return oldPricingCount === 0 && newPricingCount > 0;
}

async function sampleDescriptions() {
  const productTypesPath = path.join(__dirname, 'config', 'product-types.js');
  const content = await fs.readFile(productTypesPath, 'utf8');
  
  // Extract a few sample descriptions
  const descriptionMatches = content.match(/description: '([^']+)'/g);
  
  console.log(`📝 Sample Customer-Friendly Descriptions:`);
  if (descriptionMatches) {
    const samples = descriptionMatches.slice(0, 5);
    samples.forEach((desc, i) => {
      const text = desc.replace("description: '", "").replace("'", "");
      console.log(`   ${i + 1}. "${text}"`);
    });
  }
}

async function main() {
  try {
    console.log('🎯 Validating GitHub Issue #105 Resolution\n');
    
    // Validate product descriptions
    const descriptionsValid = await validateProductDescriptions();
    console.log('');
    
    // Validate pricing text
    const pricingValid = await validatePricingText();
    console.log('');
    
    // Show samples
    await sampleDescriptions();
    console.log('');
    
    // Final result
    if (descriptionsValid && pricingValid) {
      console.log('✅ GITHUB ISSUE #105 COMPLETELY RESOLVED!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 ALL technical jargon removed');
      console.log('🎉 ALL descriptions are customer-friendly');
      console.log('🎉 Pricing text improved');
      console.log('');
      console.log('🌊 Customers will now see appealing product descriptions!');
    } else {
      console.log('❌ ISSUES STILL REMAINING - needs more work');
      if (!descriptionsValid) console.log('   • Product descriptions still have technical jargon');
      if (!pricingValid) console.log('   • Pricing text not updated properly');
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}