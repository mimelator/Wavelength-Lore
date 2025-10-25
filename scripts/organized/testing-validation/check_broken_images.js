const { initScriptEnv } = require('./utils/env-loader');

// Initialize environment with required variables
initScriptEnv(['DATABASE_URL', 'PROJECT_ID', 'API_KEY', 'AUTH_DOMAIN']);

const axios = require('axios');
const cheerio = require('cheerio');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Check command line arguments for production flag
const args = process.argv.slice(2);
const isProduction = args.includes('--prod') || args.includes('--production');
const checkModals = args.includes('--modals') || args.includes('--modal');
const modalOnly = args.includes('--modal-only');

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 Image Checker Tool

Usage: node check_broken_images.js [options]

Options:
  --prod, --production    Check production images (wavelengthlore.com)
  --modals, --modal      Also check modal dialog images (disambiguation)
  --modal-only           Check ONLY modal dialog images
  --help, -h             Show this help message

Examples:
  node check_broken_images.js           # Check local development (localhost:3001)
  node check_broken_images.js --prod    # Check production (wavelengthlore.com)
  node check_broken_images.js --modals  # Check regular + modal images
  node check_broken_images.js --modal-only # Check only modal images

Modal Image Testing:
  Tests images that appear in disambiguation modals (e.g., map location modals)
  by fetching all character, lore, and episode data and validating their image URLs
