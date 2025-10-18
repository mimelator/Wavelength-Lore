/**
 * Wavelength Community Forum Routes
 * Integrates with existing Express application
 */

const express = require('express');
const router = express.Router();

/**
 * Forum Home Page - Display categories and recent activity
 */
router.get('/', (req, res) => {
    res.render('forum/home-page', {
        title: 'Community Forum',
        currentPage: 'home',
        breadcrumbs: [],
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`
    });
});

/**
 * Firebase Connection Test Page - Diagnostic tool
 */
router.get('/firebase-test', (req, res) => {
    res.render('firebase-test', {
        title: 'Firebase Connection Test'
    });
});

/**
 * Forum Category View - Display posts in a specific category
 */
router.get('/category/:categoryId', (req, res) => {
    const categoryId = req.params.categoryId;
    
    // Category names for breadcrumbs
    const categoryNames = {
        'general': 'General Discussion',
        'lore': 'Lore & Theories',
        'episodes': 'Episode Discussions',
        'fanart': 'Fan Creations'
    };
    
    const categoryName = categoryNames[categoryId] || 'Unknown Category';
    
    // Render the category content and pass it to the layout
    res.render('forum/category-page', {
        title: categoryName,
        currentPage: 'category',
        categoryId: categoryId,
        categoryName: categoryName,
        breadcrumbs: [
            { name: categoryName, url: null }
        ],
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`
    });
});

/**
 * Forum Post View - Display individual post and replies
 */
router.get('/post/:postId', (req, res) => {
    const postId = req.params.postId;
    
    res.render('forum/post-page', {
        postId: postId,
        title: 'Post Discussion',
        cdnUrl: process.env.CDN_URL || '',
        version: process.env.VERSION || Date.now()
    });
});

/**
 * Create New Post Page
 */
