/**
 * User Gallery Contamination Test
 * 
 * Verifies that no system images are being incorrectly written to user gallery paths.
 * User galleries should ONLY contain user-uploaded images, never system content.
 * 
 * This test checks for:
 * 1. System images incorrectly stored in images/gallery/
 * 2. Lore content images in wrong locations
 * 3. Product preview images in user galleries
 * 4. Any automated processes writing to user spaces
 */

const AWS = require('aws-sdk');
require('dotenv').config();

class UserGalleryContaminationTest {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: 'us-east-1'
        });
        
        this.loreBucket = 'wavelength-lore-bucket';
        this.galleryBucket = 'wavelength-gallery-346923';
        
        this.violations = [];
        this.suspiciousPatterns = [
            'ice-fortress',
            'goblin-king',
            'daphne',
            'alexandria',
            'yeti',
            'jewel',
            'maurice',
            'season',
            'episode',
            'lore',
            'character',
            'enhanced',
            'upscaled'
        ];
    }

    async runComprehensiveTest() {
        console.log('🚨 USER GALLERY CONTAMINATION TEST');
        console.log('===================================');
        
        try {
            console.log('\n📋 Test Parameters:');
            console.log(`   🪣 Lore Bucket: ${this.loreBucket}`);
            console.log(`   🪣 Gallery Bucket: ${this.galleryBucket}`);
            console.log(`   🔍 Suspicious Patterns: ${this.suspiciousPatterns.join(', ')}`);
            
            // Test 1: Check user gallery bucket for system content
            await this.checkGalleryBucketForSystemContent();
            
            // Test 2: Check for any user gallery directories in lore bucket
            await this.checkLoreBucketForUserGalleries();
            
            // Test 3: Analyze file metadata for incorrect origins
            await this.analyzeFileMetadataForViolations();
            
            // Test 4: Check for recent automated uploads to user galleries
            await this.checkForAutomatedUploads();
            
            // Generate report
            this.generateViolationReport();
            
            return {
                passed: this.violations.length === 0,
                violationCount: this.violations.length,
                violations: this.violations
            };
            
        } catch (error) {
            console.error('❌ Contamination test failed:', error);
            return {
                passed: false,
                error: error.message,
                violations: this.violations
            };
        }
    }

    async checkGalleryBucketForSystemContent() {
        console.log('\n🔍 TEST 1: CHECKING GALLERY BUCKET FOR SYSTEM CONTENT');
        console.log('=====================================================');
        
        try {
            const params = {
                Bucket: this.galleryBucket,
                Prefix: 'images/gallery/',
                MaxKeys: 1000
            };
            
            console.log('📂 Scanning user gallery directories...');
            const result = await this.s3.listObjectsV2(params).promise();
            
            if (!result.Contents || result.Contents.length === 0) {
                console.log('✅ No files found in gallery bucket user directories');
                return;
            }
            
            console.log(`📊 Found ${result.Contents.length} files in user galleries`);
            
            // Check each file for suspicious patterns
            for (const obj of result.Contents) {
                const key = obj.Key;
                const filename = key.split('/').pop().toLowerCase();
                
                // Check for system content patterns
                for (const pattern of this.suspiciousPatterns) {
                    if (filename.includes(pattern.toLowerCase())) {
                        this.violations.push({
                            type: 'SYSTEM_CONTENT_IN_USER_GALLERY',
                            severity: 'HIGH',
                            bucket: this.galleryBucket,
                            key: key,
                            pattern: pattern,
                            description: `System content pattern "${pattern}" found in user gallery`,
                            size: obj.Size,
                            lastModified: obj.LastModified
                        });
                        
                        console.log(`🚨 VIOLATION: ${key} contains system pattern "${pattern}"`);
                    }
                }
                
                // Check for automated upload indicators
                if (this.isAutomatedUpload(key, obj)) {
                    this.violations.push({
                        type: 'AUTOMATED_UPLOAD_TO_USER_GALLERY',
                        severity: 'CRITICAL',
                        bucket: this.galleryBucket,
                        key: key,
                        description: 'Automated system upload detected in user gallery',
                        size: obj.Size,
                        lastModified: obj.LastModified
                    });
                    
                    console.log(`🚨 CRITICAL: Automated upload detected: ${key}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error checking gallery bucket:', error);
            this.violations.push({
                type: 'TEST_ERROR',
                severity: 'HIGH',
                description: `Failed to check gallery bucket: ${error.message}`
            });
        }
    }

    async checkLoreBucketForUserGalleries() {
        console.log('\n🔍 TEST 2: CHECKING LORE BUCKET FOR USER GALLERIES');
        console.log('==================================================');
        
        try {
            const params = {
                Bucket: this.loreBucket,
                Prefix: 'images/gallery/',
                MaxKeys: 100
            };
            
            console.log('📂 Checking for user gallery paths in lore bucket...');
            const result = await this.s3.listObjectsV2(params).promise();
            
            if (!result.Contents || result.Contents.length === 0) {
                console.log('✅ No user gallery paths found in lore bucket');
                return;
            }
            
            console.log(`🚨 Found ${result.Contents.length} files in user gallery paths within lore bucket!`);
            
            for (const obj of result.Contents) {
                this.violations.push({
                    type: 'USER_GALLERY_IN_LORE_BUCKET',
                    severity: 'CRITICAL',
                    bucket: this.loreBucket,
                    key: obj.Key,
                    description: 'User gallery path found in lore bucket (should not exist)',
                    size: obj.Size,
                    lastModified: obj.LastModified
                });
                
                console.log(`🚨 CRITICAL: User gallery path in lore bucket: ${obj.Key}`);
            }
            
        } catch (error) {
            console.error('❌ Error checking lore bucket:', error);
        }
    }

    async analyzeFileMetadataForViolations() {
        console.log('\n🔍 TEST 3: ANALYZING FILE METADATA FOR VIOLATIONS');
        console.log('=================================================');
        
        // Sample recent files from gallery bucket for metadata analysis
        try {
            const params = {
                Bucket: this.galleryBucket,
                Prefix: 'images/gallery/',
                MaxKeys: 50
            };
            
            const result = await this.s3.listObjectsV2(params).promise();
            
            if (!result.Contents || result.Contents.length === 0) {
                console.log('✅ No files to analyze in gallery bucket');
                return;
            }
            
            console.log(`📊 Analyzing metadata of ${result.Contents.length} gallery files...`);
            
            for (const obj of result.Contents.slice(0, 10)) { // Limit to 10 for performance
                try {
                    const headParams = {
                        Bucket: this.galleryBucket,
                        Key: obj.Key
                    };
                    
                    const metadata = await this.s3.headObject(headParams).promise();
                    
                    // Check for system-generated metadata
                    if (this.hasSystemGeneratedMetadata(metadata, obj.Key)) {
                        this.violations.push({
                            type: 'SYSTEM_GENERATED_METADATA_IN_USER_GALLERY',
                            severity: 'HIGH',
                            bucket: this.galleryBucket,
                            key: obj.Key,
                            description: 'File has system-generated metadata in user gallery',
                            metadata: metadata.Metadata
                        });
                        
                        console.log(`🚨 VIOLATION: System metadata in user file: ${obj.Key}`);
                    }
                    
                } catch (metaError) {
                    console.log(`⚠️ Could not read metadata for ${obj.Key}: ${metaError.message}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error analyzing metadata:', error);
        }
    }

    async checkForAutomatedUploads() {
        console.log('\n🔍 TEST 4: CHECKING FOR RECENT AUTOMATED UPLOADS');
        console.log('================================================');
        
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        
        try {
            const params = {
                Bucket: this.galleryBucket,
                Prefix: 'images/gallery/',
                MaxKeys: 200
            };
            
            const result = await this.s3.listObjectsV2(params).promise();
            
            if (!result.Contents || result.Contents.length === 0) {
                console.log('✅ No recent files found in gallery bucket');
                return;
            }
            
            const recentFiles = result.Contents.filter(obj => obj.LastModified > cutoffTime);
            console.log(`📊 Found ${recentFiles.length} files modified in last 24 hours`);
            
            for (const obj of recentFiles) {
                // Check if file pattern suggests automated upload
                if (this.isAutomatedUpload(obj.Key, obj)) {
                    this.violations.push({
                        type: 'RECENT_AUTOMATED_UPLOAD',
                        severity: 'CRITICAL',
                        bucket: this.galleryBucket,
                        key: obj.Key,
                        description: 'Recent automated upload to user gallery detected',
                        lastModified: obj.LastModified,
                        size: obj.Size
                    });
                    
                    console.log(`🚨 RECENT VIOLATION: ${obj.Key} (${obj.LastModified})`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error checking recent uploads:', error);
        }
    }

    isAutomatedUpload(key, obj) {
        // Patterns that suggest automated uploads
        const automatedPatterns = [
            /^images\/gallery\/[^\/]+\/image-\d+-[a-f0-9]+\.(webp|png|jpg)$/i, // Generated filename pattern
            /enhanced/i,
            /upscaled/i,
            /generated/i,
            /system/i
        ];
        
        // Size patterns (very large or very small files might be automated)
        const suspiciousSize = obj.Size > 5000000 || obj.Size < 1000; // > 5MB or < 1KB
        
        // Time patterns (uploads at odd hours)
        const hour = obj.LastModified.getHours();
        const suspiciousTime = hour < 6 || hour > 23; // Between 11PM and 6AM
        
        return automatedPatterns.some(pattern => pattern.test(key)) || 
               (suspiciousSize && suspiciousTime);
    }

    hasSystemGeneratedMetadata(metadata, key) {
        const systemMetadataIndicators = [
            'generated-by',
            'source-system',
            'enhanced-version',
            'original-name', // If it's different from filename, might be system rename
            'processing-date',
            'ai-generated'
        ];
        
        if (!metadata.Metadata) return false;
        
        return systemMetadataIndicators.some(indicator => 
            Object.keys(metadata.Metadata).some(key => 
                key.toLowerCase().includes(indicator)
            )
        );
    }

    generateViolationReport() {
        console.log('\n📊 CONTAMINATION TEST RESULTS');
        console.log('==============================');
        
        if (this.violations.length === 0) {
            console.log('🎉 NO VIOLATIONS FOUND!');
            console.log('✅ User galleries are clean of system content');
            return;
        }
        
        console.log(`🚨 ${this.violations.length} VIOLATIONS DETECTED!`);
        
        // Group by severity
        const critical = this.violations.filter(v => v.severity === 'CRITICAL');
        const high = this.violations.filter(v => v.severity === 'HIGH');
        const medium = this.violations.filter(v => v.severity === 'MEDIUM');
        
        console.log(`   🔴 Critical: ${critical.length}`);
        console.log(`   🟠 High: ${high.length}`);
        console.log(`   🟡 Medium: ${medium.length}`);
        
        console.log('\n📋 DETAILED VIOLATIONS:');
        this.violations.forEach((violation, i) => {
            console.log(`\n${i + 1}. ${violation.type} (${violation.severity})`);
            console.log(`   📁 ${violation.bucket}/${violation.key || 'N/A'}`);
            console.log(`   📝 ${violation.description}`);
            if (violation.pattern) console.log(`   🔍 Pattern: ${violation.pattern}`);
            if (violation.lastModified) console.log(`   📅 Modified: ${violation.lastModified}`);
            if (violation.size) console.log(`   📏 Size: ${violation.size} bytes`);
        });
        
        console.log('\n🔧 RECOMMENDED ACTIONS:');
        console.log('   1. Investigate code that writes to user gallery paths');
        console.log('   2. Move misplaced system content to correct locations');
        console.log('   3. Fix automated processes to use proper storage paths');
        console.log('   4. Add validation to prevent future contamination');
    }
}

// Run the test
async function runContaminationTest() {
    const test = new UserGalleryContaminationTest();
    const results = await test.runComprehensiveTest();
    
    console.log('\n🎯 FINAL VERDICT:');
    if (results.passed) {
        console.log('✅ CONTAMINATION TEST PASSED');
        process.exit(0);
    } else {
        console.log('❌ CONTAMINATION TEST FAILED');
        console.log(`   Found ${results.violationCount} violations`);
        process.exit(1);
    }
}

runContaminationTest();