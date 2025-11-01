/**
 * Social Media Announcement Generation Step
 * 
 * Milestone 4.2: Social Media Announcement Generator
 * Generates platform-specific social media announcements for episodes.
 */

const chalk = require('chalk');
const SocialMediaService = require('../../services/social-media-service');
const fs = require('fs').promises;
const path = require('path');

class SocialMediaStep {
    constructor(stateManager, rl) {
        this.stateManager = stateManager;
        this.rl = rl;
        this.socialService = new SocialMediaService();
    }

    /**
     * Execute social media announcement generation
     */
    async execute(episode) {
        console.log(chalk.yellow('\nStep 9 of 10: Social Media Announcement Generation'));
        console.log(chalk.gray('='.repeat(60)));
        console.log(chalk.cyan(`Episode: ${episode.id} - ${episode.title || 'Untitled'}`));
        console.log(chalk.gray('\nGenerate social media announcements for publishing this episode.'));
        console.log('');

        // Set context
        this.socialService.setContext(episode);

        // Select platforms
        const platforms = await this.selectPlatforms();
        if (platforms.length === 0) {
            console.log(chalk.gray('No platforms selected. Skipping social media generation.'));
            return;
        }

        const announcements = {};

        // Generate for each platform
        for (const platform of platforms) {
            console.log(chalk.cyan(`\n📱 Generating ${this.socialService.platformLimits[platform].name} announcement...`));
            
            try {
                // Ask if they want variations
                const wantVariations = await this.prompt('Generate multiple variations for A/B testing? (y/n, default: n): ');
                const variationCount = wantVariations.toLowerCase() === 'y' ? 3 : 1;

                if (variationCount > 1) {
                    const variations = await this.socialService.generateVariations(episode, platform, variationCount);
                    announcements[platform] = variations;
                    await this.reviewVariations(platform, variations);
                } else {
                    const announcement = await this.socialService.generateAnnouncement(episode, platform);
                    announcements[platform] = [announcement];
                    await this.reviewAnnouncement(platform, announcement);
                }
            } catch (error) {
                console.log(chalk.red(`❌ Failed to generate ${platform} announcement: ${error.message}`));
            }
        }

        // Save announcements
        await this.saveAnnouncements(episode, announcements);
    }

    /**
     * Select platforms for announcement generation
     */
    async selectPlatforms() {
        console.log(chalk.cyan('📱 Select Platforms:'));
        console.log('');
        console.log(chalk.white('  1. Twitter/X'));
        console.log(chalk.white('  2. Instagram'));
        console.log(chalk.white('  3. Facebook'));
        console.log(chalk.white('  4. All platforms'));
        console.log(chalk.white('  0. Skip'));
        console.log('');

        const choice = await this.prompt('Select platforms (comma-separated, e.g., 1,2,3 or 4 for all): ');
        
        const selected = new Set();
        const choices = choice.split(',').map(c => c.trim());

        for (const c of choices) {
            if (c === '0') return [];
            if (c === '4') {
                return ['twitter', 'instagram', 'facebook'];
            }
            if (c === '1') selected.add('twitter');
            if (c === '2') selected.add('instagram');
            if (c === '3') selected.add('facebook');
        }

        return Array.from(selected);
    }

