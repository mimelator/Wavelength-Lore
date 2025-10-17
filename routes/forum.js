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
    
    res.render('forum/create-post-page', {
        title: 'Create New Post',
        currentPage: 'create',
        defaultCategory: categoryId,
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
        layout: 'forum/layout'
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
 * Admin Panel Page
 */
router.get('/admin', (req, res) => {
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // This would implement search in Firebase
        res.json({
            success: true,
            results: [],
            query: query,
            pagination: {
                page: page,
                limit: limit,
                total: 0,
                totalPages: 0
            }
        });
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed'
        });
    }
});

module.exports = router;