#!/usr/bin/env node

/**
 * 🎭 WAVELENGTH NPC Icon Extractor
 * 
 * Automatically extracts character assets from images to create transparent PNG icons
 * for the Wavelength Lore universe. This tool bridges AI segmentation with asset creation.
 * 
 * GitHub Issue: https://github.com/mimelator/Wavelength-Lore/issues/103
 * 
 * Features:
 * - AI-powered object segmentation (ready for SAM/CV API integration)
 * - Transparent PNG generation with auto-cropping
 * - Batch processing for multiple characters
 * - Asset naming conventions for Wavelength Lore
 * - Integration with existing character/lore systems
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const OpenAI = require('openai');

console.log('🎭 WAVELENGTH NPC ICON EXTRACTOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

class WavelengthIconExtractor {
  constructor() {
    this.inputDir = path.join(__dirname, '../assets/source-images');
    this.outputDir = path.join(__dirname, '../assets/extracted-icons');
    this.maskDir = path.join(__dirname, '../assets/segmentation-masks');
    
    // Initialize OpenAI client
    this.openai = null;
    this.initializeOpenAI();
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Initialize OpenAI client if API key is available
   */
  initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('🤖 OpenAI Vision API initialized for automatic object detection');
    } else {
      console.log('⚠️  No OPENAI_API_KEY found - falling back to simulation mode');
      console.log('💡 Set OPENAI_API_KEY environment variable to enable AI detection');
    }
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [this.inputDir, this.outputDir, this.maskDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  /**
   * PHASE 1: AI Segmentation using OpenAI Vision API
   * 
   * Uses OpenAI Vision to detect object boundaries and create segmentation masks.
   * 
   * @param {string} imagePath - Path to source image
   * @param {string} assetPrompt - Description of what to extract (e.g., "goblin head")
   * @param {string} characterId - Character identifier for naming
   * @returns {Promise<Buffer|null>} - Binary mask as image buffer
   */
  async getSegmentationMask(imagePath, assetPrompt, characterId) {
    console.log(`🤖 AI SEGMENTATION REQUEST:`);
    console.log(`   Image: ${path.basename(imagePath)}`);
    console.log(`   Prompt: "${assetPrompt}"`);
    console.log(`   Character: ${characterId}`);

    // --- OPENAI VISION API MODE ---
    if (this.openai) {
      try {
        console.log(`🔍 Using OpenAI Vision API for object detection...`);
        return await this.getOpenAISegmentationMask(imagePath, assetPrompt, characterId);
      } catch (error) {
        console.error('❌ OpenAI Vision API failed, falling back to simulation:', error.message);
        // Fall through to simulation mode
      }
    }

    // --- SIMULATION MODE FALLBACK ---
    console.log(`🔄 SIMULATION: Looking for existing mask...`);
    
    const maskFileName = `${characterId}_mask.png`;
    const maskPath = path.join(this.maskDir, maskFileName);
    
    if (fs.existsSync(maskPath)) {
      console.log(`✅ Found simulation mask: ${maskFileName}`);
      return fs.readFileSync(maskPath);
    } else {
      console.log(`⚠️  No simulation mask found at: ${maskPath}`);
      console.log(`💡 To test: Create a black/white mask image where white = keep, black = remove`);
      return null;
    }
  }

  /**
   * Use OpenAI Vision API to detect objects and create segmentation masks
   * 
   * @param {string} imagePath - Path to source image
   * @param {string} assetPrompt - Description of what to extract
   * @param {string} characterId - Character identifier for naming
   * @returns {Promise<Buffer|null>} - Binary mask as image buffer
   */
  async getOpenAISegmentationMask(imagePath, assetPrompt, characterId) {
    try {
      // Read and encode image
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

      // Get image dimensions for mask creation
      const { width, height } = await sharp(imageBuffer).metadata();
      console.log(`   Image dimensions: ${width}x${height}`);

      // Construct vision prompt for object detection
      const visionPrompt = `Analyze this image and find the ${assetPrompt}. 

Please provide:
1. A detailed description of the ${assetPrompt} you found
2. The approximate bounding box coordinates as percentages of the image (0-100%)
3. Whether the object is clearly visible and extractable

Return your response as JSON in this exact format:
{
  "found": true/false,
  "description": "detailed description of what you found",
  "confidence": "high/medium/low",
  "boundingBox": {
    "x": percentage_from_left,
    "y": percentage_from_top, 
    "width": percentage_width,
    "height": percentage_height
  },
  "notes": "any additional notes about extraction quality"
}`;

      console.log(`🔮 Sending vision request to OpenAI...`);

      // Call OpenAI Vision API
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            { 
              type: "image_url", 
              image_url: { 
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }],
        max_tokens: 500,
        temperature: 0.1
      });

      const aiResponse = response.choices[0].message.content;
      console.log(`🤖 OpenAI Vision Response:`);
      console.log(aiResponse);

      // Parse JSON response
      let detection;
      try {
        // Extract JSON from response (handle cases where AI adds extra text)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        detection = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('❌ Failed to parse OpenAI response as JSON:', parseError.message);
        console.log('Raw response:', aiResponse);
        return null;
      }

      // Validate detection
      if (!detection.found || !detection.boundingBox) {
        console.log(`❌ OpenAI could not detect "${assetPrompt}" in the image`);
        console.log(`   Confidence: ${detection.confidence || 'unknown'}`);
        console.log(`   Notes: ${detection.notes || 'none'}`);
        return null;
      }

      console.log(`✅ Object detected with ${detection.confidence} confidence`);
      console.log(`   Description: ${detection.description}`);
      console.log(`   Bounding box: ${JSON.stringify(detection.boundingBox)}`);

      // Create mask from bounding box
      const maskBuffer = await this.createMaskFromBoundingBox(
        width, 
        height, 
        detection.boundingBox
      );

      // Save mask for future reference/debugging
      const maskPath = path.join(this.maskDir, `${characterId}_openai_mask.png`);
      fs.writeFileSync(maskPath, maskBuffer);
      console.log(`💾 Saved OpenAI-generated mask: ${path.basename(maskPath)}`);

      return maskBuffer;

    } catch (error) {
      console.error('❌ OpenAI Vision API error:', error.message);
      if (error.response) {
        console.error('   API response:', error.response.data);
      }
      return null;
    }
  }

  /**
   * Create a binary mask from bounding box coordinates
   * 
   * @param {number} imageWidth - Image width in pixels
   * @param {number} imageHeight - Image height in pixels  
   * @param {Object} boundingBox - Bounding box as percentages
   * @returns {Promise<Buffer>} - Binary mask image buffer
   */
  async createMaskFromBoundingBox(imageWidth, imageHeight, boundingBox) {
    // Convert percentage coordinates to pixels
    const x = Math.round((boundingBox.x / 100) * imageWidth);
    const y = Math.round((boundingBox.y / 100) * imageHeight);
    const width = Math.round((boundingBox.width / 100) * imageWidth);
    const height = Math.round((boundingBox.height / 100) * imageHeight);

    console.log(`🎨 Creating mask: ${width}x${height} at (${x}, ${y})`);

    // Create a black canvas
    const maskCanvas = sharp({
      create: {
        width: imageWidth,
        height: imageHeight,
        channels: 1,
        background: { r: 0, g: 0, b: 0 } // Black background
      }
    });

    // Create white rectangle for the object area
    const whiteRect = sharp({
      create: {
        width: width,
        height: height,
        channels: 1,
        background: { r: 255, g: 255, b: 255 } // White foreground
      }
    }).png();

    // Composite white rectangle onto black canvas
    const maskBuffer = await maskCanvas
      .composite([{
        input: await whiteRect.toBuffer(),
        left: x,
        top: y
      }])
      .png()
      .toBuffer();

    return maskBuffer;
  }

  /**
   * PHASE 2: Transparent PNG Generation
   * 
   * Applies the segmentation mask to create a transparent PNG asset.
   * 
   * @param {string} originalImagePath - Path to source image
   * @param {Buffer} maskBuffer - Binary mask image
   * @param {string} outputPath - Where to save the transparent PNG
   * @returns {Promise<boolean>} - Success status
   */
  async generateTransparentPNG(originalImagePath, maskBuffer, outputPath) {
    try {
      console.log(`🎨 GENERATING TRANSPARENT PNG:`);
      console.log(`   Source: ${path.basename(originalImagePath)}`);
      console.log(`   Output: ${path.basename(outputPath)}`);

      // Load original image and mask
      const originalImage = await sharp(originalImagePath);
      const maskImage = await sharp(maskBuffer);

      // Get image metadata
      const { width, height } = await originalImage.metadata();
      console.log(`   Dimensions: ${width}x${height}`);

      // Ensure mask matches original dimensions
      const resizedMask = await maskImage
        .resize(width, height, { fit: 'fill' })
        .greyscale()
        .toBuffer();

      // Apply mask as alpha channel to create transparency
      const transparentImage = await originalImage
        .composite([{
          input: resizedMask,
          blend: 'dest-in'
        }])
        .png()
        .toBuffer();

      // Auto-crop to remove transparent borders
      const croppedImage = await sharp(transparentImage)
        .trim()
        .png()
        .toBuffer();

      // Save final asset
      fs.writeFileSync(outputPath, croppedImage);

      // Get final dimensions
      const finalMeta = await sharp(croppedImage).metadata();
      console.log(`✅ Asset created: ${finalMeta.width}x${finalMeta.height} PNG`);
      console.log(`   Saved to: ${outputPath}`);

      return true;
    } catch (error) {
      console.error('❌ PNG generation failed:', error.message);
      return false;
    }
  }

  /**
   * Extract a single character asset
   * 
   * @param {Object} config - Extraction configuration
   * @returns {Promise<boolean>} - Success status
   */
  async extractAsset(config) {
    const {
      sourceImage,
      characterId,
      assetPrompt,
      outputName
    } = config;

    console.log(`\n🎭 EXTRACTING ASSET: ${characterId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const sourcePath = path.join(this.inputDir, sourceImage);
    const outputPath = path.join(this.outputDir, outputName || `${characterId}_icon.png`);

    // Check if source image exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source image not found: ${sourcePath}`);
      return false;
    }

    // Phase 1: Get segmentation mask
    const maskBuffer = await this.getSegmentationMask(sourcePath, assetPrompt, characterId);
    if (!maskBuffer) {
      console.error(`❌ Failed to get segmentation mask for ${characterId}`);
      return false;
    }

    // Phase 2: Generate transparent PNG
    const success = await this.generateTransparentPNG(sourcePath, maskBuffer, outputPath);
    
    if (success) {
      console.log(`🎉 SUCCESS: ${characterId} asset extracted!`);
      return true;
    } else {
      console.error(`❌ FAILED: ${characterId} asset extraction failed`);
      return false;
    }
  }

  /**
   * Batch extract multiple assets
   * 
   * @param {Array} extractionConfigs - Array of extraction configurations
   * @returns {Promise<Object>} - Results summary
   */
  async batchExtract(extractionConfigs) {
    console.log(`\n🚀 BATCH EXTRACTION: ${extractionConfigs.length} assets`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const results = {
      total: extractionConfigs.length,
      successful: 0,
      failed: 0,
      assets: []
    };

    for (const config of extractionConfigs) {
      const success = await this.extractAsset(config);
      
      results.assets.push({
        characterId: config.characterId,
        success: success,
        outputPath: success ? path.join(this.outputDir, config.outputName || `${config.characterId}_icon.png`) : null
      });

      if (success) {
        results.successful++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Generate a sample extraction configuration for Wavelength characters
   */
  generateSampleConfig() {
    return [
      {
        sourceImage: 'goblin_king.png',
        characterId: 'goblin-king',
        assetPrompt: 'goblin head with crown',
        outputName: 'goblin_king_icon.png'
      },
      {
        sourceImage: 'wavelength_hero.png', 
        characterId: 'wavelength-hero',
        assetPrompt: 'main character face',
        outputName: 'wavelength_hero_icon.png'
      },
      {
        sourceImage: 'shire_guardian.png',
        characterId: 'shire-guardian', 
        assetPrompt: 'guardian character portrait',
        outputName: 'shire_guardian_icon.png'
      }
    ];
  }

  /**
   * Show usage instructions
   */
  showUsage() {
    const hasOpenAI = !!this.openai;
    console.log(`
🎭 WAVELENGTH NPC ICON EXTRACTOR - Usage Guide
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 DIRECTORY STRUCTURE:
   ${this.inputDir}/     ← Place source images here
   ${this.outputDir}/    ← Extracted icons saved here  
   ${this.maskDir}/      ← AI-generated masks saved here

${hasOpenAI ? '🤖 OPENAI VISION MODE (ACTIVE):' : '⚠️  OPENAI VISION MODE (INACTIVE):'}
   ${hasOpenAI ? '✅ OpenAI API key detected - automatic object detection enabled!' : '❌ No OPENAI_API_KEY found'}
   1. Set environment variable: export OPENAI_API_KEY=your_key_here
   2. Add source images to: ${this.inputDir}/
   3. Run extraction: npm run wavelength:extract-icons
   4. AI will automatically detect and extract objects!

🔧 SIMULATION MODE (Fallback):
   1. Add source images to: ${this.inputDir}/
   2. Create binary masks: ${this.maskDir}/[character-id]_mask.png
   3. Run extraction: npm run wavelength:extract-icons

� USAGE EXAMPLES:
   Extract icons: npm run wavelength:extract-icons
   Show this help: npm run wavelength:extract-icons-help
   Sample config: npm run wavelength:extract-icons-sample

🎯 ASSET PROMPTS (what to tell the AI):
   "goblin head with crown"
   "main character face"  
   "dragon head profile"
   "wizard with staff"
   "hero portrait"
`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const extractor = new WavelengthIconExtractor();

  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    extractor.showUsage();
    return;
  }

  if (args.includes('--sample-config')) {
    const sampleConfig = extractor.generateSampleConfig();
    console.log('\n📋 SAMPLE EXTRACTION CONFIG:');
    console.log(JSON.stringify(sampleConfig, null, 2));
    return;
  }

  // Check if we have any source images
  const sourceImages = fs.readdirSync(extractor.inputDir).filter(file => 
    file.match(/\.(png|jpg|jpeg)$/i)
  );

  if (sourceImages.length === 0) {
    console.log('\n📁 NO SOURCE IMAGES FOUND');
    console.log(`   Add images to: ${extractor.inputDir}`);
    extractor.showUsage();
    return;
  }

  console.log(`\n📊 FOUND ${sourceImages.length} SOURCE IMAGES:`);
  sourceImages.forEach(img => console.log(`   📸 ${img}`));

  // Run sample extraction if we have test files
  const sampleConfig = extractor.generateSampleConfig().filter(config => 
    fs.existsSync(path.join(extractor.inputDir, config.sourceImage))
  );

  if (sampleConfig.length > 0) {
    console.log(`\n🧪 RUNNING SAMPLE EXTRACTION: ${sampleConfig.length} characters`);
    const results = await extractor.batchExtract(sampleConfig);
    
    console.log(`\n📊 EXTRACTION RESULTS:`);
    console.log(`   ✅ Successful: ${results.successful}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📁 Assets saved to: ${extractor.outputDir}`);
    
    if (results.successful > 0) {
      console.log('\n🎉 SUCCESS! Character icons extracted and ready for use!');
    }
  } else {
    console.log('\n💡 CREATE TEST FILES:');
    console.log('   1. Add goblin_king.png to source images');
    console.log('   2. Add goblin-king_mask.png to masks (black/white mask)');
    console.log('   3. Run this tool again');
  }
}

// Run the tool
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WavelengthIconExtractor;