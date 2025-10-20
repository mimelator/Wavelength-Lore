#!/usr/bin/env node

/**
 * Quick User Group Assignment Script
 * Add users to groups directly via Firebase Admin SDK
 */

const { updateDataAsAdmin, fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Available groups in the system
const AVAILABLE_GROUPS = [
  'super_admin',    // Level 100 - Full system access
  'admin',          // Level 90 - High-level system access  
  'moderator',      // Level 70 - Content and user moderation
  'content_manager', // Level 60 - Lore and content management
  'trusted_user',   // Level 50 - Enhanced forum privileges
  'verified_user',  // Level 30 - Basic forum access
  'user',           // Level 10 - Read-only access
  'guest'           // Level 0 - Public content only
];

async function addUserToGroup(userEmail, groupName) {
  try {
    log(`🔍 Adding user ${userEmail} to group ${groupName}...`, 'cyan');
    
    // Validate group
    if (!AVAILABLE_GROUPS.includes(groupName)) {
      log(`❌ Invalid group: ${groupName}`, 'red');
      log(`📋 Available groups: ${AVAILABLE_GROUPS.join(', ')}`, 'blue');
      return false;
    }
    
    // For demo purposes, we'll create a mock UID based on email
    // In production, you'd get this from Firebase Auth
    const uid = 'demo-' + userEmail.replace(/[@.]/g, '-');
    
    // Check if user exists
    let userData = await fetchDataAsAdmin(`forum/users/${uid}`);
    
    if (!userData) {
      // Create new user
      log(`👤 Creating new user: ${userEmail}`, 'yellow');
      userData = {
        uid: uid,
        email: userEmail,
        displayName: userEmail.split('@')[0],
        groups: ['user'], // Default group
        createdAt: new Date().toISOString(),
        isTestUser: true
      };
    }
    
    // Add group if not already present
    const currentGroups = userData.groups || ['user'];
    if (!currentGroups.includes(groupName)) {
      currentGroups.push(groupName);
      userData.groups = currentGroups;
      userData.updatedAt = new Date().toISOString();
      
      // Update in Firebase
      await updateDataAsAdmin(`forum/users/${uid}`, userData);
      
      log(`✅ Successfully added ${userEmail} to group ${groupName}`, 'green');
      log(`📋 User now has groups: [${currentGroups.join(', ')}]`, 'blue');
      return true;
    } else {
      log(`ℹ️  User ${userEmail} already in group ${groupName}`, 'yellow');
      return true;
    }
    
  } catch (error) {
    log(`❌ Error adding user to group: ${error.message}`, 'red');
    return false;
  }
}

async function listUserGroups(userEmail) {
  try {
    const uid = 'demo-' + userEmail.replace(/[@.]/g, '-');
    const userData = await fetchDataAsAdmin(`forum/users/${uid}`);
    
    if (!userData) {
      log(`❌ User not found: ${userEmail}`, 'red');
      return;
    }
    
    log(`👤 User: ${userEmail}`, 'cyan');
    log(`📋 Groups: [${(userData.groups || ['user']).join(', ')}]`, 'blue');
    log(`📅 Last updated: ${userData.updatedAt || 'Never'}`, 'yellow');
    
  } catch (error) {
    log(`❌ Error fetching user: ${error.message}`, 'red');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('🔐 Group Management - Add Users to Groups', 'cyan');
    log('=' .repeat(50), 'blue');
    log('');
    log('Usage examples:', 'yellow');
    log('  node scripts/add-user-to-group.js add user@example.com admin', 'blue');
    log('  node scripts/add-user-to-group.js add dev@test.com moderator', 'blue');
    log('  node scripts/add-user-to-group.js list user@example.com', 'blue');
    log('');
    log('Available groups:', 'yellow');
    AVAILABLE_GROUPS.forEach(group => {
      log(`  • ${group}`, 'blue');
    });
    return;
  }
  
  const [action, userEmail, groupName] = args;
  
  switch (action) {
    case 'add':
      if (!userEmail || !groupName) {
        log('❌ Usage: add <email> <group>', 'red');
        return;
      }
      await addUserToGroup(userEmail, groupName);
      break;
      
    case 'list':
      if (!userEmail) {
        log('❌ Usage: list <email>', 'red');
        return;
      }
      await listUserGroups(userEmail);
      break;
      
    default:
      log(`❌ Unknown action: ${action}`, 'red');
      log('Available actions: add, list', 'yellow');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { addUserToGroup, listUserGroups };