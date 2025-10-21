/**
 * Test Cookie Authentication
 * 
 * This script helps diagnose cookie authentication issues by:
 * 1. Checking if cookies are being sent by the browser
 * 2. Verifying if cookieParser middleware is working
 * 3. Testing if Firebase token verification is working
 */

const admin = require('firebase-admin');
const cookieParser = require('cookie-parser');

// Simulate a request with a cookie
function testCookieParsing() {
  console.log('🧪 Testing Cookie Parsing...\n');
  
  // Create a mock request
  const mockReq = {
    headers: {
      cookie: '__session=test-token-123; other_cookie=value'
    }
  };
  
  // Create a mock response
  const mockRes = {};
  
  // Parse cookies manually
  const cookies = {};
  if (mockReq.headers.cookie) {
    mockReq.headers.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
    });
  }
  
  console.log('📋 Parsed cookies:', cookies);
  console.log('🔑 __session cookie:', cookies.__session);
  console.log('');
  
  if (cookies.__session) {
    console.log('✅ Cookie parsing works!');
  } else {
    console.log('❌ Cookie parsing failed!');
  }
}

// Instructions for manual testing
function printInstructions() {
  console.log('\n📖 Manual Testing Instructions:\n');
  console.log('1. Open your browser DevTools (F12)');
  console.log('2. Go to Application > Cookies > http://localhost:3001');
  console.log('3. Check if __session cookie exists');
  console.log('4. If it exists, copy the value');
  console.log('5. Go to Network tab');
  console.log('6. Visit http://localhost:3001/lore');
  console.log('7. Click on the /lore request');
  console.log('8. Check Request Headers section');
  console.log('9. Look for "Cookie: __session=..."');
  console.log('');
  console.log('Expected behavior:');
  console.log('- ✅ __session cookie should exist after sign-in');
  console.log('- ✅ Cookie should be sent with every request');
  console.log('- ✅ Server logs should show "✅ User authenticated"');
  console.log('');
  console.log('If cookie is NOT being sent:');
  console.log('- Check cookie domain (should be localhost)');
  console.log('- Check cookie path (should be /)');
  console.log('- Check SameSite attribute');
  console.log('- Check if cookie expired');
}

// Run tests
console.log('🔍 Cookie Authentication Diagnostics\n');
console.log('='.repeat(50));
testCookieParsing();
printInstructions();
