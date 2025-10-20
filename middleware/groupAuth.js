/**
 * Group-Based Access Control Middleware
 * Extends the existing admin auth with flexible group membership controls
 */

const { fetchDataAsAdmin, updateDataAsAdmin } = require('../helpers/firebase-admin-utils');

class GroupAuthentication {
  constructor() {
    // Define available groups and their hierarchical permissions
    this.groupHierarchy = {
      'super_admin': {
        level: 100,
        permissions: ['*'], // All permissions
        description: 'Super Administrator - Full system access',
        inherits: []
      },
      'admin': {
        level: 90,
        permissions: [
          'user_management',
          'content_moderation', 
          'system_config',
          'backup_management',
          'cache_management',
          'security_logs'
        ],
        description: 'Administrator - High-level system access',
        inherits: ['moderator', 'content_manager']
      },
      'moderator': {
        level: 70,
        permissions: [
          'content_moderation',
          'user_warnings',
          'post_edit',
          'post_delete',
          'user_timeout'
        ],
        description: 'Moderator - Content and user moderation',
        inherits: ['trusted_user']
      },
      'content_manager': {
        level: 60,
        permissions: [
          'lore_edit',
          'character_edit',
          'episode_edit',
          'content_publish',
          'media_upload'
        ],
        description: 'Content Manager - Lore and content management',
        inherits: ['trusted_user']
      },
      'trusted_user': {
        level: 50,
        permissions: [
          'forum_post',
          'forum_reply',
          'profile_edit',
          'direct_message',
          'file_upload_small'
        ],
        description: 'Trusted User - Enhanced forum privileges',
        inherits: ['verified_user']
      },
      'verified_user': {
        level: 30,
        permissions: [
          'forum_read',
          'forum_post_limited',
          'profile_view',
          'basic_interaction'
        ],
        description: 'Verified User - Basic forum access',
        inherits: ['user']
      },
      'user': {
        level: 10,
        permissions: [
          'forum_read',
          'profile_view_own',
          'basic_read'
        ],
        description: 'User - Read-only access',
        inherits: []
      },
      'guest': {
        level: 0,
        permissions: [
          'public_read'
        ],
        description: 'Guest - Public content only',
        inherits: []
      }
    };

    // Define action-to-permission mappings
    this.actionPermissions = {
      // Admin panel access
      'admin_panel_access': ['admin', 'super_admin'],
      'user_management': ['admin', 'super_admin'],
      'system_settings': ['super_admin'],
      
      // Content management
      'lore_create': ['content_manager', 'admin', 'super_admin'],
      'lore_edit': ['content_manager', 'admin', 'super_admin'],
      'lore_delete': ['admin', 'super_admin'],
      'character_create': ['content_manager', 'admin', 'super_admin'],
      'character_edit': ['content_manager', 'admin', 'super_admin'],
      'character_delete': ['admin', 'super_admin'],
      
      // Forum moderation
      'post_moderate': ['moderator', 'admin', 'super_admin'],
      'post_delete_any': ['moderator', 'admin', 'super_admin'],
      'user_ban': ['moderator', 'admin', 'super_admin'],
      'user_warn': ['moderator', 'admin', 'super_admin'],
      
      // User actions
      'post_create': ['verified_user', 'trusted_user', 'moderator', 'content_manager', 'admin', 'super_admin'],
      'post_edit_own': ['verified_user', 'trusted_user', 'moderator', 'content_manager', 'admin', 'super_admin'],
      'post_delete_own': ['verified_user', 'trusted_user', 'moderator', 'content_manager', 'admin', 'super_admin'],
      'reply_create': ['verified_user', 'trusted_user', 'moderator', 'content_manager', 'admin', 'super_admin'],
      
      // System operations
      'cache_clear': ['admin', 'super_admin'],
      'backup_create': ['admin', 'super_admin'],
      'backup_restore': ['super_admin'],
      'security_logs': ['admin', 'super_admin']
    };

    this.userGroupCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main group authentication middleware
   * Usage: app.use('/admin', groupAuth.requireGroup('admin'))
   */
  requireGroup = (requiredGroups, options = {}) => {
    if (typeof requiredGroups === 'string') {
      requiredGroups = [requiredGroups];
    }

    return async (req, res, next) => {
      try {
        const user = await this.getAuthenticatedUser(req);
        
        if (!user) {
          return this.respondUnauthorized(res, 'Authentication required');
        }

        const userGroups = await this.getUserGroups(user.uid);
        const hasAccess = this.checkGroupAccess(userGroups, requiredGroups);

        if (!hasAccess) {
          this.logAccessDenied(user, requiredGroups, userGroups);
          return this.respondForbidden(res, `Access denied. Required groups: ${requiredGroups.join(', ')}`);
        }

        // Add group context to request
        req.userGroups = userGroups;
        req.groupAuth = {
          user: user,
          groups: userGroups,
          hasGroup: (group) => userGroups.includes(group),
          hasPermission: (permission) => this.hasPermission(userGroups, permission),
          canPerform: (action) => this.canPerformAction(userGroups, action)
        };

        this.logAccessGranted(user, requiredGroups, userGroups);
        next();

      } catch (error) {
        console.error('Group authentication error:', error);
        res.status(500).json({
          success: false,
          error: 'Authentication system error',
          timestamp: new Date().toISOString()
        });
      }
    };
  };

  /**
   * Permission-based middleware
   * Usage: app.use('/admin/lore', groupAuth.requirePermission('lore_edit'))
   */
  requirePermission = (requiredPermissions, options = {}) => {
    if (typeof requiredPermissions === 'string') {
      requiredPermissions = [requiredPermissions];
    }

    return async (req, res, next) => {
      try {
        const user = await this.getAuthenticatedUser(req);
        
        if (!user) {
          return this.respondUnauthorized(res, 'Authentication required');
        }

        const userGroups = await this.getUserGroups(user.uid);
        const hasPermission = requiredPermissions.some(permission => 
          this.hasPermission(userGroups, permission)
        );

        if (!hasPermission) {
          this.logAccessDenied(user, requiredPermissions, userGroups);
          return this.respondForbidden(res, `Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
        }

        // Add group context to request
        req.userGroups = userGroups;
        req.groupAuth = {
          user: user,
          groups: userGroups,
          hasGroup: (group) => userGroups.includes(group),
          hasPermission: (permission) => this.hasPermission(userGroups, permission),
          canPerform: (action) => this.canPerformAction(userGroups, action)
        };

        next();

      } catch (error) {
        console.error('Permission authentication error:', error);
        res.status(500).json({
          success: false,
          error: 'Authentication system error',
          timestamp: new Date().toISOString()
        });
      }
    };
  };

  /**
   * Action-based middleware
   * Usage: app.use('/admin/users', groupAuth.requireAction('user_management'))
   */
  requireAction = (action, options = {}) => {
    return async (req, res, next) => {
      try {
        const user = await this.getAuthenticatedUser(req);
        
        if (!user) {
          return this.respondUnauthorized(res, 'Authentication required');
        }

        const userGroups = await this.getUserGroups(user.uid);
        const canPerform = this.canPerformAction(userGroups, action);

        if (!canPerform) {
          this.logAccessDenied(user, [action], userGroups);
          return this.respondForbidden(res, `Access denied. Cannot perform action: ${action}`);
        }

        // Add group context to request
        req.userGroups = userGroups;
        req.groupAuth = {
          user: user,
          groups: userGroups,
          hasGroup: (group) => userGroups.includes(group),
          hasPermission: (permission) => this.hasPermission(userGroups, permission),
          canPerform: (action) => this.canPerformAction(userGroups, action)
        };

        next();

      } catch (error) {
        console.error('Action authentication error:', error);
        res.status(500).json({
          success: false,
          error: 'Authentication system error',
          timestamp: new Date().toISOString()
        });
      }
    };
  };

  /**
   * Get authenticated user from request
   */
  async getAuthenticatedUser(req) {
    // Check if user is already authenticated by Firebase Auth middleware
    if (req.user) {
      return req.user;
    }

    // Try to get from Firebase Auth header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const admin = require('firebase-admin');
        const decodedToken = await admin.app('admin').auth().verifyIdToken(token);
        return {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          emailVerified: decodedToken.email_verified
        };
      } catch (error) {
        console.error('Token verification failed:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Get user groups from Firebase
   */
  async getUserGroups(uid) {
    // Check cache first
    const cacheKey = `groups_${uid}`;
    const cached = this.userGroupCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.groups;
    }

    try {
      // Fetch user data from Firebase
      const userData = await fetchDataAsAdmin(`forum/users/${uid}`);
      
      if (!userData) {
        // New user - assign default group
        const defaultGroups = ['user'];
        await this.setUserGroups(uid, defaultGroups);
        return defaultGroups;
      }

      // Get groups with proper fallback logic
      let groups;
      if (userData.groups && Array.isArray(userData.groups)) {
        groups = userData.groups;
      } else if (userData.role) {
        groups = [userData.role];
      } else {
        groups = ['user'];
      }
      
      console.log(`🔍 User ${uid} groups:`, groups, '(from userData.groups:', userData.groups, ', userData.role:', userData.role, ')');
      
      // Cache the result
      this.userGroupCache.set(cacheKey, {
        groups,
        timestamp: Date.now()
      });

      return groups;

    } catch (error) {
      console.error('Error fetching user groups:', error);
      return ['user']; // Default fallback
    }
  }

  /**
   * Set user groups
   */
  async setUserGroups(uid, groups) {
    try {
      await updateDataAsAdmin(`forum/users/${uid}`, {
        groups: groups,
        role: groups[0] || 'user', // Backward compatibility
        updatedAt: new Date().toISOString()
      });

      // Clear cache
      this.userGroupCache.delete(`groups_${uid}`);
      
      return true;
    } catch (error) {
      console.error('Error setting user groups:', error);
      return false;
    }
  }

  /**
   * Check if user groups have access to required groups
   */
  checkGroupAccess(userGroups, requiredGroups) {
    return requiredGroups.some(requiredGroup => {
      // Direct group match
      if (userGroups.includes(requiredGroup)) {
        return true;
      }

      // Check if any user group inherits the required group
      return userGroups.some(userGroup => {
        const group = this.groupHierarchy[userGroup];
        return group && this.groupInherits(group, requiredGroup);
      });
    });
  }

  /**
   * Check if a group inherits another group
   */
  groupInherits(group, targetGroup) {
    if (!group.inherits) return false;
    
    // Direct inheritance
    if (group.inherits.includes(targetGroup)) {
      return true;
    }

    // Recursive inheritance
    return group.inherits.some(inheritedGroup => {
      const inherited = this.groupHierarchy[inheritedGroup];
      return inherited && this.groupInherits(inherited, targetGroup);
    });
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userGroups, permission) {
    return userGroups.some(group => {
      const groupDef = this.groupHierarchy[group];
      if (!groupDef) return false;

      // Check for wildcard permission
      if (groupDef.permissions.includes('*')) {
        return true;
      }

      // Check direct permission
      return groupDef.permissions.includes(permission);
    });
  }

  /**
   * Check if user can perform action
   */
  canPerformAction(userGroups, action) {
    const requiredGroups = this.actionPermissions[action];
    if (!requiredGroups) {
      console.warn(`Unknown action: ${action}`);
      return false;
    }

    return this.checkGroupAccess(userGroups, requiredGroups);
  }

  /**
   * Get all permissions for user groups
   */
  getUserPermissions(userGroups) {
    const permissions = new Set();
    
    userGroups.forEach(group => {
      const groupDef = this.groupHierarchy[group];
      if (groupDef) {
        groupDef.permissions.forEach(permission => permissions.add(permission));
        
        // Add inherited permissions
        if (groupDef.inherits) {
          const inheritedPermissions = this.getUserPermissions(groupDef.inherits);
          inheritedPermissions.forEach(permission => permissions.add(permission));
        }
      }
    });

    return Array.from(permissions);
  }

  /**
   * Response helpers
   */
  respondUnauthorized(res, message) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  respondForbidden(res, message) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logging helpers
   */
  logAccessGranted(user, requiredGroups, userGroups) {
    console.log(`✅ [GROUP AUTH] Access granted - User: ${user.uid}, Required: [${requiredGroups.join(', ')}], User Groups: [${userGroups.join(', ')}]`);
  }

  logAccessDenied(user, requiredGroups, userGroups) {
    console.warn(`❌ [GROUP AUTH] Access denied - User: ${user.uid}, Required: [${requiredGroups.join(', ')}], User Groups: [${userGroups.join(', ')}]`);
  }

  /**
   * Management API methods
   */
  async addUserToGroup(uid, group) {
    const currentGroups = await this.getUserGroups(uid);
    if (!currentGroups.includes(group)) {
      const newGroups = [...currentGroups, group];
      return await this.setUserGroups(uid, newGroups);
    }
    return true;
  }

  async removeUserFromGroup(uid, group) {
    const currentGroups = await this.getUserGroups(uid);
    const newGroups = currentGroups.filter(g => g !== group);
    return await this.setUserGroups(uid, newGroups);
  }

  async getUsersByGroup(group) {
    try {
      const users = await fetchDataAsAdmin('forum/users');
      if (!users) return [];

      return Object.entries(users)
        .filter(([uid, userData]) => {
          const groups = userData.groups || (userData.role ? [userData.role] : ['user']);
          return groups.includes(group);
        })
        .map(([uid, userData]) => ({
          uid,
          ...userData,
          groups: userData.groups || (userData.role ? [userData.role] : ['user'])
        }));
    } catch (error) {
      console.error('Error fetching users by group:', error);
      return [];
    }
  }

  /**
   * Get group information
   */
  getGroupInfo(groupName) {
    return this.groupHierarchy[groupName] || null;
  }

  getAllGroups() {
    return Object.keys(this.groupHierarchy);
  }

  getGroupHierarchy() {
    return this.groupHierarchy;
  }
}

// Create singleton instance
const groupAuth = new GroupAuthentication();

module.exports = {
  groupAuth,
  requireGroup: groupAuth.requireGroup,
  requirePermission: groupAuth.requirePermission,
  requireAction: groupAuth.requireAction,
  GroupAuthentication
};