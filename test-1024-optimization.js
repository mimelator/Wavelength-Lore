const sharp = require('sharp');
const fs = require('fs');

/**
 * WAVELENGTH: Quick test of 1024x1024 optimization
 * This should produce much smaller files and faster processing
 */
async function test1024Optimization() {
    console.log('🌊 WAVELENGTH: Testing 1024x1024 optimization...\n');

    const testImagePath = 'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp';
    
    if (!fs.existsSync(testImagePath)) {
        console.log(`❌ Test image not found: ${testImagePath}`);
        return;
    }

    try {
        const originalBuffer = fs.readFileSync(testImagePath);
        const metadata = await sharp(originalBuffer).metadata();
        
        console.log(`📸 Original: ${metadata.width}x${metadata.height} ${metadata.format.toUpperCase()}, ${(originalBuffer.length / 1024).toFixed(1)}KB\n`);

        // Test 1800x1800 (old approach)
        console.log('🔄 Testing 1800x1800 (old approach)...');
        const large1800Buffer = await sharp(originalBuffer)
            .resize(1800, 1800, { fit: 'cover' })
            .ensureAlpha()
            .toColorspace('srgb')
            .png({ 
                quality: 75,
                compressionLevel: 9,
                palette: false,
                colors: 128
            })
            .toBuffer();
        
        const size1800MB = large1800Buffer.length / (1024 * 1024);
        console.log(`📊 1800x1800 result: ${size1800MB.toFixed(2)}MB`);

        // Test 1024x1024 (new optimized approach)
        console.log('\n⚡ Testing 1024x1024 (optimized approach)...');
        const optimized1024Buffer = await sharp(originalBuffer)
            .resize(1024, 1024, { fit: 'cover' })
            .ensureAlpha()
            .toColorspace('srgb')
            .png({ 
                quality: 75,
                compressionLevel: 9,
                palette: false,
                colors: 128
            })
            .toBuffer();
        
        const size1024MB = optimized1024Buffer.length / (1024 * 1024);
        console.log(`📊 1024x1024 result: ${size1024MB.toFixed(2)}MB`);

        // Calculate improvements
        const sizeReduction = ((size1800MB - size1024MB) / size1800MB * 100);
        const speedImprovement = (1800 * 1800) / (1024 * 1024);

        console.log('\n🎯 OPTIMIZATION RESULTS:');
        console.log(`📉 File size reduction: ${sizeReduction.toFixed(1)}% smaller`);
        console.log(`⚡ Processing efficiency: ${speedImprovement.toFixed(1)}x fewer pixels`);
        console.log(`🎚️  1800x1800: ${size1800MB.toFixed(2)}MB`);
        console.log(`✅ 1024x1024: ${size1024MB.toFixed(2)}MB`);
        
        if (size1024MB < 4) {
            console.log(`\n🎉 SUCCESS: 1024x1024 is ${size1024MB.toFixed(2)}MB (well under 4MB limit!)`);
            console.log(`⚡ This should be much faster and more reliable for OpenAI`);
        } else {
            console.log(`\n⚠️  Still ${size1024MB.toFixed(2)}MB - but much better than ${size1800MB.toFixed(2)}MB`);
        }

        // Test format
        const processedMetadata = await sharp(optimized1024Buffer).metadata();
        console.log(`\n🔍 Format verification:`);
        console.log(`📊 Format: ${processedMetadata.format}, Channels: ${processedMetadata.channels}, Has Alpha: ${processedMetadata.hasAlpha}`);

    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
    }
}

test1024Optimization().catch(console.error);