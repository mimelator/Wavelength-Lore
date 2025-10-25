/**
 * Test Product Status API
 */

const axios = require('axios');

async function testProductStatusAPI() {
  console.log('🧪 Testing Product Status API...');
  
  try {
    const response = await axios.get(
      'http://localhost:3001/api/merchandise/product-status/68fc5720fcef51b27d0c0142',
      {
        headers: {
          'Authorization': 'Bearer dev-bypass'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
    console.log('❌ Error Message:', error.message);
  }
}

testProductStatusAPI().catch(console.error);