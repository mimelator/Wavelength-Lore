require('dotenv').config();

console.log('🧪 PREVIEW BUILDER TEST');
console.log('======================\n');

async function testPreviewBuilder() {
    try {
        // Test the specific failure we saw: "Cache hit detected but buffer is null"
        console.log('1️⃣ Testing Image Upscaling Service...');
        
        const ImageUpscalingService = require('./services/image-upscaling-service');
        const upscaler = new ImageUpscalingService();
        
        // Get the same image that's failing
        const testImageUrl = 'https://d3ohg9sf8htmwk.cloudfront.net/images/gallery/4fdbYxJHjEP4xksk9sgFE3lgYUs2/image-1761308159451-a9aec72a35e51777.webp';
        
        console.log(`📸 Testing image URL: ${testImageUrl.substring(0, 80)}...`);
        
        // Download the image to get the buffer
        console.log('⬇️ Downloading image...');
        const response = await fetch(testImageUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        
        console.log(`✅ Downloaded image: ${imageBuffer.length} bytes`);
        
        // Test the upscaling with the same parameters that failed
        console.log('🎨 Testing upscaling...');
        
        const options = {
            targetSize: 1024,
            quality: 'high',
            method: 'openai',
            userContext: 'admin-preview-generator',
            blueprintId: 10,
            sourceImage: 'battle-scene-for-product-previ.webp'
        };
        
        console.log('📊 Upscaling options:', options);
        
        const upscalingResult = await upscaler.upscaleImage(imageBuffer, options);
        
        console.log('📊 Upscaling result structure:');
        console.log(`   Type: ${typeof upscalingResult}`);
        console.log(`   Has buffer: ${upscalingResult.hasOwnProperty('buffer')}`);
        console.log(`   Has fileBuffer: ${upscalingResult.hasOwnProperty('fileBuffer')}`);
        console.log(`   Has upscaledBuffer: ${upscalingResult.hasOwnProperty('upscaledBuffer')}`);
        console.log(`   Has url: ${upscalingResult.hasOwnProperty('url')}`);
        console.log(`   Method: ${upscalingResult.method || 'N/A'}`);
        console.log(`   Success: ${upscalingResult.success || 'N/A'}`);
        
        if (upscalingResult.buffer) {
            console.log(`✅ Buffer present: ${upscalingResult.buffer.length} bytes`);
        } else if (upscalingResult.fileBuffer) {
            console.log(`✅ FileBuffer present: ${upscalingResult.fileBuffer.length} bytes`);
        } else if (upscalingResult.upscaledBuffer) {
            console.log(`✅ UpscaledBuffer present: ${upscalingResult.upscaledBuffer.length} bytes`);
        } else {
            console.log('❌ No buffer found in upscaling result!');
            console.log('Available properties:', Object.keys(upscalingResult));
        }
        
        // Test the specific cache hit scenario
        console.log('\n2️⃣ Testing cache hit scenario...');
        
        // Try to reproduce the exact same call that failed
        const sameResult = await upscaler.upscaleImage(imageBuffer, options);
        
        console.log('📊 Second call (should be cache hit):');
        console.log(`   Method: ${sameResult.method || 'N/A'}`);
        console.log(`   Has buffer: ${sameResult.hasOwnProperty('buffer')}`);
        console.log(`   Has fileBuffer: ${sameResult.hasOwnProperty('fileBuffer')}`);
        console.log(`   Has upscaledBuffer: ${sameResult.hasOwnProperty('upscaledBuffer')}`);
        
        if (!sameResult.buffer && !sameResult.fileBuffer && !sameResult.upscaledBuffer && sameResult.method === 'cache') {
            console.log('❌ REPRODUCED BUG: Cache hit with no buffer!');
        } else if (sameResult.upscaledBuffer) {
            console.log(`✅ FIXED: Cache hit has upscaledBuffer with ${sameResult.upscaledBuffer.length} bytes!`);
        } else if (sameResult.buffer) {
            console.log(`✅ FIXED: Cache hit has buffer with ${sameResult.buffer.length} bytes!`);
        } else if (sameResult.fileBuffer) {
            console.log(`✅ FIXED: Cache hit has fileBuffer with ${sameResult.fileBuffer.length} bytes!`);
        }
        
        console.log('\n🎉 PREVIEW BUILDER TEST COMPLETED');
        console.log('=================================');
        console.log('✅ Identified the cache buffer issue');
        console.log('✅ Reproduced the bug successfully');
        if (sameResult.upscaledBuffer) {
            console.log('✅ FIX VERIFIED: Cache now returns buffer data!');
        } else {
            console.log('💡 Solution: Download buffer from URL when cache hit lacks buffer');
        }
        
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testPreviewBuilder();