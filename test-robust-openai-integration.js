require('dotenv').config();
const { OpenAI } = require('openai');
const sharp = require('sharp');
const fs = require('fs');

/**
 * WAVELENGTH: Test the robust conversion + OpenAI integration
 * This combines the iterative sizing approach with real OpenAI API calls
 */

// Import our robust conversion function
async function convertToOpenAICompliantPNG(inputBuffer, maxSizeBytes = 4 * 1024 * 1024) {
    const RESIZE_FACTOR = 0.9;
    const MAX_ATTEMPTS = 10;
    const TARGET_SIZE = 1800;
    
    try {
        let attempts = 0;
        let currentWidth = TARGET_SIZE;
        let currentHeight = TARGET_SIZE;
        let currentSize = 0;
        let finalBuffer = null;

        console.log(`🎯 Starting conversion with target ${TARGET_SIZE}x${TARGET_SIZE}, max size ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB`);

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            
            const pngBuffer = await sharp(inputBuffer)
                .resize(currentWidth, currentHeight, { fit: 'cover' })
                .ensureAlpha() // CRITICAL: Ensure RGBA for OpenAI
                .toColorspace('srgb')
                .png({
                    compressionLevel: 9,
                    adaptiveFiltering: true,
                    palette: false, // Force RGBA
                    quality: 75
                })
                .toBuffer();

            currentSize = pngBuffer.length;
            const currentSizeMB = currentSize / (1024 * 1024);

            console.log(`📊 Attempt ${attempts}: ${currentWidth}x${currentHeight} → ${currentSizeMB.toFixed(2)}MB`);

            if (currentSize <= maxSizeBytes) {
                finalBuffer = pngBuffer;
                console.log(`✅ Conversion successful! Final size: ${currentSizeMB.toFixed(2)}MB in ${attempts} attempts`);
                return { 
                    success: true, 
                    buffer: finalBuffer,
                    finalSize: currentSize,
                    attempts: attempts,
                    dimensions: { width: currentWidth, height: currentHeight }
                };
            }
            
            const newWidth = Math.floor(currentWidth * RESIZE_FACTOR);
            const newHeight = Math.floor(currentHeight * RESIZE_FACTOR);
            
            if (newWidth < 100 || newHeight < 100) {
                return { success: false, message: `Dimensions too small: ${newWidth}x${newHeight}` };
            }

            console.log(`⚠️  Resizing to ${newWidth}x${newHeight}...`);
            currentWidth = newWidth;
            currentHeight = newHeight;
        }

        return { success: false, message: `Could not achieve size compliance after ${MAX_ATTEMPTS} attempts` };

    } catch (error) {
        return { success: false, message: `Conversion error: ${error.message}` };
    }
}

async function testRobustOpenAIIntegration() {
    console.log('🌊 WAVELENGTH: Testing robust conversion + OpenAI integration...\n');

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

    // Test with one image
    const testImagePath = 'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp';
    
    if (!fs.existsSync(testImagePath)) {
        console.log(`❌ Test image not found: ${testImagePath}`);
        return;
    }

    try {
        const originalBuffer = fs.readFileSync(testImagePath);
        const metadata = await sharp(originalBuffer).metadata();
        
        console.log(`📸 Original: ${metadata.width}x${metadata.height} ${metadata.format.toUpperCase()}, ${(originalBuffer.length / 1024).toFixed(1)}KB\n`);

        // Step 1: Robust conversion
        console.log('🗜️ Step 1: Robust conversion...');
        const conversionResult = await convertToOpenAICompliantPNG(originalBuffer);
        
        if (!conversionResult.success) {
            console.log(`❌ Conversion failed: ${conversionResult.message}`);
            return;
        }

        // Step 2: Verify format
        console.log('\n🔍 Step 2: Verifying format...');
        const processedMetadata = await sharp(conversionResult.buffer).metadata();
        console.log(`📊 Processed: ${processedMetadata.width}x${processedMetadata.height} ${processedMetadata.format.toUpperCase()}`);
        console.log(`📊 Channels: ${processedMetadata.channels}, Has Alpha: ${processedMetadata.hasAlpha}`);
        console.log(`📊 Size: ${(conversionResult.finalSize / (1024 * 1024)).toFixed(2)}MB`);

        // Step 3: OpenAI API call
        console.log('\n🚀 Step 3: Testing OpenAI API...');
        const prompt = 'Enhance this illustration with crisp details, vibrant colors, and sharp lines suitable for high-quality printing';
        
        console.log(`📝 Prompt: ${prompt}`);
        console.log(`📊 Buffer size: ${(conversionResult.finalSize / (1024 * 1024)).toFixed(2)}MB`);

        const response = await openai.images.edit({
            image: conversionResult.buffer,
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        });

        if (response && response.data && response.data.length > 0) {
            console.log('\n🎉 SUCCESS! OpenAI API accepted the image!');
            console.log(`✅ Response URL: ${response.data[0].url}`);
            console.log(`🎯 Conversion approach: Iterative sizing with buffer validation`);
            console.log(`📐 Final dimensions: ${conversionResult.dimensions.width}x${conversionResult.dimensions.height}`);
            console.log(`🗜️ Final size: ${(conversionResult.finalSize / (1024 * 1024)).toFixed(2)}MB`);
            console.log(`🔄 Attempts needed: ${conversionResult.attempts}`);
        } else {
            console.log('❌ OpenAI returned empty response');
        }

    } catch (error) {
        console.log(`❌ Pipeline failed: ${error.status || 'Unknown'} ${error.error?.message || error.message}`);
        console.log('💡 Error details:', error.error || error);
    }
}

testRobustOpenAIIntegration().catch(console.error);