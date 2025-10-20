/**
 * Group Management System Test Suite
 * Tests for API endpoints, middleware, and route rendering
 */

const request = require('supertest');
const express = require('express');
const { groupAuth } = require('../middleware/groupAuth');
const groupApiRouter = require('../routes/groupApi');

// Mock Firebase Admin Utils
jest.mock('../helpers/firebase-admin-utils', () => ({
  fetchDataAsAdmin: jest.fn(),
  updateDataAsAdmin: jest.fn()
}));

const { fetchDataAsAdmin, updateDataAsAdmin } = require('../helpers/firebase-admin-utils');

describe('Group Management System Tests', () => {
  let app;

  beforeAll(() => {
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Add test middleware to simulate authenticated user
    app.use((req, res, next) => {
      req.user = {
        uid: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
      };
      next();
    });
    
    // Add group API routes
    app.use('/api/groups', groupApiRouter);
    
    // Add test routes for middleware testing
    app.get('/test/admin', groupAuth.requireGroup('admin'), (req, res) => {
      res.json({ success: true, message: 'Admin access granted', user: req.groupAuth.user });
    });
    
    app.get('/test/moderator', groupAuth.requireGroup(['moderator', 'admin']), (req, res) => {
      res.json({ success: true, message: 'Moderator access granted' });
    });
    
    app.get('/test/permission', groupAuth.requirePermission('lore_edit'), (req, res) => {
      res.json({ success: true, message: 'Permission granted' });
    });
    
    app.get('/test/action', groupAuth.requireAction('user_management'), (req, res) => {
      res.json({ success: true, message: 'Action allowed' });
    });
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    fetchDataAsAdmin.mockImplementation((path) => {
      if (path === 'forum/users/test-user-123') {
        return Promise.resolve({
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          groups: ['admin']
        });
      }
      if (path === 'forum/users') {
        return Promise.resolve({
          'test-user-123': {
            uid: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            groups: ['admin']
          },
          'test-user-456': {
            uid: 'test-user-456',
            email: 'user@example.com',
            displayName: 'Regular User',
            groups: ['user']
          }
        });
      }
      return Promise.resolve(null);
    });
    
    updateDataAsAdmin.mockResolvedValue(true);
  });

  describe('Group Hierarchy API', () => {
    test('GET /api/groups/hierarchy should return group hierarchy', async () => {
      const response = await request(app)
        .get('/api/groups/hierarchy')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('admin');
      expect(response.body.data).toHaveProperty('moderator');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.admin.level).toBe(90);
      expect(response.body.data.admin.permissions).toContain('user_management');
    });

    test('Group hierarchy should have proper inheritance', () => {
      const hierarchy = groupAuth.getGroupHierarchy();
      
      expect(hierarchy.admin.inherits).toContain('moderator');
      expect(hierarchy.moderator.inherits).toContain('trusted_user');
      expect(hierarchy.trusted_user.inherits).toContain('verified_user');
    });
  });

  describe('User Groups API', () => {
    test('GET /api/groups/user/:uid should return user groups', async () => {
      const response = await request(app)
        .get('/api/groups/user/test-user-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groups).toContain('admin');
      expect(response.body.data.permissions).toContain('user_management');
    });

    test('GET /api/groups/users/:group should return users in group', async () => {
      const response = await request(app)
        .get('/api/groups/users/admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].uid).toBe('test-user-123');
    });

    test('POST /api/groups/user/:uid/add should add user to group', async () => {
      const response = await request(app)
        .post('/api/groups/user/test-user-456/add')
        .send({ group: 'moderator' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('added to group moderator');
      expect(updateDataAsAdmin).toHaveBeenCalled();
    });

    test('POST /api/groups/user/:uid/remove should remove user from group', async () => {
      const response = await request(app)
        .post('/api/groups/user/test-user-123/remove')
        .send({ group: 'user' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed from group user');
      expect(updateDataAsAdmin).toHaveBeenCalled();
    });

    test('POST /api/groups/user/:uid/set should set user groups', async () => {
      const response = await request(app)
        .post('/api/groups/user/test-user-456/set')
        .send({ groups: ['verified_user', 'trusted_user'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groups).toContain('verified_user');
      expect(response.body.data.groups).toContain('trusted_user');
      expect(updateDataAsAdmin).toHaveBeenCalled();
    });
  });

  describe('Permissions API', () => {
    test('GET /api/groups/my-permissions should return current user permissions', async () => {
      const response = await request(app)
        .get('/api/groups/my-permissions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.uid).toBe('test-user-123');
      expect(response.body.data.groups).toContain('admin');
      expect(response.body.data.actions.canManageUsers).toBe(true);
      expect(response.body.data.actions.canAccessAdmin).toBe(true);
    });

    test('GET /api/groups/permissions/:action should return authorized groups', async () => {
      const response = await request(app)
        .get('/api/groups/permissions/user_management')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authorizedGroups).toContain('admin');
      expect(response.body.data.authorizedGroups).toContain('super_admin');
    });
  });

  describe('Group Authentication Middleware', () => {
    test('requireGroup should allow admin access to admin route', async () => {
      const response = await request(app)
        .get('/test/admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
    });

    test('requireGroup should allow admin access to moderator route (inheritance)', async () => {
      const response = await request(app)
        .get('/test/moderator')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Moderator access granted');
    });

    test('requirePermission should work for lore_edit permission', async () => {
      const response = await request(app)
        .get('/test/permission')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Permission granted');
    });

    test('requireAction should work for user_management action', async () => {
      const response = await request(app)
        .get('/test/action')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Action allowed');
    });
  });

  describe('Group Logic Tests', () => {
    test('checkGroupAccess should work with direct group membership', () => {
      const userGroups = ['admin'];
      const requiredGroups = ['admin'];
      const hasAccess = groupAuth.checkGroupAccess(userGroups, requiredGroups);
      expect(hasAccess).toBe(true);
    });

    test('checkGroupAccess should work with inheritance', () => {
      const userGroups = ['admin'];
      const requiredGroups = ['moderator'];
      const hasAccess = groupAuth.checkGroupAccess(userGroups, requiredGroups);
      expect(hasAccess).toBe(true);
    });

    test('hasPermission should work for admin wildcard', () => {
      const userGroups = ['super_admin'];
      const hasPermission = groupAuth.hasPermission(userGroups, 'any_permission');
      expect(hasPermission).toBe(true);
    });

    test('canPerformAction should work correctly', () => {
      const userGroups = ['admin'];
      const canPerform = groupAuth.canPerformAction(userGroups, 'user_management');
      expect(canPerform).toBe(true);
    });

    test('getUserPermissions should include inherited permissions', () => {
      const userGroups = ['admin'];
      const permissions = groupAuth.getUserPermissions(userGroups);
      expect(permissions).toContain('user_management');
      expect(permissions).toContain('content_moderation'); // inherited from moderator
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid group name gracefully', async () => {
      const response = await request(app)
        .post('/api/groups/user/test-user-456/add')
        .send({ group: 'invalid_group' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Group not found');
    });

    test('should handle missing group parameter', async () => {
      const response = await request(app)
        .post('/api/groups/user/test-user-456/add')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Group name required');
    });

    test('should handle privilege level restrictions', async () => {
      // Mock user with lower privilege
      fetchDataAsAdmin.mockImplementation((path) => {
        if (path === 'forum/users/test-user-123') {
          return Promise.resolve({
            uid: 'test-user-123',
            email: 'test@example.com',
            groups: ['moderator'] // Lower than admin
          });
        }
        return Promise.resolve(null);
      });

      const response = await request(app)
        .post('/api/groups/user/test-user-456/add')
        .send({ group: 'admin' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot assign group with equal or higher privilege level');
    });
  });

  describe('Security Tests', () => {
    test('should deny access without proper authentication', async () => {
      // Create app without auth middleware
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/groups', groupApiRouter);

      const response = await request(noAuthApp)
        .get('/api/groups/hierarchy')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });

    test('should prevent unauthorized group assignments', async () => {
      // Mock user with no admin privileges
      fetchDataAsAdmin.mockImplementation((path) => {
        if (path === 'forum/users/test-user-123') {
          return Promise.resolve({
            uid: 'test-user-123',
            email: 'test@example.com',
            groups: ['user']
          });
        }
        return Promise.resolve(null);
      });

      const response = await request(app)
        .post('/api/groups/user/test-user-456/add')
        .send({ group: 'admin' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

module.exports = {
  // Export test utilities for integration tests
  createTestApp: (authMiddleware = null) => {
    const testApp = express();
    testApp.use(express.json());
    
    if (authMiddleware) {
      testApp.use(authMiddleware);
    }
    
    testApp.use('/api/groups', groupApiRouter);
    return testApp;
  }
};