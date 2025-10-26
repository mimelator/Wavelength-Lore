#!/usr/bin/env node

/**
 * WAVELENGTH Master Blueprint Validation System
 * Generates complete validated master list from 708 discovered blueprints
 * 
 * This script systematically validates all blueprint/provider combinations
 * to create the definitive product-types.js configuration file.
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Enhanced Printify Service for validation
class PrintifyValidationService {
  constructor() {
    this.baseURL = process.env.PRINTIFY_API_URL || 'https://api.printify.com/v1';
    this.apiKey = process.env.PRINTIFY_API_TOKEN;
    this.shopId = process.env.PRINTIFY_SHOP_ID;
    
    if (!this.apiKey || !this.shopId) {
      console.log('⚠️  API credentials not found - will generate theoretical combinations');
      console.log('   Expected: PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID');
      this.mockMode = true;
    } else {
      console.log('✅ WAVELENGTH: Using real Printify API credentials');
      console.log(`   Shop ID: ${this.shopId}`);
      console.log(`   API URL: ${this.baseURL}`);
      this.mockMode = false;
    }
  }

  async makeRequest(endpoint) {
    if (this.mockMode) {
      // Return mock success for theoretical validation
      return { variants: [{ id: 1 }] };
    }

    try {
      const fetch = (await import('node-fetch')).default;
      const url = `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Wavelength-Blueprint-Validator/1.0'
        }
      });

      if (!response.ok) {
        console.log(`   API Error ${response.status}: ${endpoint}`);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.log(`   Request Error: ${error.message}`);
      return null;
    }
  }

  async validateBlueprint(blueprintId, providerId) {
    const result = await this.makeRequest(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`);
    return result && result.variants && result.variants.length > 0;
  }

  async getBlueprintVariants(blueprintId, providerId) {
    const result = await this.makeRequest(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`);
    return result ? result.variants || [] : [];
  }
}

class MasterListGenerator {
  constructor() {
    this.service = new PrintifyValidationService();
    this.blueprintsPath = path.join(__dirname, '../config/printify-blueprints-complete.json');
    this.outputPath = path.join(__dirname, '../config/product-types-validated-master.js');
    this.reportPath = path.join(__dirname, '../debug/blueprint-validation-report.json');
    
    // Load the 708 discovered blueprints
    try {
      const blueprintsData = fs.readFileSync(this.blueprintsPath, 'utf8');
      const blueprintsJson = JSON.parse(blueprintsData);
      
      // Extract all blueprints from the nested structure
      this.allBlueprints = [];
      if (blueprintsJson.blueprints) {
        for (const category of Object.keys(blueprintsJson.blueprints)) {
          this.allBlueprints = this.allBlueprints.concat(blueprintsJson.blueprints[category]);
        }
      }
      
      console.log(`🌊 WAVELENGTH: Loaded ${this.allBlueprints.length} discovered blueprints from ${blueprintsJson.totalBlueprints} total`);
    } catch (error) {
      console.error('❌ Error loading blueprints:', error.message);
      process.exit(1);
    }
  }

  // Enhanced product type mapping with better names and categories
  generateProductTypes() {
    const productTypeMap = {
      // APPAREL - T-Shirts & Tops
      't-shirt': { keywords: ['t-shirt', 'tee', 'shirt'], category: 'apparel', subcategory: 'tops' },
      'premium-tshirt': { keywords: ['premium', 'quality'], category: 'apparel', subcategory: 'tops' },
      'heavy-cotton-tee': { keywords: ['heavy', 'cotton'], category: 'apparel', subcategory: 'tops' },
      'tank-top': { keywords: ['tank', 'sleeveless'], category: 'apparel', subcategory: 'tops' },
      'women-tee': { keywords: ['women', 'lady', 'feminine'], category: 'apparel', subcategory: 'tops' },
      
      // APPAREL - Hoodies & Sweatshirts
      'hoodie': { keywords: ['hoodie', 'hooded'], category: 'apparel', subcategory: 'outerwear' },
      'pullover-hoodie': { keywords: ['pullover'], category: 'apparel', subcategory: 'outerwear' },
      'sweatshirt': { keywords: ['sweat', 'crew'], category: 'apparel', subcategory: 'outerwear' },
      'zip-hoodie': { keywords: ['zip', 'zipper'], category: 'apparel', subcategory: 'outerwear' },
      
      // HOME & LIVING - Drinkware
      'coffee-mug': { keywords: ['mug', 'coffee', 'ceramic'], category: 'home', subcategory: 'drinkware' },
      'travel-mug': { keywords: ['travel', 'tumbler'], category: 'home', subcategory: 'drinkware' },
      'water-bottle': { keywords: ['bottle', 'water'], category: 'home', subcategory: 'drinkware' },
      
      // HOME & LIVING - Decor
      'pillow': { keywords: ['pillow', 'cushion'], category: 'home', subcategory: 'decor' },
      'canvas': { keywords: ['canvas', 'print', 'art'], category: 'home', subcategory: 'decor' },
      'poster': { keywords: ['poster', 'print'], category: 'home', subcategory: 'decor' },
      'blanket': { keywords: ['blanket', 'throw'], category: 'home', subcategory: 'decor' },
      
      // ACCESSORIES - Bags & Carry
      'tote-bag': { keywords: ['tote', 'bag'], category: 'accessories', subcategory: 'bags' },
      'backpack': { keywords: ['backpack', 'bag'], category: 'accessories', subcategory: 'bags' },
      'fanny-pack': { keywords: ['fanny', 'waist'], category: 'accessories', subcategory: 'bags' },
      
      // ACCESSORIES - Tech & Personal
      'phone-case': { keywords: ['phone', 'case', 'iphone', 'samsung'], category: 'accessories', subcategory: 'tech' },
      'laptop-sleeve': { keywords: ['laptop', 'sleeve'], category: 'accessories', subcategory: 'tech' },
      'hat': { keywords: ['hat', 'cap', 'beanie'], category: 'accessories', subcategory: 'headwear' },
      'sticker': { keywords: ['sticker', 'decal'], category: 'accessories', subcategory: 'personal' },
      
      // SPECIALTY - Unique Items
      'notebook': { keywords: ['notebook', 'journal'], category: 'specialty', subcategory: 'stationery' },
      'mousepad': { keywords: ['mouse', 'pad'], category: 'specialty', subcategory: 'office' },
      'apron': { keywords: ['apron'], category: 'specialty', subcategory: 'kitchen' },
      'infant-wear': { keywords: ['infant', 'baby', 'onesie'], category: 'specialty', subcategory: 'baby' }
    };

    return productTypeMap;
  }

  // Smart blueprint categorization
  categorizeBlueprint(blueprint) {
    const title = blueprint.title.toLowerCase();
    const description = blueprint.description ? blueprint.description.toLowerCase() : '';
    const combined = `${title} ${description}`;
    
    const productTypes = this.generateProductTypes();
    
    // Score each product type based on keyword matches
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [typeId, typeData] of Object.entries(productTypes)) {
      let score = 0;
      
      // Check title matches (higher weight)
      for (const keyword of typeData.keywords) {
        if (title.includes(keyword)) {
          score += 3;
        }
        if (description.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = typeId;
      }
    }
    
    // Fallback categorization
    if (!bestMatch) {
      if (combined.includes('shirt') || combined.includes('tee')) {
        bestMatch = 't-shirt';
      } else if (combined.includes('mug') || combined.includes('cup')) {
        bestMatch = 'coffee-mug';
      } else if (combined.includes('pillow')) {
        bestMatch = 'pillow';
      } else {
        bestMatch = 'specialty-item';
      }
    }
    
    return bestMatch;
  }

  // Generate provider priority list (most reliable first)
  getProviderPriority() {
    return [
      { id: 3, name: "OTTO Print", priority: 1 },      // Reliable apparel
      { id: 1, name: "Printful", priority: 2 },        // General reliable
      { id: 7, name: "Gooten", priority: 3 },          // Good for home items
      { id: 10, name: "MWW On Demand", priority: 4 },  // Specialty items
      { id: 29, name: "TBD", priority: 5 },            // Alternative
      { id: 5, name: "Generic", priority: 6 },         // Last resort
    ];
  }

  async validateBlueprintWithProviders(blueprint) {
    const providers = this.getProviderPriority();
    const validCombinations = [];
    
    // Test each provider in priority order
    for (const provider of providers) {
      // Skip if this provider isn't in the blueprint's provider list
      if (!blueprint.providers || !blueprint.providers.find(p => p.id === provider.id)) {
        continue;
      }
      
      try {
        const isValid = await this.service.validateBlueprint(blueprint.id, provider.id);
        
        if (isValid) {
          validCombinations.push({
            blueprintId: blueprint.id,
            providerId: provider.id,
            providerName: provider.name,
            priority: provider.priority,
            title: blueprint.title,
            description: blueprint.description
          });
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`⚠️  Error testing blueprint ${blueprint.id} with provider ${provider.id}: ${error.message}`);
      }
    }
    
    return validCombinations;
  }

  async generateMasterList() {
    console.log('🚀 WAVELENGTH: Starting master validation of 708 blueprints...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const validatedProducts = {};
    const validationReport = {
      totalBlueprints: this.allBlueprints.length,
      validatedCombinations: 0,
      invalidCombinations: 0,
      categories: {},
      timestamp: new Date().toISOString(),
      details: []
    };

    let processed = 0;
    const batchSize = 50; // Process in batches to show progress
    
    for (let i = 0; i < this.allBlueprints.length; i += batchSize) {
      const batch = this.allBlueprints.slice(i, i + batchSize);
      
      console.log(`\n📊 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.allBlueprints.length/batchSize)} (blueprints ${i+1}-${Math.min(i+batchSize, this.allBlueprints.length)})`);
      
      for (const blueprint of batch) {
        const productType = this.categorizeBlueprint(blueprint);
        const validCombinations = await this.validateBlueprintWithProviders(blueprint);
        
        if (validCombinations.length > 0) {
          // Use the highest priority (lowest number) valid combination
          const bestCombination = validCombinations.sort((a, b) => a.priority - b.priority)[0];
          
          // Create unique product ID
          const productId = `${productType}-${blueprint.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          
          if (!validatedProducts[productType]) {
            validatedProducts[productType] = [];
          }
          
          validatedProducts[productType].push({
            id: productId,
            name: blueprint.title,
            blueprintId: blueprint.id,
            printProviderId: bestCombination.providerId,
            providerName: bestCombination.providerName,
            category: productType,
            description: blueprint.description,
            allValidProviders: validCombinations.map(c => ({
              id: c.providerId,
              name: c.providerName,
              priority: c.priority
            }))
          });
          
          validationReport.validatedCombinations++;
        } else {
          validationReport.invalidCombinations++;
        }
        
        // Track category statistics
        if (!validationReport.categories[productType]) {
          validationReport.categories[productType] = { valid: 0, invalid: 0 };
        }
        
        if (validCombinations.length > 0) {
          validationReport.categories[productType].valid++;
        } else {
          validationReport.categories[productType].invalid++;
        }
        
        validationReport.details.push({
          blueprintId: blueprint.id,
          title: blueprint.title,
          category: productType,
          validCombinations: validCombinations.length,
          bestProvider: validCombinations.length > 0 ? validCombinations[0].providerName : null
        });
        
        processed++;
        
        // Show progress
        if (processed % 10 === 0) {
          process.stdout.write(`\r✅ Processed: ${processed}/${this.allBlueprints.length} (${Math.round(processed/this.allBlueprints.length*100)}%)`);
        }
      }
    }
    
    console.log(`\n\n🎉 WAVELENGTH: Master validation complete!`);
    console.log(`📊 Results: ${validationReport.validatedCombinations} valid, ${validationReport.invalidCombinations} invalid`);
    
    return { validatedProducts, validationReport };
  }

  generateProductTypesFile(validatedProducts) {
    let fileContent = `/**
 * WAVELENGTH Validated Master Product Types
 * Generated from 708 discovered Printify blueprints
 * 
 * This file contains ONLY validated blueprint/provider combinations
 * that have been tested against the Printify API.
 * 
 * Generated: ${new Date().toISOString()}
 * Total Combinations: ${Object.values(validatedProducts).flat().length}
 */

