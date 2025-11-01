/**
 * Social Media Commands
 * 
 * CLI commands for generating and managing social media announcements.
 * GitHub Issue: Phase 4.2 - Social Media Announcement Generator
 */

const chalk = require('chalk');
const SocialMediaService = require('../services/social-media-service');
const episodeHelpers = require('../helpers/episode-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const characterHelpers = require('../helpers/character-helpers');

class SocialMediaCommands {
    constructor(cli) {
        this.cli = cli;
        this.socialService = new SocialMediaService();
    }

    /**
     * Generate social media announcements
     */
    async generate(args) {
        if (args.length === 0) {
            console.log(chalk.red('❌ Please specify content to generate announcements for'));
            console.log(chalk.gray('Usage: social-media generate <episode-id|character-id|lore-id>'));
            return;
        }

        const contentId = args[0];
        const platforms = args.slice(1).filter(arg => ['twitter', 'instagram', 'facebook'].includes(arg.toLowerCase()));

        // Find content
        let item = null;
        let contentType = 'lore';

        // Try episode first (most common)
        try {
            item = episodeHelpers.getEpisodeByIdSync(contentId);
            if (item) contentType = 'episode';
        } catch (error) {
            // Continue
        }

        if (!item) {
            try {
                item = characterHelpers.getCharacterByIdSync(contentId);
                if (item) contentType = 'character';
            } catch (error) {
                // Continue
            }
        }

        if (!item) {
            item = loreHelpers.getLoreByIdSync(contentId);
            if (item) contentType = 'lore';
        }

        if (!item) {
            console.log(chalk.red(`❌ Content "${contentId}" not found`));
            return;
        }

        // Set context
        this.socialService.setContext(item);

        // Determine platforms
        const selectedPlatforms = platforms.length > 0 
            ? platforms 
            : ['twitter', 'instagram', 'facebook']; // Default to all

        console.log(chalk.cyan(`\n📱 Generating Social Media Announcements`));
        console.log(chalk.gray(`Content: ${item.title || item.name || item.id}`));
        console.log(chalk.gray(`Platforms: ${selectedPlatforms.join(', ')}\n`));

        const announcements = {};

        for (const platform of selectedPlatforms) {
            try {
                console.log(chalk.gray(`Generating ${platform} announcement...`));
                const announcement = await this.socialService.generateAnnouncement(item, platform);
                this.socialService.formatForPlatform(announcement, platform);
                announcements[platform] = [announcement];

                // Validate
                const validation = this.socialService.validateAnnouncement(announcement, platform);
                
                console.log(chalk.green(`\n✅ ${this.socialService.platformLimits[platform].name}:`));
                console.log(chalk.white(announcement.fullText));
                console.log(chalk.gray(`Length: ${announcement.length}/${announcement.maxLength} characters`));
                
                if (!validation.valid) {
                    validation.issues.forEach(issue => {
                        console.log(chalk.red(`   ⚠️  ${issue.message}`));
                    });
                }
                console.log('');
            } catch (error) {
                console.log(chalk.red(`❌ Failed to generate ${platform} announcement: ${error.message}`));
            }
        }

        // Save to file
        await this.saveAnnouncements(item, announcements);
    }

    /**
     * Generate variations for A/B testing
     */
    async variations(args) {
        if (args.length < 2) {
            console.log(chalk.red('❌ Please specify content ID and platform'));
            console.log(chalk.gray('Usage: social-media variations <content-id> <platform> [--count=3]'));
            return;
        }

        const contentId = args[0];
        const platform = args[1].toLowerCase();
        const countArg = args.find(arg => arg.startsWith('--count='));
        const count = countArg ? parseInt(countArg.split('=')[1]) || 3 : 3;

        // Find content
        let item = null;
        try {
            item = episodeHelpers.getEpisodeByIdSync(contentId);
        } catch (error) {
            item = characterHelpers.getCharacterByIdSync(contentId) || loreHelpers.getLoreByIdSync(contentId);
        }

        if (!item) {
            console.log(chalk.red(`❌ Content "${contentId}" not found`));
            return;
        }

        this.socialService.setContext(item);

        console.log(chalk.cyan(`\n📱 Generating ${count} Variations for ${platform}`));
        console.log(chalk.gray(`Content: ${item.title || item.name || item.id}\n`));

        try {
            const variations = await this.socialService.generateVariations(item, platform, count);
            
            variations.forEach((variation, index) => {
                this.socialService.formatForPlatform(variation, platform);
                console.log(chalk.cyan(`\n📝 Variation ${index + 1}:`));
                console.log(chalk.gray('─'.repeat(60)));
                console.log(chalk.white(variation.fullText));
                console.log(chalk.gray(`Length: ${variation.length}/${variation.maxLength} characters\n`));
            });

            await this.saveAnnouncements(item, { [platform]: variations });
        } catch (error) {
            console.log(chalk.red(`❌ Failed to generate variations: ${error.message}`));
        }
    }

    /**
     * Save announcements to file
     */
    async saveAnnouncements(item, announcements) {
        const fs = require('fs').promises;
        const path = require('path');

        const reportsDir = path.join(process.cwd(), 'reports', 'social-media');
        try {
            await fs.mkdir(reportsDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `announcements-${item.id || 'content'}-${timestamp}.json`;
        const filepath = path.join(reportsDir, filename);

        const data = {
            content: {
                id: item.id,
                title: item.title || item.name,
                type: item.season ? 'episode' : item.role ? 'character' : 'lore'
            },
            generatedAt: new Date().toISOString(),
            announcements: announcements
        };

        await fs.writeFile(filepath, JSON.stringify(data, null, 2));

        console.log(chalk.green(`\n✅ Announcements saved to: ${filepath}`));
        console.log(chalk.gray(`   You can copy the text from the JSON file or use the preview command\n`));
    }

    /**
     * Show help
     */
    showHelp() {
        console.log(chalk.cyan.bold('📱 Social Media Commands'));
        console.log(chalk.cyan('========================='));
        console.log('');
        console.log(chalk.white('social-media generate <content-id> [platforms]'));
        console.log(chalk.gray('   Generate announcements for content'));
        console.log(chalk.gray('   Platforms: twitter, instagram, facebook (default: all)'));
        console.log('');
        console.log(chalk.white('social-media variations <content-id> <platform> [--count=3]'));
        console.log(chalk.gray('   Generate multiple variations for A/B testing'));
        console.log('');
        console.log(chalk.yellow('Examples:'));
        console.log(chalk.gray('  social-media generate s5e1'));
        console.log(chalk.gray('  social-media generate s5e1 twitter instagram'));
        console.log(chalk.gray('  social-media variations s5e1 twitter --count=5'));
        console.log('');
    }
}

module.exports = SocialMediaCommands;

