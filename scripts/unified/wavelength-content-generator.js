#!/usr/bin/env node

/**
 * WAVELENGTH AUTHENTIC CONTENT GENERATOR
 * =====================================
 * 
 * Integrates the Wavelength Chatbot's RAG system to generate authentic,
 * lore-accurate CTA content for Firebase schema enhancement.
 * 
 * This replaces generic placeholders with content that captures the true
 * essence of the Wavelength universe using Claude + Pinecone RAG.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class WavelengthContentGenerator {
  constructor() {
    this.chatbotUrl = 'ai.wavelengthlore.com';
    this.rateLimitDelay = 2000; // 2 seconds between requests
    this.cache = new Map(); // Cache responses to avoid duplicate API calls
  }

  /**
   * Query the Wavelength Chatbot for specific content
   */
  async queryChatbot(prompt) {
    // Check cache first
    const cacheKey = prompt.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      console.log(`📋 Using cached response for: ${prompt.substring(0, 50)}...`);
      return this.cache.get(cacheKey);
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ message: prompt });
      
      const options = {
        hostname: this.chatbotUrl,
        port: 443,
        path: '/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      console.log(`🤖 Querying chatbot: ${prompt.substring(0, 50)}...`);

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            const message = response.message || response.error || 'No response';
            
            // Cache the response
            this.cache.set(cacheKey, message);
            
            console.log(`✅ Received response (${message.length} chars)`);
            resolve(message);
          } catch (error) {
            console.error(`❌ JSON Parse Error: ${error.message}`);
            reject(new Error(`Invalid response: ${data.substring(0, 100)}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Request Error: ${error.message}`);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Generate character CTA content using chatbot
   */
  async generateCharacterCTA(characterName, characterData) {
    try {
      console.log(`\n🎭 Generating CTA content for character: ${characterName}`);

      // Query for tagline
      const taglinePrompt = `Generate a compelling, mysterious tagline (5-8 words max) for the character ${characterName} in Wavelength Lore. Make it intriguing and character-specific based on their role in the story. Return only the tagline, no explanation.`;
      const tagline = await this.queryChatbot(taglinePrompt);
      await this.delay();

      // Query for stakes
      const stakesPrompt = `What are the key stakes or challenges facing ${characterName} in Wavelength Lore? Write 1-2 sentences describing what's at risk for this character. Be specific to their story arc.`;
      const stakes = await this.queryChatbot(stakesPrompt);
      await this.delay();

      // Query for CTA text
      const ctaPrompt = `Create a compelling call-to-action button text (2-4 words) that would make readers want to learn more about ${characterName} from Wavelength Lore. Make it action-oriented and character-specific.`;
      const ctaText = await this.queryChatbot(ctaPrompt);
      await this.delay();

      return {
        tagline: this.cleanResponse(tagline, 60),
        stakes: this.cleanResponse(stakes, 200),
        cta_text: this.cleanResponse(ctaText, 30)
      };

    } catch (error) {
      console.error(`❌ Error generating character CTA for ${characterName}: ${error.message}`);
      return this.getFallbackCharacterCTA(characterName);
    }
  }

  /**
   * Generate episode CTA content using chatbot
   */
  async generateEpisodeCTA(episodeTitle, episodeData) {
    try {
      console.log(`\n📺 Generating CTA content for episode: ${episodeTitle}`);

      // Query for cliffhanger
      const cliffhangerPrompt = `Based on the episode "${episodeTitle}" from Wavelength Lore, what cliffhanger or dramatic moment would leave viewers wanting more? Write 1-2 compelling sentences that create suspense.`;
      const cliffhanger = await this.queryChatbot(cliffhangerPrompt);
      await this.delay();

      // Query for next episode tease
      const teasePrompt = `Create a brief teaser (1-2 sentences) for what might happen after "${episodeTitle}" in Wavelength Lore. Make it mysterious and compelling without giving away plot points.`;
      const nextEpisodeTease = await this.queryChatbot(teasePrompt);
      await this.delay();

      // Query for discussion prompt
      const discussionPrompt = `Create an engaging discussion question about "${episodeTitle}" from Wavelength Lore that would encourage viewers to think deeply about the episode's themes or characters.`;
      const discussionPrompt_text = await this.queryChatbot(discussionPrompt);
      await this.delay();

      return {
        cliffhanger: this.cleanResponse(cliffhanger, 200),
        next_episode_tease: this.cleanResponse(nextEpisodeTease, 200),
        discussion_prompt: this.cleanResponse(discussionPrompt_text, 150)
      };

    } catch (error) {
      console.error(`❌ Error generating episode CTA for ${episodeTitle}: ${error.message}`);
      return this.getFallbackEpisodeCTA(episodeTitle);
    }
  }

  /**
   * Generate lore item CTA content using chatbot
   */
  async generateLoreCTA(loreTitle, loreData) {
    try {
      console.log(`\n📚 Generating CTA content for lore: ${loreTitle}`);

      // Query for intrigue hook
      const hookPrompt = `Create a mysterious, intriguing hook (1-2 sentences) about "${loreTitle}" from Wavelength Lore that would make readers curious to learn more. Focus on the mystery and significance.`;
      const intrigueHook = await this.queryChatbot(hookPrompt);
      await this.delay();

      // Query for mystery level
      const mysteryPrompt = `On a scale from "Known" to "Mysterious" to "Ancient Secret", how mysterious is "${loreTitle}" in Wavelength Lore? Return only one of these three levels based on the lore significance.`;
      const mysteryLevel = await this.queryChatbot(mysteryPrompt);
      await this.delay();

      // Query for investigation CTA
      const investigationPrompt = `Create a compelling call-to-action (2-4 words) that encourages readers to investigate or explore "${loreTitle}" from Wavelength Lore. Make it action-oriented and mysterious.`;
      const investigationCta = await this.queryChatbot(investigationPrompt);
      await this.delay();

      return {
        intrigue_hook: this.cleanResponse(intrigueHook, 200),
        mystery_level: this.cleanResponse(mysteryLevel, 50),
        investigation_cta: this.cleanResponse(investigationCta, 30)
      };

    } catch (error) {
      console.error(`❌ Error generating lore CTA for ${loreTitle}: ${error.message}`);
      return this.getFallbackLoreCTA(loreTitle);
    }
  }

  /**
   * Clean and format chatbot responses
   */
  cleanResponse(response, maxLength) {
    if (!response) return '';
    
    // Remove quotes if the entire response is quoted
    let cleaned = response.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1);
    }

    // Truncate if too long
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength - 3) + '...';
    }

    return cleaned;
  }

  /**
   * Rate limiting delay
   */
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  /**
   * Fallback character CTA if chatbot fails
   */
  getFallbackCharacterCTA(characterName) {
    return {
      tagline: `Discover ${characterName}'s story`,
      stakes: `${characterName} faces crucial challenges that will shape the fate of the Wavelength universe.`,
      cta_text: `Explore ${characterName}`
    };
  }

  /**
   * Fallback episode CTA if chatbot fails
   */
  getFallbackEpisodeCTA(episodeTitle) {
    return {
      cliffhanger: `${episodeTitle} ends with a shocking revelation that changes everything.`,
      next_episode_tease: `The consequences of these events will ripple through future episodes.`,
      discussion_prompt: `What did you think of the key moments in ${episodeTitle}?`
    };
  }

  /**
   * Fallback lore CTA if chatbot fails
   */
  getFallbackLoreCTA(loreTitle) {
    return {
      intrigue_hook: `${loreTitle} holds secrets that could unlock the mysteries of Wavelength.`,
      mystery_level: `Mysterious`,
      investigation_cta: `Investigate`
    };
  }

  /**
   * Generate all CTA content for Firebase enhancement
   */
  async generateAllContent(firebaseData) {
    console.log('🌊 WAVELENGTH AUTHENTIC CTA CONTENT GENERATOR');
    console.log('===========================================');
    console.log(`🤖 Using chatbot: https://${this.chatbotUrl}`);
    console.log('');

    const results = {
      characters: {},
      episodes: {},
      lore: {},
      summary: {
        charactersProcessed: 0,
        episodesProcessed: 0,
        loreProcessed: 0,
        totalApiCalls: 0,
        errors: []
      }
    };

    // Process characters
    if (firebaseData.characters) {
      console.log(`🎭 Processing ${Object.keys(firebaseData.characters).length} characters...`);
      
      for (const [characterId, characterData] of Object.entries(firebaseData.characters)) {
        try {
          const characterName = characterData.name || characterId;
          results.characters[characterId] = await this.generateCharacterCTA(characterName, characterData);
          results.summary.charactersProcessed++;
          results.summary.totalApiCalls += 3; // 3 API calls per character
        } catch (error) {
          results.summary.errors.push(`Character ${characterId}: ${error.message}`);
        }
      }
    }

    // Process episodes
    if (firebaseData.episodes) {
      console.log(`\n📺 Processing ${Object.keys(firebaseData.episodes).length} episodes...`);
      
      for (const [episodeId, episodeData] of Object.entries(firebaseData.episodes)) {
        try {
          const episodeTitle = episodeData.title || episodeId;
          results.episodes[episodeId] = await this.generateEpisodeCTA(episodeTitle, episodeData);
          results.summary.episodesProcessed++;
          results.summary.totalApiCalls += 3; // 3 API calls per episode
        } catch (error) {
          results.summary.errors.push(`Episode ${episodeId}: ${error.message}`);
        }
      }
    }

    // Process lore
    if (firebaseData.lore) {
      console.log(`\n📚 Processing ${Object.keys(firebaseData.lore).length} lore items...`);
      
      for (const [loreId, loreData] of Object.entries(firebaseData.lore)) {
        try {
          const loreTitle = loreData.title || loreData.name || loreId;
          results.lore[loreId] = await this.generateLoreCTA(loreTitle, loreData);
          results.summary.loreProcessed++;
          results.summary.totalApiCalls += 3; // 3 API calls per lore item
        } catch (error) {
          results.summary.errors.push(`Lore ${loreId}: ${error.message}`);
        }
      }
    }

    this.logSummary(results.summary);
    return results;
  }

  /**
   * Log generation summary
   */
  logSummary(summary) {
    console.log('\n🎯 GENERATION SUMMARY');
    console.log('====================');
    console.log(`✅ Characters: ${summary.charactersProcessed} processed`);
    console.log(`✅ Episodes: ${summary.episodesProcessed} processed`);
    console.log(`✅ Lore Items: ${summary.loreProcessed} processed`);
    console.log(`🤖 Total API Calls: ${summary.totalApiCalls}`);
    console.log(`📋 Cached Responses: ${this.cache.size}`);
    
    if (summary.errors.length > 0) {
      console.log(`\n❌ Errors (${summary.errors.length}):`);
      summary.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    } else {
      console.log(`\n🎉 All content generated successfully!`);
    }
  }

  /**
   * Save generated content to file
   */
  async saveContentToFile(content, filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = filename || `wavelength-generated-content-${timestamp}.json`;
    const outputPath = path.join(process.cwd(), 'generated-content', outputFile);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(content, null, 2));
    console.log(`\n💾 Generated content saved to: ${outputPath}`);
    
    return outputPath;
  }

  /**
   * Test chatbot connection
   */
  async testConnection() {
    console.log('🔍 Testing chatbot connection...');
    
    try {
      const testResponse = await this.queryChatbot('What is Wavelength Lore?');
      
      if (testResponse && testResponse.length > 50) {
        console.log('✅ Chatbot connection successful!');
        console.log(`📝 Test response: ${testResponse.substring(0, 100)}...`);
        return true;
      } else {
        console.log('⚠️  Chatbot responded but with minimal content');
        return false;
      }
    } catch (error) {
      console.error(`❌ Chatbot connection failed: ${error.message}`);
      return false;
    }
  }
}

// Export for use by other scripts
module.exports = { WavelengthContentGenerator };

// CLI execution
if (require.main === module) {
  async function main() {
    const generator = new WavelengthContentGenerator();
    
    // Test connection
    const connected = await generator.testConnection();
    if (!connected) {
      console.error('❌ Cannot proceed without chatbot connection');
      process.exit(1);
    }

    // For CLI usage, we'd need to load Firebase data
    console.log('\n⚠️  This script is designed to be used by the Firebase schema enhancer.');
    console.log('   Use: node scripts/unified/firebase-schema-enhancer.js --use-authentic-content');
    console.log('   Or: node scripts/unified/wavelength-content-generator.js --test');

    if (process.argv.includes('--test')) {
      // Run a small test
      const testData = {
        characters: {
          'test-character': { name: 'Andrew' }
        }
      };

      console.log('\n🧪 Running test generation...');
      const results = await generator.generateAllContent(testData);
      await generator.saveContentToFile(results, 'test-generation.json');
    }
  }

  main().catch(console.error);
}