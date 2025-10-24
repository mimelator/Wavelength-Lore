/**
 * Product Image URL Resolver
 * 
 * Resolves product preview sourceImage IDs to actual accessible URLs
 * by following the same logic used in vendor-preview-service.js
 * 
 * This resolver handles:
 * 1. Upscaled image lookup in S3
 * 2. Original image fallback
 * 3. Proper CDN URL construction
 * 4. Gallery path resolution
 */

const AWS = require('aws-sdk');

class ProductImageUrlResolver {
    constructor() {
        // Initialize S3 with the same configuration as vendor-preview-service
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

    /**
     * Resolve a sourceImage ID to actual accessible URLs
     * Following the same logic as vendor-preview-service.js downloadImageFromGallery()
     * 
     * CRITICAL FIX: sourceImage contains gallery image TITLES, not S3 file keys
     * Need to search user galleries and match by metadata title/name
     */
    async resolveImageUrl(sourceImageId, userId = null) {
        try {
            console.log(`🔍 Resolving image URL for: ${sourceImageId}`);
            
            // Step 1: Look for upscaled version first (300DPI enhanced)
            const upscaledUrl = await this.findUpscaledVersion(sourceImageId);
            if (upscaledUrl) {
                console.log(`✅ Found upscaled version: ${upscaledUrl}`);
                return {
                    success: true,
                    url: upscaledUrl,
                    type: 'upscaled',
                    sourceId: sourceImageId
                };
            }
            
            // Step 2: CRITICAL - Search all user galleries for image with matching title
            const galleryMatchUrl = await this.findImageByTitle(sourceImageId);
            if (galleryMatchUrl) {
                console.log(`✅ Found gallery image by title: ${galleryMatchUrl}`);
                return {
                    success: true,
                    url: galleryMatchUrl,
                    type: 'gallery_match',
                    sourceId: sourceImageId
                };
            }
            
            // Step 3: Look for original image in S3 (legacy behavior)
            const originalUrl = await this.findOriginalImage(sourceImageId);
            if (originalUrl) {
                console.log(`✅ Found original image: ${originalUrl}`);
                return {
                    success: true,
                    url: originalUrl,
                    type: 'original',
                    sourceId: sourceImageId
                };
            }
            
            // Step 4: Try gallery path patterns if userId is provided
            if (userId) {
                const galleryUrl = await this.findGalleryImage(sourceImageId, userId);
                if (galleryUrl) {
                    console.log(`✅ Found gallery image: ${galleryUrl}`);
                    return {
                        success: true,
                        url: galleryUrl,
                        type: 'gallery',
                        sourceId: sourceImageId
                    };
                }
            }
            
            // Step 5: Return best-guess URL for fallback
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

    /**
     * Search for upscaled version in S3 upscaled/ folder
     * Following the pattern from vendor-preview-service.js
     */
    async findUpscaledVersion(sourceImageId) {
        try {
            const listParams = {
                Bucket: this.bucket,
                Prefix: 'upscaled/',
                MaxKeys: 1000
            };
            
            const objects = await this.s3.listObjectsV2(listParams).promise();
            
            // Look for files that match the sourceImageId pattern
            const baseImageId = sourceImageId.replace(/\.(webp|png|jpg|jpeg)$/i, '');
            
            const upscaledImage = objects.Contents.find(obj => 
                obj.Key.includes(baseImageId) && obj.Key.includes('enhanced')
            );
            
            if (upscaledImage) {
                return `${this.cdnUrl}/${upscaledImage.Key}`;
            }
            
            return null;
            
        } catch (error) {
            console.error('Error searching for upscaled version:', error);
            return null;
        }
    }

    /**
     * Search for original image directly in S3
     */
    async findOriginalImage(sourceImageId) {
        try {
            // Try direct access first
            const headParams = {
                Bucket: this.bucket,
                Key: sourceImageId
            };
            
            await this.s3.headObject(headParams).promise();
            
            // If no error, the object exists
            return `${this.cdnUrl}/${sourceImageId}`;
            
        } catch (error) {
            if (error.code !== 'NotFound') {
                console.error('Error checking original image:', error);
            }
            return null;
        }
    }

    /**
     * Search for image in gallery folder structure
     */
    async findGalleryImage(sourceImageId, userId) {
        try {
            // Try gallery structure: images/gallery/userId/imageId
            const galleryKey = `images/gallery/${userId}/${sourceImageId}`;
            
            const headParams = {
                Bucket: this.bucket,
                Key: galleryKey
            };
            
            await this.s3.headObject(headParams).promise();
            
            return `${this.cdnUrl}/${galleryKey}`;
            
        } catch (error) {
            if (error.code !== 'NotFound') {
                console.error('Error checking gallery image:', error);
            }
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
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }

    /**
     * Get all available image information for a sourceImage
     */
    async getImageInfo(sourceImageId, userId = null) {
        try {
            const urlResult = await this.resolveImageUrl(sourceImageId, userId);
            
            if (!urlResult.success) {
                return urlResult;
            }
            
            // Try to get additional metadata if possible
            const info = {
                ...urlResult,
                metadata: {}
            };
            
            // Try to get S3 object metadata
            try {
                const key = urlResult.url.replace(this.cdnUrl + '/', '');
                const headParams = {
                    Bucket: this.bucket,
                    Key: key
                };
                
                const metadata = await this.s3.headObject(headParams).promise();
                
                info.metadata = {
                    size: metadata.ContentLength,
                    lastModified: metadata.LastModified,
                    contentType: metadata.ContentType,
                    etag: metadata.ETag
                };
                
            } catch (metaError) {
                console.warn('Could not fetch metadata:', metaError.message);
            }
            
            return info;
            
        } catch (error) {
            console.error(`Error getting image info for ${sourceImageId}:`, error);
            return {
                success: false,
                error: error.message,
                sourceId: sourceImageId
            };
        }
    }

    /**
     * FIXED METHOD: Find image by title in lore bucket (not user galleries)
     * Search in the actual content paths like images/seasons/season3/episodes/images/
     */
    async findImageByTitle(sourceImageTitle) {
        try {
            console.log(`🔍 === STARTING LORE CONTENT SEARCH FOR: ${sourceImageTitle} ===`);
            console.log(`📋 Search strategy:`);
            console.log(`   1. Search images/characters/ for character images`);
            console.log(`   2. Search images/seasons/ for episode images`);
            console.log(`   3. Search images/lore/ and images/lores/ for lore content`);
            console.log(`   4. Search images/games/ for game content`);
            console.log(`   5. Check for pattern matches (daphne -> daphne-6.webp)`);
            
            }
            
            console.log(`❌ No image found with title: ${sourceImageTitle}`);
            return null;
            
        } catch (error) {
            console.error(`❌ Error in findImageByTitle for ${sourceImageTitle}:`, error);
            return null;
        }
    }            // Define search paths in order of priority  
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
                baseTitle.toLowerCase(),
                baseTitle.replace('-', '').toLowerCase(),
                baseTitle.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(''),
                baseTitle.split('-').map(part => part.toLowerCase()).join('')
            ];
            
            console.log(`� Search patterns: ${searchPatterns.join(', ')}`);
            
            // Search in images/seasons/ directory
            const seasonsParams = {
                Bucket: this.bucket,
                Prefix: 'images/seasons/',
                MaxKeys: 1000
            };

            console.log(`� Listing season images with params:`, seasonsParams);
            const seasonsResult = await this.s3.listObjectsV2(seasonsParams).promise();
            
            if (!seasonsResult.Contents) {
                console.log('⚠️ No season content found');
                return null;
            }
            
            console.log(`� Found ${seasonsResult.Contents.length} files in seasons directory`);
            
            // Search through all images
            for (const obj of seasonsResult.Contents) {
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
                        return matchUrl;
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
     * Test URL accessibility
     */
    async testUrlAccessibility(url) {
        try {
            const axios = require('axios');
            const response = await axios.head(url, { timeout: 5000 });
            
            return {
                accessible: true,
                status: response.status,
                headers: response.headers
            };
            
        } catch (error) {
            return {
                accessible: false,
                status: error.response?.status,
                error: error.message
            };
        }
    }

    /**
     * Helper method to extract user ID from product preview data
     * This would need to be enhanced based on how user IDs are stored
     */
    extractUserIdFromPreview(preview) {
        // Try to extract user ID from preview data
        // This might need to be enhanced based on the actual data structure
        
        if (preview.createdBy && preview.createdBy !== 'system') {
            return preview.createdBy;
        }
        
        if (preview.userId) {
            return preview.userId;
        }
        
        // Look for user ID in cacheKey or other fields
        if (preview.cacheKey && preview.cacheKey.includes('user-')) {
            const match = preview.cacheKey.match(/user-([^-]+)/);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }
}

module.exports = ProductImageUrlResolver;