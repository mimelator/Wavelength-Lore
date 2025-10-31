/**
 * Firebase Lore Service
 * 
 * Comprehensive lore management system for Wavelength universe including:
 * - CRUD operations for lore entries
 * - Categorization and tagging system
 * - Search and filtering capabilities
 * - Relationship tracking between lore entries
 * - Publishing workflow management
 * 
 * GitHub Issue: #152 - Milestone 2.1.2: CLI CRUD Activities
 * 
 * Lore Structure:
 * - Core lore entries (locations, events, artifacts, concepts)
 * - Categories (world-building, character-lore, music-theory, magic-system)
 * - Tags for cross-referencing and search
 * - Relationships between entries
 * - Publishing status and visibility controls
 */

const { getAdminDatabase, fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
const { validateLoreData } = require('../utils/lore-validator');
const admin = require('firebase-admin');

class FirebaseLoreService {
    constructor() {
        this.db = getAdminDatabase();
        
        if (!this.db) {
            throw new Error('Firebase Admin SDK not initialized');
        }
        
        this.loreRef = this.db.ref('lore');
        this.categoriesRef = this.db.ref('lore-categories');
        this.tagsRef = this.db.ref('lore-tags');
        
        console.log('📚 Firebase Lore Service initialized');
    }

    /**
     * Create new lore entry in Firebase
     * @param {Object} loreData - Lore entry data
     * @returns {Promise<string>} - Lore entry ID
     */
    async createLoreEntry(loreData) {
        try {
            // Validate lore data
            const validationResult = validateLoreData(loreData);
            if (!validationResult.isValid) {
                throw new Error(`Invalid lore data: ${validationResult.errors.join(', ')}`);
            }

            // Generate lore ID if not provided
            const loreId = loreData.id || this.generateLoreId(loreData.title);

            // Prepare lore record
            const loreRecord = {
                id: loreId,
                title: loreData.title,
                summary: loreData.summary || '',
                content: loreData.content || '',
                
                // Categorization
                category: loreData.category || 'general',
                subcategory: loreData.subcategory || '',
                tags: loreData.tags || [],
                
                // Content metadata
                contentType: loreData.contentType || 'entry', // entry, location, event, character-lore, concept
                importance: loreData.importance || 'medium', // low, medium, high, critical
                spoilerLevel: loreData.spoilerLevel || 0, // 0-5 spoiler rating
                
                // Relationships
                relatedEntries: loreData.relatedEntries || [],
                relatedCharacters: loreData.relatedCharacters || [],
                relatedEpisodes: loreData.relatedEpisodes || [],
                references: loreData.references || [],
                
                // Search and discovery
                keywords: loreData.keywords || [],
                searchableText: this.generateSearchableText(loreData),
                
                // Visual assets
                images: loreData.images || [],
                primaryImage: loreData.primaryImage || '',
                
                // Publishing & workflow
                published: loreData.published !== undefined ? loreData.published : false,
                publishedAt: loreData.published ? admin.database.ServerValue.TIMESTAMP : null,
                status: loreData.status || 'draft', // draft, review, approved, published, archived
                
                // Timestamps
                createdAt: admin.database.ServerValue.TIMESTAMP,
                updatedAt: admin.database.ServerValue.TIMESTAMP,
                
                // Author and permissions
                author: loreData.author || 'system',
                editors: loreData.editors || [],
                
                // Content metrics
                wordCount: this.calculateWordCount(loreData.content || ''),
                readingTime: this.calculateReadingTime(loreData.content || ''),
                
                metadata: {
                    version: 1,
                    lastEditor: loreData.author || 'system',
                    editCount: 0,
                    ...loreData.metadata
                }
            };

            // Save to Firebase
            await this.loreRef.child(loreId).set(loreRecord);
            
            // Update category counts
            await this.updateCategoryCount(loreRecord.category, 1);
            
            // Update tags
            if (loreRecord.tags.length > 0) {
                await this.updateTagUsage(loreRecord.tags, 1);
            }
            
            console.log(`✅ Lore entry ${loreId} created successfully`);
            return loreId;

        } catch (error) {
            console.error('Error creating lore entry:', error);
            throw error;
        }
    }

    /**
     * Update existing lore entry
     * @param {string} loreId - Lore entry ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateLoreEntry(loreId, updates) {
        try {
            // Validate partial update
            const validationResult = validateLoreData(updates, true);
            if (!validationResult.isValid) {
                throw new Error(`Invalid update data: ${validationResult.errors.join(', ')}`);
            }

            // Get current entry
            const currentEntry = await this.getLoreEntryById(loreId);
            if (!currentEntry) {
                throw new Error(`Lore entry ${loreId} not found`);
            }

            // Prepare update data
            const updateData = {
                ...updates,
                updatedAt: admin.database.ServerValue.TIMESTAMP,
                'metadata/lastEditor': updates.author || 'system',
                'metadata/editCount': (currentEntry.metadata?.editCount || 0) + 1
            };

            // Update searchable text if content changed
            if (updates.content || updates.title || updates.summary) {
                updateData.searchableText = this.generateSearchableText({
                    title: updates.title || currentEntry.title,
                    summary: updates.summary || currentEntry.summary,
                    content: updates.content || currentEntry.content,
                    keywords: updates.keywords || currentEntry.keywords
                });
            }

            // Update word count and reading time if content changed
            if (updates.content) {
                updateData.wordCount = this.calculateWordCount(updates.content);
                updateData.readingTime = this.calculateReadingTime(updates.content);
            }

            // Handle publishing status change
            if (updates.published !== undefined && updates.published !== currentEntry.published) {
                updateData.publishedAt = updates.published ? 
                    admin.database.ServerValue.TIMESTAMP : 
                    null;
            }

            // Update category counts if category changed
            if (updates.category && updates.category !== currentEntry.category) {
                await this.updateCategoryCount(currentEntry.category, -1);
                await this.updateCategoryCount(updates.category, 1);
            }

            // Update tag usage if tags changed
            if (updates.tags) {
                const oldTags = currentEntry.tags || [];
                const newTags = updates.tags;
                
                // Remove old tag counts
                if (oldTags.length > 0) {
                    await this.updateTagUsage(oldTags, -1);
                }
                
                // Add new tag counts
                if (newTags.length > 0) {
                    await this.updateTagUsage(newTags, 1);
                }
            }

            // Apply updates
            await this.loreRef.child(loreId).update(updateData);
            
            console.log(`✅ Lore entry ${loreId} updated successfully`);

        } catch (error) {
            console.error('Error updating lore entry:', error);
            throw error;
        }
    }

    /**
     * Delete lore entry (soft delete by default)
     * @param {string} loreId - Lore entry ID
     * @param {boolean} hardDelete - Whether to permanently delete
     * @returns {Promise<void>}
     */
    async deleteLoreEntry(loreId, hardDelete = false) {
        try {
            const entry = await this.getLoreEntryById(loreId);
            if (!entry) {
                throw new Error(`Lore entry ${loreId} not found`);
            }

            if (hardDelete) {
                // Permanent deletion
                await this.loreRef.child(loreId).remove();
                
                // Update category and tag counts
                await this.updateCategoryCount(entry.category, -1);
                if (entry.tags && entry.tags.length > 0) {
                    await this.updateTagUsage(entry.tags, -1);
                }
                
                console.log(`🗑️  Lore entry ${loreId} permanently deleted`);
            } else {
                // Soft delete
                await this.loreRef.child(loreId).update({
                    deleted: true,
                    deletedAt: admin.database.ServerValue.TIMESTAMP,
                    published: false,
                    status: 'archived'
                });
                
                console.log(`📝 Lore entry ${loreId} soft deleted (archived)`);
            }

        } catch (error) {
            console.error('Error deleting lore entry:', error);
            throw error;
        }
    }

    /**
     * Get lore entry by ID
     * @param {string} loreId - Lore entry ID
     * @returns {Promise<Object|null>} - Lore entry or null
     */
    async getLoreEntryById(loreId) {
        try {
            const snapshot = await this.loreRef.child(loreId).once('value');
            const entry = snapshot.val();
            
            if (!entry || entry.deleted) {
                return null;
            }
            
            return { id: loreId, ...entry };

        } catch (error) {
            console.error('Error getting lore entry:', error);
            throw error;
        }
    }

    /**
     * Get all lore entries with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - Array of lore entries
     */
    async getAllLoreEntries(filters = {}) {
        try {
            console.log('📚 Fetching lore entries with filters:', filters);
            
            const snapshot = await this.loreRef.once('value');
            const loreData = snapshot.val();
            
            if (!loreData) {
                return [];
            }

            // Convert to array and apply filters
            let entries = Object.keys(loreData)
                .map(id => ({ id, ...loreData[id] }))
                .filter(entry => !entry.deleted);

            // Apply category filter
            if (filters.category) {
                entries = entries.filter(entry => entry.category === filters.category);
            }

            // Apply published filter
            if (filters.published !== undefined) {
                entries = entries.filter(entry => entry.published === filters.published);
            }

            // Apply status filter
            if (filters.status) {
                entries = entries.filter(entry => entry.status === filters.status);
            }

            // Apply importance filter
            if (filters.importance) {
                entries = entries.filter(entry => entry.importance === filters.importance);
            }

            // Apply content type filter
            if (filters.contentType) {
                entries = entries.filter(entry => entry.contentType === filters.contentType);
            }

            // Apply tag filter
            if (filters.tag) {
                entries = entries.filter(entry => 
                    entry.tags && entry.tags.includes(filters.tag)
                );
            }

            // Apply search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                entries = entries.filter(entry => 
                    (entry.searchableText && entry.searchableText.toLowerCase().includes(searchTerm)) ||
                    (entry.title && entry.title.toLowerCase().includes(searchTerm)) ||
                    (entry.summary && entry.summary.toLowerCase().includes(searchTerm))
                );
            }

            // Sort entries
            const sortBy = filters.sortBy || 'title';
            entries.sort((a, b) => {
                switch (sortBy) {
                    case 'title':
                        const aTitle = a.title || a.id || 'Unknown';
                        const bTitle = b.title || b.id || 'Unknown';
                        return aTitle.localeCompare(bTitle);
                    case 'category':
                        const aCategory = a.category || 'general';
                        const bCategory = b.category || 'general';
                        return aCategory.localeCompare(bCategory);
                    case 'importance':
                        const importanceOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
                        return (importanceOrder[a.importance] || 2) - (importanceOrder[b.importance] || 2);
                    case 'created':
                        const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
                        const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
                        return bCreated - aCreated;
                    case 'updated':
                        const aUpdated = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
                        const bUpdated = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
                        return bUpdated - aUpdated;
                    default:
                        return 0;
                }
            });

            console.log(`📚 Retrieved ${entries.length} lore entries`);
            return entries;

        } catch (error) {
            console.error('Error fetching lore entries:', error);
            throw error;
        }
    }

    /**
     * Search lore entries by text content
     * @param {string} searchQuery - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Search results
     */
    async searchLoreEntries(searchQuery, options = {}) {
        try {
            const filters = {
                search: searchQuery,
                ...options
            };
            
            const results = await this.getAllLoreEntries(filters);
            
            // Add relevance scoring
            const scoredResults = results.map(entry => {
                let score = 0;
                const query = searchQuery.toLowerCase();
                
                // Title matches get highest score
                if (entry.title && entry.title.toLowerCase().includes(query)) {
                    score += 10;
                }
                
                // Summary matches get medium score
                if (entry.summary && entry.summary.toLowerCase().includes(query)) {
                    score += 5;
                }
                
                // Content matches get base score
                if (entry.content && entry.content.toLowerCase().includes(query)) {
                    score += 2;
                }
                
                // Keyword matches get bonus score
                if (entry.keywords) {
                    entry.keywords.forEach(keyword => {
                        if (keyword.toLowerCase().includes(query)) {
                            score += 3;
                        }
                    });
                }
                
                // Tag matches get bonus score
                if (entry.tags) {
                    entry.tags.forEach(tag => {
                        if (tag.toLowerCase().includes(query)) {
                            score += 4;
                        }
                    });
                }
                
                return { ...entry, relevanceScore: score };
            });
            
            // Sort by relevance
            scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
            
            console.log(`🔍 Found ${scoredResults.length} lore entries matching "${searchQuery}"`);
            return scoredResults;

        } catch (error) {
            console.error('Error searching lore entries:', error);
            throw error;
        }
    }

    /**
     * Get lore categories with counts
     * @returns {Promise<Array>} - Categories with usage counts
     */
    async getLoreCategories() {
        try {
            const snapshot = await this.categoriesRef.once('value');
            const categoriesData = snapshot.val();
            
            const categories = [];
            if (categoriesData) {
                Object.keys(categoriesData).forEach(categoryId => {
                    categories.push({
                        id: categoryId,
                        ...categoriesData[categoryId]
                    });
                });
            }
            
            // Add default categories if none exist
            if (categories.length === 0) {
                const defaultCategories = [
                    { id: 'world-building', name: 'World Building', count: 0 },
                    { id: 'character-lore', name: 'Character Lore', count: 0 },
                    { id: 'music-theory', name: 'Music Theory', count: 0 },
                    { id: 'magic-system', name: 'Magic System', count: 0 },
                    { id: 'locations', name: 'Locations', count: 0 },
                    { id: 'events', name: 'Events', count: 0 },
                    { id: 'general', name: 'General', count: 0 }
                ];
                
                return defaultCategories;
            }
            
            return categories.sort((a, b) => (b.count || 0) - (a.count || 0));

        } catch (error) {
            console.error('Error getting lore categories:', error);
            throw error;
        }
    }

    /**
     * Get popular lore tags
     * @param {number} limit - Maximum number of tags to return
     * @returns {Promise<Array>} - Popular tags with usage counts
     */
    async getPopularTags(limit = 20) {
        try {
            const snapshot = await this.tagsRef.once('value');
            const tagsData = snapshot.val();
            
            if (!tagsData) {
                return [];
            }
            
            const tags = Object.keys(tagsData)
                .map(tag => ({ tag, count: tagsData[tag] }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
                
            return tags;

        } catch (error) {
            console.error('Error getting popular tags:', error);
            throw error;
        }
    }

    // === Helper Methods ===

    /**
     * Generate lore ID from title
     */
    generateLoreId(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50) || 'lore-entry';
    }

    /**
     * Generate searchable text for full-text search
     */
    generateSearchableText(loreData) {
        const parts = [
            loreData.title || '',
            loreData.summary || '',
            loreData.content || '',
            (loreData.keywords || []).join(' '),
            (loreData.tags || []).join(' ')
        ];
        
        return parts.join(' ').toLowerCase();
    }

    /**
     * Calculate word count
     */
    calculateWordCount(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).length;
    }

    /**
     * Calculate estimated reading time (words per minute)
     */
    calculateReadingTime(text, wordsPerMinute = 200) {
        const wordCount = this.calculateWordCount(text);
        return Math.ceil(wordCount / wordsPerMinute);
    }

    /**
     * Update category usage count
     */
    async updateCategoryCount(category, delta) {
        if (!category) return;
        
        try {
            const categoryRef = this.categoriesRef.child(category);
            const snapshot = await categoryRef.once('value');
            const currentData = snapshot.val() || { name: category, count: 0 };
            
            await categoryRef.set({
                ...currentData,
                count: Math.max(0, (currentData.count || 0) + delta),
                updatedAt: admin.database.ServerValue.TIMESTAMP
            });
            
        } catch (error) {
            console.error('Error updating category count:', error);
        }
    }

    /**
     * Update tag usage counts
     */
    async updateTagUsage(tags, delta) {
        if (!tags || tags.length === 0) return;
        
        try {
            const updates = {};
            
            for (const tag of tags) {
                const snapshot = await this.tagsRef.child(tag).once('value');
                const currentCount = snapshot.val() || 0;
                updates[tag] = Math.max(0, currentCount + delta);
            }
            
            await this.tagsRef.update(updates);
            
        } catch (error) {
            console.error('Error updating tag usage:', error);
        }
    }

    /**
     * Publish lore entry
     */
    async publishLoreEntry(loreId, published = true) {
        return await this.updateLoreEntry(loreId, {
            published,
            status: published ? 'published' : 'draft'
        });
    }

    /**
     * Clone lore entry
     */
    async cloneLoreEntry(sourceLoreId, newData) {
        try {
            const sourceEntry = await this.getLoreEntryById(sourceLoreId);
            if (!sourceEntry) {
                throw new Error(`Source lore entry ${sourceLoreId} not found`);
            }

            // Prepare cloned data
            const clonedData = {
                ...sourceEntry,
                ...newData,
                id: undefined, // Will generate new ID
                title: newData.title || `${sourceEntry.title} (Copy)`,
                published: false,
                status: 'draft',
                createdAt: undefined, // Will be set to current time
                updatedAt: undefined,
                publishedAt: null
            };

            // Remove internal fields
            delete clonedData.id;
            delete clonedData.metadata;

            const newId = await this.createLoreEntry(clonedData);
            console.log(`📋 Lore entry cloned: ${sourceLoreId} → ${newId}`);
            
            return newId;

        } catch (error) {
            console.error('Error cloning lore entry:', error);
            throw error;
        }
    }
}

module.exports = FirebaseLoreService;