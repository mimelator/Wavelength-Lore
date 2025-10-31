/**
 * Firebase Episode Service
 * 
 * Manages episodes in Firebase Realtime Database with full CRUD operations,
 * proper indexing, validation, and relationship management.
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 */

const { getAdminDatabase, fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
const { validateEpisodeData } = require('../utils/episode-validator');
const admin = require('firebase-admin');

class FirebaseEpisodeService {
    constructor() {
        this.db = getAdminDatabase();
        
        if (!this.db) {
            throw new Error('Firebase Admin SDK not initialized');
        }
        
        this.episodesRef = this.db.ref('videos');
        this.songsRef = this.db.ref('songs');
        
        console.log('📺 Firebase Episode Service initialized');
    }

    /**
     * Create new episode in Firebase
     * @param {Object} episodeData - Episode data
     * @returns {Promise<string>} - Episode ID
     */
    async createEpisode(episodeData) {
        try {
            // Validate episode data
            const validationResult = validateEpisodeData(episodeData);
            if (!validationResult.isValid) {
                throw new Error(`Invalid episode data: ${validationResult.errors.join(', ')}`);
            }

            // Generate episode ID and paths
            const episodeId = this.generateEpisodeId(episodeData.season, episodeData.episodeNumber);
            const seasonPath = `season${episodeData.season}`;
            const episodePath = `episode${episodeData.episodeNumber}`;

            // Prepare episode record
            const episodeRecord = {
                id: episodeId,
                title: episodeData.title,
                description: episodeData.description || '',
                season: parseInt(episodeData.season),
                episodeNumber: parseInt(episodeData.episodeNumber),
                youtubeLink: episodeData.youtubeLink || '',
                image: episodeData.image || this.generateDefaultImagePath(episodeData.season, episodeData.episodeNumber),
                carouselImages: episodeData.carouselImages || [],
                keywords: episodeData.keywords || [],
                characters: episodeData.characters || [],
                loreItems: episodeData.loreItems || [],
                published: episodeData.published !== undefined ? episodeData.published : true,
                publishedAt: episodeData.published ? admin.database.ServerValue.TIMESTAMP : null,
                createdAt: admin.database.ServerValue.TIMESTAMP,
                updatedAt: admin.database.ServerValue.TIMESTAMP,
                metadata: {
                    duration: episodeData.duration || '',
                    genre: episodeData.genre || 'Fantasy Adventure',
                    mood: episodeData.mood || 'adventure',
                    contentWarnings: episodeData.contentWarnings || [],
                    ...episodeData.metadata
                }
            };

            // Save to Firebase
            const episodeRef = this.episodesRef.child(seasonPath).child('episodes').child(episodePath);
            await episodeRef.set(episodeRecord);
            
            console.log(`✅ Episode ${episodeId} created successfully`);
            return episodeId;

        } catch (error) {
            console.error('Error creating episode:', error);
            throw error;
        }
    }

    /**
     * Update existing episode
     * @param {string} episodeId - Episode identifier (e.g., 's1e1')
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateEpisode(episodeId, updates) {
        try {
            const { season, episodeNumber } = this.parseEpisodeId(episodeId);
            const seasonPath = `season${season}`;
            const episodePath = `episode${episodeNumber}`;

            // Validate updates
            const validationResult = validateEpisodeData(updates, true); // Partial validation
            if (!validationResult.isValid) {
                throw new Error(`Invalid update data: ${validationResult.errors.join(', ')}`);
            }

            // Prepare update object
            const updateData = {
                ...updates,
                updatedAt: admin.database.ServerValue.TIMESTAMP
            };

            // Update published timestamp if publishing
            if (updates.published === true) {
                updateData.publishedAt = admin.database.ServerValue.TIMESTAMP;
            } else if (updates.published === false) {
                updateData.publishedAt = null;
            }

            // Update in Firebase
            const episodeRef = this.episodesRef.child(seasonPath).child('episodes').child(episodePath);
            await episodeRef.update(updateData);

            // Sync with related song if exists
            await this.syncEpisodeWithSong(episodeId, updateData);
            
            console.log(`✅ Episode ${episodeId} updated successfully`);

        } catch (error) {
            console.error(`Error updating episode ${episodeId}:`, error);
            throw error;
        }
    }

    /**
     * Delete episode (soft delete by default)
     * @param {string} episodeId - Episode identifier
     * @param {boolean} hardDelete - Whether to permanently delete
     * @returns {Promise<void>}
     */
    async deleteEpisode(episodeId, hardDelete = false) {
        try {
            const { season, episodeNumber } = this.parseEpisodeId(episodeId);
            const seasonPath = `season${season}`;
            const episodePath = `episode${episodeNumber}`;
            const episodeRef = this.episodesRef.child(seasonPath).child('episodes').child(episodePath);

            if (hardDelete) {
                // Permanent deletion
                await episodeRef.remove();
                console.log(`🗑️ Episode ${episodeId} permanently deleted`);
            } else {
                // Soft delete - mark as unpublished and hidden
                await episodeRef.update({
                    published: false,
                    hidden: true,
                    deletedAt: admin.database.ServerValue.TIMESTAMP,
                    updatedAt: admin.database.ServerValue.TIMESTAMP
                });
                console.log(`🔒 Episode ${episodeId} soft deleted (hidden)`);
            }

            // Update related song status
            await this.syncEpisodeWithSong(episodeId, { published: false });

        } catch (error) {
            console.error(`Error deleting episode ${episodeId}:`, error);
            throw error;
        }
    }

    /**
     * Get episode by ID
     * @param {string} episodeId - Episode identifier
     * @returns {Promise<Object|null>} - Episode object or null
     */
    async getEpisodeById(episodeId) {
        try {
            const { season, episodeNumber } = this.parseEpisodeId(episodeId);
            const episodePath = `videos/season${season}/episodes/episode${episodeNumber}`;
            
            const episodeData = await fetchDataAsAdmin(episodePath);
            
            if (episodeData) {
                return {
                    ...episodeData,
                    id: episodeId
                };
            }
            
            return null;

        } catch (error) {
            console.error(`Error fetching episode ${episodeId}:`, error);
            throw error;
        }
    }

    /**
     * Get all episodes with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of episode objects
     */
    async getAllEpisodes(filters = {}) {
        try {
            console.log('📺 Fetching episodes with filters:', filters);

            const videosData = await fetchDataAsAdmin('videos');
            if (!videosData) {
                return [];
            }

            const episodes = [];
            
            // Extract episodes from all seasons
            for (const seasonId in videosData) {
                const seasonData = videosData[seasonId];
                
                if (seasonData.episodes) {
                    for (const episodeId in seasonData.episodes) {
                        const episodeData = seasonData.episodes[episodeId];
                        
                        if (episodeData.title) {
                            const season = parseInt(seasonId.replace('season', ''));
                            const episodeNumber = parseInt(episodeId.replace('episode', ''));
                            
                            const episode = {
                                ...episodeData,
                                id: `s${season}e${episodeNumber}`,
                                season: season,
                                episodeNumber: episodeNumber
                            };

                            // Apply filters
                            if (this.matchesFilters(episode, filters)) {
                                episodes.push(episode);
                            }
                        }
                    }
                }
            }

            // Sort episodes
            episodes.sort((a, b) => {
                if (a.season !== b.season) {
                    return a.season - b.season;
                }
                return a.episodeNumber - b.episodeNumber;
            });

            console.log(`📺 Retrieved ${episodes.length} episodes`);
            return episodes;

        } catch (error) {
            console.error('Error fetching episodes:', error);
            throw error;
        }
    }

    /**
     * Clone episode with new data
     * @param {string} sourceEpisodeId - Source episode ID
     * @param {Object} newData - New episode data
     * @returns {Promise<string>} - New episode ID
     */
    async cloneEpisode(sourceEpisodeId, newData) {
        try {
            // Get source episode
            const sourceEpisode = await this.getEpisodeById(sourceEpisodeId);
            if (!sourceEpisode) {
                throw new Error(`Source episode ${sourceEpisodeId} not found`);
            }

            // Merge source data with new data
            const clonedData = {
                ...sourceEpisode,
                ...newData,
                // Clear timestamps and publishing info for clone
                publishedAt: null,
                createdAt: null,
                updatedAt: null,
                published: newData.published !== undefined ? newData.published : false
            };

            // Create new episode
            const newEpisodeId = await this.createEpisode(clonedData);
            
            console.log(`📄 Cloned episode ${sourceEpisodeId} to ${newEpisodeId}`);
            return newEpisodeId;

        } catch (error) {
            console.error(`Error cloning episode ${sourceEpisodeId}:`, error);
            throw error;
        }
    }

    /**
     * Publish or unpublish episode
     * @param {string} episodeId - Episode identifier
     * @param {boolean} published - Published status
     * @returns {Promise<void>}
     */
    async publishEpisode(episodeId, published) {
        try {
            await this.updateEpisode(episodeId, { 
                published: published,
                hidden: !published 
            });
            
            console.log(`📢 Episode ${episodeId} ${published ? 'published' : 'unpublished'}`);

        } catch (error) {
            console.error(`Error updating publish status for ${episodeId}:`, error);
            throw error;
        }
    }

    /**
     * Validate episode data integrity
     * @param {string} episodeId - Episode identifier
     * @param {Object} options - Validation options
     * @returns {Promise<Object>} - Validation result
     */
    async validateEpisode(episodeId, options = {}) {
        try {
            const episode = await this.getEpisodeById(episodeId);
            if (!episode) {
                throw new Error(`Episode ${episodeId} not found`);
            }

            const validationResult = {
                valid: true,
                warnings: [],
                errors: []
            };

            // Check required fields
            if (!episode.title || episode.title.trim().length === 0) {
                validationResult.errors.push('Title is required');
                validationResult.valid = false;
            }

            if (!episode.description || episode.description.trim().length === 0) {
                validationResult.warnings.push('Description is missing');
            }

            // Check image references if requested
            if (options.checkImages) {
                if (episode.image && !await this.validateImageUrl(episode.image)) {
                    validationResult.warnings.push(`Main image not accessible: ${episode.image}`);
                }

                if (episode.carouselImages) {
                    for (const imageUrl of episode.carouselImages) {
                        if (!await this.validateImageUrl(imageUrl)) {
                            validationResult.warnings.push(`Gallery image not accessible: ${imageUrl}`);
                        }
                    }
                }
            }

            // Check character references if requested
            if (options.checkReferences && episode.characters) {
                for (const characterId of episode.characters) {
                    if (!await this.validateCharacterExists(characterId)) {
                        validationResult.warnings.push(`Referenced character not found: ${characterId}`);
                    }
                }
            }

            console.log(`✅ Validated episode ${episodeId}: ${validationResult.valid ? 'VALID' : 'INVALID'}`);
            return validationResult;

        } catch (error) {
            console.error(`Error validating episode ${episodeId}:`, error);
            throw error;
        }
    }

    // Helper Methods

    /**
     * Generate episode ID from season and episode number
     */
    generateEpisodeId(season, episodeNumber) {
        return `s${season}e${episodeNumber}`;
    }

    /**
     * Parse episode ID to extract season and episode number
     */
    parseEpisodeId(episodeId) {
        const match = episodeId.match(/s(\d+)e(\d+)/);
        if (!match) {
            throw new Error(`Invalid episode ID format: ${episodeId}`);
        }
        
        return {
            season: parseInt(match[1]),
            episodeNumber: parseInt(match[2])
        };
    }

    /**
     * Generate default image path for episode
     */
    generateDefaultImagePath(season, episodeNumber) {
        return `/images/seasons/season${season}/episodes/episode${episodeNumber}/cover.webp`;
    }

    /**
     * Check if episode matches filters
     */
    matchesFilters(episode, filters) {
        // Season filter
        if (filters.season && episode.season !== filters.season) {
            return false;
        }

        // Published filter
        if (filters.published !== undefined && episode.published !== filters.published) {
            return false;
        }

        // Hidden filter
        if (filters.hidden !== undefined && episode.hidden !== filters.hidden) {
            return false;
        }

        // Keyword filter
        if (filters.keywords && filters.keywords.length > 0) {
            const episodeKeywords = episode.keywords || [];
            const hasMatchingKeyword = filters.keywords.some(keyword => 
                episodeKeywords.some(ek => ek.toLowerCase().includes(keyword.toLowerCase()))
            );
            if (!hasMatchingKeyword) {
                return false;
            }
        }

        // Text search filter
        if (filters.search) {
            const searchText = filters.search.toLowerCase();
            const searchableText = `${episode.title} ${episode.description}`.toLowerCase();
            if (!searchableText.includes(searchText)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Sync episode changes with related song
     */
    async syncEpisodeWithSong(episodeId, episodeUpdates) {
        try {
            const songRef = this.songsRef.child(episodeId);
            const songSnapshot = await songRef.once('value');
            
            if (songSnapshot.exists()) {
                const songUpdates = {
                    updatedAt: admin.database.ServerValue.TIMESTAMP
                };

                // Sync published status
                if (episodeUpdates.published !== undefined) {
                    songUpdates.published = episodeUpdates.published;
                }

                // Sync metadata
                if (episodeUpdates.title) {
                    songUpdates.title = episodeUpdates.title;
                }

                await songRef.update(songUpdates);
                console.log(`🔄 Synced song ${episodeId} with episode changes`);
            }

        } catch (error) {
            console.error(`Warning: Could not sync song with episode ${episodeId}:`, error.message);
            // Don't throw - this is a non-critical operation
        }
    }

    /**
     * Validate image URL accessibility
     */
    async validateImageUrl(imageUrl) {
        try {
            // This would make an HTTP request to check if image is accessible
            // For now, just check if it's a valid format
            return imageUrl && (imageUrl.startsWith('/') || imageUrl.startsWith('http'));
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate character exists
     */
    async validateCharacterExists(characterId) {
        try {
            const characterData = await fetchDataAsAdmin(`characters/${characterId}`);
            return !!characterData;
        } catch (error) {
            return false;
        }
    }
}

module.exports = FirebaseEpisodeService;