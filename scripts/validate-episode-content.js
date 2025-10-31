#!/usr/bin/env node

/**
 * Pre-Deployment Episode Content Validation
 * Runs comprehensive checks before any episode content goes live
 */

const axios = require('axios');
const AWS = require('aws-sdk');
const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
require('dotenv').config();

class EpisodeContentValidator {
    constructor() {
        this.s3 = new AWS.S3();
        this.bucket = 'wavelength-lore-bucket';
        this.cdnUrl = process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net';
        
        this.errors = [];
        this.warnings = [];
        this.validatedFiles = 0;
    }

    async validateAll() {
        console.log('🔍 EPISODE CONTENT VALIDATION');
        console.log('==========================================\n');
        
        try {
            await this.validateFirebaseStructure();
            await this.validateS3Files();
            await this.validateCDNAccess();
            await this.validateDataConsistency();
            
            this.printResults();
            
            if (this.errors.length > 0) {
                console.log('\n❌ VALIDATION FAILED - Fix errors before deployment!');
                process.exit(1);
            } else if (this.warnings.length > 0) {
                console.log('\n⚠️  VALIDATION PASSED with warnings - Review before deployment');
                process.exit(0);
            } else {
                console.log('\n✅ ALL VALIDATIONS PASSED - Safe to deploy!');
                process.exit(0);
            }
            
        } catch (error) {
            this.errors.push(`Validation script failed: ${error.message}`);
            this.printResults();
            process.exit(1);
        }
    }

    async validateFirebaseStructure() {
        console.log('📱 Validating Firebase structure...');
        
        const db = getAdminDatabase();
        if (!db) {
            this.errors.push('Firebase not initialized');
            return;
        }
        
        const snapshot = await db.ref('songs').once('value');
        const songs = snapshot.val();
        
        if (!songs) {
            this.errors.push('No songs found in Firebase');
            return;
        }
        
        const songList = Object.entries(songs).map(([key, song]) => ({ id: key, ...song }));
        
        let publishedCount = 0;
        let draftCount = 0;
        let incompleteCount = 0;
        
        console.log('\n📊 Episode Analysis:');
        console.log('===================');
        
        for (const song of songList) {
            const episodeId = `S${song.season}E${song.episode || song.episodeNumber}`;
            const isPublished = song.published !== false;
            
            // Required fields check
            const missingFields = [];
            if (!song.title) missingFields.push('title');
            if (!song.season) missingFields.push('season');
            if (!song.episode && !song.episodeNumber) missingFields.push('episode');
            if (!song.url) missingFields.push('url');
            
            // Determine episode status
            if (missingFields.length > 0) {
                incompleteCount++;
                console.log(`   🚧 ${episodeId}: INCOMPLETE (missing: ${missingFields.join(', ')})`);
                
                // Only error on missing critical fields for published episodes
                if (isPublished) {
                    this.errors.push(`Published ${episodeId}: Missing critical fields - ${missingFields.join(', ')}`);
                } else {
                    this.warnings.push(`Draft ${episodeId}: Missing fields - ${missingFields.join(', ')} (OK for draft)`);
                }
            } else if (!isPublished) {
                draftCount++;
                console.log(`   📝 ${episodeId}: DRAFT (complete but unpublished) - "${song.title}"`);
            } else {
                publishedCount++;
                console.log(`   ✅ ${episodeId}: PUBLISHED - "${song.title}"`);
                
                // Validate published episodes more strictly
                if (song.url.startsWith('http')) {
                    this.warnings.push(`Published ${episodeId}: Has full URL instead of relative path - ${song.url}`);
                } else if (!song.url.startsWith('/images/seasons/S')) {
                    this.warnings.push(`Published ${episodeId}: Non-standard URL format - ${song.url}`);
                }
            }
        }
        
        console.log('\n📈 Episode Status Summary:');
        console.log(`   ✅ Published episodes: ${publishedCount}`);
        console.log(`   📝 Draft episodes: ${draftCount}`);
        console.log(`   🚧 Incomplete episodes: ${incompleteCount}`);
        console.log(`   📊 Total episodes: ${songList.length}`);
        
        this.validatedFiles = publishedCount; // Only count published for validation
        
        console.log(`\n   ✅ Validated ${songList.length} total episodes (${publishedCount} published)`);
    }

    async validateS3Files() {
        console.log('\n📁 Validating S3 file existence...');
        
        const db = getAdminDatabase();
        const snapshot = await db.ref('songs').once('value');
        const songs = snapshot.val();
        
        if (!songs) return;
        
        const songList = Object.entries(songs).map(([key, song]) => ({ id: key, ...song }));
        let s3ValidatedCount = 0;
        let s3SkippedCount = 0;
        
        for (const song of songList) {
            const episodeId = `S${song.season}E${song.episode || song.episodeNumber}`;
            const isPublished = song.published !== false;
            
            // Skip validation for incomplete drafts
            if (!song.url) {
                if (isPublished) {
                    this.errors.push(`Published ${episodeId}: Missing URL - cannot validate S3 file`);
                } else {
                    s3SkippedCount++;
                    console.log(`   ⏩ ${episodeId}: Skipped S3 check (draft without URL)`);
                }
                continue;
            }
            
            // Convert URL to S3 key
            const s3Key = song.url.startsWith('/') ? song.url.substring(1) : song.url;
            
            try {
                await this.s3.headObject({ Bucket: this.bucket, Key: s3Key }).promise();
                s3ValidatedCount++;
                console.log(`   ✅ ${episodeId}: S3 file exists - ${s3Key}`);
            } catch (error) {
                if (error.code === 'NotFound') {
                    if (isPublished) {
                        this.errors.push(`Published ${episodeId}: File not found in S3 - ${s3Key}`);
                        console.log(`   ❌ ${episodeId}: S3 file MISSING - ${s3Key}`);
                    } else {
                        this.warnings.push(`Draft ${episodeId}: File not found in S3 - ${s3Key} (OK for draft)`);
                        console.log(`   ⚠️  ${episodeId}: S3 file missing (draft) - ${s3Key}`);
                    }
                } else {
                    this.warnings.push(`${episodeId}: S3 access error - ${error.message}`);
                    console.log(`   🔄 ${episodeId}: S3 access error - ${error.message}`);
                }
            }
        }
        
        console.log(`\n   ✅ Validated ${s3ValidatedCount} files in S3 (${s3SkippedCount} drafts skipped)`);
    }

