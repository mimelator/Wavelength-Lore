// Backend API endpoint for Printify variant pricing
// This implements the exact pattern from your working example

const express = require('express');
const https = require('https');
require('dotenv').config();

const router = express.Router();

// Configuration from your example
const PRINTIFY_API_URL = "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const USD_CONVERSION_FACTOR = 100;

/**
 * Executes a GET request to the Printify API using native Node.js https
 */
async function printifyFetch(endpoint) {
    const url = new URL(`${PRINTIFY_API_URL}${endpoint}`);
    
    if (!API_TOKEN) {
        throw new Error("Printify API token not found in environment variables.");
    }
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`, 
                'User-Agent': 'Wavelength-Store/1.0 (Node.js)',
                'Accept': 'application/json'
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } else {
                        reject(new Error(`API Error: ${res.statusCode} ${res.statusMessage} - ${data}`));
                    }
                } catch (parseError) {
                    reject(new Error(`JSON Parse Error: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request Error: ${error.message}`));
        });

        req.end();
    });
}

/**
 * Get blueprint variants and their costs (from your example)
 * GET /api/printify/variants/:blueprintId/:providerId
 */
router.get('/variants/:blueprintId/:providerId', async (req, res) => {
    const { blueprintId, providerId } = req.params;
    
    try {
        console.log(`🌐 Fetching Printify variants for Blueprint ${blueprintId}, Provider ${providerId}`);
        
        // This matches your example's endpoint exactly
        const endpoint = `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`;
        const data = await printifyFetch(endpoint);
        
        console.log(`✅ Got ${data.variants?.length || 0} variants from Printify`);
        
        // Process variants like your example
        const dynamicPricing = data.variants.map(variant => ({
            variant_id: variant.id,
            size: variant.options.find(opt => opt.name === 'Size')?.values[0]?.name || 'N/A',
            color: variant.options.find(opt => opt.name === 'Color')?.values[0]?.name || 'N/A',
            // Price is in CENTS from Printify
            printify_cost_usd: (variant.price / USD_CONVERSION_FACTOR).toFixed(2),
            price: variant.price, // Keep raw price for frontend calculations
            sku: variant.sku 
        }));
        
        res.json({
            success: true,
            blueprintId: parseInt(blueprintId),
            providerId: parseInt(providerId),
            variants: data.variants, // Raw data for frontend
            pricing: dynamicPricing, // Processed data
            total_variants: dynamicPricing.length
        });
        
    } catch (error) {
        console.error(`❌ Printify API error for Blueprint ${blueprintId}:`, error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            blueprintId: parseInt(blueprintId),
            providerId: parseInt(providerId)
        });
    }
});

/**
 * Get all blueprints (from your example)
 * GET /api/printify/blueprints
 */
router.get('/blueprints', async (req, res) => {
    try {
        console.log('🌐 Fetching all Printify blueprints');
        
        const blueprints = await printifyFetch('/catalog/blueprints.json');
        
        console.log(`✅ Got ${blueprints.length} blueprints from Printify`);
        
        res.json({
            success: true,
            blueprints: blueprints,
            total: blueprints.length
        });
        
    } catch (error) {
        console.error('❌ Printify blueprints API error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get print providers for a blueprint
 * GET /api/printify/blueprint/:blueprintId/providers
 */
router.get('/blueprint/:blueprintId/providers', async (req, res) => {
    const { blueprintId } = req.params;
    
    try {
        console.log(`🌐 Fetching providers for Blueprint ${blueprintId}`);
        
        const endpoint = `/catalog/blueprints/${blueprintId}/print_providers.json`;
        const data = await printifyFetch(endpoint);
        
        console.log(`✅ Got ${data.length} providers for Blueprint ${blueprintId}`);
        
        res.json({
            success: true,
            blueprintId: parseInt(blueprintId),
            providers: data,
            total: data.length
        });
        
    } catch (error) {
        console.error(`❌ Printify providers API error for Blueprint ${blueprintId}:`, error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            blueprintId: parseInt(blueprintId)
        });
    }
});

module.exports = router;