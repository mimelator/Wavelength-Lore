#!/usr/bin/env node

/**
 * Generate Full Product Catalog from Complete Product Types
 * Creates a comprehensive categorized catalog with all available products
 */

const fs = require('fs');
const path = require('path');

// Load the complete product types
const { ProductTypes } = require('../config/product-types-complete.js');

function categorizeProduct(title, description = '') {
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  
  // Apparel & Clothing
  if (t.includes('tee') || t.includes('shirt') || t.includes('hoodie') || 
      t.includes('tank') || t.includes('sweatshirt') || t.includes('polo') ||
      t.includes('jersey') || t.includes('jacket') || t.includes('vest')) {
    
    if (t.includes('hoodie') || t.includes('sweatshirt') || t.includes('fleece')) {
      return { main: 'apparel', sub: 'hoodies' };
    }
    if (t.includes('tank') || t.includes('sleeveless') || t.includes('racerback')) {
      return { main: 'apparel', sub: 'tanks' };
    }
    if (t.includes('polo') || t.includes('collar')) {
      return { main: 'apparel', sub: 'polos' };
    }
    if (t.includes('jacket') || t.includes('vest') || t.includes('windbreaker')) {
      return { main: 'apparel', sub: 'outerwear' };
    }
    return { main: 'apparel', sub: 'tshirts' };
  }
  
  // Home & Living
  if (t.includes('mug') || t.includes('cup') || t.includes('tumbler') || 
      t.includes('bottle') || t.includes('glass')) {
    return { main: 'home', sub: 'drinkware' };
  }
  if (t.includes('pillow') || t.includes('blanket') || t.includes('throw') ||
      t.includes('cushion') || t.includes('coverlet')) {
    return { main: 'home', sub: 'bedding' };
  }
  if (t.includes('poster') || t.includes('canvas') || t.includes('print') ||
      t.includes('art') || t.includes('frame') || t.includes('wall') || 
      t.includes('tapestry') || t.includes('decal')) {
    return { main: 'home', sub: 'wall-art' };
  }
  if (t.includes('candle') || t.includes('ornament') || t.includes('decoration') ||
      t.includes('clock')) {
    return { main: 'home', sub: 'decor' };
  }
  
  // Bags & Accessories
  if (t.includes('bag') || t.includes('tote') || t.includes('backpack') ||
      t.includes('fanny') || t.includes('clutch') || t.includes('wallet') ||
      t.includes('duffel') || t.includes('weekender') || t.includes('pouch')) {
    return { main: 'accessories', sub: 'bags' };
  }
  if (t.includes('hat') || t.includes('cap') || t.includes('beanie') ||
      t.includes('trucker') || t.includes('snapback')) {
    return { main: 'accessories', sub: 'headwear' };
  }
  if (t.includes('sticker') || t.includes('magnet') || t.includes('pin') ||
      t.includes('patch') || t.includes('keychain')) {
    return { main: 'accessories', sub: 'collectibles' };
  }
  
  // Tech & Electronics
  if (t.includes('phone') || t.includes('case') || t.includes('airpod') ||
      t.includes('laptop') || t.includes('tablet') || t.includes('flexi') ||
      t.includes('snap') || t.includes('tough') || t.includes('slim')) {
    return { main: 'tech', sub: 'cases' };
  }
  if (t.includes('mouse') || t.includes('pad') || t.includes('gaming') ||
      t.includes('wireless') || t.includes('charger') || t.includes('speaker')) {
    return { main: 'tech', sub: 'accessories' };
  }
  
  // Default fallback
  return { main: 'specialty', sub: 'other' };
}

function generateTags(product) {
  const tags = ['wavelength', 'lore'];
  const title = product.name.toLowerCase();
  
  if (title.includes('cotton')) tags.push('cotton');
  if (title.includes('premium')) tags.push('premium');
  if (title.includes('organic')) tags.push('organic');
  if (title.includes('heavy')) tags.push('heavy-duty');
  if (product.tags) tags.push(...product.tags.filter(tag => !tags.includes(tag)));
  
  return [...new Set(tags)]; // Remove duplicates
}

function generateSearchTerms(product, provider) {
  return [
    product.name,
    provider?.title || 'Generic',
    ...generateTags(product)
  ].filter(Boolean).join(' ').toLowerCase();
}

