/**
 * Media Generation Service
 * 
 * Service layer for AI-powered image and video generation.
 * Uses recovered ai-image-generator.js for image generation (supports multiple providers).
 * Wraps existing API routes and provides CLI-friendly interface.
 * 
 * GitHub Issue: #131 - Milestone 2.2: Media Generation Tools (CLI-exposed)
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const AIImageGenerator = require('../recovered-content-creator-code/ai-image-generator');
const WavelengthVideoGenerator = require('../recovered-content-creator-code/wavelength-video-generator');
const chalk = require('chalk');

class MediaGenerationService {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || `http://localhost:${process.env.PORT || 3001}`;
        this.apiKey = process.env.AI_API_KEY;
        this.authToken = options.authToken; // Optional auth token for authenticated requests
        
        // Initialize the recovered AI image generator (no Google Gemini for images)
        this.imageGenerator = new AIImageGenerator();
        
        // Initialize the recovered video generator (Google Veo 3.1)
        try {
            this.videoGenerator = new WavelengthVideoGenerator();
        } catch (error) {
            console.warn(chalk.yellow('⚠️ Video generator initialization failed:', error.message));
            console.warn(chalk.gray('   Video generation will not be available. Ensure GOOGLE_API_KEY or GEMINI_API_KEY is set.'));
            this.videoGenerator = null;
        }
    }

    /**
     * Generate images using AI (using recovered ai-image-generator.js)
     * @param {Object} params - Generation parameters
     * @returns {Promise<Array>} Generated image data
     */
    async generateImages(params) {
        const {
            promptText,
            count = 1,
            width = 1024,
            height = 1024,
            style = 'photorealistic',
            contentType = null,
            contentId = null,
            metadata = {}
        } = params;

        // Use prompt directly - user prompts are complete and ready
        const enhancedPrompt = promptText;

        // Log generation details
        console.log('\n📡 AI Image Generation (using recovered ai-image-generator.js):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📝 Prompt (${enhancedPrompt.length} characters):`);
        console.log('   ' + enhancedPrompt.split('\n').join('\n   '));
        console.log(`📊 Parameters:`);
        console.log(`   - Count: ${count}`);
        console.log(`   - Dimensions: ${width}x${height}`);
        console.log(`   - Style: ${style}`);
        if (contentType) console.log(`   - Content Type: ${contentType}`);
        if (contentId) console.log(`   - Content ID: ${contentId}`);
        console.log(`   - Prompt ID: ${metadata.promptId || `cli-${Date.now()}`}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        try {
            const generatedImages = [];
            const actualCount = Math.min(Math.max(count, 1), 4); // Clamp between 1-4

            // Generate multiple images if count > 1
            for (let i = 0; i < actualCount; i++) {
                console.log(`🔮 Generating image ${i + 1}/${actualCount}...`);

                const result = await this.imageGenerator.generateImage(enhancedPrompt, {
                    width,
                    height,
                    style
                });

                if (result.success) {
                    // Create data URL from base64 image data
                    const mimeType = result.metadata?.provider === 'openai-dalle' ? 'image/png' : 'image/png';
                    const dataUrl = `data:${mimeType};base64,${result.imageData}`;
                    const imageId = `img-${Date.now()}-${i}`;

                    generatedImages.push({
                        id: imageId,
                        dataUrl: dataUrl,
                        url: dataUrl, // Use dataUrl as url for compatibility
                        previewUrl: dataUrl,
                        mimeType: mimeType,
                        metadata: {
                            ...result.metadata,
                            promptId: metadata.promptId || `cli-${Date.now()}`,
                            index: i,
                            contentType,
                            contentId
                        }
                    });

                    console.log(`✅ Image ${i + 1} generated successfully`);
                } else {
                    console.error(`❌ Image ${i + 1} failed: ${result.error}`);
                    if (result.statusCode) {
                        console.error(`   Status Code: ${result.statusCode}`);
                    }
                    if (result.details) {
                        console.error('   Details:', JSON.stringify(result.details, null, 2));
                    }
                    
                    // If it's a 500 error, suggest retry
                    if (result.statusCode >= 500) {
                        console.error('   💡 This is a server error - you can try again. The prompt may be too long or complex.');
                    }
                    // Continue with other generations
                }
            }

            if (generatedImages.length === 0) {
                throw new Error('Failed to generate any images. Check your AI_API_KEY and AI_API_ENDPOINT configuration.');
            }

            console.log(`\n✅ Successfully generated ${generatedImages.length}/${actualCount} image(s)`);
            console.log('');

            return {
                success: true,
                images: generatedImages,
                metadata: {
                    promptId: metadata.promptId || `cli-${Date.now()}`,
                    prompt: enhancedPrompt,
                    count: generatedImages.length,
                    dimensions: { width, height },
                    style,
                    generatedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('\n❌ Image generation error:');
            console.error(`   Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate video from image using AI (Google Veo 3.1)
     * @param {Object} params - Generation parameters
     * @returns {Promise<Object>} Generated video data
     */
    async generateVideo(params) {
        const {
            imageUrl,
            promptText,
            contentType,
            contentId,
            metadata = {},
            waitForCompletion = false,
            maxWaitTime = 300000 // 5 minutes default
        } = params;

        if (!this.videoGenerator) {
            throw new Error('Video generator not initialized. Ensure GOOGLE_API_KEY or GEMINI_API_KEY is set.');
        }

        if (!imageUrl) {
            throw new Error('imageUrl is required for video generation');
        }

        if (!promptText) {
            throw new Error('promptText is required for video generation');
        }

        // Log generation details
        console.log('\n📡 AI Video Generation (using Google Veo 3.1):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📸 Image URL: ${imageUrl.substring(0, 80)}${imageUrl.length > 80 ? '...' : ''}`);
        console.log(`📝 Prompt (${promptText.length} characters):`);
        console.log('   ' + promptText.split('\n').slice(0, 3).join('\n   '));
        if (promptText.split('\n').length > 3) {
            console.log(`   ... (${promptText.split('\n').length - 3} more lines)`);
        }
        console.log(`📊 Parameters:`);
        if (contentType) console.log(`   - Content Type: ${contentType}`);
        if (contentId) console.log(`   - Content ID: ${contentId}`);
        console.log(`   - Wait for completion: ${waitForCompletion}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        try {
            // Handle data URLs - convert to file or use directly
            let processedImageUrl = imageUrl;
            
            if (imageUrl.startsWith('data:')) {
                // For data URLs, we need to save to a temporary file first
                // Or the video generator needs to handle base64
                // For now, throw an error suggesting to use an uploaded image
                throw new Error('Data URL images not directly supported for video generation. Please upload the image to S3 first, or use an existing image URL.');
            }

            // Convert relative paths to full URLs if needed
            if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
                const cdnUrl = process.env.CDN_URL || 'http://localhost:3001';
                processedImageUrl = `${cdnUrl}${imageUrl}`;
            }

            if (waitForCompletion) {
                // Use the complete workflow that waits for completion
                console.log('🎬 Starting video generation workflow (will wait for completion)...');
                
                const result = await this.videoGenerator.generateAndDownloadVideo(
                    processedImageUrl,
                    promptText,
                    {
                        contentType: contentType || 'lore',
                        contentId: contentId || 'unknown',
                        saveToGallery: true,
                        maxWaitTime
                    }
                );

                return {
                    success: true,
                    video: {
                        url: result.filePath || null,
                        videoBuffer: result.videoBuffer,
                        status: 'completed'
                    },
                    metadata: {
                        imageUrl: processedImageUrl,
                        prompt: promptText,
                        contentType: contentType || 'lore',
                        contentId: contentId || 'unknown',
                        generatedAt: new Date().toISOString()
                    }
                };
            } else {
                // Start generation and return operation ID for polling
                console.log('🎬 Starting video generation (async mode)...');
                
                const result = await this.videoGenerator.generateVideo(
                    processedImageUrl,
                    promptText,
                    {
                        contentType: contentType || 'lore',
                        contentId: contentId || 'unknown',
                        saveToGallery: true
                    }
                );

                return {
                    success: true,
                    video: {
                        operationId: result.operationId,
                        status: result.status || 'processing'
                    },
                    metadata: {
                        imageUrl: processedImageUrl,
                        prompt: promptText,
                        contentType: contentType || 'lore',
                        contentId: contentId || 'unknown',
                        generatedAt: new Date().toISOString()
                    }
                };
            }
        } catch (error) {
            console.error('\n❌ Video generation error:');
            console.error(`   Error: ${error.message}`);
            if (error.response) {
                console.error(`   API Error: ${error.response.status} - ${error.response.statusText}`);
            }
            throw error;
        }
    }

    /**
     * Check video generation status
     * @param {string} operationId - Operation ID from generation
     * @returns {Promise<Object>} Video status
     */
    async checkVideoStatus(operationId) {
        if (!this.videoGenerator) {
            throw new Error('Video generator not initialized. Ensure GOOGLE_API_KEY or GEMINI_API_KEY is set.');
        }

        try {
            const status = await this.videoGenerator.checkVideoStatus(operationId);
            return status;
        } catch (error) {
            console.error('❌ Video status check error:', error.message);
            throw error;
        }
    }

    /**
     * Download completed video
     * @param {string} operationId - Operation ID from generation
     * @param {string} outputPath - Optional path to save video
     * @returns {Promise<Object>} Video download result
     */
    async downloadVideo(operationId, outputPath = null) {
        if (!this.videoGenerator) {
            throw new Error('Video generator not initialized. Ensure GOOGLE_API_KEY or GEMINI_API_KEY is set.');
        }

        try {
            const result = await this.videoGenerator.downloadVideo(operationId, outputPath);
            return result;
        } catch (error) {
            console.error('❌ Video download error:', error.message);
            throw error;
        }
    }
}

module.exports = MediaGenerationService;

