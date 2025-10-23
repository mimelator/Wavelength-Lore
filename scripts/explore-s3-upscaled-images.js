#!/usr/bin/env node

/**
 * S3 Bucket Explorer for Upscaled Images
 * Explores the S3 bucket structure to find all upscaled/enhanced images
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const galleryConfig = require('../utils/gallery/config');

class S3BucketExplorer {
    constructor() {
        this.s3Client = new S3Client({
            region: galleryConfig.AWS_REGION,
            credentials: {
                accessKeyId: galleryConfig.ACCESS_KEY_ID,
                secretAccessKey: galleryConfig.SECRET_ACCESS_KEY
            }
        });
        
        this.bucketName = galleryConfig.GALLERY_S3_BUCKET || 'wavelength-gallery-346923';
        console.log('🪣 Exploring S3 bucket:', this.bucketName);
        console.log('🔑 Using credentials with Access Key ID:', galleryConfig.ACCESS_KEY_ID ? galleryConfig.ACCESS_KEY_ID.substring(0, 5) + '...' : 'undefined');
    }
    
    async exploreFolder(prefix = '', maxKeys = 100) {
        try {
            console.log(`\n🔍 Exploring folder: "${prefix}"`);
            
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys,
                Delimiter: '/' // This will group results by folder
            });
            
            const response = await this.s3Client.send(command);
            
            // Show folders (CommonPrefixes)
            if (response.CommonPrefixes && response.CommonPrefixes.length > 0) {
                console.log(`📁 Found ${response.CommonPrefixes.length} subfolders:`);
                response.CommonPrefixes.forEach(folder => {
                    console.log(`   📂 ${folder.Prefix}`);
                });
            }
            
            // Show files (Contents)
            if (response.Contents && response.Contents.length > 0) {
                console.log(`📄 Found ${response.Contents.length} files:`);
                response.Contents.forEach(obj => {
                    const sizeKB = (obj.Size / 1024).toFixed(1);
                    const sizeMB = (obj.Size / 1024 / 1024).toFixed(1);
                    const isLarge = obj.Size > 1024 * 1024; // > 1MB
                    const isUpscaledPattern = obj.Key.includes('upscal') || 
                                            obj.Key.includes('enhanced') || 
                                            obj.Key.includes('4x') ||
                                            obj.Key.includes('2x');
                    
                    const indicator = isUpscaledPattern ? '🚀' : (isLarge ? '📈' : '📄');
                    const size = isLarge ? `${sizeMB}MB` : `${sizeKB}KB`;
                    
                    console.log(`   ${indicator} ${obj.Key} (${size})`);
                });
            }
            
            if (!response.CommonPrefixes?.length && !response.Contents?.length) {
                console.log(`   📭 Empty folder`);
            }
            
            return {
                folders: response.CommonPrefixes || [],
                files: response.Contents || [],
                isTruncated: response.IsTruncated
            };
            
        } catch (error) {
            console.error(`❌ Failed to explore folder "${prefix}":`, error.message);
            return { folders: [], files: [], isTruncated: false };
        }
    }
    
    async findUpscaledImages() {
        console.log('\n🔍 SEARCHING FOR UPSCALED IMAGES');
        console.log('===============================');
        
        // Common patterns for upscaled/enhanced images
        const searchPrefixes = [
            'upscaled/',
            'enhanced/',
            'images/upscaled/',
            'images/enhanced/',
            'images/gallery/', // User galleries might contain upscaled
            'ai-enhanced/',
            '4x/',
            '2x/',
            ''  // Root level search
        ];
        
        const upscaledImages = [];
        
        for (const prefix of searchPrefixes) {
            try {
                console.log(`\n🔍 Searching prefix: "${prefix}"`);
                
                const command = new ListObjectsV2Command({
                    Bucket: this.bucketName,
                    Prefix: prefix,
                    MaxKeys: 1000 // Get more results
                });
                
                const response = await this.s3Client.send(command);
                
                if (response.Contents && response.Contents.length > 0) {
                    const foundUpscaled = response.Contents.filter(obj => {
                        const isLarge = obj.Size > 2 * 1024 * 1024; // > 2MB
                        const hasUpscaledPattern = obj.Key.toLowerCase().includes('upscal') || 
                                                 obj.Key.toLowerCase().includes('enhanced') || 
                                                 obj.Key.toLowerCase().includes('4x') ||
                                                 obj.Key.toLowerCase().includes('2x') ||
                                                 obj.Key.toLowerCase().includes('ai');
                        
                        return isLarge || hasUpscaledPattern;
                    });
                    
                    if (foundUpscaled.length > 0) {
                        console.log(`   ✅ Found ${foundUpscaled.length} potential upscaled images`);
                        upscaledImages.push(...foundUpscaled);
                    } else {
                        console.log(`   📄 Found ${response.Contents.length} files, none appear upscaled`);
                    }
                } else {
                    console.log(`   📭 No files found in prefix`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error searching prefix "${prefix}": ${error.message}`);
            }
        }
        
        return upscaledImages;
    }
    
    async run() {
        console.log('🚀 S3 BUCKET EXPLORATION FOR UPSCALED IMAGES');
        console.log('============================================\n');
        
        // First, explore root structure
        console.log('📋 ROOT FOLDER STRUCTURE:');
        const rootStructure = await this.exploreFolder('', 50);
        
        // Find all upscaled images
        const upscaledImages = await this.findUpscaledImages();
        
        console.log('\n📊 UPSCALED IMAGES SUMMARY:');
        console.log('===========================');
        
        if (upscaledImages.length > 0) {
            console.log(`✅ Found ${upscaledImages.length} potential upscaled images!`);
            console.log('\n🏆 TOP 10 LARGEST IMAGES:');
            
            // Sort by size and show top 10
            const sortedBySize = upscaledImages
                .sort((a, b) => b.Size - a.Size)
                .slice(0, 10);
                
            sortedBySize.forEach((img, index) => {
                const sizeMB = (img.Size / 1024 / 1024).toFixed(1);
                const pathParts = img.Key.split('/');
                const folder = pathParts.slice(0, -1).join('/');
                const filename = pathParts[pathParts.length - 1];
                
                console.log(`   ${index + 1}. ${filename}`);
                console.log(`      📁 Path: ${folder || 'root'}/`);
                console.log(`      📊 Size: ${sizeMB}MB`);
                console.log(`      📅 Modified: ${img.LastModified.toLocaleDateString()}`);
            });
            
            // Analyze path patterns
            console.log('\n📁 PATH PATTERNS ANALYSIS:');
            const pathPatterns = {};
            upscaledImages.forEach(img => {
                const pathParts = img.Key.split('/');
                const folder = pathParts.slice(0, -1).join('/') || 'root';
                pathPatterns[folder] = (pathPatterns[folder] || 0) + 1;
            });
            
            Object.entries(pathPatterns)
                .sort((a, b) => b[1] - a[1])
                .forEach(([path, count]) => {
                    console.log(`   📂 ${path}: ${count} images`);
                });
                
        } else {
            console.log('❌ No upscaled images found!');
            console.log('💡 This might mean:');
            console.log('   • Images are stored under different patterns');
            console.log('   • Images haven\'t been upscaled yet');
            console.log('   • Different S3 bucket or path structure');
        }
    }
}

async function main() {
    try {
        const explorer = new S3BucketExplorer();
        await explorer.run();
    } catch (error) {
        console.error('❌ Exploration failed:', error.message);
    }
}

if (require.main === module) {
    main().catch(console.error);
}