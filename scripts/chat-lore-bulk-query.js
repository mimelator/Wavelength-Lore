// --- START OF FILE lore-export.js ---

const { WavelengthChatCLI } = require('../wavelength-chat-cli.js');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

// Path to the videos data file
const VIDEOS_DATA_PATH = path.join(__dirname, '../backups/pre-schema-migration/2025-10-27T03-41-56-503Z/json/videos.json');
// Path for the output YAML file
const OUTPUT_YAML_PATH = path.join(__dirname, '../episode-lore-export.yaml');
// Delay in milliseconds between each API call to avoid rate limits and manage load
const API_DELAY_MS = 1500; 

class WavelengthLoreExporter {
  constructor() {
    // Instantiate the chat CLI class to reuse its API logic
    this.chatCLI = new WavelengthChatCLI();
  }

  /**
   * Reads and parses the local videos.json file.
   */
  async readEpisodeData() {
    console.log(`\n📂 Reading episode data from: ${VIDEOS_DATA_PATH}`);
    try {
      const data = await fs.readFile(VIDEOS_DATA_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error reading or parsing ${VIDEOS_DATA_PATH}:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Generates a question prompt for the chatbot based on episode details.
   */
  generatePrompt(seasonTitle, episodeTitle) {
    // A detailed, templated prompt to guide the chatbot's response
    return `Please provide a detailed, narrative summary of the core story, conflict, and outcome for the Wavelength episode titled "${episodeTitle}" from Season: "${seasonTitle}". The summary should be engaging, 4-5 sentences long, and suitable for marketing copy.`;
  }

  /**
   * Orchestrates the batch processing, querying the chatbot for each episode.
   */
  async processEpisodes(episodeData) {
    const allResults = [];
    const seasons = episodeData;
    let episodeCount = 0;
    
    // Iterate through seasons
    for (const seasonKey in seasons) {
      const season = seasons[seasonKey];
      
      // Iterate through episodes in the current season
      for (const episodeKey in season.episodes) {
        episodeCount++;
        const episode = season.episodes[episodeKey];
        const seasonTitle = season.title;
        const episodeTitle = episode.title;
        const prompt = this.generatePrompt(seasonTitle, episodeTitle);

        console.log(`\n--- [${episodeCount}] Processing: ${seasonTitle} - ${episodeTitle} ---`);
        console.log(`   📝 Prompt: "${prompt.substring(0, 80)}..."`);
        
        // --- Core Chatbot Call ---
        const result = await this.chatCLI.askChatbot(prompt);
        // --- End Chatbot Call ---

        const episodeResult = {
          season_title: seasonTitle,
          episode_title: episodeTitle,
          episode_key: episodeKey,
          original_story_summary: episode.story.trim(),
          prompt_sent: prompt,
          chatbot_response: result.success ? result.response : `ERROR: ${result.error}`,
          success: result.success,
          metadata: result.metadata || {},
          usage: result.usage || {}
        };

        allResults.push(episodeResult);
        
        // Display result feedback in the console
        if (result.success) {
          console.log(`   ✅ Success. Tokens: ${result.usage.totalTokens || 'N/A'}`);
          console.log(`   🤖 Response: ${result.response.substring(0, 100)}...`);
        } else {
          console.log(`   ❌ Failed: ${result.error}`);
        }
        
        // Wait to respect rate limits and allow the user to read the output
        if (episodeCount < 26) { // Assumes 26 episodes total from videos.json
           await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
        }
      }
    }
    
    return allResults;
  }

  /**
   * Writes the structured data to a YAML file.
   */
  async writeYaml(data) {
    console.log(`\n💾 Writing ${data.length} episode results to ${OUTPUT_YAML_PATH}...`);
    try {
      const yamlString = yaml.dump(data, { indent: 2 });
      await fs.writeFile(OUTPUT_YAML_PATH, yamlString, 'utf8');
      console.log(`\n🎉 Export complete! Results written to: ${OUTPUT_YAML_PATH}`);
    } catch (error) {
      console.error('❌ Error writing YAML file:', error.message);
    }
  }

  /**
   * Main execution function.
   */
  async runExport() {
    console.log('🌊 WAVELENGTH LORE EXPORTER (YAML BATCH)');
    console.log('=======================================');

    // 1. Read data
    const episodeData = await this.readEpisodeData();

    // 2. Process all episodes (batch API calls)
    const results = await this.processEpisodes(episodeData);

    // 3. Write output file
    await this.writeYaml(results);
  }
}

// CLI execution for the exporter
async function main() {
  const exporter = new WavelengthLoreExporter();
  await exporter.runExport();
}

if (require.main === module) {
  main().catch(console.error);
}

// --- END OF FILE lore-export.js ---