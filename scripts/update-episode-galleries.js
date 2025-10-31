#!/usr/bin/env node

/**
 * Update Firebase Episode Metadata with Gallery Images
 * Adds carouselImages arrays to all episode documents for content management
 */

const { fetchDataAsAdmin, getAdminDatabase } = require('../helpers/firebase-admin-utils');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class EpisodeGalleryUpdater {
    constructor() {
        this.staticDir = path.join(__dirname, '../static');
        this.updatedCount = 0;
        this.skippedCount = 0;
        this.errorCount = 0;
    }

    async updateAllEpisodes() {
        console.log('🖼️  UPDATING FIREBASE EPISODE METADATA WITH GALLERY IMAGES');
        console.log('========================================================\n');

        try {
            // Get all songs to determine which episodes exist
            const db = getAdminDatabase();
            const snapshot = await db.ref('songs').once('value');
            const songs = snapshot.val();
            
            if (!songs) {
                console.error('❌ No songs found in Firebase');
                return;
            }

            const songList = Object.entries(songs).map(([key, song]) => ({ id: key, ...song }));
            console.log(`📚 Found ${songList.length} songs, checking for episodes...\n`);

            // Process each unique episode
            const processedEpisodes = new Set();
            
            for (const song of songList) {
                const episodeKey = `S${song.season}E${song.episodeNumber || song.episode}`;
                
                // Skip if we already processed this episode
                if (processedEpisodes.has(episodeKey)) {
                    continue;
                }
                processedEpisodes.add(episodeKey);

                const season = song.season;
                const episodeNum = song.episodeNumber || song.episode;
                
                console.log(`🔍 Processing ${episodeKey}: "${song.title}"`);
                
                await this.updateEpisodeGallery(season, episodeNum, episodeKey);
            }

            console.log('\n📊 UPDATE SUMMARY:');
            console.log('==================');
            console.log(`✅ Episodes updated: ${this.updatedCount}`);
            console.log(`⏩ Episodes skipped: ${this.skippedCount}`);
            console.log(`❌ Episodes with errors: ${this.errorCount}`);
            
            if (this.errorCount === 0) {
                console.log('\n🎉 All episode gallery metadata updated successfully!');
                console.log('💡 Content creators can now manage gallery images through Firebase.');
            }

        } catch (error) {
            console.error('❌ Update failed:', error.message);
            process.exit(1);
        }
    }

    async updateEpisodeGallery(season, episodeNum, episodeKey) {
        try {
            // 1. Check if episode document exists in Firebase
            const episodePath = `videos/season${season}/episodes/episode${episodeNum}`;
            let episodeData = await fetchDataAsAdmin(episodePath);
            
            if (!episodeData) {
                console.log(`   ⚠️  No episode document found at ${episodePath}`);
                this.skippedCount++;
                return;
            }

            // 2. Scan for gallery images in file system
            const galleryPath = path.join(
                this.staticDir, 
                'images', 
                'seasons', 
                `season${season}`, 
                'episodes', 
                `episode${episodeNum}`, 
                'images'
            );

            let galleryImages = [];
            try {
                const galleryFiles = await fs.readdir(galleryPath);
                const imageFiles = galleryFiles.filter(file => 
                    file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.png')
                );
                
                // Create relative paths for each image
                galleryImages = imageFiles.map(file => 
                    `/images/seasons/season${season}/episodes/episode${episodeNum}/images/${file}`
                );

                console.log(`   🎨 Found ${galleryImages.length} gallery images`);
                
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log(`   📁 No gallery directory found - skipping`);
                    this.skippedCount++;
                    return;
                } else {
                    throw error;
                }
            }

            // 3. Check if images already exist in Firebase
            const existingImages = episodeData.carouselImages || [];
            const hasChanges = !this.arraysEqual(existingImages, galleryImages);

            if (!hasChanges && existingImages.length > 0) {
                console.log(`   ✅ Gallery images already up to date (${existingImages.length} images)`);
                this.skippedCount++;
                return;
            }

            // 4. Update Firebase with gallery images
            const db = getAdminDatabase();
            const updateData = {
                carouselImages: galleryImages,
                lastGalleryUpdate: new Date().toISOString(),
                galleryImageCount: galleryImages.length
            };

            await db.ref(episodePath).update(updateData);
            
            console.log(`   ✅ Updated Firebase with ${galleryImages.length} gallery images`);
            console.log(`   📝 Sample images: ${galleryImages.slice(0, 3).map(img => img.split('/').pop()).join(', ')}${galleryImages.length > 3 ? ` +${galleryImages.length - 3} more` : ''}`);
            
            this.updatedCount++;

        } catch (error) {
            console.error(`   ❌ Error updating ${episodeKey}: ${error.message}`);
            this.errorCount++;
        }
    }

    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, i) => val === sortedB[i]);
    }

    // Preview mode - shows what would be updated without making changes
    async previewUpdates() {
        console.log('👀 PREVIEW MODE - No changes will be made to Firebase\n');
        
        const db = getAdminDatabase();
        const snapshot = await db.ref('songs').once('value');
        const songs = snapshot.val();
        
        if (!songs) {
            console.error('❌ No songs found in Firebase');
            return;
        }

        const songList = Object.entries(songs).map(([key, song]) => ({ id: key, ...song }));
        const processedEpisodes = new Set();
        
        console.log('📋 Episodes that would be updated:\n');
        
        for (const song of songList) {
            const episodeKey = `S${song.season}E${song.episodeNumber || song.episode}`;
            
            if (processedEpisodes.has(episodeKey)) {
                continue;
            }
            processedEpisodes.add(episodeKey);

            const season = song.season;
            const episodeNum = song.episodeNumber || song.episode;
            
            // Check for gallery images
            const galleryPath = path.join(
                this.staticDir, 
                'images', 
                'seasons', 
                `season${season}`, 
                'episodes', 
                `episode${episodeNum}`, 
                'images'
            );

            try {
                const galleryFiles = await fs.readdir(galleryPath);
                const imageFiles = galleryFiles.filter(file => 
                    file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.png')
                );
                
                if (imageFiles.length > 0) {
                    // Check current Firebase state
                    const episodePath = `videos/season${season}/episodes/episode${episodeNum}`;
                    const episodeData = await fetchDataAsAdmin(episodePath);
                    const existingImages = episodeData?.carouselImages || [];
                    
                    const status = existingImages.length > 0 ? 
                        (existingImages.length === imageFiles.length ? '✅ UP TO DATE' : '🔄 UPDATE NEEDED') : 
                        '➕ ADD IMAGES';
                        
                    console.log(`${status} ${episodeKey}: ${imageFiles.length} images (currently has ${existingImages.length})`);
                }
            } catch (error) {
                // Skip episodes without gallery directories
            }
        }
    }
}

// Command line interface
if (require.main === module) {
    const updater = new EpisodeGalleryUpdater();
    
    const args = process.argv.slice(2);
    if (args.includes('--preview')) {
        updater.previewUpdates().catch(console.error);
    } else if (args.includes('--help')) {
        console.log(`
🖼️  Episode Gallery Metadata Updater

Usage:
  node update-episode-galleries.js           # Update all episodes
  node update-episode-galleries.js --preview # Preview changes only
  node update-episode-galleries.js --help    # Show this help

This script:
• Scans all episodes for gallery images in the file system
• Updates Firebase episode documents with carouselImages arrays
• Enables content creators to manage gallery images through Firebase
• Preserves existing episode data and only adds/updates image metadata
        `);
    } else {
        updater.updateAllEpisodes().catch(console.error);
    }
}

module.exports = EpisodeGalleryUpdater;