`);
    process.exit(0);
}

const BASE_URL = isProduction ? 'https://wavelengthlore.com' : 'http://localhost:3001';

// Admin authentication headers for bypassing rate limits
const getAuthHeaders = () => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; Wavelength-Lore-ImageChecker/1.0)'
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
    databaseURL: process.env.DATABASE_URL, // Ensure this is included
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const fetchRoutes = async () => {
    const routes = ['/'];

    try {
        // Fetch all characters
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

        // Fetch all lore
        const loreRef = ref(database, 'lore');
        const loreSnapshot = await get(loreRef);
        if (loreSnapshot.exists()) {
            const loreData = loreSnapshot.val();
            for (const loreId in loreData) {
                routes.push(`/lore/${loreId}`);
            }
        }

        // Fetch all episodes
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

        // Add gallery pages
        routes.push('/characters');
        routes.push('/lore');
        
        // Add map page if we're checking modals
        if (checkModals || modalOnly) {
            routes.push('/map');
        }
        
    } catch (error) {
        console.error('Error fetching routes:', error);
    }

    return routes;
};

/**
 * Check modal dialog images by fetching content data and testing their image URLs
 */
const checkModalImages = async () => {
    console.log('\n🎭 Checking Modal Dialog Images...\n');
    
    const modalResults = {
        character: { broken: [], working: [] },
        lore: { broken: [], working: [] },
        episode: { broken: [], working: [] }
    };
    
    let totalModalImages = 0;
    let totalModalBroken = 0;
    
    try {
        // Fetch all character data and check their images
        console.log('🔍 Checking character images for modal dialogs...');
        const charactersRef = ref(database, 'characters');
        const charactersSnapshot = await get(charactersRef);
        if (charactersSnapshot.exists()) {
            const charactersData = charactersSnapshot.val();
            
            for (const characterId in charactersData) {
                const character = charactersData[characterId];
                if (character && character.image) {
                    totalModalImages++;
                    const imageUrl = character.image.startsWith('http') ? character.image : `${BASE_URL}${character.image}`;
                    
                    try {
                        const imgResponse = await axios.get(imageUrl, {
                            validateStatus: null,
                            timeout: isProduction ? 15000 : 5000,
                            headers: getAuthHeaders()
                        });
                        
                        if (imgResponse.status >= 400) {
                            modalResults.character.broken.push({
                                name: character.name || characterId,
                                src: imageUrl,
                                status: imgResponse.status,
                                type: 'Character Modal Image'
                            });
                            totalModalBroken++;
                        } else {
                            modalResults.character.working.push({
                                name: character.name || characterId,
                                src: imageUrl
                            });
                        }
                    } catch (error) {
                        modalResults.character.broken.push({
                            name: character.name || characterId,
                            src: imageUrl,
                            error: error.message,
                            type: 'Character Modal Image'
                        });
                        totalModalBroken++;
                    }
                }
            }
        }
        
        // Fetch all lore data and check their images
        console.log('🔍 Checking lore images for modal dialogs...');
        const loreRef = ref(database, 'lore');
        const loreSnapshot = await get(loreRef);
        if (loreSnapshot.exists()) {
            const loreData = loreSnapshot.val();
            
            for (const loreId in loreData) {
                const loreItem = loreData[loreId];
                if (loreItem && loreItem.image) {
                    totalModalImages++;
                    const imageUrl = loreItem.image.startsWith('http') ? loreItem.image : `${BASE_URL}${loreItem.image}`;
                    
                    try {
                        const imgResponse = await axios.get(imageUrl, {
                            validateStatus: null,
                            timeout: isProduction ? 15000 : 5000,
                            headers: getAuthHeaders()
                        });
                        
                        if (imgResponse.status >= 400) {
                            modalResults.lore.broken.push({
                                name: loreItem.title || loreItem.name || loreId,
                                src: imageUrl,
                                status: imgResponse.status,
                                type: 'Lore Modal Image'
                            });
                            totalModalBroken++;
                        } else {
                            modalResults.lore.working.push({
                                name: loreItem.title || loreItem.name || loreId,
                                src: imageUrl
                            });
                        }
                    } catch (error) {
                        modalResults.lore.broken.push({
                            name: loreItem.title || loreItem.name || loreId,
                            src: imageUrl,
                            error: error.message,
                            type: 'Lore Modal Image'
                        });
                        totalModalBroken++;
                    }
                }
            }
        }
        
        // Fetch all episode data and check their images
        console.log('🔍 Checking episode images for modal dialogs...');
        const videosRef = ref(database, 'videos');
        const videosSnapshot = await get(videosRef);
        if (videosSnapshot.exists()) {
            const videosData = videosSnapshot.val();
            
            for (const seasonKey in videosData) {
                const season = videosData[seasonKey];
                if (season.episodes) {
                    for (const episodeKey in season.episodes) {
                        const episode = season.episodes[episodeKey];
                        if (episode && episode.image) {
                            totalModalImages++;
                            const imageUrl = episode.image.startsWith('http') ? episode.image : `${BASE_URL}${episode.image}`;
                            
                            try {
                                const imgResponse = await axios.get(imageUrl, {
                                    validateStatus: null,
                                    timeout: isProduction ? 15000 : 5000,
                                    headers: getAuthHeaders()
                                });
                                
                                if (imgResponse.status >= 400) {
                                    modalResults.episode.broken.push({
                                        name: episode.title || `${seasonKey} ${episodeKey}`,
                                        src: imageUrl,
                                        status: imgResponse.status,
                                        type: 'Episode Modal Image'
                                    });
                                    totalModalBroken++;
                                } else {
                                    modalResults.episode.working.push({
                                        name: episode.title || `${seasonKey} ${episodeKey}`,
                                        src: imageUrl
                                    });
                                }
                            } catch (error) {
                                modalResults.episode.broken.push({
                                    name: episode.title || `${seasonKey} ${episodeKey}`,
                                    src: imageUrl,
                                    error: error.message,
                                    type: 'Episode Modal Image'
                                });
                                totalModalBroken++;
                            }
                        }
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking modal images:', error.message);
    }
    
    // Report modal image results
    console.log(`\n📊 Modal Images Summary: ${totalModalImages} total, ${totalModalBroken} broken, ${totalModalImages - totalModalBroken} working\n`);
    
    let hasModalIssues = false;
    for (const [category, results] of Object.entries(modalResults)) {
        if (results.broken.length > 0) {
            hasModalIssues = true;
            console.log(`❌ ${category.toUpperCase()} MODAL IMAGES - ${results.broken.length} broken:`);
            results.broken.forEach((img, index) => {
                if (index < 5) { // Show first 5 for readability
                    console.log(`   ${index + 1}. ${img.name}`);
                    console.log(`      URL: ${img.src}`);
                    if (img.status) console.log(`      Status: ${img.status}`);
                    if (img.error) console.log(`      Error: ${img.error}`);
                }
            });
            if (results.broken.length > 5) {
                console.log(`   ... and ${results.broken.length - 5} more`);
            }
        }
        
        if (results.working.length > 0) {
            console.log(`✅ ${category.toUpperCase()} MODAL IMAGES - ${results.working.length} working`);
        }
    }
    
    if (!hasModalIssues && totalModalImages > 0) {
        console.log('✅ All modal dialog images working correctly!');
    } else if (totalModalImages === 0) {
        console.log('⚠️  No modal images found to check');
    }
    
    return {
        total: totalModalImages,
        broken: totalModalBroken,
        working: totalModalImages - totalModalBroken,
        results: modalResults
    };
};

const categorizeImage = (img, $) => {
    const src = $(img).attr('src');
    const className = $(img).attr('class') || '';
    const alt = $(img).attr('alt') || '';
    const parent = $(img).parent();
    const parentClass = parent.attr('class') || '';
    const grandParent = parent.parent();
    const grandParentClass = grandParent.attr('class') || '';

    // Categorize based on class names, parent elements, and context
    if (className.includes('nav-image') || parentClass.includes('navigation') || grandParentClass.includes('navigation')) {
        return 'navigation';
    }
    if (className.includes('disambiguation') || parentClass.includes('disambiguation') || src.includes('disambiguation') || 
        className.includes('disambiguation-option-image') || parentClass.includes('disambiguation-option')) {
        return 'modal';
    }
    if (className.includes('gallery-image') || className.includes('carousel') || parentClass.includes('carousel') || grandParentClass.includes('carousel')) {
        return 'carousel';
    }
    if (parentClass.includes('banner') || grandParentClass.includes('banner') || $(img).closest('section[class*="banner"]').length > 0) {
        return 'banner';
    }
    if (className.includes('hero') || alt.toLowerCase().includes('hero') || parentClass.includes('hero')) {
        return 'hero';
    }
    if (src.includes('favicon') || src.includes('icon')) {
        return 'icon';
    }
    if (className.includes('thumb') || className.includes('thumbnail') || alt.toLowerCase().includes('thumb')) {
        return 'thumbnail';
    }
    
    return 'other';
};

const checkImages = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: isProduction ? 30000 : 10000,
            headers: getAuthHeaders()
        });
        const $ = cheerio.load(response.data);
        const images = $('img');

        console.log(`\n🔍 Checking images on ${url}`);

        const imageResults = {
            navigation: { broken: [], working: [] },
            modal: { broken: [], working: [] },
            carousel: { broken: [], working: [] },
            banner: { broken: [], working: [] },
            hero: { broken: [], working: [] },
            icon: { broken: [], working: [] },
            thumbnail: { broken: [], working: [] },
            other: { broken: [], working: [] }
        };

        let totalImages = 0;
        let totalBroken = 0;

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const src = $(img).attr('src');

            if (src) {
                totalImages++;
                const category = categorizeImage(img, $);
                
                try {
                    const imgResponse = await axios.get(src, { 
                        validateStatus: null,
                        timeout: isProduction ? 15000 : 5000, // Longer timeout for production
                        headers: getAuthHeaders()
                    });
                    if (imgResponse.status >= 400) {
                        imageResults[category].broken.push({
                            src,
                            status: imgResponse.status,
                            alt: $(img).attr('alt') || 'No alt text',
                            class: $(img).attr('class') || 'No class'
                        });
                        totalBroken++;
                    } else {
                        imageResults[category].working.push(src);
                    }
                } catch (error) {
                    imageResults[category].broken.push({
                        src,
                        error: error.message,
                        alt: $(img).attr('alt') || 'No alt text',
                        class: $(img).attr('class') || 'No class'
                    });
                    totalBroken++;
                }
            }
        }

        // Report results by category
        console.log(`📊 Total: ${totalImages} images, ${totalBroken} broken, ${totalImages - totalBroken} working`);
        
        let hasAnyBroken = false;
        for (const [category, results] of Object.entries(imageResults)) {
            if (results.broken.length > 0) {
                hasAnyBroken = true;
                console.log(`\n❌ ${category.toUpperCase()} - ${results.broken.length} broken:`);
                results.broken.forEach((img, index) => {
                    if (index < 3) { // Limit to first 3 for readability
                        console.log(`   ${index + 1}. ${img.src}`);
                        if (img.status) console.log(`      Status: ${img.status}`);
                        if (img.error) console.log(`      Error: ${img.error}`);
                        if (img.alt !== 'No alt text') console.log(`      Alt: ${img.alt}`);
                    }
                });
                if (results.broken.length > 3) {
                    console.log(`   ... and ${results.broken.length - 3} more`);
                }
            }
            
            if (results.working.length > 0) {
                console.log(`✅ ${category.toUpperCase()} - ${results.working.length} working`);
            }
        }

        if (!hasAnyBroken) {
            console.log(`✅ All images working correctly!`);
        }

        // Check for background images in CSS
        const backgroundImages = [];
        $('*').each((i, element) => {
            const style = $(element).attr('style');
            if (style && style.includes('background-image')) {
                const match = style.match(/background-image:\s*url\(['"]?([^'"]*?)['"]?\)/);
                if (match && match[1]) {
                    backgroundImages.push(match[1]);
                }
            }
        });

        if (backgroundImages.length > 0) {
            console.log(`\n🖼️  Background images found: ${backgroundImages.length}`);
            for (const bgImg of backgroundImages) {
                try {
                    const imgResponse = await axios.get(bgImg, { 
                        validateStatus: null,
                        timeout: isProduction ? 15000 : 5000,
                        headers: getAuthHeaders()
                    });
                    if (imgResponse.status >= 400) {
                        console.log(`❌ Background: ${bgImg} (Status: ${imgResponse.status})`);
                    } else {
                        console.log(`✅ Background: ${bgImg}`);
                    }
                } catch (error) {
                    console.log(`❌ Background: ${bgImg} (Error: ${error.message})`);
                }
            }
        }

    } catch (error) {
        console.error(`❌ Error checking ${url}:`, error.message);
    }
};

const main = async () => {
    console.log('🚀 Starting comprehensive image check...\n');
    console.log(`🌐 Environment: ${isProduction ? 'PRODUCTION' : 'LOCAL'} (${BASE_URL})`);
    
    if (checkModals) {
        console.log('🎭 Modal checking: ENABLED');
    } else if (modalOnly) {
        console.log('🎭 Modal checking: MODAL-ONLY MODE');
    } else {
        console.log('🎭 Modal checking: DISABLED (use --modals to enable)');
    }
    console.log('');
    
    let modalSummary = null;
    
    // Check modal images if requested
    if (checkModals || modalOnly) {
        modalSummary = await checkModalImages();
    }
    
    // Skip regular page checking if modal-only
    if (modalOnly) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 MODAL-ONLY SUMMARY REPORT');
        console.log('='.repeat(60));
        
        if (modalSummary) {
            console.log(`🎭 Modal images checked: ${modalSummary.total}`);
            console.log(`❌ Modal images broken: ${modalSummary.broken}`);
            console.log(`✅ Modal images working: ${modalSummary.working}`);
            
            if (modalSummary.broken === 0 && modalSummary.total > 0) {
                console.log('\n🎉 CONGRATULATIONS! All modal images are working correctly!');
            } else if (modalSummary.broken > 0) {
                console.log(`\n⚠️  ${modalSummary.broken} modal images need attention.`);
            } else {
                console.log('\n⚠️  No modal images found to check.');
            }
        }
        
        console.log('='.repeat(60));
        return;
    }
    
    const routes = await fetchRoutes();
    console.log(`📋 Routes to check (${routes.length}):`, routes.map(r => r.length > 30 ? r.substring(0, 30) + '...' : r));

    const summary = {
        totalPages: 0,
        pagesWithIssues: 0,
        totalImagesByCategory: {
            navigation: 0,
            modal: 0,
            carousel: 0,
            banner: 0,
            hero: 0,
            icon: 0,
            thumbnail: 0,
            other: 0
        },
        brokenImagesByCategory: {
            navigation: 0,
            modal: 0,
            carousel: 0,
            banner: 0,
            hero: 0,
            icon: 0,
            thumbnail: 0,
            other: 0
        }
    };

    for (const route of routes) {
        const url = `${BASE_URL}${route}`;
        summary.totalPages++;
        
        try {
            const response = await axios.get(url, {
                timeout: isProduction ? 30000 : 10000,
                headers: getAuthHeaders()
            });
            const $ = cheerio.load(response.data);
            const images = $('img');
            
            let pageHasIssues = false;
            const pageResults = {
                navigation: { broken: [], working: [] },
                modal: { broken: [], working: [] },
                carousel: { broken: [], working: [] },
                banner: { broken: [], working: [] },
                hero: { broken: [], working: [] },
                icon: { broken: [], working: [] },
                thumbnail: { broken: [], working: [] },
                other: { broken: [], working: [] }
            };

            console.log(`\n🔍 Checking images on ${url}`);
            
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                const src = $(img).attr('src');

                if (src) {
                    const category = categorizeImage(img, $);
                    summary.totalImagesByCategory[category]++;
                    
                try {
                    const imgResponse = await axios.get(src, { 
                        validateStatus: null,
                        timeout: isProduction ? 15000 : 5000, // Longer timeout for production  
                        headers: getAuthHeaders()
                    });
                    if (imgResponse.status >= 400) {
                            pageResults[category].broken.push({
                                src,
                                status: imgResponse.status,
                                alt: $(img).attr('alt') || 'No alt text',
                                class: $(img).attr('class') || 'No class'
                            });
                            summary.brokenImagesByCategory[category]++;
                            pageHasIssues = true;
                        } else {
                            pageResults[category].working.push(src);
                        }
                    } catch (error) {
                        pageResults[category].broken.push({
                            src,
                            error: error.message,
                            alt: $(img).attr('alt') || 'No alt text',
                            class: $(img).attr('class') || 'No class'
                        });
                        summary.brokenImagesByCategory[category]++;
                        pageHasIssues = true;
                    }
                }
            }

            if (pageHasIssues) {
                summary.pagesWithIssues++;
                console.log(`❌ Issues found on this page:`);
                
                for (const [category, results] of Object.entries(pageResults)) {
                    if (results.broken.length > 0) {
                        console.log(`   ${category.toUpperCase()}: ${results.broken.length} broken`);
                        results.broken.slice(0, 2).forEach((img, index) => {
                            console.log(`     ${index + 1}. ${img.src.length > 60 ? img.src.substring(0, 60) + '...' : img.src}`);
                        });
                        if (results.broken.length > 2) {
                            console.log(`     ... and ${results.broken.length - 2} more`);
                        }
                    }
                }
            } else {
                console.log(`✅ All images working correctly!`);
            }

        } catch (error) {
            console.error(`❌ Error checking ${url}:`, error.message);
            summary.pagesWithIssues++;
        }
    }

    // Final summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`📄 Pages checked: ${summary.totalPages}`);
    console.log(`⚠️  Pages with issues: ${summary.pagesWithIssues}`);
    console.log(`✅ Pages working: ${summary.totalPages - summary.pagesWithIssues}`);
    
    console.log('\n📸 Images by category:');
    const totalImages = Object.values(summary.totalImagesByCategory).reduce((a, b) => a + b, 0);
    const totalBroken = Object.values(summary.brokenImagesByCategory).reduce((a, b) => a + b, 0);
    
    for (const [category, total] of Object.entries(summary.totalImagesByCategory)) {
        const broken = summary.brokenImagesByCategory[category];
        const working = total - broken;
        if (total > 0) {
            const status = broken > 0 ? '❌' : '✅';
            console.log(`   ${status} ${category.toUpperCase()}: ${working}/${total} working ${broken > 0 ? `(${broken} broken)` : ''}`);
        }
    }
    
    // Include modal summary if available
    if (modalSummary) {
        console.log('\n🎭 Modal Images:');
        console.log(`   📊 Total: ${modalSummary.total}`);
        console.log(`   ❌ Broken: ${modalSummary.broken}`);
        console.log(`   ✅ Working: ${modalSummary.working}`);
    }
    
    const totalAllImages = totalImages + (modalSummary ? modalSummary.total : 0);
    const totalAllBroken = totalBroken + (modalSummary ? modalSummary.broken : 0);
    
    console.log(`\n🎯 Overall: ${totalAllImages - totalAllBroken}/${totalAllImages} images working`);
    console.log(`   Success rate: ${totalAllImages > 0 ? Math.round(((totalAllImages - totalAllBroken) / totalAllImages) * 100) : 100}%`);
    
    if (totalAllBroken === 0) {
        console.log('\n🎉 CONGRATULATIONS! All images are working correctly!');
    } else {
        console.log(`\n⚠️  ${totalAllBroken} images need attention.`);
    }
    
    console.log('='.repeat(60));
};

main();