/**
 * Episode State Manager
 * 
 * Manages episode state in Firebase with hidden/published status
 * Implements the episode schema from Milestone 1.1
 */

const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config();

class EpisodeStateManager {
    constructor() {
        // Initialize Firebase Admin using same approach as main app
        try {
            if (!admin.apps.length) {
                let credential;

                // Check if service account is provided via environment variables (production)
                if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                    try {
                        const serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                        credential = admin.credential.cert(serviceAccountJson);
                        console.log('🔥 Episode CLI: Using Firebase service account from environment variable');
                    } catch (parseError) {
                        throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT: ' + parseError.message);
                    }
                } else {
                    // Fall back to service account file if available
                    const path = require('path');
                    const fs = require('fs');
                    const serviceAccountPath = path.join(__dirname, '../../firebaseServiceAccountKey.json');
                    
                    if (fs.existsSync(serviceAccountPath)) {
                        credential = admin.credential.cert(serviceAccountPath);
                        console.log('🔥 Episode CLI: Using Firebase service account from file');
                    } else {
                        throw new Error('Firebase service account not found. Check FIREBASE_SERVICE_ACCOUNT environment variable or firebaseServiceAccountKey.json file.');
                    }
                }

                admin.initializeApp({
                    credential: credential,
                    databaseURL: process.env.DATABASE_URL,
                    storageBucket: process.env.STORAGE_BUCKET
                });
                
                console.log('✅ Episode CLI: Firebase Admin SDK initialized successfully');
            }
        } catch (error) {
            console.error('❌ Episode CLI: Firebase admin initialization failed:', error.message);
            throw error;
        }
        
