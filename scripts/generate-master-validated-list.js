#!/usr/bin/env node

/**
 * BLUEPRINT-PROVIDER MASTER VALIDATION SYSTEM
 * 
 * Systematically validates all 708 discovered blueprints against all available providers
 * to generate the definitive master list of working combinations.
 * 
 * This replaces guesswork with scientific validation.
 */

require('dotenv').config();

class BlueprintProviderValidator {
  constructor() {
    this.discoveredBlueprints = null;
    this.validationResults = {
      tested: 0,
      working: [],
      failed: [],
      skipped: [],
      startTime: new Date().toISOString(),
      metadata: {
        totalBlueprints: 0,
        totalProviders: new Set(),
        categories: {},
        validationMethod: 'systematic-api-validation'
      }
    };
  }

  async initialize() {
    console.log('🔧 BLUEPRINT-PROVIDER MASTER VALIDATION');
    console.log('═══════════════════════════════════════');
    console.log('📅 Started:', new Date().toLocaleString());
    console.log('🎯 Goal: Generate validated master list from 708 discovered blueprints\n');

    // Load discovered blueprints
    const fs = require('fs');
    const blueprintsPath = './config/printify-blueprints-complete.json';
    
    if (!fs.existsSync(blueprintsPath)) {
      throw new Error('Blueprint discovery file not found. Run blueprint discovery first.');
    }

    this.discoveredBlueprints = JSON.parse(fs.readFileSync(blueprintsPath, 'utf8'));
    console.log(`📋 Loaded ${this.discoveredBlueprints.totalBlueprints} discovered blueprints`);
    console.log(`📊 Categories: ${Object.keys(this.discoveredBlueprints.categories).join(', ')}`);
    
    this.validationResults.metadata.totalBlueprints = this.discoveredBlueprints.totalBlueprints;
    this.validationResults.metadata.categories = this.discoveredBlueprints.categories;

    // Initialize Printify service
    const EnhancedPrintifyService = require('../services/enhanced-printify-service');
    this.printifyService = new EnhancedPrintifyService();
    console.log('✅ Printify service initialized\n');
  }

