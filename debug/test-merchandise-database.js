#!/usr/bin/env node

/**
 * Test script for merchandise database initialization
 * Tests the updated Firebase integration
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MerchandiseDatabase = require('../services/merchandise-database');

async function testMerchandiseDatabase() {
  console.log('🧪 Testing Merchandise Database Integration...\n');
  
  try {
    console.log('1️⃣ Creating merchandise database instance...');
    const merchandiseDB = new MerchandiseDatabase();
    console.log('✅ Instance created');
    
    console.log('\n2️⃣ Testing database initialization...');
    merchandiseDB.initializeDatabase();
    console.log('✅ Database initialized');
    
    console.log('\n3️⃣ Checking database readiness...');
    const isReady = merchandiseDB.isDatabaseReady();
    console.log(`Database ready: ${isReady}`);
    
    if (isReady) {
      console.log('\n4️⃣ Testing database connection...');
      // Try a simple read operation
      const testProducts = await merchandiseDB.getUserProducts('test-user-id');
      console.log('✅ Database connection test successful');
      console.log(`Found ${testProducts.length} test products`);
      
      console.log('\n5️⃣ Testing enhanced image storage...');
      const testImageId = 'test-image-123';
      const testEnhancementData = {
        enhancedImageUrl: 'https://example.com/enhanced-image.jpg',
        enhancementMethod: 'OpenAI DALL-E 3',
        originalDimensions: { width: 512, height: 512 },
        enhancedDimensions: { width: 1024, height: 1024 },
        scaleFactor: 2.0,
        improvementDescription: 'Enhanced from 512×512 to 1024×1024'
      };
      
      // Test storing enhanced image
      const storeResult = await merchandiseDB.storeEnhancedImage(testImageId, testEnhancementData);
      console.log('Store result:', storeResult);
      
      if (storeResult.success) {
        console.log('✅ Enhanced image stored successfully');
        
        // Test retrieving enhanced image
        const retrievedImage = await merchandiseDB.getEnhancedImage(testImageId);
        console.log('Retrieved enhanced image:', retrievedImage ? 'Found' : 'Not found');
        
        if (retrievedImage) {
          console.log('✅ Enhanced image retrieved successfully');
          console.log(`Method: ${retrievedImage.enhancementMethod}`);
          console.log(`Scale Factor: ${retrievedImage.scaleFactor}`);
          
          // Test hasEnhancedVersion
          const hasEnhanced = await merchandiseDB.hasEnhancedVersion(testImageId);
          console.log(`Has enhanced version: ${hasEnhanced}`);
          
          // Clean up test data
          console.log('\n6️⃣ Cleaning up test data...');
          const deleteResult = await merchandiseDB.deleteEnhancedImage(testImageId);
          console.log('Delete result:', deleteResult);
          
          if (deleteResult.success) {
            console.log('✅ Test data cleaned up successfully');
          }
        } else {
          console.error('❌ Failed to retrieve stored enhanced image');
        }
      } else {
        console.error('❌ Failed to store enhanced image:', storeResult.error);
      }
    }
    
    console.log('\n🎉 All merchandise database tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testMerchandiseDatabase()
    .then(() => {
      console.log('\n✨ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed with error:', error);
      process.exit(1);
    });
}

module.exports = { testMerchandiseDatabase };