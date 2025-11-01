#!/usr/bin/env node
/**
 * CLI tool for managing discontinued products
 * Usage: node scripts/manage-discontinued-products.js [command] [args...]
 */

require('dotenv').config();
const { 
  isProductDisabled,
  getDisabledReason,
  markProductDiscontinued,
  disableProduct,
  enableProduct,
  getDisabledProductStats
} = require('../config/discontinued-products');
const { getAllProducts, findProductById } = require('../config/product-types');

function showHelp() {
  console.log(`
📋 Discontinued Products Management CLI

USAGE:
  node scripts/manage-discontinued-products.js [command] [args...]

COMMANDS:
  list                           - List all disabled products
  stats                         - Show statistics
  check <productId>             - Check if a product is disabled
  disable <productId> [reason]  - Manually disable a product
  discontinue <productId>       - Mark product as discontinued by Printify
  enable <productId>            - Re-enable a disabled product
  search <term>                 - Search products by name/category
  
EXAMPLES:
  # List all disabled products
  node scripts/manage-discontinued-products.js list
  
  # Disable a specific product
  node scripts/manage-discontinued-products.js disable validated-413 "Quality issues"
  
  # Mark as discontinued (from Printify email notification)
  node scripts/manage-discontinued-products.js discontinue validated-238
  
  # Re-enable a product
  node scripts/manage-discontinued-products.js enable validated-413
  
  # Check product status
  node scripts/manage-discontinued-products.js check validated-413

NOTE: After making changes, restart your server to apply the updates.
`);
}

function listDisabledProducts() {
  const stats = getDisabledProductStats();
  const allProducts = getAllProducts();
  
  console.log('\n📋 Disabled Products Status');
  console.log('=' .repeat(50));
  console.log(`Total Disabled: ${stats.total}`);
  console.log(`- Discontinued by Printify: ${stats.discontinued}`);
  console.log(`- Manually Disabled: ${stats.manuallyDisabled}`);
  
  if (stats.total === 0) {
    console.log('\n✅ No products are currently disabled');
    return;
  }
  
  console.log('\n📋 Discontinued Products:');
  stats.discontinuedList.forEach(productId => {
    const product = findProductById(productId);
    const productName = product ? product.name : 'Unknown Product';
    console.log(`  ❌ ${productId}: ${productName} - Discontinued by Printify`);
  });
  
  console.log('\n📋 Manually Disabled Products:');
  stats.manuallyDisabledList.forEach(productId => {
    const product = findProductById(productId);
    const productName = product ? product.name : 'Unknown Product';
    console.log(`  🚫 ${productId}: ${productName} - Manually disabled`);
  });
}

function checkProduct(productId) {
  if (!productId) {
    console.error('❌ Product ID required');
    return;
  }
  
  const product = findProductById(productId);
  if (!product) {
    console.error(`❌ Product ${productId} not found in catalog`);
    return;
  }
  
  const isDisabled = isProductDisabled(productId);
  const reason = getDisabledReason(productId);
  
  console.log(`\n🔍 Product Status: ${productId}`);
  console.log(`Name: ${product.name}`);
  console.log(`Category: ${product.category}`);
  console.log(`Blueprint: ${product.blueprintId}, Provider: ${product.printProviderId}`);
  console.log(`Status: ${isDisabled ? '❌ DISABLED' : '✅ ENABLED'}`);
  if (reason) {
    console.log(`Reason: ${reason}`);
  }
}

function disableProductCmd(productId, reason = 'Manually disabled by admin') {
  if (!productId) {
    console.error('❌ Product ID required');
    return;
  }
  
  const product = findProductById(productId);
  if (!product) {
    console.error(`❌ Product ${productId} not found in catalog`);
    return;
  }
  
  disableProduct(productId, reason);
  console.log(`\n✅ Product ${productId} (${product.name}) has been manually disabled`);
  console.log(`Reason: ${reason}`);
  console.log('\n⚠️  Remember to restart your server to apply changes');
}

function discontinueProductCmd(productId) {
  if (!productId) {
    console.error('❌ Product ID required');
    return;
  }
  
  const product = findProductById(productId);
  if (!product) {
    console.error(`❌ Product ${productId} not found in catalog`);
    return;
  }
  
  markProductDiscontinued(productId);
  console.log(`\n✅ Product ${productId} (${product.name}) marked as discontinued`);
  console.log('📧 This should be done when you receive a Printify email notification');
  console.log('\n⚠️  Remember to restart your server to apply changes');
}

function enableProductCmd(productId) {
  if (!productId) {
    console.error('❌ Product ID required');
    return;
  }
  
  const product = findProductById(productId);
  if (!product) {
    console.error(`❌ Product ${productId} not found in catalog`);
    return;
  }
  
  const wasDisabled = isProductDisabled(productId);
  if (!wasDisabled) {
    console.log(`✅ Product ${productId} (${product.name}) is already enabled`);
    return;
  }
  
  enableProduct(productId);
  console.log(`\n✅ Product ${productId} (${product.name}) has been re-enabled`);
  console.log('\n⚠️  Remember to restart your server to apply changes');
}

function searchProducts(term) {
  if (!term) {
    console.error('❌ Search term required');
    return;
  }
  
  const allProducts = getAllProducts();
  const searchTerm = term.toLowerCase();
  
  const matches = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    product.id.toLowerCase().includes(searchTerm)
  );
  
  console.log(`\n🔍 Search Results for "${term}"`);
  console.log('=' .repeat(50));
  console.log(`Found ${matches.length} matches:`);
  
  matches.forEach(product => {
    const isDisabled = isProductDisabled(product.id);
    const status = isDisabled ? '❌ DISABLED' : '✅ ENABLED';
    const reason = getDisabledReason(product.id);
    
    console.log(`\n${status} ${product.id}: ${product.name}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   Blueprint: ${product.blueprintId}, Provider: ${product.printProviderId}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }
  });
}

// Main CLI handler
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      listDisabledProducts();
      break;
      
    case 'stats':
      const stats = getDisabledProductStats();
      console.log('\n📊 Statistics:', stats);
      break;
      
    case 'check':
      checkProduct(args[1]);
      break;
      
    case 'disable':
      disableProductCmd(args[1], args.slice(2).join(' '));
      break;
      
    case 'discontinue':
      discontinueProductCmd(args[1]);
      break;
      
    case 'enable':
      enableProductCmd(args[1]);
      break;
      
    case 'search':
      searchProducts(args[1]);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      if (command) {
        console.error(`❌ Unknown command: ${command}`);
      }
      showHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}