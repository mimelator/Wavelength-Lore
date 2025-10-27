#!/usr/bin/env node

/**
 * WAVELENGTH EPISODE CLIFFHANGER CTA GENERATOR
 * ============================================
 * 
 * Bulk processes all episodes to generate compelling cliffhanger CTAs using
 * the Wavelength AI Chatbot. Automatically updates episode YAML files with
 * enhanced descriptions that drive viewer engagement and next-episode clicks.
 * 
 * Based on techniques from chat-lore-bulk-query.js
 */

const { WavelengthChatCLI } = require('../wavelength-chat-cli.js');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

// Paths to season YAML files
const SEASONS_DIR = path.join(__dirname, '../content/seasons');
const OUTPUT_DIR = path.join(__dirname, '../output/cliffhanger-ctas');
const API_DELAY_MS = 2000; // Increased delay for thoughtful responses

class WavelengthCliffhangerGenerator {
  constructor() {
    this.chatCLI = new WavelengthChatCLI();
    this.results = [];
  }

  /**
   * Reads all season YAML files and extracts episode data
   */
  async readAllSeasons() {
    console.log(`\n📂 Reading season files from: ${SEASONS_DIR}`);
    const seasonFiles = await fs.readdir(SEASONS_DIR);
    const seasonData = {};
    
    for (const file of seasonFiles.filter(f => f.endsWith('.yaml'))) {
      const filePath = path.join(SEASONS_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      const seasonKey = path.basename(file, '.yaml');
      seasonData[seasonKey] = yaml.load(content);
      console.log(`   ✅ Loaded: ${file}`);
    }
    
    return seasonData;
  }

  /**
   * Generates a specialized prompt for creating compelling cliffhanger CTAs
   */
  generateCliffhangerPrompt(episodeTitle, currentDescription, seasonContext, nextEpisodeTitle) {
    const nextEpisodeHint = nextEpisodeTitle ? `The next episode is called "${nextEpisodeTitle}".` : "This is the season finale.";
    
    return `Create a compelling cliffhanger enhancement for the Wavelength episode "${episodeTitle}".

CURRENT DESCRIPTION: "${currentDescription}"

CONTEXT: ${seasonContext} ${nextEpisodeHint}

TASK: Transform the existing description into a cliffhanger hook that:
1. Keeps the original meaning and tone
2. Adds dramatic tension with "But when..." or "Little does [character] know..."
3. Creates urgency about what happens next
4. Makes viewers want to immediately watch the next episode
5. Stays true to Wavelength's fantasy/adventure theme

EXAMPLES:
- "Everyone needs luck... But when the Goblin King hears this innocent song, their peaceful concert sets in motion a vengeful plot that will shatter the Shire forever."
- "There are words of love... But as they search for connection, dark forces are already closing in, threatening to silence these precious words forever."

RESPONSE FORMAT: Provide ONLY the enhanced description (2-3 sentences max), starting with the original content and adding the cliffhanger hook.`;
  }

  /**
   * Generates a "Next Episode CTA" message
   */
  generateNextEpisodeCTAPrompt(currentTitle, nextTitle, storyArc) {
    return `Create a compelling "What happens next?" teaser for viewers who just finished watching "${currentTitle}" and should watch "${nextTitle}" next.

STORY CONTEXT: ${storyArc}

TASK: Write an engaging 1-2 sentence teaser that:
1. Creates curiosity about unresolved plot points
2. Hints at escalating drama in the next episode
3. Makes viewers feel they MUST continue watching
4. Maintains Wavelength's epic fantasy tone

EXAMPLES:
- "The story continues and the stakes get higher..."
- "But the real test is just beginning..."
- "What happens when the truth is finally revealed?"

RESPONSE FORMAT: Provide ONLY the teaser text (1-2 sentences max).`;
  }

  /**
   * Gets next episode information for CTA generation
   */
  getNextEpisodeInfo(seasonData, currentSeasonKey, currentEpisodeKey) {
    const season = seasonData[currentSeasonKey];
    const episodeKeys = Object.keys(season.episodes);
    const currentIndex = episodeKeys.indexOf(currentEpisodeKey);
    
    if (currentIndex < episodeKeys.length - 1) {
      // Next episode in same season
      const nextEpisodeKey = episodeKeys[currentIndex + 1];
      return {
        title: season.episodes[nextEpisodeKey].title,
        isNewSeason: false
      };
    } else {
      // Check for next season
      const seasonKeys = Object.keys(seasonData).sort();
      const currentSeasonIndex = seasonKeys.indexOf(currentSeasonKey);
      if (currentSeasonIndex < seasonKeys.length - 1) {
        const nextSeasonKey = seasonKeys[currentSeasonIndex + 1];
        const nextSeason = seasonData[nextSeasonKey];
        const firstEpisodeKey = Object.keys(nextSeason.episodes)[0];
        return {
          title: nextSeason.episodes[firstEpisodeKey].title,
          isNewSeason: true,
          seasonTitle: nextSeason.description || nextSeasonKey
        };
      }
    }
    
    return null; // No next episode
  }

  /**
   * Processes all episodes to generate cliffhanger CTAs
   */
  async processAllEpisodes(seasonData) {
    console.log('\n🎬 GENERATING CLIFFHANGER CTAs FOR ALL EPISODES');
    console.log('================================================');
    
    let episodeCount = 0;
    
    for (const seasonKey of Object.keys(seasonData).sort()) {
      const season = seasonData[seasonKey];
      console.log(`\n📺 Processing Season: ${seasonKey.toUpperCase()}`);
      
      for (const episodeKey of Object.keys(season.episodes)) {
        episodeCount++;
        const episode = season.episodes[episodeKey];
        const nextEpisodeInfo = this.getNextEpisodeInfo(seasonData, seasonKey, episodeKey);
        
        console.log(`\n--- [${episodeCount}] ${episode.title} ---`);
        
        // Generate cliffhanger description
        const cliffhangerPrompt = this.generateCliffhangerPrompt(
          episode.title,
          episode.description,
          season.description || `Season ${seasonKey}`,
          nextEpisodeInfo?.title
        );
        
        console.log(`   🎭 Generating cliffhanger...`);
        const cliffhangerResult = await this.chatCLI.askChatbot(cliffhangerPrompt);
        
        let nextCTAResult = null;
        if (nextEpisodeInfo) {
          // Generate next episode CTA
          const ctaPrompt = this.generateNextEpisodeCTAPrompt(
            episode.title,
            nextEpisodeInfo.title,
            season.description || `Part of ${seasonKey}`
          );
          
          console.log(`   🎯 Generating next episode CTA...`);
          nextCTAResult = await this.chatCLI.askChatbot(ctaPrompt);
        }
        
        // Store results
        const result = {
          season: seasonKey,
          episode: episodeKey,
          title: episode.title,
          original_description: episode.description,
          cliffhanger_enhancement: cliffhangerResult.success ? cliffhangerResult.response.trim() : null,
          next_episode_cta: nextCTAResult?.success ? nextCTAResult.response.trim() : null,
          next_episode: nextEpisodeInfo,
          success: cliffhangerResult.success,
          timestamp: new Date().toISOString()
        };
        
        this.results.push(result);
        
        // Display progress
        if (cliffhangerResult.success) {
          console.log(`   ✅ Cliffhanger: ${cliffhangerResult.response.substring(0, 80)}...`);
        } else {
          console.log(`   ❌ Cliffhanger failed: ${cliffhangerResult.error}`);
        }
        
        if (nextCTAResult?.success) {
          console.log(`   ✅ Next CTA: ${nextCTAResult.response.substring(0, 60)}...`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
      }
    }
    
    return this.results;
  }

  /**
   * Applies the generated cliffhangers to the actual YAML files
   */
  async applyCliffhangers(results) {
    console.log('\n💾 APPLYING CLIFFHANGER ENHANCEMENTS TO YAML FILES');
    console.log('==================================================');
    
    // Group results by season
    const resultsBySeason = {};
    results.forEach(result => {
      if (!resultsBySeason[result.season]) {
        resultsBySeason[result.season] = [];
      }
      resultsBySeason[result.season].push(result);
    });
    
    // Update each season file
    for (const seasonKey of Object.keys(resultsBySeason)) {
      const seasonFile = path.join(SEASONS_DIR, `${seasonKey}.yaml`);
      const seasonResults = resultsBySeason[seasonKey];
      
      try {
        // Read current season file
        const content = await fs.readFile(seasonFile, 'utf8');
        const seasonData = yaml.load(content);
        
        // Apply cliffhanger enhancements
        let updatesApplied = 0;
        seasonResults.forEach(result => {
          if (result.success && result.cliffhanger_enhancement) {
            seasonData.episodes[result.episode].description = result.cliffhanger_enhancement;
            updatesApplied++;
          }
        });
        
        // Write back to file
        const updatedYaml = yaml.dump(seasonData, { 
          indent: 2,
          lineWidth: -1, // Prevent line wrapping
          quotingType: '"'
        });
        
        await fs.writeFile(seasonFile, updatedYaml, 'utf8');
        console.log(`   ✅ Updated ${seasonFile}: ${updatesApplied} episodes enhanced`);
        
      } catch (error) {
        console.error(`   ❌ Error updating ${seasonFile}:`, error.message);
      }
    }
  }

  /**
   * Writes detailed results to output file
   */
  async writeResults(results) {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const outputFile = path.join(OUTPUT_DIR, `cliffhanger-ctas-${Date.now()}.yaml`);
    
    const yamlString = yaml.dump(results, { indent: 2 });
    await fs.writeFile(outputFile, yamlString, 'utf8');
    
    console.log(`\n📊 Detailed results written to: ${outputFile}`);
  }

  /**
   * Main execution function
   */
  async runGeneration() {
    console.log('🌊 WAVELENGTH CLIFFHANGER CTA GENERATOR');
    console.log('======================================');
    console.log('🤖 Powered by Wavelength AI Chatbot');
    console.log('');

    try {
      // 1. Read all season data
      const seasonData = await this.readAllSeasons();

      // 2. Generate cliffhangers for all episodes
      const results = await this.processAllEpisodes(seasonData);

      // 3. Apply enhancements to YAML files
      await this.applyCliffhangers(results);

      // 4. Write detailed results
      await this.writeResults(results);

      console.log('\n🎉 CLIFFHANGER GENERATION COMPLETE!');
      console.log(`   📺 Processed: ${results.length} episodes`);
      console.log(`   ✅ Enhanced: ${results.filter(r => r.success).length} episodes`);
      console.log(`   ❌ Failed: ${results.filter(r => !r.success).length} episodes`);

    } catch (error) {
      console.error('❌ Generation failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI execution
async function main() {
  const generator = new WavelengthCliffhangerGenerator();
  await generator.runGeneration();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { WavelengthCliffhangerGenerator };