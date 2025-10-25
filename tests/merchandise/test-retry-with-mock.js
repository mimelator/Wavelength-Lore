/**
 * Test Retry Setup with Mock Mode
 */

const axios = require('axios');

async function testRetryWithMock() {
  console.log('🧪 Testing Retry Setup with Mock Mode...');
  
  // Set environment variable for this process
  process.env.PRINTIFY_MOCK_MODE = 'true';
  
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
  }
}

testRetryWithMock().catch(console.error);