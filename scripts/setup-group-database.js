#!/usr/bin/env node

/**
 * Group Management Database Setup Script
 * Creates test users with different group assignments for testing
 */

const { fetchDataAsAdmin, updateDataAsAdmin } = require('../helpers/firebase-admin-utils');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test users to create with different group levels
const testUsers = [
  {
    uid: 'test-super-admin-001',
    email: 'superadmin@wavelength.test',
    displayName: 'Super Admin Test User',
    groups: ['super_admin'],
    role: 'super_admin'
  },
  {
    uid: 'test-admin-001',
    email: 'admin@wavelength.test',
    displayName: 'Admin Test User',
    groups: ['admin'],
    role: 'admin'
  },
  {
    uid: 'test-moderator-001',
    email: 'moderator@wavelength.test',
    displayName: 'Moderator Test User',
    groups: ['moderator'],
    role: 'moderator'
  },
  {
    uid: 'test-content-manager-001',
    email: 'content@wavelength.test',
    displayName: 'Content Manager Test User',
    groups: ['content_manager'],
    role: 'content_manager'
  },
  {
    uid: 'test-trusted-user-001',
    email: 'trusted@wavelength.test',
    displayName: 'Trusted User Test User',
    groups: ['trusted_user'],
    role: 'trusted_user'
  },
  {
    uid: 'test-verified-user-001',
    email: 'verified@wavelength.test',
    displayName: 'Verified User Test User',
    groups: ['verified_user'],
    role: 'verified_user'
  },
  {
    uid: 'test-user-001',
    email: 'user@wavelength.test',
    displayName: 'Regular User Test User',
    groups: ['user'],
    role: 'user'
  },
  {
    uid: 'test-multi-group-001',
    email: 'multi@wavelength.test',
    displayName: 'Multi-Group Test User',
    groups: ['moderator', 'content_manager'],
    role: 'moderator'
  }
];

async function initializeFirebaseAdmin() {
  try {
    // Firebase Admin should already be initialized by the helpers
    const admin = require('firebase-admin');
    
    // Test the connection
    const testData = await fetchDataAsAdmin('forum/test');
    log('✅ Firebase Admin connection verified', 'green');
    return true;
  } catch (error) {
    log('❌ Firebase Admin initialization failed:', 'red');
    log(error.message, 'red');
    return false;
  }
}

async function createTestUser(user) {
  try {
    log(`📝 Creating test user: ${user.displayName} (${user.groups.join(', ')})...`, 'cyan');
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      groups: user.groups,
      role: user.role, // Backward compatibility
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTestUser: true, // Mark as test user for easy cleanup
      lastSeen: Date.now()
    };
    
    await updateDataAsAdmin(`forum/users/${user.uid}`, userData);
    log(`✅ Created: ${user.displayName}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to create ${user.displayName}: ${error.message}`, 'red');
    return false;
  }
}

async function checkExistingUsers() {
  try {
    log('🔍 Checking existing users...', 'cyan');
    const users = await fetchDataAsAdmin('forum/users');
    
    if (users) {
      const userCount = Object.keys(users).length;
      log(`📊 Found ${userCount} existing users`, 'blue');
      
      // Show existing users with their groups
      Object.values(users).forEach(user => {
        const groups = user.groups || (user.role ? [user.role] : ['user']);
        log(`  • ${user.displayName || user.email || user.uid}: [${groups.join(', ')}]`, 'blue');
      });
    } else {
      log('📊 No existing users found', 'yellow');
    }
    
    return users;
  } catch (error) {
    log(`❌ Error checking existing users: ${error.message}`, 'red');
    return null;
  }
}

async function createAllTestUsers() {
  log('👥 Creating test users for group management testing...', 'cyan');
  
  let successCount = 0;
  let totalCount = testUsers.length;
  
  for (const user of testUsers) {
    const success = await createTestUser(user);
    if (success) successCount++;
  }
  
  log(`\n📊 Test User Creation Summary:`, 'bright');
  log(`✅ Successfully created: ${successCount}/${totalCount} users`, successCount === totalCount ? 'green' : 'yellow');
  
  return successCount === totalCount;
}

