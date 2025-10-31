#!/usr/bin/env node

const AWS = require('aws-sdk');
const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

// Configure AWS
AWS.config.update({
    region: 'us-east-1' // Adjust if your bucket is in a different region
});

const s3 = new AWS.S3();
const BUCKET_NAME = 'wavelength-lore-bucket';

// File mapping from actual S3 legacy paths to normalized paths
const FILE_MAPPING = {
    // Season 3 - Files that failed - using actual S3 paths
    'S3E4': { legacy: 'images/seasons/season3/episodes/episode4/FrozenPeace_v5.mp3', normalized: 'images/seasons/S3E4.mp3' },
    'S3E5': { legacy: 'images/seasons/season3/episodes/episode5/RebuildTheShire_v5.mp3', normalized: 'images/seasons/S3E5.mp3' },
    'S3E6': { legacy: 'images/seasons/season3/episodes/episode6/We\'re Coming For You_v5.mp3', normalized: 'images/seasons/S3E6.mp3' },
    'S3E7': { legacy: 'images/seasons/season3/episodes/episode7/PrepareForBattle_v6.mp3', normalized: 'images/seasons/S3E7.mp3' },
    
    // Season 4 - All files that failed - using actual S3 paths
    'S4E1': { legacy: 'images/seasons/season4/episodes/episode1/LockedAndLoaded_v3.mp3', normalized: 'images/seasons/S4E1.mp3' },
    'S4E2': { legacy: 'images/seasons/season4/episodes/episode2/TheKingHasFled_v1.mp3', normalized: 'images/seasons/S4E2.mp3' },
    'S4E3': { legacy: 'images/seasons/season4/episodes/episode3/GoblinsRule_v2.mp3', normalized: 'images/seasons/S4E3.mp3' },
    'S4E4': { legacy: 'images/seasons/season4/episodes/episode4/IceBlueGreed_v2.mp3', normalized: 'images/seasons/S4E4.mp3' },
    'S4E5': { legacy: 'images/seasons/season4/episodes/episode5/TheShireFortress_v2.mp3', normalized: 'images/seasons/S4E5.mp3' },
    'S4E6': { legacy: 'images/seasons/season4/episodes/episode6/BattleOfTheShire_v4.mp3', normalized: 'images/seasons/S4E6.mp3' },
    'S4E7': { legacy: 'images/seasons/season4/episodes/episode7/SongOfMourning_v1.mp3', normalized: 'images/seasons/S4E7.mp3' },
    'S4E8': { legacy: 'images/seasons/season4/episodes/episode8/TheShireDream_v1.mp3', normalized: 'images/seasons/S4E8.mp3' },
    
    // Season 5 - using actual S3 path
    'S5E1': { legacy: 'images/seasons/season5/episodes/episode1/wavelength-s5e1.mp3', normalized: 'images/seasons/S5E1.mp3' }
};

async function checkIfFileExists(bucketName, key) {
    try {
        await s3.headObject({ Bucket: bucketName, Key: key }).promise();
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
}

async function copyFileInBucket(sourceBucket, sourceKey, destBucket, destKey) {
    const copySource = `${sourceBucket}/${sourceKey}`;
    
    const params = {
        Bucket: destBucket,
        CopySource: copySource,
        Key: destKey,
        MetadataDirective: 'COPY'
    };
    
    try {
        const result = await s3.copyObject(params).promise();
        return result;
    } catch (error) {
        console.error(`❌ Error copying ${sourceKey} to ${destKey}:`, error.message);
        throw error;
    }
}

async function copyMp3sToNormalizedPaths() {
    console.log('🎵 Smart S3 MP3 File Copy to Normalized Paths');
    console.log('=============================================\n');
    
    const entries = Object.entries(FILE_MAPPING);
    console.log(`📋 Found ${entries.length} files to process\n`);
    
    let copiedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const [episodeId, paths] of entries) {
        console.log(`🎵 Processing ${episodeId}: ${paths.legacy} → ${paths.normalized}`);
        
        try {
            // Check if normalized file already exists
            const normalizedExists = await checkIfFileExists(BUCKET_NAME, paths.normalized);
            
            if (normalizedExists) {
                console.log(`   ⏩ SKIPPED - Normalized file already exists`);
                skippedCount++;
                continue;
            }
            
            // Check if legacy file exists
            const legacyExists = await checkIfFileExists(BUCKET_NAME, paths.legacy);
            
            if (!legacyExists) {
                console.log(`   ❌ ERROR - Legacy file not found: ${paths.legacy}`);
                errorCount++;
                continue;
            }
            
            // Copy legacy file to normalized path
            console.log(`   📁 Copying from legacy path...`);
            await copyFileInBucket(BUCKET_NAME, paths.legacy, BUCKET_NAME, paths.normalized);
            
            console.log(`   ✅ SUCCESS - File copied successfully`);
            copiedCount++;
            
        } catch (error) {
            console.log(`   ❌ ERROR - ${error.message}`);
            errorCount++;
        }
        
        console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📊 COPY RESULTS:');
    console.log('================');
    console.log(`✅ Files copied: ${copiedCount}`);
    console.log(`⏩ Files skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Success rate: ${((copiedCount / (copiedCount + errorCount + skippedCount)) * 100).toFixed(1)}%`);
    
    if (copiedCount > 0) {
        console.log('\n🚀 Files copied successfully! Consider running cache bust to refresh CDN.');
    }
    
    if (errorCount > 0) {
        console.log('\n⚠️  Some files had errors. Check S3 bucket structure.');
    }
}

// Main execution
if (require.main === module) {
    copyMp3sToNormalizedPaths().then(() => {
        console.log('\n✅ S3 copy operation complete');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Copy operation failed:', error);
        process.exit(1);
    });
}

module.exports = { copyMp3sToNormalizedPaths, FILE_MAPPING };