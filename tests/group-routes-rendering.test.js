/**
 * Group Management Route Rendering Tests
 * Tests that group management routes work and return valid responses
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

describe('Group Management Route Tests', () => {
  let app;

  beforeAll(() => {
    // Create test Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = {
        uid: 'test-user-123',
        email: 'admin@example.com',
        displayName: 'Test Admin'
      };
      next();
    });

    // Use group API routes
    app.use('/api/groups', groupApiRouter);
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    fetchDataAsAdmin.mockImplementation((path) => {
      if (path === 'forum/users/test-user-123') {
        return Promise.resolve({
          uid: 'test-user-123',
          email: 'admin@example.com',
          displayName: 'Test Admin',
          groups: ['admin']
        });
      }
      if (path === 'forum/users') {
        return Promise.resolve({
          'test-user-123': {
            uid: 'test-user-123',
            email: 'admin@example.com',
            displayName: 'Test Admin',
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

    test('hasPermission should work for admin permissions', () => {
      const userGroups = ['admin'];
      const hasPermission = groupAuth.hasPermission(userGroups, 'user_management');
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
      expect(permissions).toContain('content_moderation');
    });
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