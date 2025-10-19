#!/usr/bin/env node

/**
 * AI Image Generator for Wavelength Lore - Google GenAI Version
 * Based on nano-ex.ts example from Google
 */

const { initScriptEnv } = require('./utils/env-loader');

// Check if we're just showing help
const args = process.argv.slice(2);
const showingHelp = args.includes('--help') || args.includes('-h') || args.length === 0;

// Only require environment variables if not showing help
if (!showingHelp) {
  // Initialize environment with AI-specific variables
  initScriptEnv(['GEMINI_API_KEY']);
}

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Google GenAI SDK for proper image generation
const { GoogleGenAI } = require('@google/genai');
const mime = require('mime');

class GoogleAIImageGenerator {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    this.modelKey = process.env.AI_MODEL_KEY || 'gemini-2.5-flash-image';
    this.tempDir = path.join(__dirname, '../temp/ai-generated');
    this.outputDir = path.join(__dirname, '../static/images/ai-generated');
    
    // Initialize Google GenAI client
    if (this.apiKey) {
      this.googleAI = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Generate image from text prompt using Google GenAI SDK
   */
  async generateImage(prompt, options = {}) {
    const {
      width = 1024,
      height = 1024,
      style = 'photorealistic'
    } = options;

    console.log('🎨 Generating AI image with Google GenAI...');
    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`📐 Size: ${width}x${height}`);
    console.log(`🎨 Style: ${style}`);

    if (!this.googleAI) {
      throw new Error('Google GenAI not initialized. Check GEMINI_API_KEY in .env file.');
    }

    try {
      // Configuration based on nano-ex.ts example
      const config = {
        responseModalities: ['IMAGE', 'TEXT'],
      };

      // Enhanced prompt with style if specified
      const enhancedPrompt = style && style !== 'photorealistic' 
        ? `${prompt}, ${style} style`
        : prompt;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: enhancedPrompt,
            },
          ],
        },
      ];

      console.log('🔮 Generating with Google GenAI SDK...');

      const response = await this.googleAI.models.generateContentStream({
        model: this.modelKey,
        config,
        contents,
      });

      let imageData = null;
      let textResponse = '';
      let mimeType = 'image/png';

      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue;
        }

        // Check for image data (like in nano-ex.ts)
        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
          const inlineData = chunk.candidates[0].content.parts[0].inlineData;
          imageData = inlineData.data;
          mimeType = inlineData.mimeType || 'image/png';
          console.log(`🖼️ Image data received (${mimeType})`);
        }
        
        // Check for text response
        if (chunk.text) {
          textResponse += chunk.text;
          console.log(`📝 Text response: ${chunk.text}`);
        }
      }

      if (imageData) {
        return {
          success: true,
          imageData,
          mimeType,
          metadata: {
            prompt: enhancedPrompt,
            originalPrompt: prompt,
            style,
            width,
            height,
            model: this.modelKey,
            generatedAt: new Date().toISOString(),
            provider: 'google-genai',
            textResponse: textResponse || undefined
          }
        };
      } else {
        throw new Error('No image data received from Google GenAI. Response may have been filtered or failed.');
      }

    } catch (error) {
      console.error('❌ AI Generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.toString()
      };
    }
  }

  /**
   * Save generated image to file (like in nano-ex.ts)
   */
  async saveImage(imageData, filename, metadata = {}) {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // Determine file extension from mime type
      const mimeType = metadata.mimeType || 'image/png';
      const extension = mime.getExtension ? mime.getExtension(mimeType) : 
                       (mimeType === 'image/jpeg' ? 'jpg' : 'png');
      
      // Update filename with correct extension
      const baseFilename = filename.replace(/\.[^.]+$/, '');
      const finalFilename = `${baseFilename}.${extension}`;

      const imagePath = path.join(this.tempDir, finalFilename);
      const metadataPath = path.join(this.tempDir, `${baseFilename}.json`);

      // Save image (like in nano-ex.ts)
      const buffer = Buffer.from(imageData, 'base64');
      await fs.writeFile(imagePath, buffer);

      // Save metadata
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ Image saved: ${imagePath}`);
      console.log(`📋 Metadata saved: ${metadataPath}`);

      return {
        imagePath,
        metadataPath,
        size: buffer.length,
        filename: finalFilename
      };

    } catch (error) {
      console.error('❌ Failed to save image:', error.message);
      throw error;
    }
  }

  /**
   * Generate filename from prompt
   */
  generateFilename(prompt, index = 0) {
    // Create safe filename from prompt
    const safe = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const timestamp = Date.now();
    const suffix = index > 0 ? `-${index}` : '';
    
    return `${safe}-${timestamp}${suffix}`;
  }

  /**
   * Generate multiple variations of an image
   */
  async generateVariations(prompt, count = 3, options = {}) {
    console.log(`🎨 Generating ${count} variations of: "${prompt}"`);
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
      console.log(`\n📸 Generating variation ${i + 1}/${count}...`);
      
      const result = await this.generateImage(prompt, options);
      
      if (result.success) {
        const filename = this.generateFilename(prompt, i);
        const saved = await this.saveImage(result.imageData, filename, result.metadata);
        
        results.push({
          variation: i + 1,
          filename: saved.filename,
          ...saved,
          metadata: result.metadata
        });
      } else {
        console.error(`❌ Variation ${i + 1} failed:`, result.error);
        results.push({
          variation: i + 1,
          error: result.error
        });
      }
    }

    return results;
  }

  /**
   * Generate character portrait
   */
  async generateCharacterPortrait(characterName, description, options = {}) {
    const prompt = `Portrait of ${characterName}, ${description}, high quality digital art, detailed facial features, fantasy character design, professional studio lighting`;
    
    const portraitOptions = {
      width: 512,
      height: 768, // Portrait aspect ratio
      style: 'fantasy-art',
      ...options
    };

    console.log(`👤 Generating character portrait for ${characterName}`);
    
    const result = await this.generateImage(prompt, portraitOptions);
    
    if (result.success) {
      const filename = `character-${characterName.toLowerCase().replace(/\s+/g, '-')}-portrait`;
      return await this.saveImage(result.imageData, filename, {
        ...result.metadata,
        characterName,
        type: 'character-portrait'
      });
    }
    
    throw new Error(`Failed to generate portrait: ${result.error}`);
  }

  /**
   * Generate scene/location image
   */
  async generateLocationScene(locationName, description, options = {}) {
    const prompt = `${locationName}, ${description}, epic fantasy landscape, detailed environment, atmospheric lighting, high quality digital art`;
    
    const sceneOptions = {
      width: 1024,
      height: 768, // Landscape aspect ratio
      style: 'fantasy-art',
      ...options
    };

    console.log(`🏞️ Generating location scene for ${locationName}`);
    
    const result = await this.generateImage(prompt, sceneOptions);
    
    if (result.success) {
      const filename = `location-${locationName.toLowerCase().replace(/\s+/g, '-')}-scene`;
      return await this.saveImage(result.imageData, filename, {
        ...result.metadata,
        locationName,
        type: 'location-scene'
      });
    }
    
    throw new Error(`Failed to generate scene: ${result.error}`);
  }

  /**
   * Upload generated images using asset manager
   */
  async uploadToAssets(target, urlMode = 'relative') {
    const { spawn } = require('child_process');
    
    console.log('\n🚀 Uploading generated images to asset manager...');
    
    return new Promise((resolve, reject) => {
      const assetManager = spawn('node', [
        'asset-manager.js',
        'ai-upload',
        `--path=${this.tempDir}`,
        `--target=${target}`,
        `--url-mode=${urlMode}`
      ], {
        cwd: __dirname,
        stdio: 'inherit'
      });

      assetManager.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Asset upload completed successfully');
          resolve();
        } else {
          reject(new Error(`Asset upload failed with code ${code}`));
        }
      });

      assetManager.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Clean up temporary files
   */
  async cleanup() {
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        await fs.unlink(path.join(this.tempDir, file));
      }
      console.log('🧹 Temporary files cleaned up');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }

  /**
   * Generate and upload workflow
   */
  async generateAndUpload(prompt, target, options = {}) {
    const {
      variations = 1,
      uploadAfter = true,
      cleanup = true,
      urlMode = 'relative',
      ...generateOptions
    } = options;

    try {
      let results;
      
      if (variations > 1) {
        results = await this.generateVariations(prompt, variations, generateOptions);
      } else {
        const result = await this.generateImage(prompt, generateOptions);
        if (result.success) {
          const filename = this.generateFilename(prompt);
          const saved = await this.saveImage(result.imageData, filename, result.metadata);
          results = [{ variation: 1, filename: saved.filename, ...saved, metadata: result.metadata }];
        } else {
          throw new Error(result.error);
        }
      }

      const successful = results.filter(r => !r.error);
      console.log(`\n🎉 Generated ${successful.length}/${results.length} images successfully`);

      if (uploadAfter && successful.length > 0) {
        await this.uploadToAssets(target, urlMode);
      }

      if (cleanup) {
        await this.cleanup();
      }

      return results;

    } catch (error) {
      console.error('❌ Generation and upload failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
🎨 Google GenAI Image Generator for Wavelength Lore
Based on nano-ex.ts example from Google

Usage: node google-ai-generator.js <command> [options]

Commands:
  generate <prompt>              Generate single image from prompt
  variations <prompt>            Generate multiple variations (3 by default)
  character <name> <description> Generate character portrait
  location <name> <description>  Generate location/scene image
  workflow <prompt> <target>     Generate and upload to assets

Options:
  --count <number>              Number of variations (default: 3)
  --width <number>              Image width (default: 1024)
  --height <number>             Image height (default: 1024)
  --style <style>               Style preset (fantasy-art, photorealistic, etc.)
  --target <path>               Asset target for upload
  --url-mode <mode>             URL mode for assets (relative, cdn, absolute)
  --no-upload                   Skip automatic upload
  --no-cleanup                  Keep temporary files

Examples:
  # Generate single image
  node google-ai-generator.js generate "Lucky the leprechaun in a magical forest"

  # Generate character portrait
  node google-ai-generator.js character "Lucky" "mischievous leprechaun with green hat"

  # Generate location scene
  node google-ai-generator.js location "Emerald Grove" "mystical forest with glowing trees"

  # Generate and upload to assets
  node google-ai-generator.js workflow "magical crystal cave" "locations/crystal-cave"

  # Generate variations with custom settings
  node google-ai-generator.js variations "epic battle scene" --count=5 --style=fantasy-art

Required Environment Variables:
  GEMINI_API_KEY=your_google_gemini_api_key_here

Get your API key from: https://aistudio.google.com/
`);
    process.exit(0);
  }

  const generator = new GoogleAIImageGenerator();
  const command = args[0];

  try {
    switch (command) {
      case 'generate': {
        const prompt = args[1];
        if (!prompt) throw new Error('Prompt required');

        const options = parseOptions(args.slice(2));
        const result = await generator.generateImage(prompt, options);
        
        if (result.success) {
          const filename = generator.generateFilename(prompt);
          await generator.saveImage(result.imageData, filename, result.metadata);
        } else {
          throw new Error(result.error);
        }
        break;
      }

      case 'variations': {
        const prompt = args[1];
        if (!prompt) throw new Error('Prompt required');

        const options = parseOptions(args.slice(2));
        const count = options.count || 3;
        await generator.generateVariations(prompt, count, options);
        break;
      }

      case 'character': {
        const name = args[1];
        const description = args[2];
        if (!name || !description) throw new Error('Character name and description required');

        const options = parseOptions(args.slice(3));
        await generator.generateCharacterPortrait(name, description, options);
        break;
      }

      case 'location': {
        const name = args[1];
        const description = args[2];
        if (!name || !description) throw new Error('Location name and description required');

        const options = parseOptions(args.slice(3));
        await generator.generateLocationScene(name, description, options);
        break;
      }

      case 'workflow': {
        const prompt = args[1];
        const target = args[2];
        if (!prompt || !target) throw new Error('Prompt and target required');

        const options = parseOptions(args.slice(3));
        await generator.generateAndUpload(prompt, target, options);
        break;
      }

      default:
        throw new Error(`Unknown command: ${command}`);
    }

    console.log('\n🎉 AI image generation completed!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
      case '--count':
        options.count = parseInt(value);
        break;
      case '--width':
        options.width = parseInt(value);
        break;
      case '--height':
        options.height = parseInt(value);
        break;
      case '--style':
        options.style = value;
        break;
      case '--target':
        options.target = value;
        break;
      case '--url-mode':
        options.urlMode = value;
        break;
      case '--no-upload':
        options.uploadAfter = false;
        i--; // No value for this flag
        break;
      case '--no-cleanup':
        options.cleanup = false;
        i--; // No value for this flag
        break;
    }
  }
  
  return options;
}

// Run CLI if called directly
if (require.main === module) {
  main();
}

module.exports = GoogleAIImageGenerator;