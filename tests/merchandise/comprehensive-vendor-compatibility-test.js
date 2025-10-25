#!/usr/bin/env node

/**
 * COMPREHENSIVE VENDOR COMPATIBILITY TEST
 * 
 * Tests ALL vendor/blueprint combinations to create a definitive compatibility matrix
 * This will help pre-filter options for customers and prevent failed orders
 */

require('dotenv').config();

async function comprehensiveVendorCompatibilityTest() {
    console.log('🧪 COMPREHENSIVE VENDOR COMPATIBILITY TEST');
    console.log('==========================================\n');

    const compatibilityMatrix = {
        tested: 0,
        working: [],
        failed: [],
        uploadIssues: [],
        summary: {}
    };

    try {
        // Initialize services
        console.log('1️⃣ Initializing services...');
        const EnhancedPrintifyService = require('../../services/enhanced-printify-service');
        const printifyService = new EnhancedPrintifyService();
        console.log('   ✅ Service initialized');

        // Get all available blueprints and vendors
        console.log('\n2️⃣ Getting available blueprints and vendors...');
        const blueprintsResult = await printifyService.getBlueprints();
        const blueprints = Array.isArray(blueprintsResult) ? blueprintsResult : blueprintsResult.blueprints;
        
        // Get print providers
        const providersResponse = await printifyService.api.get('/catalog/print_providers.json');
        const providers = providersResponse.data;
        
        console.log(`   📋 Found ${blueprints.length} blueprints`);
        console.log(`   🏭 Found ${providers.length} print providers`);

        // Get test image and upscale to PNG
        console.log('\n3️⃣ Preparing upscaled PNG test image...');
        const axios = require('axios');
        const ImageUpscalingService = require('../../services/image-upscaling-service');
        const userId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
        
        const galleryResponse = await axios.get('http://localhost:3001/api/gallery/user/images', {
            headers: {
                'X-User-ID': userId,
                'X-API-Request': 'compatibility-test'
            }
        });
        
        const firstImage = galleryResponse.data.images[0];
        const imageResponse = await axios.get(firstImage.url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const originalBuffer = Buffer.from(imageResponse.data);
        console.log(`   📥 Original image: ${Math.round(originalBuffer.length / 1024)}KB`);
        
        // Upscale to PNG for Printify compatibility
        console.log('   🎨 Upscaling to PNG format...');
        const upscalingService = new ImageUpscalingService();
        const upscaleResult = await upscalingService.upscaleImage(originalBuffer, {
            method: 'sharp', // Use Sharp for fast, reliable PNG conversion
            scaleFactor: 2,
            contentType: 'illustration'
        });
        
        if (!upscaleResult.success || !upscaleResult.upscaledBuffer) {
            throw new Error('Failed to upscale test image to PNG format');
        }
        
        const imageBuffer = upscaleResult.upscaledBuffer;
        console.log(`   ✅ Upscaled PNG ready: ${Math.round(imageBuffer.length / 1024)}KB`);

        // Focus on most common/important blueprints for comprehensive testing
        const priorityBlueprints = [
            // T-Shirts (most popular)
            { id: 5, name: 'Unisex Cotton Crew Tee', category: 'apparel' },
            { id: 6, name: 'Unisex Heavy Cotton Tee', category: 'apparel' },
            { id: 9, name: "Women's Favorite Tee", category: 'apparel' },
            { id: 77, name: 'Unisex Heavy Blend™ Hooded Sweatshirt', category: 'apparel' },
            { id: 49, name: 'Unisex Heavy Blend™ Crewneck Sweatshirt', category: 'apparel' },
            
            // Accessories
            { id: 68, name: 'Mug 11oz', category: 'accessories' },
            { id: 97, name: 'Satin Posters (210gsm)', category: 'home-living' },
            { id: 282, name: 'Matte Vertical Posters', category: 'home-living' },
            
            // Additional popular items
            { id: 46, name: 'Unisex Tank Top', category: 'apparel' },
            { id: 71, name: 'Premium Pillow', category: 'home-living' },
            { id: 388, name: 'Sticker', category: 'accessories' }
        ];

        // Focus on major print providers
        const majorProviders = providers.filter(p => 
            [1, 3, 7, 8, 16, 29].includes(p.id) // Major providers based on common usage
        );

        console.log(`\n4️⃣ Testing ${priorityBlueprints.length} priority blueprints with ${majorProviders.length} major providers...`);
        console.log(`   Total combinations to test: ${priorityBlueprints.length * majorProviders.length}`);

        let testCount = 0;
        const totalTests = priorityBlueprints.length * majorProviders.length;

        // Test each combination
        for (const blueprint of priorityBlueprints) {
            console.log(`\n📦 Testing Blueprint: ${blueprint.name} (ID: ${blueprint.id})`);
            
            for (const provider of majorProviders) {
                testCount++;
                const progress = Math.round((testCount / totalTests) * 100);
                
                console.log(`\n   🏭 [${progress}%] Provider: ${provider.title} (ID: ${provider.id})`);
                
                const testResult = {
                    blueprintId: blueprint.id,
                    blueprintName: blueprint.name,
                    blueprintCategory: blueprint.category,
                    providerId: provider.id,
                    providerName: provider.title,
                    providerLocation: provider.location?.country || 'Unknown',
                    status: 'UNKNOWN',
                    error: null,
                    errorCode: null,
                    uploadSuccess: false,
                    productSuccess: false,
                    testTimestamp: new Date().toISOString()
                };

                try {
                    // Test 1: Image Upload (using upscaled PNG)
                    const uploadResult = await printifyService.uploadImage(
                        imageBuffer,
                        `compat-test-${blueprint.id}-${provider.id}.png`,
                        `Compatibility test: ${blueprint.name} + ${provider.title}`
                    );

                    if (uploadResult.success) {
                        testResult.uploadSuccess = true;
                        console.log(`      ✅ Upload: SUCCESS`);

                        // Test 2: Product Creation
                        try {
                            const productResult = await printifyService.createCustomProductWithBlueprint(uploadResult.imageId, {
                                title: `Compat Test: ${blueprint.name}`,
                                description: `Compatibility test product`,
                                blueprintId: blueprint.id,
                                printProviderId: provider.id,
                                basePrice: 2000
                            });

                            if (productResult.productId) {
                                testResult.productSuccess = true;
                                testResult.status = 'WORKING';
                                testResult.productId = productResult.productId;
                                console.log(`      ✅ Product: SUCCESS - ${productResult.productId}`);
                                
                                compatibilityMatrix.working.push(testResult);

                                // Clean up immediately
                                try {
                                    await printifyService.deleteProduct(productResult.productId);
                                    console.log(`      🗑️ Cleaned up`);
                                } catch (cleanupError) {
                                    console.warn(`      ⚠️ Cleanup failed: ${cleanupError.message}`);
                                }
                            } else {
                                throw new Error('No product ID returned');
                            }

                        } catch (productError) {
                            testResult.status = 'PRODUCT_FAILED';
                            testResult.error = productError.message;
                            testResult.errorCode = productError.response?.data?.code || 'UNKNOWN';
                            console.log(`      ❌ Product: FAILED - ${productError.message}`);
                            
                            compatibilityMatrix.failed.push(testResult);
                        }

                    } else {
                        testResult.status = 'UPLOAD_FAILED';
                        testResult.error = uploadResult.error;
                        console.log(`      ❌ Upload: FAILED - ${uploadResult.error}`);
                        
                        compatibilityMatrix.uploadIssues.push(testResult);
                    }

                } catch (generalError) {
                    testResult.status = 'ERROR';
                    testResult.error = generalError.message;
                    testResult.errorCode = generalError.response?.data?.code || 'UNKNOWN';
                    console.log(`      ❌ ERROR: ${generalError.message}`);
                    
                    compatibilityMatrix.failed.push(testResult);
                }

                compatibilityMatrix.tested++;

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Generate comprehensive analysis
        console.log('\n📊 COMPREHENSIVE COMPATIBILITY ANALYSIS');
        console.log('=======================================');
        
        const working = compatibilityMatrix.working;
        const failed = compatibilityMatrix.failed;
        const uploadIssues = compatibilityMatrix.uploadIssues;
        
        console.log(`\n📈 OVERALL STATISTICS:`);
        console.log(`   Total Combinations Tested: ${compatibilityMatrix.tested}`);
        console.log(`   ✅ Working: ${working.length} (${Math.round(working.length/compatibilityMatrix.tested*100)}%)`);
        console.log(`   ❌ Failed: ${failed.length} (${Math.round(failed.length/compatibilityMatrix.tested*100)}%)`);
        console.log(`   🚫 Upload Issues: ${uploadIssues.length} (${Math.round(uploadIssues.length/compatibilityMatrix.tested*100)}%)`);

        // Analyze by blueprint
        console.log(`\n📦 BLUEPRINT COMPATIBILITY:`);
        const blueprintStats = {};
        priorityBlueprints.forEach(bp => {
            const bpWorking = working.filter(w => w.blueprintId === bp.id).length;
            const bpTotal = majorProviders.length;
            const successRate = Math.round((bpWorking / bpTotal) * 100);
            blueprintStats[bp.id] = { name: bp.name, successRate, working: bpWorking, total: bpTotal };
            console.log(`   ${bp.name}: ${bpWorking}/${bpTotal} providers (${successRate}%)`);
        });

        // Analyze by provider
        console.log(`\n🏭 PROVIDER COMPATIBILITY:`);
        const providerStats = {};
        majorProviders.forEach(pv => {
            const pvWorking = working.filter(w => w.providerId === pv.id).length;
            const pvTotal = priorityBlueprints.length;
            const successRate = Math.round((pvWorking / pvTotal) * 100);
            providerStats[pv.id] = { name: pv.title, successRate, working: pvWorking, total: pvTotal };
            console.log(`   ${pv.title}: ${pvWorking}/${pvTotal} blueprints (${successRate}%)`);
        });

        // Best combinations
        console.log(`\n🏆 MOST RELIABLE COMBINATIONS:`);
        working.slice(0, 10).forEach(combo => {
            console.log(`   ✅ ${combo.blueprintName} + ${combo.providerName} (${combo.providerLocation})`);
        });

        // Problem combinations
        if (failed.length > 0) {
            console.log(`\n⚠️ PROBLEMATIC COMBINATIONS:`);
            failed.slice(0, 10).forEach(combo => {
                console.log(`   ❌ ${combo.blueprintName} + ${combo.providerName}: ${combo.error}`);
            });
        }

        // Generate customer-facing recommendations
        console.log(`\n💡 CUSTOMER RECOMMENDATIONS:`);
        
        // Best blueprints (highest success rate)
        const bestBlueprints = Object.entries(blueprintStats)
            .sort(([,a], [,b]) => b.successRate - a.successRate)
            .slice(0, 5);
        
        console.log(`   📦 Most Compatible Blueprints:`);
        bestBlueprints.forEach(([id, stats]) => {
            console.log(`      • ${stats.name} (${stats.successRate}% provider compatibility)`);
        });

        // Best providers (highest success rate)
        const bestProviders = Object.entries(providerStats)
            .sort(([,a], [,b]) => b.successRate - a.successRate)
            .slice(0, 5);
        
        console.log(`   🏭 Most Reliable Providers:`);
        bestProviders.forEach(([id, stats]) => {
            console.log(`      • ${stats.name} (${stats.successRate}% blueprint compatibility)`);
        });

        // Save results to file for future reference
        const fs = require('fs');
        const resultsFile = {
            testDate: new Date().toISOString(),
            totalTested: compatibilityMatrix.tested,
            statistics: {
                working: working.length,
                failed: failed.length,
                uploadIssues: uploadIssues.length
            },
            blueprintStats,
            providerStats,
            workingCombinations: working,
            failedCombinations: failed,
            uploadIssues: uploadIssues,
            recommendations: {
                bestBlueprints: bestBlueprints.map(([id, stats]) => ({ id: parseInt(id), ...stats })),
                bestProviders: bestProviders.map(([id, stats]) => ({ id: parseInt(id), ...stats }))
            }
        };

        fs.writeFileSync(
            '/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/vendor-compatibility-matrix.json',
            JSON.stringify(resultsFile, null, 2)
        );

        console.log(`\n💾 Results saved to: vendor-compatibility-matrix.json`);
        console.log(`\n🎉 COMPATIBILITY TEST COMPLETE!`);
        
        // Determine overall health
        const overallSuccessRate = Math.round((working.length / compatibilityMatrix.tested) * 100);
        if (overallSuccessRate > 70) {
            console.log(`✅ SYSTEM HEALTH: GOOD (${overallSuccessRate}% success rate)`);
        } else if (overallSuccessRate > 40) {
            console.log(`⚠️ SYSTEM HEALTH: MODERATE (${overallSuccessRate}% success rate)`);
        } else {
            console.log(`🚨 SYSTEM HEALTH: POOR (${overallSuccessRate}% success rate)`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        // Force cleanup
        setTimeout(() => {
            console.log('\n🔧 Forcing process exit...');
            process.exit(0);
        }, 3000);
    }
}

comprehensiveVendorCompatibilityTest();