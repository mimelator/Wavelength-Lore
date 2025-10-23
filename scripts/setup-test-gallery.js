#!/usr/bin/env node
/**
 * Setup Test Gallery Images
 * 
 * Uploads a test image to the gallery system so we can test
 * the product preview functionality with actual data.
 */

const fs = require('fs');
const path = require('path');
const galleryStorage = require('../utils/gallery/storage');

async function setupTestGallery() {
    console.log('🎨 SETTING UP TEST GALLERY');
    console.log('============================================================');
    
    try {
        // Use the admin user ID from our previous tests
        const testUserId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
        
        // Pick a test image from our static folder
        const testImagePath = path.join(__dirname, '../static/images/seasons/season3/episodes/episode7/images/PrepareForBattle-15.webp');
        
        if (!fs.existsSync(testImagePath)) {
            console.error('❌ Test image not found:', testImagePath);
            return;
        }
        
        console.log('📁 Using test image:', testImagePath);
        console.log('👤 Uploading for user:', testUserId);
        
        // Read the image file
        const imageBuffer = fs.readFileSync(testImagePath);
        const imageName = 'test-battle-scene.webp';
        
        console.log('📊 Image size:', (imageBuffer.length / 1024).toFixed(1), 'KB');
        
        // Upload to gallery
        const uploadResult = await galleryStorage.uploadGalleryImage(
            testUserId,
            imageName,
            imageBuffer,
            'image/webp'
        );
        
        console.log('✅ Successfully uploaded test image!');
        console.log('🔗 Image URL:', uploadResult.url);
        console.log('📝 Image Key:', uploadResult.key);
        
        // Verify by listing user images
        console.log('\n🔍 Verifying upload...');
        const userImages = await galleryStorage.listUserGalleryImages(testUserId);
        console.log('📦 User now has', userImages.length, 'gallery images:');
        userImages.forEach(img => {
            console.log('  🖼️', img.name, '-', img.url);
        });
        
        console.log('\n🎉 Test gallery setup complete!');
        console.log('💡 You can now test the product preview system with actual gallery data.');
        
    } catch (error) {
        console.error('❌ Failed to setup test gallery:', error.message);
        if (error.stack) {
            console.error('📚 Stack trace:', error.stack);
        }
    }
}

// Run if called directly
if (require.main === module) {
    setupTestGallery();
}

module.exports = { setupTestGallery };