#!/usr/bin/env node

const axios = require('axios');
const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

// CDN URL - same as radio player uses (from environment/services)
const CDN_URL = process.env.CDN_URL || 'https://df5sj8f594cdx.cloudfront.net';

async function testAllSongUrls() {
    console.log('🎵 Testing all registered song URLs from Firebase...');
    console.log('==================================================\n');
    
    try {
        // Get Firebase database
        const db = getAdminDatabase();
        if (!db) {
            console.log('❌ Firebase not initialized');
            return;
        }
        
        // Get all songs from Firebase
        console.log('📱 Fetching songs from Firebase...');
        const snapshot = await db.ref('songs').once('value');
        const songsData = snapshot.val();
        
        if (!songsData) {
            console.log('❌ No songs found in Firebase');
            return;
        }
        
        // Convert to array
        const songs = Object.entries(songsData).map(([key, song]) => ({
            id: key,
            ...song
        }));
        
        if (!songs || songs.length === 0) {
            console.log('❌ No songs found in Firebase');
            return;
        }
        
        console.log(`✅ Found ${songs.length} songs in Firebase\n`);
        
        let successCount = 0;
        let failureCount = 0;
        const failures = [];
        
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            
            if (!song.url) {
                console.log(`⚠️  SKIPPING: "${song.title}" - No URL field`);
                failureCount++;
                failures.push({
                    title: song.title,
                    error: 'No URL field in Firebase'
                });
                continue;
            }
            
            // Construct CDN URL exactly like radio player does
            let fullUrl;
            if (song.url.startsWith('http://') || song.url.startsWith('https://')) {
                fullUrl = song.url;
            } else {
                fullUrl = CDN_URL + song.url;
            }
            
            console.log(`🎵 ${i + 1}/${songs.length}: "${song.title}"`);
            console.log(`   URL: ${fullUrl}`);
            
            try {
                // Test URL with HEAD request (faster than GET)
                const response = await axios.head(fullUrl, {
                    timeout: 10000, // 10 second timeout
                    validateStatus: function (status) {
                        return status < 500; // Don't throw on 4xx errors
                    }
                });
                
                if (response.status === 200) {
                    console.log(`   ✅ SUCCESS (${response.status})`);
                    successCount++;
                } else {
                    console.log(`   ❌ FAILED (${response.status})`);
                    failureCount++;
                    failures.push({
                        title: song.title,
                        url: fullUrl,
                        status: response.status,
                        error: `HTTP ${response.status}`
                    });
                }
                
            } catch (error) {
                console.log(`   ❌ ERROR: ${error.message}`);
                failureCount++;
                failures.push({
                    title: song.title,
                    url: fullUrl,
                    error: error.message
                });
            }
            
            console.log(''); // Empty line for readability
        }
        
        // Summary
        console.log('📊 FINAL RESULTS:');
        console.log('==================');
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failureCount}`);
        console.log(`📈 Success Rate: ${((successCount / (successCount + failureCount)) * 100).toFixed(1)}%`);
        
        if (failures.length > 0) {
            console.log('\n🚨 FAILURES SUMMARY:');
            console.log('=====================');
            failures.forEach((failure, index) => {
                console.log(`${index + 1}. "${failure.title}"`);
                if (failure.url) {
                    console.log(`   URL: ${failure.url}`);
                }
                console.log(`   Error: ${failure.error}\n`);
            });
        }
        
        if (successCount === songs.length) {
            console.log('🎉 ALL SONGS PASSED! Radio player should work perfectly!');
        } else {
            console.log('⚠️  Some songs failed. Radio player may skip these tracks.');
        }
        
    } catch (error) {
        console.error('❌ Error testing song URLs:', error);
    }
}

testAllSongUrls().then(() => {
    console.log('\n✅ URL testing complete');
    process.exit(0);
}).catch(error => {
    console.error('❌ Testing failed:', error);
    process.exit(1);
});