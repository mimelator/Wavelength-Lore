// Check command line arguments first, before loading any modules
const args = process.argv.slice(2);

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔗 Route Link Checker Tool

Usage: node check_route_links.js [options]

Options:
  --prod, --production    Check production routes (wavelengthlore.com)
  --help, -h             Show this help message

Examples:
  node check_route_links.js           # Check local development (localhost:3001)
  node check_route_links.js --prod    # Check production (wavelengthlore.com)

This tool checks:
  ✅ Internal links in EJS views and partials
  ✅ Form action targets  
  ✅ JavaScript location redirects
  ✅ Dynamic route parameters (character/{id}, lore/{id}, etc.)
  ✅ Forum navigation links
  ✅ Static page links (about, contact, map, etc.)
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
        'User-Agent': 'Mozilla/5.0 (compatible; Wavelength-Lore-RouteChecker/1.0)'
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

// Define known routes based on the application structure
const KNOWN_STATIC_ROUTES = [
    '/',
    '/characters',
    '/lore', 
    '/about',
    '/contact',
    '/map',
    '/forum',
    '/forum/recent',
    '/forum/popular', 
    '/forum/search',
    '/forum/create',
    '/forum/guidelines',
    '/forum/help',
    '/forum/firebase-test',
    '/sitemap.xml',
    '/robots.txt',
    '/cache-management',
    '/test-modal'
];

// Forum category routes
const FORUM_CATEGORIES = ['general', 'lore', 'episodes', 'fanart'];

const isInternalRoute = (url) => {
    if (!url) return false;
    
    // Skip external URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
        if (!url.includes('wavelengthlore.com') && !url.includes('localhost:3001')) {
            return false;
        }
    }
    
    // Skip anchors, mailto, tel, javascript
    if (url.startsWith('#') || url.startsWith('mailto:') || 
        url.startsWith('tel:') || url.startsWith('javascript:')) {
        return false;
    }
    
    // Skip static assets
    if (url.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/)) {
        return false;
    }
    
    return true;
};

const normalizeRoute = (url) => {
    if (!url) return null;
    
    // Extract just the path part
    let route = url;
    
    // Remove query parameters and fragments
    route = route.split('?')[0].split('#')[0];
    
    // Remove domain if present
    if (route.includes('wavelengthlore.com')) {
        route = route.split('wavelengthlore.com')[1];
    }
    if (route.includes('localhost:3001')) {
        route = route.split('localhost:3001')[1];
    }
    
    // Ensure starts with /
    if (!route.startsWith('/')) {
        route = '/' + route;
    }
    
    return route;
};

const extractRoutePattern = (route) => {
    // Convert dynamic routes to patterns
    const patterns = {
        character: /^\/character\/([^\/]+)$/,
        lore: /^\/lore\/([^\/]+)$/,
        episode: /^\/season\/(\d+)\/episode\/(\d+)$/,
        forumCategory: /^\/forum\/category\/([^\/]+)$/,
        forumPost: /^\/forum\/post\/([^\/]+)$/
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(route)) {
            return { type, matches: route.match(pattern) };
        }
    }
    
    return null;
};

const checkRouteExists = async (route) => {
    try {
        const url = `${BASE_URL}${route}`;
        const response = await axios.get(url, {
            validateStatus: null,
            timeout: isProduction ? 15000 : 5000,
            headers: getAuthHeaders()
        });

        // 401/403 means route exists but requires auth - that's valid
        const isAuthRequired = response.status === 401 || response.status === 403;
        const isSuccess = response.status >= 200 && response.status < 400;

        return {
            status: response.status,
            exists: isSuccess || isAuthRequired,
            authRequired: isAuthRequired,
            redirect: response.status >= 300 && response.status < 400 ? response.headers.location : null
        };
    } catch (error) {
        return {
            status: 'error',
            exists: false,
            error: error.message
        };
    }
};

const scanFileForRoutes = async (filePath) => {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const routes = new Set();
        
        // Match href attributes, but skip template variables
        const hrefMatches = content.match(/href=["']([^"']+)["']/g);
        if (hrefMatches) {
            hrefMatches.forEach(match => {
                const url = match.match(/href=["']([^"']+)["']/)[1];
                
                // Skip EJS template variables and expressions
                if (url.includes('<%') || url.includes('%>') || 
                    url.includes('${') || url.startsWith('<%=')) {
                    return;
                }
                
                if (isInternalRoute(url)) {
                    const normalized = normalizeRoute(url);
                    if (normalized) routes.add(normalized);
                }
            });
        }
        
        // Match action attributes in forms
        const actionMatches = content.match(/action=["']([^"']+)["']/g);
        if (actionMatches) {
            actionMatches.forEach(match => {
                const url = match.match(/action=["']([^"']+)["']/)[1];
                
                // Skip template variables
                if (url.includes('<%') || url.includes('%>') || 
                    url.includes('${') || url.startsWith('<%=')) {
                    return;
                }
                
                if (isInternalRoute(url)) {
                    const normalized = normalizeRoute(url);
                    if (normalized) routes.add(normalized);
                }
            });
        }
        
        // Match JavaScript location changes
        const locationMatches = content.match(/(window\.location|location\.href)\s*=\s*["']([^"']+)["']/g);
        if (locationMatches) {
            locationMatches.forEach(match => {
                const url = match.match(/["']([^"']+)["']/)[1];
                
                // Skip template variables
                if (url.includes('<%') || url.includes('%>') || 
                    url.includes('${') || url.startsWith('<%=')) {
                    return;
                }
                
                if (isInternalRoute(url)) {
                    const normalized = normalizeRoute(url);
                    if (normalized) routes.add(normalized);
                }
            });
        }
        
        return Array.from(routes);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return [];
    }
};

