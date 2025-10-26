#!/usr/bin/env node

/**
 * WAVELENGTH Full Validated Catalog Generator
 * Generates ALL 142 validated products instead of just one per category
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

class FullCatalogGenerator {
  constructor() {
    this.debugReportPath = path.join(__dirname, '..', 'debug', 'blueprint-validation-report.json');
  }

  async generateFullCatalog() {
    console.log('🌊 WAVELENGTH: Full Validated Catalog Generator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Load the validation report
    if (!fs.existsSync(this.debugReportPath)) {
      throw new Error('❌ Validation report not found. Run generate-validated-master-list.js first.');
    }
    
    const validationReport = JSON.parse(fs.readFileSync(this.debugReportPath, 'utf8'));
    const validatedCombinations = validationReport.details.filter(detail => detail.validCombinations > 0);
    
    console.log(`📊 Found ${validatedCombinations.length} validated combinations`);
    console.log(`🎯 Generating full catalog with ALL products...`);
    
    // Generate structured catalog
    const fullCatalog = this.generateStructuredCatalog(validatedCombinations);
    
    // Write the file
    const outputPath = path.join(__dirname, '..', 'config', 'product-types-full-validated.js');
    const fileContent = this.generateCatalogFile(fullCatalog, validatedCombinations.length);
    
    fs.writeFileSync(outputPath, fileContent);
    
    console.log('');
    console.log('🎉 WAVELENGTH: Full catalog generation complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Generated: ${outputPath}`);
    console.log(`📊 Total products: ${Object.keys(fullCatalog).length}`);
    console.log(`🎯 All ${validatedCombinations.length} validated combinations included`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Review generated file');
    console.log('2. Replace current config: cp config/product-types-full-validated.js config/product-types-master-structured.js');
    console.log('3. Restart server to see all products');
    
    return fullCatalog;
  }

  generateStructuredCatalog(validatedCombinations) {
    const catalog = {};
    
    validatedCombinations.forEach((combo, index) => {
      const productId = `validated-${combo.blueprintId}`.toLowerCase();
      
      catalog[productId] = {
        id: productId,
        name: combo.title || `Product ${combo.blueprintId}`,
        blueprintId: combo.blueprintId,
        printProviderId: 999, // Default provider ID - will be selected at product creation
        provider: combo.bestProvider,
        category: combo.category || 'specialty',
        description: `Validated ${combo.category} product with ${combo.validCombinations} provider options`,
        validProviderCount: combo.validCombinations,
        validationIndex: index + 1
      };
    });
    
    return catalog;
  }

  generateCatalogFile(catalog, totalCount) {
    const now = new Date();
    let content = `/**
 * WAVELENGTH Full Validated Product Types Catalog
 * Generated: ${now.toISOString()}
 * Total Products: ${totalCount}
 * 
 * This file contains ALL validated blueprint/provider combinations
 * Compatible with merchandise store structure requirements
 */

const ProductTypes = {\n`;

    // Group by category for better organization
    const categories = {};
    Object.values(catalog).forEach(product => {
      const cat = product.category || 'specialty';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(product);
    });

    // Sort categories and add products
    const sortedCategories = Object.keys(categories).sort();
    
    sortedCategories.forEach(categoryName => {
      content += `\n  // ${categoryName.toUpperCase()} CATEGORY\n`;
      
      categories[categoryName].forEach(product => {
        content += `  '${product.id}': {\n`;
        content += `    id: '${product.id}',\n`;
        content += `    name: '${product.name.replace(/'/g, "\\'")}',\n`;
        content += `    blueprintId: ${product.blueprintId},\n`;
        content += `    printProviderId: ${product.printProviderId},\n`;
        content += `    provider: '${product.provider}',\n`;
        content += `    category: '${product.category}',\n`;
        if (product.description) {
          content += `    description: '${product.description.replace(/'/g, "\\'")}',\n`;
        }
        content += `    validProviderCount: ${product.validProviderCount},\n`;
        content += `    validationIndex: ${product.validationIndex}\n`;
        content += `  },\n\n`;
      });
    });

    content += `};\n\n`;
    
    // Add helper functions compatible with existing structure
    content += `// Helper functions for compatibility\n`;
    content += `const getAllProducts = () => {\n`;
    content += `  return Object.values(ProductTypes);\n`;
    content += `};\n\n`;
    
    content += `const findProductById = (id) => {\n`;
    content += `  return ProductTypes[id] || null;\n`;
    content += `};\n\n`;
    
    content += `const getProductsByCategory = (category) => {\n`;
    content += `  return Object.values(ProductTypes).filter(product => product.category === category);\n`;
    content += `};\n\n`;
    
    content += `const getCategories = () => {\n`;
    content += `  const categories = new Set();\n`;
    content += `  Object.values(ProductTypes).forEach(product => categories.add(product.category));\n`;
    content += `  return Array.from(categories).sort();\n`;
    content += `};\n\n`;
    
    content += `module.exports = {\n`;
    content += `  ProductTypes,\n`;
    content += `  getAllProducts,\n`;
    content += `  findProductById,\n`;
    content += `  getProductsByCategory,\n`;
    content += `  getCategories\n`;
    content += `};\n\n`;
    
    content += `// FULL CATALOG SUMMARY:\n`;
    content += `// Total Products: ${totalCount}\n`;
    content += `// Categories: ${sortedCategories.length}\n`;
    content += `// Generated: ${now.toISOString()}\n`;
    content += `// All validated combinations included\n`;
    
    return content;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new FullCatalogGenerator();
  generator.generateFullCatalog().catch(console.error);
}

module.exports = FullCatalogGenerator;