/**
 * Script to retrieve a generated video from a previous operation
 */
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const operationId = 'models/veo-3.1-generate-preview/operations/v75h9ksznzhr';

async function retrieveVideo() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GOOGLE_API_KEY or GEMINI_API_KEY not found in .env');
      process.exit(1);
    }

    console.log('📊 Checking operation status:', operationId);

    // Use REST API directly since the SDK method seems problematic
    const fetch = (await import('node-fetch')).default;
    
    const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${apiKey}`;
    
    console.log('Fetching from:', statusUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(statusUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
    
    const operation = await response.json();

    console.log('Operation status:', operation.done ? 'COMPLETED' : 'PENDING');

    if (!operation.done) {
      console.log('⏳ Video generation is still in progress');
      console.log('Current status:', JSON.stringify(operation, null, 2));
      return;
    }

    if (operation.error) {
      console.error('❌ Video generation failed:', operation.error.message);
      return;
    }

    // Get the video file - check both possible response structures
    let videoFile = operation.response?.generatedVideos?.[0]?.video;
    
    if (!videoFile) {
      // Try the alternate structure
      videoFile = operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video;
    }
    
    if (!videoFile) {
      console.error('❌ No video file found in operation response');
      console.log('Response:', JSON.stringify(operation.response, null, 2));
      return;
    }

    console.log('✅ Video found!');
    console.log('Video URI:', videoFile.uri);

    // Download the video directly from the URI with API key
    console.log('📥 Downloading video from URI...');
    
    // Add API key to the URI
    const videoUrl = `${videoFile.uri}&key=${apiKey}`;
    const videoResponse = await fetch(videoUrl);
    
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }
    
    const videoBytes = await videoResponse.arrayBuffer();
    
    // Save to file
    const outputDir = path.join(__dirname, '..', 'static', 'generated-videos');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const outputPath = path.join(outputDir, `veo-video-${timestamp}.mp4`);
    
    fs.writeFileSync(outputPath, Buffer.from(videoBytes));
    
    console.log('✅ Video saved to:', outputPath);
    console.log('🎬 You can access it at: http://localhost:3001/generated-videos/veo-video-' + timestamp + '.mp4');

  } catch (error) {
    console.error('❌ Error retrieving video:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

retrieveVideo();
