#!/usr/bin/env node

/**
 * Lore Bucket Explorer
 * Finds original images in the lore bucket that correspond to upscaled images
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const galleryConfig = require('../utils/gallery/config');

class LoreBucketExplorer {
    constructor() {
        this.s3Client = new S3Client({
            region: galleryConfig.AWS_REGION,
            credentials: {
                accessKeyId: galleryConfig.ACCESS_KEY_ID,
                secretAccessKey: galleryConfig.SECRET_ACCESS_KEY
            }
        });
        
        // Try different possible lore bucket names
        this.possibleBuckets = [
            'wavelength-lore-bucket',
            'wavelength-lore',
            'wavelength-lore-static',
            process.env.S3_BUCKET_NAME,
            'wavelength-lore-backups' // As fallback
        ].filter(Boolean);
        
        console.log('🔍 Lore Bucket Explorer');
        console.log('📦 Will check buckets:', this.possibleBuckets);
    }
    
    async testBucketAccess(bucketName) {
        try {
            console.log(`\n🔍 Testing access to bucket: ${bucketName}`);
            
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                MaxKeys: 5
            });
            
            const response = await this.s3Client.send(command);
            
            console.log(`✅ Successfully accessed ${bucketName}`);
            console.log(`📁 Contains ${response.KeyCount || 0} objects (showing first 5)`);
            
            if (response.Contents && response.Contents.length > 0) {
                response.Contents.forEach(obj => {
                    const sizeKB = (obj.Size / 1024).toFixed(1);
                    console.log(`   📄 ${obj.Key} (${sizeKB}KB)`);
                });
            }
            
            return true;
            
        } catch (error) {
            if (error.Code === 'NoSuchBucket') {
                console.log(`❌ Bucket ${bucketName} does not exist`);
            } else if (error.Code === 'AccessDenied') {
                console.log(`🔒 Access denied to bucket ${bucketName}`);
            } else {
                console.log(`❌ Error accessing ${bucketName}: ${error.message}`);
            }
            return false;
        }
    }
    
    async findLoreImages(bucketName) {
        try {
            console.log(`\n🖼️  Searching for images in ${bucketName}...`);
            
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                MaxKeys: 1000
            });
            
            const response = await this.s3Client.send(command);
            
            if (!response.Contents || response.Contents.length === 0) {
                console.log('📭 No objects found in bucket');
                return [];
            }
            
            // Filter for image files
            const imageFiles = response.Contents.filter(obj => 
                /\.(jpg|jpeg|png|webp|gif)$/i.test(obj.Key)
            );
            
            console.log(`📸 Found ${imageFiles.length} image files in ${bucketName}`);
            
            // Group by folder structure
            const folderGroups = {};
            imageFiles.forEach(img => {
                const pathParts = img.Key.split('/');
                const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'root';
                
                if (!folderGroups[folder]) folderGroups[folder] = [];
                folderGroups[folder].push(img);
            });
            
            // Show folder structure
            console.log('\n📂 IMAGE FOLDER STRUCTURE:');
            Object.entries(folderGroups)
                .sort((a, b) => b[1].length - a[1].length) // Sort by number of images
                .forEach(([folder, images]) => {
                    console.log(`   📁 ${folder}: ${images.length} images`);
                    
                    // Show a few examples
                    images.slice(0, 3).forEach(img => {
                        const sizeKB = (img.Size / 1024).toFixed(1);
                        const filename = img.Key.split('/').pop();
                        console.log(`      📄 ${filename} (${sizeKB}KB)`);
                    });
                    
                    if (images.length > 3) {
                        console.log(`      ... and ${images.length - 3} more`);
                    }
                });
            
            return imageFiles;
            
        } catch (error) {
            console.error(`❌ Error searching for images in ${bucketName}:`, error.message);
            return [];
        }
    }
    
    async findMatchingOriginals(bucketName, upscaledImages) {
        try {
            console.log(`\n🔍 Looking for original images that match upscaled versions...`);
            
            // Get some sample upscaled image names to understand the pattern
            const sampleUpscaled = [
                'image-1761189060145-96a34e421d0e9556.webp-enhanced-1761236058704.png',
                'image-1761189061820-9cf82021fa915d49.webp-enhanced-1761230951816.png',
                'cache-demo-1761241118289-enhanced-1761241140403.png'
            ];
            
            console.log('🎯 Sample upscaled patterns to match:');
            sampleUpscaled.forEach(name => {
                console.log(`   📄 ${name}`);
                
                // Try to extract original pattern
                const originalMatch = name.match(/^(.+)-enhanced-\d+\.(png|jpg|jpeg)$/i);
                if (originalMatch) {
                    const originalBase = originalMatch[1];
                    console.log(`      ➡️  Original likely: ${originalBase}.*`);
                }
            });
            
            // Search for files with similar patterns
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                MaxKeys: 1000
            });
            
            const response = await this.s3Client.send(command);
            
            if (!response.Contents) {
                console.log('📭 No contents found to match against');
                return [];
            }
            
            // Look for potential original images
            const potentialOriginals = response.Contents.filter(obj => {
                const key = obj.Key;
                const isImage = /\.(jpg|jpeg|png|webp)$/i.test(key);
                const hasTimestamp = /\d{13}/.test(key); // 13-digit timestamp
                const isNotUpscaled = !key.includes('enhanced') && !key.includes('upscaled');
                
                return isImage && hasTimestamp && isNotUpscaled;
            });
            
            console.log(`\n📋 Found ${potentialOriginals.length} potential original images`);
            
            if (potentialOriginals.length > 0) {
                console.log('\n🏆 TOP POTENTIAL ORIGINALS:');
                potentialOriginals.slice(0, 10).forEach(img => {
                    const sizeKB = (img.Size / 1024).toFixed(1);
                    const sizeMB = (img.Size / 1024 / 1024).toFixed(1);
                    const size = img.Size > 1024 * 1024 ? `${sizeMB}MB` : `${sizeKB}KB`;
                    
                    console.log(`   📄 ${img.Key} (${size})`);
                });
            }
            
            return potentialOriginals;
            
        } catch (error) {
            console.error(`❌ Error finding matching originals:`, error.message);
            return [];
        }
    }
    
    async run() {
        console.log('🚀 LORE BUCKET EXPLORATION');
        console.log('==========================\n');
        
        let workingBucket = null;
        let allImages = [];
        
        // Test each possible bucket
        for (const bucketName of this.possibleBuckets) {
            const canAccess = await this.testBucketAccess(bucketName);
            
            if (canAccess) {
                workingBucket = bucketName;
                console.log(`✅ Using bucket: ${bucketName}`);
                
                // Find images in this bucket
                const images = await this.findLoreImages(bucketName);
                allImages = allImages.concat(images);
                
                // If we found images, this is probably the right bucket
                if (images.length > 0) {
                    break;
                }
            }
        }
        
        if (!workingBucket) {
            console.log('❌ Could not access any lore bucket');
            return;
        }
        
        if (allImages.length === 0) {
            console.log('📭 No images found in any accessible bucket');
            return;
        }
        
        // Try to find matching originals for upscaled images
        await this.findMatchingOriginals(workingBucket, allImages);
        
        console.log('\n📊 SUMMARY:');
        console.log(`✅ Working bucket: ${workingBucket}`);
        console.log(`📸 Total images found: ${allImages.length}`);
        console.log(`🔍 This data can be used to update the Global Image Cache migration`);
    }
}

async function main() {
    try {
        const explorer = new LoreBucketExplorer();
        await explorer.run();
    } catch (error) {
        console.error('❌ Exploration failed:', error.message);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = LoreBucketExplorer;