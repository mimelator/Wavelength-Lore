#!/usr/bin/env node

/**
 * Printify Blueprint Discovery Tool
 * 
 * Discovers available blueprints and their compatible print providers
 * to fix the product-types.js configuration
 */

const path = require('path');
// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');
const fs = require('fs');

class PrintifyBlueprintDiscovery {
    constructor() {
        this.apiKey = process.env.PRINTIFY_API_TOKEN;
        this.baseURL = 'https://api.printify.com/v1';
        
        if (!this.apiKey) {
            throw new Error('PRINTIFY_API_TOKEN environment variable is required');
        }
        
        this.api = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Wavelength-Lore/1.0'
            }
        });

        this.categoryMap = {
            'apparel': ['shirt', 'tshirt', 't-shirt', 'hoodie', 'tank', 'sweatshirt', 'jersey'],
            'home': ['mug', 'cup', 'poster', 'print', 'canvas', 'wall', 'home'],
            'accessories': ['bag', 'tote', 'phone', 'case', 'sticker', 'decal', 'accessory']
        };

        // Output file for discovered blueprints
        this.outputFile = path.join(__dirname, '..', 'config', 'printify-blueprints-discovered.json');
        this.progressFile = path.join(__dirname, '..', 'config', 'printify-discovery-progress.json');
    }

    async loadProgress() {
        try {
            if (fs.existsSync(this.progressFile)) {
                const progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
                console.log(`📂 Resuming from previous progress: ${progress.processedCount}/${progress.totalCount} blueprints`);
                return progress;
            }
        } catch (error) {
            console.log(`⚠️  Could not load progress file: ${error.message}`);
        }
        return null;
    }

    async saveProgress(progress) {
        try {
            fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
        } catch (error) {
            console.error(`❌ Failed to save progress: ${error.message}`);
        }
    }

    async saveIncremental(workingBlueprints, progress = null) {
        try {
            const data = {
                discoveredAt: new Date().toISOString(),
                totalBlueprints: workingBlueprints.length,
                categories: this.categoryMap,
                workingConfigurations: workingBlueprints,
                progress: progress || { processedCount: workingBlueprints.length, totalCount: workingBlueprints.length }
            };
            fs.writeFileSync(this.outputFile, JSON.stringify(data, null, 2));
            console.log(`💾 Incremental save: ${workingBlueprints.length} blueprints saved`);
        } catch (error) {
            console.error(`❌ Failed to save incremental results: ${error.message}`);
        }
    }

    async discoverBlueprints() {
        console.log('🔍 Discovering Available Blueprints...\n');
        
        // Common blueprint IDs to test
        const commonBlueprints = [
            // T-shirts and apparel
            3, 5, 6, 9, 16, 71, 146, 388, 390, 
            // Mugs and drinkware
            17, 159, 337, 
            // Posters and prints
            7, 135, 165, 297,
            // Bags and accessories
            34, 36, 79, 898, 947,
            // Hoodies and sweatshirts
            146, 220, 388, 462
        ];

        // Load previous progress if it exists
        const previousProgress = await this.loadProgress();
        const workingBlueprints = [];
        let processedCount = 0;
        let skipCount = 0;

        // If resuming, load previous results
        if (previousProgress && previousProgress.workingBlueprints) {
            workingBlueprints.push(...previousProgress.workingBlueprints);
            skipCount = previousProgress.processedCount || 0;
            console.log(`📂 Loaded ${workingBlueprints.length} previously discovered blueprints`);
        }

        for (let i = 0; i < commonBlueprints.length; i++) {
            const blueprintId = commonBlueprints[i];
            
            // Skip if already processed
            if (i < skipCount) {
                continue;
            }

            try {
                const response = await this.api.get(`/catalog/blueprints/${blueprintId}.json`);
                const blueprint = response.data;
                
                console.log(`✅ Blueprint ${blueprintId}: ${blueprint.title}`);
                console.log(`   Description: ${blueprint.description}`);
                console.log(`   Brand: ${blueprint.brand}`);
                
                // Get print providers for this blueprint
                const providers = await this.getProvidersForBlueprint(blueprintId);
                
                workingBlueprints.push({
                    id: blueprintId,
                    title: blueprint.title,
                    description: blueprint.description,
                    brand: blueprint.brand,
                    providers: providers,
                    category: this.categorizeBlueprint(blueprint.title, blueprint.description)
                });

                console.log(`   Providers: ${providers.map(p => `${p.id} (${p.title})`).join(', ')}`);
                console.log(`   Category: ${this.categorizeBlueprint(blueprint.title, blueprint.description)}\n`);

                // Update progress and save incrementally every 3 blueprints
                processedCount = i + 1;
                if (processedCount % 3 === 0 || processedCount === commonBlueprints.length) {
                    const progress = {
                        processedCount,
                        totalCount: commonBlueprints.length,
                        workingBlueprints: [...workingBlueprints],
                        lastProcessedAt: new Date().toISOString()
                    };
                    await this.saveProgress(progress);
                    await this.saveIncremental(workingBlueprints, progress);
                }

                // Add delay to avoid rate limiting
                await this.delay(300);

            } catch (error) {
                // Blueprint doesn't exist or failed, update progress anyway
                processedCount = i + 1;
                if (processedCount % 3 === 0 || processedCount === commonBlueprints.length) {
                    const progress = {
                        processedCount,
                        totalCount: commonBlueprints.length,
                        workingBlueprints: [...workingBlueprints],
                        lastProcessedAt: new Date().toISOString()
                    };
                    await this.saveProgress(progress);
                }
                continue;
            }
        }

        return workingBlueprints;
    }

    async getProvidersForBlueprint(blueprintId) {
        const providers = [];
        
        // Test common provider IDs
        const commonProviders = [1, 3, 5, 7, 8, 9, 10, 12, 15, 16, 29];
        
        for (const providerId of commonProviders) {
            try {
                const response = await this.api.get(
                    `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`
                );
                
                const variants = response.data.variants || [];
                if (variants.length > 0) {
                    // Get provider info
                    const providerInfo = await this.getProviderInfo(providerId);
                    providers.push({
                        id: providerId,
                        title: providerInfo?.title || `Provider ${providerId}`,
                        location: providerInfo?.location?.country || 'Unknown',
                        variantCount: variants.length
                    });
                }
            } catch (error) {
                // Provider not available for this blueprint, skip
                continue;
            }
        }
        
        return providers;
    }

    async getProviderInfo(providerId) {
        try {
            const response = await this.api.get(`/catalog/print_providers/${providerId}.json`);
            return response.data;
        } catch (error) {
            return null;
        }
    }

    categorizeBlueprint(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        
        for (const [category, keywords] of Object.entries(this.categoryMap)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }
        
        return 'other';
    }

    generateUpdatedConfig(workingBlueprints) {
        console.log('\n🔧 GENERATING UPDATED PRODUCT-TYPES.JS CONFIGURATION');
        console.log('='.repeat(60));

        const categorized = {
            apparel: workingBlueprints.filter(b => b.category === 'apparel'),
            home: workingBlueprints.filter(b => b.category === 'home'),
            accessories: workingBlueprints.filter(b => b.category === 'accessories'),
            other: workingBlueprints.filter(b => b.category === 'other')
        };

        console.log('\n📋 RECOMMENDED CONFIGURATIONS:\n');

        // Generate configurations for each category
        this.generateApparelConfig(categorized.apparel);
        this.generateHomeConfig(categorized.home);
        this.generateAccessoriesConfig(categorized.accessories);
        
        console.log('\n💡 USAGE INSTRUCTIONS:');
        console.log('1. Copy the configurations above');
        console.log('2. Replace the corresponding sections in config/product-types.js');
        console.log('3. Test with the integration validator');
        console.log('4. Update vendor IDs in routes/admin-vendor-research.js if needed');
    }

    generateApparelConfig(blueprints) {
        console.log('👕 APPAREL CONFIGURATIONS:');
        console.log('-'.repeat(30));
        
        // Find best t-shirt option
        const tshirts = blueprints.filter(b => 
            b.title.toLowerCase().includes('t-shirt') || 
            b.title.toLowerCase().includes('tee')
        );
        
        if (tshirts.length > 0) {
            const bestTshirt = tshirts[0];
            if (bestTshirt.providers && bestTshirt.providers.length > 0) {
                const provider = bestTshirt.providers[0];
                console.log(`{
  id: 'premium-tshirt',
  name: '${bestTshirt.title}',
  description: '${bestTshirt.description}',
  blueprintId: ${bestTshirt.id},
  printProviderId: ${provider.id}, // ${provider.title}
  // ... rest of configuration
},`);
            }
        }

        // Find hoodie option
        const hoodies = blueprints.filter(b => 
            b.title.toLowerCase().includes('hoodie') || 
            b.title.toLowerCase().includes('sweatshirt')
        );
        
        if (hoodies.length > 0) {
            const bestHoodie = hoodies[0];
            if (bestHoodie.providers && bestHoodie.providers.length > 0) {
                const provider = bestHoodie.providers[0];
                console.log(`{
  id: 'hoodie',
  name: '${bestHoodie.title}',
  description: '${bestHoodie.description}',
  blueprintId: ${bestHoodie.id},
  printProviderId: ${provider.id}, // ${provider.title}
  // ... rest of configuration
},`);
            }
        }

        console.log('');
    }

    generateHomeConfig(blueprints) {
        console.log('🏠 HOME & LIVING CONFIGURATIONS:');
        console.log('-'.repeat(30));
        
        // Find mug option
        const mugs = blueprints.filter(b => 
            b.title.toLowerCase().includes('mug') || 
            b.title.toLowerCase().includes('cup')
        );
        
        if (mugs.length > 0) {
            const bestMug = mugs[0];
            if (bestMug.providers && bestMug.providers.length > 0) {
                const provider = bestMug.providers[0];
                console.log(`{
  id: 'mug',
  name: '${bestMug.title}',
  description: '${bestMug.description}',
  blueprintId: ${bestMug.id},
  printProviderId: ${provider.id}, // ${provider.title}
  // ... rest of configuration
},`);
            }
        }

        // Find poster option
        const posters = blueprints.filter(b => 
            b.title.toLowerCase().includes('poster') || 
            b.title.toLowerCase().includes('print')
        );
        
        if (posters.length > 0) {
            const bestPoster = posters[0];
            if (bestPoster.providers && bestPoster.providers.length > 0) {
                const provider = bestPoster.providers[0];
                console.log(`{
  id: 'poster',
  name: '${bestPoster.title}',
  description: '${bestPoster.description}',
  blueprintId: ${bestPoster.id},
  printProviderId: ${provider.id}, // ${provider.title}
  // ... rest of configuration
},`);
            }
        }

        console.log('');
    }

    generateAccessoriesConfig(blueprints) {
        console.log('🎒 ACCESSORIES CONFIGURATIONS:');
        console.log('-'.repeat(30));
        
        // Find bag option
        const bags = blueprints.filter(b => 
            b.title.toLowerCase().includes('bag') || 
            b.title.toLowerCase().includes('tote')
        );
        
        if (bags.length > 0) {
            const bestBag = bags[0];
            if (bestBag.providers && bestBag.providers.length > 0) {
                const provider = bestBag.providers[0];
                console.log(`{
  id: 'tote-bag',
  name: '${bestBag.title}',
  description: '${bestBag.description}',
  blueprintId: ${bestBag.id},
  printProviderId: ${provider.id}, // ${provider.title}
  // ... rest of configuration
},`);
            }
        }

        console.log('');
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Save discovered blueprints to JSON file
     */
    async saveResults(workingBlueprints) {
        const data = {
            discoveredAt: new Date().toISOString(),
            totalBlueprints: workingBlueprints.length,
            categories: this.categoryMap,
            workingConfigurations: workingBlueprints,
            metadata: {
                apiVersion: 'v1',
                toolVersion: '1.0.0',
                note: 'Generated by discover-printify-blueprints.js - Use this data to update product-types.js configurations'
            }
        };

        try {
            fs.writeFileSync(this.outputFile, JSON.stringify(data, null, 2));
            console.log(`\n💾 Results saved to: ${this.outputFile}`);
            console.log(`📊 Summary: ${workingBlueprints.length} blueprints across ${Object.keys(this.categoryMap).length} categories`);
        } catch (error) {
            console.error(`❌ Failed to save results: ${error.message}`);
        }
    }

    async run() {
        console.log('🚀 PRINTIFY BLUEPRINT DISCOVERY');
        console.log('===============================\n');
        
        try {
            const workingBlueprints = await this.discoverBlueprints();
            
            console.log(`\n📊 DISCOVERY SUMMARY:`);
            console.log(`   Found ${workingBlueprints.length} working blueprints`);
            console.log(`   Categories: ${Object.keys(this.categoryMap).join(', ')}`);
            
            // Save final results to JSON file
            await this.saveResults(workingBlueprints);
            
            // Clean up progress file since we're done
            if (fs.existsSync(this.progressFile)) {
                fs.unlinkSync(this.progressFile);
                console.log('🧹 Cleaned up progress file');
            }
            
            this.generateUpdatedConfig(workingBlueprints);
            
        } catch (error) {
            console.error('❌ Discovery failed:', error.message);
            console.log('💾 Progress has been saved - you can resume by running the script again');
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const forceReset = args.includes('--reset') || args.includes('--fresh');
    
    const discovery = new PrintifyBlueprintDiscovery();
    
    // Clear progress if reset requested
    if (forceReset) {
        console.log('🔄 Starting fresh discovery (--reset flag detected)');
        if (fs.existsSync(discovery.progressFile)) {
            fs.unlinkSync(discovery.progressFile);
        }
        if (fs.existsSync(discovery.outputFile)) {
            fs.unlinkSync(discovery.outputFile);
        }
    }
    
    await discovery.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PrintifyBlueprintDiscovery;