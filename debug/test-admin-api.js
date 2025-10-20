/**
 * Test script to directly call the admin API and check the response
 */

const fetch = require('node-fetch');

async function testAdminAPI() {
    console.log('🔍 Testing admin API endpoint directly...\n');
    
    try {
        // First, let's check if the server is running
        console.log('🌐 Testing server availability...');
        const pingResponse = await fetch('http://localhost:3001');
        console.log(`✅ Server responds with status: ${pingResponse.status}\n`);
        
        // Test the admin API without authentication (should fail with 401/403)
        console.log('🔒 Testing admin API without auth (should fail)...');
        const unauthResponse = await fetch('http://localhost:3001/api/admin/users');
        console.log(`❌ Unauthenticated request status: ${unauthResponse.status} (expected 401/403)\n`);
        
        // Show what the admin API endpoint expects
        console.log('📝 Admin API requires:');
        console.log('   - Path: /api/admin/users');
        console.log('   - Method: GET');
        console.log('   - Header: Authorization: Bearer <firebase-id-token>');
        console.log('   - Group membership: admin or super_admin\n');
        
        console.log('💡 To test with authentication, sign in through the web interface first.');
        console.log('   The admin page should automatically make authenticated requests.');
        
    } catch (error) {
        console.error('❌ Error testing admin API:', error.message);
    }
}

testAdminAPI().then(() => {
    console.log('\n✅ Admin API test completed');
}).catch(error => {
    console.error('❌ Test failed:', error);
});