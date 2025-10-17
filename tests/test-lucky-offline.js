// Test Lucky link fix using fallback data
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');
const simpleDisambiguation = require('../helpers/simple-disambiguation');

async function testLuckyLinkFixOffline() {
  console.log('🔍 Testing Lucky Link Fix (Offline with fallback data)...\n');
  
  try {
    // Use fallback data (no Firebase needed)
    console.log('📚 Using fallback data...');
    
    // Set up disambiguation with helper instances
    simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);
    
    // Test text that mentions Lucky (like episode 1 story)
    const testText = `Wavelength is performing a Shire favorite about their mascot, Lucky the Leprechaun, who brings them good luck and helps them overcome challenges.`;
    
    console.log('📝 Test text:');
    console.log(testText);
    console.log('\n🔗 Processing with simpleSmartLinking...\n');
    
    const result = simpleDisambiguation.applySmartLinkingSimple(testText);
    
    console.log('✨ Result:');
    console.log(result);
    console.log('\n🎯 Analyzing link type for Lucky...');
    
    // Check if Lucky is mentioned in the result
    if (result.includes('Lucky')) {
      if (result.includes('class="character-link"') && result.includes('Lucky')) {
        console.log('✅ SUCCESS: Lucky is linked as a character (👤 hero icon)');
        
        // Extract the Lucky link for detailed analysis
        const luckyLinkMatch = result.match(/<a[^>]*href="[^"]*"[^>]*class="character-link"[^>]*>[^<]*Lucky[^<]*<\/a>/);
        if (luckyLinkMatch) {
          console.log('🔗 Lucky link details:', luckyLinkMatch[0]);
        }
      } else if (result.includes('class="lore-link"') && result.includes('Lucky')) {
        console.log('❌ ISSUE: Lucky is linked as lore (📜 lore icon)');
        
        // Extract the Lucky link for detailed analysis
        const luckyLinkMatch = result.match(/<a[^>]*href="[^"]*"[^>]*class="lore-link"[^>]*>[^<]*Lucky[^<]*<\/a>/);
        if (luckyLinkMatch) {
          console.log('🔗 Lucky link details:', luckyLinkMatch[0]);
        }
      } else {
        console.log('⚠️  Lucky appears but is not linked');
      }
    } else {
      console.log('⚠️  Lucky not found in result');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testLuckyLinkFixOffline();