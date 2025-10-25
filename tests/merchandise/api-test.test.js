const request = require('supertest');

describe('Product Catalog API Test', () => {
    let app;

    beforeAll(() => {
        // Load the app
        app = require('../../app');
    });

    it('should return product catalog data', async () => {
        const response = await request(app)
            .get('/api/product-catalog')
            .expect(200);

        console.log('📦 API Response:', JSON.stringify(response.body, null, 2));

        expect(response.body).toHaveProperty('categories');
        expect(response.body).toHaveProperty('searchIndex');
        expect(Object.keys(response.body.categories).length).toBeGreaterThan(0);
        expect(response.body.searchIndex.length).toBeGreaterThan(0);
    });

    it('should have proper category structure', async () => {
        const response = await request(app)
            .get('/api/product-catalog')
            .expect(200);

        const categories = response.body.categories;
        const firstCategoryKey = Object.keys(categories)[0];
        const firstCategory = categories[firstCategoryKey];

        console.log('🏷️ First Category:', firstCategory);

        expect(firstCategory).toHaveProperty('name');
        expect(firstCategory).toHaveProperty('icon');
        expect(firstCategory).toHaveProperty('subcategories');
        expect(firstCategory).toHaveProperty('productCount');
        expect(firstCategory.productCount).toBeGreaterThan(0);
    });
});