const getValidDynamicIds = async () => {
    const validIds = {
        characters: new Set(),
        lore: new Set(),
        episodes: new Set(),
        forumCategories: new Set(FORUM_CATEGORIES)
    };
    
    try {
        // Get character IDs
        const charactersRef = ref(database, 'characters');
        const charactersSnapshot = await get(charactersRef);
        if (charactersSnapshot.exists()) {
            const charactersData = charactersSnapshot.val();
            for (const category in charactersData) {
                if (Array.isArray(charactersData[category])) {
                    charactersData[category].forEach(character => {
                        validIds.characters.add(character.id);
                    });
                }
            }
        }
        
        // Get lore IDs
        const loreRef = ref(database, 'lore');
        const loreSnapshot = await get(loreRef);
        if (loreSnapshot.exists()) {
            const loreData = loreSnapshot.val();
            for (const loreId in loreData) {
                validIds.lore.add(loreId);
            }
        }
        
        // Get episode data
        const videosRef = ref(database, 'videos');
        const videosSnapshot = await get(videosRef);
        if (videosSnapshot.exists()) {
            const videosData = videosSnapshot.val();
            for (const season in videosData) {
                if (videosData[season].episodes) {
                    const seasonNumber = season.replace('season', '');
                    for (const episode in videosData[season].episodes) {
                        const episodeNumber = episode.replace('episode', '');
                        validIds.episodes.add(`${seasonNumber}/${episodeNumber}`);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error fetching valid IDs:', error);
    }
    
    return validIds;
};

const validateDynamicRoute = (route, validIds) => {
    const pattern = extractRoutePattern(route);
    
    if (!pattern) return { valid: true, reason: 'static route' };
    
    switch (pattern.type) {
        case 'character':
            const characterId = pattern.matches[1];
            return {
                valid: validIds.characters.has(characterId),
                reason: validIds.characters.has(characterId) ? 'valid character ID' : `character ID '${characterId}' not found in database`
            };
            
        case 'lore':
            const loreId = pattern.matches[1];
            return {
                valid: validIds.lore.has(loreId),
                reason: validIds.lore.has(loreId) ? 'valid lore ID' : `lore ID '${loreId}' not found in database`
            };
            
        case 'episode':
            const seasonNum = pattern.matches[1];
            const episodeNum = pattern.matches[2];
            const episodeKey = `${seasonNum}/${episodeNum}`;
            return {
                valid: validIds.episodes.has(episodeKey),
                reason: validIds.episodes.has(episodeKey) ? 'valid episode' : `episode S${seasonNum}E${episodeNum} not found in database`
            };
            
        case 'forumCategory':
            const categoryId = pattern.matches[1];
            return {
                valid: validIds.forumCategories.has(categoryId),
                reason: validIds.forumCategories.has(categoryId) ? 'valid forum category' : `forum category '${categoryId}' not found`
            };
            
        case 'forumPost':
            return {
                valid: true,
                reason: 'forum post - cannot validate without checking database'
            };
            
        default:
            return { valid: false, reason: 'unknown dynamic route pattern' };
    }
};

const main = async () => {
    console.log('🚀 Starting comprehensive route link check...\n');
    console.log(`🌐 Environment: ${isProduction ? 'PRODUCTION' : 'LOCAL'} (${BASE_URL})\n`);
    
    // Get valid dynamic IDs from database
    console.log('📊 Loading valid IDs from database...');
    const validIds = await getValidDynamicIds();
    console.log(`   Characters: ${validIds.characters.size}`);
    console.log(`   Lore items: ${validIds.lore.size}`);
    console.log(`   Episodes: ${validIds.episodes.size}`);
    console.log(`   Forum categories: ${validIds.forumCategories.size}\n`);
    
    // Scan all EJS files
    const viewsDir = path.join(__dirname, '../views');
    const allRoutes = new Set();
    const fileRoutes = {};
    
    const scanDirectory = async (dir) => {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            
            if (stat.isDirectory()) {
                await scanDirectory(filePath);
            } else if (file.endsWith('.ejs')) {
                const routes = await scanFileForRoutes(filePath);
                const relativePath = path.relative(path.join(__dirname, '..'), filePath);
                fileRoutes[relativePath] = routes;
                routes.forEach(route => allRoutes.add(route));
            }
        }
    };
    
    console.log('🔍 Scanning EJS files for route links...');
    await scanDirectory(viewsDir);
    
    const totalRoutes = allRoutes.size;
    console.log(`📋 Found ${totalRoutes} unique routes across ${Object.keys(fileRoutes).length} EJS files\n`);
    
    // Categorize routes
    const routeCategories = {
        static: [],
        dynamic: [],
        broken: [],
        redirects: [],
        authRequired: []
    };
    
    const routeDetails = {};
    
    console.log('🧪 Testing routes...');
    
    for (const route of Array.from(allRoutes).sort()) {
        console.log(`   Checking: ${route}`);
        
        // First check if it's a known static route or validate dynamic route
        if (KNOWN_STATIC_ROUTES.includes(route) || route.startsWith('/forum/category/')) {
            routeCategories.static.push(route);
            routeDetails[route] = { type: 'static', valid: true };
        } else {
            const validation = validateDynamicRoute(route, validIds);
            routeDetails[route] = { type: 'dynamic', ...validation };
            
            if (validation.valid) {
                routeCategories.dynamic.push(route);
            } else {
                routeCategories.broken.push(route);
                console.log(`     ❌ ${validation.reason}`);
                continue;
            }
        }
        
        // Test the actual route
        const result = await checkRouteExists(route);
        routeDetails[route].testResult = result;

        if (!result.exists) {
            if (!routeCategories.broken.includes(route)) {
                routeCategories.broken.push(route);
            }
            console.log(`     ❌ ${result.status} ${result.error || ''}`);
        } else if (result.authRequired) {
            routeCategories.authRequired.push(route);
            console.log(`     🔒 ${result.status} (auth required)`);
        } else if (result.redirect) {
            routeCategories.redirects.push(route);
            console.log(`     🔄 ${result.status} → ${result.redirect}`);
        } else {
            console.log(`     ✅ ${result.status}`);
        }
    }
    
    // Report broken routes by file
    console.log('\n' + '='.repeat(60));
    console.log('📊 ROUTE LINK ANALYSIS REPORT');
    console.log('='.repeat(60));
    
    console.log(`📄 Total routes found: ${totalRoutes}`);
    console.log(`✅ Static routes: ${routeCategories.static.length}`);
    console.log(`🔗 Dynamic routes: ${routeCategories.dynamic.length}`);
    console.log(`🔄 Redirects: ${routeCategories.redirects.length}`);
    console.log(`🔒 Auth-required routes: ${routeCategories.authRequired.length}`);
    console.log(`❌ Broken routes: ${routeCategories.broken.length}`);
    
    if (routeCategories.broken.length > 0) {
        console.log('\n🚨 BROKEN ROUTES FOUND:');
        routeCategories.broken.forEach(route => {
            const details = routeDetails[route];
            console.log(`❌ ${route}`);
            if (details.reason && details.reason !== 'static route') {
                console.log(`   Reason: ${details.reason}`);
            }
            if (details.testResult && !details.testResult.exists) {
                console.log(`   HTTP Status: ${details.testResult.status}`);
                if (details.testResult.error) {
                    console.log(`   Error: ${details.testResult.error}`);
                }
            }
            
            // Show which files contain this broken route
            console.log(`   Found in:`);
            for (const [filePath, routes] of Object.entries(fileRoutes)) {
                if (routes.includes(route)) {
                    console.log(`     - ${filePath}`);
                }
            }
            console.log('');
        });
    }
    
    if (routeCategories.authRequired.length > 0) {
        console.log('\n🔒 AUTH-REQUIRED ROUTES:');
        routeCategories.authRequired.forEach(route => {
            const details = routeDetails[route];
            console.log(`🔒 ${route} (HTTP ${details.testResult.status})`);
        });
    }

    if (routeCategories.redirects.length > 0) {
        console.log('\n🔄 REDIRECTS FOUND:');
        routeCategories.redirects.forEach(route => {
            const details = routeDetails[route];
            console.log(`🔄 ${route} → ${details.testResult.redirect}`);
        });
    }
    
    // Success summary
    const workingRoutes = totalRoutes - routeCategories.broken.length;
    const successRate = totalRoutes > 0 ? Math.round((workingRoutes / totalRoutes) * 100) : 100;
    
    console.log(`\n🎯 Overall: ${workingRoutes}/${totalRoutes} routes working`);
    console.log(`   Success rate: ${successRate}%`);
    
    if (routeCategories.broken.length === 0) {
        console.log('\n🎉 CONGRATULATIONS! All route links are working correctly!');
    } else {
        console.log(`\n⚠️  ${routeCategories.broken.length} route links need attention.`);
    }
    
    console.log('='.repeat(60));
};

main();