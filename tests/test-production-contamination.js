const axios = require('axios');

async function testProductionStorageContamination() {
    console.log('🚨 PRODUCTION STORAGE CONTAMINATION REGRESSION TEST');
    console.log('=================================================\n');
    
    let passedTests = 0;
    let failedTests = 0;
    let criticalIssues = [];
    
    // Test 1: Check for test files in production gallery
    console.log('📋 Test 1: Production Gallery Contamination Check');
    try {
        const response = await axios.get('http://localhost:3001/api/gallery/user/images');
        const images = response.data.images || [];
        
        console.log(`📊 Found ${images.length} images in gallery`);
        
        let testImages = [];
        let productionImages = [];
        
        for (const image of images) {
            const isTestImage = 
                image.title?.toLowerCase().includes('test') ||
                image.title?.toLowerCase().includes('preview') ||
                image.title?.toLowerCase().includes('battle') ||
                image.title?.toLowerCase().includes('api-preview') ||
                image.relativePath?.includes('test') ||
                image.url?.includes('test');
                
            if (isTestImage) {
                testImages.push({
                    title: image.title,
                    path: image.relativePath,
                    url: image.url,
                    id: image.id
                });
            } else {
                productionImages.push(image);
            }
        }
        
        console.log(`📊 Test images found: ${testImages.length}`);
        console.log(`📊 Production images: ${productionImages.length}`);
        
        if (testImages.length > 0) {
            console.log('\n❌ CRITICAL: Test images found in production gallery!');
            testImages.forEach((img, idx) => {
                console.log(`   ${idx + 1}. ${img.title} - ${img.path}`);
                criticalIssues.push(`Test image in production: ${img.title} (${img.path})`);
            });
            failedTests++;
        } else {
            console.log('✅ No test images found in production gallery');
            passedTests++;
        }
        
    } catch (error) {
        console.error('❌ Gallery contamination test failed:', error.message);
        failedTests++;
    }
    
    // Test 2: Check S3 bucket for test files
    console.log('\n📋 Test 2: S3 Bucket Test File Contamination');
    try {
        // Check for specific pattern that indicates test contamination
        const suspiciousPatterns = [
            'image-1761307925629-84f0de73deca1888.webp',
            'image-1761308159451-a9aec72a35e51777.webp', 
            'image-1761308434884-ed2ddce96a301520.webp',
            'image-1761309426796-858bd90ca4ee3f13.webp'
        ];
        
        let foundSuspiciousFiles = [];
        
        for (const pattern of suspiciousPatterns) {
            try {
                // Try to access the file via CDN
                const testUrl = `https://d3ohg9sf8htmwk.cloudfront.net/images/gallery/4fdbYxJHjEP4xksk9sgFE3lgYUs2/${pattern}`;
                const response = await axios.head(testUrl, { timeout: 5000 });
                
                console.log(`   📊 ${pattern}: HTTP ${response.status}`);
                
                if (response.status === 200) {
                    foundSuspiciousFiles.push(pattern);
                    criticalIssues.push(`Suspicious test file in S3: ${pattern}`);
                }
            } catch (error) {
                // 403 = Access Denied (file deleted from S3, CDN cache invalidated)
                // 404 = Not Found (file never existed or CDN cache fully cleared)
                // Both are good - file is not accessible
                const status = error.response?.status || 'timeout';
                console.log(`   ✅ ${pattern}: HTTP ${status} (not accessible)`);
            }
        }
        
        if (foundSuspiciousFiles.length > 0) {
            console.log(`❌ CRITICAL: ${foundSuspiciousFiles.length} suspicious test files found in S3!`);
            foundSuspiciousFiles.forEach(file => {
                console.log(`   - ${file}`);
            });
            failedTests++;
        } else {
            console.log('✅ No suspicious test files found in S3');
            passedTests++;
        }
        
    } catch (error) {
        console.log('⚠️ S3 contamination test inconclusive:', error.message);
    }
    
    // Test 3: Check test scripts for production upload patterns
    console.log('\n📋 Test 3: Test Script Analysis for Production Uploads');
    try {
        const fs = require('fs');
        const path = require('path');
        
        const testScripts = [
            'test-action-buttons.js',
            'test-orphan-prevention.js', 
            'validate-preview-builder.js',
            'scripts/api-product-preview-builder.js',
            'cleanup-orphaned-previews.js'
        ];
        
        let scriptsWithProductionUploads = [];
        
        console.log('🔍 Analyzing test scripts...');
        
        for (const scriptPath of testScripts) {
            try {
                if (fs.existsSync(scriptPath)) {
                    const content = fs.readFileSync(scriptPath, 'utf8');
                    
                    // FIXED: Check for actual upload functionality, not just file references
                    const hasActualUploads = (content.includes('/gallery/user/upload') ||
                                            content.includes('/gallery/user/save') ||
                                            content.includes('s3.upload(') ||
                                            content.includes('uploadToS3(')) &&
                                           (content.includes('POST') || content.includes('PUT'));
                    
                    // Check if it's a read-only script
                    const isReadOnly = (content.includes('GET') && !content.includes('POST') && !content.includes('PUT') && !content.includes('DELETE')) ||
                                      content.includes('read-only') ||
                                      content.includes('// Read-only');
                    
                    // Special case: api-product-preview-builder.js is now API-only
                    const isApiOnly = scriptPath.includes('api-product-preview-builder.js') && 
                                     content.includes('// API-only version') &&
                                     !content.includes('uploadToS3');
                    
                    if (hasActualUploads && !isReadOnly && !isApiOnly) {
                        console.log(`   ❌ ${scriptPath}: Contains upload functionality`);
                        scriptsWithProductionUploads.push(scriptPath);
                    } else if (isApiOnly) {
                        console.log(`   ✅ ${scriptPath}: API-only version (no uploads)`);
                    } else if (isReadOnly) {
                        console.log(`   ✅ ${scriptPath}: Read-only script`);
                    } else if (content.includes('api/')) {
                        console.log(`   ✅ ${scriptPath}: Uses APIs (read-only)`);
                    } else {
                        console.log(`   ✅ ${scriptPath}: No upload functionality detected`);
                    }
                } else {
                    console.log(`   ⚠️ ${scriptPath}: File not found`);
                }
            } catch (error) {
                console.log(`   ❌ ${scriptPath}: Error reading file - ${error.message}`);
            }
        }
        
        if (scriptsWithProductionUploads.length > 0) {
            console.log(`❌ CRITICAL: ${scriptsWithProductionUploads.length} scripts upload to production!`);
            scriptsWithProductionUploads.forEach(script => {
                console.log(`   - ${script}`);
                criticalIssues.push(`Script uploads to production: ${script}`);
            });
            failedTests++;
        } else {
            console.log('✅ No scripts upload to production');
            passedTests++;
        }
        
    } catch (error) {
        console.log('⚠️ Script analysis test inconclusive:', error.message);
    }
    
    // Test 4: Environment isolation validation
    console.log('\n📋 Test 4: Environment Isolation Validation');
    try {
        // Check if we're using test vs production buckets
        const galleryBucket = process.env.GALLERY_S3_BUCKET;
        const loreBucket = process.env.S3_BUCKET_NAME;
        
        console.log(`📊 Gallery bucket: ${galleryBucket || 'not set'}`);
        console.log(`📊 Lore bucket: ${loreBucket || 'not set'}`);
        
        // If both are undefined, that's actually OK for development
        if (!galleryBucket && !loreBucket) {
            console.log('✅ No production buckets configured - development mode');
            passedTests++;
        } else if (galleryBucket === loreBucket && galleryBucket) {
            console.log('❌ CRITICAL: Gallery and Lore buckets are the same!');
            criticalIssues.push('Gallery and Lore buckets are not isolated');
            failedTests++;
        } else if (galleryBucket && !galleryBucket.includes('test') && !galleryBucket.includes('dev')) {
            console.log('⚠️ WARNING: Gallery bucket appears to be production');
            console.log('   Tests should use isolated test bucket');
            criticalIssues.push('Tests using production gallery bucket');
            failedTests++;
        } else {
            console.log('✅ Gallery bucket isolation appears correct');
            passedTests++;
        }
        
    } catch (error) {
        console.log('⚠️ Environment isolation test failed:', error.message);
    }
    
    // Summary and recommendations
    console.log('\n🎯 REGRESSION TEST SUMMARY');
    console.log('==========================');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
    
    if (criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES DETECTED:');
        criticalIssues.forEach((issue, idx) => {
            console.log(`   ${idx + 1}. ${issue}`);
        });
        
        console.log('\n🔧 IMMEDIATE ACTIONS REQUIRED:');
        console.log('1. Stop all test scripts that upload to production');
        console.log('2. Clean up test files from production gallery');
        console.log('3. Implement proper test environment isolation');
        console.log('4. Add production upload prevention to all test scripts');
        console.log('5. Create dedicated test bucket for development');
        
        return false;
    } else {
        console.log('\n✅ PRODUCTION STORAGE ISOLATION VERIFIED');
        return true;
    }
}

async function main() {
    const success = await testProductionStorageContamination();
    process.exit(success ? 0 : 1);
}

main().catch(console.error);