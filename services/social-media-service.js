/**
 * Social Media Announcement Service
 * 
 * Generates platform-specific social media announcements for episodes, characters, and lore.
 * Uses the Wavelength chatbot for intelligent, lore-aware announcement generation.
 * 
 * GitHub Issue: Phase 4.2 - Social Media Announcement Generator
 */

const chalk = require('chalk');
const ChatbotService = require('./chatbot-service');

class SocialMediaService {
    constructor(options = {}) {
        this.chatbotService = new ChatbotService(options);
        this.brandHashtags = [
            '#WavelengthLore',
            '#Wavelength',
            '#Lore',
            '#FantasyStorytelling',
            '#InteractiveStory'
        ];
        
        // Platform-specific character limits and requirements
        this.platformLimits = {
            twitter: {
                name: 'Twitter/X',
                maxLength: 280,
                supportsImages: true,
                supportsVideos: true,
                hashtagLimit: 3, // Best practice: 1-3 hashtags
                mentionsLimit: 2
            },
            instagram: {
                name: 'Instagram',
                maxLength: 2200, // Caption limit
                supportsImages: true,
                supportsVideos: true,
                hashtagLimit: 30, // Max 30 hashtags
                mentionsLimit: 20
            },
            facebook: {
                name: 'Facebook',
                maxLength: 63206,
                supportsImages: true,
                supportsVideos: true,
                hashtagLimit: 5, // Best practice: 2-5 hashtags
                mentionsLimit: 10
            }
        };
    }

    /**
     * Set context for announcement generation
     * @param {Object} item - Episode, character, or lore item
     */
    setContext(item) {
        this.chatbotService.setContext(item);
    }

