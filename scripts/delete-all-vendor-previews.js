#!/usr/bin/env node
require('dotenv').config();

async function deleteAllVendorPreviews() {
    console.log('🗑️ DELETING ALL VENDOR PREVIEW PRODUCTS');
    console.log('========================================\n');
    
    const MerchandiseDatabase = require('../services/merchandise-database');
    
    console.log('📋 Fetching all vendor previews...');
    const previews = await MerchandiseDatabase.getAllVendorPreviews();
    
    console.log(`Found ${previews.length} vendor preview products\n`);
    
    if (previews.length === 0) {
        console.log('✅ No vendor previews to delete');
        return;
    }
    
    console.log('🗑️ Deleting products...');
    let count = 0;
    
    for (const preview of previews) {
        const productId = preview.productId;
        console.log(`   Deleting: ${productId} - ${preview.title}`);
        await MerchandiseDatabase.deleteCachedPreview(productId);
        count++;
    }
    
    console.log(`\n✅ Deleted ${count} vendor preview products`);
}

deleteAllVendorPreviews()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
