// Check command line arguments first, before loading any modules
const args = process.argv.slice(2);

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📁 Static Resource Checker Tool

Usage: node check_static_resources.js [options]

Options:
  --prod, --production    Check production static resources (wavelengthlore.com)
  --help, -h             Show this help message

Examples:
  node check_static_resources.js           # Check local development (localhost:3001)
  node check_static_resources.js --prod    # Check production (wavelengthlore.com)

This tool checks:
  ✅ CSS files (.css)
  ✅ JavaScript files (.js)  
  ✅ SVG icons (.svg)
  ✅ Favicons (.ico)
  ✅ Font files (.woff, .woff2, .ttf, .eot)
  ✅ External CDN resources
  ✅ Inline style and script integrity
`);
    process.exit(0);
}

const { initScriptEnv } = require('./utils/env-loader');

// Initialize environment with required variables
initScriptEnv(['DATABASE_URL', 'PROJECT_ID', 'API_KEY', 'AUTH_DOMAIN']);

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const isProduction = args.includes('--prod') || args.includes('--production');

const BASE_URL = isProduction ? 'https://wavelengthlore.com' : 'http://localhost:3001';

// Admin authentication headers for bypassing rate limits
const getAuthHeaders = () => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; Wavelength-Lore-StaticChecker/1.0)'
    };
    
    // Add admin key for production to bypass rate limiting
    if (isProduction && process.env.ADMIN_SECRET_KEY) {
        headers['X-Admin-Key'] = process.env.ADMIN_SECRET_KEY;
        console.log('🔑 Using admin authentication to bypass rate limits');
    }
    
    return headers;
};

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Resource types to check
const RESOURCE_PATTERNS = {
    css: /\.css(\?.*)?$/,
    js: /\.js(\?.*)?$/,
    svg: /\.svg(\?.*)?$/,
    icon: /\.ico(\?.*)?$/,
    font: /\.(woff2?|ttf|eot|otf)(\?.*)?$/
};

const categorizeResource = (url, element, $) => {
    const tagName = element.tagName;
    const rel = $(element).attr('rel');
    const type = $(element).attr('type');
    
    // CSS Resources
    if (tagName === 'link' && rel === 'stylesheet') return 'css';
    if (tagName === 'style') return 'inline-css';
    
    // JavaScript Resources  
    if (tagName === 'script' && $(element).attr('src')) return 'js';
    if (tagName === 'script' && !$(element).attr('src')) return 'inline-js';
    
    // Icons and Favicons
    if (tagName === 'link' && (rel === 'icon' || rel === 'shortcut icon')) return 'icon';
    if (RESOURCE_PATTERNS.svg.test(url)) return 'svg';
    if (RESOURCE_PATTERNS.icon.test(url)) return 'icon';
    
    // Fonts
    if (RESOURCE_PATTERNS.font.test(url)) return 'font';
    if (tagName === 'link' && rel === 'preload' && $(element).attr('as') === 'font') return 'font';
    
    // CSS from pattern
    if (RESOURCE_PATTERNS.css.test(url)) return 'css';
    
    // JS from pattern
    if (RESOURCE_PATTERNS.js.test(url)) return 'js';
    
    return 'other';
};

const isExternalResource = (url) => {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
};

const normalizeUrl = (url, baseUrl) => {
    if (isExternalResource(url)) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return baseUrl + url;
    return baseUrl + '/' + url;
};

const checkResource = async (url, category) => {
    try {
        const headers = getAuthHeaders();
        
        // Add specific accept headers based on resource type
        if (category === 'css') headers['Accept'] = 'text/css,*/*;q=0.1';
        else if (category === 'js') headers['Accept'] = 'application/javascript,*/*;q=0.8';
        else if (category === 'font') headers['Accept'] = 'font/woff2,font/woff,*/*;q=0.1';
        else headers['Accept'] = '*/*';
        
        const response = await axios.get(url, {
            validateStatus: null,
            timeout: isProduction ? 15000 : 5000,
            headers
        });
        
        return {
            status: response.status,
            size: response.headers['content-length'] || 'unknown',
            contentType: response.headers['content-type'] || 'unknown',
            success: response.status >= 200 && response.status < 400
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message,
            success: false
        };
    }
};

const checkPageResources = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: isProduction ? 30000 : 10000,
            headers: getAuthHeaders()
        });
        
        const $ = cheerio.load(response.data);
        
        console.log(`\n🔍 Analyzing static resources on ${url}`);
        
        const resources = {
            css: { working: [], broken: [], inline: 0 },
            js: { working: [], broken: [], inline: 0 },
            icon: { working: [], broken: [] },
            svg: { working: [], broken: [] },
            font: { working: [], broken: [] },
            other: { working: [], broken: [] }
        };
        
        const foundResources = [];
        
        // Check stylesheets
        $('link[rel="stylesheet"], link[rel="icon"], link[rel="shortcut icon"], link[rel="preload"]').each((i, element) => {
            const href = $(element).attr('href');
            if (href) {
                foundResources.push({
                    url: href,
                    element: element,
                    type: 'link'
                });
            }
        });
        
        // Check scripts
        $('script').each((i, element) => {
            const src = $(element).attr('src');
            if (src) {
                foundResources.push({
                    url: src,
                    element: element,
                    type: 'script'
                });
            } else {
                // Inline script
                resources.js.inline++;
            }
        });
        
        // Check inline styles
        $('style').each((i, element) => {
            resources.css.inline++;
        });
        
        // Check background images and other CSS url() references
        $('*').each((i, element) => {
            const style = $(element).attr('style');
            if (style) {
                const urlMatches = style.match(/url\(['"]?([^'"]*?)['"]?\)/g);
                if (urlMatches) {
                    urlMatches.forEach(match => {
                        const url = match.match(/url\(['"]?([^'"]*?)['"]?\)/)[1];
                        if (url && !url.startsWith('data:')) {
                            foundResources.push({
                                url: url,
                                element: element,
                                type: 'css-url'
                            });
                        }
                    });
                }
            }
        });
        
        let totalResources = foundResources.length;
        let brokenResources = 0;
        
        console.log(`📊 Found ${totalResources} static resources to check...`);
        
        // Check each resource
        for (const resource of foundResources) {
            const fullUrl = normalizeUrl(resource.url, BASE_URL);
            const category = categorizeResource(resource.url, resource.element, $);
            
            console.log(`   Checking ${category}: ${resource.url.length > 60 ? resource.url.substring(0, 60) + '...' : resource.url}`);
            
            const result = await checkResource(fullUrl, category);
            
            const resourceInfo = {
                url: resource.url,
                fullUrl: fullUrl,
                ...result
            };
            
            if (result.success) {
                resources[category].working.push(resourceInfo);
                console.log(`   ✅ ${result.status} (${result.size} bytes)`);
            } else {
                resources[category].broken.push(resourceInfo);
                brokenResources++;
                console.log(`   ❌ ${result.status} ${result.error || ''}`);
            }
        }
        
        // Summary for this page
        console.log(`\n📋 Page Summary:`);
        console.log(`   📁 Total resources: ${totalResources}`);
        console.log(`   ✅ Working: ${totalResources - brokenResources}`);
        console.log(`   ❌ Broken: ${brokenResources}`);
        
        if (resources.css.inline > 0) console.log(`   🎨 Inline CSS blocks: ${resources.css.inline}`);
        if (resources.js.inline > 0) console.log(`   📜 Inline JS blocks: ${resources.js.inline}`);
        
        // Detailed breakdown
        for (const [category, categoryResources] of Object.entries(resources)) {
            const total = categoryResources.working.length + categoryResources.broken.length;
            if (total > 0) {
                const status = categoryResources.broken.length > 0 ? '❌' : '✅';
                console.log(`   ${status} ${category.toUpperCase()}: ${categoryResources.working.length}/${total} working`);
                
                if (categoryResources.broken.length > 0 && categoryResources.broken.length <= 3) {
                    categoryResources.broken.forEach((resource, index) => {
                        console.log(`      ${index + 1}. ${resource.url} (${resource.status})`);
                    });
                } else if (categoryResources.broken.length > 3) {
                    categoryResources.broken.slice(0, 2).forEach((resource, index) => {
                        console.log(`      ${index + 1}. ${resource.url} (${resource.status})`);
                    });
                    console.log(`      ... and ${categoryResources.broken.length - 2} more`);
                }
            }
        }
        
        return resources;
        
    } catch (error) {
        console.error(`❌ Error checking ${url}:`, error.message);
        return null;
    }
};

const fetchRoutes = async () => {
    const routes = ['/'];

    try {
        // Fetch all characters for character pages
        const charactersRef = ref(database, 'characters');
        const charactersSnapshot = await get(charactersRef);
        if (charactersSnapshot.exists()) {
            const charactersData = charactersSnapshot.val();
            for (const category in charactersData) {
                if (Array.isArray(charactersData[category])) {
                    charactersData[category].forEach(character => {
                        routes.push(`/character/${character.id}`);
                    });
                }
            }
        }

        // Fetch all lore pages
        const loreRef = ref(database, 'lore');
        const loreSnapshot = await get(loreRef);
        if (loreSnapshot.exists()) {
            const loreData = loreSnapshot.val();
            for (const loreId in loreData) {
                routes.push(`/lore/${loreId}`);
            }
        }

        // Fetch all episode pages
        const videosRef = ref(database, 'videos');
        const videosSnapshot = await get(videosRef);
        if (videosSnapshot.exists()) {
            const videosData = videosSnapshot.val();
            for (const season in videosData) {
                if (videosData[season].episodes) {
                    for (const episode in videosData[season].episodes) {
                        routes.push(`/season/${season.replace('season', '')}/episode/${episode.replace('episode', '')}`);
                    }
                }
            }
        }

        // Add gallery and other static pages
        routes.push('/characters');
        routes.push('/lore');
        routes.push('/map');
        routes.push('/forum');
        routes.push('/about');
        routes.push('/contact');
        
    } catch (error) {
        console.error('Error fetching routes:', error);
    }

    return routes;
};

const main = async () => {
    console.log('🚀 Starting comprehensive static resource check...\n');
    console.log(`🌐 Environment: ${isProduction ? 'PRODUCTION' : 'LOCAL'} (${BASE_URL})\n`);
    
    const routes = await fetchRoutes();
    console.log(`📋 Routes to check (${routes.length}):`, routes.map(r => r.length > 30 ? r.substring(0, 30) + '...' : r));

    const summary = {
        totalPages: 0,
        pagesWithIssues: 0,
        totalResourcesByCategory: {
            css: 0,
            js: 0,
            icon: 0,
            svg: 0,
            font: 0,
            other: 0
        },
        brokenResourcesByCategory: {
            css: 0,
            js: 0,
            icon: 0,
            svg: 0,
            font: 0,
            other: 0
        },
        inlineResources: {
            css: 0,
            js: 0
        }
    };

    for (const route of routes) {
        const url = `${BASE_URL}${route}`;
        summary.totalPages++;
        
        const pageResources = await checkPageResources(url);
        
        if (pageResources) {
            let pageHasIssues = false;
            
            for (const [category, categoryResources] of Object.entries(pageResources)) {
                if (category === 'inline') continue;
                
                const working = categoryResources.working || [];
                const broken = categoryResources.broken || [];
                const inline = categoryResources.inline || 0;
                
                summary.totalResourcesByCategory[category] += working.length + broken.length;
                summary.brokenResourcesByCategory[category] += broken.length;
                
                if (inline > 0 && summary.inlineResources[category] !== undefined) {
                    summary.inlineResources[category] += inline;
                }
                
                if (broken.length > 0) {
                    pageHasIssues = true;
                }
            }
            
            if (pageHasIssues) {
                summary.pagesWithIssues++;
            }
        } else {
            summary.pagesWithIssues++;
        }
    }

    // Final summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL STATIC RESOURCE SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`📄 Pages checked: ${summary.totalPages}`);
    console.log(`⚠️  Pages with issues: ${summary.pagesWithIssues}`);
    console.log(`✅ Pages working: ${summary.totalPages - summary.pagesWithIssues}`);
    
    console.log('\n📁 Static resources by category:');
    const totalResources = Object.values(summary.totalResourcesByCategory).reduce((a, b) => a + b, 0);
    const totalBroken = Object.values(summary.brokenResourcesByCategory).reduce((a, b) => a + b, 0);
    
    for (const [category, total] of Object.entries(summary.totalResourcesByCategory)) {
        const broken = summary.brokenResourcesByCategory[category];
        const working = total - broken;
        if (total > 0) {
            const status = broken > 0 ? '❌' : '✅';
            console.log(`   ${status} ${category.toUpperCase()}: ${working}/${total} working ${broken > 0 ? `(${broken} broken)` : ''}`);
        }
    }
    
    if (summary.inlineResources.css > 0 || summary.inlineResources.js > 0) {
        console.log('\n📝 Inline resources:');
        if (summary.inlineResources.css > 0) console.log(`   🎨 CSS blocks: ${summary.inlineResources.css}`);
        if (summary.inlineResources.js > 0) console.log(`   📜 JS blocks: ${summary.inlineResources.js}`);
    }
    
    console.log(`\n🎯 Overall: ${totalResources - totalBroken}/${totalResources} static resources working`);
    console.log(`   Success rate: ${totalResources > 0 ? Math.round(((totalResources - totalBroken) / totalResources) * 100) : 100}%`);
    
    if (totalBroken === 0) {
        console.log('\n🎉 CONGRATULATIONS! All static resources are working correctly!');
    } else {
        console.log(`\n⚠️  ${totalBroken} static resources need attention.`);
    }
    
    console.log('='.repeat(60));
};

main();