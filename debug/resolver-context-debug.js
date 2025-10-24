/**
 * Debug script to test ProductImageUrlResolver in server context
 * This will help us understand why it fails in API but works in standalone test
 */

// Load environment the same way the server does
require('dotenv').config();

const ProductImageUrlResolver = require('../utils/product-image-url-resolver');

async function debugResolverInServerContext() {
    console.log('🔧 DEBUGGING RESOLVER IN SERVER CONTEXT');
    console.log('=========================================');
    
    try {
        console.log('\n🌍 Environment Variables:');
        console.log(`ACCESS_KEY_ID: ${process.env.ACCESS_KEY_ID ? 'SET' : 'NOT SET'}`);
        console.log(`SECRET_ACCESS_KEY: ${process.env.SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);
        console.log(`AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
        
        console.log('\n🔗 Creating resolver instance...');
        const resolver = new ProductImageUrlResolver();
        
        console.log('\n🧪 Testing ice-fortress.webp resolution...');
        const result = await resolver.resolveImageUrl('ice-fortress.webp');
        
        console.log('\n📊 RESOLVER RESULT:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('✅ Resolver working correctly');
        } else {
            console.log('❌ Resolver failed');
        }
        
        console.log('\n🔍 Testing direct gallery search...');
        const galleryResult = await resolver.findImageByTitle('ice-fortress.webp');
        
        console.log('\n📊 GALLERY SEARCH RESULT:');
        console.log(`Result: ${galleryResult || 'null'}`);
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugResolverInServerContext();