#!/usr/bin/env node

/**
 * AI Image Generator for Wavelength Lore
 * Integrates with Google's Imagen API via NanoOmega/Banana
 * Generates images from prompts and automatically manages assets
 */

// Load environment variables using dotenv
// Check if we're just showing help before loading env
const args = process.argv.slice(2);
const showingHelp = args.includes('--help') || args.includes('-h') || args.length === 0;

// Only load environment variables if not showing help
if (!showingHelp) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available - that's okay, use system environment variables
  }
}

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const mime = require('mime');

// Optional chalk for colored output
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // Fallback if chalk not available
  chalk = { yellow: (s) => s, red: (s) => s, green: (s) => s };
}

class AIImageGenerator {
  constructor() {
    this.apiKey = process.env.AI_API_KEY;
    this.modelKey = process.env.AI_MODEL_KEY || 'dall-e-3';
    this.provider = process.env.AI_PROVIDER || 'openai-dalle';
    this.tempDir = path.join(__dirname, '../temp/ai-generated');
    this.outputDir = path.join(__dirname, '../static/images/ai-generated');
    
    // Legacy endpoint detection for backwards compatibility
    this.apiEndpoint = process.env.AI_API_ENDPOINT;
    
    // Detect provider based on endpoint or explicit setting
    if (this.apiEndpoint) {
      this.isOpenAI = this.apiEndpoint.includes('api.openai.com');
      this.isStabilityAI = this.apiEndpoint.includes('api.stability.ai');
      this.isReplicate = this.apiEndpoint.includes('replicate.com') || this.apiEndpoint.includes('api.replicate.com');
      this.isGoogleAI = this.apiEndpoint.includes('generativelanguage.googleapis.com');
      this.isBananaAPI = this.apiEndpoint.includes('banana.dev');
    } else {
      // Default to OpenAI DALL-E if no endpoint specified
      this.isOpenAI = this.provider.includes('openai') || this.provider.includes('dalle');
      this.isStabilityAI = this.provider.includes('stability');
      this.isReplicate = this.provider.includes('replicate');
      this.isGoogleAI = false; // Explicitly disabled - no Google Gemini
      this.isBananaAPI = this.provider.includes('banana');
      
      // Set default OpenAI endpoint if none specified and using OpenAI
      if (this.isOpenAI && !this.apiEndpoint) {
        this.apiEndpoint = 'https://api.openai.com/v1/images/generations';
      }
    }
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(prompt, options = {}) {
    const {
      width = 1024,
      height = 1024,
      steps = 50,
      guidance = 7.5,
      seed = null,
      style = 'photorealistic'
    } = options;

    console.log('🎨 Generating AI image...');
    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`📐 Size: ${width}x${height}`);
    console.log(`🎛️ Steps: ${steps}, Guidance: ${guidance}`);
    
    const provider = this.isOpenAI ? 'OpenAI DALL-E' :
                    this.isStabilityAI ? 'Stability AI' :
                    this.isReplicate ? 'Replicate' :
                    this.isGoogleAI ? 'Google AI Studio' :
                    this.isBananaAPI ? 'Banana.dev' : 'Unknown';
    console.log(`🔧 Provider: ${provider}`);

    try {
      let requestData, response;

      if (this.isOpenAI) {
        // OpenAI DALL-E API format
        // DALL-E 3 only supports: 1024x1024, 1024x1792, 1792x1024
        // DALL-E 2 supports: 256x256, 512x512, 1024x1024
        let size;
        if (this.modelKey && this.modelKey.includes('dall-e-3')) {
          // DALL-E 3 sizes
          if (width >= 1024 && height >= 1024) {
            if (width >= height) {
              size = width >= 1792 ? '1792x1024' : '1024x1024';
            } else {
              size = '1024x1792';
            }
          } else {
            // Default to square for DALL-E 3
            size = '1024x1024';
          }
        } else {
          // DALL-E 2 sizes
          size = width >= 1024 ? '1024x1024' : width >= 512 ? '512x512' : '256x256';
        }
        
        requestData = {
          model: this.modelKey,
          prompt: prompt,
          n: 1,
          size: size,
          quality: (this.modelKey && this.modelKey.includes('dall-e-3')) ? 'standard' : undefined, // DALL-E 3 supports quality, DALL-E 2 doesn't
          response_format: 'b64_json'
        };
        
        // Remove quality for DALL-E 2
        if (!this.modelKey || !this.modelKey.includes('dall-e-3')) {
          delete requestData.quality;
        }

        // DALL-E 3 has a 4000 character prompt limit, truncate if needed
        if (this.modelKey && this.modelKey.includes('dall-e-3') && prompt.length > 4000) {
          console.log(chalk.yellow(`⚠️  Prompt is ${prompt.length} characters, DALL-E 3 limit is 4000. Truncating...`));
          requestData.prompt = prompt.substring(0, 3997) + '...';
        }

        // Retry logic for transient errors (500, 502, 503, 504)
        let response;
        let retries = 0;
        const maxRetries = 3;
        const retryableStatuses = [500, 502, 503, 504];
        
        while (retries <= maxRetries) {
          try {
            response = await axios.post(this.apiEndpoint, requestData, {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 120000
            });
            break; // Success, exit retry loop
          } catch (error) {
            const status = error.response?.status;
            const isRetryable = retryableStatuses.includes(status);
            
            if (isRetryable && retries < maxRetries) {
              retries++;
              const delay = Math.min(1000 * Math.pow(2, retries), 10000); // Exponential backoff, max 10s
              console.log(chalk.yellow(`⚠️  Server error ${status}, retrying (${retries}/${maxRetries}) in ${delay/1000}s...`));
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw error; // Not retryable or max retries reached
          }
        }

        if (response.data.data && response.data.data[0] && response.data.data[0].b64_json) {
          return {
            success: true,
            imageData: response.data.data[0].b64_json,
            metadata: {
              prompt,
              width: parseInt(size.split('x')[0]),
              height: parseInt(size.split('x')[1]),
              steps: 'auto',
              guidance: 'auto',
              seed: 'auto',
              generatedAt: new Date().toISOString(),
              provider: 'openai-dalle',
              model: this.modelKey
            }
          };
        }

      } else if (this.isStabilityAI) {
        // Stability AI API format
        requestData = {
          text_prompts: [{ text: prompt }],
          cfg_scale: guidance,
          height: height,
          width: width,
          steps: steps,
          samples: 1,
          ...(seed && { seed })
        };

        response = await axios.post(this.apiEndpoint, requestData, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 120000
        });

        if (response.data.artifacts && response.data.artifacts[0]) {
          return {
            success: true,
            imageData: response.data.artifacts[0].base64,
            metadata: {
              prompt,
              width,
              height,
              steps,
              guidance,
              seed: response.data.artifacts[0].seed || seed,
              generatedAt: new Date().toISOString(),
              provider: 'stability-ai'
            }
          };
        }

      } else if (this.isGoogleAI) {
        // Google AI Studio API format
        requestData = {
          prompt: {
            text: prompt
          },
          generationConfig: {
            width,
            height,
            ...(seed && { seed }),
            aspectRatio: width > height ? 'LANDSCAPE' : height > width ? 'PORTRAIT' : 'SQUARE'
          }
        };

        response = await axios.post(`${this.apiEndpoint}?key=${this.apiKey}`, requestData, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2 minutes for AI generation
        });

        if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].image) {
          return {
            success: true,
            imageData: response.data.candidates[0].image.data,
            metadata: {
              prompt,
              width,
              height,
              steps,
              guidance,
              seed: seed || 'auto',
              generatedAt: new Date().toISOString(),
              provider: 'google-ai-studio'
            }
          };
        }

      } else if (this.isBananaAPI) {
        // Banana.dev API format
        requestData = {
          prompt,
          width,
          height,
          num_inference_steps: steps,
          guidance_scale: guidance,
          ...(seed && { seed }),
          style_preset: style
        };

        response = await axios.post(this.apiEndpoint, {
          modelKey: this.modelKey,
          modelInputs: requestData
        }, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        });

        if (response.data.modelOutputs && response.data.modelOutputs.image_base64) {
          return {
            success: true,
            imageData: response.data.modelOutputs.image_base64,
            metadata: {
              prompt,
              width,
              height,
              steps,
              guidance,
              seed: response.data.modelOutputs.seed || seed,
              generatedAt: new Date().toISOString(),
              provider: 'banana-dev'
            }
          };
        }

      } else {
        throw new Error(`Unsupported API provider. Endpoint: ${this.apiEndpoint}`);
      }

      throw new Error('No image data received from API');

    } catch (error) {
      console.error('❌ AI Generation failed:', error.message);
      
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        // Better error messages based on status code
        let errorMessage = error.message;
        if (status === 400) {
          errorMessage = `Invalid request: ${errorData?.error?.message || error.message}`;
        } else if (status === 401) {
          errorMessage = `Authentication failed: Check your AI_API_KEY`;
        } else if (status === 429) {
          errorMessage = `Rate limit exceeded: Please wait and try again`;
        } else if (status >= 500) {
          errorMessage = `OpenAI server error: ${errorData?.error?.message || 'Please try again later'}`;
        }
        
        console.error(`📋 Status: ${status}`);
        console.error(`📋 Response:`, JSON.stringify(errorData, null, 2));
        
        return {
          success: false,
          error: errorMessage,
          details: errorData,
          statusCode: status
        };
      }
      
      if (error.request) {
        return {
          success: false,
          error: 'Network error: No response from API. Check your connection and API endpoint.',
          details: { code: error.code }
        };
      }
      
      return {
        success: false,
        error: error.message,
        details: error.toString()
      };
    }
  }

  /**
   * Save generated image to file
   */
  async saveImage(imageData, filename, metadata = {}) {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      const imagePath = path.join(this.tempDir, filename);
      const metadataPath = path.join(this.tempDir, filename.replace(/\.[^.]+$/, '.json'));

      // Save image
      const buffer = Buffer.from(imageData, 'base64');
      await fs.writeFile(imagePath, buffer);

      // Save metadata
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ Image saved: ${imagePath}`);
      console.log(`📋 Metadata saved: ${metadataPath}`);

      return {
        imagePath,
        metadataPath,
        size: buffer.length
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
    
    return `${safe}-${timestamp}${suffix}.png`;
  }

  /**
   * Generate multiple variations of an image
   */
  async generateVariations(prompt, count = 3, options = {}) {
    console.log(`🎨 Generating ${count} variations of: "${prompt}"`);
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
      console.log(`\n📸 Generating variation ${i + 1}/${count}...`);
      
      // Add some randomness for variations
      const variationOptions = {
        ...options,
        seed: options.seed ? options.seed + i : Math.floor(Math.random() * 1000000)
      };

      const result = await this.generateImage(prompt, variationOptions);
      
      if (result.success) {
        const filename = this.generateFilename(prompt, i);
        const saved = await this.saveImage(result.imageData, filename, result.metadata);
        
        results.push({
          variation: i + 1,
          filename,
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
    const prompt = `Portrait of ${characterName}, ${description}, high quality digital art, detailed facial features, fantasy character design, studio lighting`;
    
    const portraitOptions = {
      width: 512,
      height: 768, // Portrait aspect ratio
      steps: 60,
      guidance: 8.0,
      style: 'fantasy-art',
      ...options
    };

    console.log(`👤 Generating character portrait for ${characterName}`);
    
    const result = await this.generateImage(prompt, portraitOptions);
    
    if (result.success) {
      const filename = `character-${characterName.toLowerCase().replace(/\s+/g, '-')}-portrait.png`;
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
      steps: 50,
      guidance: 7.0,
      style: 'fantasy-art',
      ...options
    };

    console.log(`🏞️ Generating location scene for ${locationName}`);
    
    const result = await this.generateImage(prompt, sceneOptions);
    
    if (result.success) {
      const filename = `location-${locationName.toLowerCase().replace(/\s+/g, '-')}-scene.png`;
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
        '--path', this.tempDir,
        '--target', target,
        '--url-mode', urlMode
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
          results = [{ variation: 1, filename, ...saved, metadata: result.metadata }];
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
🎨 AI Image Generator for Wavelength Lore

Usage: node ai-image-generator.js <command> [options]

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
  --steps <number>              Generation steps (default: 50)
  --guidance <number>           Guidance scale (default: 7.5)
  --seed <number>               Random seed for reproducibility
  --style <style>               Style preset (photorealistic, fantasy-art, etc.)
  --target <path>               Asset target for upload
  --url-mode <mode>             URL mode for assets (relative, cdn, absolute)
  --no-upload                   Skip automatic upload
  --no-cleanup                  Keep temporary files

Examples:
  # Generate single image
  node ai-image-generator.js generate "Lucky the leprechaun in a magical forest"

  # Generate character portrait
  node ai-image-generator.js character "Lucky" "mischievous leprechaun with green hat"

  # Generate location scene
  node ai-image-generator.js location "Emerald Grove" "mystical forest with glowing trees"

  # Generate and upload to assets
  node ai-image-generator.js workflow "magical crystal cave" "locations/crystal-cave"

  # Generate variations with custom settings
  node ai-image-generator.js variations "epic battle scene" --count=5 --steps=60
`);
    process.exit(0);
  }

  const generator = new AIImageGenerator();
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
      case '--steps':
        options.steps = parseInt(value);
        break;
      case '--guidance':
        options.guidance = parseFloat(value);
        break;
      case '--seed':
        options.seed = parseInt(value);
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

module.exports = AIImageGenerator;