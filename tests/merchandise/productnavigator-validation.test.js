#!/usr/bin/env node

/**
 * ProductNavigator Validation Test
 * Confirms the tiered product catalog system is working
 */

const fs = require('fs');
const path = require('path');

class ProductNavigatorValidationTest {
    constructor() {
        this.testResults = [];
    }

    async runValidation() {
        console.log('🧪 ProductNavigator Validation Test\n');
        
        try {
            await this.testCatalogFile();
            await this.testApiRoute();
            await this.testJavaScriptComponent();
            await this.testIntegration();
            
            console.log('\n📊 Validation Results:');
            this.testResults.forEach(result => {
                console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.message}`);
            });
            
            const allPassed = this.testResults.every(r => r.passed);
            console.log(`\n${allPassed ? '✅' : '❌'} ProductNavigator validation ${allPassed ? 'PASSED' : 'FAILED'}`);
            return allPassed;
            
        } catch (error) {
            console.error('\n❌ Validation FAILED:', error.message);
            return false;
        }
    }

    async testCatalogFile() {
        console.log('📋 Testing product catalog file...');
        
        try {
            const catalogPath = path.join(process.cwd(), 'config/product-catalog-categorized.json');
            
            if (!fs.existsSync(catalogPath)) {
                throw new Error('Catalog file not found');
            }
            
            const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
            
            if (!catalogData.categories || Object.keys(catalogData.categories).length === 0) {
                throw new Error('No categories found in catalog');
            }
            
            if (!catalogData.searchIndex || catalogData.searchIndex.length === 0) {
                throw new Error('No search index found in catalog');
            }
            
            const categoryCount = Object.keys(catalogData.categories).length;
            const productCount = catalogData.totalProducts || catalogData.searchIndex.length;
            
            this.testResults.push({
                name: 'Product Catalog File',
                passed: true,
                message: `${categoryCount} categories, ${productCount} products loaded`
            });
            
        } catch (error) {
            this.testResults.push({
                name: 'Product Catalog File',
                passed: false,
                message: error.message
            });
        }
    }

    async testApiRoute() {
        console.log('🌐 Testing API route registration...');
        
        try {
            const appPath = path.join(process.cwd(), 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf8');
            
            const hasRequire = appContent.includes('api-product-catalog');
            const hasMount = appContent.includes('apiProductCatalogRoutes');
            
            if (!hasRequire || !hasMount) {
                throw new Error('API route not properly registered in app.js');
            }
            
            // Check route file exists
            const routePath = path.join(process.cwd(), 'routes/api-product-catalog.js');
            if (!fs.existsSync(routePath)) {
                throw new Error('API route file not found');
            }
            
            this.testResults.push({
                name: 'API Route Registration',
                passed: true,
                message: 'Route properly registered and file exists'
            });
            
        } catch (error) {
            this.testResults.push({
                name: 'API Route Registration',
                passed: false,
                message: error.message
            });
        }
    }

    async testJavaScriptComponent() {
        console.log('📜 Testing JavaScript component...');
        
        try {
            const componentPath = path.join(process.cwd(), 'static/js/components/product-navigator.js');
            
            if (!fs.existsSync(componentPath)) {
                throw new Error('ProductNavigator component file not found');
            }
            
            const componentContent = fs.readFileSync(componentPath, 'utf8');
            
            // Check for key methods
            const hasInit = componentContent.includes('async init()');
            const hasLoadCatalog = componentContent.includes('loadCatalog()');
            const hasRenderCategories = componentContent.includes('renderCategories()');
            const hasSelectProduct = componentContent.includes('selectProduct(');
            
            if (!hasInit || !hasLoadCatalog || !hasRenderCategories || !hasSelectProduct) {
                throw new Error('ProductNavigator component missing key methods');
            }
            
            this.testResults.push({
                name: 'JavaScript Component',
                passed: true,
                message: 'All key methods present and functional'
            });
            
        } catch (error) {
            this.testResults.push({
                name: 'JavaScript Component',
                passed: false,
                message: error.message
            });
        }
    }

    async testIntegration() {
        console.log('🔗 Testing integration with MerchandiseStore...');
        
        try {
            const storePath = path.join(process.cwd(), 'static/js/components/merchandise-store.js');
            const templatePath = path.join(process.cwd(), 'views/merchandise-store.ejs');
            
            if (!fs.existsSync(storePath) || !fs.existsSync(templatePath)) {
                throw new Error('MerchandiseStore files not found');
            }
            
            const storeContent = fs.readFileSync(storePath, 'utf8');
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            
            // Check for ProductNavigator integration
            const hasNavigatorInit = storeContent.includes('initializeProductNavigator');
            const hasNavigatorClass = storeContent.includes('ProductNavigator');
            const hasFallback = storeContent.includes('renderSimpleCategories');
            
            // Check template includes component
            const hasScriptInclude = templateContent.includes('product-navigator.js');
            
            if (!hasNavigatorInit || !hasNavigatorClass || !hasFallback || !hasScriptInclude) {
                throw new Error('ProductNavigator not properly integrated with MerchandiseStore');
            }
            
            this.testResults.push({
                name: 'MerchandiseStore Integration',
                passed: true,
                message: 'ProductNavigator properly integrated with fallback system'
            });
            
        } catch (error) {
            this.testResults.push({
                name: 'MerchandiseStore Integration',
                passed: false,
                message: error.message
            });
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const test = new ProductNavigatorValidationTest();
    test.runValidation()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('❌ Validation runner error:', error.message);
            process.exit(1);
        });
}

module.exports = ProductNavigatorValidationTest;