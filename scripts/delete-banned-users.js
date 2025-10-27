#!/usr/bin/env node

/**
 * Delete Banned Users Script
 * 
 * Identifies and removes users with 'banned' role from Firebase
 * Includes safety checks and detailed logging
 */

const admin = require('firebase-admin');
const { 
  getAdminDatabase, 
  initializeFirebaseAdmin,
  isFirebaseAdminReady,
  fetchDataAsAdmin,
  deleteDataAsAdmin 
} = require('../helpers/firebase-admin-utils');

class BannedUserCleaner {
  constructor() {
    this.db = null;
    this.deletedUsers = [];
    this.errors = [];
  }

  async initialize() {
    console.log('🔥 Initializing Firebase Admin...');
    if (!isFirebaseAdminReady()) {
      initializeFirebaseAdmin();
    }
    
    this.db = getAdminDatabase();
    if (!this.db) {
      throw new Error('Failed to initialize Firebase Admin');
    }
    console.log('✅ Firebase Admin initialized successfully');
  }

  /**
   * Find all banned users in the system
   */
  async findBannedUsers() {
    console.log('\n🔍 Scanning for banned users...');
    
    const users = await fetchDataAsAdmin('forum/users');
    if (!users) {
      console.log('❌ No users found in database');
      return [];
    }

    const bannedUsers = [];
    let totalUsers = 0;

    Object.entries(users).forEach(([uid, userData]) => {
      totalUsers++;
      if (userData.role === 'banned') {
        bannedUsers.push({
          uid,
          displayName: userData.displayName || userData.name || 'Unknown',
          email: userData.email || 'No email',
          role: userData.role,
          createdAt: userData.createdAt || 'Unknown',
          groups: userData.groups || [],
          isTestUser: userData.isTestUser || false
        });
      }
    });

    console.log(`📊 Scanned ${totalUsers} total users`);
    console.log(`🚫 Found ${bannedUsers.length} banned users`);

    if (bannedUsers.length > 0) {
      console.log('\n📋 Banned Users List:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      bannedUsers.forEach((user, index) => {
        console.log(`${index + 1}. 👤 ${user.displayName} (${user.uid})`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🚫 Role: ${user.role}`);
        console.log(`   📅 Created: ${user.createdAt}`);
        console.log(`   🏷️  Groups: [${user.groups.join(', ')}]`);
        console.log(`   🧪 Test User: ${user.isTestUser ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    return bannedUsers;
  }

  /**
   * Delete a banned user and their associated data
   */
  async deleteBannedUser(user) {
    console.log(`🗑️  Deleting banned user: ${user.displayName} (${user.uid})`);
    
    try {
      // Delete user record from forum/users
      await deleteDataAsAdmin(`forum/users/${user.uid}`);
      
      // Check and delete user's posts if any
      const posts = await fetchDataAsAdmin('forum/posts');
      if (posts) {
        const userPosts = Object.entries(posts).filter(([_, post]) => post.authorId === user.uid);
        for (const [postId, post] of userPosts) {
          console.log(`  📝 Deleting post: "${post.title}"`);
          await deleteDataAsAdmin(`forum/posts/${postId}`);
        }
      }

      // Check and delete user's replies if any
      const replies = await fetchDataAsAdmin('forum/replies');
      if (replies) {
        const userReplies = Object.entries(replies).filter(([_, reply]) => reply.authorId === user.uid);
        for (const [replyId, reply] of userReplies) {
          console.log(`  💬 Deleting reply by user`);
          await deleteDataAsAdmin(`forum/replies/${replyId}`);
        }
      }

      // Delete user's gallery bookmarks if any
      try {
        await deleteDataAsAdmin(`users/${user.uid}/gallery`);
        console.log(`  🖼️  Deleted gallery data`);
      } catch (error) {
        // Gallery data might not exist, which is fine
      }

      // Delete user's merchandise products if any
      try {
        await deleteDataAsAdmin(`merchandise/userProducts/${user.uid}`);
        console.log(`  🛍️  Deleted merchandise data`);
      } catch (error) {
        // Merchandise data might not exist, which is fine
      }

      this.deletedUsers.push(user);
      console.log(`✅ Successfully deleted banned user: ${user.displayName}`);
      
    } catch (error) {
      const errorMsg = `Failed to delete user ${user.displayName}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Delete all banned users
   */
  async deleteAllBannedUsers(bannedUsers, options = {}) {
    if (bannedUsers.length === 0) {
      console.log('✅ No banned users found to delete');
      return;
    }

    console.log(`\n🚨 PREPARING TO DELETE ${bannedUsers.length} BANNED USERS`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Safety confirmation unless forced
    if (!options.force) {
      console.log('\n⚠️  WARNING: This action cannot be undone!');
      console.log('This will permanently delete all banned users and their associated data:');
      console.log('• User accounts');
      console.log('• User posts and replies');
      console.log('• User gallery bookmarks');
      console.log('• User merchandise products');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('\nType "DELETE" to confirm (or anything else to cancel): ', resolve);
      });
      rl.close();

      if (answer !== 'DELETE') {
        console.log('❌ Operation cancelled by user');
        return;
      }
    }

    console.log('\n🚀 Starting deletion process...');
    
    for (let i = 0; i < bannedUsers.length; i++) {
      const user = bannedUsers[i];
      console.log(`\n[${i + 1}/${bannedUsers.length}] Processing ${user.displayName}...`);
      await this.deleteBannedUser(user);
      
      // Small delay to avoid overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n📊 DELETION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully deleted: ${this.deletedUsers.length} users`);
    console.log(`❌ Errors encountered: ${this.errors.length} users`);
    
    if (this.deletedUsers.length > 0) {
      console.log('\n✅ DELETED USERS:');
      this.deletedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.displayName} (${user.uid})`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
  }

  /**
   * Run the complete banned user deletion process
   */
  async run(options = {}) {
    try {
      await this.initialize();
      
      const bannedUsers = await this.findBannedUsers();
      
      if (bannedUsers.length === 0) {
        console.log('\n🎉 No banned users found! Your system is clean.');
        return;
      }

      await this.deleteAllBannedUsers(bannedUsers, options);
      
      console.log('\n🎉 Banned user cleanup completed!');
      
    } catch (error) {
      console.error('💥 Fatal error during banned user cleanup:', error);
      throw error;
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force') || args.includes('-f'),
    dryRun: args.includes('--dry-run') || args.includes('-d'),
  };

  console.log('🌊 WAVELENGTH BANNED USER DELETION TOOL');
  console.log('═══════════════════════════════════════════════════════════════════════════════════');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No deletions will be performed');
  }

  const cleaner = new BannedUserCleaner();
  
  try {
    if (options.dryRun) {
      // Only scan and display, don't delete
      await cleaner.initialize();
      const bannedUsers = await cleaner.findBannedUsers();
      
      if (bannedUsers.length > 0) {
        console.log(`\n🚨 DRY RUN: Would delete ${bannedUsers.length} banned users`);
        console.log('Run without --dry-run to perform actual deletions');
      } else {
        console.log('\n🎉 No banned users found!');
      }
    } else {
      await cleaner.run(options);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🌊 Wavelength Banned User Deletion Tool

USAGE:
  node scripts/delete-banned-users.js [options]

OPTIONS:
  --dry-run, -d    Scan for banned users but don't delete them
  --force, -f      Skip confirmation prompt
  --help, -h       Show this help message

EXAMPLES:
  node scripts/delete-banned-users.js --dry-run    # Safe scan only
  node scripts/delete-banned-users.js              # Interactive deletion
  node scripts/delete-banned-users.js --force      # Auto-confirm deletion

WHAT IT DELETES:
  • User accounts with role: 'banned'
  • Their forum posts and replies
  • Their gallery bookmarks
  • Their merchandise products

⚠️  WARNING: This action cannot be undone!
`);
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = BannedUserCleaner;