#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH CTA DATA VALIDATION SCANNER
 * 
 * Scans all CTA data for malformed chatbot responses and provides
 * analysis for potential cleanup targets
 */

const { fetchDataAsAdmin } = require('./helpers/firebase-admin-utils');

// Common patterns that indicate malformed chatbot responses
const MALFORMED_PATTERNS = [
  /i apologize/i,
  /i cannot provide/i,
  /i can't provide/i,
  /cannot help/i,
  /sorry, but/i,
  /unfortunately/i,
  /unable to/i,
  /not able to/i,
  /let me help you with something else/i,
  /as an ai/i,
  /as a language model/i
];

async function scanForMalformedData() {
  console.log('🌊 WAVELENGTH: CTA Data Validation Scanner\n');
  console.log('🔍 Scanning for malformed chatbot responses...\n');
  
  try {
    // Scan characters
    console.log('📋 SCANNING CHARACTERS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const characters = await fetchDataAsAdmin('characters');
    const characterIssues = [];
    
    if (characters) {
      Object.entries(characters).forEach(([characterId, character]) => {
        // Check stakes field
        if (character.stakes) {
          const isMalformed = MALFORMED_PATTERNS.some(pattern => 
            pattern.test(character.stakes)
          );
          
          if (isMalformed) {
            characterIssues.push({
              id: characterId,
              field: 'stakes',
              content: character.stakes,
              type: 'malformed_response'
            });
          }
        }
        
        // Check cta_text field
        if (character.cta_text) {
          const isMalformed = MALFORMED_PATTERNS.some(pattern => 
            pattern.test(character.cta_text)
          );
          
          if (isMalformed) {
            characterIssues.push({
              id: characterId,
              field: 'cta_text',
              content: character.cta_text,
              type: 'malformed_response'
            });
          }
        }
        
        // Check tagline field
        if (character.tagline) {
          const isMalformed = MALFORMED_PATTERNS.some(pattern => 
            pattern.test(character.tagline)
          );
          
          if (isMalformed) {
            characterIssues.push({
              id: characterId,
              field: 'tagline',
              content: character.tagline,
              type: 'malformed_response'
            });
          }
        }
      });
    }
    
    if (characterIssues.length > 0) {
      console.log(`❌ Found ${characterIssues.length} malformed character entries:`);
      characterIssues.forEach(issue => {
        console.log(`   • ${issue.id}.${issue.field}: "${issue.content.substring(0, 80)}..."`);
      });
    } else {
      console.log('✅ All character CTA data looks clean!');
    }
    
    // Scan episodes
    console.log('\n📋 SCANNING EPISODES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const videos = await fetchDataAsAdmin('videos');
    const episodeIssues = [];
    
    if (videos) {
      Object.entries(videos).forEach(([seasonId, season]) => {
        if (season.episodes) {
          Object.entries(season.episodes).forEach(([episodeId, episode]) => {
            ['cliffhanger', 'next_episode_tease', 'discussion_prompt'].forEach(field => {
              if (episode[field]) {
                const isMalformed = MALFORMED_PATTERNS.some(pattern => 
                  pattern.test(episode[field])
                );
                
                if (isMalformed) {
                  episodeIssues.push({
                    id: `${seasonId}/${episodeId}`,
                    field: field,
                    content: episode[field],
                    type: 'malformed_response'
                  });
                }
              }
            });
          });
        }
      });
    }
    
    if (episodeIssues.length > 0) {
      console.log(`❌ Found ${episodeIssues.length} malformed episode entries:`);
      episodeIssues.forEach(issue => {
        console.log(`   • ${issue.id}.${issue.field}: "${issue.content.substring(0, 80)}..."`);
      });
    } else {
      console.log('✅ All episode CTA data looks clean!');
    }
    
    // Scan lore
    console.log('\n📋 SCANNING LORE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const lore = await fetchDataAsAdmin('lore');
    const loreIssues = [];
    
    if (lore) {
      Object.entries(lore).forEach(([loreId, loreItem]) => {
        ['intrigue_hook', 'investigation_cta'].forEach(field => {
          if (loreItem[field]) {
            const isMalformed = MALFORMED_PATTERNS.some(pattern => 
              pattern.test(loreItem[field])
            );
            
            if (isMalformed) {
              loreIssues.push({
                id: loreId,
                field: field,
                content: loreItem[field],
                type: 'malformed_response'
              });
            }
          }
        });
      });
    }
    
    if (loreIssues.length > 0) {
      console.log(`❌ Found ${loreIssues.length} malformed lore entries:`);
      loreIssues.forEach(issue => {
        console.log(`   • ${issue.id}.${issue.field}: "${issue.content.substring(0, 80)}..."`);
      });
    } else {
      console.log('✅ All lore CTA data looks clean!');
    }
    
    // Summary
    const totalIssues = characterIssues.length + episodeIssues.length + loreIssues.length;
    console.log('\n🌊 SCAN SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Characters: ${characterIssues.length} issues found`);
    console.log(`   Episodes:   ${episodeIssues.length} issues found`);
    console.log(`   Lore:       ${loreIssues.length} issues found`);
    console.log(`   TOTAL:      ${totalIssues} malformed entries detected`);
    
    if (totalIssues === 0) {
      console.log('\n🎉 ALL CTA DATA IS CLEAN! No malformed responses found.');
    } else {
      console.log(`\n⚠️  ${totalIssues} malformed chatbot responses need cleanup.`);
      console.log('   Run individual fix scripts or create batch cleanup script.');
    }
    
  } catch (error) {
    console.error('❌ Error scanning CTA data:', error);
    process.exit(1);
  }
}

// Run the scanner if script is called directly
if (require.main === module) {
  scanForMalformedData().then(() => {
    console.log('\n🌊 WAVELENGTH: CTA data validation scan complete!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Failed to scan CTA data:', error);
    process.exit(1);
  });
}

module.exports = { scanForMalformedData };