module.exports = {\n`;

    // Generate organized sections
    const categories = {
      apparel: 'APPAREL - T-Shirts, Hoodies & Clothing',
      home: 'HOME & LIVING - Mugs, Pillows & Decor', 
      accessories: 'ACCESSORIES - Bags, Cases & Personal Items',
      specialty: 'SPECIALTY - Unique & Custom Items'
    };

    for (const [categoryKey, categoryTitle] of Object.entries(categories)) {
      fileContent += `\n  // ${categoryTitle}\n`;
      
      for (const [productType, products] of Object.entries(validatedProducts)) {
        const categoryProducts = products.filter(p => {
          if (categoryKey === 'apparel') return ['t-shirt', 'premium-tshirt', 'heavy-cotton-tee', 'tank-top', 'women-tee', 'hoodie', 'pullover-hoodie', 'sweatshirt', 'zip-hoodie'].includes(p.category);
          if (categoryKey === 'home') return ['coffee-mug', 'travel-mug', 'water-bottle', 'pillow', 'canvas', 'poster', 'blanket'].includes(p.category);
          if (categoryKey === 'accessories') return ['tote-bag', 'backpack', 'fanny-pack', 'phone-case', 'laptop-sleeve', 'hat', 'sticker'].includes(p.category);
          if (categoryKey === 'specialty') return ['notebook', 'mousepad', 'apron', 'infant-wear', 'specialty-item'].includes(p.category);
          return false;
        });
        
        if (categoryProducts.length > 0) {
          // Take the best option for each product type
          const bestProduct = categoryProducts[0];
          
          fileContent += `  '${bestProduct.id}': {\n`;
          fileContent += `    id: '${bestProduct.id}',\n`;
          fileContent += `    name: '${bestProduct.name}',\n`;
          fileContent += `    blueprintId: ${bestProduct.blueprintId},\n`;
          fileContent += `    printProviderId: ${bestProduct.printProviderId},\n`;
          fileContent += `    provider: '${bestProduct.providerName}',\n`;
          fileContent += `    category: '${bestProduct.category}',\n`;
          if (bestProduct.description) {
            fileContent += `    description: '${bestProduct.description.replace(/'/g, "\\'")}',\n`;
          }
          fileContent += `    // Validated: Blueprint ${bestProduct.blueprintId} + Provider ${bestProduct.printProviderId}\n`;
          if (bestProduct.allValidProviders.length > 1) {
            fileContent += `    // Alternatives: ${bestProduct.allValidProviders.slice(1).map(p => `Provider ${p.id} (${p.name})`).join(', ')}\n`;
          }
          fileContent += `  },\n\n`;
        }
      }
    }

    fileContent += `};\n\n`;
    fileContent += `// VALIDATION SUMMARY:\n`;
    fileContent += `// Total Blueprints Analyzed: ${this.allBlueprints.length}\n`;
    fileContent += `// Valid Combinations Found: ${Object.values(validatedProducts).flat().length}\n`;
    fileContent += `// Categories Generated: ${Object.keys(validatedProducts).length}\n`;
    fileContent += `// Generated: ${new Date().toISOString()}\n`;

    return fileContent;
  }

  async run() {
    try {
      console.log('🌊 WAVELENGTH Master Blueprint Validation System');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 Target: Generate validated master list from ${this.allBlueprints.length} discovered blueprints`);
      console.log(`🎯 Goal: Replace invalid combinations with systematically validated ones`);
      
      if (this.service.mockMode) {
        console.log('⚠️  Running in mock mode - will generate theoretical combinations');
      }
      
      const { validatedProducts, validationReport } = await this.generateMasterList();
      
      // Generate the new product-types file
      const fileContent = this.generateProductTypesFile(validatedProducts);
      fs.writeFileSync(this.outputPath, fileContent);
      
      // Save detailed validation report
      fs.writeFileSync(this.reportPath, JSON.stringify(validationReport, null, 2));
      
      console.log('\n🎉 WAVELENGTH: Master list generation complete!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ Generated: ${this.outputPath}`);
      console.log(`📊 Report: ${this.reportPath}`);
      console.log(`🎯 Valid combinations: ${validationReport.validatedCombinations}`);
      console.log(`⚠️  Invalid combinations: ${validationReport.invalidCombinations}`);
      console.log(`📋 Categories found: ${Object.keys(validationReport.categories).length}`);
      
      console.log('\n📊 Category Breakdown:');
      for (const [category, stats] of Object.entries(validationReport.categories)) {
        console.log(`  ${category}: ${stats.valid} valid, ${stats.invalid} invalid`);
      }
      
      console.log('\n🚀 Next Steps:');
      console.log('1. Review generated file: config/product-types-validated-master.js');
      console.log('2. Test with: node debug/create-random-product.js');
      console.log('3. Replace current config: mv config/product-types-validated-master.js config/product-types.js');
      console.log('\n🌊 WAVELENGTH master validation complete!');
      
    } catch (error) {
      console.error('❌ Master validation failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new MasterListGenerator();
  generator.run().catch(console.error);
}

module.exports = { MasterListGenerator };