/**
 * Image Download Proxy Route
 * Handles bulk image downloads by proxying through the server to avoid CORS issues
 */

const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const archiver = require('archiver');

/**
 * POST /api/download/images
 * Download multiple images as a ZIP file
 * Body: { imageUrls: string[], filename: string }
 */
router.post('/api/download/images', async (req, res) => {
  try {
    const { imageUrls, filename } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'imageUrls array is required' 
      });
    }

    // Limit to 50 images to prevent abuse
    if (imageUrls.length > 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 50 images allowed per download' 
      });
    }

    // Set response headers for ZIP download
    const zipFilename = filename || `images-${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Pipe archive to response
    archive.pipe(res);

    // Track download progress
    let downloadedCount = 0;

    // Download each image and add to archive
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      
      try {
        console.log(`📥 Downloading image ${i + 1}/${imageUrls.length}: ${url}`);
        
        const imageBuffer = await downloadImage(url);
        
        // Extract filename from URL or generate one
        let imageName = url.split('/').pop().split('?')[0];
        if (!imageName || !imageName.includes('.')) {
          imageName = `image-${i + 1}.jpg`;
        }

        // Add to archive
        archive.append(imageBuffer, { name: imageName });
        downloadedCount++;
        
        console.log(`✅ Added ${imageName} to archive (${downloadedCount}/${imageUrls.length})`);
        
      } catch (error) {
        console.error(`❌ Failed to download ${url}:`, error.message);
        // Continue with other images even if one fails
        // Add error placeholder file
        archive.append(
          `Failed to download: ${error.message}`, 
          { name: `ERROR-image-${i + 1}.txt` }
        );
      }
    }

    // Finalize archive
    await archive.finalize();
    
    console.log(`✅ ZIP archive created with ${downloadedCount}/${imageUrls.length} images`);

  } catch (error) {
    console.error('Error creating ZIP archive:', error);
    
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create ZIP archive: ' + error.message 
      });
    }
  }
});

/**
 * Download image from URL and return buffer
 * @param {string} url - Image URL
 * @returns {Promise<Buffer>} - Image buffer
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadImage(response.headers.location)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      response.on('error', reject);
    });

    request.on('error', reject);
    
    // Set timeout
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

module.exports = router;
