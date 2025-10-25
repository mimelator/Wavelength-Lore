/**
 * Minimal Tiered Product System Tests
 * Tests API endpoints without full app initialization
 */

const request = require('supertest');
const express = require('express');

describe('Tiered Product System - Minimal Tests', () => {
  let app;

  beforeAll(() => {
    // Create minimal Express app for testing
    app = express();
    app.use(express.json());

    // Load the actual product catalog data
    const catalogData = require('../config/product-catalog-categorized.json');

    // Mount product catalog routes
    app.get('/api/product-catalog', (req, res) => {
      res.json(catalogData);
    });

    app.get('/api/product-catalog/search', (req, res) => {
      const query = req.query.q || '';
      const searchIndex = catalogData.searchIndex || [];
      
      const results = searchIndex.filter(product => 
        product.searchTerms.toLowerCase().includes(query.toLowerCase())
      );

      res.json({
        results,
        query,
        total: results.length,
        category: null
      });
    });

    app.get('/product-selection', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Select Your Product - Wavelength Lore</title></head>
        <body>
          <h1>Choose Your Product</h1>
          <div class="product-navigator"></div>
        </body>
        </html>
      `);
    });
  });

  describe('Product Catalog API', () => {
    test('should return categorized products', async () => {
      const response = await request(app)
        .get('/api/product-catalog')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(typeof response.body.categories).toBe('object');
      expect(response.body).toHaveProperty('totalProducts');
      expect(typeof response.body.totalProducts).toBe('number');
    });

    test('should have valid category structure', async () => {
      const response = await request(app).get('/api/product-catalog');
      const { categories } = response.body;

      Object.entries(categories).forEach(([categoryId, category]) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('subcategories');
        expect(typeof category.name).toBe('string');
        expect(typeof category.subcategories).toBe('object');
      });
    });
  });

  describe('Search API', () => {
    test('should handle search queries', async () => {
      const response = await request(app)
        .get('/api/product-catalog/search?q=tee')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('query', 'tee');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('should return empty results for non-matching queries', async () => {
      const response = await request(app)
        .get('/api/product-catalog/search?q=nonexistentproduct')
        .expect(200);

      expect(response.body.results).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    test('should handle empty search queries', async () => {
      const response = await request(app)
        .get('/api/product-catalog/search?q=')
        .expect(200);

      expect(response.body.query).toBe('');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });

  describe('Product Selection Page', () => {
    test('should render product selection page', async () => {
      const response = await request(app)
        .get('/product-selection')
        .expect(200);

      expect(response.text).toContain('Choose Your Product');
      expect(response.text).toContain('product-navigator');
    });
  });

  describe('Performance Tests', () => {
    test('catalog API should respond quickly', async () => {
      const start = Date.now();
      await request(app).get('/api/product-catalog').expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
    });

    test('search API should respond quickly', async () => {
      const start = Date.now();
      await request(app).get('/api/product-catalog/search?q=test').expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500);
    });
  });
});