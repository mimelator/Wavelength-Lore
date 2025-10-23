/**
 * Merchandise Integration Test
 * 
 * Quick test to verify all components of the Printify merchandise
 * integration are working correctly.
 */

// Initialize Firebase for testing (if not already initialized)
const admin = require('firebase-admin');
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../firebaseServiceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://wavelength-lore-default-rtdb.firebaseio.com'
    });
    console.log('🔥 Firebase initialized for testing');
  } catch (error) {
    console.log('⚠️  Firebase initialization skipped (service account not found)');
  }
}

const PrintifyService = require('../services/printify-service');

async function testPrintifyIntegration() {
  console.log('🧪 Testing Printify Integration...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Helper function for test reporting
  function runTest(testName, testFunction) {
    totalTests++;
    try {
      const result = testFunction();
      if (result) {
        console.log(`✅ ${testName}`);
        passedTests++;
      } else {
        console.log(`❌ ${testName}`);
      }
    } catch (error) {
      console.log(`❌ ${testName} - Error: ${error.message}`);
    }
  }
  
  // Test 1: Required Files Exist
  runTest('Printify Service File Exists', () => {
    const fs = require('fs');
    return fs.existsSync('./services/printify-service.js');
  });
  
  runTest('Merchandise Database File Exists', () => {
    const fs = require('fs');
    return fs.existsSync('./services/merchandise-database.js');
  });
  
  runTest('Configuration File Exists', () => {
    const fs = require('fs');
    return fs.existsSync('./config/printify-config.js');
  });
  
  runTest('Frontend Component Exists', () => {
    const fs = require('fs');
    return fs.existsSync('./static/js/components/merchandise-store.js');
  });
  
  runTest('EJS Template Exists', () => {
    const fs = require('fs');
    return fs.existsSync('./views/merchandise-store.ejs');
  });
  
  runTest('CSS Styles Exist', () => {
    const fs = require('fs');
    return fs.existsSync('./static/css/merchandise-store.css');
  });
  
  // Test 2: Environment Configuration
  runTest('Environment Variables Set', () => {
    return process.env.PRINTIFY_API_TOKEN && 
           process.env.PRINTIFY_SHOP_ID &&
           process.env.PRINTIFY_ENVIRONMENT;
  });
  
  // Test 3: Configuration File Loading
  runTest('Printify Configuration Loading', () => {
    const { PrintifyConfig } = require('../config/printify-config');
    return PrintifyConfig.api && PrintifyConfig.products;
  });
  
  // Test 4: Service Initialization
  runTest('Printify Service Initialization', () => {
    const printifyService = new PrintifyService();
    return printifyService && typeof printifyService.uploadImage === 'function';
  });
  
  // Test 5: Database Service (only if Firebase is available)
  if (admin.apps.length > 0) {
    runTest('Database Service Initialization', () => {
      const merchandiseDB = require('../services/merchandise-database');
      return merchandiseDB && typeof merchandiseDB.storeUserProduct === 'function';
    });
  } else {
    console.log('⚠️  Skipping database test (Firebase not initialized)');
  }
  
  // Test 6: Routes File
  runTest('Merchandise Routes File Exists', () => {
    const fs = require('fs');
    return fs.existsSync('./routes/merchandise.js');
  });
  
  // API connectivity test only if environment is configured
  if (process.env.PRINTIFY_API_TOKEN && process.env.PRINTIFY_SHOP_ID) {
    console.log('\n🔌 Testing API Connectivity...');
    
    try {
      const printifyService = new PrintifyService();
      
      const testAPICall = async () => {
        try {
          const response = await printifyService.printifyRequest('GET', '/shops.json');
          return response && Array.isArray(response);
        } catch (error) {
          console.log(`❌ API Connectivity - Error: ${error.message}`);
          return false;
        }
      };
      
      testAPICall().then(result => {
        totalTests++;
        if (result) {
          console.log('✅ API Connectivity');
          passedTests++;
        } else {
          console.log('❌ API Connectivity');
        }
        
        printTestSummary();
      }).catch(error => {
        totalTests++;
        console.log(`❌ API Connectivity - Error: ${error.message}`);
        printTestSummary();
      });
      
    } catch (error) {
      totalTests++;
      console.log(`❌ API Connectivity Test Failed - Error: ${error.message}`);
      printTestSummary();
    }
  } else {
    console.log('\n⚠️  Skipping API connectivity test (credentials not configured)');
    printTestSummary();
  }
  
  function printTestSummary() {
    console.log('\n📊 Test Summary:');
    console.log(`Passed: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All available tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check configuration and setup.');
    }
    
    console.log('\n📝 Setup Status:');
    
    if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID) {
      console.log('❌ Printify credentials not configured');
      console.log('   → Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID in .env file');
      console.log('   → See docs/PRINTIFY_SETUP.md for detailed instructions');
    } else {
      console.log('✅ Printify credentials configured');
    }
    
    if (!admin.apps.length) {
      console.log('❌ Firebase not initialized');
      console.log('   → Check firebaseServiceAccountKey.json exists');
    } else {
      console.log('✅ Firebase initialized');
    }
    
    console.log('🚀 Next Steps:');
    console.log('1. Complete setup using docs/PRINTIFY_SETUP.md');
    console.log('2. Start the application: npm run dev');
    console.log('3. Visit /merchandise to test the full workflow');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPrintifyIntegration().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testPrintifyIntegration };

// Run the test if this file is executed directly
if (require.main === module) {
  testPrintifyIntegration().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testPrintifyIntegration };