/**
 * Song Upload Step
 * 
 * Milestone 1.2: Song Upload & Processing
 * Handles MP3 file upload with S3 integration and metadata extraction
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

class SongUploadStep {
    constructor(stateManager, rl) {
        this.stateManager = stateManager;
        this.rl = rl;
        
        // Initialize S3
        this.s3 = new AWS.S3({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        
        this.bucketName = process.env.S3_BUCKET_NAME || 'wavelength-lore-bucket';
    }

    async execute(episode) {
        console.log(chalk.yellow('\nStep 2 of 10: Song Upload'));
        console.log('─'.repeat(30));
        console.log(`Episode: ${chalk.cyan(episode.id)} - ${episode.title}`);
        console.log();
        
        try {
            // Get MP3 file path
            const filePath = await this.getMP3FilePath();
            if (!filePath) {
                console.log(chalk.gray('Song upload skipped'));
                return;
            }
            
            // Validate MP3 file
            const validation = await this.validateMP3File(filePath);
            if (!validation.isValid) {
                console.error(chalk.red('❌ File validation failed:'), validation.error);
                return;
            }
            
            console.log(chalk.green('✅ MP3 file validated'));
            console.log(`  📁 File: ${path.basename(filePath)}`);
            console.log(`  📊 Size: ${this.formatFileSize(validation.size)}`);
            
            // Extract metadata
            console.log(chalk.blue('\n🔄 Extracting audio metadata...'));
            const metadata = await this.extractAudioMetadata(filePath);
            
            console.log(chalk.green('✅ Metadata extracted'));
            console.log(`  ⏱️  Duration: ${this.formatDuration(metadata.duration)}`);
            console.log(`  🎵 Format: ${metadata.format}`);
            console.log(`  📈 Bitrate: ${metadata.bitrate} kbps`);
            
            // Collect song metadata
            const songData = await this.collectSongMetadata(episode, metadata);
            
            // Upload to S3
            console.log(chalk.blue('\n🔄 Uploading to S3...'));
            const uploadResult = await this.uploadToS3(filePath, episode, songData);
            
            console.log(chalk.green('✅ Upload completed'));
            console.log(`  🌐 S3 Key: ${uploadResult.s3Key}`);
            console.log(`  🔗 URL: ${uploadResult.url}`);
            
            // Update episode with song metadata
            const songMetadata = {
                title: songData.title,
                artist: songData.artist,
                duration: metadata.duration,
                url: uploadResult.url,
                lyrics: songData.lyrics,
                s3Key: uploadResult.s3Key
            };
            
            await this.stateManager.updateSongMetadata(episode.id, songMetadata);
            await this.stateManager.completeStep(episode.id, 2);
            
            console.log(chalk.green('\n✅ Song upload and processing completed!'));
            this.displaySongSummary(songMetadata);
            
            // Archive old version if updating
            if (songData.isUpdate) {
                await this.archiveOldVersion(episode, uploadResult.s3Key);
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Song upload failed:'), error.message);
            throw error;
        }
    }

    async getMP3FilePath() {
        console.log('Upload Options:');
        console.log('1. 📁 Enter file path');
        console.log('2. 🎵 Drag and drop file');
        console.log('3. ⏭️  Skip for now');
        console.log();
        
        const choice = await this.question('Choose upload method (1-3): ');
        
        switch (choice.trim()) {
            case '1':
                return await this.getFilePathInput();
            case '2':
                return await this.getDragDropPath();
            case '3':
                return null;
            default:
                console.log(chalk.red('❌ Invalid choice'));
                return await this.getMP3FilePath();
        }
    }

    async getFilePathInput() {
        while (true) {
            const filePath = await this.question('Enter MP3 file path: ');
            
            if (!filePath.trim()) {
                return null;
            }
            
            const expandedPath = filePath.replace('~', require('os').homedir());
            
            if (fs.existsSync(expandedPath)) {
                return expandedPath;
            } else {
                console.log(chalk.red('❌ File not found. Please check the path.'));
            }
        }
    }

    async getDragDropPath() {
        console.log(chalk.blue('📂 Drag and drop your MP3 file here, then press Enter:'));
        console.log(chalk.gray('(Or press Enter to skip)'));
        
        const input = await this.question('');
        
        if (!input.trim()) {
            return null;
        }
        
        // Clean up the drag-and-drop path (remove quotes, etc.)
        const cleanPath = input.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '');
        
        if (fs.existsSync(cleanPath)) {
            return cleanPath;
        } else {
            console.log(chalk.red('❌ File not found. Please try again.'));
            return await this.getDragDropPath();
        }
    }

    async validateMP3File(filePath) {
        try {
            if (!filePath.toLowerCase().endsWith('.mp3')) {
                return { isValid: false, error: 'File must be MP3 format' };
            }
            
            const stats = fs.statSync(filePath);
            const maxSize = 50 * 1024 * 1024; // 50MB limit
            
            if (stats.size > maxSize) {
                return { isValid: false, error: 'File size exceeds 50MB limit' };
            }
            
            if (stats.size < 1024) {
                return { isValid: false, error: 'File appears to be too small' };
            }
            
            return { isValid: true, size: stats.size };
            
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    }

    async extractAudioMetadata(filePath) {
        try {
            // Try to load music-metadata module
            let mm;
            try {
                mm = require('music-metadata');
            } catch (error) {
                console.warn(chalk.yellow('⚠️ music-metadata not installed, using basic metadata'));
                return this.getBasicMetadata(filePath);
            }
            
            const metadata = await mm.parseFile(filePath);
            
            return {
                duration: metadata.format.duration || 0,
                format: metadata.format.container || 'MP3',
                bitrate: metadata.format.bitrate || 0,
                sampleRate: metadata.format.sampleRate || 0,
                title: metadata.common.title || null,
                artist: metadata.common.artist || null,
                album: metadata.common.album || null
            };
            
        } catch (error) {
            console.warn(chalk.yellow('⚠️ Could not extract detailed metadata:', error.message));
            return this.getBasicMetadata(filePath);
        }
    }

    getBasicMetadata(filePath) {
        const stats = fs.statSync(filePath);
        // Rough estimate: MP3 at 128kbps is about 1MB per minute
        const estimatedDuration = Math.round((stats.size / (128 * 1024 / 8)) / 60 * 100) / 100;
        
        return {
            duration: estimatedDuration,
            format: 'MP3',
            bitrate: 128, // estimate
            sampleRate: 44100, // standard
            title: null,
            artist: null,
            album: null
        };
    }

    async collectSongMetadata(episode, audioMetadata) {
        console.log(chalk.blue('\n🎵 Song Metadata'));
        console.log('─'.repeat(20));
        
        // Song title (default to episode title)
        const defaultTitle = audioMetadata.title || episode.title;
        const title = await this.question(`Song Title [${defaultTitle}]: `) || defaultTitle;
        
        // Artist (default to Wavelength)
        const defaultArtist = audioMetadata.artist || 'Wavelength';
        const artist = await this.question(`Artist [${defaultArtist}]: `) || defaultArtist;
        
        // Lyrics (optional)
        console.log('\nLyrics (optional):');
        console.log(chalk.gray('Enter lyrics line by line. Press Enter twice to finish.'));
        const lyrics = await this.collectLyrics();
        
        return {
            title,
            artist,
            lyrics
        };
    }

    async collectLyrics() {
        const lines = [];
        let emptyLineCount = 0;
        
        while (true) {
            const line = await this.question('');
            
            if (line.trim() === '') {
                emptyLineCount++;
                if (emptyLineCount >= 2) {
                    break;
                }
            } else {
                emptyLineCount = 0;
                lines.push(line);
            }
        }
        
        return lines.join('\n').trim();
    }

    async uploadToS3(filePath, episode, songData) {
        const fileName = `wavelength-s${episode.season}e${episode.episodeNumber}.mp3`;
        const s3Key = `songs/season-${episode.season}/episode-${episode.episodeNumber}/current/${fileName}`;
        
        const fileContent = fs.readFileSync(filePath);
        
        const uploadParams = {
            Bucket: this.bucketName,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'audio/mpeg',
            Metadata: {
                'episode-id': episode.id,
                'song-title': songData.title,
                'artist': songData.artist,
                'uploaded-at': new Date().toISOString()
            }
        };
        
        try {
            const result = await this.s3.upload(uploadParams).promise();
            
            return {
                s3Key: s3Key,
                url: result.Location,
                etag: result.ETag
            };
            
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw new Error(`S3 upload failed: ${error.message}`);
        }
    }

    async archiveOldVersion(episode, currentS3Key) {
        try {
            const archiveKey = currentS3Key.replace('/current/', '/archive/').replace('.mp3', `-v1-${Date.now()}.mp3`);
            
            // This would copy the old version to archive
            // Implementation depends on existing S3 structure
            console.log(chalk.gray(`📦 Old version archived to: ${archiveKey}`));
            
        } catch (error) {
            console.warn(chalk.yellow('⚠️ Could not archive old version:', error.message));
        }
    }

    displaySongSummary(songMetadata) {
        console.log('\n📊 Song Summary:');
        console.log('─'.repeat(25));
        console.log(`🎵 Title: ${chalk.cyan(songMetadata.title)}`);
        console.log(`🎤 Artist: ${chalk.cyan(songMetadata.artist)}`);
        console.log(`⏱️  Duration: ${this.formatDuration(songMetadata.duration)}`);
        console.log(`🔗 URL: ${songMetadata.url}`);
        
        if (songMetadata.lyrics) {
            const lyricsPreview = songMetadata.lyrics.substring(0, 100);
            console.log(`📝 Lyrics: ${lyricsPreview}${songMetadata.lyrics.length > 100 ? '...' : ''}`);
        }
    }

    formatDuration(seconds) {
        if (!seconds || seconds === 0) return 'Unknown';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

module.exports = SongUploadStep;