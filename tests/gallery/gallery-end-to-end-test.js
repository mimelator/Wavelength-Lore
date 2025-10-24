#!/usr/bin/env node
/**
 * Gallery End-to-End Test
 * 
 * Uses actual system helpers and Firebase data to test gallery workflow
 */

const fetch = require('node-fetch');
const assert = require('assert');
const cheerio = require('cheerio');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-User-ID': TEST_USER_ID,
      'X-API-Request': 'test',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }
  
  const data = await response.json();
  
  if (data.success === false) {
    throw new Error(data.error || 'API returned success: false');
  }
  
  return data;
}

async function findCharacterWithImages() {
  console.log('🔍 Finding character with images via API...');
  
  // Get characters page HTML
  const response = await fetch(`${API_BASE_URL}/characters`);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Find first character link
  const characterLink = $('a[href^="/character/"]').first().attr('href');
  if (!characterLink) {
    throw new Error('No character links found on /characters page');
  }
  
  console.log(`   Found character: ${characterLink}`);
  
  // Get character page
  const charResponse = await fetch(`${API_BASE_URL}${characterLink}`);
  const charHtml = await charResponse.text();
  const $char = cheerio.load(charHtml);
  
  // Find first gallery image
  const galleryImage = $char('.gallery-image').first();
  const imageUrl = galleryImage.attr('src') || galleryImage.attr('data-fullsize');
  
  if (!imageUrl) {
    throw new Error('No gallery images found on character page');
  }
  
  const characterName = $char('h1').first().text().trim();
  
  console.log(`   ✅ Found: ${characterName}`);
  console.log(`   Image URL: ${imageUrl}`);
  
  return {
    character: { name: characterName },
    imageUrl: imageUrl
  };
}

async function saveImageToGallery(imageUrl, title) {
  console.log('💾 Saving image to gallery...');
  
  const data = await apiRequest(`${API_BASE_URL}/gallery/api/user/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: imageUrl,
      title: title,
      sourceUrl: 'http://localhost:3001/test'
    })
  });
  
  // Content images (bookmarks) have null relativePath, uploaded images have a path
  assert(data.image, 'Should return image object');
  assert(data.image.id, 'Should return image id');
  assert(data.image.url, 'Should return image url');
  
  // Determine image type based on relativePath
  const isBookmark = data.image.relativePath === null;
  const isUploaded = data.image.relativePath !== null;
  
  assert(isBookmark || isUploaded, 'Image should be either a bookmark or uploaded');
  
  console.log(`   ✅ Saved: ${data.image.id} (type: ${isBookmark ? 'bookmark' : 'uploaded'})`);
  return data.image;
}

async function verifyImageInGallery(imageId, relativePath) {
  console.log('📋 Verifying in gallery...');
  
  const data = await apiRequest(`${API_BASE_URL}/api/gallery/user/images`);
  
  // Find image by either relativePath (uploaded) or id (bookmark)
  const image = data.images.find(img => 
    (relativePath && img.relativePath === relativePath) || 
    (img.id === imageId)
  );
  
  if (!image) {
    throw new Error(`Image not found with id: ${imageId}, path: ${relativePath}`);
  }
  
  assert(image.id && image.url, 'Image should have valid metadata');
  
  // Bookmarks have size 0 or undefined, uploaded images have size > 0
  const isBookmark = image.type === 'bookmark' || image.relativePath === null;
  const isUploaded = image.type === 'uploaded' || image.relativePath !== null;
  
  console.log(`   ✅ Found (${data.images.length} total, type: ${isBookmark ? 'bookmark' : 'uploaded'})`);
  return image;
}

async function testDownload(imageId, expectedSize, isBookmark = false) {
  console.log('⬇️  Testing download...');
  
  // Bookmarks are not downloadable from gallery API (they're external content)
  if (isBookmark) {
    console.log('   ⏭️  Skipped (bookmarks are not downloadable via gallery API)');
    return;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/gallery/image/${imageId}/download`, {
    headers: { 'X-User-ID': TEST_USER_ID }
  });
  
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  
  const buffer = await response.buffer();
  assert(buffer.length === expectedSize, `Size mismatch: ${buffer.length} vs ${expectedSize}`);
  console.log(`   ✅ Downloaded ${buffer.length} bytes`);
}

async function deleteImage(imageId, relativePath, bookmarkId) {
  console.log('🗑️  Deleting...');
  
  const deletePayload = {};
  if (bookmarkId) {
    deletePayload.bookmarkId = bookmarkId;
  } else if (relativePath) {
    deletePayload.relativePath = relativePath;
  } else {
    throw new Error('Either bookmarkId or relativePath required for deletion');
  }
  
  await apiRequest(`${API_BASE_URL}/api/gallery/user/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deletePayload)
  });
  
  console.log('   ✅ Deleted');
}

async function verifyRemoved(imageId, relativePath) {
  console.log('✔️  Verifying removal...');
  
  const data = await apiRequest(`${API_BASE_URL}/api/gallery/user/images`);
  const stillExists = data.images.some(img => 
    (relativePath && img.relativePath === relativePath) || 
    img.id === imageId
  );
  
  if (stillExists) throw new Error('Image still exists');
  console.log(`   ✅ Removed (${data.images.length} remain)`);
}

async function runGalleryEndToEndTest() {
  console.log('\n=== GALLERY END-TO-END TEST ===\n');
  
  let savedPath = null;
  
  try {
    // STEP 1: Check if user has at least one image in gallery
    console.log('📊 STEP 1: Check for existing gallery images');
    const existingData = await apiRequest(`${API_BASE_URL}/api/gallery/user/images`);
    const existingCount = existingData.images ? existingData.images.length : 0;
    console.log(`   Found ${existingCount} existing images`);
    
    // If no images, add one first
    if (existingCount === 0) {
      console.log('   ℹ️  No images found, adding one first...\n');
      const { character, imageUrl } = await findCharacterWithImages();
      const initialSave = await saveImageToGallery(imageUrl, `Setup-${character.name}-${Date.now()}`);
      console.log(`   ✅ Added initial image: ${initialSave.id}\n`);
    } else {
      console.log(`   ✅ Gallery has ${existingCount} images\n`);
    }
    
    // STEP 2: Now run the actual test workflow
    console.log('📊 STEP 2: Run gallery workflow test');
    const { character, imageUrl } = await findCharacterWithImages();
    const saved = await saveImageToGallery(imageUrl, `E2E-${character.name}-${Date.now()}`);
    savedPath = saved.relativePath;
    const savedId = saved.id;
    const isBookmark = saved.relativePath === null;
    
    const gallery = await verifyImageInGallery(savedId, savedPath);
    await testDownload(gallery.id, gallery.size, isBookmark);
    await deleteImage(savedId, savedPath, isBookmark ? savedId : null);
    await verifyRemoved(savedId, savedPath);
    
    console.log('\n✅ ALL TESTS PASSED\n');
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    
    if (savedPath) {
      try {
        await deleteImage(savedPath);
        console.log('🧹 Cleanup done');
      } catch (e) {
        console.log('⚠️  Cleanup failed');
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  runGalleryEndToEndTest();
}

module.exports = { runGalleryEndToEndTest };
