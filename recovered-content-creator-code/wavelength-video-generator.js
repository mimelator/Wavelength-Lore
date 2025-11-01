#!/usr/bin/env node

/**
 * 🎬 WAVELENGTH VIDEO GENERATION SAMPLE - GOOGLE VEO 3.1
 * 
 * Recovered from routes/videoGeneration.js and related files
 * Shows complete implementation of video generation using Google Veo 3.1
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

class WavelengthVideoGenerator {
    constructor() {
        this.apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        this.videoModel = process.env.VIDEO_MODEL_KEY || 'veo-3.1-fast-generate-preview';
        this.operationMetadata = new Map();
        
        // Initialize S3 client
            // Prefer dev credentials, fallback to standard credentials
            const credentials = process.env.aws_wavelength_dev_access_key_id && process.env.aws_wavelength_dev_secret_access_key
                ? {
                    accessKeyId: process.env.aws_wavelength_dev_access_key_id,
                    secretAccessKey: process.env.aws_wavelength_dev_secret_access_key
                }
                : (process.env.ACCESS_KEY_ID && process.env.SECRET_ACCESS_KEY
                    ? {
                        accessKeyId: process.env.ACCESS_KEY_ID,
                        secretAccessKey: process.env.SECRET_ACCESS_KEY
                    }
                    : undefined); // Let AWS SDK use default credentials
            
            const s3Config = {
                region: process.env.AWS_REGION || 'us-east-1'
            };
            
            if (credentials) {
                s3Config.credentials = credentials;
            }
            
            this.s3Client = new S3Client(s3Config);

        if (!this.apiKey) {
            throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY must be configured');
        }

        console.log('🎬 Wavelength Video Generator initialized');
        console.log('📹 Model:', this.videoModel);
    }

    /**
     * Download image from URL to buffer
     */
    async downloadImageToBuffer(imageUrl) {
        return new Promise((resolve, reject) => {
            const protocol = imageUrl.startsWith('https') ? https : http;
            
            protocol.get(imageUrl, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    return this.downloadImageToBuffer(response.headers.location)
                        .then(resolve)
                        .catch(reject);
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
                response.on('error', reject);
            }).on('error', reject);
        });
    }

    /**
     * Generate video from image using Google Veo 3.1
     */
    async generateVideo(imageUrl, prompt, options = {}) {
        const {
            contentType = 'lore',
            contentId = 'sample',
            saveToGallery = true
        } = options;

        console.log('🎬 Starting video generation...');
        console.log('📸 Image:', imageUrl);
        console.log('📝 Prompt:', prompt.substring(0, 100) + '...');

        try {
            // Initialize Google GenAI
            const ai = new GoogleGenerativeAI(this.apiKey);

            console.log('📥 Downloading image...');
            const imageBuffer = await this.downloadImageToBuffer(imageUrl);
            console.log(`✅ Downloaded ${imageBuffer.length} bytes`);

            // Convert to base64
            const imageBase64 = imageBuffer.toString('base64');

            // Determine MIME type
            let mimeType = 'image/jpeg';
            if (imageUrl.toLowerCase().endsWith('.png')) {
                mimeType = 'image/png';
            } else if (imageUrl.toLowerCase().endsWith('.webp')) {
                mimeType = 'image/webp';
            }

            console.log('🎬 Starting Veo 3.1 generation...');

            // Generate video with Veo 3.1
            const operation = await ai.models.generateVideos({
                model: this.videoModel,
                prompt: prompt,
                image: {
                    imageBytes: imageBase64,
                    mimeType: mimeType
                }
            });

            console.log('✅ Video generation started:', operation.name);

            // Store metadata
            this.operationMetadata.set(operation.name, {
                contentType,
                contentId,
                prompt,
                sourceImage: imageUrl,
                createdAt: Date.now(),
                saveToGallery
            });

            return {
                success: true,
                operationId: operation.name,
                status: operation.done ? 'completed' : 'processing'
            };

        } catch (error) {
            console.error('❌ Video generation error:', error);
            throw error;
        }
    }

    /**
     * Check video generation status
     */
    async checkVideoStatus(operationId) {
        console.log('📊 Checking status for:', operationId);

        try {
            const fetch = (await import('node-fetch')).default;
            const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${this.apiKey}`;
            
            const response = await fetch(statusUrl);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }
            
            const operation = await response.json();

            if (operation.done) {
                console.log('✅ Video generation completed');
                
                if (operation.error) {
                    return {
                        success: false,
                        status: 'failed',
                        error: operation.error.message
                    };
                }

                // Get video file - try both response structures
                let videoFile = operation.response?.generatedVideos?.[0]?.video ||
                               operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video;
                
                if (!videoFile) {
                    console.error('❌ No video file in response:', JSON.stringify(operation.response, null, 2));
                    return {
                        success: false,
                        status: 'failed',
                        error: 'No video generated'
                    };
                }

                return {
                    success: true,
                    status: 'succeeded',
                    videoFile: {
                        uri: videoFile.uri
                    }
                };
            } else {
                return {
                    success: true,
                    status: 'processing'
                };
            }

        } catch (error) {
            console.error('❌ Status check error:', error);
            throw error;
        }
    }

    /**
     * Download completed video
     */
    async downloadVideo(operationId, outputPath = null) {
        console.log('📥 Downloading video for:', operationId);

        try {
            // First check if it's ready
            const status = await this.checkVideoStatus(operationId);
            
            if (status.status !== 'succeeded') {
                throw new Error(`Video not ready. Status: ${status.status}`);
            }

            const fetch = (await import('node-fetch')).default;
            const videoUrl = `${status.videoFile.uri}&key=${this.apiKey}`;
            
            console.log('💾 Downloading from URI...');
            const videoResponse = await fetch(videoUrl);

            if (!videoResponse.ok) {
                throw new Error(`Failed to download: ${videoResponse.status}`);
            }

            const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
            console.log(`✅ Downloaded ${videoBuffer.length} bytes`);

            // Save to file if path provided
            if (outputPath) {
                fs.writeFileSync(outputPath, videoBuffer);
                console.log(`💾 Saved to: ${outputPath}`);
            }

            // Upload to S3 and gallery if metadata exists
            const metadata = this.operationMetadata.get(operationId);
            if (metadata && metadata.saveToGallery) {
                console.log('📤 Uploading to S3 gallery...');
                const relativePath = await this.uploadToGallery(videoBuffer, metadata);
                console.log(`✅ Added to gallery: ${relativePath}`);
            }

            // Clean up metadata
            this.operationMetadata.delete(operationId);

            return {
                success: true,
                videoBuffer,
                filePath: outputPath
            };

        } catch (error) {
            console.error('❌ Download error:', error);
            throw error;
        }
    }

    /**
     * Upload video to S3 and add to Firebase gallery
     */
    async uploadToGallery(videoBuffer, metadata) {
        const timestamp = Date.now();
        const videoId = crypto.randomBytes(8).toString('hex');
        const s3Key = `images/${metadata.contentType}s/${metadata.contentId}/video-generated-${timestamp}-${videoId}.mp4`;
        
        console.log(`📤 Uploading to S3: ${s3Key}`);
        
        const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket',
            Key: s3Key,
            Body: videoBuffer,
            ContentType: 'video/mp4',
            CacheControl: 'max-age=31536000',
            Metadata: {
                'generated-by': 'google-veo-3.1',
                'prompt': metadata.prompt.replace(/[\r\n\t]/g, ' ').substring(0, 200),
                'source-image': metadata.sourceImage,
                'generated-at': new Date().toISOString()
            }
        };
        
        await this.s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`✅ Uploaded to S3: ${s3Key}`);
        
        // Add to Firebase gallery (requires Firebase Admin SDK setup)
        // This would add the video to the content item's gallery
        
        return `/${s3Key}`;
    }

    /**
     * Complete workflow: generate + wait + download
     */
    async generateAndDownloadVideo(imageUrl, prompt, options = {}) {
        const { outputPath, maxWaitTime = 300000 } = options; // 5 min default
        
        console.log('🎬 Starting complete video generation workflow...');
        
        try {
            // Start generation
            const result = await this.generateVideo(imageUrl, prompt, options);
            
            if (!result.success) {
                throw new Error('Failed to start video generation');
            }

            const { operationId } = result;
            console.log('⏳ Waiting for completion...');

            // Poll for completion
            const startTime = Date.now();
            while (Date.now() - startTime < maxWaitTime) {
                const status = await this.checkVideoStatus(operationId);
                
                if (status.status === 'succeeded') {
                    console.log('✅ Generation completed! Downloading...');
                    return await this.downloadVideo(operationId, outputPath);
                } else if (status.status === 'failed') {
                    throw new Error(`Generation failed: ${status.error}`);
                }

                console.log('⏳ Still processing... checking again in 10s');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            throw new Error('Timeout waiting for video completion');

        } catch (error) {
            console.error('❌ Workflow error:', error);
            throw error;
        }
    }
}

/**
 * CLI Example Usage
 */
async function main() {
    if (require.main !== module) return; // Only run if called directly

    const imageUrl = process.argv[2];
    const prompt = process.argv[3];
    const outputPath = process.argv[4];

    if (!imageUrl || !prompt) {
        console.log('Usage: node video-generator.js <imageUrl> <prompt> [outputPath]');
        console.log('Example: node video-generator.js "https://example.com/image.jpg" "A mystical forest scene with flowing water" ./output.mp4');
        process.exit(1);
    }

    try {
        const generator = new WavelengthVideoGenerator();
        
        const result = await generator.generateAndDownloadVideo(imageUrl, prompt, {
            outputPath: outputPath || `./veo-generated-${Date.now()}.mp4`,
            contentType: 'sample',
            contentId: 'cli-test'
        });

        console.log('🎉 Video generation complete!');
        console.log('📹 File:', result.filePath);
        console.log('📊 Size:', result.videoBuffer.length, 'bytes');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = WavelengthVideoGenerator;

// Run CLI if called directly
if (require.main === module) {
    main();
}