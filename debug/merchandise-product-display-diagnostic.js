/**
 * Merchandise Product Display Bug Diagnostic Tool
 * 
 * Investigates why all products show as t-shirts when Firebase has variety
 * Creates comprehensive report comparing Firebase data vs frontend display
 */

const admin = require('firebase-admin');
const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady 
} = require('../helpers/firebase-admin-utils');

class MerchandiseProductDiagnostic {
  constructor() {
    this.db = null;
    this.testUserId = 'dev-test-user'; // Default test user
    this.diagnosticResults = {
      firebaseData: [],
      processingResults: [],
      issuesFound: [],
      recommendations: []
    };
  }

  async initialize() {
    try {
      if (!isFirebaseAdminReady()) {
        console.log('🔥 Initializing Firebase Admin for diagnostics...');
        initializeFirebaseAdmin();
      }
      
      this.db = getAdminDatabase();
      
      if (!this.db) {
        throw new Error('Failed to get Firebase admin database instance');
      }
      
      console.log('✅ Diagnostic tool initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize diagnostic tool:', error);
      return false;
    }
  }

  async runComprehensiveDiagnostic(userId = null) {
    console.log('🔍 MERCHANDISE PRODUCT DISPLAY BUG DIAGNOSTIC');
    console.log('═══════════════════════════════════════════════');
    
    const targetUserId = userId || this.testUserId;
    console.log(`🎯 Target User ID: ${targetUserId}`);
    
    try {
      // Step 1: Raw Firebase Data Analysis
      console.log('\n📊 STEP 1: Firebase Raw Data Analysis');
      console.log('────────────────────────────────────────');
      await this.analyzeFirebaseData(targetUserId);

      // Step 2: Product Type Extraction Simulation
      console.log('\n🔧 STEP 2: Product Type Extraction Simulation');
      console.log('──────────────────────────────────────────────');
      await this.simulateProductTypeExtraction();

      // Step 3: Frontend Logic Testing
      console.log('\n🖥️ STEP 3: Frontend Logic Testing');
      console.log('────────────────────────────────────────');
      await this.testFrontendLogic();

      // Step 4: Data Integrity Check
      console.log('\n🔒 STEP 4: Data Integrity Check');
      console.log('─────────────────────────────────────');
      await this.checkDataIntegrity();

      // Step 5: Root Cause Analysis
      console.log('\n🎯 STEP 5: Root Cause Analysis');
      console.log('─────────────────────────────────────');
      this.performRootCauseAnalysis();

      // Generate comprehensive report
      this.generateReport();

    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      this.diagnosticResults.issuesFound.push({
        severity: 'CRITICAL',
        category: 'DIAGNOSTIC_FAILURE',
        description: 'Diagnostic tool itself failed to execute',
        error: error.message
      });
    }
  }

  async analyzeFirebaseData(userId) {
    try {
      const userProductsRef = this.db.ref(`merchandise/userProducts/${userId}`);
      const snapshot = await userProductsRef.once('value');
      
      if (!snapshot.exists()) {
        console.log('⚠️ No products found in Firebase for user:', userId);
        this.diagnosticResults.issuesFound.push({
          severity: 'WARNING',
          category: 'NO_DATA',
          description: `No products found in Firebase for user ${userId}`
        });
        return;
      }

      const products = [];
      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        products.push({
          firebaseKey: childSnapshot.key,
          ...product
        });
      });

      this.diagnosticResults.firebaseData = products;
      
      console.log(`📦 Found ${products.length} products in Firebase`);
      
