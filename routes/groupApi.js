/**
 * Group Management API Routes
 * Protected endpoints for managing user groups and permissions
 */

const express = require('express');
const { groupAuth } = require('../middleware/groupAuth');
const { fetchDataAsAdmin, updateDataAsAdmin } = require('../helpers/firebase-admin-utils');

const router = express.Router();

/**
 * GET /api/groups/hierarchy
 * Get the complete group hierarchy and permissions
 */
router.get('/hierarchy', groupAuth.requireAction('admin_panel_access'), (req, res) => {
  try {
    const hierarchy = groupAuth.getGroupHierarchy();
    
    res.json({
      success: true,
      data: hierarchy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching group hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group hierarchy',
      message: error.message
    });
  }
});

/**
 * GET /api/groups/users/:group
 * Get all users in a specific group
 */
router.get('/users/:group', groupAuth.requireAction('user_management'), async (req, res) => {
  try {
    const { group } = req.params;
    
    // Validate group exists
    const groupInfo = groupAuth.getGroupInfo(group);
    if (!groupInfo) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
        group: group
      });
    }

    const users = await groupAuth.getUsersByGroup(group);
    
    res.json({
      success: true,
      data: {
        group: group,
        groupInfo: groupInfo,
        users: users,
        count: users.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching users by group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users by group',
      message: error.message
    });
  }
});

/**
 * GET /api/groups/user/:uid
 * Get groups for a specific user
 */
router.get('/user/:uid', groupAuth.requireAction('user_management'), async (req, res) => {
  try {
    const { uid } = req.params;
    
    const groups = await groupAuth.getUserGroups(uid);
    const permissions = groupAuth.getUserPermissions(groups);
    
    // Get user data for context
    const userData = await fetchDataAsAdmin(`forum/users/${uid}`);
    
    res.json({
      success: true,
      data: {
        uid: uid,
        user: userData,
        groups: groups,
        permissions: permissions,
        groupDetails: groups.map(group => ({
          name: group,
          info: groupAuth.getGroupInfo(group)
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user groups',
      message: error.message
    });
  }
});

/**
 * POST /api/groups/user/:uid/add
 * Add user to a group
 */
router.post('/user/:uid/add', groupAuth.requireAction('user_management'), async (req, res) => {
  try {
    const { uid } = req.params;
    const { group } = req.body;
    
    if (!group) {
      return res.status(400).json({
        success: false,
        error: 'Group name required'
      });
    }

    // Validate group exists
    const groupInfo = groupAuth.getGroupInfo(group);
    if (!groupInfo) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
        group: group
      });
    }

    // Check if requesting user has permission to assign this group
    const requesterGroups = req.userGroups || [];
    const requesterLevel = Math.max(...requesterGroups.map(g => {
      const info = groupAuth.getGroupInfo(g);
      return info ? info.level : 0;
    }));

    if (groupInfo.level >= requesterLevel) {
      return res.status(403).json({
        success: false,
        error: 'Cannot assign group with equal or higher privilege level',
        requesterLevel,
        targetLevel: groupInfo.level
      });
    }

    const success = await groupAuth.addUserToGroup(uid, group);
    
    if (success) {
      // Log the action
      console.log(`✅ [GROUP MANAGEMENT] User ${uid} added to group ${group} by ${req.groupAuth?.user?.uid}`);
      
      // Get updated user data
      const updatedGroups = await groupAuth.getUserGroups(uid);
      
      res.json({
        success: true,
        message: `User added to group ${group}`,
        data: {
          uid: uid,
          group: group,
          groups: updatedGroups
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to add user to group'
      });
    }

  } catch (error) {
    console.error('Error adding user to group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add user to group',
      message: error.message
    });
  }
});

/**
 * POST /api/groups/user/:uid/remove
 * Remove user from a group
 */
router.post('/user/:uid/remove', groupAuth.requireAction('user_management'), async (req, res) => {
  try {
    const { uid } = req.params;
    const { group } = req.body;
    
    if (!group) {
      return res.status(400).json({
        success: false,
        error: 'Group name required'
      });
    }

    // Check if requesting user has permission to remove this group
    const groupInfo = groupAuth.getGroupInfo(group);
    if (groupInfo) {
      const requesterGroups = req.userGroups || [];
      const requesterLevel = Math.max(...requesterGroups.map(g => {
        const info = groupAuth.getGroupInfo(g);
        return info ? info.level : 0;
      }));

      if (groupInfo.level >= requesterLevel) {
        return res.status(403).json({
          success: false,
          error: 'Cannot remove group with equal or higher privilege level',
          requesterLevel,
          targetLevel: groupInfo.level
        });
      }
    }

    const success = await groupAuth.removeUserFromGroup(uid, group);
    
    if (success) {
      // Log the action
      console.log(`✅ [GROUP MANAGEMENT] User ${uid} removed from group ${group} by ${req.groupAuth?.user?.uid}`);
      
      // Get updated user data
      const updatedGroups = await groupAuth.getUserGroups(uid);
      
      res.json({
        success: true,
        message: `User removed from group ${group}`,
        data: {
          uid: uid,
          group: group,
          groups: updatedGroups
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to remove user from group'
      });
    }

  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove user from group',
      message: error.message
    });
  }
});

