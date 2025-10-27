#!/usr/bin/env node

console.log('🌊 WAVELENGTH CTA FRONTEND INTEGRATION TEST SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const fs = require('fs');
const path = require('path');

/**
 * Test Suite for CTA Integration Validation
 */
class CTAIntegrationTester {
  constructor() {
    this.results = {
      character: { tested: 0, enhanced: 0, issues: [] },
      lore: { tested: 0, enhanced: 0, issues: [] },
      templates: { found: 0, enhanced: 0, issues: [] }
    };
  }

  /**
   * Test character template enhancements
   */
  testCharacterTemplate() {
    console.log('\n🎭 TESTING CHARACTER TEMPLATE ENHANCEMENTS...');
    
    const characterTemplate = path.join(__dirname, 'views', 'character.ejs');
    
    if (!fs.existsSync(characterTemplate)) {
      this.results.character.issues.push('Character template not found');
      return;
    }

    const template = fs.readFileSync(characterTemplate, 'utf8');
    this.results.templates.found++;

    // Test for tagline integration
    if (template.includes('character.tagline')) {
      console.log('  ✅ Tagline integration: FOUND');
      this.results.character.enhanced++;
    } else {
      console.log('  ❌ Tagline integration: MISSING');
      this.results.character.issues.push('Tagline integration not found');
    }

    // Test for stakes integration
    if (template.includes('character.stakes')) {
      console.log('  ✅ Stakes display: FOUND');
      this.results.character.enhanced++;
    } else {
      console.log('  ❌ Stakes display: MISSING');
      this.results.character.issues.push('Stakes display not found');
    }

    // Test for custom CTA text
    if (template.includes('character.cta_text')) {
      console.log('  ✅ Custom CTA text: FOUND');
      this.results.character.enhanced++;
    } else {
      console.log('  ❌ Custom CTA text: MISSING');
      this.results.character.issues.push('Custom CTA text not found');
    }

    // Test for enhanced styling
    if (template.includes('character-tagline') || template.includes('character-stakes')) {
      console.log('  ✅ Enhanced styling: FOUND');
      this.results.character.enhanced++;
    } else {
      console.log('  ❌ Enhanced styling: MISSING');
      this.results.character.issues.push('Enhanced styling not found');
    }

    this.results.character.tested = 4;
    this.results.templates.enhanced++;
  }

  /**
   * Test lore template enhancements
   */
  testLoreTemplate() {
    console.log('\n📚 TESTING LORE TEMPLATE ENHANCEMENTS...');
    
    const loreTemplate = path.join(__dirname, 'views', 'lore.ejs');
    
    if (!fs.existsSync(loreTemplate)) {
      this.results.lore.issues.push('Lore template not found');
      return;
    }

    const template = fs.readFileSync(loreTemplate, 'utf8');
    this.results.templates.found++;

    // Test for intrigue hook integration
    if (template.includes('lore.intrigue_hook')) {
      console.log('  ✅ Intrigue hook integration: FOUND');
      this.results.lore.enhanced++;
    } else {
      console.log('  ❌ Intrigue hook integration: MISSING');
      this.results.lore.issues.push('Intrigue hook integration not found');
    }

    // Test for mystery level display
    if (template.includes('lore.mystery_level')) {
      console.log('  ✅ Mystery level display: FOUND');
      this.results.lore.enhanced++;
    } else {
      console.log('  ❌ Mystery level display: MISSING');
      this.results.lore.issues.push('Mystery level display not found');
    }

    // Test for investigation CTA
    if (template.includes('lore.investigation_cta')) {
      console.log('  ✅ Investigation CTA: FOUND');
      this.results.lore.enhanced++;
    } else {
      console.log('  ❌ Investigation CTA: MISSING');
      this.results.lore.issues.push('Investigation CTA not found');
    }

    // Test for enhanced mystery styling
    if (template.includes('lore-intrigue-hook') || template.includes('lore-cta-section')) {
      console.log('  ✅ Mystery-themed styling: FOUND');
      this.results.lore.enhanced++;
    } else {
      console.log('  ❌ Mystery-themed styling: MISSING');
      this.results.lore.issues.push('Mystery-themed styling not found');
    }

    this.results.lore.tested = 4;
    this.results.templates.enhanced++;
  }

  /**
   * Test Firebase schema integration
   */
  async testFirebaseIntegration() {
    console.log('\n🔥 TESTING FIREBASE SCHEMA INTEGRATION...');
    
    try {
      // Use our existing validation test
      const https = require('https');
      
      const testData = await new Promise((resolve, reject) => {
        const url = 'https://wavelength-lore-default-rtdb.firebaseio.com/characters/alex.json';
        https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          });
        }).on('error', reject);
      });

      if (testData) {
        console.log('  ✅ Firebase connection: ACTIVE');
        console.log('  ✅ Character data: ACCESSIBLE');
        
        if (testData.tagline) {
          console.log('  ✅ Tagline field: POPULATED');
          console.log(`    📝 Sample: "${testData.tagline}"`);
        }
        
        if (testData.stakes) {
          console.log('  ✅ Stakes field: POPULATED');
        }
        
        if (testData.cta_text) {
          console.log('  ✅ CTA text field: POPULATED');
          console.log(`    🎯 Sample: "${testData.cta_text}"`);
        }
      }
      
    } catch (error) {
      console.log('  ❌ Firebase integration test failed:', error.message);
      this.results.character.issues.push(`Firebase integration error: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n🎉 CTA INTEGRATION TEST RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Character results
    console.log(`\n🎭 CHARACTER TEMPLATE RESULTS:`);
    console.log(`  📊 Tests Run: ${this.results.character.tested}`);
    console.log(`  ✅ Enhancements Found: ${this.results.character.enhanced}`);
    console.log(`  ❌ Issues: ${this.results.character.issues.length}`);
    
    if (this.results.character.issues.length > 0) {
      this.results.character.issues.forEach(issue => {
        console.log(`    • ${issue}`);
      });
    }

    // Lore results
    console.log(`\n📚 LORE TEMPLATE RESULTS:`);
    console.log(`  📊 Tests Run: ${this.results.lore.tested}`);
    console.log(`  ✅ Enhancements Found: ${this.results.lore.enhanced}`);
    console.log(`  ❌ Issues: ${this.results.lore.issues.length}`);
    
    if (this.results.lore.issues.length > 0) {
      this.results.lore.issues.forEach(issue => {
        console.log(`    • ${issue}`);
      });
    }

    // Overall results
    const totalTests = this.results.character.tested + this.results.lore.tested;
    const totalEnhancements = this.results.character.enhanced + this.results.lore.enhanced;
    const totalIssues = this.results.character.issues.length + this.results.lore.issues.length;
    
    console.log(`\n🌊 OVERALL INTEGRATION STATUS:`);
    console.log(`  📋 Total Tests: ${totalTests}`);
    console.log(`  ✅ Successful Integrations: ${totalEnhancements}`);
    console.log(`  ❌ Total Issues: ${totalIssues}`);
    console.log(`  📈 Success Rate: ${Math.round((totalEnhancements / totalTests) * 100)}%`);
    
    if (totalIssues === 0) {
      console.log('\n🎉 ALL CTA INTEGRATIONS SUCCESSFUL! Frontend ready for enhanced user experience!');
    } else {
      console.log(`\n⚠️  ${totalIssues} issues found. Review template integrations for complete CTA functionality.`);
    }
  }

  /**
   * Run complete test suite
   */
  async runTests() {
    this.testCharacterTemplate();
    this.testLoreTemplate();
    await this.testFirebaseIntegration();
    this.generateReport();
  }
}

// Run the test suite
const tester = new CTAIntegrationTester();
tester.runTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});