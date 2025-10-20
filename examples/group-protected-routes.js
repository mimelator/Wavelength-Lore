/**
 * Example Route Protection using Group Management
 */

const express = require('express');
const { groupAuth } = require('../middleware/groupAuth');

const router = express.Router();

// 1. PROTECT ENTIRE ROUTE BY GROUP
// Only admins and super_admins can access this route
router.get('/admin-only', groupAuth.requireGroup(['admin', 'super_admin']), (req, res) => {
  res.json({
    message: 'Welcome to the admin area!',
    userGroups: req.userGroups,
    user: req.groupAuth.user
  });
});

// 2. PROTECT BY SPECIFIC PERMISSION
// Only users with 'content_moderation' permission can access
router.get('/moderate', groupAuth.requirePermission('content_moderation'), (req, res) => {
  res.json({
    message: 'You can moderate content',
    permissions: req.groupAuth.permissions
  });
});

// 3. PROTECT BY ACTION
// Only users who can perform 'user_management' action
router.get('/manage-users', groupAuth.requireAction('user_management'), (req, res) => {
  res.json({
    message: 'User management panel',
    canManageUsers: req.groupAuth.canPerform('user_management')
  });
});

// 4. CONDITIONAL CONTENT BASED ON GROUPS
router.get('/dashboard', async (req, res) => {
  // This route is open to all authenticated users, but content varies by group
  const user = await groupAuth.getAuthenticatedUser(req);
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const userGroups = await groupAuth.getUserGroups(user.uid);
  const isAdmin = groupAuth.checkGroupAccess(userGroups, ['admin', 'super_admin']);
  const isModerator = groupAuth.checkGroupAccess(userGroups, ['moderator']);
  const isContentManager = groupAuth.checkGroupAccess(userGroups, ['content_manager']);
  
  res.json({
    message: 'Welcome to your dashboard',
    user: user,
    groups: userGroups,
    features: {
      canViewAdminPanel: isAdmin,
      canModerateContent: isModerator,
      canEditLore: isContentManager,
      canCreatePosts: groupAuth.canPerformAction(userGroups, 'post_create')
    }
  });
});

// 5. MIXED PROTECTION - Different access levels for different methods
router.route('/content/:id')
  .get(groupAuth.requireGroup('user'), (req, res) => {
    // All users can read
    res.json({ content: 'Public content', id: req.params.id });
  })
  .put(groupAuth.requireAction('lore_edit'), (req, res) => {
    // Only content managers can edit
    res.json({ message: 'Content updated', id: req.params.id });
  })
  .delete(groupAuth.requireGroup(['admin', 'super_admin']), (req, res) => {
    // Only admins can delete
    res.json({ message: 'Content deleted', id: req.params.id });
  });

module.exports = router;