router.get('/create', (req, res) => {
    const categoryId = req.query.category || 'general';
    const episodeTitle = req.query.episodeTitle || '';
    const seasonNumber = req.query.seasonNumber || '';
    const episodeNumber = req.query.episodeNumber || '';
    const characterName = req.query.characterName || '';
    const characterId = req.query.characterId || '';
    const loreName = req.query.loreName || '';
    const loreId = req.query.loreId || '';
    const loreType = req.query.loreType || '';
    
    // Generate suggested title based on context
    let suggestedTitle = '';
    let suggestedContent = '';
    
    if (episodeTitle && seasonNumber && episodeNumber) {
        suggestedTitle = `Discussion: ${episodeTitle} (Season ${seasonNumber}, Episode ${episodeNumber})`;
    } else if (characterName) {
        suggestedTitle = `Character Discussion: ${characterName}`;
    } else if (loreName && loreType) {
        suggestedTitle = `Lore Discussion: ${loreName} (${loreType})`;
    }
    
    res.render('forum/create-post-page', {
        title: 'Create New Post',
        currentPage: 'create',
        defaultCategory: categoryId,
        episodeTitle: episodeTitle,
        seasonNumber: seasonNumber,
        episodeNumber: episodeNumber,
        characterName: characterName,
        characterId: characterId,
        loreName: loreName,
        loreId: loreId,
        loreType: loreType,
        suggestedTitle: suggestedTitle,
        breadcrumbs: [
            { name: 'Create New Post', url: null }
        ],
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`
    });
});

/**
 * Recent Posts Page
 */
router.get('/recent', (req, res) => {
    res.render('forum/recent', {
        title: 'Recent Posts',
        currentPage: 'recent',
        breadcrumbs: [
            { name: 'Recent Posts', url: null }
        ],
        cdnUrl: process.env.CDN_URL || '',
        version: process.env.VERSION || Date.now()
    });
});

/**
 * Popular Posts Page
 */
router.get('/popular', (req, res) => {
    res.render('forum/popular', {
        title: 'Popular Posts',
        currentPage: 'popular',
        breadcrumbs: [
            { name: 'Popular Posts', url: null }
        ],
        cdnUrl: process.env.CDN_URL || '',
        version: process.env.VERSION || Date.now()
    });
});

/**
 * Search Page
 */
router.get('/search', (req, res) => {
    const query = req.query.q || '';
    
    res.render('forum/search', {
        title: 'Search Forum',
        currentPage: 'search',
        searchQuery: query,
        breadcrumbs: [
            { name: 'Search', url: null }
        ],
        layout: 'forum/layout'
    });
});

/**
 * Current User Profile Page
 */
router.get('/profile', (req, res) => {
    res.render('forum/user-profile', {
        userId: null, // Will be determined by client-side authentication
        title: 'My Profile',
        cdnUrl: process.env.CDN_URL || '',
        version: process.env.VERSION || Date.now()
    });
});

/**
 * User Profile Page
 */
router.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    
    res.render('forum/user-profile', {
        userId: userId,
        title: 'User Profile',
        cdnUrl: process.env.CDN_URL || '',
        version: process.env.VERSION || Date.now()
    });
});

/**
 * Admin Panel Page - Protected with authentication
 */
router.get('/admin', require('../middleware/adminAuth').adminAuth, (req, res) => {
    res.render('forum/admin', {
        title: 'Forum Administration',
        cdnUrl: process.env.CDN_URL || '',
        version: process.env.VERSION || Date.now()
    });
});

/**
 * Forum Guidelines Page
 */
router.get('/guidelines', (req, res) => {
    res.render('forum/guidelines', {
        title: 'Community Guidelines',
        currentPage: 'guidelines',
        breadcrumbs: [
            { name: 'Community Guidelines', url: null }
        ],
        layout: 'forum/layout'
    });
});

/**
 * Forum Help Page
 */
router.get('/help', (req, res) => {
    res.render('forum/help', {
        title: 'Forum Help',
        currentPage: 'help',
        breadcrumbs: [
            { name: 'Help', url: null }
        ],
        layout: 'forum/layout'
    });
});

/**
 * API Routes for Forum Data
 */

// Get forum categories
router.get('/api/categories', async (req, res) => {
    try {
        // This would fetch from Firebase in a real implementation
        // For now, return the categories we set up
        res.json({
            success: true,
            categories: {
                general: {
                    id: 'general',
                    title: 'General Discussion',
                    description: 'Talk about Wavelength episodes, characters, and music',
                    color: '#4a47a3',
                    icon: '🎵',
                    iconSvg: '/icons/hero-icon.svg'
                },
                lore: {
                    id: 'lore',
                    title: 'Lore & Theories',
                    description: 'Dive deep into Wavelength lore, analyze episodes, and share theories',
                    color: '#6a4c93',
                    icon: '📜',
                    iconSvg: '/icons/lore-icon.svg'
                },
                episodes: {
                    id: 'episodes',
                    title: 'Episode Discussions',
                    description: 'Discuss specific episodes, favorite moments, and episode reviews',
                    color: '#e74c3c',
                    icon: '🎬',
                    iconSvg: '/icons/episode-icon.svg'
                },
                fanart: {
                    id: 'fanart',
                    title: 'Fan Creations',
                    description: 'Share fan art, music covers, and creative works inspired by Wavelength',
                    color: '#9b59b6',
                    icon: '🎨',
                    iconSvg: '/icons/hero-icon.svg'
                }
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});

// Get posts for a category
router.get('/api/category/:categoryId/posts', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // This would fetch from Firebase in a real implementation
        res.json({
            success: true,
            posts: [],
            pagination: {
                page: page,
                limit: limit,
                total: 0,
                totalPages: 0
            }
        });
    } catch (error) {
        console.error('Error fetching category posts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch posts'
        });
    }
});

// Get a specific post
router.get('/api/post/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        
        // This would fetch from Firebase in a real implementation
        res.json({
            success: true,
            post: null
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch post'
        });
    }
});

// Search posts
router.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const category = req.query.category || '';
        const sort = req.query.sort || 'relevance';
        const timeFilter = req.query.time || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // Import Firebase functions for search
        const { initializeApp } = require('firebase/app');
        const { getDatabase, ref, get, query: firebaseQuery, orderByChild } = require('firebase/database');
        
        // Firebase config from environment
        const firebaseConfig = {
            apiKey: process.env.API_KEY,
            authDomain: process.env.AUTH_DOMAIN,
            databaseURL: process.env.DATABASE_URL,
            projectId: process.env.PROJECT_ID,
            storageBucket: process.env.STORAGE_BUCKET,
            messagingSenderId: process.env.MESSAGING_SENDER_ID,
            appId: process.env.APP_ID
        };
        
        // Initialize Firebase app for this request
        let app;
        try {
            app = initializeApp(firebaseConfig, `search-${Date.now()}`);
        } catch (error) {
            // App might already exist, get existing instance
            const { getApps, getApp } = require('firebase/app');
            app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        }
        
        const database = getDatabase(app);
        const postsRef = ref(database, 'forum/posts');
        
        // Get all posts from Firebase
        const snapshot = await get(postsRef);
        const allPosts = snapshot.val() || {};
        
        // Convert to array and filter
        let posts = Object.keys(allPosts).map(key => ({
            id: key,
            ...allPosts[key]
        }));
        
        // Filter by query text (search in title and content)
        if (query.trim()) {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            posts = posts.filter(post => {
                const title = (post.title || '').toLowerCase();
                const content = (post.content || '').toLowerCase();
                const author = (post.author || '').toLowerCase();
                const searchText = `${title} ${content} ${author}`;
                
                // Check if all search terms are found
                return searchTerms.every(term => searchText.includes(term));
            });
        }
        
        // Filter by category
        if (category) {
            posts = posts.filter(post => post.category === category);
        }
        
        // Filter by time range
        if (timeFilter) {
            const now = Date.now();
            let timeThreshold = 0;
            
            switch (timeFilter) {
                case 'day':
                    timeThreshold = now - (24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    timeThreshold = now - (7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    timeThreshold = now - (30 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    timeThreshold = now - (365 * 24 * 60 * 60 * 1000);
                    break;
            }
            
            if (timeThreshold > 0) {
                posts = posts.filter(post => (post.createdAt || 0) >= timeThreshold);
            }
        }
        
        // Sort results
        switch (sort) {
            case 'date':
                posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
            case 'date-asc':
                posts.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                break;
            case 'replies':
                posts.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0));
                break;
            case 'views':
                posts.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'relevance':
            default:
                // For relevance, we could implement a scoring system
                // For now, just sort by date as fallback
                posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
        }
        
        // Calculate pagination
        const total = posts.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const resultPosts = posts.slice(startIndex, endIndex);
        
        // Add search result highlights
        const highlightedPosts = resultPosts.map(post => {
            if (query.trim()) {
                const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
                let highlightedTitle = post.title || '';
                let highlightedContent = post.content || '';
                
                // Simple highlighting - wrap search terms in highlight tags
                searchTerms.forEach(term => {
                    const regex = new RegExp(`(${term})`, 'gi');
                    highlightedTitle = highlightedTitle.replace(regex, '<mark class="result-highlight">$1</mark>');
                    highlightedContent = highlightedContent.replace(regex, '<mark class="result-highlight">$1</mark>');
                });
                
                // Truncate content to show relevant excerpts
                if (highlightedContent.length > 300) {
                    const index = highlightedContent.toLowerCase().indexOf(searchTerms[0]);
                    if (index > -1) {
                        const start = Math.max(0, index - 100);
                        const end = Math.min(highlightedContent.length, index + 200);
                        highlightedContent = (start > 0 ? '...' : '') + 
                                          highlightedContent.slice(start, end) + 
                                          (end < highlightedContent.length ? '...' : '');
                    } else {
                        highlightedContent = highlightedContent.slice(0, 300) + '...';
                    }
                }
                
                return {
                    ...post,
                    highlightedTitle,
                    highlightedContent: highlightedContent || (post.content || '').slice(0, 300) + '...'
                };
            }
            
            return {
                ...post,
                highlightedTitle: post.title || '',
                highlightedContent: (post.content || '').slice(0, 300) + (post.content && post.content.length > 300 ? '...' : '')
            };
        });
        
        res.json({
            success: true,
            results: highlightedPosts,
            query: query,
            filters: {
                category,
                sort,
                timeFilter
            },
            pagination: {
                page: page,
                limit: limit,
                total: total,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
        
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed',
            details: error.message
        });
    }
});

module.exports = router;