#!/usr/bin/env node

/**
 * Test Google GenAI Image Generation
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testImageGeneration() {
  console.log('🧪 Testing Google GenAI Image Generation\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    process.exit(1);
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  
  const modelKey = process.env.AI_MODEL_KEY || 'gemini-2.5-flash-image';
  console.log('📦 Model:', modelKey);
  
  try {
    console.log('\n🔧 Initializing Google GenAI...');
    const googleAI = new GoogleGenAI({ apiKey });
    console.log('✅ GoogleGenAI initialized');
    
    const prompt = 'A beautiful daphne flower with fragrant pink blossoms';
    console.log(`\n🎨 Generating image with prompt: "${prompt}"`);
    
    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
    };
    
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];
    
    console.log('📡 Sending request to API...');
    const response = await googleAI.models.generateContentStream({
      model: modelKey,
      config,
      contents,
    });
    
    console.log('✅ Response received, processing stream...');
    
    let imageData = null;
    let mimeType = 'image/png';
    let textResponse = '';
    
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        imageData = inlineData.data;
        mimeType = inlineData.mimeType || 'image/png';
        console.log(`🖼️  Image received (${mimeType}, ${imageData.length} chars)`);
      }
      
      if (chunk.text) {
        textResponse += chunk.text;
      }
    }
    
    if (imageData) {
      console.log('\n✅ SUCCESS! Image generated successfully');
      console.log(`   MIME Type: ${mimeType}`);
      console.log(`   Data length: ${imageData.length} characters`);
      if (textResponse) {
        console.log(`   Text response: ${textResponse}`);
      }
    } else {
      console.log('\n⚠️  No image data received');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\n📚 Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testImageGeneration();
