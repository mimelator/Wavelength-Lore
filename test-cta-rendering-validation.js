#!/usr/bin/env node

console.log('🌊 WAVELENGTH CTA RENDERING VALIDATION TEST SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Comprehensive CTA Rendering Validation Test
 */
class CTARenderingValidator {
  constructor() {
    this.results = {
      characterTemplates: { found: 0, validated: 0, issues: [] },
      loreTemplates: { found: 0, validated: 0, issues: [] },
      ctaLocations: { tested: 0, rendered: 0, issues: [] },
      firebaseData: { characters: 0, populated: 0, issues: [] }
    };
    
    this.ctaLocations = [
      {
        name: 'Character Banner Taglines',
        template: 'character.ejs',
        selector: 'character-tagline',
        field: 'character.tagline',
        description: 'Elegant tagline overlay on character banner'
      },
      {
        name: 'Character Stakes Display',
        template: 'character.ejs', 
        selector: 'character-stakes',
        field: 'character.stakes',
        description: '⚔️ The Stakes section with authentic challenges'
      },
      {
        name: 'Character CTA Buttons',
        template: 'character.ejs',
        selector: 'character.cta_text',
        field: 'character.cta_text',
        description: 'Custom CTA button text like "Discover Alex\'s Journey!"'
      },
      {
        name: 'Lore Intrigue Hooks',
        template: 'lore.ejs',
        selector: 'lore-intrigue-hook',
        field: 'lore.intrigue_hook', 
        description: 'Mystery-themed overlay with investigation prompts'
      },
      {
        name: 'Lore Mystery Levels',
        template: 'lore.ejs',
        selector: 'lore.mystery_level',
        field: 'lore.mystery_level',
        description: 'Mystery level indicators with 🌟 styling'
      },
      {
        name: 'Lore Investigation CTAs',
        template: 'lore.ejs',
        selector: 'lore.investigation_cta',
        field: 'lore.investigation_cta',
        description: 'Custom investigation call-to-action buttons'
      }
    ];
  }

  /**
   * Test character template CTA rendering locations
   */
  testCharacterCTALocations() {
    console.log('\n🎭 TESTING CHARACTER CTA RENDERING LOCATIONS...');
    
    const characterTemplate = path.join(__dirname, 'views', 'character.ejs');
    
    if (!fs.existsSync(characterTemplate)) {
      this.results.characterTemplates.issues.push('Character template not found');
      return;
    }

    const template = fs.readFileSync(characterTemplate, 'utf8');
    this.results.characterTemplates.found++;

    // Test each character CTA location
    const characterLocations = this.ctaLocations.filter(loc => loc.template === 'character.ejs');
    
    characterLocations.forEach(location => {
      this.results.ctaLocations.tested++;
      
      if (template.includes(location.field)) {
        console.log(`  ✅ ${location.name}: FOUND`);
        console.log(`     📍 Location: ${location.description}`);
        this.results.ctaLocations.rendered++;
        this.results.characterTemplates.validated++;
      } else {
        console.log(`  ❌ ${location.name}: MISSING`);
        this.results.ctaLocations.issues.push(`${location.name} not found in template`);
        this.results.characterTemplates.issues.push(`Missing ${location.name}`);
      }
    });

    // Test for enhanced styling classes
    const stylingClasses = ['character-tagline', 'character-stakes', 'wavelength-character'];
    let stylingFound = 0;
    
    stylingClasses.forEach(className => {
      if (template.includes(className)) {
        stylingFound++;
      }
    });
    
    if (stylingFound > 0) {
      console.log(`  ✅ Enhanced Styling: ${stylingFound}/${stylingClasses.length} classes found`);
    } else {
      console.log('  ❌ Enhanced Styling: No custom styling classes found');
      this.results.characterTemplates.issues.push('Missing enhanced styling classes');
    }
  }

  /**
   * Test lore template CTA rendering locations
   */
  testLoreCTALocations() {
    console.log('\n📚 TESTING LORE CTA RENDERING LOCATIONS...');
    
    const loreTemplate = path.join(__dirname, 'views', 'lore.ejs');
    
    if (!fs.existsSync(loreTemplate)) {
      this.results.loreTemplates.issues.push('Lore template not found');
      return;
    }

    const template = fs.readFileSync(loreTemplate, 'utf8');
    this.results.loreTemplates.found++;

    // Test each lore CTA location
    const loreLocations = this.ctaLocations.filter(loc => loc.template === 'lore.ejs');
    
    loreLocations.forEach(location => {
      this.results.ctaLocations.tested++;
      
      if (template.includes(location.field)) {
        console.log(`  ✅ ${location.name}: FOUND`);
        console.log(`     📍 Location: ${location.description}`);
        this.results.ctaLocations.rendered++;
        this.results.loreTemplates.validated++;
      } else {
        console.log(`  ❌ ${location.name}: MISSING`);
        this.results.ctaLocations.issues.push(`${location.name} not found in template`);
        this.results.loreTemplates.issues.push(`Missing ${location.name}`);
      }
    });

    // Test for mystery-themed styling
    const mysteryElements = ['lore-intrigue-hook', 'lore-cta-section', 'Mystery Level', '🔍', '🕵️‍♀️'];
    let mysteryFound = 0;
    
    mysteryElements.forEach(element => {
      if (template.includes(element)) {
        mysteryFound++;
      }
    });
    
    if (mysteryFound > 0) {
      console.log(`  ✅ Mystery Theming: ${mysteryFound}/${mysteryElements.length} elements found`);
    } else {
      console.log('  ❌ Mystery Theming: No mystery-themed elements found');
      this.results.loreTemplates.issues.push('Missing mystery-themed styling');
    }
  }

  /**
   * Test Firebase data population for CTA fields
   */
  async testFirebaseDataPopulation() {
    console.log('\n🔥 TESTING FIREBASE CTA DATA POPULATION...');
    
    try {
      // Test multiple characters to validate data consistency
      const testCharacters = ['alex', 'andrew', 'daphne'];
      
      for (const characterId of testCharacters) {
        const characterData = await this.fetchFirebaseData(`characters/${characterId}`);
        this.results.firebaseData.characters++;
        
        if (characterData) {
          console.log(`\n  🎭 Testing ${characterId.toUpperCase()} character data:`);
          
          // Test tagline
          if (characterData.tagline) {
            console.log(`    ✅ Tagline: "${characterData.tagline}"`);
            this.results.firebaseData.populated++;
          } else {
            console.log(`    ❌ Tagline: MISSING`);
            this.results.firebaseData.issues.push(`${characterId} missing tagline`);
          }
          
          // Test stakes
          if (characterData.stakes) {
            console.log(`    ✅ Stakes: ${characterData.stakes.length} chars`);
            this.results.firebaseData.populated++;
          } else {
            console.log(`    ❌ Stakes: MISSING`);
            this.results.firebaseData.issues.push(`${characterId} missing stakes`);
          }
          
          // Test CTA text
          if (characterData.cta_text) {
            console.log(`    ✅ CTA Text: "${characterData.cta_text}"`);
            this.results.firebaseData.populated++;
          } else {
            console.log(`    ❌ CTA Text: MISSING`);
            this.results.firebaseData.issues.push(`${characterId} missing cta_text`);
          }
        } else {
          console.log(`  ❌ ${characterId.toUpperCase()}: No data found`);
          this.results.firebaseData.issues.push(`${characterId} data not accessible`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Firebase data test failed: ${error.message}`);
      this.results.firebaseData.issues.push(`Firebase error: ${error.message}`);
    }
  }

  /**
   * Test specific CTA content examples
   */
  testSpecificCTAExamples() {
    console.log('\n🎯 TESTING SPECIFIC CTA CONTENT EXAMPLES...');
    
    const expectedContent = [
      {
        character: 'alex',
        tagline: 'Whispers of Harmony, Secrets in the Strings',
        cta: 'Discover Alex\'s Journey!'
      },
      {
        character: 'andrew', 
        tagline: 'Melodies of a Prince, Shadows of Betrayal',
        cta: 'Discover Andrew\'s Journey!'
      },
      {
        character: 'daphne',
        tagline: 'Drummer of Destiny, Heart of the Shire',
        cta: 'Discover Daphne\'s Journey!'
      }
    ];

    expectedContent.forEach(async (expected) => {
      try {
        const data = await this.fetchFirebaseData(`characters/${expected.character}`);
        
        if (data && data.tagline && data.tagline.includes(expected.tagline.split(',')[0])) {
          console.log(`  ✅ ${expected.character.toUpperCase()}: Tagline matches expected pattern`);
        } else {
          console.log(`  ⚠️  ${expected.character.toUpperCase()}: Tagline differs from expected`);
        }
        
        if (data && data.cta_text && data.cta_text.includes('Discover')) {
          console.log(`  ✅ ${expected.character.toUpperCase()}: CTA follows expected pattern`);
        } else {
          console.log(`  ⚠️  ${expected.character.toUpperCase()}: CTA differs from expected`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${expected.character.toUpperCase()}: Could not validate - ${error.message}`);
      }
    });
  }

  /**
   * Fetch data from Firebase Realtime Database
   */
  fetchFirebaseData(path) {
    return new Promise((resolve, reject) => {
      const url = `https://wavelength-lore-default-rtdb.firebaseio.com/${path}.json`;
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
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport() {
    console.log('\n🎉 CTA RENDERING VALIDATION RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // CTA Locations Summary
    console.log(`\n📍 CTA RENDERING LOCATIONS:`);
    console.log(`  📊 Total Locations Tested: ${this.results.ctaLocations.tested}`);
    console.log(`  ✅ Successfully Rendered: ${this.results.ctaLocations.rendered}`);
    console.log(`  ❌ Rendering Issues: ${this.results.ctaLocations.issues.length}`);
    
    if (this.results.ctaLocations.issues.length > 0) {
      console.log(`\n  🔍 Rendering Issues Found:`);
      this.results.ctaLocations.issues.forEach(issue => {
        console.log(`    • ${issue}`);
      });
    }

    // Template Validation Summary
    console.log(`\n📄 TEMPLATE VALIDATION:`);
    console.log(`  🎭 Character Template: ${this.results.characterTemplates.validated}/${this.ctaLocations.filter(l => l.template === 'character.ejs').length} locations validated`);
    console.log(`  📚 Lore Template: ${this.results.loreTemplates.validated}/${this.ctaLocations.filter(l => l.template === 'lore.ejs').length} locations validated`);

    // Firebase Data Summary
    console.log(`\n🔥 FIREBASE DATA VALIDATION:`);
    console.log(`  📊 Characters Tested: ${this.results.firebaseData.characters}`);
    console.log(`  ✅ Fields Populated: ${this.results.firebaseData.populated}`);
    console.log(`  ❌ Data Issues: ${this.results.firebaseData.issues.length}`);

    // Overall Status
    const totalIssues = this.results.ctaLocations.issues.length + 
                       this.results.characterTemplates.issues.length + 
                       this.results.loreTemplates.issues.length + 
                       this.results.firebaseData.issues.length;
    
    const renderingSuccess = (this.results.ctaLocations.rendered / this.results.ctaLocations.tested) * 100;
    
    console.log(`\n🌊 OVERALL CTA RENDERING STATUS:`);
    console.log(`  📈 Rendering Success Rate: ${Math.round(renderingSuccess)}%`);
    console.log(`  ❌ Total Issues Found: ${totalIssues}`);
    
    if (totalIssues === 0 && renderingSuccess === 100) {
      console.log('\n🎉 ALL CTA LOCATIONS RENDERING SUCCESSFULLY!');
      console.log('🌟 Users will see enhanced taglines, stakes, and custom CTAs throughout the application!');
    } else if (renderingSuccess >= 80) {
      console.log('\n✅ CTA RENDERING MOSTLY SUCCESSFUL!');
      console.log('⚠️  Minor issues detected - check above for details.');
    } else {
      console.log('\n⚠️  CTA RENDERING NEEDS ATTENTION!');
      console.log('🔧 Review template integration and Firebase data population.');
    }
  }

  /**
   * Run complete validation suite
   */
  async runValidation() {
    this.testCharacterCTALocations();
    this.testLoreCTALocations();
    await this.testFirebaseDataPopulation();
    this.testSpecificCTAExamples();
    this.generateValidationReport();
  }
}

// Run the validation suite
const validator = new CTARenderingValidator();
validator.runValidation().catch(error => {
  console.error('❌ Validation suite error:', error);
  process.exit(1);
});