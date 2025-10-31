/**
 * Firebase Character Service
 * 
 * Manages characters in Firebase Realtime Database with full CRUD operations,
 * CTA field management, and relationship tracking.
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 * Related Issue: #80 - Character CTA Enhancement Fields
 */

const { getAdminDatabase, fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
const { validateCharacterData } = require('../utils/character-validator');
const admin = require('firebase-admin');

class FirebaseCharacterService {
    constructor() {
        this.db = getAdminDatabase();
        
        if (!this.db) {
            throw new Error('Firebase Admin SDK not initialized');
        }
        
        this.charactersRef = this.db.ref('characters');
        this.episodesRef = this.db.ref('videos');
        
        console.log('👥 Firebase Character Service initialized');
    }

    /**
     * Create new character in Firebase
     * @param {Object} characterData - Character data
     * @returns {Promise<string>} - Character ID
     */
    async createCharacter(characterData) {
        try {
            // Validate character data
            const validationResult = validateCharacterData(characterData);
            if (!validationResult.isValid) {
                throw new Error(`Invalid character data: ${validationResult.errors.join(', ')}`);
            }

            // Generate character ID if not provided
            const characterId = characterData.id || this.generateCharacterId(characterData.name);

            // Prepare character record
            const characterRecord = {
                id: characterId,
                name: characterData.name,
                title: characterData.title || characterData.name,
                role: characterData.role || 'supporting',
                
                // Core Character Data
                description: characterData.description || '',
                backstory: characterData.backstory || '',
                traits: characterData.traits || [],
                
                // CTA Enhancement Fields (Issue #80)
                tagline: characterData.tagline || '',
                stakes: characterData.stakes || '',
                cta_text: characterData.cta_text || 'Learn More',
                cta_hook: characterData.cta_hook || '',
                power_statement: characterData.power_statement || '',
                
                // Visual Assets
                image: characterData.image || this.generateDefaultImagePath(characterId),
                avatarGallery: characterData.avatarGallery || [],
                
                // Relationships & References
                episodes: characterData.episodes || [],
                relationships: characterData.relationships || {},
                loreConnections: characterData.loreConnections || [],
                
                // Publishing & Metadata
                published: characterData.published !== undefined ? characterData.published : true,
                publishedAt: characterData.published ? admin.database.ServerValue.TIMESTAMP : null,
                createdAt: admin.database.ServerValue.TIMESTAMP,
                updatedAt: admin.database.ServerValue.TIMESTAMP,
                
                metadata: {
                    characterType: characterData.characterType || 'supporting',
                    species: characterData.species || 'human',
                    age: characterData.age || '',
                    location: characterData.location || '',
                    weapons: characterData.weapons || [],
                    abilities: characterData.abilities || [],
                    aiEnhanced: characterData.aiEnhanced || false,
                    contentRating: characterData.contentRating || 'all-ages',
                    ...characterData.metadata
                }
            };

            // Save to Firebase
            await this.charactersRef.child(characterId).set(characterRecord);
            
            console.log(`✅ Character ${characterId} created successfully`);
            return characterId;

        } catch (error) {
            console.error('Error creating character:', error);
            throw error;
        }
    }

    /**
     * Update existing character
     * @param {string} characterId - Character identifier
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateCharacter(characterId, updates) {
        try {
            // Validate updates
            const validationResult = validateCharacterData(updates, true); // Partial validation
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

            // Track AI enhancement
            if (this.isAIEnhancement(updates)) {
                updateData['metadata.aiEnhanced'] = true;
                updateData['metadata.lastAIEnhancement'] = admin.database.ServerValue.TIMESTAMP;
            }

            // Update in Firebase
            await this.charactersRef.child(characterId).update(updateData);
            
            console.log(`✅ Character ${characterId} updated successfully`);

        } catch (error) {
            console.error(`Error updating character ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Delete character (soft delete by default)
     * @param {string} characterId - Character identifier
     * @param {boolean} hardDelete - Whether to permanently delete
     * @returns {Promise<void>}
     */
    async deleteCharacter(characterId, hardDelete = false) {
        try {
            const characterRef = this.charactersRef.child(characterId);

            if (hardDelete) {
                // Permanent deletion
                await characterRef.remove();
                console.log(`🗑️ Character ${characterId} permanently deleted`);
            } else {
                // Soft delete - mark as unpublished and hidden
                await characterRef.update({
                    published: false,
                    hidden: true,
                    deletedAt: admin.database.ServerValue.TIMESTAMP,
                    updatedAt: admin.database.ServerValue.TIMESTAMP
                });
                console.log(`🔒 Character ${characterId} soft deleted (hidden)`);
            }

            // TODO: Update episode references to remove this character

        } catch (error) {
            console.error(`Error deleting character ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Get character by ID
     * @param {string} characterId - Character identifier
     * @returns {Promise<Object|null>} - Character object or null
     */
    async getCharacterById(characterId) {
        try {
            const snapshot = await this.charactersRef.child(characterId).once('value');
            const character = snapshot.val();
            
            if (character) {
                return {
                    ...character,
                    id: characterId
                };
            }
            
            return null;

        } catch (error) {
            console.error(`Error fetching character ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Get all characters with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of character objects
     */
    async getAllCharacters(filters = {}) {
        try {
            console.log('👥 Fetching characters with filters:', filters);

            let query = this.charactersRef;

            // Apply role filter if specified
            if (filters.role) {
                query = query.orderByChild('role').equalTo(filters.role);
            } else {
                query = query.orderByChild('name');
            }

            const snapshot = await query.once('value');
            const characters = [];

            snapshot.forEach(childSnapshot => {
                const character = childSnapshot.val();
                
                // Apply additional filters
                if (this.matchesFilters(character, filters)) {
                    characters.push({
                        ...character,
                        id: childSnapshot.key
                    });
                }
            });

            // Sort characters
            characters.sort((a, b) => {
                // Sort by role priority, then by name
                const rolePriority = {
                    'protagonist': 1,
                    'main': 2, 
                    'supporting': 3,
                    'antagonist': 4,
                    'villain': 5,
                    'minor': 6
                };
                
                const aPriority = rolePriority[a.role] || 10;
                const bPriority = rolePriority[b.role] || 10;
                
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                
                // Safe name comparison - handle undefined names
                const aName = a.name || a.id || 'Unknown';
                const bName = b.name || b.id || 'Unknown';
                return aName.localeCompare(bName);
            });

            console.log(`👥 Retrieved ${characters.length} characters`);
            return characters;

        } catch (error) {
            console.error('Error fetching characters:', error);
            throw error;
        }
    }

    /**
     * Clone character with new data
     * @param {string} sourceCharacterId - Source character ID
     * @param {Object} newData - New character data
     * @returns {Promise<string>} - New character ID
     */
    async cloneCharacter(sourceCharacterId, newData) {
        try {
            // Get source character
            const sourceCharacter = await this.getCharacterById(sourceCharacterId);
            if (!sourceCharacter) {
                throw new Error(`Source character ${sourceCharacterId} not found`);
            }

            // Merge source data with new data
            const clonedData = {
                ...sourceCharacter,
                ...newData,
                // Clear timestamps and publishing info for clone
                publishedAt: null,
                createdAt: null,
                updatedAt: null,
                published: newData.published !== undefined ? newData.published : false,
                // Generate new ID based on new name
                id: newData.id || this.generateCharacterId(newData.name || sourceCharacter.name + '-clone')
            };

            // Create new character
            const newCharacterId = await this.createCharacter(clonedData);
            
            console.log(`📄 Cloned character ${sourceCharacterId} to ${newCharacterId}`);
            return newCharacterId;

        } catch (error) {
            console.error(`Error cloning character ${sourceCharacterId}:`, error);
            throw error;
        }
    }

    /**
     * Publish or unpublish character
     * @param {string} characterId - Character identifier
     * @param {boolean} published - Published status
     * @returns {Promise<void>}
     */
    async publishCharacter(characterId, published) {
        try {
            await this.updateCharacter(characterId, { 
                published: published,
                hidden: !published 
            });
            
            console.log(`📢 Character ${characterId} ${published ? 'published' : 'unpublished'}`);

        } catch (error) {
            console.error(`Error updating publish status for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Validate character data integrity
     * @param {string} characterId - Character identifier
     * @param {Object} options - Validation options
     * @returns {Promise<Object>} - Validation result
     */
    async validateCharacter(characterId, options = {}) {
        try {
            const character = await this.getCharacterById(characterId);
            if (!character) {
                throw new Error(`Character ${characterId} not found`);
            }

            const validationResult = {
                valid: true,
                warnings: [],
                errors: []
            };

            // Check required fields
            if (!character.name || character.name.trim().length === 0) {
                validationResult.errors.push('Name is required');
                validationResult.valid = false;
            }

            if (!character.description || character.description.trim().length === 0) {
                validationResult.warnings.push('Description is missing');
            }

            // Check CTA fields completeness (Issue #80)
            const ctaFields = ['tagline', 'stakes', 'cta_text', 'cta_hook', 'power_statement'];
            const missingCTAFields = ctaFields.filter(field => !character[field] || character[field].trim().length === 0);
            
            if (missingCTAFields.length > 0) {
                validationResult.warnings.push(`Missing CTA fields: ${missingCTAFields.join(', ')}`);
            }

            // Check image references if requested
            if (options.checkImages) {
                if (character.image && !await this.validateImageUrl(character.image)) {
                    validationResult.warnings.push(`Main image not accessible: ${character.image}`);
                }

                if (character.avatarGallery) {
                    for (const imageUrl of character.avatarGallery) {
                        if (!await this.validateImageUrl(imageUrl)) {
                            validationResult.warnings.push(`Avatar image not accessible: ${imageUrl}`);
                        }
                    }
                }
            }

            // Check episode references if requested
            if (options.checkReferences && character.episodes) {
                for (const episodeId of character.episodes) {
                    if (!await this.validateEpisodeExists(episodeId)) {
                        validationResult.warnings.push(`Referenced episode not found: ${episodeId}`);
                    }
                }
            }

            console.log(`✅ Validated character ${characterId}: ${validationResult.valid ? 'VALID' : 'INVALID'}`);
            return validationResult;

        } catch (error) {
            console.error(`Error validating character ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Generate avatar using AI (placeholder for future AI integration)
     * @param {string} characterId - Character identifier
     * @param {string} prompt - AI generation prompt
     * @returns {Promise<string>} - Generated image URL
     */
    async generateAvatar(characterId, prompt) {
        try {
            console.log(`🎨 Generating avatar for ${characterId} with prompt: ${prompt}`);
            
            // TODO: Integrate with AI image generation service
            // For now, return placeholder
            const placeholderUrl = `/images/characters/${characterId}/ai-generated-avatar-${Date.now()}.webp`;
            
            console.log(`🎨 Avatar generation placeholder: ${placeholderUrl}`);
            return placeholderUrl;

        } catch (error) {
            console.error(`Error generating avatar for ${characterId}:`, error);
            throw error;
        }
    }

    /**
     * Enhance character with AI content
     * @param {string} characterId - Character identifier
     * @param {string} prompt - Enhancement prompt
     * @returns {Promise<Object>} - AI enhancement suggestions
     */
    async enhanceWithAI(characterId, prompt) {
        try {
            const character = await this.getCharacterById(characterId);
            if (!character) {
                throw new Error(`Character ${characterId} not found`);
            }

            console.log(`🤖 Enhancing character ${characterId} with AI...`);
            
            // TODO: Integrate with AI service for character enhancement
            // For now, return placeholder enhancements
            const enhancements = {
                tagline: `Enhanced tagline for ${character.name}`,
                stakes: `AI-generated stakes for ${character.name}`,
                cta_hook: `Compelling hook for ${character.name}`,
                power_statement: `Powerful statement about ${character.name}`,
                enhanced_description: `AI-enhanced description for ${character.name}`
            };
            
            console.log(`🤖 AI enhancement placeholder generated for ${characterId}`);
            return enhancements;

        } catch (error) {
            console.error(`Error enhancing character ${characterId}:`, error);
            throw error;
        }
    }

    // Helper Methods

    /**
     * Generate character ID from name
     */
    generateCharacterId(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Generate default image path for character
     */
    generateDefaultImagePath(characterId) {
        return `/images/characters/${characterId}/portrait.webp`;
    }

    /**
     * Check if episode matches filters
     */
    matchesFilters(character, filters) {
        // Published filter
        if (filters.published !== undefined && character.published !== filters.published) {
            return false;
        }

        // Hidden filter
        if (filters.hidden !== undefined && character.hidden !== filters.hidden) {
            return false;
        }

        // Character type filter
        if (filters.characterType && character.metadata?.characterType !== filters.characterType) {
            return false;
        }

        // AI enhanced filter
        if (filters.aiEnhanced !== undefined && character.metadata?.aiEnhanced !== filters.aiEnhanced) {
            return false;
        }

        // Text search filter
        if (filters.search) {
            const searchText = filters.search.toLowerCase();
            const searchableText = `${character.name} ${character.title} ${character.description} ${character.backstory}`.toLowerCase();
            if (!searchableText.includes(searchText)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if update contains AI enhancement fields
     */
    isAIEnhancement(updates) {
        const aiFields = ['tagline', 'stakes', 'cta_hook', 'power_statement', 'enhanced_description'];
        return aiFields.some(field => updates[field] !== undefined);
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
     * Validate episode exists
     */
    async validateEpisodeExists(episodeId) {
        try {
            const match = episodeId.match(/s(\d+)e(\d+)/);
            if (!match) {
                return false;
            }

            const season = parseInt(match[1]);
            const episodeNumber = parseInt(match[2]);
            const episodePath = `videos/season${season}/episodes/episode${episodeNumber}`;
            
            const episodeData = await fetchDataAsAdmin(episodePath);
            return !!episodeData;
        } catch (error) {
            return false;
        }
    }
}

module.exports = FirebaseCharacterService;