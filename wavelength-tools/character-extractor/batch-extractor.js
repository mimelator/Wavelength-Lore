#!/usr/bin/env node

/**
 * 🎭 WAVELENGTH BATCH CHARACTER EXTRACTOR
 *
 * Extract multiple characters from a CSV config file
 * Great for processing entire galleries or scene collections
 */

const fs = require('fs');
const path = require('path');
const CharacterExtractor = require('./CharacterExtractor');

class BatchExtractor {
  constructor(verbose = true) {
    this.verbose = verbose;
    this.extractor = new CharacterExtractor({ verbose });
    this.results = {
      total: 0,
      successful: 0,
      failed: 0,
      characters: []
    };
  }

  log(message, type = 'info') {
    if (!this.verbose) return;
    const prefixes = {
      info: '   ',
      success: '✅ ',
      error: '❌ ',
      warning: '⚠️  ',
      batch: '📦 '
    };
    console.log((prefixes[type] || '   ') + message);
  }

  /**
   * Load extraction config from CSV file
   * Format: imagePath,description,characterId,outputName,crop
   */
  loadConfigFromCSV(csvPath) {
    try {
      if (!fs.existsSync(csvPath)) {
        throw new Error(`Config file not found: ${csvPath}`);
      }

      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

      const configs = [];
      for (const line of lines) {
        const [imagePath, description, characterId, outputName, cropFlag] = line
          .split(',')
          .map(v => v.trim());

        if (!imagePath || !description) {
          this.log(`Skipping invalid line: ${line}`, 'warning');
          continue;
        }

        configs.push({
          imagePath,
          description,
          characterId: characterId || path.basename(imagePath, path.extname(imagePath)),
          outputFilename: outputName || `${characterId || 'extracted'}.png`,
          crop: cropFlag?.toLowerCase() === 'true' || cropFlag === '1'
        });
      }

      return configs;
    } catch (error) {
      throw new Error(`Failed to load config: ${error.message}`);
    }
  }

  /**
   * Process batch of characters
   */
  async processBatch(configs) {
    console.log('\n🎭 BATCH CHARACTER EXTRACTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Processing ${configs.length} characters...`);
    console.log('');

    this.results.total = configs.length;

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const progress = `[${i + 1}/${configs.length}]`;

      console.log(`${progress} Extracting: ${config.characterId}`);
      console.log(`    Image: ${path.basename(config.imagePath)}`);
      console.log(`    Description: ${config.description}`);
      if (config.crop) {
        console.log(`    Mode: CROP`);
      }

      try {
        const result = await this.extractor.extractCharacter(config);

        if (result.success) {
          this.results.successful++;
          this.results.characters.push({
            characterId: config.characterId,
            success: true,
            outputPath: result.outputPath,
            confidence: result.detection.confidence
          });
          console.log(`    ✅ Success\n`);
        } else {
          this.results.failed++;
          this.results.characters.push({
            characterId: config.characterId,
            success: false,
            error: result.error
          });
          console.log(`    ❌ Failed: ${result.error}\n`);
        }
      } catch (error) {
        this.results.failed++;
        this.results.characters.push({
          characterId: config.characterId,
          success: false,
          error: error.message
        });
        console.log(`    ❌ Error: ${error.message}\n`);
      }
    }

    return this.results;
  }

  /**
   * Save batch results to manifest file
   */
  saveManifest(outputPath) {
    try {
      const manifest = {
        timestamp: new Date().toISOString(),
        summary: {
          total: this.results.total,
          successful: this.results.successful,
          failed: this.results.failed,
          successRate: ((this.results.successful / this.results.total) * 100).toFixed(1) + '%'
        },
        characters: this.results.characters
      };

      fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
      this.log(`Manifest saved: ${outputPath}`, 'success');
      return outputPath;
    } catch (error) {
      this.log(`Failed to save manifest: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n📊 BATCH EXTRACTION COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successful: ${this.results.successful}/${this.results.total}`);
    console.log(`❌ Failed: ${this.results.failed}/${this.results.total}`);
    console.log(
      `📈 Success rate: ${((this.results.successful / this.results.total) * 100).toFixed(1)}%`
    );
    console.log('');
  }
}

module.exports = BatchExtractor;
