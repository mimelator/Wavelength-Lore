/**
 * Direct API Test for Retry Setup
 */

const axios = require('axios');

async function testRetryAPI() {
  console.log('🧪 Testing Retry Setup API directly...');
  
  try {
    const response = await axios.post(
      'http://localhost:3001/api/merchandise/retry-setup/68fc5720fcef51b27d0c0142',
      {},
      {
        headers: {
          'Authorization': 'Bearer dev-bypass',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.log('❌ Error Status:', error.response?.status);
    console.log('❌ Error Data:', error.response?.data);
    console.log('❌ Error Message:', error.message);
    
    if (error.response?.data) {
      console.log('📋 Full Error Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRetryAPI().catch(console.error);