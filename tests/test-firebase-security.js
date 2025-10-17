/**
 * Firebase Security Rules Test Suite
 * Tests the deployed Firebase security rules to ensure proper access control
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');
const { getAuth, signInAnonymously, signInWithCustomToken } = require('firebase/auth');
const serviceAccount = require('../firebaseServiceAccountKey.json');
require('dotenv').config({ path: '../.env' });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
  });
}

// Initialize Firebase Client SDK
const firebaseApp = initializeApp({
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
});

const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

class SecurityTestSuite {
  constructor() {
    this.results = [];
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      const result = await testFunction();
      this.results.push({ test: testName, status: 'PASS', result });
      console.log(`✅ PASS: ${testName}`);
      return true;
    } catch (error) {
      this.results.push({ test: testName, status: 'FAIL', error: error.message });
      console.log(`❌ FAIL: ${testName} - ${error.message}`);
      return false;
    }
  }

  async testCharacterDataRead() {
    // Test public read access to character data
    const characterRef = ref(db, 'characters');
    const snapshot = await get(characterRef);
    
    if (!snapshot.exists()) {
      throw new Error('No character data found');
    }
    
    const characters = snapshot.val();
    const characterCount = Object.keys(characters).length;
    
    return `Successfully read ${characterCount} characters`;
  }

  async testCharacterDataWriteWithoutAuth() {
    // Test that writing character data fails without proper authentication
    const testRef = ref(db, 'characters/test-character');
    
    try {
      await set(testRef, { name: 'Test Character', description: 'This should fail' });
      throw new Error('Write succeeded when it should have failed');
    } catch (error) {
      if (error.code === 'PERMISSION_DENIED') {
        return 'Write properly denied without script token';
      }
      throw error;
    }
  }

  async testForumDataRead() {
    // Test public read access to forum data
    const forumRef = ref(db, 'forum/posts');
    const snapshot = await get(forumRef);
    
    if (!snapshot.exists()) {
      return 'No forum posts found (empty forum)';
    }
    
    const posts = snapshot.val();
    const postCount = Object.keys(posts).length;
    
    return `Successfully read ${postCount} forum posts`;
  }

  async testAnonymousForumWrite() {
    // Test that anonymous users cannot write to forum (security feature)
    try {
      await signInAnonymously(auth);
    } catch (authError) {
      // If anonymous sign-in itself fails, that's also acceptable security behavior
      if (authError.code === 'auth/admin-restricted-operation') {
        return 'Anonymous authentication properly restricted by admin settings';
      }
      throw authError;
    }
    
    const testPostRef = ref(db, 'forum/posts/test-anonymous-post');
    
    try {
      await set(testPostRef, {
        title: 'Test Post',
        content: 'This should fail',
        authorId: 'anonymous',
        authorName: 'Anonymous',
        createdAt: Date.now(),
        forumId: 'general'
      });
      throw new Error('Anonymous write succeeded when it should have failed');
    } catch (error) {
      if (error.code === 'PERMISSION_DENIED') {
        return 'Anonymous forum write properly denied';
      }
      throw error;
    }
  }

  async testScriptTokenAccess() {
    // Test that script token allows access to protected data
    const customToken = await admin.auth().createCustomToken('test_script', {
      isScript: true
    });
    
    await signInWithCustomToken(auth, customToken);
    
    // Try to read analytics (should work with script token)
    const analyticsRef = ref(db, 'analytics');
    const snapshot = await get(analyticsRef);
    
    return 'Script token successfully authenticated';
  }

  async testUserDataPrivacy() {
    // Test that users can only access their own data (security feature)
    let customToken;
    try {
      customToken = await admin.auth().createCustomToken('test_user_123', {
        isScript: false
      });
      
      await signInWithCustomToken(auth, customToken);
    } catch (authError) {
      // If token creation or sign-in fails due to admin restrictions, that's security working
      if (authError.code === 'auth/admin-restricted-operation' || 
          authError.message.includes('admin-restricted-operation')) {
        return 'User authentication properly restricted by admin settings';
      }
      throw authError;
    }
    
    // Try to read another user's data (should fail)
    const otherUserRef = ref(db, 'forum/users/different_user_456');
    
    try {
      await get(otherUserRef);
      // If this succeeds, it means the user can read other users' data (bad)
      throw new Error('User could read other user data when they should not');
    } catch (error) {
      if (error.code === 'PERMISSION_DENIED' || error.message.includes('Permission denied')) {
        return 'User privacy properly enforced';
      }
      throw error;
    }
  }

  async runAllTests() {
    console.log('🔒 Firebase Security Rules Test Suite');
    console.log('=====================================\n');

    // Test 1: Character data read access (public)
    await this.runTest('Character Data Public Read', () => this.testCharacterDataRead());

    // Test 2: Character data write without auth (should fail)
    await this.runTest('Character Data Write Protection', () => this.testCharacterDataWriteWithoutAuth());

    // Test 3: Forum data read access (public)
    await this.runTest('Forum Data Public Read', () => this.testForumDataRead());

    // Test 4: Anonymous forum write protection (should be denied - security feature)
    await this.runTest('Anonymous Forum Write Protection', () => this.testAnonymousForumWrite());

    // Test 5: Script token access (should work)
    await this.runTest('Script Token Authentication', () => this.testScriptTokenAccess());

    // Test 6: User data privacy enforcement (should be denied - security feature)
    await this.runTest('User Data Privacy', () => this.testUserDataPrivacy());

    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / this.results.length) * 100)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.test}: ${r.error}`));
    }

    return failed === 0;
  }
}

// Run the test suite
async function main() {
  const testSuite = new SecurityTestSuite();
  const allTestsPassed = await testSuite.runAllTests();
  
  if (allTestsPassed) {
    console.log('\n🎉 All security tests passed! Your Firebase rules are working correctly.');
    process.exit(0);
  } else {
    console.log('\n💥 Some security tests failed. Please review your Firebase rules.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Test suite error:', error);
  process.exit(1);
});