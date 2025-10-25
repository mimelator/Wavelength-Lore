#!/usr/bin/env node

const { initScriptEnv } = require('./utils/env-loader');

// Initialize environment with required variables
initScriptEnv(['DATABASE_URL', 'PROJECT_ID', 'API_KEY', 'AUTH_DOMAIN']);

const axios = require('axios');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Check command line arguments for production flag
const args = process.argv.slice(2);
const isProduction = args.includes('--prod') || args.includes('--production');

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎵 Audio Files Checker Tool

Usage: node check_audio_files.js [options]

Options:
  --prod, --production    Check production audio files (wavelengthlore.com URLs)
  --help, -h             Show this help message

Examples:
  node check_audio_files.js           # Check local development audio files
  node check_audio_files.js --prod    # Check production audio files

This script checks that MP3 audio files are accessible for all episodes.
It validates the audio URLs stored in the Firebase database and reports any issues.
`);
    process.exit(0);
}

const BASE_URL = isProduction ? 'https://wavelengthlore.com' : 'http://localhost:3001';

// Admin authentication headers for bypassing rate limits
const getAuthHeaders = () => {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; Wavelength-Lore-AudioChecker/1.0)',
        'Accept': 'audio/mpeg, audio/*, */*'
    };
    
    // Add admin key for production to bypass rate limiting
    if (isProduction && process.env.ADMIN_SECRET_KEY) {
        headers['X-Admin-Key'] = process.env.ADMIN_SECRET_KEY;
        console.log('🔑 Using admin authentication to bypass rate limits');
    }
    
    return headers;
};

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
};

class AudioChecker {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.database = getDatabase(this.app);
        this.results = {
            total: 0,
            working: 0,
            broken: 0,
            missing: 0,
            issues: []
        };
        this.timeout = isProduction ? 30000 : 15000; // 30s for prod, 15s for local
    }

    async checkAudioUrl(url, episodeInfo) {
        if (!url) {
            return {
                success: false,
                error: 'No audio URL provided',
                status: 'missing'
            };
        }

        // Convert relative URLs to full URLs
        let fullUrl = url;
        if (url.startsWith('/')) {
            fullUrl = BASE_URL + url;
        } else if (!url.startsWith('http')) {
            // Handle other relative formats
            fullUrl = BASE_URL + '/' + url;
        }

        try {
            const response = await axios.head(fullUrl, {
                headers: getAuthHeaders(),
                timeout: this.timeout,
                validateStatus: (status) => status < 500 // Accept 404 as valid response for reporting
            });

            if (response.status === 200) {
                const contentType = response.headers['content-type'];
                const contentLength = response.headers['content-length'];
                
                // Check if it's actually an audio file
                if (contentType && !contentType.includes('audio') && !contentType.includes('mpeg') && !contentType.includes('mp3')) {
                    return {
                        success: false,
                        error: `Expected audio file, got ${contentType}`,
                        status: 'invalid',
                        contentType,
                        contentLength,
                        fullUrl
                    };
                }

                return {
                    success: true,
                    contentType,
                    contentLength: contentLength ? parseInt(contentLength) : null,
                    status: 'working',
                    fullUrl
                };
            } else {
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    status: 'broken',
                    httpStatus: response.status,
                    fullUrl
                };
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    error: 'Request timeout',
                    status: 'timeout',
                    fullUrl
                };
            } else if (error.response) {
                return {
                    success: false,
                    error: `HTTP ${error.response.status}`,
                    status: 'broken',
                    httpStatus: error.response.status,
                    fullUrl
                };
            } else {
                return {
                    success: false,
                    error: error.message,
                    status: 'error',
                    fullUrl
                };
            }
        }
    }

    async fetchAllEpisodes() {
        console.log('📱 Fetching episodes from Firebase database...');
        
        try {
            const videosRef = ref(this.database, 'videos');
            const snapshot = await get(videosRef);
            
            if (!snapshot.exists()) {
                throw new Error('No video data found in database');
            }

            const videosData = snapshot.val();
            const episodes = [];

            for (const seasonId in videosData) {
                const seasonData = videosData[seasonId];
                const seasonNumber = seasonId.replace('season', '');
                
                if (seasonData.episodes) {
                    for (const episodeId in seasonData.episodes) {
                        const episodeData = seasonData.episodes[episodeId];
                        const episodeNumber = episodeId.replace('episode', '');
                        
                        episodes.push({
                            season: seasonNumber,
                            episode: episodeNumber,
                            title: episodeData.title,
                            audioUrl: episodeData.audio,
                            pageUrl: `${BASE_URL}/season/${seasonNumber}/episode/${episodeNumber}`,
                            seasonId,
                            episodeId
                        });
                    }
                }
            }

            console.log(`📺 Found ${episodes.length} episodes across ${Object.keys(videosData).length} seasons`);
            return episodes;
        } catch (error) {
            console.error('❌ Error fetching episodes:', error.message);
            throw error;
        }
    }

    async checkAllAudioFiles() {
        const episodes = await this.fetchAllEpisodes();
        
        console.log('\n🎵 Checking audio files...\n');
        console.log('=' .repeat(80));
        
        for (const episode of episodes) {
            this.results.total++;
            
            const episodeLabel = `Season ${episode.season}, Episode ${episode.episode}: "${episode.title}"`;
            process.stdout.write(`Checking ${episodeLabel}... `);
            
            const result = await this.checkAudioUrl(episode.audioUrl, episode);
            
            if (result.success) {
                this.results.working++;
                const sizeInfo = result.contentLength 
                    ? ` (${this.formatFileSize(result.contentLength)})`
                    : '';
                console.log(`✅ OK${sizeInfo}`);
            } else {
                this.results.broken++;
                console.log(`❌ ${result.error}`);
                
                this.results.issues.push({
                    episode: episodeLabel,
                    pageUrl: episode.pageUrl,
                    audioUrl: episode.audioUrl,
                    fullUrl: result.fullUrl,
                    error: result.error,
                    status: result.status
                });
            }
        }
        
        console.log('=' .repeat(80));
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    printSummary() {
        console.log('\n📊 AUDIO FILES SUMMARY REPORT');
        console.log('=' .repeat(50));
        
        const successRate = this.results.total > 0 
            ? Math.round((this.results.working / this.results.total) * 100) 
            : 0;
        
        console.log(`🌐 Environment: ${isProduction ? 'Production (wavelengthlore.com)' : 'Local (localhost:3001)'}`);
        console.log(`📊 Total Episodes: ${this.results.total}`);
        console.log(`✅ Working Audio: ${this.results.working}`);
        console.log(`❌ Broken Audio: ${this.results.broken}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (this.results.issues.length > 0) {
            console.log('\n🚨 ISSUES FOUND:');
            console.log('-' .repeat(50));
            
            this.results.issues.forEach((issue, index) => {
                console.log(`\n${index + 1}. ${issue.episode}`);
                console.log(`   Page: ${issue.pageUrl}`);
                console.log(`   Audio URL: ${issue.audioUrl || 'Missing'}`);
                if (issue.fullUrl && issue.fullUrl !== issue.audioUrl) {
                    console.log(`   Full URL: ${issue.fullUrl}`);
                }
                console.log(`   Error: ${issue.error}`);
                console.log(`   Status: ${issue.status}`);
            });
            
            console.log('\n💡 Common Issues:');
            console.log('   • Missing audio URLs in database');
            console.log('   • Audio files not uploaded to static directory');
            console.log('   • Incorrect file paths or naming');
            console.log('   • CDN/server configuration issues');
            
            console.log('\n🔧 To Fix:');
            console.log('   1. Check episode data in Firebase database');
            console.log('   2. Verify audio files exist in static/audio/');
            console.log('   3. Check file permissions and paths');
            console.log('   4. Test audio URLs manually in browser');
        } else {
            console.log('\n🎉 All audio files are working correctly!');
        }
        
        console.log(`\nOverall: ${this.results.working}/${this.results.total} audio files working (${successRate}%)`);
        
        // Exit code for CI/CD integration
        if (successRate === 100) {
            process.exit(0);
        } else if (successRate >= 90) {
            process.exit(1); // Minor issues
        } else {
            process.exit(2); // Major issues
        }
    }
}

async function main() {
    console.log('🎵 Audio Files Checker for Wavelength Lore');
    console.log(`🌐 Target: ${BASE_URL}`);
    console.log('=' .repeat(50));
    
    const checker = new AudioChecker();
    
    try {
        await checker.checkAllAudioFiles();
        checker.printSummary();
    } catch (error) {
        console.error('\n💥 Audio check failed:', error.message);
        console.error(error);
        process.exit(3);
    }
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Audio check interrupted by user');
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Audio check terminated');
    process.exit(143);
});

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = AudioChecker;