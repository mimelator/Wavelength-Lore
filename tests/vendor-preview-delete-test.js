/**
 * Test: Vendor Preview Delete Functionality
 * 
 * This test validates the delete preview functionality to detect the 404 bug
 * and ensure proper error handling and logging.
 */

const assert = require('assert');
const fetch = require('node-fetch');

class VendorPreviewDeleteTest {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, type, message });
  }

  async validateDeleteEndpoint() {
    this.log('🧪 Testing DELETE /admin/vendor-research/delete-preview endpoint...');
    
    try {
      // Test 1: Check if endpoint exists (should return 405 Method Not Allowed or similar, not 404)
      const response = await fetch(`${this.baseUrl}/admin/vendor-research/delete-preview`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cacheKey: 'test-key' })
      });

      this.log(`DELETE endpoint response status: ${response.status}`);
      this.log(`DELETE endpoint response headers: ${JSON.stringify([...response.headers.entries()])}`);

      if (response.status === 404) {
        this.log('❌ BUG DETECTED: DELETE endpoint returns 404 - route does not exist!', 'error');
        return { success: false, error: 'DELETE endpoint not found (404)', status: response.status };
      }

      // Test 2: Check response content
      const responseText = await response.text();
      this.log(`DELETE endpoint response body: ${responseText.substring(0, 200)}...`);

      return { success: true, status: response.status, body: responseText };

    } catch (error) {
      this.log(`❌ Error testing DELETE endpoint: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async validateRouteRegistration() {
    this.log('🔍 Checking route registration in admin-vendor-research.js...');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
      const routePath = path.join(__dirname, '../routes/admin-vendor-research.js');
      const routeContent = fs.readFileSync(routePath, 'utf8');
      
      // Check if delete-preview route exists
      const hasDeleteRoute = routeContent.includes('delete-preview') || routeContent.includes('/delete-preview');
      this.log(`Delete route found in file: ${hasDeleteRoute}`);
      
      // Check for DELETE method
      const hasDeleteMethod = routeContent.includes('router.delete');
      this.log(`DELETE method found in file: ${hasDeleteMethod}`);
      
      // Find all routes with delete-preview
      const deleteRouteMatches = routeContent.match(/router\.(delete|post|get).*delete-preview/g);
      this.log(`Delete-preview route matches: ${JSON.stringify(deleteRouteMatches)}`);
      
      return {
        success: true,
        hasDeleteRoute,
        hasDeleteMethod,
        routeMatches: deleteRouteMatches
      };
      
    } catch (error) {
      this.log(`❌ Error checking route file: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async validateCatalogJavaScript() {
    this.log('🔍 Checking catalog JavaScript delete function...');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
      const templatePath = path.join(__dirname, '../views/admin/vendor-preview-catalog.ejs');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Check if deletePreview function exists
      const hasDeleteFunction = templateContent.includes('deletePreview') || templateContent.includes('delete-preview');
      this.log(`Delete function found in template: ${hasDeleteFunction}`);
      
      // Find the delete function implementation
      const deleteFunctionMatch = templateContent.match(/function\s+deletePreview[^}]+}/s);
      if (deleteFunctionMatch) {
        this.log(`Delete function implementation found: ${deleteFunctionMatch[0].substring(0, 200)}...`);
      }
      
      // Check fetch URL in delete function
      const fetchUrlMatch = templateContent.match(/fetch\([^)]*delete-preview[^)]*\)/);
      if (fetchUrlMatch) {
        this.log(`Delete fetch URL: ${fetchUrlMatch[0]}`);
      }
      
      return {
        success: true,
        hasDeleteFunction,
        functionImplementation: deleteFunctionMatch ? deleteFunctionMatch[0] : null,
        fetchUrl: fetchUrlMatch ? fetchUrlMatch[0] : null
      };
      
    } catch (error) {
      this.log(`❌ Error checking template file: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async validateMerchandiseDatabaseMethod() {
    this.log('🔍 Checking MerchandiseDatabase deleteVendorPreview method...');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
      const dbPath = path.join(__dirname, '../services/merchandise-database.js');
      const dbContent = fs.readFileSync(dbPath, 'utf8');
      
      // Check if deleteVendorPreview method exists
      const hasDeleteMethod = dbContent.includes('deleteVendorPreview');
      this.log(`deleteVendorPreview method found: ${hasDeleteMethod}`);
      
      // Find the method implementation
      const methodMatch = dbContent.match(/deleteVendorPreview[^}]+}/s);
      if (methodMatch) {
        this.log(`Delete method implementation found: ${methodMatch[0].substring(0, 200)}...`);
      }
      
      return {
        success: true,
        hasDeleteMethod,
        methodImplementation: methodMatch ? methodMatch[0] : null
      };
      
    } catch (error) {
      this.log(`❌ Error checking database file: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runFullDiagnostic() {
    this.log('🚀 Starting comprehensive vendor preview delete diagnostic...');
    
    const results = {
      endpoint: await this.validateDeleteEndpoint(),
      routes: await this.validateRouteRegistration(),
      frontend: await this.validateCatalogJavaScript(),
      database: await this.validateMerchandiseDatabaseMethod()
    };
    
    this.log('📊 Diagnostic Summary:');
    this.log(`   - Endpoint test: ${results.endpoint.success ? '✅' : '❌'}`);
    this.log(`   - Route registration: ${results.routes.success ? '✅' : '❌'}`);
    this.log(`   - Frontend JavaScript: ${results.frontend.success ? '✅' : '❌'}`);
    this.log(`   - Database method: ${results.database.success ? '✅' : '❌'}`);
    
    // Identify likely issue
    if (!results.endpoint.success && results.endpoint.status === 404) {
      this.log('🔍 DIAGNOSIS: Delete endpoint returns 404 - route likely not properly registered or mounted');
    }
    
    return results;
  }

  getTestResults() {
    return {
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: this.testResults.filter(r => r.type === 'error').length === 0 ? 'PASS' : 'FAIL'
    };
  }
}

// Export for use in other tests
module.exports = VendorPreviewDeleteTest;

// Run test if executed directly
if (require.main === module) {
  (async () => {
    const test = new VendorPreviewDeleteTest();
    await test.runFullDiagnostic();
    
    const results = test.getTestResults();
    console.log('\n📋 FINAL TEST RESULTS:');
    console.log(JSON.stringify(results, null, 2));
    
    process.exit(results.summary === 'PASS' ? 0 : 1);
  })();
}