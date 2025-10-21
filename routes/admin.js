/**
 * Admin and Utility Routes Module
 * Handles admin pages, cache management, debug endpoints, and utility routes
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// Import Firebase utilities
const firebaseUtils = require('../helpers/firebase-utils');

// Import helper modules
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');

// Import admin authentication middleware
const { adminAuth, adminHealthCheck, getSecurityLog } = require('../middleware/adminAuth');

// Import rate limiting middleware
const { admin: adminRateLimit } = require('../middleware/rateLimiting');

/**
 * Firebase debug route - for debugging authentication issues
 */
router.get('/firebase-debug', (req, res) => {
  res.render('firebase-debug', {
    title: 'Firebase Debug Console'
  });
});

/**
 * Test route for modal debugging
 */
router.get('/test-modal', (req, res) => {
  res.sendFile(path.join(__dirname, '../views', 'test-modal.html'));
});

/**
 * Contact page route
 */
router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact - Coming Soon', 
    pageTitle: 'Contact Wavelength Lore - Get in Touch',
    pageDescription: 'Get in touch with the Wavelength Lore team. Contact us for questions, feedback, or collaboration opportunities.',
    pageKeywords: 'wavelength, contact, feedback, collaboration, questions, support',
    ogType: 'website',
    ogImage: process.env.CDN_URL + '/images/wavelength-contact-og.jpg',
    ogUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
    cdnUrl: process.env.CDN_URL, 
    version: `v${Date.now()}`,
    req: req
  });
});

/**
 * Cache management page route
 */
router.get('/cache-management', (req, res) => {
  res.render('cache-management', { 
    title: 'Cache Management', 
    cdnUrl: process.env.CDN_URL, 
    version: `v${Date.now()}` 
  });
});

/**
 * Banner management page route
 */
router.get('/admin/banners', (req, res) => {
  res.render('banner-admin', { 
    title: 'Banner Management', 
    cdnUrl: process.env.CDN_URL, 
    version: `v${Date.now()}`,
    req: req
  });
});

/**
 * Main admin panel route - redirects to forum admin
 */
router.get('/admin', adminAuth, (_req, res) => {
  res.redirect('/forum/admin');
});

/**
 * Admin users management route - redirects to forum admin for now
 * TODO: Create dedicated user management page
 */
router.get('/admin/users', adminAuth, (_req, res) => {
  res.redirect('/forum/admin');
});

/**
 * Group management admin panel route
 */
router.get('/admin/groups', adminAuth, (req, res) => {
  res.render('admin/group-management', {
    title: 'Group Management - Wavelength Admin',
    pageTitle: 'Group Management - Wavelength Admin Panel',
    pageDescription: 'Manage user groups and permissions in the Wavelength system',
    cdnUrl: process.env.CDN_URL,
    version: `v${Date.now()}`,
    req: req
  });
});

/**
 * Security monitoring endpoints
 */
