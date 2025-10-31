/**
 * Firebase Songs Service
 * 
 * Manages songs in Firebase Realtime Database with proper indexing,
 * CRUD operations, and schema validation for dynamic radio player.
 * 
 * GitHub Issue: #130 - Milestone 2.1: Dynamic Radio Player
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
const { validateSongData } = require('../utils/song-validator');
const { convertDurationToSeconds, formatDuration } = require('../utils/duration-helpers');

// Get admin reference for ServerValue
const admin = require('firebase-admin');

class FirebaseSongsService {
    constructor() {
        this.db = getAdminDatabase();
        
        if (!this.db) {
            throw new Error('Firebase Admin SDK not initialized');
        }
        
        this.songsRef = this.db.ref('songs');
        this.episodesRef = this.db.ref('episodes');
        
        console.log('🎵 Firebase Songs Service initialized');
    }

    /**
     * Create or update a song in Firebase
     * @param {Object} songData - Song data following Firebase schema
     * @returns {Promise<string>} - Song ID
     */
    async createOrUpdateSong(songData) {
        try {
            // Validate song data against schema
            const validationResult = validateSongData(songData);
            if (!validationResult.isValid) {
                throw new Error(`Invalid song data: ${validationResult.errors.join(', ')}`);
            }

            // Generate song ID if not provided
            const songId = songData.id || this.generateSongId(songData.season, songData.episodeNumber);

            // Prepare song record with metadata
            const songRecord = {
                id: songId,
                title: songData.title,
                artist: songData.artist || 'Wavelength',
                season: parseInt(songData.season),
                episodeNumber: parseInt(songData.episodeNumber),
                duration: convertDurationToSeconds(songData.duration),
                durationFormatted: formatDuration(songData.duration),
                url: songData.url,
                lyrics: songData.lyrics || '',
                published: songData.published !== undefined ? songData.published : false,
                publishedAt: songData.published ? admin.database.ServerValue.TIMESTAMP : null,
                createdAt: songData.createdAt || admin.database.ServerValue.TIMESTAMP,
                updatedAt: admin.database.ServerValue.TIMESTAMP,
                metadata: {
                    albumArt: songData.albumArt || songData.episodeImage || '',
                    genre: songData.genre || 'Fantasy Rock',
                    episodeId: `s${songData.season}e${songData.episodeNumber}`,
                    keywords: songData.keywords || [],
                    ...songData.metadata
                }
            };

            // Check if episode exists and is published
            const episodeData = await this.getEpisodeData(songData.season, songData.episodeNumber);
            if (episodeData && episodeData.published === false) {
                songRecord.published = false; // Force unpublished if episode is hidden
                console.log(`🔒 Song ${songId} marked as unpublished (episode is hidden)`);
            }

            // Save to Firebase
            await this.songsRef.child(songId).set(songRecord);
            
            console.log(`✅ Song ${songId} saved to Firebase`);
            return songId;

        } catch (error) {
            console.error('Error creating/updating song:', error);
            throw error;
        }
    }

    /**
     * Get all published songs, optionally filtered by season
     * @param {number|null} seasonFilter - Filter by season (null for all seasons)
     * @param {boolean} includeUnpublished - Include unpublished songs (admin only)
     * @returns {Promise<Array>} - Array of song objects
     */
    async getPublishedSongs(seasonFilter = null, includeUnpublished = false) {
        try {
            console.log(`🎵 Fetching songs: season=${seasonFilter}, includeUnpublished=${includeUnpublished}`);

            let query = this.songsRef;

            // Apply season filter if specified
            if (seasonFilter !== null) {
                query = query.orderByChild('season').equalTo(parseInt(seasonFilter));
            } else {
                query = query.orderByChild('season');
            }

            const snapshot = await query.once('value');
            const songs = [];

            snapshot.forEach(childSnapshot => {
                const song = childSnapshot.val();
                
                // Filter by published status unless admin mode
                if (includeUnpublished || song.published === true) {
                    songs.push({
                        ...song,
                        id: childSnapshot.key
                    });
                }
            });

            // Sort by season and episode number
            songs.sort((a, b) => {
                if (a.season !== b.season) {
                    return a.season - b.season;
                }
                return a.episodeNumber - b.episodeNumber;
            });

            console.log(`🎵 Retrieved ${songs.length} songs (season: ${seasonFilter || 'all'})`);
            return songs;

        } catch (error) {
            console.error('Error fetching published songs:', error);
            throw error;
        }
    }

    /**
     * Get song by ID
     * @param {string} songId - Song identifier
     * @returns {Promise<Object|null>} - Song object or null
     */
    async getSongById(songId) {
        try {
            const snapshot = await this.songsRef.child(songId).once('value');
            const song = snapshot.val();
            
            if (song) {
                return {
                    ...song,
                    id: songId
                };
            }
            
            return null;
        } catch (error) {
            console.error(`Error fetching song ${songId}:`, error);
            throw error;
        }
    }

    /**
     * Publish or unpublish a song
     * @param {string} songId - Song identifier
     * @param {boolean} published - Published status
     * @returns {Promise<void>}
     */
    async updatePublishedStatus(songId, published) {
        try {
            const updates = {
                published: published,
                publishedAt: published ? admin.database.ServerValue.TIMESTAMP : null,
                updatedAt: admin.database.ServerValue.TIMESTAMP
            };

            await this.songsRef.child(songId).update(updates);
            console.log(`📢 Song ${songId} ${published ? 'published' : 'unpublished'}`);

        } catch (error) {
            console.error(`Error updating published status for ${songId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a song
     * @param {string} songId - Song identifier
     * @returns {Promise<void>}
     */
    async deleteSong(songId) {
        try {
            await this.songsRef.child(songId).remove();
            console.log(`🗑️ Song ${songId} deleted from Firebase`);
        } catch (error) {
            console.error(`Error deleting song ${songId}:`, error);
            throw error;
        }
    }

    /**
     * Get all available seasons from songs
     * @returns {Promise<Array<number>>} - Array of season numbers
     */
    async getAvailableSeasons() {
        try {
            const snapshot = await this.songsRef.orderByChild('published').equalTo(true).once('value');
            const seasons = new Set();

            snapshot.forEach(childSnapshot => {
                const song = childSnapshot.val();
                if (song.season) {
                    seasons.add(song.season);
                }
            });

            const sortedSeasons = Array.from(seasons).sort((a, b) => a - b);
            console.log(`🎵 Available seasons: ${sortedSeasons.join(', ')}`);
            return sortedSeasons;

        } catch (error) {
            console.error('Error fetching available seasons:', error);
            throw error;
        }
    }

    /**
     * Migrate existing hardcoded playlist to Firebase
     * @param {Array} playlist - Existing hardcoded playlist
     * @returns {Promise<Object>} Migration result with counts and errors
     */
    async migrateHardcodedPlaylist(playlist) {
        try {
            console.log('🔄 Starting playlist migration to Firebase...');

            const migratedSongs = [];
            const skippedSongs = [];
            const errors = [];
            
            for (const track of playlist) {
                try {
                    // Check if song already exists
                    const songId = `s${track.season}e${track.episode}`;
                    const existingSnapshot = await this.songsRef.child(songId).once('value');
                    
                    if (existingSnapshot.exists()) {
                        console.log(`⏭️ Skipped: ${track.title} (${songId}) - already exists`);
                        skippedSongs.push(songId);
                        continue;
                    }

                    // Convert hardcoded track to Firebase song format
                    const songData = {
                        title: track.title,
                        artist: 'Wavelength',
                        season: track.season,
                        episodeNumber: track.episode,
                        duration: track.duration,
                        url: `/images/seasons/season${track.season}/episodes/episode${track.episode}/${track.file}`,
                        lyrics: track.lyrics || '',
                        published: true, // Assume existing songs are published
                        albumArt: track.episodeImage || '',
                        keywords: track.keywords || []
                    };

                    const newSongId = await this.createOrUpdateSong(songData);
                    migratedSongs.push(newSongId);
                    
                    console.log(`✅ Migrated: ${track.title} (${newSongId})`);

                } catch (error) {
                    const errorMsg = `Failed to migrate ${track.title}: ${error.message}`;
                    console.error(`❌ ${errorMsg}`);
                    errors.push(errorMsg);
                }
            }

            const result = {
                migrated: migratedSongs.length,
                skipped: skippedSongs.length,
                errors: errors,
                migratedSongs,
                skippedSongs
            };

            console.log(`🎉 Migration completed: ${result.migrated} songs migrated, ${result.skipped} skipped`);
            return result;

        } catch (error) {
            console.error('Error during playlist migration:', error);
            throw error;
        }
    }

    /**
     * Set up real-time listeners for song updates
     * @param {Function} callback - Callback function for changes
     * @returns {Function} - Cleanup function
     */
    setupRealtimeListener(callback) {
        const listener = this.songsRef.on('value', (snapshot) => {
            const songs = [];
            
            snapshot.forEach(childSnapshot => {
                const song = childSnapshot.val();
                if (song.published === true) {
                    songs.push({
                        ...song,
                        id: childSnapshot.key
                    });
                }
            });

            // Sort by season and episode
            songs.sort((a, b) => {
                if (a.season !== b.season) {
                    return a.season - b.season;
                }
                return a.episodeNumber - b.episodeNumber;
            });

            callback(songs);
        });

        // Return cleanup function
        return () => {
            this.songsRef.off('value', listener);
        };
    }

    // Helper Methods

    /**
     * Generate song ID from season and episode
     * @param {number} season - Season number
     * @param {number} episode - Episode number
     * @returns {string} - Generated song ID
     */
    generateSongId(season, episode) {
        return `s${season}e${episode}`;
    }

    /**
     * Get episode data to check visibility status
     * @param {number} season - Season number
     * @param {number} episode - Episode number
     * @returns {Promise<Object|null>} - Episode data
     */
    async getEpisodeData(season, episode) {
        try {
            const episodeRef = this.episodesRef.child(`s${season}e${episode}`);
            const snapshot = await episodeRef.once('value');
            return snapshot.val();
        } catch (error) {
            console.error(`Error fetching episode s${season}e${episode}:`, error);
            return null;
        }
    }

    /**
     * Sync song published status with episode published status
     * @param {string} episodeId - Episode identifier (e.g., 's1e1')
     * @returns {Promise<void>}
     */
    async syncSongWithEpisode(episodeId) {
        try {
            // Extract season and episode from ID
            const match = episodeId.match(/s(\d+)e(\d+)/);
            if (!match) {
                throw new Error(`Invalid episode ID format: ${episodeId}`);
            }

            const season = parseInt(match[1]);
            const episode = parseInt(match[2]);

            // Get episode data
            const episodeData = await this.getEpisodeData(season, episode);
            if (!episodeData) {
                console.log(`⚠️ Episode ${episodeId} not found, skipping song sync`);
                return;
            }

            // Find and update corresponding song
            const songId = this.generateSongId(season, episode);
            const song = await this.getSongById(songId);
            
            if (song) {
                await this.updatePublishedStatus(songId, episodeData.published === true);
                console.log(`🔄 Synced song ${songId} with episode ${episodeId} (published: ${episodeData.published})`);
            }

        } catch (error) {
            console.error(`Error syncing song with episode ${episodeId}:`, error);
            throw error;
        }
    }
}

module.exports = FirebaseSongsService;