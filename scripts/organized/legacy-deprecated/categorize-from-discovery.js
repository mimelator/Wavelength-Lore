/**
 * Categorize From Discovery - Use the actual discovery results to build categories
 */

const fs = require('fs');
const path = require('path');

// Sample data based on our discovery results (1,302 combinations)
const sampleCombinations = [
  { blueprint_id: 5, blueprint_title: 'Unisex Cotton Crew Tee', blueprint_brand: 'Next Level', provider_id: 3, provider_title: 'Marco Fine Arts' },
  { blueprint_id: 6, blueprint_title: 'Unisex Heavy Cotton Tee', blueprint_brand: 'Gildan', provider_id: 29, provider_title: 'Monster Digital' },
  { blueprint_id: 377, blueprint_title: 'Coffee Mug', blueprint_brand: 'Generic', provider_id: 15, provider_title: 'Print Provider' },
  { blueprint_id: 468, blueprint_title: 'Canvas Tote Bag', blueprint_brand: 'Generic', provider_id: 12, provider_title: 'Bag Maker' },
  { blueprint_id: 533, blueprint_title: 'Unisex Hoodie', blueprint_brand: 'Champion', provider_id: 8, provider_title: 'Apparel Co' },
  { blueprint_id: 604, blueprint_title: 'Vacuum Insulated Tumbler', blueprint_brand: 'Generic', provider_id: 22, provider_title: 'Drinkware Plus' },
  { blueprint_id: 758, blueprint_title: 'Phone Case', blueprint_brand: 'Generic', provider_id: 18, provider_title: 'Tech Cases' },
  { blueprint_id: 823, blueprint_title: 'Throw Pillow', blueprint_brand: 'Generic', provider_id: 25, provider_title: 'Home Decor' },
  { blueprint_id: 888, blueprint_title: 'Baseball Cap', blueprint_brand: 'Generic', provider_id: 14, provider_title: 'Hat Company' },
  { blueprint_id: 966, blueprint_title: 'Poster Print', blueprint_brand: 'Generic', provider_id: 31, provider_title: 'Print Shop' }
];

function categorizeProduct(title, brand = '') {
  const t = title.toLowerCase();
  const b = brand.toLowerCase();
  
  // Apparel & Clothing
  if (t.includes('tee') || t.includes('shirt') || t.includes('hoodie') || 
      t.includes('tank') || t.includes('sweatshirt') || t.includes('polo') ||
      t.includes('jersey') || t.includes('jacket') || t.includes('vest')) {
    
    if (t.includes('hoodie') || t.includes('sweatshirt') || t.includes('fleece')) {
      return { main: 'apparel', sub: 'hoodies' };
    }
    if (t.includes('tank') || t.includes('sleeveless')) {
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
      t.includes('art') || t.includes('frame')) {
    return { main: 'home', sub: 'wall-art' };
  }
  if (t.includes('candle') || t.includes('ornament') || t.includes('decoration')) {
    return { main: 'home', sub: 'decor' };
  }
  
  // Bags & Accessories
  if (t.includes('bag') || t.includes('tote') || t.includes('backpack') ||
      t.includes('fanny') || t.includes('clutch') || t.includes('wallet')) {
    return { main: 'accessories', sub: 'bags' };
  }
  if (t.includes('hat') || t.includes('cap') || t.includes('beanie') ||
      t.includes('trucker') || t.includes('snapback')) {
    return { main: 'accessories', sub: 'headwear' };
  }
  
  // Tech & Electronics
  if (t.includes('phone') || t.includes('case') || t.includes('airpod') ||
      t.includes('laptop') || t.includes('tablet')) {
    return { main: 'tech', sub: 'cases' };
  }
  if (t.includes('mouse') || t.includes('pad') || t.includes('gaming') ||
      t.includes('wireless') || t.includes('charger') || t.includes('speaker')) {
    return { main: 'tech', sub: 'accessories' };
  }
  
  // Default fallback
  return { main: 'specialty', sub: 'other' };
}

function buildCategorizedCatalog() {
  console.log('🏗️ Building categorized product catalog from sample data...\n');
  
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
  
  // Process sample products
  let totalProducts = 0;
  const searchIndex = [];
  
  for (const combination of sampleCombinations) {
    const category = categorizeProduct(combination.blueprint_title, combination.blueprint_brand);
    
    const product = {
      blueprint_id: combination.blueprint_id,
      blueprint_title: combination.blueprint_title,
      blueprint_brand: combination.blueprint_brand,
      provider_id: combination.provider_id,
      provider_title: combination.provider_title,
      tags: generateTags(combination),
      searchTerms: generateSearchTerms(combination),
      estimatedPrice: estimatePrice(combination.blueprint_title),
      popularityScore: Math.floor(Math.random() * 100) + 1
    };
    
    // Add to appropriate category
    if (categories[category.main] && categories[category.main].subcategories[category.sub]) {
      categories[category.main].subcategories[category.sub].products.push(product);
      totalProducts++;
    }
    
    // Add to search index
    searchIndex.push({
      ...product,
      category: category.main,
      subcategory: category.sub
    });
  }
  
  // Calculate stats
  for (const [catKey, category] of Object.entries(categories)) {
    let categoryTotal = 0;
    for (const [subKey, subcategory] of Object.entries(category.subcategories)) {
      categoryTotal += subcategory.products.length;
    }
    category.productCount = categoryTotal;
  }
  
  console.log('📊 Categorization Results:');
  for (const [key, category] of Object.entries(categories)) {
    console.log(`   ${category.icon} ${category.name}: ${category.productCount} products`);
    for (const [subKey, sub] of Object.entries(category.subcategories)) {
      if (sub.products.length > 0) {
        console.log(`      - ${sub.name}: ${sub.products.length}`);
      }
    }
  }
  
  console.log(`\n✅ Total products categorized: ${totalProducts}`);
  
  return {
    generatedAt: new Date().toISOString(),
    totalProducts,
    categories,
    searchIndex,
    note: 'Sample data - replace with actual 1,302 combinations when available'
  };
}

function generateTags(combination) {
  const tags = ['wavelength', 'lore'];
  const title = combination.blueprint_title.toLowerCase();
  
  if (title.includes('cotton')) tags.push('cotton');
  if (title.includes('premium')) tags.push('premium');
  if (title.includes('organic')) tags.push('organic');
  if (title.includes('heavy')) tags.push('heavy-duty');
  if (combination.blueprint_brand) tags.push(combination.blueprint_brand.toLowerCase());
  
  return tags;
}

function generateSearchTerms(combination) {
  return [
    combination.blueprint_title,
    combination.blueprint_brand,
    combination.provider_title,
    ...generateTags(combination)
  ].filter(Boolean).join(' ').toLowerCase();
}

function estimatePrice(title) {
  const t = title.toLowerCase();
  if (t.includes('hoodie')) return 3499; // $34.99
  if (t.includes('mug') || t.includes('tumbler')) return 1599; // $15.99
  if (t.includes('pillow')) return 2499; // $24.99
  if (t.includes('phone') || t.includes('case')) return 1299; // $12.99
  return 1899; // $18.99 default
}

// Execute
const categorizedCatalog = buildCategorizedCatalog();

// Save the categorized catalog
const outputPath = path.join(__dirname, '../config/product-catalog-categorized.json');
fs.writeFileSync(outputPath, JSON.stringify(categorizedCatalog, null, 2));

console.log(`\n💾 Categorized catalog saved to: ${outputPath}`);
console.log('🎯 Ready for tiered navigation implementation!');