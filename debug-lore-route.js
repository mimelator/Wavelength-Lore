// Debug the lore route data
const express = require('express');
const { getLoreByIdSync } = require('./helpers/lore-helpers');

async function debugLoreRoute() {
    console.log('🔍 Debugging lore route data...');
    
    // Simulate what the lore route does
    const loreId = 'ice-blue-diamond';
    const lore = getLoreByIdSync(loreId);
    
    console.log('📊 Lore data passed to template:');
    console.log('  ID:', lore?.id);
    console.log('  Title:', lore?.title);
    console.log('  Enhanced Title?:', !!lore?.enhanced_title);
    console.log('  Tagline?:', !!lore?.tagline);
    console.log('  Enhanced Description?:', !!lore?.enhanced_description);
    console.log('  CTA Hook?:', !!lore?.cta_hook);
    console.log('  Power Statement?:', !!lore?.power_statement);
    
    console.log('\n🎯 Template condition check:');
    const conditionResult = !!(lore?.enhanced_title || lore?.tagline || lore?.enhanced_description || lore?.cta_hook || lore?.power_statement);
    console.log('  Condition result:', conditionResult);
    
    if (lore?.enhanced_title) {
        console.log('\n✅ Enhanced Title Value (first 200 chars):');
        console.log('  ', lore.enhanced_title.substring(0, 200) + '...');
    }
    
    if (lore?.tagline) {
        console.log('\n✅ Tagline Value:');
        console.log('  ', lore.tagline);
    }
}

debugLoreRoute();