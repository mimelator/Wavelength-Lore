/**
 * Test suite for Prompt API endpoints
 * Tests all CRUD operations and filtering capabilities
 */

const request = require('supertest');
const express = require('express');
const promptApi = require('../routes/promptApi');
const { setDatabaseInstance } = require('../helpers/firebase-admin-utils');

// Mock Firebase Admin SDK
jest.mock('../helpers/firebase-admin-utils');
jest.mock('../helpers/prompt-helpers');

// Mock the groupAuth middleware
jest.mock('../middleware/groupAuth', () => ({
  requireGroup: jest.fn(() => (req, res, next) => next())
}));

describe('Prompt API Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware with proper user data structure
    app.use((req, res, next) => {
      req.user = {
        uid: 'test-user-123',
        groups: ['admin'],
        // Add to req.userData which is what groupAuth checks
        userData: {
          groups: ['admin'],
          role: 'admin'
        }
      };
      // Also set req.userData directly as that's what groupAuth middleware uses
      req.userData = {
        uid: 'test-user-123',
        groups: ['admin'],
        role: 'admin'
      };
      next();
    });

    app.use('/api/prompts', promptApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/prompts', () => {
    it('should return all prompts', async () => {
      const mockPrompts = [
        {
          id: 'test-prompt-1',
          title: 'Test Prompt 1',
          category: 'character',
          isActive: true
        },
        {
          id: 'test-prompt-2',
          title: 'Test Prompt 2',
          category: 'location',
          isActive: true
        }
      ];

      require('../helpers/prompt-helpers').getAllPrompts.mockResolvedValue(mockPrompts);

      const response = await request(app).get('/api/prompts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should filter prompts by category', async () => {
      const mockPrompts = [
        {
          id: 'test-prompt-1',
          title: 'Test Prompt 1',
          category: 'character',
          isActive: true
        }
      ];

      require('../helpers/prompt-helpers').getAllPrompts.mockResolvedValue(mockPrompts);

      const response = await request(app).get('/api/prompts?category=character');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.filters.category).toBe('character');
    });

    it('should filter prompts by character', async () => {
      const mockPrompts = [
        {
          id: 'test-prompt-1',
          title: 'Test Prompt 1',
          linkedCharacters: ['andrew'],
          isActive: true
        }
      ];

      require('../helpers/prompt-helpers').getAllPrompts.mockResolvedValue(mockPrompts);

      const response = await request(app).get('/api/prompts?character=andrew');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/prompts/:id', () => {
    it('should return a single prompt by ID', async () => {
      const mockPrompt = {
        id: 'test-prompt-1',
        title: 'Test Prompt 1',
        category: 'character',
        isActive: true
      };

      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(mockPrompt);

      const response = await request(app).get('/api/prompts/test-prompt-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-prompt-1');
    });

    it('should return 404 for non-existent prompt', async () => {
      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(null);

      const response = await request(app).get('/api/prompts/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/prompts/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = ['character', 'location', 'scene'];

      require('../helpers/prompt-helpers').getPromptCategories.mockResolvedValue(mockCategories);

      const response = await request(app).get('/api/prompts/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });
  });

  describe('GET /api/prompts/tags', () => {
    it('should return all tags', async () => {
      const mockTags = ['performance', 'magical', 'realistic'];

      require('../helpers/prompt-helpers').getPromptTags.mockResolvedValue(mockTags);

      const response = await request(app).get('/api/prompts/tags');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });
  });

  describe('POST /api/prompts', () => {
    it('should create a new prompt', async () => {
      const newPrompt = {
        id: 'new-prompt',
        title: 'New Prompt',
        content: 'Test content',
        category: 'character',
        keywords: ['test'],
        tags: ['performance']
      };

      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(null);
      require('../helpers/firebase-admin-utils').writeDataAsAdmin.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/prompts')
        .send(newPrompt);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('new-prompt');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidPrompt = {
        id: 'test'
        // Missing title and content
      };

      const response = await request(app)
        .post('/api/prompts')
        .send(invalidPrompt);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 if prompt already exists', async () => {
      const existingPrompt = {
        id: 'existing-prompt',
        title: 'Existing Prompt',
        content: 'Test content'
      };

      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue({ id: 'existing-prompt' });

      const response = await request(app)
        .post('/api/prompts')
        .send(existingPrompt);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/prompts/:id', () => {
    it('should update an existing prompt', async () => {
      const existingPrompt = {
        id: 'test-prompt',
        title: 'Old Title',
        content: 'Old content',
        version: 1
      };

      const updates = {
        title: 'New Title',
        content: 'New content'
      };

      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(existingPrompt);
      require('../helpers/firebase-admin-utils').writeDataAsAdmin.mockResolvedValue(true);

      const response = await request(app)
        .put('/api/prompts/test-prompt')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Title');
      expect(response.body.data.version).toBe(2);
    });

    it('should return 404 for non-existent prompt', async () => {
      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/prompts/non-existent')
        .send({ title: 'New Title' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/prompts/:id', () => {
    it('should soft delete a prompt', async () => {
      const existingPrompt = {
        id: 'test-prompt',
        title: 'Test Prompt',
        isActive: true
      };

      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(existingPrompt);
      require('../helpers/firebase-admin-utils').writeDataAsAdmin.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/prompts/test-prompt');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('should hard delete a prompt when requested', async () => {
      const existingPrompt = {
        id: 'test-prompt',
        title: 'Test Prompt',
        isActive: true
      };

      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(existingPrompt);
      require('../helpers/firebase-admin-utils').deleteDataAsAdmin.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/prompts/test-prompt?hard=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('permanently deleted');
    });
  });

  describe('POST /api/prompts/:id/restore', () => {
    it('should restore a soft-deleted prompt', async () => {
      const deletedPrompt = {
        id: 'test-prompt',
        title: 'Test Prompt',
        isActive: false
      };

      require('../helpers/firebase-admin-utils').fetchDataAsAdmin.mockResolvedValue(deletedPrompt);
      require('../helpers/firebase-admin-utils').writeDataAsAdmin.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/prompts/test-prompt/restore');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should return 400 if prompt is not deleted', async () => {
      const activePrompt = {
        id: 'test-prompt',
        title: 'Test Prompt',
        isActive: true
      };

      require('../helpers/firebase-admin-utils').fetchDataAsAdmin.mockResolvedValue(activePrompt);

      const response = await request(app)
        .post('/api/prompts/test-prompt/restore');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/prompts/:id/link', () => {
    it('should add links to a prompt', async () => {
      const existingPrompt = {
        id: 'test-prompt',
        linkedCharacters: ['andrew'],
        linkedEpisodes: [],
        linkedLore: []
      };

      const linksToAdd = {
        characters: ['jewel'],
        episodes: ['my-lucky-charm'],
        lore: ['the-shire']
      };

      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(existingPrompt);
      require('../helpers/firebase-admin-utils').writeDataAsAdmin.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/prompts/test-prompt/link')
        .send(linksToAdd);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.linkedCharacters).toContain('jewel');
      expect(response.body.data.linkedEpisodes).toContain('my-lucky-charm');
    });
  });

  describe('DELETE /api/prompts/:id/link', () => {
    it('should remove links from a prompt', async () => {
      const existingPrompt = {
        id: 'test-prompt',
        linkedCharacters: ['andrew', 'jewel'],
        linkedEpisodes: ['my-lucky-charm'],
        linkedLore: ['the-shire']
      };

      const linksToRemove = {
        characters: ['jewel'],
        episodes: ['my-lucky-charm']
      };

      require('../helpers/prompt-helpers').getPromptById.mockResolvedValue(existingPrompt);
      require('../helpers/firebase-admin-utils').writeDataAsAdmin.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/prompts/test-prompt/link')
        .send(linksToRemove);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.linkedCharacters).not.toContain('jewel');
      expect(response.body.data.linkedEpisodes).not.toContain('my-lucky-charm');
    });
  });
});
