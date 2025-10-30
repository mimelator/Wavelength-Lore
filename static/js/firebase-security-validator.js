/**
 * Client-Side Firebase Security Validation Script
 * 
 * Run this in the browser console to test Firebase client-side operations
 * after security rule changes. Tests all major client-side Firebase functionality.
 */

class FirebaseSecurityValidator {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
  }

  log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: 'ℹ️ ',
      success: '✅',
      warning: '⚠️ ',
      error: '❌'
    };

    console.log(`[${timestamp}] ${prefix[type]} ${message}`);
    
    if (type === 'success') this.testResults.passed++;
    if (type === 'error') {
      this.testResults.failed++;
      this.testResults.errors.push(message);
    }
    if (type === 'warning') this.testResults.warnings++;
  }

  async testFirebaseConnection() {
    this.log('info', '🔍 Testing Firebase Connection...');
    
    try {
      // Check if Firebase is available
      if (typeof firebase === 'undefined' && typeof window.firebase === 'undefined') {
        this.log('error', 'Firebase SDK not loaded');
        return false;
      }
      
      const firebaseApp = window.firebase || firebase;
      this.log('success', 'Firebase SDK loaded successfully');
      
      // Test database connection
      if (window.database || window.testFirebaseDB) {
        this.log('success', 'Firebase Database connection available');
        return true;
      } else {
        this.log('warning', 'Firebase Database connection not found');
        return false;
      }
    } catch (error) {
      this.log('error', `Firebase connection test failed: ${error.message}`);
      return false;
    }
  }

  async testPublicDataAccess() {
    this.log('info', '🔍 Testing Public Data Access...');
    
    const testPaths = [
      { path: 'lore', name: 'Lore Data' },
      { path: 'characters', name: 'Characters Data' },
      { path: 'episodes', name: 'Episodes Data' },
      { path: 'videos', name: 'Videos Data' },
      { path: 'leaderboard', name: 'Leaderboard Data' },
      { path: 'forum/categories', name: 'Forum Categories' },
      { path: 'forum/posts', name: 'Forum Posts' },
      { path: 'forum/replies', name: 'Forum Replies' }
    ];

    for (const { path, name } of testPaths) {
      try {
        const db = window.database || window.testFirebaseDB;
        if (!db) {
          this.log('warning', `Cannot test ${name} - no database connection`);
          continue;
        }

        const ref = window.firebase?.database()?.ref(path) || 
                   window.testFirebaseUtils?.ref(db, path);
        
        if (!ref) {
          this.log('warning', `Cannot create reference for ${name}`);
          continue;
        }

        const snapshot = await (window.testFirebaseUtils?.get(ref) || ref.once('value'));
        
        if (snapshot && (snapshot.exists ? snapshot.exists() : snapshot.val() !== null)) {
          this.log('success', `${name} - Read access working`);
        } else {
          this.log('warning', `${name} - No data found (may be empty)`);
        }
      } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
          this.log('error', `${name} - Permission denied: ${error.message}`);
        } else {
          this.log('warning', `${name} - Read error: ${error.message}`);
        }
      }
    }
  }

  async testProtectedDataAccess() {
    this.log('info', '🔍 Testing Protected Data Access...');
    
    const protectedPaths = [
      { path: 'analytics', name: 'Analytics Data', shouldFail: true },
      { path: 'forum/moderation', name: 'Forum Moderation', shouldFail: true },
      { path: 'users', name: 'Users Root', shouldFail: true }
    ];

    for (const { path, name, shouldFail } of protectedPaths) {
      try {
        const db = window.database || window.testFirebaseDB;
        if (!db) {
          this.log('warning', `Cannot test ${name} - no database connection`);
          continue;
        }

        const ref = window.firebase?.database()?.ref(path) || 
                   window.testFirebaseUtils?.ref(db, path);
        
        const snapshot = await (window.testFirebaseUtils?.get(ref) || ref.once('value'));
        
        if (shouldFail) {
          this.log('error', `${name} - Should be protected but read succeeded`);
        } else {
          this.log('success', `${name} - Read access working as expected`);
        }
      } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
          if (shouldFail) {
            this.log('success', `${name} - Correctly protected (Permission denied)`);
          } else {
            this.log('error', `${name} - Unexpected permission denial: ${error.message}`);
          }
        } else {
          this.log('warning', `${name} - Read error: ${error.message}`);
        }
      }
    }
  }

  async testUserSpecificAccess() {
    this.log('info', '🔍 Testing User-Specific Access...');
    
    // Check if user is authenticated
    const user = window.currentUser || 
                 (window.firebase?.auth?.currentUser) ||
                 (window.auth?.currentUser);
    
    if (!user) {
      this.log('warning', 'No authenticated user - skipping user-specific tests');
      return;
    }

    this.log('info', `Testing with user: ${user.uid || user.id || 'unknown'}`);
    
    const userPaths = [
      { path: `users/${user.uid}/radioPlayerStats`, name: 'User Radio Stats' },
      { path: `users/${user.uid}/gameStats`, name: 'User Game Stats' },
      { path: `users/${user.uid}/radioPlayerFavorites`, name: 'User Favorites (Private)' },
      { path: `forum/users/${user.uid}`, name: 'Forum User Profile' }
    ];

    for (const { path, name } of userPaths) {
      try {
        const db = window.database || window.testFirebaseDB;
        const ref = window.firebase?.database()?.ref(path) || 
                   window.testFirebaseUtils?.ref(db, path);
        
        const snapshot = await (window.testFirebaseUtils?.get(ref) || ref.once('value'));
        this.log('success', `${name} - User access working`);
      } catch (error) {
        if (error.code === 'PERMISSION_DENIED') {
          this.log('warning', `${name} - Permission denied (check auth state)`);
        } else {
          this.log('warning', `${name} - Access error: ${error.message}`);
        }
      }
    }
  }

  async testForumFunctionality() {
    this.log('info', '🔍 Testing Forum Client-Side Functionality...');
    
    // Test forum reading operations
    const forumTests = [
      { 
        selector: '.forum-posts-container', 
        name: 'Forum Posts Container',
        test: () => document.querySelector('.forum-posts-container') !== null
      },
      {
        selector: '.forum-post',
        name: 'Forum Post Elements',
        test: () => document.querySelectorAll('.forum-post').length > 0
      },
      {
        name: 'Forum JavaScript Functionality',
        test: () => typeof window.forumManager !== 'undefined' || 
                   typeof window.loadForumPosts !== 'undefined'
      }
    ];

    for (const test of forumTests) {
      try {
        const result = test.test();
        if (result) {
          this.log('success', `${test.name} - Working`);
        } else {
          this.log('warning', `${test.name} - Not found or not working`);
        }
      } catch (error) {
        this.log('warning', `${test.name} - Test error: ${error.message}`);
      }
    }
  }

  async testLeaderboardFunctionality() {
    this.log('info', '🔍 Testing Leaderboard Client-Side Functionality...');
    
    try {
      // Test if leaderboard data can be loaded
      const db = window.database || window.testFirebaseDB;
      if (db) {
        const leaderboardRef = window.firebase?.database()?.ref('leaderboard') || 
                              window.testFirebaseUtils?.ref(db, 'leaderboard');
        
        const snapshot = await (window.testFirebaseUtils?.get(leaderboardRef) || 
                               leaderboardRef.once('value'));
        
        this.log('success', 'Leaderboard data access - Working');
      } else {
        this.log('warning', 'Leaderboard - Cannot test without database connection');
      }
    } catch (error) {
      if (error.code === 'PERMISSION_DENIED') {
        this.log('error', 'Leaderboard - Permission denied (should be public)');
      } else {
        this.log('warning', `Leaderboard - Error: ${error.message}`);
      }
    }
  }

  generateReport() {
    console.log('\n🔒 Firebase Security Validation Report');
    console.log('=====================================');
    
    const total = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`📊 Results:`);
    console.log(`   ✅ Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.failed}`);
    console.log(`   ⚠️  Warnings: ${this.testResults.warnings}`);
    console.log(`   📈 Success Rate: ${successRate}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log(`\n❌ Critical Issues:`);
      this.testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (this.testResults.failed === 0) {
      console.log(`\n🎉 Client-side Firebase functionality validated successfully!`);
    } else {
      console.log(`\n⚠️  Some client-side tests failed. Review issues above.`);
    }
  }

  async runAllTests() {
    console.log('🔒 Starting Client-Side Firebase Security Validation');
    console.log('==================================================');
    
    try {
      await this.testFirebaseConnection();
      await this.testPublicDataAccess();
      await this.testProtectedDataAccess();
      await this.testUserSpecificAccess();
      await this.testForumFunctionality();
      await this.testLeaderboardFunctionality();
    } catch (error) {
      this.log('error', `Test suite error: ${error.message}`);
    }
    
    this.generateReport();
    return this.testResults;
  }
}

// Create global validator instance
window.firebaseSecurityValidator = new FirebaseSecurityValidator();

// Auto-run if requested
if (typeof AUTO_RUN !== 'undefined' && AUTO_RUN) {
  window.firebaseSecurityValidator.runAllTests();
}

console.log('🔒 Firebase Security Validator loaded!');
console.log('📝 Usage: firebaseSecurityValidator.runAllTests()');
console.log('📋 Or run individual tests:');
console.log('   - firebaseSecurityValidator.testFirebaseConnection()');
console.log('   - firebaseSecurityValidator.testPublicDataAccess()');
console.log('   - firebaseSecurityValidator.testProtectedDataAccess()'); 
console.log('   - firebaseSecurityValidator.testUserSpecificAccess()');
console.log('   - firebaseSecurityValidator.testForumFunctionality()');
console.log('   - firebaseSecurityValidator.testLeaderboardFunctionality()');