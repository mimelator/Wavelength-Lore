#!/usr/bin/env node

/**
 * Fetch Valid Print Providers for All Blueprints
 *
 * This script queries Printify API to get the actual valid print providers
 * for each blueprint, replacing the mock 999 IDs with real provider IDs
 */

const PrintifyService = require('../services/printify-service');

async function fetchValidProviders() {
  console.log('🔍 Fetching valid print providers from Printify API\n');

  const printifyService = new PrintifyService();

  // List of blueprint IDs from product-types.js
  const blueprintIds = [
    413, 238, 1091, 1385, 1573, 1626, 1911,  // Apparel
    235, 380, 381, 623, 748, 788, 797, 1030, 1367, 1592, 1633,  // Home & Living
    70, 68, 363, 61, 49,  // More Home & Living
    // Add more as needed
  ];

  const validProviders = {};

  for (const blueprintId of blueprintIds) {
    try {
      console.log(`\n📘 Blueprint ID: ${blueprintId}`);
      console.log('─'.repeat(60));

      const result = await printifyService.getPrintProviders(blueprintId);

      if (result.success && result.providers) {
        console.log(`Found ${result.providers.length} provider(s):\n`);

        result.providers.forEach((provider, index) => {
          console.log(`  ${index + 1}. Provider ID: ${provider.id}`);
          console.log(`     Name: ${provider.description || provider.name || 'N/A'}`);
          console.log(`     Region: ${provider.region || 'N/A'}`);

          // Store first provider as the primary one
          if (index === 0) {
            validProviders[blueprintId] = {
              providerId: provider.id,
              name: provider.description || provider.name,
              region: provider.region
            };
          }
        });
      } else {
        console.log(`❌ Error: ${result.error}`);
      }

      // Rate limit: small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error fetching providers for blueprint ${blueprintId}:`, error.message);
    }
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('  📊 VALID PROVIDER MAPPING');
  console.log('='.repeat(80) + '\n');

  console.log('Update product-types.js with these provider IDs:\n');

  Object.entries(validProviders).forEach(([blueprintId, provider]) => {
    console.log(`Blueprint ${blueprintId}:`);
    console.log(`  printProviderId: ${provider.providerId},  // ${provider.name}`);
    console.log('');
  });

  console.log('\n' + '='.repeat(80));
  console.log('  🚀 GENERATED CONFIG');
  console.log('='.repeat(80) + '\n');

  // Generate JavaScript code
  console.log('const ProductTypes = {');

  Object.entries(validProviders).forEach(([blueprintId, provider], index) => {
    console.log(`  'validated-${blueprintId}': {`);
    console.log(`    id: 'validated-${blueprintId}',`);
    console.log(`    blueprintId: ${blueprintId},`);
    console.log(`    printProviderId: ${provider.providerId},  // ${provider.name}`);
    console.log(`    // ... other properties`);
    console.log(`  },`);
  });

  console.log('};');
}

// Run the script
fetchValidProviders().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