      // Analyze each product
      products.forEach((product, index) => {
        console.log(`\n📋 Product ${index + 1}:`);
        console.log(`   🔑 Firebase Key: ${product.firebaseKey}`);
        console.log(`   🆔 Product ID: ${product.productId || product.id || 'MISSING'}`);
        console.log(`   📝 Title: ${product.title || 'MISSING'}`);
        console.log(`   🏷️ Stored Product Type: ${product.productType || 'MISSING'}`);
        console.log(`   🔧 Blueprint ID: ${product.blueprintId || 'MISSING'}`);
        console.log(`   📊 Variants: ${(product.variants || []).length}`);
        console.log(`   🖼️ Images: ${(product.images || []).length}`);
        
        if (product.variants && product.variants.length > 0) {
          console.log(`   🎯 First Variant Title: ${product.variants[0].title || 'MISSING'}`);
        }
        
        // Check for data integrity issues
        if (!product.productType && (!product.variants || product.variants.length === 0)) {
          this.diagnosticResults.issuesFound.push({
            severity: 'HIGH',
            category: 'MISSING_TYPE_DATA',
            description: `Product ${product.productId} has no productType and no variants to infer from`,
            productId: product.productId || product.id
          });
        }
      });

    } catch (error) {
      console.error('❌ Error analyzing Firebase data:', error);
      this.diagnosticResults.issuesFound.push({
        severity: 'CRITICAL',
        category: 'FIREBASE_READ_ERROR',
        description: 'Failed to read Firebase data',
        error: error.message
      });
    }
  }

  async simulateProductTypeExtraction() {
    // Simulate the frontend extractProductTypeFromProduct method
    this.diagnosticResults.firebaseData.forEach((product, index) => {
      console.log(`\n🔍 Simulating type extraction for Product ${index + 1}:`);
      
      const result = {
        productId: product.productId || product.id,
        originalTitle: product.title,
        storedProductType: product.productType,
        extractedType: null,
        extractionMethod: null
      };

      // Step 1: Check stored productType
      if (product.productType) {
        result.extractedType = product.productType;
        result.extractionMethod = 'stored_productType';
        console.log(`   ✅ Using stored productType: ${product.productType}`);
      }
      // Step 2: Check variants
      else if (product.variants && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        const variantTitle = firstVariant.title?.toLowerCase() || '';
        
        console.log(`   🔍 Analyzing variant title: "${variantTitle}"`);
        
        if (variantTitle.includes('hoodie') || variantTitle.includes('pullover')) {
          result.extractedType = 'hoodie';
          result.extractionMethod = 'variant_title_hoodie';
        } else if (variantTitle.includes('tank') || variantTitle.includes('sleeveless')) {
          result.extractedType = 'tank-top';
          result.extractionMethod = 'variant_title_tank';
        } else if (variantTitle.includes('pillow') || variantTitle.includes('cushion')) {
          result.extractedType = 'pillow';
          result.extractionMethod = 'variant_title_pillow';
        } else if (variantTitle.includes('poster') || variantTitle.includes('print')) {
          result.extractedType = 'poster';
          result.extractionMethod = 'variant_title_poster';
        } else if (variantTitle.includes('mug') || variantTitle.includes('cup')) {
          result.extractedType = 'mug';
          result.extractionMethod = 'variant_title_mug';
        } else {
          // Check blueprint ID
          const blueprintId = product.blueprintId || firstVariant.blueprintId;
          if (blueprintId) {
            const blueprintMap = {
              '5': 'premium-tshirt',
              '146': 'hoodie', 
              '17': 'tank-top',
              '68': 'mug',
              '19': 'poster',
              '71': 'pillow'
            };
            
            if (blueprintMap[blueprintId]) {
              result.extractedType = blueprintMap[blueprintId];
              result.extractionMethod = `blueprint_id_${blueprintId}`;
              console.log(`   🔧 Mapped blueprint ${blueprintId} to ${blueprintMap[blueprintId]}`);
            } else {
              result.extractedType = 'premium-tshirt';
              result.extractionMethod = 'default_fallback';
              console.log(`   ⚠️ Unknown blueprint ${blueprintId}, defaulting to premium-tshirt`);
            }
          } else {
            result.extractedType = 'premium-tshirt';
            result.extractionMethod = 'default_no_blueprint';
            console.log(`   ⚠️ No blueprint ID, defaulting to premium-tshirt`);
          }
        }
      }
      // Step 3: Title analysis fallback
      else {
        const title = product.title?.toLowerCase() || '';
        console.log(`   🔍 Analyzing product title: "${title}"`);
        
        if (title.includes('hoodie')) {
          result.extractedType = 'hoodie';
          result.extractionMethod = 'title_analysis_hoodie';
        } else if (title.includes('mug')) {
          result.extractedType = 'mug';
          result.extractionMethod = 'title_analysis_mug';
        } else {
          result.extractedType = 'premium-tshirt';
          result.extractionMethod = 'title_analysis_default';
        }
      }
      
      console.log(`   🎯 Final extracted type: ${result.extractedType} (via ${result.extractionMethod})`);
      
      // Flag issue if everything defaults to t-shirt
      if (result.extractedType === 'premium-tshirt' && result.extractionMethod.includes('default')) {
        this.diagnosticResults.issuesFound.push({
          severity: 'MEDIUM',
          category: 'TYPE_EXTRACTION_DEFAULT',
          description: `Product ${product.productId} defaulted to t-shirt via ${result.extractionMethod}`,
          productId: product.productId || product.id,
          extractionMethod: result.extractionMethod
        });
      }
      
      this.diagnosticResults.processingResults.push(result);
    });
  }

  async testFrontendLogic() {
    // Test the frontend logic that determines display
    console.log('🖥️ Testing frontend display logic...');
    
    const typeDistribution = {};
    this.diagnosticResults.processingResults.forEach(result => {
      const type = result.extractedType || 'unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });
    
    console.log('📊 Product Type Distribution:');
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} products`);
    });
    
    // Check if everything is showing as t-shirt
    const tshirtCount = typeDistribution['premium-tshirt'] || 0;
    const totalProducts = this.diagnosticResults.processingResults.length;
    
    if (tshirtCount === totalProducts && totalProducts > 1) {
      this.diagnosticResults.issuesFound.push({
        severity: 'HIGH',
        category: 'ALL_TSHIRTS_BUG',
        description: `All ${totalProducts} products are being displayed as t-shirts`,
        typeDistribution
      });
    }
  }

  async checkDataIntegrity() {
    console.log('🔒 Checking data integrity...');
    
    // Check for missing critical data
    this.diagnosticResults.firebaseData.forEach(product => {
      const issues = [];
      
      if (!product.productType && (!product.variants || product.variants.length === 0)) {
        issues.push('Missing productType and variants for type inference');
      }
      
      if (!product.blueprintId && product.variants && product.variants.length > 0 && !product.variants[0].blueprintId) {
        issues.push('Missing blueprint ID on product and first variant');
      }
      
      if (!product.title) {
        issues.push('Missing product title');
      }
      
      if (issues.length > 0) {
        this.diagnosticResults.issuesFound.push({
          severity: 'MEDIUM',
          category: 'DATA_INTEGRITY',
          description: `Product ${product.productId} has data integrity issues`,
          productId: product.productId || product.id,
          issues
        });
      }
    });
  }

  performRootCauseAnalysis() {
    console.log('🎯 Performing root cause analysis...');
    
    const issues = this.diagnosticResults.issuesFound;
    const highSeverityIssues = issues.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL');
    
    console.log(`\n📊 Issue Summary:`);
    console.log(`   🔴 Critical: ${issues.filter(i => i.severity === 'CRITICAL').length}`);
    console.log(`   🟠 High: ${issues.filter(i => i.severity === 'HIGH').length}`);
    console.log(`   🟡 Medium: ${issues.filter(i => i.severity === 'MEDIUM').length}`);
    console.log(`   🔵 Warning: ${issues.filter(i => i.severity === 'WARNING').length}`);
    
    // Analyze patterns
    const typeExtractionDefaults = issues.filter(i => i.category === 'TYPE_EXTRACTION_DEFAULT');
    const allTshirtsBug = issues.find(i => i.category === 'ALL_TSHIRTS_BUG');
    
    if (allTshirtsBug) {
      console.log(`\n🚨 ROOT CAUSE IDENTIFIED: All products showing as t-shirts`);
      this.diagnosticResults.recommendations.push({
        priority: 'HIGH',
        action: 'Fix product type extraction logic',
        description: 'The extractProductTypeFromProduct method is defaulting everything to premium-tshirt'
      });
    }
    
    if (typeExtractionDefaults.length > 0) {
      console.log(`\n⚠️ ${typeExtractionDefaults.length} products are using default fallback logic`);
      this.diagnosticResults.recommendations.push({
        priority: 'MEDIUM',
        action: 'Improve type detection',
        description: 'Products are falling back to default t-shirt type instead of proper detection'
      });
    }
  }

  generateReport() {
    console.log('\n📋 COMPREHENSIVE DIAGNOSTIC REPORT');
    console.log('═══════════════════════════════════════');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalProducts: this.diagnosticResults.firebaseData.length,
        issuesFound: this.diagnosticResults.issuesFound.length,
        recommendations: this.diagnosticResults.recommendations.length
      },
      ...this.diagnosticResults
    };
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Products in Firebase: ${report.summary.totalProducts}`);
    console.log(`   Issues found: ${report.summary.issuesFound}`);
    console.log(`   Recommendations: ${report.summary.recommendations}`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority}] ${rec.action}`);
      console.log(`      ${rec.description}`);
    });
    
    console.log('\n📄 Full report saved to diagnostic results');
    return report;
  }
}

// Run diagnostic if called directly
async function runDiagnostic() {
  const diagnostic = new MerchandiseProductDiagnostic();
  
  if (await diagnostic.initialize()) {
    // Check for user ID in command line arguments
    const userId = process.argv[2] || 'test-user-123';
    await diagnostic.runComprehensiveDiagnostic(userId);
  } else {
    console.error('❌ Failed to initialize diagnostic tool');
    process.exit(1);
  }
}

if (require.main === module) {
  runDiagnostic().catch(error => {
    console.error('❌ Diagnostic execution failed:', error);
    process.exit(1);
  });
}

module.exports = { MerchandiseProductDiagnostic };