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

class MediaGenerationService {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || `http://localhost:${process.env.PORT || 3001}`;
        this.apiKey = process.env.AI_API_KEY;
        this.authToken = options.authToken; // Optional auth token for authenticated requests
        
        // Initialize the recovered AI image generator (no Google Gemini)
        this.imageGenerator = new AIImageGenerator();
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
                    if (result.details) {
                        console.error('   Details:', result.details);
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
     * Generate video from image using AI
     * @param {Object} params - Generation parameters
     * @returns {Promise<Object>} Generated video data
     */
    async generateVideo(params) {
        const {
            imageUrl,
            promptText,
            contentType,
            contentId,
            metadata = {}
        } = params;

        if (!imageUrl) {
            throw new Error('imageUrl is required for video generation');
        }

        if (!promptText) {
            throw new Error('promptText is required for video generation');
        }

        try {
            const requestBody = {
                imageUrl,
                prompt: promptText,
                contentType: contentType || 'episode',
                contentId: contentId || 'unknown',
                metadata
            };

            const response = await axios.post(
                `${this.baseUrl}/api/generate/video`,
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
                    },
                    timeout: 300000 // 5 minute timeout for video generation
                }
            );

            if (response.data.success) {
                return {
                    success: true,
                    video: {
                        url: response.data.videoUrl,
                        operationId: response.data.operationId,
                        status: response.data.status || 'processing'
                    },
                    metadata: {
                        imageUrl,
                        prompt: promptText,
                        contentType,
                        contentId,
                        generatedAt: new Date().toISOString()
                    }
                };
            } else {
                throw new Error(response.data.message || 'Video generation failed');
            }
        } catch (error) {
            console.error('❌ Video generation error:', error.message);
            if (error.response) {
                throw new Error(error.response.data?.message || `API Error: ${error.response.status}`);
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
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/generate/video/status/${operationId}`,
                {
                    headers: {
                        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('❌ Video status check error:', error.message);
            throw error;
        }
    }
}

module.exports = MediaGenerationService;

