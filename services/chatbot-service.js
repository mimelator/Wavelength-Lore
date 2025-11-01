/**
 * Chatbot Service
 * 
 * Reusable wrapper for the Wavelength lore chatbot API.
 * Provides context-aware chatbot interactions for content editing workflows.
 * 
 * GitHub Issue: Phase 4 - Chatbot Integration for CTA and Content Enhancement
 */

const https = require('https');
const chalk = require('chalk');
require('dotenv').config();

class ChatbotService {
    constructor(options = {}) {
        this.chatbotUrl = options.chatbotUrl || 'us-central1-wavelength-lore.cloudfunctions.net';
        this.apiKey = options.apiKey || process.env.CHATBOT_API_KEY;
        this.conversationHistory = [];
        this.context = null; // Current item being edited
        this.requestQueue = [];
        this.processing = false;
        this.rateLimitDelay = options.rateLimitDelay || 1000; // 1 second between requests
        
        if (!this.apiKey) {
            console.warn(chalk.yellow('⚠️  CHATBOT_API_KEY not set. Chatbot features will not work.'));
        }
    }

    /**
     * Set context for current editing session
     * @param {Object} item - Current item being edited (episode, character, lore, etc.)
     */
    setContext(item) {
        this.context = item;
        
        // Add context to conversation history if item provided
        if (item) {
            const contextMessage = {
                role: 'system',
                content: `You are helping edit content for: ${item.title || item.id || 'item'} (ID: ${item.id}). Context: ${JSON.stringify({
                    type: item.type || 'unknown',
                    title: item.title,
                    description: item.description ? item.description.substring(0, 200) + '...' : undefined,
                    season: item.season,
                    episodeNumber: item.episodeNumber
                })}`
            };
            
            // Remove any existing system context
            this.conversationHistory = this.conversationHistory.filter(msg => msg.role !== 'system');
            this.conversationHistory.unshift(contextMessage);
        }
    }

    /**
     * Clear context and conversation history
     */
    clearContext() {
        this.context = null;
        this.conversationHistory = this.conversationHistory.filter(msg => msg.role !== 'user' || msg.role !== 'assistant');
    }