    /**
     * Review single announcement
     */
    async reviewAnnouncement(platform, announcement) {
        const platformConfig = this.socialService.platformLimits[platform];
        
        // Format for platform
        this.socialService.formatForPlatform(announcement, platform);

        console.log(chalk.green(`\n✅ Generated ${platformConfig.name} Announcement:`));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.white(announcement.fullText));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.gray(`Length: ${announcement.length}/${platformConfig.maxLength} characters`));
        
        // Validate
        const validation = this.socialService.validateAnnouncement(announcement, platform);
        if (!validation.valid) {
            validation.issues.forEach(issue => {
                console.log(chalk.red(`⚠️  ${issue.message}`));
            });
        } else {
            console.log(chalk.green(`✅ Fits within ${platformConfig.name} limits`));
        }
        console.log('');

        // Options
        const action = await this.prompt('Options: (1) Use as-is, (2) Edit, (3) Regenerate, (4) Discard: ');
        
        if (action === '2') {
            return await this.editAnnouncement(announcement, platform);
        } else if (action === '3') {
            // Regenerate by returning null
            return null;
        } else if (action === '4') {
            return null;
        }

        return announcement;
    }

    /**
     * Review multiple variations
     */
    async reviewVariations(platform, variations) {
        const platformConfig = this.socialService.platformLimits[platform];
        
        console.log(chalk.green(`\n✅ Generated ${variations.length} Variations for ${platformConfig.name}:`));
        
        variations.forEach((variation, index) => {
            this.socialService.formatForPlatform(variation, platform);
            
            console.log(chalk.cyan(`\n📝 Variation ${index + 1}:`));
            console.log(chalk.gray('─'.repeat(60)));
            console.log(chalk.white(variation.fullText));
            console.log(chalk.gray(`Length: ${variation.length}/${platformConfig.maxLength} characters`));
            
            const validation = this.socialService.validateAnnouncement(variation, platform);
            if (!validation.valid) {
                validation.issues.forEach(issue => {
                    console.log(chalk.red(`   ⚠️  ${issue.message}`));
                });
            }
        });

        const choice = await this.prompt(`\nSelect variation (1-${variations.length}) or (e)dit, (r)egenerate all, (s)kip: `);
        
        if (choice.toLowerCase() === 'e') {
            // Edit selected variation
            const editChoice = await this.prompt(`Which variation to edit? (1-${variations.length}): `);
            const editIndex = parseInt(editChoice) - 1;
            if (editIndex >= 0 && editIndex < variations.length) {
                return await this.editAnnouncement(variations[editIndex], platform);
            }
        } else if (choice.toLowerCase() === 'r') {
            return null; // Signal to regenerate
        } else if (choice.toLowerCase() === 's') {
            return null; // Skip
        } else {
            const selectedIndex = parseInt(choice) - 1;
            if (selectedIndex >= 0 && selectedIndex < variations.length) {
                return variations[selectedIndex];
            }
        }

        return variations[0]; // Default to first
    }

    /**
     * Edit announcement text
     */
    async editAnnouncement(announcement, platform) {
        console.log(chalk.cyan(`\n✏️ Editing ${this.socialService.platformLimits[platform].name} Announcement:`));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.white(announcement.text));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.yellow('Enter new text (press Enter twice or type END to finish):'));

        const lines = [];
        let emptyCount = 0;

        while (true) {
            const line = await this.prompt('');
            
            if (line.toLowerCase() === 'end') {
                break;
            }
            
            if (line.trim() === '') {
                emptyCount++;
                if (emptyCount >= 2) {
                    break;
                }
                lines.push('');
            } else {
                emptyCount = 0;
                lines.push(line);
            }
        }

        const editedText = lines.join('\n').trim();
        if (editedText) {
            announcement.text = editedText;
            this.socialService.formatForPlatform(announcement, platform);
            console.log(chalk.green('✅ Announcement updated'));
        }

        return announcement;
    }

    /**
     * Save announcements to file and/or update episode
     */
    async saveAnnouncements(episode, announcements) {
        if (Object.keys(announcements).length === 0) {
            return;
        }

        console.log(chalk.cyan('\n💾 Saving Announcements...'));

        // Save to JSON file
        const reportsDir = path.join(process.cwd(), 'reports', 'social-media');
        try {
            await fs.mkdir(reportsDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `announcements-${episode.id}-${timestamp}.json`;
        const filepath = path.join(reportsDir, filename);

        const data = {
            episode: {
                id: episode.id,
                title: episode.title,
                season: episode.season,
                episodeNumber: episode.episodeNumber
            },
            generatedAt: new Date().toISOString(),
            announcements: announcements
        };

        await fs.writeFile(filepath, JSON.stringify(data, null, 2));

        console.log(chalk.green(`✅ Announcements saved to: ${filepath}`));

        // Optionally update episode with social media data
        const updateEpisode = await this.prompt('\nSave announcements to episode metadata? (y/n, default: n): ');
        if (updateEpisode.toLowerCase() === 'y' && this.stateManager) {
            try {
                // Update episode with social media announcements
                const socialMediaData = {};
                Object.entries(announcements).forEach(([platform, items]) => {
                    socialMediaData[platform] = items.map(item => ({
                        text: item.text,
                        fullText: item.fullText,
                        hashtags: item.hashtags,
                        length: item.length,
                        generatedAt: new Date().toISOString()
                    }));
                });

                await this.stateManager.updateEpisode(episode.id, {
                    socialMediaAnnouncements: socialMediaData
                });

                console.log(chalk.green('✅ Announcements saved to episode metadata'));
            } catch (error) {
                console.log(chalk.yellow(`⚠️  Failed to update episode: ${error.message}`));
            }
        }
    }

    /**
     * Helper: Prompt user
     */
    prompt(question) {
        return new Promise((resolve) => {
            this.rl.question(chalk.yellow(question), resolve);
        });
    }
}

module.exports = SocialMediaStep;

