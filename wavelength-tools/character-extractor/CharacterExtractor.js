#!/usr/bin/env node

/**
 * 🎭 WAVELENGTH CHARACTER EXTRACTOR
 *
 * Extracts transparent character PNGs from gallery images
 * Phase 1: Reliable character segmentation and extraction
 *
 * Features:
 * - OpenAI Vision-powered character detection
 * - Automatic bounding box calculation
 * - Smart mask generation
 * - Transparent PNG output with auto-crop
 * - Reusable for batch processing
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { spawn } = require('child_process');
const OpenAI = require('openai');

class CharacterExtractor {
  constructor(options = {}) {
    // API Configuration
    this.openai = null;
    this.initializeOpenAI();

    // Directory Configuration
    this.baseDir = options.baseDir || path.join(__dirname, '..');
    this.outputDir = options.outputDir || path.join(this.baseDir, 'assets/extracted-characters');
    this.maskDir = options.maskDir || path.join(this.baseDir, 'assets/extraction-masks');

    // Ensure directories exist
    this.ensureDirectories();

    // Settings
    this.targetSize = options.targetSize || '1024x1024';
    this.verbose = options.verbose !== false;
  }

  /**
   * Initialize OpenAI client with API key from environment
   */
  initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      if (this.verbose) {
        console.log('✅ OpenAI Vision API initialized');
      }
    } else {
      console.error('❌ ERROR: OPENAI_API_KEY environment variable not set');
      console.error('   Set your OpenAI API key:');
      console.error('   export OPENAI_API_KEY=your_key_here');
      process.exit(1);
    }
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [this.outputDir, this.maskDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        if (this.verbose) {
          console.log(`📁 Created directory: ${dir}`);
        }
      }
    });
  }

  /**
   * Log output with formatting
   */
  log(message, type = 'info') {
    if (!this.verbose) return;

    const prefixes = {
      info: '   ',
      success: '✅ ',
      error: '❌ ',
      warning: '⚠️  ',
      vision: '🔮 ',
      processing: '⚙️  '
    };

    const prefix = prefixes[type] || '   ';
    console.log(prefix + message);
  }

  /**
   * Validate input image file
   */
  validateImage(imagePath) {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const ext = path.extname(imagePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}. Use PNG or JPG.`);
    }

    const stats = fs.statSync(imagePath);
    const sizeMB = stats.size / 1024 / 1024;

    if (sizeMB > 20) {
      throw new Error(`Image too large: ${sizeMB.toFixed(2)}MB. Max 20MB.`);
    }

    return true;
  }

  /**
   * Resize image to square format for OpenAI Vision
   */
  async resizeImageForVision(imagePath, targetSize = 1024) {
    try {
      this.log(`Resizing image to ${targetSize}x${targetSize}...`, 'processing');

      const resized = await sharp(imagePath)
        .resize(targetSize, targetSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();

      return resized;
    } catch (error) {
      throw new Error(`Image resize failed: ${error.message}`);
    }
  }

  /**
   * Use OpenAI Vision API to detect character and get bounding box
   */
  async detectCharacter(imagePath, description) {
    try {
      // Read and encode image
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

      // Get image dimensions
      const { width, height } = await sharp(imageBuffer).metadata();
      this.log(`Image dimensions: ${width}x${height}`, 'info');

      // Construct vision prompt
      const visionPrompt = `Analyze this image and locate the: ${description}

IMPORTANT: I need VERY TIGHT bounding box coordinates that closely fit ONLY the character, excluding as much background as possible.

Instructions:
- Make the bounding box as tight as possible around the actual character edges
- Avoid including unnecessary background space
- If there are multiple subjects, find the most prominent one matching the description

Please respond with ONLY valid JSON (no extra text) in this exact format:
{
  "found": true or false,
  "description": "detailed description of what you found",
  "confidence": "high/medium/low",
  "boundingBox": {
    "x": percentage_from_left (0-100),
    "y": percentage_from_top (0-100),
    "width": percentage_width (0-100),
    "height": percentage_height (0-100)
  },
  "notes": "any observations about extraction quality"
}`;

      this.log(`Sending vision request to OpenAI...`, 'vision');

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
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
        this.log(`Failed to parse OpenAI response: ${parseError.message}`, 'error');
        this.log(`Raw response:\n${aiResponse}`, 'error');
        throw new Error('Failed to parse character detection response');
      }

      // Validate detection
      if (!detection.found) {
        throw new Error(`Character not detected: ${description}`);
      }

      if (!detection.boundingBox) {
        throw new Error('No bounding box in response');
      }

      this.log(`Character detected with ${detection.confidence} confidence`, 'success');
      this.log(`Description: ${detection.description}`, 'info');
      this.log(`Bounding box: x=${detection.boundingBox.x}%, y=${detection.boundingBox.y}%, w=${detection.boundingBox.width}%, h=${detection.boundingBox.height}%`, 'info');

      return {
        detection,
        dimensions: { width, height }
      };
    } catch (error) {
      throw new Error(`Character detection failed: ${error.message}`);
    }
  }

  /**
   * Check if rembg is installed
   */
  async checkRembgInstalled() {
    return new Promise((resolve) => {
      const python = spawn('python3', ['-c', 'import rembg; print("ok")']);
      let output = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.on('close', (code) => {
        resolve(code === 0 && output.includes('ok'));
      });
    });
  }

  /**
   * Crop image to bounding box region with padding
   */
  async cropImageToBoundingBox(imagePath, boundingBox, paddingPercent = 10) {
    try {
      const image = await sharp(imagePath);
      const { width, height } = await image.metadata();

      // Convert percentage coordinates to pixels
      let x = Math.round((boundingBox.x / 100) * width);
      let y = Math.round((boundingBox.y / 100) * height);
      let cropWidth = Math.round((boundingBox.width / 100) * width);
      let cropHeight = Math.round((boundingBox.height / 100) * height);

      // Add padding
      const paddingX = Math.round((cropWidth * paddingPercent) / 100);
      const paddingY = Math.round((cropHeight * paddingPercent) / 100);

      x = Math.max(0, x - paddingX);
      y = Math.max(0, y - paddingY);
      cropWidth = Math.min(width - x, cropWidth + 2 * paddingX);
      cropHeight = Math.min(height - y, cropHeight + 2 * paddingY);

      this.log(`Cropping to bounding box: ${cropWidth}x${cropHeight} at (${x}, ${y})`, 'processing');
      this.log(`Added ${paddingPercent}% padding around character`, 'info');

      const croppedImage = await image
        .extract({ left: x, top: y, width: cropWidth, height: cropHeight })
        .png()
        .toBuffer();

      return croppedImage;
    } catch (error) {
      throw new Error(`Image cropping failed: ${error.message}`);
    }
  }

  /**
   * Remove background using rembg Python library
   */
  async removeBackgroundWithRembg(imagePath, outputPath) {
    return new Promise((resolve, reject) => {
      this.log(`Removing background with rembg...`, 'processing');

      // Python script to remove background
      const pythonScript = `
import sys
from rembg import remove
from PIL import Image

input_path = sys.argv[1]
output_path = sys.argv[2]

try:
    input_img = Image.open(input_path)
    output_img = remove(input_img)
    output_img.save(output_path, 'PNG')
    print("success")
except Exception as e:
    print(f"error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;

      const python = spawn('python3', ['-c', pythonScript, imagePath, outputPath]);
      let errorOutput = '';
      let successOutput = '';

      python.stdout.on('data', (data) => {
        successOutput += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && successOutput.includes('success')) {
          this.log(`Background removed successfully`, 'success');
          resolve(true);
        } else {
          reject(new Error(`rembg failed: ${errorOutput || 'unknown error'}`));
        }
      });
    });
  }

  /**
   * Generate transparent PNG by removing background
   */
  async generateTransparentPNG(originalImagePath, outputPath) {
    try {
      this.log(`Generating transparent PNG...`, 'processing');

      // Use rembg to remove background
      await this.removeBackgroundWithRembg(originalImagePath, outputPath);

      // Auto-crop to remove transparent borders
      this.log(`Auto-cropping transparent borders...`, 'processing');
      const croppedImage = await sharp(outputPath)
        .trim()
        .png()
        .toBuffer();

      fs.writeFileSync(outputPath, croppedImage);

      // Get final dimensions
      const finalMeta = await sharp(croppedImage).metadata();
      this.log(`Asset created: ${finalMeta.width}x${finalMeta.height} PNG`, 'success');
      this.log(`Saved to: ${outputPath}`, 'success');

      return true;
    } catch (error) {
      throw new Error(`PNG generation failed: ${error.message}`);
    }
  }

  /**
   * Extract character from image
   */
  async extractCharacter(config) {
    const {
      imagePath,
      description,
      outputFilename,
      characterId = 'extracted-character',
      crop = false
    } = config;

    console.log('\n🎭 WAVELENGTH CHARACTER EXTRACTOR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📸 Image: ${path.basename(imagePath)}`);
    console.log(`📝 Description: ${description}`);
    console.log(`🎯 Character ID: ${characterId}`);
    if (crop) {
      console.log(`✂️  Crop mode: ENABLED`);
    }
    console.log('');

    try {
      // Step 0: Check rembg availability
      console.log('[0/4] Checking dependencies...');
      const rembgAvailable = await this.checkRembgInstalled();
      if (!rembgAvailable) {
        throw new Error('rembg Python library not installed. Install with: pip install rembg');
      }
      this.log(`rembg is available`, 'success');

      // Step 1: Validate input image
      this.log(`Validating image...`, 'info');
      this.validateImage(imagePath);
      this.log(`Image validation passed`, 'success');

      // Step 2: Detect character using OpenAI Vision (for metadata/validation)
      console.log('\n[1/4] Detecting character with OpenAI Vision...');
      const { detection } = await this.detectCharacter(imagePath, description);
      this.log(`Character info: ${detection.description}`, 'success');

      // Step 3: Optional cropping for background characters
      let processImagePath = imagePath;
      let tempCropPath = null;

      if (crop) {
        console.log('\n[2/4] Cropping to character region...');
        const croppedBuffer = await this.cropImageToBoundingBox(imagePath, detection.boundingBox);

        // Save cropped image to temp file
        tempCropPath = path.join(this.outputDir, `.temp_crop_${Date.now()}.png`);
        fs.writeFileSync(tempCropPath, croppedBuffer);
        processImagePath = tempCropPath;
        this.log(`Cropped image saved temporarily`, 'success');

        console.log('\n[3/4] Removing background with rembg...');
      } else {
        console.log('\n[2/4] Removing background with rembg...');
      }

      // Step 4: Generate transparent PNG using rembg
      const outputPath = path.join(this.outputDir, outputFilename);
      await this.generateTransparentPNG(processImagePath, outputPath);

      // Clean up temp crop file if it was created
      if (tempCropPath && fs.existsSync(tempCropPath)) {
        fs.unlinkSync(tempCropPath);
        this.log(`Cleaned up temporary files`, 'success');
      }

      // Step 5: Summary
      const summaryStep = crop ? '[4/4]' : '[3/3]';
      console.log(`\n${summaryStep} Extraction complete!`);
      console.log('\n✅ SUCCESS!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📦 Output: ${outputPath}`);
      console.log(`🎭 Character: ${characterId}`);
      console.log(`📝 Description: ${detection.description}`);
      console.log(`📊 Confidence: ${detection.confidence}`);
      if (crop) {
        console.log(`✂️  Crop mode: Applied`);
      }

      return {
        success: true,
        outputPath,
        characterId,
        detection,
        cropApplied: crop
      };
    } catch (error) {
      console.error('\n❌ EXTRACTION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`Error: ${error.message}`);

      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CharacterExtractor;
