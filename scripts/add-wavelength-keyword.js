/**
 * Script to add 'wavelength' keyword to all episodes
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

async function addWavelengthKeyword() {
  console.log('🎵 Adding "wavelength" keyword to all episodes...\n');
  
  const seasonsPath = path.join(__dirname, '../content/seasons');
  const seasonFiles = ['season1.yaml', 'season2.yaml', 'season3.yaml', 'season4.yaml'];
  
  let totalEpisodes = 0;
  let updatedEpisodes = 0;
  
  for (const seasonFile of seasonFiles) {
    const filePath = path.join(seasonsPath, seasonFile);
    
    try {
      // Read and parse YAML
      const fileContent = await fs.readFile(filePath, 'utf8');
      const seasonData = yaml.load(fileContent);
      
      console.log(`\n📺 Processing ${seasonFile}...`);
      
      // Process each episode
      for (const [episodeKey, episodeData] of Object.entries(seasonData.episodes)) {
        totalEpisodes++;
        
        if (!episodeData.keywords) {
          episodeData.keywords = [];
        }
        
        // Check if 'wavelength' keyword already exists
        if (!episodeData.keywords.includes('wavelength')) {
          episodeData.keywords.unshift('wavelength'); // Add at the beginning
          updatedEpisodes++;
          console.log(`   ✅ Added to ${episodeKey}: ${episodeData.title}`);
        } else {
          console.log(`   ⏭️  Already has wavelength: ${episodeKey}: ${episodeData.title}`);
        }
      }
      
      // Write back to file
      const updatedContent = yaml.dump(seasonData, {
        lineWidth: -1, // Don't wrap lines
        noRefs: true
      });
      
      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.log(`   💾 Saved ${seasonFile}`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${seasonFile}:`, error.message);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total episodes: ${totalEpisodes}`);
  console.log(`Updated: ${updatedEpisodes}`);
  console.log(`Already had keyword: ${totalEpisodes - updatedEpisodes}`);
  console.log('\n✅ Done! Run "node scripts/populate_firebase.js" to sync to Firebase\n');
}

addWavelengthKeyword().catch(console.error);