  async validateBlueprintProviderCombination(blueprintId, providerId, metadata = {}) {
    try {
      console.log(`   🧪 Testing: Blueprint ${blueprintId} + Provider ${providerId}`);
      
      // Test 1: Get blueprint variants (most reliable test)
      const variants = await this.printifyService.getBlueprintVariants(blueprintId, providerId);
      
      if (!variants || variants.length === 0) {
        return {
          success: false,
          error: 'No variants available',
          method: 'variants-check'
        };
      }

      // Test 2: Get blueprint details for extra validation
      try {
        const details = await this.printifyService.getBlueprintDetails(blueprintId, providerId);
        
        return {
          success: true,
          variants: variants.length,
          details: {
            name: details.title || metadata.title,
            description: details.description || metadata.description,
            brand: details.brand || metadata.brand,
            model: details.model || metadata.model
          },
          method: 'full-validation'
        };
      } catch (detailsError) {
        // Variants exist but details failed - still consider valid
        return {
          success: true,
          variants: variants.length,
          details: {
            name: metadata.title,
            description: metadata.description,
            brand: metadata.brand,
            model: metadata.model
          },
          method: 'variants-only',
          warning: 'Details unavailable but variants exist'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.title || error.message,
        statusCode: error.response?.status || 'unknown',
        method: 'api-error'
      };
    }
  }

  async validateAllCombinations() {
    console.log('🚀 Starting systematic validation of all blueprint-provider combinations...\n');

    const categories = Object.keys(this.discoveredBlueprints.blueprints);
    let totalProcessed = 0;

    for (const category of categories) {
      console.log(`\n📁 CATEGORY: ${category.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      const blueprints = this.discoveredBlueprints.blueprints[category];
      console.log(`📋 Processing ${blueprints.length} blueprints in category`);

      for (const blueprint of blueprints) {
        console.log(`\n🔍 Blueprint ${blueprint.id}: ${blueprint.title}`);
        
        if (!blueprint.providers || blueprint.providers.length === 0) {
          console.log('   ⚠️  No providers listed, skipping');
          this.validationResults.skipped.push({
            blueprintId: blueprint.id,
            title: blueprint.title,
            category,
            reason: 'No providers listed'
          });
          continue;
        }

        // Track all providers
        blueprint.providers.forEach(p => this.validationResults.metadata.totalProviders.add(p.id));

        let workingProviders = [];
        let failedProviders = [];

        for (const provider of blueprint.providers) {
          const result = await this.validateBlueprintProviderCombination(
            blueprint.id, 
            provider.id, 
            {
              title: blueprint.title,
              description: blueprint.description,
              brand: blueprint.brand,
              model: blueprint.model
            }
          );

          this.validationResults.tested++;

          if (result.success) {
            console.log(`   ✅ Provider ${provider.id} (${provider.title}): ${result.variants} variants`);
            
            workingProviders.push({
              providerId: provider.id,
              providerTitle: provider.title,
              providerLocation: provider.location,
              variants: result.variants,
              method: result.method,
              warning: result.warning
            });
          } else {
            console.log(`   ❌ Provider ${provider.id} (${provider.title}): ${result.error}`);
            
            failedProviders.push({
              providerId: provider.id,
              providerTitle: provider.title,
              error: result.error,
              statusCode: result.statusCode,
              method: result.method
            });
          }

          // Rate limiting - be nice to the API
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (workingProviders.length > 0) {
          this.validationResults.working.push({
            blueprintId: blueprint.id,
            title: blueprint.title,
            description: blueprint.description,
            brand: blueprint.brand,
            model: blueprint.model,
            category,
            images: blueprint.images,
            workingProviders,
            totalProviders: blueprint.providers.length,
            workingCount: workingProviders.length,
            failedCount: failedProviders.length,
            successRate: Math.round((workingProviders.length / blueprint.providers.length) * 100)
          });
        } else {
          this.validationResults.failed.push({
            blueprintId: blueprint.id,
            title: blueprint.title,
            category,
            totalProviders: blueprint.providers.length,
            failedProviders,
            reason: 'No working providers found'
          });
        }

        totalProcessed++;
        const progress = Math.round((totalProcessed / this.validationResults.metadata.totalBlueprints) * 100);
        console.log(`   📊 Progress: ${progress}% (${totalProcessed}/${this.validationResults.metadata.totalBlueprints})`);
      }
    }

    this.validationResults.endTime = new Date().toISOString();
    this.validationResults.metadata.totalProviders = this.validationResults.metadata.totalProviders.size;
  }

  generateMasterList() {
    console.log('\n📋 GENERATING MASTER VALIDATED LIST');
    console.log('═══════════════════════════════════════');

    const masterList = {
      generatedAt: new Date().toISOString(),
      validationMethod: 'systematic-api-validation',
      source: 'printify-blueprints-complete.json',
      metadata: {
        totalBlueprints: this.validationResults.metadata.totalBlueprints,
        validatedBlueprints: this.validationResults.working.length,
        failedBlueprints: this.validationResults.failed.length,
        skippedBlueprints: this.validationResults.skipped.length,
        totalCombinations: this.validationResults.tested,
        totalProviders: this.validationResults.metadata.totalProviders,
        validationDuration: this.calculateDuration(),
        categories: this.validationResults.metadata.categories
      },
      validatedCombinations: [],
      categoryBreakdown: {},
      providerStats: {},
      recommendations: {
        mostReliableBlueprints: [],
        bestProviders: [],
        categorySummary: {}
      }
    };

    // Process working combinations
    const providerCounts = {};
    const categoryStats = {};

    this.validationResults.working.forEach(blueprint => {
      // Category stats
      if (!categoryStats[blueprint.category]) {
        categoryStats[blueprint.category] = {
          blueprints: 0,
          totalCombinations: 0,
          averageSuccessRate: 0
        };
      }
      categoryStats[blueprint.category].blueprints++;
      categoryStats[blueprint.category].totalCombinations += blueprint.workingCount;

      // Provider stats
      blueprint.workingProviders.forEach(provider => {
        if (!providerCounts[provider.providerId]) {
          providerCounts[provider.providerId] = {
            id: provider.providerId,
            title: provider.providerTitle,
            location: provider.providerLocation,
            workingBlueprints: 0,
            totalVariants: 0
          };
        }
        providerCounts[provider.providerId].workingBlueprints++;
        providerCounts[provider.providerId].totalVariants += provider.variants;
      });

      // Add to validated combinations
      blueprint.workingProviders.forEach(provider => {
        masterList.validatedCombinations.push({
          blueprintId: blueprint.blueprintId,
          blueprintTitle: blueprint.title,
          blueprintDescription: blueprint.description,
          brand: blueprint.brand,
          model: blueprint.model,
          category: blueprint.category,
          providerId: provider.providerId,
          providerTitle: provider.providerTitle,
          providerLocation: provider.providerLocation,
          variants: provider.variants,
          validationMethod: provider.method,
          images: blueprint.images,
          metadata: {
            successRate: blueprint.successRate,
            totalProviders: blueprint.totalProviders,
            warning: provider.warning
          }
        });
      });
    });

    // Generate recommendations
    masterList.recommendations.bestProviders = Object.values(providerCounts)
      .sort((a, b) => b.workingBlueprints - a.workingBlueprints)
      .slice(0, 10);

    masterList.recommendations.mostReliableBlueprints = this.validationResults.working
      .filter(b => b.successRate === 100 && b.totalProviders > 1)
      .sort((a, b) => b.workingCount - a.workingCount)
      .slice(0, 20)
      .map(b => ({
        blueprintId: b.blueprintId,
        title: b.title,
        category: b.category,
        workingProviders: b.workingCount,
        successRate: b.successRate
      }));

    masterList.categoryBreakdown = categoryStats;
    masterList.providerStats = providerCounts;

    return masterList;
  }

  calculateDuration() {
    const start = new Date(this.validationResults.startTime);
    const end = new Date(this.validationResults.endTime);
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  async saveMasterList(masterList) {
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save detailed master list
    const masterListPath = `./config/printify-master-validated-list-${timestamp}.json`;
    fs.writeFileSync(masterListPath, JSON.stringify(masterList, null, 2));
    console.log(`💾 Master list saved: ${masterListPath}`);

    // Save simplified config-ready version
    const configReady = {
      generatedAt: masterList.generatedAt,
      validationMethod: masterList.validationMethod,
      metadata: masterList.metadata,
      productTypes: this.generateConfigReadyProductTypes(masterList.validatedCombinations)
    };

    const configPath = `./config/validated-product-types-${timestamp}.js`;
    const configContent = this.generateProductTypesConfig(configReady);
    fs.writeFileSync(configPath, configContent);
    console.log(`⚙️  Config-ready file saved: ${configPath}`);

    // Save current as latest
    fs.writeFileSync('./config/printify-master-validated-list-latest.json', JSON.stringify(masterList, null, 2));
    console.log(`🔄 Latest version updated: ./config/printify-master-validated-list-latest.json`);

    return { masterListPath, configPath };
  }

  generateConfigReadyProductTypes(validatedCombinations) {
    // Group by logical product categories for config
    const productTypes = {
      apparel: {
        name: 'Apparel',
        icon: '👕',
        description: 'Clothing and wearables',
        products: []
      },
      home: {
        name: 'Home & Living', 
        icon: '🏠',
        description: 'Items for your living space',
        products: []
      },
      accessories: {
        name: 'Accessories & Specialty',
        icon: '🎒', 
        description: 'Special items and accessories',
        products: []
      }
    };

    // Map common product types
    const productMapping = {
      // T-Shirts and basic apparel
      'unisex cotton crew tee': { category: 'apparel', id: 'premium-tshirt', icon: '👕' },
      'unisex heavy cotton tee': { category: 'apparel', id: 'heavy-cotton-tee', icon: '👕' },
      'women\'s favorite tee': { category: 'apparel', id: 'womens-tee', icon: '👚' },
      
      // Hoodies and outerwear
      'pullover hoodie': { category: 'apparel', id: 'hoodie', icon: '🧥' },
      'unisex sponge fleece pullover hoodie': { category: 'apparel', id: 'fleece-hoodie', icon: '🧥' },
      
      // Mugs and drinkware
      'mug 11oz': { category: 'home', id: 'coffee-mug-11oz', icon: '☕' },
      'white ceramic mug, 11oz': { category: 'home', id: 'ceramic-mug-11oz', icon: '☕' },
      'latte mug': { category: 'home', id: 'latte-mug', icon: '☕' },
      
      // Home items
      'spun polyester square pillow': { category: 'home', id: 'square-pillow', icon: '🛋️' },
      
      // Accessories
      'tank top': { category: 'apparel', id: 'tank-top', icon: '🎽' },
      'infant fine jersey tee': { category: 'accessories', id: 'infant-tee', icon: '👶' }
    };

    // Process validated combinations
    const seenProducts = new Set();
    
    validatedCombinations.forEach(combo => {
      const titleLower = combo.blueprintTitle.toLowerCase();
      const mapping = productMapping[titleLower];
      
      if (mapping && !seenProducts.has(combo.blueprintId)) {
        seenProducts.add(combo.blueprintId);
        
        // Find best provider for this blueprint
        const bestProvider = validatedCombinations
          .filter(c => c.blueprintId === combo.blueprintId)
          .sort((a, b) => b.variants - a.variants)[0];

        productTypes[mapping.category].products.push({
          id: mapping.id,
          name: combo.blueprintTitle,
          description: combo.blueprintDescription || `High-quality ${combo.blueprintTitle.toLowerCase()}`,
          blueprintId: combo.blueprintId,
          printProviderId: bestProvider.providerId,
          icon: mapping.icon,
          brand: combo.brand,
          model: combo.model,
          variants: bestProvider.variants,
          providerTitle: bestProvider.providerTitle,
          validationMethod: bestProvider.validationMethod,
          images: combo.images,
          tags: this.generateTags(combo.category, combo.blueprintTitle),
          basePrice: this.estimateBasePrice(combo.category, combo.blueprintTitle),
          validated: true,
          validatedAt: new Date().toISOString()
        });
      }
    });

    return productTypes;
  }

  generateTags(category, title) {
    const baseTags = ['wavelength', 'lore', 'custom'];
    const titleWords = title.toLowerCase().split(' ');
    
    // Add category-specific tags
    if (category === 'apparel') baseTags.push('apparel', 'clothing');
    if (category === 'home') baseTags.push('home', 'decor');
    if (category === 'accessories') baseTags.push('accessories', 'specialty');
    
    // Add product-specific tags
    if (titleWords.includes('mug')) baseTags.push('mug', 'coffee', 'beverage');
    if (titleWords.includes('tee') || titleWords.includes('shirt')) baseTags.push('tshirt', 'cotton');
    if (titleWords.includes('hoodie')) baseTags.push('hoodie', 'warm');
    
    return baseTags;
  }

  estimateBasePrice(category, title) {
    const titleLower = title.toLowerCase();
    
    // Price estimates based on product type
    if (titleLower.includes('mug')) return 1599; // $15.99
    if (titleLower.includes('hoodie')) return 3499; // $34.99
    if (titleLower.includes('pillow')) return 2499; // $24.99
    if (titleLower.includes('tee') || titleLower.includes('shirt')) return 2099; // $20.99
    if (titleLower.includes('tank')) return 1899; // $18.99
    
    return 1999; // Default $19.99
  }

  generateProductTypesConfig(configReady) {
    return `/**
 * VALIDATED Product Types Configuration
 * 
 * Generated: ${configReady.generatedAt}
 * Method: ${configReady.validationMethod}
 * Validated Blueprints: ${configReady.metadata.validatedBlueprints}
 * Total Combinations: ${configReady.metadata.totalCombinations}
 * 
 * ⚠️  DO NOT EDIT MANUALLY - Generated from validated master list
 * ⚠️  All blueprint-provider combinations have been API-tested
 */

const ProductTypes = ${JSON.stringify(configReady.productTypes, null, 2)};

module.exports = {
  ProductTypes,
  metadata: ${JSON.stringify(configReady.metadata, null, 2)}
};
`;
  }

  async printSummary() {
    console.log('\n🎉 VALIDATION COMPLETE!');
    console.log('═══════════════════════');
    console.log(`⏱️  Duration: ${this.calculateDuration()}`);
    console.log(`📊 Total Tests: ${this.validationResults.tested}`);
    console.log(`✅ Working Blueprints: ${this.validationResults.working.length}`);
    console.log(`❌ Failed Blueprints: ${this.validationResults.failed.length}`);
    console.log(`⏭️  Skipped Blueprints: ${this.validationResults.skipped.length}`);
    console.log(`🎯 Success Rate: ${Math.round((this.validationResults.working.length / (this.validationResults.working.length + this.validationResults.failed.length)) * 100)}%`);
    
    console.log('\n📈 TOP WORKING BLUEPRINTS:');
    this.validationResults.working
      .sort((a, b) => b.workingCount - a.workingCount)
      .slice(0, 10)
      .forEach((blueprint, i) => {
        console.log(`${i + 1}. ${blueprint.title} (${blueprint.workingCount}/${blueprint.totalProviders} providers)`);
      });
  }
}

// CLI execution
async function runMasterValidation() {
  const validator = new BlueprintProviderValidator();
  
  try {
    await validator.initialize();
    await validator.validateAllCombinations();
    
    const masterList = validator.generateMasterList();
    const paths = await validator.saveMasterList(masterList);
    
    await validator.printSummary();
    
    console.log('\n🎯 FILES GENERATED:');
    console.log(`📋 Master List: ${paths.masterListPath}`);
    console.log(`⚙️  Config Ready: ${paths.configPath}`);
    console.log(`🔄 Latest: ./config/printify-master-validated-list-latest.json`);
    
    console.log('\n✅ Master validation complete! No more guesswork! 🚀');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  runMasterValidation();
}

module.exports = { BlueprintProviderValidator };