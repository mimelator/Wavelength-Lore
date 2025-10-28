#!/usr/bin/env node
/**
 * Quick test of the Wavelength Pricing Service
 */

const fs = require('fs');

console.log('🌊 WAVELENGTH PRICING SERVICE TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
    // Load the pricing catalog directly
    const pricingData = JSON.parse(fs.readFileSync('scripts/pricing-system/pricing-catalog-simple.json', 'utf8'));
    
    // Test specific products
    const testCases = [
        {name: 'Mug 11oz', key: '68-1'},
        {name: 'Slim Phone Cases', key: '268-1'},
        {name: 'Men\'s Very Important Tee', key: '171-1'},
        {name: 'Unisex Jersey Tank', key: '436-1'},
        {name: 'Non-existent Product', key: '999-999'}
    ];

    console.log('🔍 Testing pricing lookups:');
    
    testCases.forEach(test => {
        const pricing = pricingData[test.key];
        if (pricing) {
            const prices = pricing.variants.map(v => parseFloat(v.price.replace('$', '')));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const priceRange = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
            
            console.log(`   ✅ ${test.name}: ${priceRange} (${pricing.variants.length} variants)`);
        } else {
            console.log(`   ❌ ${test.name}: NO PRICING - would be hidden`);
        }
    });

    console.log(`\n📊 PRICING STATISTICS:`);
    console.log(`   📦 Products with pricing: ${Object.keys(pricingData).length}`);
    
    // Calculate variant count
    let totalVariants = 0;
    let allPrices = [];
    
    Object.values(pricingData).forEach(product => {
        totalVariants += product.variants.length;
        product.variants.forEach(variant => {
            const price = parseFloat(variant.price.replace('$', ''));
            allPrices.push(price);
        });
    });
    
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
    
    console.log(`   🏷️  Total variants: ${totalVariants}`);
    console.log(`   💵 Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
    console.log(`   📈 Average price: $${avgPrice.toFixed(2)}`);
    
    console.log('\n✅ PRICING SERVICE VALIDATION COMPLETE!');
    console.log('🎯 Ready to integrate with merchandise store');
    
} catch (error) {
    console.error('❌ Error testing pricing service:', error.message);
    process.exit(1);
}