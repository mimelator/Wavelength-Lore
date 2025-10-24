/**
 * Product Image URL Resolver
 * 
 * FIXED VERSION - Searches ALL content paths for character, lore, and episode images
 */

const AWS = require('aws-sdk');

class ProductImageUrlResolver {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: 'us-east-1'
        });
        
        this.bucket = 'wavelength-lore-bucket';
        this.cdnUrl = 'https://d3ohg9sf8htmwk.cloudfront.net';
        
        console.log('🔗 Product Image URL Resolver initialized');
        console.log(`🪣 S3 Bucket: ${this.bucket}`);
        console.log(`🌐 CDN URL: ${this.cdnUrl}`);
    }

    async resolveImageUrl(sourceImageId, userId = null) {
        try {
            console.log(`🔍 Resolving image URL for: ${sourceImageId}`);
            
            // Search for image in lore content paths
            const galleryMatchUrl = await this.findImageByTitle(sourceImageId);
            if (galleryMatchUrl) {
                console.log(`✅ Found image by title: ${galleryMatchUrl}`);
                return {
                    success: true,
                    url: galleryMatchUrl,
                    type: 'lore_content',
                    sourceId: sourceImageId
                };
            }
            
            // Fallback URL
            const fallbackUrl = `${this.cdnUrl}/${sourceImageId}`;
            console.log(`⚠️ No direct match found, using fallback: ${fallbackUrl}`);
            
            return {
                success: false,
                url: fallbackUrl,
                type: 'fallback',
                sourceId: sourceImageId,
                message: 'No direct match found in S3, using fallback URL'
            };
            
        } catch (error) {
            console.error(`❌ Error resolving image URL for ${sourceImageId}:`, error);
            
            return {
                success: false,
                url: null,
                type: 'error',
                sourceId: sourceImageId,
                error: error.message
            };
        }
    }

    async findImageByTitle(sourceImageTitle) {
        try {
            console.log(`🔍 === STARTING LORE CONTENT SEARCH FOR: ${sourceImageTitle} ===`);
            console.log(`📋 Search strategy:`);
            console.log(`   1. Search images/characters/ for character images`);
            console.log(`   2. Search images/seasons/ for episode images`);
            console.log(`   3. Search images/lore/ and images/lores/ for lore content`);
            console.log(`   4. Search images/games/ for game content`);
            
            // Create search patterns from the sourceImageTitle
            const baseTitle = sourceImageTitle.replace(/\.(webp|png|jpg|jpeg)$/i, '');
            const searchPatterns = [
                baseTitle.toLowerCase(),
                baseTitle.replace('-', '').toLowerCase(),
                baseTitle.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(''),
                baseTitle.split('-').map(part => part.toLowerCase()).join('')
            ];
            
            console.log(`📝 Search patterns: ${searchPatterns.join(', ')}`);
            
            // Define search paths in order of priority  
            const searchPrefixes = [
                'images/characters/',
                'images/lore/',
                'images/lores/',
                'images/seasons/', 
                'images/games/',
                'images/'
            ];
            
            // Search each prefix
            for (const prefix of searchPrefixes) {
                console.log(`🔍 Searching in: ${prefix}`);
                
                const searchParams = {
                    Bucket: this.bucket,
                    Prefix: prefix,
                    MaxKeys: 1000
                };

                const searchResult = await this.s3.listObjectsV2(searchParams).promise();
                
                if (!searchResult.Contents) {
                    console.log(`⚠️ No content found in ${prefix}`);
                    continue;
                }
                
                console.log(`📁 Found ${searchResult.Contents.length} files in ${prefix}`);
                
                // Search through all images in this prefix
                for (const obj of searchResult.Contents) {
                    const filename = obj.Key.split('/').pop().toLowerCase();
                    const fullPath = obj.Key;
                    
                    // CRITICAL: Only match actual image files, not audio files!
                    const isImageFile = /\.(webp|png|jpg|jpeg|gif|bmp|tiff)$/i.test(filename);
                    if (!isImageFile) {
                        continue; // Skip non-image files like MP3, MP4, etc.
                    }
                    
                    // Check if filename matches any of our search patterns
                    for (const pattern of searchPatterns) {
                        if (filename.includes(pattern)) {
                            const matchUrl = `${this.cdnUrl}/${fullPath}`;
                            console.log(`✅ MATCH FOUND!`);
                            console.log(`   Pattern: "${pattern}" matches "${filename}"`);
                            console.log(`   Full path: ${fullPath}`);
                            console.log(`   Resolved URL: ${matchUrl}`);
                            console.log(`   File type: IMAGE (validated)`);
                            console.log(`   Search location: ${prefix}`);
                            return matchUrl;
                        }
                    }
                }
            }
            
            console.log(`❌ No image found with title: ${sourceImageTitle}`);
            return null;
            
        } catch (error) {
            console.error(`❌ Error in findImageByTitle for ${sourceImageTitle}:`, error);
            return null;
        }
    }

    /**
     * Resolve multiple sourceImage IDs in batch
     */
    async resolveMultipleImageUrls(sourceImageIds, userId = null) {
        const results = [];
        
        for (const sourceImageId of sourceImageIds) {
            const result = await this.resolveImageUrl(sourceImageId, userId);
            results.push(result);
            
            // Small delay to avoid overwhelming S3
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        return results;
    }
}

module.exports = ProductImageUrlResolver;