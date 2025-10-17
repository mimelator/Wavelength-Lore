/**
 * Admin API Routes for Wavelength Lore
 * 
 * Authenticated API endpoints for admin panel data access
 * Uses Firebase Admin SDK to bypass security rules
 */

const express = require('express');
const { fetchDataAsAdmin, writeDataAsAdmin, updateDataAsAdmin, deleteDataAsAdmin } = require('../helpers/firebase-admin-utils');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * GET /api/admin/users
 * Fetch all forum users with admin privileges
 */
router.get('/users', async (req, res) => {
  try {
    console.log('Admin API: Fetching users data');
    
    // Fetch users data using Firebase Admin SDK
    const users = await fetchDataAsAdmin('forum/users');
    
    if (!users) {
      return res.json({ success: true, data: [] });
    }

    // Transform the data into an array with additional metadata
    const userArray = Object.entries(users).map(([uid, userData]) => ({
      uid,
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString(),
      lastActive: userData.lastActive || userData.createdAt || new Date().toISOString(),
      postCount: userData.postCount || 0,
      isActive: userData.isActive !== false,
      role: userData.role || 'user'
    }));

    // Sort by creation date (newest first)
    userArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: userArray,
      count: userArray.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin API Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users data',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/posts
 * Fetch all forum posts with admin privileges
 */
router.get('/posts', async (req, res) => {
  try {
    console.log('Admin API: Fetching posts data');
    
    // Fetch posts data using Firebase Admin SDK
    const posts = await fetchDataAsAdmin('forum/posts');
    
    if (!posts) {
      return res.json({ success: true, data: [] });
    }

    // Transform the data into an array with additional metadata
    const postArray = Object.entries(posts).map(([postId, postData]) => ({
      id: postId,
      ...postData,
      createdAt: postData.createdAt || new Date().toISOString(),
      updatedAt: postData.updatedAt || postData.createdAt || new Date().toISOString(),
      isVisible: postData.isVisible !== false,
      reportCount: postData.reportCount || 0,
      likeCount: postData.likeCount || 0
    }));

    // Sort by creation date (newest first)
    postArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: postArray,
      count: postArray.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin API Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts data',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/reports
 * Fetch all user reports with admin privileges
 */
router.get('/reports', async (req, res) => {
  try {
    console.log('Admin API: Fetching reports data');
    
    // Fetch reports data using Firebase Admin SDK
    const reports = await fetchDataAsAdmin('forum/reports');
    
    if (!reports) {
      return res.json({ success: true, data: [] });
    }

    // Transform the data into an array with additional metadata
    const reportArray = Object.entries(reports).map(([reportId, reportData]) => ({
      id: reportId,
      ...reportData,
      createdAt: reportData.createdAt || new Date().toISOString(),
      status: reportData.status || 'pending',
      priority: reportData.priority || 'medium',
      reviewedAt: reportData.reviewedAt || null,
      reviewedBy: reportData.reviewedBy || null
    }));

    // Sort by creation date (newest first)
    reportArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: reportArray,
      count: reportArray.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin API Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports data',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/users/:uid/update
 * Update user data with admin privileges
 */
router.post('/users/:uid/update', async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    
    console.log(`Admin API: Updating user ${uid}`);
    
    // Add timestamp
    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = 'admin';
    
    const success = await updateDataAsAdmin(`forum/users/${uid}`, updates);
    
    if (success) {
      res.json({
        success: true,
        message: `User ${uid} updated successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }

  } catch (error) {
    console.error('Admin API Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/posts/:id/update
 * Update post data with admin privileges
 */
router.post('/posts/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`Admin API: Updating post ${id}`);
    
    // Add timestamp
    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = 'admin';
    
    const success = await updateDataAsAdmin(`forum/posts/${id}`, updates);
    
    if (success) {
      res.json({
        success: true,
        message: `Post ${id} updated successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update post'
      });
    }

  } catch (error) {
    console.error('Admin API Error updating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/posts/:id
 * Delete post with admin privileges
 */
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Admin API: Deleting post ${id}`);
    
    const success = await deleteDataAsAdmin(`forum/posts/${id}`);
    
    if (success) {
      res.json({
        success: true,
        message: `Post ${id} deleted successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete post'
      });
    }

  } catch (error) {
    console.error('Admin API Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('Admin API: Fetching dashboard stats');
    
    // Fetch all data in parallel
    const [users, posts, reports] = await Promise.all([
      fetchDataAsAdmin('forum/users'),
      fetchDataAsAdmin('forum/posts'),
      fetchDataAsAdmin('forum/reports')
    ]);

    // Calculate statistics
    const userCount = users ? Object.keys(users).length : 0;
    const postCount = posts ? Object.keys(posts).length : 0;
    const reportCount = reports ? Object.keys(reports).length : 0;
    
    // Calculate active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let activeUserCount = 0;
    if (users) {
      activeUserCount = Object.values(users).filter(user => 
        user.lastActive && user.lastActive > thirtyDaysAgo
      ).length;
    }

    // Calculate pending reports
    let pendingReportCount = 0;
    if (reports) {
      pendingReportCount = Object.values(reports).filter(report => 
        report.status === 'pending'
      ).length;
    }

    res.json({
      success: true,
      data: {
        totalUsers: userCount,
        activeUsers: activeUserCount,
        totalPosts: postCount,
        totalReports: reportCount,
        pendingReports: pendingReportCount,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Admin API Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    });
  }
});

module.exports = router;