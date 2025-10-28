require('dotenv').config();
const { OpenAI } = require('openai');
const sharp = require('sharp');
const fs = require('fs');

/**
 * WAVELENGTH: Final test of 1024x1024 optimization with OpenAI
 * This should be fast, efficient, and work reliably
 */
async function testOptimizedOpenAI() {
    console.log('🌊 WAVELENGTH: Testing 1024x1024 optimized OpenAI integration...\n');

    // Initialize OpenAI
    let openai;
    if (!process.env.OPENAI_API_KEY) {
        console.log('❌ OPENAI_API_KEY not found in .env');
        return;
    }
    
    try {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log('✅ OpenAI client initialized\n');
    } catch (error) {
        console.log('❌ OpenAI client failed:', error.message);
        return;
    }

    const testImagePath = 'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp';
    
    if (!fs.existsSync(testImagePath)) {
        console.log(`❌ Test image not found: ${testImagePath}`);
        return;
    }

    try {
        const originalBuffer = fs.readFileSync(testImagePath);
        const metadata = await sharp(originalBuffer).metadata();
        
        console.log(`📸 Original: ${metadata.width}x${metadata.height} ${metadata.format.toUpperCase()}, ${(originalBuffer.length / 1024).toFixed(1)}KB\n`);

        // Optimized conversion to 1024x1024
        console.log('⚡ Converting to optimized 1024x1024...');
        const startTime = Date.now();
        
        const processedBuffer = await sharp(originalBuffer)
            .resize(1024, 1024, { fit: 'cover' }) // Optimized size
            .ensureAlpha() // CRITICAL: Ensure RGBA for OpenAI
            .toColorspace('srgb')
            .png({ 
                quality: 75,
                compressionLevel: 9,
                palette: false, // Force RGBA
                force: true     // Force PNG with alpha
            })
            .toBuffer();
            
        const processingTime = Date.now() - startTime;
        const sizeMB = processedBuffer.length / (1024 * 1024);
        
        console.log(`✅ Processed in ${processingTime}ms → 1024x1024 PNG, ${sizeMB.toFixed(2)}MB\n`);

        // Verify format
        const processedMetadata = await sharp(processedBuffer).metadata();
        console.log(`🔍 Format check:`);
        console.log(`📊 ${processedMetadata.width}x${processedMetadata.height} ${processedMetadata.format.toUpperCase()}`);
        console.log(`📊 Channels: ${processedMetadata.channels}, Has Alpha: ${processedMetadata.hasAlpha}`);
        
        if (sizeMB > 4) {
            console.log('\n❌ Still too large for OpenAI');
            return;
        }

        // OpenAI API call
        console.log('\n🚀 Calling OpenAI images.edit API...');
        const prompt = 'Enhance this illustration with crisp details, vibrant colors, and sharp lines suitable for high-quality printing';
        
        console.log(`📝 Prompt: ${prompt}`);
        console.log(`📊 Image: 1024x1024, ${sizeMB.toFixed(2)}MB`);

        const apiStartTime = Date.now();
        const response = await openai.images.edit({
            image: processedBuffer,
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        });
        const apiTime = Date.now() - apiStartTime;

        if (response && response.data && response.data.length > 0) {
            console.log('\n🎉 SUCCESS! OpenAI API integration working perfectly!');
            console.log(`✅ API response time: ${apiTime}ms`);
            console.log(`✅ Total processing time: ${processingTime + apiTime}ms`);
            console.log(`✅ Response URL: ${response.data[0].url}`);
            console.log('\n📊 OPTIMIZATION SUMMARY:');
            console.log(`⚡ Target size: 1024x1024 (optimized)`);
            console.log(`📉 File size: ${sizeMB.toFixed(2)}MB (${((4 - sizeMB) / 4 * 100).toFixed(1)}% under 4MB limit)`);
            console.log(`🚀 Processing: ${processingTime}ms (much faster than 1800x1800)`);
            console.log(`✅ Format: RGBA PNG (OpenAI compliant)`);
        } else {
            console.log('\n❌ OpenAI returned empty response');
        }

    } catch (error) {
        console.log(`\n❌ Pipeline failed: ${error.status || 'Unknown'} ${error.error?.message || error.message}`);
        if (error.error) {
            console.log('💡 Error details:', error.error);
        }
    }
}

testOptimizedOpenAI().catch(console.error);