async function verifyTestUsers() {
  log('\n🔍 Verifying created test users...', 'cyan');
  
  let verifiedCount = 0;
  
  for (const user of testUsers) {
    try {
      const userData = await fetchDataAsAdmin(`forum/users/${user.uid}`);
      if (userData && userData.groups) {
        log(`✅ ${user.displayName}: [${userData.groups.join(', ')}]`, 'green');
        verifiedCount++;
      } else {
        log(`❌ ${user.displayName}: Not found or missing groups`, 'red');
      }
    } catch (error) {
      log(`❌ ${user.displayName}: Verification failed`, 'red');
    }
  }
  
  log(`\n📊 Verification Summary: ${verifiedCount}/${testUsers.length} users verified`, 'bright');
  return verifiedCount === testUsers.length;
}

async function generateTestTokens() {
  log('\n🔑 Test Authentication Instructions:', 'bright');
  log('=' .repeat(50), 'bright');
  
  log('\nTo test the group management system APIs, you can use these test user IDs:', 'cyan');
  log('(Note: In a real app, you\'d use Firebase Auth tokens)\n', 'yellow');
  
  testUsers.forEach(user => {
    log(`${user.displayName}:`, 'bright');
    log(`  UID: ${user.uid}`, 'blue');
    log(`  Groups: [${user.groups.join(', ')}]`, 'green');
    log(`  Test command: curl -X GET http://localhost:3001/api/groups/user/${user.uid}`, 'cyan');
    log('');
  });
  
  log('💡 For integration tests, modify the auth middleware to use these test UIDs', 'yellow');
}

async function runDatabaseSetup() {
  try {
    log('🚀 Group Management Database Setup', 'bright');
    log('=' .repeat(40), 'bright');
    
    // Initialize Firebase Admin
    const initialized = await initializeFirebaseAdmin();
    if (!initialized) {
      log('💥 Setup failed: Could not initialize Firebase Admin', 'red');
      process.exit(1);
    }
    
    // Check existing users
    await checkExistingUsers();
    
    // Create test users
    const allCreated = await createAllTestUsers();
    
    // Verify creation
    const allVerified = await verifyTestUsers();
    
    // Generate test instructions
    await generateTestTokens();
    
    if (allCreated && allVerified) {
      log('\n🎉 Database setup completed successfully!', 'green');
      log('\n📋 Next Steps:', 'bright');
      log('  1. Test users have been created with different group levels', 'cyan');
      log('  2. Run the integration tests to verify functionality', 'cyan');
      log('  3. Use the test UIDs for authentication in your tests', 'cyan');
      log('\n🧪 Run tests with: npm test', 'bright');
    } else {
      log('\n⚠️  Setup completed with some issues', 'yellow');
      log('Check the logs above for details', 'yellow');
    }
    
  } catch (error) {
    log(`💥 Unexpected error during setup: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

async function cleanupTestUsers() {
  log('🧹 Cleaning up test users...', 'cyan');
  
  try {
    const users = await fetchDataAsAdmin('forum/users');
    if (users) {
      let cleanedCount = 0;
      
      for (const [uid, userData] of Object.entries(users)) {
        if (userData.isTestUser) {
          try {
            await updateDataAsAdmin(`forum/users/${uid}`, null); // Delete user
            log(`🗑️  Removed test user: ${userData.displayName}`, 'yellow');
            cleanedCount++;
          } catch (error) {
            log(`❌ Failed to remove ${userData.displayName}`, 'red');
          }
        }
      }
      
      log(`✅ Cleaned up ${cleanedCount} test users`, 'green');
    }
  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
  }
}

// CLI interface
if (require.main === module) {
  const action = process.argv[2];
  
  switch (action) {
    case 'cleanup':
      cleanupTestUsers();
      break;
    case 'setup':
    default:
      runDatabaseSetup();
      break;
  }
}

module.exports = {
  runDatabaseSetup,
  cleanupTestUsers,
  testUsers,
  createTestUser,
  verifyTestUsers
};