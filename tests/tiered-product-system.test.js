/**
 * Tiered Product System API Test Suite
 * Tests all API endpoints and functionality for the product catalog system
 */

const request = require('supertest');
const { createApp } = require('../app');

describe('Tiered Product System API Tests', () => {
  let app;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('Product Catalog API', () => {
    test('GET /api/product-catalog should return categorized products', async () => {
      const response = await request(app)
        .get('/api/product-catalog')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
      
      // Check category structure
      const category = response.body.categories[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('subcategories');
      expect(Array.isArray(category.subcategories)).toBe(true);
    });

    test('GET /api/product-catalog/:categoryId should return category products', async () => {
      // First get categories
      const catalogResponse = await request(app).get('/api/product-catalog');
      const categoryId = catalogResponse.body.categories[0].id;

      const response = await request(app)
        .get(`/api/product-catalog/${categoryId}`)
        .expect(200);

      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('subcategories');
      expect(response.body.category.id).toBe(categoryId);
    });

    test('GET /api/product-catalog/search should handle search queries', async () => {
      const response = await request(app)
        .get('/api/product-catalog/search?q=shirt')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body).toHaveProperty('query', 'shirt');
    });

    test('GET /api/product-catalog/search should handle empty queries', async () => {
      const response = await request(app)
        .get('/api/product-catalog/search?q=')
        .expect(200);

      expect(response.body.results).toEqual([]);
    });

    test('GET /api/product-catalog/invalid-category should return 404', async () => {
      await request(app)
        .get('/api/product-catalog/invalid-category-id')
        .expect(404);
    });
  });

  describe('Product Selection Page', () => {
    test('GET /product-selection should render page successfully', async () => {
      const response = await request(app)
        .get('/product-selection')
        .expect(200);

      expect(response.text).toContain('Choose Your Product');
      expect(response.text).toContain('product-navigator');
    });
  });

  describe('API Performance', () => {
    test('Product catalog API should respond within 2 seconds', async () => {
      const start = Date.now();
      await request(app).get('/api/product-catalog').expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });

    test('Search API should respond within 1 second', async () => {
      const start = Date.now();
      await request(app).get('/api/product-catalog/search?q=test').expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Data Validation', () => {
    test('Product catalog should have valid structure', async () => {
      const response = await request(app).get('/api/product-catalog');
      const { categories } = response.body;

      categories.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('subcategories');
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(Array.isArray(category.subcategories)).toBe(true);

        category.subcategories.forEach(subcategory => {
          expect(subcategory).toHaveProperty('id');
          expect(subcategory).toHaveProperty('name');
          expect(subcategory).toHaveProperty('products');
          expect(Array.isArray(subcategory.products)).toBe(true);

          subcategory.products.forEach(product => {
            expect(product).toHaveProperty('blueprintId');
            expect(product).toHaveProperty('printProviderId');
            expect(product).toHaveProperty('title');
            expect(typeof product.blueprintId).toBe('number');
            expect(typeof product.printProviderId).toBe('number');
            expect(typeof product.title).toBe('string');
          });
        });
      });
    });
  });
});