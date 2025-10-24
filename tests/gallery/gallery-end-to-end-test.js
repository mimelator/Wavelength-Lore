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
  
  assert(data.image && data.image.relativePath, 'Should return image with relativePath');
  console.log(`   ✅ Saved: ${data.image.id}`);
  return data.image;
}

async function verifyImageInGallery(relativePath) {
  console.log('📋 Verifying in gallery...');
  
  const data = await apiRequest(`${API_BASE_URL}/api/gallery/user/images`);
  const image = data.images.find(img => img.relativePath === relativePath);
  
  if (!image) {
    throw new Error(`Image not found: ${relativePath}`);
  }
  
  assert(image.id && image.url && image.size > 0, 'Image should have valid metadata');
  console.log(`   ✅ Found (${data.images.length} total)`);
  return image;
}

async function testDownload(imageId, expectedSize) {
  console.log('⬇️  Testing download...');
  
  const response = await fetch(`${API_BASE_URL}/api/gallery/image/${imageId}/download`, {
    headers: { 'X-User-ID': TEST_USER_ID }
  });
  
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  
  const buffer = await response.buffer();
  assert(buffer.length === expectedSize, `Size mismatch: ${buffer.length} vs ${expectedSize}`);
  console.log(`   ✅ Downloaded ${buffer.length} bytes`);
}

async function deleteImage(relativePath) {
  console.log('🗑️  Deleting...');
  
  await apiRequest(`${API_BASE_URL}/gallery/api/user/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ relativePath })
  });
  
  console.log('   ✅ Deleted');
}

async function verifyRemoved(relativePath) {
  console.log('✔️  Verifying removal...');
  
  const data = await apiRequest(`${API_BASE_URL}/api/gallery/user/images`);
  const stillExists = data.images.some(img => img.relativePath === relativePath);
  
  if (stillExists) throw new Error('Image still exists');
  console.log(`   ✅ Removed (${data.images.length} remain)`);
}

async function runGalleryEndToEndTest() {
  console.log('\n=== GALLERY END-TO-END TEST ===\n');
  
  let savedPath = null;
  
  try {
    const { character, imageUrl } = await findCharacterWithImages();
    const saved = await saveImageToGallery(imageUrl, `E2E-${character.name}-${Date.now()}`);
    savedPath = saved.relativePath;
    
    const gallery = await verifyImageInGallery(savedPath);
    await testDownload(gallery.id, gallery.size);
    await deleteImage(savedPath);
    await verifyRemoved(savedPath);
    
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