/**
 * POST /api/groups/user/:uid/set
 * Set user's groups (replace all current groups)
 */
router.post('/user/:uid/set', groupAuth.requireAction('user_management'), async (req, res) => {
  try {
    const { uid } = req.params;
    const { groups } = req.body;
    
    if (!Array.isArray(groups)) {
      return res.status(400).json({
        success: false,
        error: 'Groups must be an array'
      });
    }

    // Validate all groups exist
    const invalidGroups = groups.filter(group => !groupAuth.getGroupInfo(group));
    if (invalidGroups.length > 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid groups found',
        invalidGroups: invalidGroups
      });
    }

    // Check if requesting user has permission to assign all these groups
    const requesterGroups = req.userGroups || [];
    const requesterLevel = Math.max(...requesterGroups.map(g => {
      const info = groupAuth.getGroupInfo(g);
      return info ? info.level : 0;
    }));

    const unauthorizedGroups = groups.filter(group => {
      const groupInfo = groupAuth.getGroupInfo(group);
      return groupInfo && groupInfo.level >= requesterLevel;
    });

    if (unauthorizedGroups.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'Cannot assign groups with equal or higher privilege level',
        unauthorizedGroups: unauthorizedGroups,
        requesterLevel
      });
    }

    const success = await groupAuth.setUserGroups(uid, groups);
    
    if (success) {
      // Log the action
      console.log(`✅ [GROUP MANAGEMENT] User ${uid} groups set to [${groups.join(', ')}] by ${req.groupAuth?.user?.uid}`);
      
      res.json({
        success: true,
        message: 'User groups updated',
        data: {
          uid: uid,
          groups: groups,
          permissions: groupAuth.getUserPermissions(groups)
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to set user groups'
      });
    }

  } catch (error) {
    console.error('Error setting user groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set user groups',
      message: error.message
    });
  }
});

/**
 * GET /api/groups/permissions/:action
 * Check which groups can perform a specific action
 */
router.get('/permissions/:action', groupAuth.requireAction('admin_panel_access'), (req, res) => {
  try {
    const { action } = req.params;
    
    const allGroups = groupAuth.getAllGroups();
    const authorizedGroups = allGroups.filter(group => {
      return groupAuth.canPerformAction([group], action);
    });

    res.json({
      success: true,
      data: {
        action: action,
        authorizedGroups: authorizedGroups,
        groupDetails: authorizedGroups.map(group => ({
          name: group,
          info: groupAuth.getGroupInfo(group)
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking action permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check action permissions',
      message: error.message
    });
  }
});

/**
 * GET /api/groups/my-permissions
 * Get current user's groups and permissions
 */
router.get('/my-permissions', async (req, res) => {
  try {
    const user = req.groupAuth?.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const groups = await groupAuth.getUserGroups(user.uid);
    const permissions = groupAuth.getUserPermissions(groups);

    res.json({
      success: true,
      data: {
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name
        },
        groups: groups,
        permissions: permissions,
        groupDetails: groups.map(group => ({
          name: group,
          info: groupAuth.getGroupInfo(group)
        })),
        actions: {
          canManageUsers: groupAuth.canPerformAction(groups, 'user_management'),
          canAccessAdmin: groupAuth.canPerformAction(groups, 'admin_panel_access'),
          canModerateContent: groupAuth.canPerformAction(groups, 'post_moderate'),
          canEditLore: groupAuth.canPerformAction(groups, 'lore_edit'),
          canManageCache: groupAuth.canPerformAction(groups, 'cache_clear')
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user permissions',
      message: error.message
    });
  }
});

module.exports = router;