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
        
        for (const song of songList) {
            // Check required fields
            if (!song.title) this.errors.push(`Song ${song.id}: Missing title`);
            if (!song.season) this.errors.push(`Song ${song.id}: Missing season`);
            if (!song.episode && !song.episodeNumber) this.errors.push(`Song ${song.id}: Missing episode number`);
            
            // Check URL format
            if (!song.url) {
                this.errors.push(`Song ${song.id}: Missing URL field`);
            } else if (song.url.startsWith('http')) {
                this.warnings.push(`Song ${song.id}: Has full URL instead of relative path - ${song.url}`);
            } else if (!song.url.startsWith('/images/seasons/S')) {
                this.warnings.push(`Song ${song.id}: Non-standard URL format - ${song.url}`);
            }
        }
        
        console.log(`   ✅ Validated ${songList.length} songs in Firebase`);
    }

    async validateS3Files() {
        console.log('📁 Validating S3 file existence...');
        
        const db = getAdminDatabase();
        const snapshot = await db.ref('songs').once('value');
        const songs = snapshot.val();
        
        if (!songs) return;
        
        const songList = Object.entries(songs).map(([key, song]) => ({ id: key, ...song }));
        
        for (const song of songList) {
            if (!song.url) continue;
            
            // Convert URL to S3 key
            const s3Key = song.url.startsWith('/') ? song.url.substring(1) : song.url;
            
            try {
                await this.s3.headObject({ Bucket: this.bucket, Key: s3Key }).promise();
                this.validatedFiles++;
            } catch (error) {
                if (error.code === 'NotFound') {
                    this.errors.push(`Song ${song.id} (${song.title}): File not found in S3 - ${s3Key}`);
                } else {
                    this.warnings.push(`Song ${song.id}: S3 access error - ${error.message}`);
                }
            }
        }
        
        console.log(`   ✅ Validated ${this.validatedFiles} files in S3`);
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
        console.log('🔄 Validating data consistency...');
        
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
                this.warnings.push(`Duplicate episode detected: ${episodeKey}`);
            }
            seenEpisodes.add(episodeKey);
        }
        
        // Check for gaps in episodes
        const seasonEpisodes = {};
        for (const song of songList) {
            if (!seasonEpisodes[song.season]) seasonEpisodes[song.season] = [];
            seasonEpisodes[song.season].push(song.episode || song.episodeNumber);
        }
        
        for (const [season, episodes] of Object.entries(seasonEpisodes)) {
            episodes.sort((a, b) => a - b);
            for (let i = 1; i < episodes[episodes.length - 1]; i++) {
                if (!episodes.includes(i)) {
                    this.warnings.push(`Season ${season}: Missing episode ${i}`);
                }
            }
        }
        
        console.log(`   ✅ Validated data consistency across ${Object.keys(seasonEpisodes).length} seasons`);
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