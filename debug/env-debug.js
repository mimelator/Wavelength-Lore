// Quick environment debug test
require('dotenv').config();

console.log('Environment Variables:');
console.log(`GALLERY_S3_BUCKET: ${process.env.GALLERY_S3_BUCKET || 'NOT_SET'}`);
console.log(`S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || 'NOT_SET'}`);

// Test the fallback logic from gallery/storage.js
const galleryConfig = {
    GALLERY_S3_BUCKET: process.env.GALLERY_S3_BUCKET
};

const bucketName = galleryConfig.GALLERY_S3_BUCKET || 'wavelength-lore-bucket';
console.log(`Gallery storage would use bucket: ${bucketName}`);

if (bucketName === 'wavelength-lore-bucket') {
    console.log('🚨 BUG: Gallery operations would use lore bucket!');
} else {
    console.log('✅ Gallery operations use correct bucket');
}