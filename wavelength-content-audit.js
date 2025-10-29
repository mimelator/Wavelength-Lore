#!/usr/bin/env node

/**
 * WAVELENGTH CONTENT AUDIT TOOL
 * 
 * Generates a comprehensive human-readable report of all text fields
 * including CTA fields across lore, episodes, and characters with
 * copyable CLI commands for quick updates.
 */

const path = require('path');

// Use the existing Firebase Admin utilities
const { initializeFirebaseAdmin, getAdminDatabase, isFirebaseAdminReady } = require('./helpers/firebase-admin-utils');

// Initialize Firebase
let db;
if (!isFirebaseAdminReady()) {
  db = initializeFirebaseAdmin();
} else {
  db = getAdminDatabase();
}

if (!db) {
  console.error('❌ Failed to initialize Firebase Admin SDK');
  process.exit(1);
}

console.log('📋 WAVELENGTH LORE CONTENT AUDIT TOOL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

class ContentAuditor {
  constructor() {
    this.db = db;
    this.report = {
      characters: {},
      episodes: {},
      lore: {},
      summary: {
        totalTextFields: 0,
        totalCTAFields: 0,
        totalObjects: 0
      }
    };
  }

  /**
   * Extract all text fields from an object
   */
  extractTextFields(obj, parentPath = '') {
    const textFields = {};
    const ctaFields = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.trim()) {
        const fieldPath = parentPath ? `${parentPath}.${key}` : key;
        
        // Identify CTA fields
        if (this.isCTAField(key)) {
          ctaFields[key] = {
            value,
            path: fieldPath,
            type: 'CTA'
          };
        } else {
          textFields[key] = {
            value,
            path: fieldPath,
            type: 'TEXT'
          };
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively extract from nested objects
        const nested = this.extractTextFields(value, parentPath ? `${parentPath}.${key}` : key);
        Object.assign(textFields, nested.textFields);
        Object.assign(ctaFields, nested.ctaFields);
      }
    }
    
    return { textFields, ctaFields };
  }

  /**
   * Identify if a field is a CTA field based on naming patterns
   */
  isCTAField(fieldName) {
    const ctaPatterns = [
      'cta_text',
      'cta_primary', 
      'cta_secondary',
      'investigation_cta',
      'action_cta',
      'call_to_action',
      'button_text'
    ];
    
    return ctaPatterns.some(pattern => 
      fieldName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Generate Firebase CLI command for updating a Realtime Database field
   */
  generateRealtimeDatabaseCommand(collection, docId, fieldPath, currentValue) {
    // Escape quotes and special characters for JSON
    const escapedValue = currentValue.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    // Create the database path
    const dbPath = `${collection}/${docId}/${fieldPath}`;
    
    return `firebase database:set /${dbPath} --data '"${escapedValue}"'`;
  }

  /**
   * Generate Node.js script for updating a Realtime Database field
   */
  generateNodeCommand(collection, docId, fieldPath, currentValue) {
    const escapedValue = currentValue.replace(/'/g, "\\'").replace(/\n/g, '\\n');
    
    return `node -e "require('firebase-admin').database().ref('${collection}/${docId}/${fieldPath}').set('${escapedValue}').then(() => console.log('✅ Updated ${collection}/${docId}.${fieldPath}'))"`;
  }

  /**
   * Audit characters collection
   */
  async auditCharacters() {
    console.log('\n🎭 AUDITING CHARACTERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const charactersSnapshot = await this.db.ref('characters').once('value');
    
    const charactersData = charactersSnapshot.val() || {};
    
    Object.entries(charactersData).forEach(([characterId, characterData]) => {
      
      console.log(`\\n📝 CHARACTER: ${characterData.title || characterId} (${characterId})`);
      console.log('─'.repeat(60));
      
      const { textFields, ctaFields } = this.extractTextFields(characterData);
      
      // Display text fields
      if (Object.keys(textFields).length > 0) {
        console.log('\\n📄 TEXT FIELDS:');
        Object.entries(textFields).forEach(([field, data]) => {
          console.log(`   ${field}: "${this.truncateText(data.value)}"`);
        });
      }
      
      // Display CTA fields
      if (Object.keys(ctaFields).length > 0) {
        console.log('\\n🎯 CTA FIELDS:');
        Object.entries(ctaFields).forEach(([field, data]) => {
          console.log(`   ${field}: "${data.value}"`);
        });
      }
      
      // Generate CLI commands
      console.log('\\n💻 UPDATE COMMANDS:');
      [...Object.entries(textFields), ...Object.entries(ctaFields)].forEach(([field, data]) => {
        const firebaseCmd = this.generateRealtimeDatabaseCommand('characters', characterId, field, data.value);
        console.log(`   # Update ${field}:`);
        console.log(`   ${firebaseCmd}`);
        console.log('');
      });
      
      // Update report
      this.report.characters[characterId] = {
        title: characterData.title || characterId,
        textFields: Object.keys(textFields).length,
        ctaFields: Object.keys(ctaFields).length,
        totalFields: Object.keys(textFields).length + Object.keys(ctaFields).length
      };
      
      this.report.summary.totalTextFields += Object.keys(textFields).length;
      this.report.summary.totalCTAFields += Object.keys(ctaFields).length;
    });
    
    const characterCount = Object.keys(charactersData).length;
    this.report.summary.totalObjects += characterCount;
    console.log(`\\n✅ Processed ${characterCount} characters`);
  }

  /**
   * Audit seasons/episodes collection
   */
  async auditEpisodes() {
    console.log('\\n📺 AUDITING EPISODES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const seasonsSnapshot = await this.db.ref('seasons').once('value');
    const episodesSnapshot = await this.db.ref('episodes').once('value');
    
    const seasonsData = seasonsSnapshot.val() || {};
    const episodesData = episodesSnapshot.val() || {};
    
    // Process seasons first
    Object.entries(seasonsData).forEach(([seasonId, seasonData]) => {
      
      console.log(`\\n🎬 SEASON: ${seasonData.title || seasonId} (${seasonId})`);
      console.log('─'.repeat(60));
      
      // Audit season-level fields
      const { textFields: seasonTextFields, ctaFields: seasonCtaFields } = this.extractTextFields(seasonData);
      
      if (Object.keys(seasonTextFields).length > 0 || Object.keys(seasonCtaFields).length > 0) {
        console.log('\\n📄 SEASON FIELDS:');
        Object.entries(seasonTextFields).forEach(([field, data]) => {
          console.log(`   ${field}: "${this.truncateText(data.value)}"`);
        });
        
        Object.entries(seasonCtaFields).forEach(([field, data]) => {
          console.log(`   🎯 ${field}: "${data.value}"`);
        });
        
        console.log('\\n💻 SEASON UPDATE COMMANDS:');
        [...Object.entries(seasonTextFields), ...Object.entries(seasonCtaFields)].forEach(([field, data]) => {
          const firebaseCmd = this.generateRealtimeDatabaseCommand('seasons', seasonId, field, data.value);
          console.log(`   ${firebaseCmd}`);
        });
      }
    });
    
    // Process standalone episodes
    Object.entries(episodesData).forEach(([episodeId, episodeData]) => {
      console.log(`\\n  📹 EPISODE: ${episodeData.title || episodeId} (${episodeId})`);
      console.log('  ' + '─'.repeat(55));
      
      const { textFields, ctaFields } = this.extractTextFields(episodeData);
      
      if (Object.keys(textFields).length > 0) {
        console.log('\\n  📄 TEXT FIELDS:');
        Object.entries(textFields).forEach(([field, data]) => {
          console.log(`     ${field}: "${this.truncateText(data.value)}"`);
        });
      }
      
      if (Object.keys(ctaFields).length > 0) {
        console.log('\\n  🎯 CTA FIELDS:');
        Object.entries(ctaFields).forEach(([field, data]) => {
          console.log(`     ${field}: "${data.value}"`);
        });
      }
      
      console.log('\\n  💻 EPISODE UPDATE COMMANDS:');
      [...Object.entries(textFields), ...Object.entries(ctaFields)].forEach(([field, data]) => {
        const firebaseCmd = this.generateRealtimeDatabaseCommand('episodes', episodeId, field, data.value);
        console.log(`     ${firebaseCmd}`);
      });
      
      // Update episode report
      this.report.episodes[episodeId] = {
        title: episodeData.title || episodeId,
        textFields: Object.keys(textFields).length,
        ctaFields: Object.keys(ctaFields).length,
        totalFields: Object.keys(textFields).length + Object.keys(ctaFields).length
      };
      
      this.report.summary.totalTextFields += Object.keys(textFields).length;
      this.report.summary.totalCTAFields += Object.keys(ctaFields).length;
    });
    
    const seasonCount = Object.keys(seasonsData).length;
    const episodeCount = Object.keys(episodesData).length;
    this.report.summary.totalObjects += seasonCount + episodeCount;
    console.log(`\\n✅ Processed ${seasonCount} seasons and ${episodeCount} episodes`);
  }

  /**
   * Audit lore collection
   */
  async auditLore() {
    console.log('\\n🌟 AUDITING LORE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const loreSnapshot = await this.db.ref('lore').once('value');
    const loreData = loreSnapshot.val() || {};
    
    Object.entries(loreData).forEach(([loreId, loreItem]) => {
      
      console.log(`\\n🏛️ LORE ITEM: ${loreItem.title || loreId} (${loreId})`);
      console.log('─'.repeat(60));
      
      const { textFields, ctaFields } = this.extractTextFields(loreItem);
      
      // Display text fields
      if (Object.keys(textFields).length > 0) {
        console.log('\\n📄 TEXT FIELDS:');
        Object.entries(textFields).forEach(([field, data]) => {
          console.log(`   ${field}: "${this.truncateText(data.value)}"`);
        });
      }
      
      // Display CTA fields  
      if (Object.keys(ctaFields).length > 0) {
        console.log('\\n🎯 CTA FIELDS:');
        Object.entries(ctaFields).forEach(([field, data]) => {
          console.log(`   ${field}: "${data.value}"`);
        });
      }
      
      // Generate CLI commands
      console.log('\\n💻 UPDATE COMMANDS:');
      [...Object.entries(textFields), ...Object.entries(ctaFields)].forEach(([field, data]) => {
        const firebaseCmd = this.generateRealtimeDatabaseCommand('lore', loreId, field, data.value);
        console.log(`   ${firebaseCmd}`);
      });
      
      // Update report
      this.report.lore[loreId] = {
        title: loreItem.title || loreId,
        textFields: Object.keys(textFields).length,
        ctaFields: Object.keys(ctaFields).length,
        totalFields: Object.keys(textFields).length + Object.keys(ctaFields).length
      };
      
      this.report.summary.totalTextFields += Object.keys(textFields).length;
      this.report.summary.totalCTAFields += Object.keys(ctaFields).length;
    });
    
    const loreCount = Object.keys(loreData).length;
    this.report.summary.totalObjects += loreCount;
    console.log(`\\n✅ Processed ${loreCount} lore items`);
  }

  /**
   * Truncate text for display
   */
  truncateText(text, maxLength = 80) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    console.log('\\n📊 AUDIT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { summary } = this.report;
    
    console.log(`📈 OVERVIEW:`);
    console.log(`   Total Objects: ${summary.totalObjects}`);
    console.log(`   Total Text Fields: ${summary.totalTextFields}`);
    console.log(`   Total CTA Fields: ${summary.totalCTAFields}`);
    console.log(`   Grand Total Fields: ${summary.totalTextFields + summary.totalCTAFields}`);
    
    console.log(`\\n🎭 CHARACTERS (${Object.keys(this.report.characters).length}):`);
    Object.entries(this.report.characters).forEach(([id, data]) => {
      console.log(`   ${data.title}: ${data.totalFields} fields (${data.ctaFields} CTAs)`);
    });
    
    console.log(`\\n📺 EPISODES (${Object.keys(this.report.episodes).length}):`);
    Object.entries(this.report.episodes).forEach(([id, data]) => {
      console.log(`   ${data.title}: ${data.totalFields} fields (${data.ctaFields} CTAs)`);
    });
    
    console.log(`\\n🌟 LORE ITEMS (${Object.keys(this.report.lore).length}):`);
    Object.entries(this.report.lore).forEach(([id, data]) => {
      console.log(`   ${data.title}: ${data.totalFields} fields (${data.ctaFields} CTAs)`);
    });
  }

  /**
   * Run complete audit
   */
  async runAudit() {
    try {
      await this.auditCharacters();
      await this.auditEpisodes(); 
      await this.auditLore();
      this.generateSummary();
      
      console.log('\\n🎉 AUDIT COMPLETE!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 TIP: Copy any command above and run it in your terminal to update fields');
      console.log('🔧 Make sure you have Firebase CLI installed: npm install -g firebase-tools');
      console.log('🔑 And are logged in: firebase login');
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    }
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new ContentAuditor();
  auditor.runAudit().then(() => {
    console.log('\\n🌊 WAVELENGTH CONTENT AUDIT COMPLETE!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ContentAuditor;