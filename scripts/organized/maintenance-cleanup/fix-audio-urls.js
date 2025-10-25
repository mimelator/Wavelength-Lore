#!/usr/bin/env node

/**
 * Fix Audio URLs in YAML Files
 * 
 * This script fixes the audio URLs in season YAML files by removing the incorrect
 * /static/ prefix that prevents the Express static middleware from serving the files correctly.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class AudioUrlFixer {
    constructor() {
        this.contentDir = path.join(__dirname, '../content/seasons');
        this.changes = [];
    }

    async fixAllSeasons() {
        console.log('🎵 Fixing Audio URLs in Season YAML Files\n');
        
        try {
            const seasonFiles = fs.readdirSync(this.contentDir)
                .filter(file => file.endsWith('.yaml'))
                .sort();
            
            console.log(`Found ${seasonFiles.length} season files to process\n`);
            
            for (const file of seasonFiles) {
                await this.fixSeasonFile(file);
            }
            
            this.printSummary();
            
        } catch (error) {
            console.error('❌ Error fixing audio URLs:', error.message);
            process.exit(1);
        }
    }

    async fixSeasonFile(filename) {
        const filePath = path.join(this.contentDir, filename);
        const seasonName = filename.replace('.yaml', '');
        
        console.log(`📂 Processing ${seasonName}...`);
        
        try {
            // Read and parse YAML
            const yamlContent = fs.readFileSync(filePath, 'utf8');
            const seasonData = yaml.load(yamlContent);
            
            if (!seasonData.episodes) {
                console.log(`   ⚠️  No episodes found in ${seasonName}`);
                return;
            }
            
            let episodeCount = 0;
            let fixedCount = 0;
            
            // Process each episode
            for (const [episodeKey, episode] of Object.entries(seasonData.episodes)) {
                episodeCount++;
                
                if (episode.audio) {
                    const originalUrl = episode.audio;
                    
                    // Fix the audio URL by removing /static/ prefix
                    if (originalUrl.startsWith('/static/')) {
                        const fixedUrl = originalUrl.replace('/static/', '/');
                        episode.audio = fixedUrl;
                        fixedCount++;
                        
                        this.changes.push({
                            season: seasonName,
                            episode: episodeKey,
                            title: episode.title,
                            original: originalUrl,
                            fixed: fixedUrl
                        });
                        
                        console.log(`   ✅ Fixed ${episodeKey}: ${episode.title}`);
                        console.log(`      ${originalUrl} → ${fixedUrl}`);
                    } else {
                        console.log(`   ℹ️  ${episodeKey}: Already correct (${originalUrl})`);
                    }
                } else {
                    console.log(`   ⚠️  ${episodeKey}: No audio URL found`);
                }
            }
            
            // Write back the fixed YAML if changes were made
            if (fixedCount > 0) {
                const fixedYaml = yaml.dump(seasonData, {
                    indent: 2,
                    lineWidth: -1, // No line wrapping
                    quotingType: '"',
                    forceQuotes: false
                });
                
                fs.writeFileSync(filePath, fixedYaml, 'utf8');
                console.log(`   💾 Saved ${fixedCount}/${episodeCount} audio URL fixes to ${filename}`);
            } else {
                console.log(`   ✨ No changes needed for ${filename}`);
            }
            
            console.log('');
            
        } catch (error) {
            console.error(`   ❌ Error processing ${filename}:`, error.message);
        }
    }

    printSummary() {
        console.log('📊 AUDIO URL FIX SUMMARY');
        console.log('='.repeat(50));
        
        if (this.changes.length === 0) {
            console.log('✨ No changes were needed - all audio URLs are already correct!');
            return;
        }
        
        console.log(`🔧 Fixed ${this.changes.length} audio URLs across ${this.getUniqueSeasons().length} seasons\n`);
        
        // Group by season
        const seasonChanges = this.groupChangesBySeason();
        
        for (const [season, changes] of Object.entries(seasonChanges)) {
            console.log(`📺 ${season.toUpperCase()}:`);
            changes.forEach(change => {
                console.log(`   • ${change.episode}: "${change.title}"`);
                console.log(`     ${change.original} → ${change.fixed}`);
            });
            console.log('');
        }
        
        console.log('🎯 Next Steps:');
        console.log('   1. Review the changes above');
        console.log('   2. Run: node scripts/populate_firebase.js');
        console.log('   3. Test: node scripts/check_audio_files.js');
        console.log('   4. Verify: curl -I http://localhost:3001/images/seasons/season1/episodes/episode1/LuckyCharm_v35.mp3');
    }

    getUniqueSeasons() {
        return [...new Set(this.changes.map(change => change.season))];
    }

    groupChangesBySeason() {
        const grouped = {};
        this.changes.forEach(change => {
            if (!grouped[change.season]) {
                grouped[change.season] = [];
            }
            grouped[change.season].push(change);
        });
        return grouped;
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🎵 Audio URL Fixer for Wavelength Lore

Usage: node fix-audio-urls.js

This script fixes audio URLs in season YAML files by removing the incorrect
/static/ prefix that prevents proper static file serving.

Examples:
  node fix-audio-urls.js              # Fix all season files

What it does:
  • Scans all season*.yaml files in content/seasons/
  • Fixes audio URLs: /static/images/... → /images/...
  • Preserves all other content and formatting
  • Shows detailed summary of changes made

Note: Run this before repopulating the Firebase database.
`);
        process.exit(0);
    }
    
    const fixer = new AudioUrlFixer();
    await fixer.fixAllSeasons();
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = AudioUrlFixer;