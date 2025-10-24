require('dotenv').config();

async function checkVendorPreviewData() {
    const VendorPreviewHelper = require('../utils/vendor-preview-helper');
    const helper = new VendorPreviewHelper();
    
    console.log('🔍 CHECKING VENDOR PREVIEW DATA STRUCTURE');
    console.log('=========================================\n');
    
    const previews = await helper.getAllVendorPreviews();
    
    if (previews.length === 0) {
        console.log('❌ No vendor previews found');
        return;
    }
    
    console.log(`Found ${previews.length} vendor previews\n`);
    
    for (const preview of previews.slice(0, 3)) {
        console.log(`📦 Product: ${preview.title}`);
        console.log(`   Product ID: ${preview.productId}`);
        console.log(`   Source Image: ${preview.sourceImage}`);
        console.log(`   Image URL: ${preview.imageUrl || 'NOT SET'}`);
        console.log(`   Blueprint: ${preview.blueprintId}`);
        console.log(`   Provider: ${preview.providerId}`);
        
        if (preview.printifyProduct) {
            console.log(`   Printify Images: ${preview.printifyProduct.images?.length || 0}`);
            if (preview.printifyProduct.images && preview.printifyProduct.images.length > 0) {
                console.log(`   First Printify Image: ${preview.printifyProduct.images[0].src}`);
            }
        }
        console.log('');
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('=============');
    console.log('The catalog page is trying to resolve `sourceImage` field as gallery images');
    console.log('But these are Printify product mockups, not user gallery images');
    console.log('The catalog should use printifyProduct.images[0].src instead of sourceImage');
}

checkVendorPreviewData();
