/**
 * Cache Diagnostic Utility
 *
 * Helps diagnose why the Global Image Cache may not be hitting
 * when reusing the same image/gallery combination
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const Sharp = require('sharp');

class CacheDiagnostic {
  /**
   * Generate fingerprint for an image file or buffer
   */
  static generateFingerprint(imageBuffer) {
    return crypto.createHash('sha256').update(imageBuffer).digest('hex');
  }

  /**
   * Compare two images for cache compatibility
   * @param {Buffer} image1 - First image buffer
   * @param {Buffer} image2 - Second image buffer
   * @returns {Object} Comparison results
   */
  static async compareImages(image1, image2) {
    const hash1 = this.generateFingerprint(image1);
    const hash2 = this.generateFingerprint(image2);

    // Get metadata
    const meta1 = await Sharp(image1).metadata();
    const meta2 = await Sharp(image2).metadata();

    return {
      hash1,
      hash2,
      hashesMatch: hash1 === hash2,
      meta1: {
        width: meta1.width,
        height: meta1.height,
        format: meta1.format,
        size: image1.length,
        hasAlpha: meta1.hasAlpha
      },
      meta2: {
        width: meta2.width,
        height: meta2.height,
        format: meta2.format,
        size: image2.length,
        hasAlpha: meta2.hasAlpha
      },
      sizesMatch: image1.length === image2.length,
      dimensionsMatch: meta1.width === meta2.width && meta1.height === meta2.height,
      formatMatch: meta1.format === meta2.format,
      diagnosis: {
        cacheWillHit: hash1 === hash2,
        reason: hash1 === hash2
          ? '✅ Images are identical - cache WILL hit'
          : `❌ Images differ - cache will NOT hit. Differences: ${[
              !this.dimensionsMatch ? 'dimensions' : null,
              !this.sizesMatch ? 'file sizes' : null,
              !this.formatMatch ? 'formats' : null
            ].filter(x => x).join(', ')}`
      }
    };
  }

  /**
   * Analyze why cache might not be hitting
   */
  static async analyzeCacheIssues(imageBuffer, expectedHash) {
    const actualHash = this.generateFingerprint(imageBuffer);
    const meta = await Sharp(imageBuffer).metadata();

    console.log('🔍 CACHE DIAGNOSTIC REPORT');
    console.log('═'.repeat(50));

    console.log('\n📊 Image Metadata:');
    console.log(`  Dimensions: ${meta.width}x${meta.height}`);
    console.log(`  Format: ${meta.format}`);
    console.log(`  Buffer Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`  Has Alpha: ${meta.hasAlpha}`);

    console.log('\n🔑 Hash Information:');
    console.log(`  Actual Hash:   ${actualHash}`);
    console.log(`  Expected Hash: ${expectedHash || 'N/A'}`);

    if (expectedHash) {
      if (actualHash === expectedHash) {
        console.log('  ✅ Hashes MATCH - Cache should hit!');
      } else {
        console.log('  ❌ Hashes DO NOT MATCH - Cache will miss');
        console.log('\n  Possible reasons:');
        console.log('  1. Image was re-compressed or re-encoded');
        console.log('  2. Image metadata changed (EXIF, etc)');
        console.log('  3. Different image file was uploaded');
        console.log('  4. Image was resized or transformed');
      }
    }

    console.log('\n💡 Cache Reuse Tips:');
    console.log('  • Use exact same image file (byte-for-byte)');
    console.log('  • Avoid re-uploading if already processed');
    console.log('  • Check that no compression occurred');
    console.log('  • Verify Firebase is connected and ready');

    return {
      actualHash,
      expectedHash,
      hashesMatch: actualHash === expectedHash,
      metadata: meta
    };
  }

  /**
   * Log cache check information for debugging
   */
  static logCacheCheck(contentHash, found = false, details = {}) {
    console.log('\n📋 CACHE CHECK LOG:');
    console.log('═'.repeat(50));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔑 Content Hash: ${contentHash}`);
    console.log(`🎯 Cache Result: ${found ? '✅ HIT' : '❌ MISS'}`);

    if (found) {
      console.log(`\n📦 Cached Result Details:`);
      console.log(`  Method: ${details.method || 'N/A'}`);
      console.log(`  S3 Key: ${details.s3Key || 'N/A'}`);
      console.log(`  Created: ${details.createdAt ? new Date(details.createdAt).toISOString() : 'N/A'}`);
      console.log(`  Usage Count: ${details.usageCount || 0}`);
      console.log(`  File Size: ${details.fileSize ? (details.fileSize / 1024).toFixed(2) + ' KB' : 'N/A'}`);
    } else {
      console.log(`\n⚠️  No cached version found`);
      console.log(`   A new upscaling will be performed`);
      console.log(`   Result will be cached for future use`);
    }
  }
}

module.exports = CacheDiagnostic;