    /**
     * Ask chatbot a question with context
     * @param {string} prompt - Question or prompt for the chatbot
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response object with success, response, metadata, usage
     */
    async ask(prompt, options = {}) {
        if (!this.apiKey) {
            return {
                success: false,
                error: 'CHATBOT_API_KEY not configured'
            };
        }

        // Build full prompt with context if available
        const fullPrompt = this.context && options.useContext !== false
            ? `${prompt}\n\nContext: Editing ${this.context.title || this.context.id || 'content'}`
            : prompt;

        // Queue request for rate limiting
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ 
                prompt: fullPrompt, 
                originalPrompt: prompt,
                resolve, 
                reject,
                options 
            });
            this.processQueue();
        });
    }

    /**
     * Process request queue with rate limiting
     */
    async processQueue() {
        if (this.processing || this.requestQueue.length === 0) return;
        
        this.processing = true;
        
        while (this.requestQueue.length > 0) {
            const { prompt, originalPrompt, resolve, reject, options } = this.requestQueue.shift();
            
            try {
                const result = await this.sendToChatbot(prompt, options);
                
                // Update conversation history on success
                if (result.success && !options.skipHistory) {
                    this.conversationHistory.push(
                        { role: 'user', content: originalPrompt || prompt },
                        { role: 'assistant', content: result.response }
                    );
                    
                    // Keep only last 20 messages to manage token usage
                    const userMessages = this.conversationHistory.filter(msg => msg.role === 'user' || msg.role === 'assistant');
                    if (userMessages.length > 20) {
                        const systemContext = this.conversationHistory.filter(msg => msg.role === 'system');
                        this.conversationHistory = [...systemContext, ...userMessages.slice(-20)];
                    }
                }
                
                resolve(result);
            } catch (error) {
                reject(error);
            }
            
            // Rate limiting delay (except for last request)
            if (this.requestQueue.length > 0) {
                await new Promise(res => setTimeout(res, this.rateLimitDelay));
            }
        }
        
        this.processing = false;
    }

    /**
     * Send message to chatbot API
     * @param {string} message - Message to send
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response object
     */
    async sendToChatbot(message, options = {}) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            // Prepare conversation history (include system context if available)
            const conversationHistory = options.resetHistory 
                ? []
                : this.conversationHistory.filter(msg => msg.role === 'user' || msg.role === 'assistant');
            
            const postData = JSON.stringify({ 
                message: message,
                conversationHistory: conversationHistory,
                context: options.context || (this.context ? 'content-editing' : 'general')
            });
            
            const requestOptions = {
                hostname: this.chatbotUrl,
                port: 443,
                path: '/legacy/chat',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'X-API-Key': this.apiKey,
                    'User-Agent': 'Wavelength-CLI-Chatbot-Service'
                },
                timeout: options.timeout || 30000
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    
                    try {
                        const response = JSON.parse(data);
                        
                        if (res.statusCode === 200 && (response.response || response.success)) {
                            const rawResponse = response.response || response.message || '';
                            const cleanedResponse = this.cleanHTMLLinks(rawResponse);
                            
                            resolve({
                                success: true,
                                response: cleanedResponse,
                                rawResponse: rawResponse,
                                metadata: response.metadata || {},
                                usage: response.usage || {},
                                responseTime: responseTime
                            });
                        } else {
                            resolve({
                                success: false,
                                error: response.error || response.message || `HTTP ${res.statusCode}`,
                                responseTime: responseTime
                            });
                        }
                    } catch (parseError) {
                        resolve({
                            success: false,
                            error: `Parse error: ${parseError.message}. Raw: ${data.substring(0, 200)}...`,
                            responseTime: responseTime
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Clean HTML links and tags from response
     * @param {string} response - Response text with potential HTML
     * @returns {string} Cleaned response
     */
    cleanHTMLLinks(response) {
        if (!response || typeof response !== 'string') return '';
        
        // Remove HTML links but keep the text content
        let cleaned = response.replace(/<a[^>]*>([^<]+)<\/a>/g, '$1');
        
        // Remove any remaining HTML tags
        cleaned = cleaned.replace(/<[^>]*>/g, '');
        
        // Clean up extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
    }

    /**
     * Generate CTA text for an item
     * @param {string} ctaType - Type of CTA (tagline, cliffhanger, hook, tease, stakes, etc.)
     * @param {Object} item - Item to generate CTA for
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Generated CTA text
     */
    async generateCTA(ctaType, item, options = {}) {
        // Set context if item provided
        if (item && !this.context) {
            this.setContext(item);
        }

        const ctaPrompts = {
            tagline: `Generate a compelling tagline (5-8 words max) for "${item.title || item.id}". Make it mysterious, character-specific, and engaging. Return only the tagline, no explanation.`,
            
            cliffhanger: `Write a dramatic cliffhanger hook (1-2 sentences) for "${item.title || item.id}" that leaves viewers/readers wanting more. Make it specific to the story and character stakes. Return only the cliffhanger, no explanation.`,
            
            hook: `Create an intriguing hook (1-2 sentences) about "${item.title || item.id}" that makes readers curious. Focus on mystery and engagement. Return only the hook, no explanation.`,
            
            tease: `Create a mysterious tease (1-2 sentences) for the next episode/story about "${item.title || item.id}". Build anticipation without revealing too much. Return only the tease, no explanation.`,
            
            stakes: `Describe the stakes (2-3 sentences) for the character or situation in "${item.title || item.id}". What do they have to lose? What's at risk? Make it compelling and specific. Return only the stakes description, no explanation.`,
            
            power_statement: `Write a power statement (2-3 sentences) about "${item.title || item.id}" that describes their abilities, influence, or significance in the Wavelength universe. Make it epic and memorable. Return only the power statement, no explanation.`
        };

        const prompt = ctaPrompts[ctaType] || options.customPrompt;
        
        if (!prompt) {
            throw new Error(`Unknown CTA type: ${ctaType}. Available types: ${Object.keys(ctaPrompts).join(', ')}`);
        }

        const result = await this.ask(prompt, { skipHistory: options.skipHistory });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to generate CTA');
        }

        return result.response;
    }

    /**
     * Enhance a specific field for an item
     * @param {Object} item - Item being edited
     * @param {string} fieldName - Name of field to enhance
     * @param {Object} options - Additional options
     * @returns {Promise<string>} Enhanced field value
     */
    async enhanceField(item, fieldName, options = {}) {
        // Set context
        if (!this.context) {
            this.setContext(item);
        }

        const currentValue = item[fieldName] || '';
        
        const enhancementPrompts = {
            title: `Improve the title "${currentValue}" for this Wavelength content. Make it more engaging and memorable while staying true to the lore. Return only the improved title, no explanation.`,
            
            description: `Improve this description for "${item.title || item.id}":\n\n${currentValue}\n\nMake it more engaging, vivid, and compelling while staying true to Wavelength lore. Return only the improved description, no explanation.`,
            
            tagline: `Improve this tagline "${currentValue}" for "${item.title || item.id}". Make it more compelling and memorable. Return only the improved tagline, no explanation.`,
            
            name: `Suggest a better name for this Wavelength character/location/item. Current name: "${currentValue}". Consider Wavelength lore and naming conventions. Return only the suggested name, no explanation.`
        };

        const prompt = enhancementPrompts[fieldName] || options.customPrompt || 
            `Improve the ${fieldName} for "${item.title || item.id}":\n\n${currentValue}\n\nMake it better while staying true to Wavelength lore. Return only the improved ${fieldName}, no explanation.`;

        const result = await this.ask(prompt, { skipHistory: options.skipHistory });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to enhance field');
        }

        return result.response;
    }

    /**
     * Get general suggestions for improving an item
     * @param {Object} item - Item to get suggestions for
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Suggestions object with field-specific recommendations
     */
    async getSuggestions(item, options = {}) {
        if (!this.context) {
            this.setContext(item);
        }

        const prompt = `Review this Wavelength content and suggest improvements:\n\n${JSON.stringify({
            title: item.title,
            description: item.description,
            type: item.type
        }, null, 2)}\n\nProvide specific, actionable suggestions for improving the title, description, and any missing CTA elements. Be concise and focused.`;

        const result = await this.ask(prompt, { skipHistory: options.skipHistory });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to get suggestions');
        }

        return {
            suggestions: result.response,
            metadata: result.metadata,
            usage: result.usage
        };
    }

    /**
     * Check if chatbot service is available
     * @returns {Promise<boolean>} True if chatbot is accessible
     */
    async checkHealth() {
        if (!this.apiKey) {
            return false;
        }

        try {
            const result = await this.ask('Hello', { skipHistory: true, timeout: 5000 });
            return result.success;
        } catch (error) {
            return false;
        }
    }
}

module.exports = ChatbotService;