function generateFullCatalog() {
  console.log('🏗️ Generating full product catalog from complete product types...\n');
  
  const categories = {
    apparel: {
      name: 'Apparel & Clothing',
      icon: '👕',
      description: 'T-shirts, hoodies, and wearable items',
      subcategories: {
        tshirts: { name: 'T-Shirts & Tops', products: [] },
        hoodies: { name: 'Hoodies & Sweatshirts', products: [] },
        tanks: { name: 'Tank Tops & Sleeveless', products: [] },
        polos: { name: 'Polo Shirts', products: [] },
        outerwear: { name: 'Jackets & Outerwear', products: [] }
      }
    },
    home: {
      name: 'Home & Living',
      icon: '🏠',
      description: 'Mugs, pillows, wall art, and home decor',
      subcategories: {
        drinkware: { name: 'Mugs & Drinkware', products: [] },
        bedding: { name: 'Pillows & Bedding', products: [] },
        'wall-art': { name: 'Posters & Wall Art', products: [] },
        decor: { name: 'Home Decor', products: [] }
      }
    },
    accessories: {
      name: 'Bags & Accessories',
      icon: '🎒',
      description: 'Bags, hats, and personal accessories',
      subcategories: {
        bags: { name: 'Bags & Totes', products: [] },
        headwear: { name: 'Hats & Headwear', products: [] },
        collectibles: { name: 'Stickers & Collectibles', products: [] },
        jewelry: { name: 'Jewelry & Personal', products: [] }
      }
    },
    tech: {
      name: 'Tech & Electronics',
      icon: '📱',
      description: 'Phone cases, tech accessories, and gadgets',
      subcategories: {
        cases: { name: 'Phone & Device Cases', products: [] },
        accessories: { name: 'Tech Accessories', products: [] }
      }
    },
    specialty: {
      name: 'Specialty Items',
      icon: '🎁',
      description: 'Unique and specialty products',
      subcategories: {
        other: { name: 'Other Items', products: [] }
      }
    }
  };
  
  let totalProducts = 0;
  const searchIndex = [];
  
  // Mock providers for variety (since we don't have real provider data)
  const mockProviders = [
    { id: 1, title: 'Print Provider' },
    { id: 2, title: 'Art Studio' },
    { id: 3, title: 'Marco Fine Arts' },
    { id: 8, title: 'Apparel Co' },
    { id: 10, title: 'Home Decor' },
    { id: 12, title: 'Bag Maker' },
    { id: 14, title: 'Hat Company' },
    { id: 15, title: 'Print Provider' },
    { id: 18, title: 'Tech Cases' },
    { id: 22, title: 'Drinkware Plus' },
    { id: 25, title: 'Home Decor' },
    { id: 29, title: 'Monster Digital' },
    { id: 31, title: 'Print Shop' }
  ];
  
  // Process each category from ProductTypes
  for (const [categoryKey, categoryData] of Object.entries(ProductTypes)) {
    console.log(`Processing ${categoryData.name}...`);
    
    for (const product of categoryData.products) {
      // Create multiple provider combinations for each product
      for (const provider of mockProviders.slice(0, Math.min(3, mockProviders.length))) {
        const category = categorizeProduct(product.name, product.description);
        
        const catalogProduct = {
          blueprint_id: product.blueprintId,
          blueprint_title: product.name,
          blueprint_brand: product.tags?.find(tag => 
            ['champion', 'gildan', 'next level', 'bella canvas'].includes(tag.toLowerCase())
          ) || 'Generic',
          provider_id: provider.id,
          provider_title: provider.title,
          tags: generateTags(product),
          searchTerms: generateSearchTerms(product, provider),
          estimatedPrice: product.basePrice || 1899,
          popularityScore: Math.floor(Math.random() * 100) + 1
        };
        
        // Add to appropriate category
        if (categories[category.main] && categories[category.main].subcategories[category.sub]) {
          categories[category.main].subcategories[category.sub].products.push(catalogProduct);
          totalProducts++;
        }
        
        // Add to search index
        searchIndex.push({
          ...catalogProduct,
          category: category.main,
          subcategory: category.sub
        });
      }
    }
  }
  
  // Calculate stats
  for (const [catKey, category] of Object.entries(categories)) {
    let categoryTotal = 0;
    for (const [subKey, subcategory] of Object.entries(category.subcategories)) {
      categoryTotal += subcategory.products.length;
    }
    category.productCount = categoryTotal;
  }
  
  console.log('\n📊 Categorization Results:');
  for (const [key, category] of Object.entries(categories)) {
    console.log(`   ${category.icon} ${category.name}: ${category.productCount} products`);
    for (const [subKey, sub] of Object.entries(category.subcategories)) {
      if (sub.products.length > 0) {
        console.log(`      - ${sub.name}: ${sub.products.length}`);
      }
    }
  }
  
  console.log(`\n✅ Total products generated: ${totalProducts}`);
  
  return {
    generatedAt: new Date().toISOString(),
    totalProducts,
    categories,
    searchIndex,
    note: `Full catalog generated from ${Object.keys(ProductTypes).length} product categories with ${Object.values(ProductTypes).reduce((sum, cat) => sum + cat.products.length, 0)} base products`
  };
}

// Execute
const fullCatalog = generateFullCatalog();

// Save the full catalog
const outputPath = path.join(__dirname, '../config/product-catalog-categorized.json');
fs.writeFileSync(outputPath, JSON.stringify(fullCatalog, null, 2));

console.log(`\n💾 Full catalog saved to: ${outputPath}`);
console.log('🎯 Ready for production use with complete product catalog!');