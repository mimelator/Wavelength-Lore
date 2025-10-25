/**
 * Use Existing Configuration - Convert your working config to viable vendor list
 */

const fs = require('fs');
const path = require('path');

function convertExistingConfig() {
  console.log('📋 Converting existing working configuration to viable vendor criteria...\n');
  
  // Read your existing working config
  const configPath = path.join(__dirname, '../config/printify-blueprints-discovered.json');
  const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  console.log(`Found ${existingConfig.workingConfigurations.length} working configurations from ${existingConfig.discoveredAt}`);
  
  // Define viability criteria based on your working products
  const viabilityCriteria = {
    // A vendor is viable if:
    hasVariants: true,           // Must have variants available
    hasWorkingProvider: true,    // Must have at least one working provider
    minVariants: 20,            // Must have at least 20 variants (reasonable selection)
    workingProviders: [         // Known working providers from your config
      'Marco Fine Arts',
      'Monster Digital'
    ],
    workingBlueprints: existingConfig.workingConfigurations.map(config => ({
      id: config.id,
      title: config.title,
      brand: config.brand,
      category: config.category,
      providers: config.providers
    }))
  };
  
  console.log('\n✅ Viability Criteria Defined:');
  console.log(`   - Must have variants: ${viabilityCriteria.hasVariants}`);
  console.log(`   - Must have working provider: ${viabilityCriteria.hasWorkingProvider}`);
  console.log(`   - Minimum variants: ${viabilityCriteria.minVariants}`);
  console.log(`   - Known working providers: ${viabilityCriteria.workingProviders.join(', ')}`);
  console.log(`   - Known working blueprints: ${viabilityCriteria.workingBlueprints.length}`);
  
  // Apply criteria to your existing config
  const viableVendors = existingConfig.workingConfigurations.filter(config => {
    // Check if has providers with enough variants
    const hasEnoughVariants = config.providers.some(provider => 
      provider.variantCount >= viabilityCriteria.minVariants
    );
    
    // Check if has known working providers
    const hasWorkingProvider = config.providers.some(provider =>
      viabilityCriteria.workingProviders.includes(provider.title)
    );
    
    return hasEnoughVariants && hasWorkingProvider;
  });
  
  console.log(`\n📊 Viability Results:`);
  console.log(`   Total configurations: ${existingConfig.workingConfigurations.length}`);
  console.log(`   Viable vendors: ${viableVendors.length}`);
  console.log(`   Viability rate: ${((viableVendors.length / existingConfig.workingConfigurations.length) * 100).toFixed(1)}%`);
  
  console.log(`\n🎯 Viable Vendors:`);
  viableVendors.forEach((vendor, i) => {
    const bestProvider = vendor.providers.reduce((best, current) => 
      current.variantCount > best.variantCount ? current : best
    );
    console.log(`   ${i + 1}. ${vendor.title} (${vendor.brand}) - ${bestProvider.title}: ${bestProvider.variantCount} variants`);
  });
  
  // Save the viable vendor criteria
  const outputPath = path.join(__dirname, '../config/viable-vendor-criteria.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    basedOn: existingConfig.discoveredAt,
    criteria: viabilityCriteria,
    viableVendors,
    summary: {
      total: existingConfig.workingConfigurations.length,
      viable: viableVendors.length,
      viabilityRate: ((viableVendors.length / existingConfig.workingConfigurations.length) * 100).toFixed(1) + '%'
    }
  }, null, 2));
  
  console.log(`\n💾 Viable vendor criteria saved to: ${outputPath}`);
  console.log('\n💡 Use this as your definitive vendor viability standard!');
}

convertExistingConfig();