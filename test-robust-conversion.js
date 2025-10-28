const sharp = require('sharp');
const fs = require('fs');

/**
 * WAVELENGTH: Robust WebP to OpenAI-compliant PNG converter
 * Based on the iterative resizing approach - checks actual output size and reduces dimensions as needed
 * 
 * Key improvements over our fixed compression approach:
 * 1. Iterative size checking with buffer validation
 * 2. Progressive dimension reduction (10% per attempt)
 * 3. Maintains RGBA format for OpenAI compatibility
 * 4. Maximum 10 attempts with detailed logging
 */
async function convertToOpenAICompliantPNG(inputBuffer, maxSizeBytes = 4 * 1024 * 1024) {
    const RESIZE_FACTOR = 0.9; // Reduce dimensions by 10% in each iteration
    const MAX_ATTEMPTS = 10;
    const TARGET_SIZE = 1800; // Start with Printify minimum (can be adjusted)
    
    try {
        let attempts = 0;
        let currentWidth = TARGET_SIZE;
        let currentHeight = TARGET_SIZE;
        let currentSize = 0;
        let finalBuffer = null;

        console.log(`🎯 Starting conversion with target ${TARGET_SIZE}x${TARGET_SIZE}, max size ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB`);

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            
            // 1. Convert with current dimensions, ensuring RGBA format for OpenAI
            const pngBuffer = await sharp(inputBuffer)
                .resize(currentWidth, currentHeight, { fit: 'cover' }) // Square for Printify
                .ensureAlpha() // CRITICAL: Ensure image has alpha channel (RGBA) for OpenAI
                .toColorspace('srgb') // Ensure correct colorspace
                .png({
                    compressionLevel: 9, // Max compression (0-9)
                    adaptiveFiltering: true, // Can further optimize size
                    palette: false, // Force RGBA instead of palette-based PNG
                    quality: 75 // Good balance of quality vs size
                })
                .toBuffer();

            currentSize = pngBuffer.length;
            const currentSizeMB = currentSize / (1024 * 1024);

            console.log(`📊 Attempt ${attempts}: ${currentWidth}x${currentHeight} → ${currentSizeMB.toFixed(2)}MB`);

            // 2. Check for compliance
            if (currentSize <= maxSizeBytes) {
                // SUCCESS: Compliant size achieved
                finalBuffer = pngBuffer;
                console.log(`✅ Conversion successful! Final PNG size: ${currentSizeMB.toFixed(2)}MB (within ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB limit) in ${attempts} attempts`);
                return { 
                    success: true, 
                    buffer: finalBuffer,
                    finalSize: currentSize,
                    attempts: attempts,
                    dimensions: { width: currentWidth, height: currentHeight },
                    message: `Conversion successful. Final PNG size: ${currentSizeMB.toFixed(2)}MB in ${attempts} attempts.` 
                };
            }
            
            // 3. If too large, resize for the next iteration
            const newWidth = Math.floor(currentWidth * RESIZE_FACTOR);
            const newHeight = Math.floor(currentHeight * RESIZE_FACTOR);
            
            if (newWidth < 100 || newHeight < 100) {
                return { 
                    success: false, 
                    buffer: null,
                    finalSize: currentSize,
                    attempts: attempts,
                    message: `Image dimensions became too small (${newWidth}x${newHeight}) after ${attempts} attempts. Could not reach compliance.` 
                };
            }

            console.log(`⚠️  Size too large (${currentSizeMB.toFixed(2)}MB). Reducing to ${newWidth}x${newHeight}...`);
            
            currentWidth = newWidth;
            currentHeight = newHeight;
        }

        // If the loop finishes without success
        return { 
            success: false, 
            buffer: null,
            finalSize: currentSize,
            attempts: attempts,
            message: `Could not reduce image size below ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB after ${MAX_ATTEMPTS} attempts. Last size: ${(currentSize / (1024 * 1024)).toFixed(2)}MB.` 
        };

    } catch (error) {
        return { 
            success: false, 
            buffer: null,
            finalSize: 0,
            attempts: 0,
            message: `Conversion error: ${error.message}` 
        };
    }
}

// Test with real Wavelength images
async function testRobustConversion() {
    const testImages = [
        'static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-22.webp',
        'static/images/seasons/season3/episodes/episode8/images/GrandFinale-12.webp',
        'static/images/seasons/season3/episodes/episode6/images/DarknessTurns-15.webp'
    ];

    console.log('🌊 WAVELENGTH: Testing robust OpenAI conversion pipeline...\n');

    for (const imagePath of testImages) {
        if (!fs.existsSync(imagePath)) {
            console.log(`❌ Skipping ${imagePath} - file not found`);
            continue;
        }

        try {
            console.log(`\n📸 Testing: ${imagePath.split('/').pop()}`);
            const originalBuffer = fs.readFileSync(imagePath);
            const originalMetadata = await sharp(originalBuffer).metadata();
            
            console.log(`📏 Original: ${originalMetadata.width}x${originalMetadata.height} ${originalMetadata.format.toUpperCase()}, ${(originalBuffer.length / 1024).toFixed(1)}KB`);

            // Test conversion
            const result = await convertToOpenAICompliantPNG(originalBuffer);
            
            if (result.success) {
                console.log(`🎉 SUCCESS: ${result.message}`);
                console.log(`📐 Final dimensions: ${result.dimensions.width}x${result.dimensions.height}`);
                
                // Save test output for verification
                const outputPath = `test-output-${imagePath.split('/').pop().replace('.webp', '.png')}`;
                fs.writeFileSync(outputPath, result.buffer);
                console.log(`💾 Saved test output: ${outputPath}`);
            } else {
                console.log(`❌ FAILED: ${result.message}`);
            }
            
        } catch (error) {
            console.log(`❌ Error processing ${imagePath}: ${error.message}`);
        }
        
        console.log('━'.repeat(60));
    }
}

// Run the test
testRobustConversion().catch(console.error);