    /**
     * Generate social media announcement for an item
     * @param {Object} item - Episode, character, or lore item
     * @param {string} platform - Platform: 'twitter', 'instagram', 'facebook'
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Generated announcement with text, hashtags, etc.
     */
    async generateAnnouncement(item, platform = 'twitter', options = {}) {
        const platformConfig = this.platformLimits[platform];
        if (!platformConfig) {
            throw new Error(`Unknown platform: ${platform}. Supported: ${Object.keys(this.platformLimits).join(', ')}`);
        }

        // Set context if item provided
        if (item && !this.chatbotService.context) {
            this.setContext(item);
        }

        // Build platform-specific prompt
        const prompt = this.buildAnnouncementPrompt(item, platform, options);

        try {
            // Generate announcement text using chatbot
            const result = await this.chatbotService.ask(prompt);

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate announcement');
            }

            // Parse and format the response
            const announcement = this.parseAnnouncement(result.response, platform, item);

            // Generate hashtags
            announcement.hashtags = await this.generateHashtags(item, platform, options);

            // Format for platform (adds hashtags to fullText)
            this.formatForPlatform(announcement, platform);

            // Add platform metadata
            announcement.platform = platform;
            announcement.platformName = platformConfig.name;
            announcement.maxLength = platformConfig.maxLength;
            announcement.length = announcement.fullText.length;
            announcement.fits = announcement.length <= platformConfig.maxLength;
            announcement.charactersRemaining = platformConfig.maxLength - announcement.length;

            return announcement;
        } catch (error) {
            throw new Error(`Failed to generate ${platformConfig.name} announcement: ${error.message}`);
        }
    }

    /**
     * Build prompt for announcement generation
     */
    buildAnnouncementPrompt(item, platform, options = {}) {
        const platformConfig = this.platformLimits[platform];
        const itemType = item.type || (item.season ? 'episode' : item.role ? 'character' : 'lore');
        
        let prompt = `Generate a compelling social media announcement for ${platformConfig.name} about this Wavelength content:\n\n`;
        
        // Add item details
        prompt += `Title: ${item.title || item.name || item.id}\n`;
        if (item.description) {
            prompt += `Description: ${item.description.substring(0, 300)}${item.description.length > 300 ? '...' : ''}\n`;
        }
        if (item.season && item.episodeNumber) {
            prompt += `Season ${item.season}, Episode ${item.episodeNumber}\n`;
        }
        if (item.releaseDate) {
            prompt += `Release: ${item.releaseDate}\n`;
        }
        
        prompt += `\nPlatform Requirements:\n`;
        prompt += `- Maximum length: ${platformConfig.maxLength} characters\n`;
        prompt += `- Platform: ${platformConfig.name}\n`;
        
        // Platform-specific style guidance
        if (platform === 'twitter') {
            prompt += `- Style: Concise, engaging, hook in first line\n`;
            prompt += `- Include 1-2 strategic hashtags\n`;
            prompt += `- Use line breaks for readability\n`;
            prompt += `- End with a call-to-action or question\n`;
        } else if (platform === 'instagram') {
            prompt += `- Style: Storytelling, engaging, visually descriptive\n`;
            prompt += `- Can be longer (but keep it engaging)\n`;
            prompt += `- Include relevant hashtags (10-15 max for this platform)\n`;
            prompt += `- Use emojis strategically\n`;
        } else if (platform === 'facebook') {
            prompt += `- Style: Narrative, informative, community-focused\n`;
            prompt += `- Can include more context and storytelling\n`;
            prompt += `- Include 2-5 relevant hashtags\n`;
            prompt += `- Encourage engagement with questions\n`;
        }

        // Add custom instructions if provided
        if (options.tone) {
            prompt += `- Tone: ${options.tone}\n`;
        }
        if (options.focus) {
            prompt += `- Focus on: ${options.focus}\n`;
        }
        if (options.callToAction) {
            prompt += `- Include call-to-action: ${options.callToAction}\n`;
        }

        prompt += `\nReturn ONLY the announcement text, no explanation. Make it engaging, authentic to Wavelength lore, and optimized for ${platformConfig.name}.`;

        return prompt;
    }

    /**
     * Parse chatbot response into structured announcement
     */
    parseAnnouncement(rawText, platform, item) {
        // Clean up the response
        let text = rawText.trim();
        
        // Remove any markdown formatting if present
        text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
        text = text.replace(/\*(.*?)\*/g, '$1'); // Italic
        text = text.replace(/`(.*?)`/g, '$1'); // Code
        
        // Remove hashtags from main text (we'll add them separately)
        const hashtagMatches = text.match(/#\w+/g);
        const existingHashtags = hashtagMatches || [];
        text = text.replace(/#\w+/g, '').trim();
        
        // Clean up extra whitespace
        text = text.replace(/\n{3,}/g, '\n\n').trim();

        return {
            text: text,
            fullText: text, // Will be updated with hashtags
            existingHashtags: existingHashtags.map(h => h.substring(1)) // Remove # prefix
        };
    }

    /**
     * Generate hashtags for announcement
     */
    async generateHashtags(item, platform, options = {}) {
        const platformConfig = this.platformLimits[platform];
        const maxHashtags = Math.min(platformConfig.hashtagLimit, options.maxHashtags || platformConfig.hashtagLimit);

        try {
            // Generate hashtags using chatbot
            const prompt = `Generate ${maxHashtags} relevant hashtags for this Wavelength content on ${platformConfig.name}:\n\n` +
                         `Title: ${item.title || item.name || item.id}\n` +
                         `${item.description ? `Description: ${item.description.substring(0, 200)}...\n` : ''}` +
                         `\nRequirements:\n` +
                         `- Mix of brand hashtags (#WavelengthLore, #Wavelength) and content-specific hashtags\n` +
                         `- Max ${maxHashtags} hashtags total\n` +
                         `- Make them relevant, engaging, and appropriate for ${platformConfig.name}\n` +
                         `- Return ONLY the hashtags, one per line, with # prefix`;

            const result = await this.chatbotService.ask(prompt);
            
            if (result.success) {
                // Parse hashtags from response
                const hashtagLines = result.response.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.startsWith('#') && line.length > 1);
                
                // Combine with brand hashtags
                const generated = hashtagLines.map(h => h.substring(1)); // Remove # prefix
                const combined = [...new Set([...this.brandHashtags.map(h => h.substring(1)), ...generated])];
                
                // Limit to maxHashtags
                return combined.slice(0, maxHashtags);
            }
        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Hashtag generation failed: ${error.message}`));
        }

        // Fallback to brand hashtags only
        return this.brandHashtags.map(h => h.substring(1)).slice(0, maxHashtags);
    }

    /**
     * Format announcement for specific platform
     */
    formatForPlatform(announcement, platform) {
        const platformConfig = this.platformLimits[platform];
        let formatted = announcement.text;

        // Add hashtags
        if (announcement.hashtags && announcement.hashtags.length > 0) {
            const hashtags = announcement.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
            
            if (platform === 'twitter') {
                // Twitter: hashtags on same line if space, otherwise new line
                if (formatted.length + hashtags.length + 1 <= platformConfig.maxLength) {
                    formatted = `${formatted}\n\n${hashtags}`;
                } else {
                    formatted = `${formatted}\n\n${hashtags}`;
                }
            } else if (platform === 'instagram') {
                // Instagram: hashtags typically at the end, separated by line breaks
                formatted = `${formatted}\n\n${hashtags}`;
            } else if (platform === 'facebook') {
                // Facebook: hashtags at the end
                formatted = `${formatted}\n\n${hashtags}`;
            }
        }

        // Update full text and length
        announcement.fullText = formatted;
        announcement.length = formatted.length;
        announcement.fits = formatted.length <= platformConfig.maxLength;
        announcement.charactersRemaining = platformConfig.maxLength - formatted.length;

        return formatted;
    }

    /**
     * Generate multiple variations for A/B testing
     */
    async generateVariations(item, platform, count = 3, options = {}) {
        const variations = [];

        for (let i = 0; i < count; i++) {
            try {
                const variation = await this.generateAnnouncement(item, platform, {
                    ...options,
                    variationNumber: i + 1,
                    totalVariations: count
                });
                
                // Format for platform
                this.formatForPlatform(variation, platform);
                
                variations.push(variation);
                
                // Small delay between generations
                if (i < count - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.warn(chalk.yellow(`⚠️  Failed to generate variation ${i + 1}: ${error.message}`));
            }
        }

        return variations;
    }

    /**
     * Validate announcement against platform limits
     */
    validateAnnouncement(announcement, platform) {
        const platformConfig = this.platformLimits[platform];
        const issues = [];

        if (announcement.length > platformConfig.maxLength) {
            issues.push({
                type: 'length',
                message: `Exceeds ${platformConfig.name} limit: ${announcement.length}/${platformConfig.maxLength} characters`,
                severity: 'error'
            });
        }

        if (announcement.hashtags && announcement.hashtags.length > platformConfig.hashtagLimit) {
            issues.push({
                type: 'hashtags',
                message: `Too many hashtags: ${announcement.hashtags.length}/${platformConfig.hashtagLimit} (best practice)`,
                severity: 'warning'
            });
        }

        return {
            valid: issues.filter(i => i.severity === 'error').length === 0,
            issues: issues
        };
    }
}

module.exports = SocialMediaService;

