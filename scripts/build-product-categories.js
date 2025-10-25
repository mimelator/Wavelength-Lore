/**
 * Build Product Categories - Analyze vendor catalog and create tiered categories
 */

const fs = require('fs');
const path = require('path');

// Load the vendor catalog
const catalogPath = path.join(__dirname, '../config/printify-vendor-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

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
  if (t.includes('phone') || t.includes('case') || t.includes('airpod') ||
      t.includes('laptop') || t.includes('tablet')) {
    return { main: 'tech', sub: 'cases' };
  }
  
  // Tech & Electronics
  if (t.includes('mouse') || t.includes('pad') || t.includes('gaming') ||
      t.includes('wireless') || t.includes('charger') || t.includes('speaker')) {
    return { main: 'tech', sub: 'accessories' };
  }
  
  // Kitchen & Dining
  if (t.includes('cutting') || t.includes('board') || t.includes('serving') ||
      t.includes('tray') || t.includes('coaster') || t.includes('napkin')) {
    return { main: 'kitchen', sub: 'dining' };
  }
  if (t.includes('apron') || t.includes('towel') || t.includes('mitt')) {
    return { main: 'kitchen', sub: 'cooking' };
  }
  
  // Kids & Baby
  if (t.includes('baby') || t.includes('infant') || t.includes('toddler') ||
      t.includes('kids') || t.includes('youth') || t.includes('children')) {
    return { main: 'kids', sub: 'clothing' };
  }
  
  // Specialty Items
  if (t.includes('sticker') || t.includes('magnet') || t.includes('pin') ||
      t.includes('patch') || t.includes('keychain')) {
    return { main: 'specialty', sub: 'collectibles' };
  }
  
  // Default fallback
  return { main: 'specialty', sub: 'other' };
}

function buildCategorizedCatalog() {
  console.log('🏗️ Building categorized product catalog...\n');
  
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
    kitchen: {
      name: 'Kitchen & Dining',
      icon: '🍽️',
      description: 'Kitchen tools, dining accessories, and cookware',
      subcategories: {
        dining: { name: 'Dining & Serving', products: [] },
        cooking: { name: 'Kitchen Tools', products: [] }
      }
    },
    kids: {
      name: 'Kids & Baby',
      icon: '👶',
      description: 'Children\'s clothing and baby items',
      subcategories: {
        clothing: { name: 'Kids Clothing', products: [] },
        accessories: { name: 'Kids Accessories', products: [] }
      }
    },
    specialty: {
      name: 'Specialty Items',
      icon: '🎁',
      description: 'Unique and specialty products',
      subcategories: {
        collectibles: { name: 'Stickers & Collectibles', products: [] },
        other: { name: 'Other Items', products: [] }
      }
    }
  };
  
  // Process each product combination
  let totalProducts = 0;
  const searchIndex = [];
  
  for (const combination of catalog.combinations) {
    const category = categorizeProduct(combination.blueprint_title, combination.blueprint_description);
    
    const product = {
      blueprint_id: combination.blueprint_id,
      blueprint_title: combination.blueprint_title,
      blueprint_description: combination.blueprint_description,
      blueprint_brand: combination.blueprint_brand,
      provider_id: combination.provider_id,
      provider_title: combination.provider_title,
      provider_location: combination.provider_location,
      tags: generateTags(combination),
      searchTerms: generateSearchTerms(combination)
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
    searchIndex
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

// Execute
const categorizedCatalog = buildCategorizedCatalog();

// Save the categorized catalog
const outputPath = path.join(__dirname, '../config/product-catalog-categorized.json');
fs.writeFileSync(outputPath, JSON.stringify(categorizedCatalog, null, 2));

console.log(`\n💾 Categorized catalog saved to: ${outputPath}`);
console.log('🎯 Ready for tiered navigation implementation!');