    async validateCDNAccess() {
        console.log('🌐 Validating CDN accessibility...');
        
        const db = getAdminDatabase();
        const snapshot = await db.ref('songs').once('value');
        const songs = snapshot.val();
        
        if (!songs) return;
        
        const songList = Object.entries(songs).map(([key, song]) => ({ id: key, ...song }));
        let accessibleCount = 0;
        
        // Test a sample of songs to avoid rate limiting
        const sampleSize = Math.min(5, songList.length);
        const sampleSongs = songList.slice(0, sampleSize);
        
        for (const song of sampleSongs) {
            if (!song.url) continue;
            
            const fullUrl = song.url.startsWith('http') ? song.url : this.cdnUrl + song.url;
            
            try {
                const response = await axios.head(fullUrl, { timeout: 10000 });
                if (response.status === 200) {
                    accessibleCount++;
                } else {
                    this.warnings.push(`Song ${song.id}: CDN returned ${response.status} - ${fullUrl}`);
                }
            } catch (error) {
                this.errors.push(`Song ${song.id}: CDN access failed - ${error.message}`);
            }
        }
        
        console.log(`   ✅ Validated ${accessibleCount}/${sampleSize} sample URLs via CDN`);
    }

    async validateDataConsistency() {
        console.log('\n🔄 Validating data consistency...');
        
        const db = getAdminDatabase();
        const snapshot = await db.ref('songs').once('value');
        const songs = snapshot.val();
        
        if (!songs) return;
        
        const songList = Object.entries(songs).map(([key, song]) => ({ id: key, ...song }));
        
        // Check for duplicates
        const seenEpisodes = new Set();
        for (const song of songList) {
            const episodeKey = `S${song.season}E${song.episode || song.episodeNumber}`;
            if (seenEpisodes.has(episodeKey)) {
                this.errors.push(`Duplicate episode detected: ${episodeKey}`);
                console.log(`   ❌ Duplicate: ${episodeKey}`);
            } else {
                seenEpisodes.add(episodeKey);
            }
        }
        
        // Analyze season structure
        const seasonEpisodes = {};
        for (const song of songList) {
            if (!song.season) continue;
            if (!seasonEpisodes[song.season]) seasonEpisodes[song.season] = [];
            const episodeNum = song.episode || song.episodeNumber;
            if (episodeNum) {
                seasonEpisodes[song.season].push({
                    episode: episodeNum,
                    published: song.published !== false,
                    title: song.title || 'Untitled'
                });
            }
        }
        
        console.log('\n🏗️  Season Structure Analysis:');
        for (const [season, episodes] of Object.entries(seasonEpisodes)) {
            episodes.sort((a, b) => a.episode - b.episode);
            const publishedCount = episodes.filter(e => e.published).length;
            const draftCount = episodes.length - publishedCount;
            
            console.log(`   📺 Season ${season}: ${episodes.length} episodes (${publishedCount} published, ${draftCount} drafts)`);
            
            // Check for gaps in published episodes only
            const publishedEpisodes = episodes.filter(e => e.published).map(e => e.episode);
            if (publishedEpisodes.length > 0) {
                for (let i = 1; i < Math.max(...publishedEpisodes); i++) {
                    if (!publishedEpisodes.includes(i)) {
                        // Check if there's a draft for this episode
                        const hasDraft = episodes.some(e => e.episode === i && !e.published);
                        if (hasDraft) {
                            console.log(`      📝 Episode ${i}: Draft exists (not published yet)`);
                        } else {
                            this.warnings.push(`Season ${season}: Published episodes skip episode ${i} (no draft found)`);
                            console.log(`      ⚠️  Episode ${i}: Missing (gap in published sequence)`);
                        }
                    }
                }
            }
        }
        
        console.log(`\n   ✅ Validated data consistency across ${Object.keys(seasonEpisodes).length} seasons`);
    }

    printResults() {
        console.log('\n📊 VALIDATION RESULTS:');
        console.log('======================');
        console.log(`✅ Files validated: ${this.validatedFiles}`);
        console.log(`❌ Errors: ${this.errors.length}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        
        if (this.errors.length > 0) {
            console.log('\n🚨 CRITICAL ERRORS:');
            this.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.warnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`));
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new EpisodeContentValidator();
    validator.validateAll().catch(console.error);
}

module.exports = EpisodeContentValidator;