router.get('/api/admin/security/health', adminHealthCheck);
router.get('/api/admin/security/logs', adminAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = getSecurityLog(limit);
  
  res.json({
    success: true,
    logs,
    count: logs.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * Cache busting routes - secured with admin authentication
 */
router.post('/api/cache/bust', adminAuth, adminRateLimit, async (req, res) => {
  try {
    const { type, refresh } = req.body;
    const results = {};
    
    if (!type || type === 'all' || type === 'characters') {
      characterHelpers.clearCharacterCache();
      results.characters = 'cleared';
      
      if (refresh) {
        await characterHelpers.initializeCharacterCache();
        const characters = await characterHelpers.getAllCharacters();
        results.characters = `refreshed with ${characters.length} items`;
      }
    }
    
    if (!type || type === 'all' || type === 'lore') {
      loreHelpers.clearLoreCache();
      results.lore = 'cleared';
      
      if (refresh) {
        await loreHelpers.initializeLoreCache();
        const lore = await loreHelpers.getAllLore();
        results.lore = `refreshed with ${lore.length} items`;
      }
    }
    
    if (!type || type === 'all' || type === 'episodes') {
      episodeHelpers.clearEpisodeCache();
      results.episodes = 'cleared';
      
      if (refresh) {
        await episodeHelpers.initializeEpisodeCache();
        const episodes = await episodeHelpers.getAllEpisodes();
        results.episodes = `refreshed with ${episodes.length} items`;
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Cache busting completed',
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache busting error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET routes for simple cache busting (secured)
 */
router.get('/api/cache/bust', adminAuth, async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const results = {};
    
    // Clear all caches
    characterHelpers.clearCharacterCache();
    results.characters = 'cleared';
    loreHelpers.clearLoreCache();
    results.lore = 'cleared';
    
    if (refresh) {
      await characterHelpers.initializeCharacterCache();
      const characters = await characterHelpers.getAllCharacters();
      results.characters = `refreshed with ${characters.length} items`;
      
      await loreHelpers.initializeLoreCache();
      const lore = await loreHelpers.getAllLore();
      results.lore = `refreshed with ${lore.length} items`;
    }
    
    res.json({ 
      success: true, 
      message: 'Cache busting completed for: all',
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache busting error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.get('/api/cache/bust/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const refresh = req.query.refresh === 'true';
    const results = {};
    
    if (type === 'all' || type === 'characters') {
      characterHelpers.clearCharacterCache();
      results.characters = 'cleared';
      
      if (refresh) {
        await characterHelpers.initializeCharacterCache();
        const characters = await characterHelpers.getAllCharacters();
        results.characters = `refreshed with ${characters.length} items`;
      }
    }
    
    if (type === 'all' || type === 'lore') {
      loreHelpers.clearLoreCache();
      results.lore = 'cleared';
      
      if (refresh) {
        await loreHelpers.initializeLoreCache();
        const lore = await loreHelpers.getAllLore();
        results.lore = `refreshed with ${lore.length} items`;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Cache busting completed for: ${type}`,
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache busting error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Cache status route
 */
router.get('/api/cache/status', async (req, res) => {
  try {
    const characters = characterHelpers.getAllCharactersSync();
    const lore = loreHelpers.getAllLoreSync();
    const episodes = episodeHelpers.getAllEpisodesSync();
    
    res.json({
      success: true,
      cache_status: {
        characters: {
          count: characters.length,
          sample_ids: characters.slice(0, 3).map(c => c.id)
        },
        lore: {
          count: lore.length,
          sample_ids: lore.slice(0, 3).map(l => l.id)
        },
        episodes: {
          count: episodes.length,
          sample_ids: episodes.slice(0, 3).map(e => e.id)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Debug endpoint to check episode cache
 */
router.get('/debug/episodes', async (req, res) => {
  try {
    const allEpisodes = episodeHelpers.getAllEpisodesSync();
    const episodesWithKeywords = allEpisodes.filter(ep => ep.keywords && ep.keywords.length > 0);
    
    res.json({
      totalEpisodes: allEpisodes.length,
      episodesWithKeywords: episodesWithKeywords.length,
      sampleEpisode: allEpisodes[0],
      episodesWithKeywordsSample: episodesWithKeywords.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Debug endpoint to force refresh episode cache
 */
router.get('/debug/episodes/refresh', async (req, res) => {
  try {
    console.log('🔄 Forcing episode cache refresh...');
    
    // Clear the cache first
    episodeHelpers.clearEpisodeCache && episodeHelpers.clearEpisodeCache();
    
    await episodeHelpers.initializeEpisodeCache();
    const allEpisodes = episodeHelpers.getAllEpisodesSync();
    const episodesWithKeywords = allEpisodes.filter(ep => ep.keywords && ep.keywords.length > 0);
    
    // Log detailed episode info
    console.log('📊 Episode cache contents:');
    allEpisodes.slice(0, 3).forEach(ep => {
      console.log(`  - ${ep.title}:`, {
        id: ep.id,
        hasKeywords: !!(ep.keywords),
        keywords: ep.keywords || [],
        season: ep.season,
        episode: ep.episode
      });
    });
    
    res.json({
      message: 'Cache refreshed',
      totalEpisodes: allEpisodes.length,
      episodesWithKeywords: episodesWithKeywords.length,
      sampleEpisodeWithKeywords: episodesWithKeywords[0] || null,
      allEpisodesSample: allEpisodes.slice(0, 3).map(ep => ({
        title: ep.title,
        id: ep.id,
        keywords: ep.keywords || [],
        url: ep.url
      }))
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Sitemap.xml route for SEO
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = req.protocol + '://' + req.get('host');
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/map</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/characters</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/lore</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/forum</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Add episodes to sitemap
    const videos = await firebaseUtils.fetchFromFirebase('videos');
    if (videos) {
      for (const season in videos) {
        if (videos[season].episodes) {
          for (const episode in videos[season].episodes) {
            const seasonNum = season.replace('season', '');
            const episodeNum = episode.replace('episode', '');
            sitemap += `
  <url>
    <loc>${baseUrl}/season/${seasonNum}/episode/${episodeNum}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
          }
        }
      }
    }

    // Add characters to sitemap
    const charactersData = await firebaseUtils.fetchFromFirebase('characters');
    if (charactersData) {
      for (const category in charactersData) {
        if (Array.isArray(charactersData[category])) {
          charactersData[category].forEach(character => {
            sitemap += `
  <url>
    <loc>${baseUrl}/character/${character.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
          });
        }
      }
    }

    // Add lore to sitemap
    const allLore = await loreHelpers.getAllLore();
    allLore.forEach(loreItem => {
      sitemap += `
  <url>
    <loc>${baseUrl}/lore/${loreItem.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    res.set('Content-Type', 'text/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Robots.txt route for SEO
 */
router.get('/robots.txt', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and cache management pages
Disallow: /admin/
Disallow: /cache-management
Disallow: /api/admin/

# Allow forum but limit crawl rate
User-agent: *
Crawl-delay: 1

# Allow all search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /`;

  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

module.exports = router;