        this.db = admin.database();
        this.episodesRef = this.db.ref('episodes');
    }

    /**
     * Create a new episode with metadata
     * Episodes default to 'hidden' status per spec
     */
    async createEpisode(metadata) {
        const episodeId = this.generateEpisodeId(metadata.season, metadata.episodeNumber);
        
        const episode = {
            id: episodeId,
            season: metadata.season,
            episodeNumber: metadata.episodeNumber,
            title: metadata.title,
            description: metadata.description || '',
            theme: metadata.theme || '',
            status: 'draft',                    // draft, in-progress, completed
            visibility: 'hidden',              // hidden, published
            currentStep: 1,                     // Current pipeline step (1-10)
            stepStatus: this.initializeStepStatus(),
            songMetadata: null,                 // Will be filled in step 2
            createdAt: admin.database.ServerValue.TIMESTAMP,
            updatedAt: admin.database.ServerValue.TIMESTAMP
        };
        
        const episodeRef = this.db.ref(`episodes/${episodeId}`);
        await episodeRef.set(episode);
        
        // Return episode with current timestamp
        const snapshot = await episodeRef.once('value');
        return snapshot.val();
    }

    /**
     * Update episode data
     */
    async updateEpisode(episodeId, updates) {
        const episodeRef = this.db.ref(`episodes/${episodeId}`);
        
        const updateData = {
            ...updates,
            updatedAt: admin.database.ServerValue.TIMESTAMP
        };
        
        await episodeRef.update(updateData);
        
        const snapshot = await episodeRef.once('value');
        return snapshot.val();
    }

    async updateSongMetadata(episodeId, songMetadata) {
        const episodeRef = this.db.ref(`episodes/${episodeId}`);
        
        const updateData = {
            songMetadata: songMetadata,
            updatedAt: admin.database.ServerValue.TIMESTAMP
        };
        
        await episodeRef.update(updateData);
        
        const snapshot = await episodeRef.once('value');
        return snapshot.val();
    }

    /**
     * Mark a step as completed
     */
    async completeStep(episodeId, stepNumber) {
        const episodeRef = this.db.ref(`episodes/${episodeId}`);
        
        const updateData = {
            [`stepStatus/${stepNumber}/completed`]: true,
            [`stepStatus/${stepNumber}/completedAt`]: new Date().toISOString(),
            currentStep: stepNumber + 1 <= 10 ? stepNumber + 1 : 10, // Move to next step
            updatedAt: admin.database.ServerValue.TIMESTAMP
        };
        
        await episodeRef.update(updateData);
        
        const snapshot = await episodeRef.once('value');
        return snapshot.val();
    }

    /**
     * Toggle episode visibility (hidden/published)
     */
    async toggleVisibility(episodeId) {
        const episode = await this.getEpisode(episodeId);
        if (!episode) {
            throw new Error(`Episode ${episodeId} not found`);
        }
        
        const newStatus = episode.visibility === 'hidden' ? 'published' : 'hidden';
        const episodeRef = this.db.ref(`episodes/${episodeId}`);
        
        const updates = {
            visibility: newStatus,
            updatedAt: admin.database.ServerValue.TIMESTAMP
        };
        
        if (newStatus === 'published') {
            updates.publishedAt = admin.database.ServerValue.TIMESTAMP;
        }
        
        await episodeRef.update(updates);
        
        const snapshot = await episodeRef.once('value');
        return snapshot.val();
    }

    /**
     * Check if episode exists
     */
    async episodeExists(episodeId) {
        const episodeRef = this.db.ref(`episodes/${episodeId}`);
        const snapshot = await episodeRef.once('value');
        return snapshot.exists();
    }

    /**
     * Get a specific episode
     */
    async getEpisode(episodeId) {
        const episodeRef = this.db.ref(`episodes/${episodeId}`);
        const snapshot = await episodeRef.once('value');
        
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    }

    /**
     * Get all episodes
     */
    async getAllEpisodes() {
        const episodesRef = this.db.ref('episodes');
        const snapshot = await episodesRef.once('value');
        const episodesData = snapshot.val() || {};
        return Object.values(episodesData);
    }

    /**
     * Get episodes in progress (not all steps completed)
     */
    async getInProgressEpisodes() {
        try {
            const allEpisodes = await this.getAllEpisodes();
            return allEpisodes.filter(episode => {
                const steps = episode.steps || {};
                const totalSteps = Object.keys(steps).length;
                const completedSteps = Object.values(steps).filter(step => step.completed).length;
                return completedSteps < totalSteps && completedSteps > 0;
            });
        } catch (error) {
            console.error('❌ Failed to get in-progress episodes:', error);
            throw error;
        }
    }

    /**
     * Get published episodes (for public consumption)
     */
    async getPublishedEpisodes() {
        try {
            const allEpisodes = await this.getAllEpisodes();
            return allEpisodes.filter(episode => episode.status === 'published');
        } catch (error) {
            console.error('❌ Failed to get published episodes:', error);
            throw error;
        }
    }

    /**
     * Delete episode (for testing purposes)
     * Note: Proper editing comes in Phase 5
     */
    async deleteEpisode(episodeId) {
        const episode = await this.getEpisode(episodeId);
        if (!episode) {
            throw new Error(`Episode ${episodeId} not found`);
        }
        
        const episodeRef = this.db.ref(`episodes/${episodeId}`);
        await episodeRef.remove();
        
        // TODO: In production, also delete associated S3 assets
        return true;
    }

    /**
     * Check if episode ID already exists
     */
    async episodeExists(episodeId) {
        try {
            const episode = await this.getEpisode(episodeId);
            return !!episode;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generate episode ID from season and episode number
     */
    generateEpisodeId(season, episodeNumber) {
        return `s${season}e${episodeNumber}`;
    }

    /**
     * Validate episode metadata
     */
    validateEpisodeMetadata(metadata) {
        const errors = [];
        
        if (!metadata.season || metadata.season < 1) {
            errors.push('Season number must be a positive integer');
        }
        
        if (!metadata.episodeNumber || metadata.episodeNumber < 1) {
            errors.push('Episode number must be a positive integer');
        }
        
        if (!metadata.title || metadata.title.trim().length === 0) {
            errors.push('Episode title is required');
        }
        
        return errors;
    }

    /**
     * Export episode data to YAML (for validation per spec)
     */
    async exportEpisodeToYAML(episodeId) {
        try {
            const episode = await this.getEpisode(episodeId);
            if (!episode) {
                throw new Error(`Episode ${episodeId} not found`);
            }
            
            const yaml = require('js-yaml');
            const yamlData = yaml.dump({
                episode: {
                    id: episode.id,
                    title: episode.title,
                    season: episode.season,
                    episodeNumber: episode.episodeNumber,
                    status: episode.status,
                    song: episode.song,
                    assets: episode.assets,
                    lore: episode.lore,
                    createdAt: episode.createdAt,
                    publishedAt: episode.publishedAt
                }
            }, { indent: 2 });
            
            return yamlData;
        } catch (error) {
            console.error(`❌ Failed to export episode to YAML:`, error);
            throw error;
        }
    }
    /**
     * Generate episode ID from season and episode number
     */
    generateEpisodeId(season, episodeNumber) {
        return `s${season}e${episodeNumber}`;
    }

    /**
     * Initialize step status for a new episode
     */
    initializeStepStatus() {
        const stepStatus = {};
        
        // 10-step pipeline as defined in the specification
        for (let i = 1; i <= 10; i++) {
            stepStatus[i] = {
                completed: false,
                completedAt: null
            };
        }
        
        return stepStatus;
    }
}

module.exports = EpisodeStateManager;