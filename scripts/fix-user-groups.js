#!/usr/bin/env node
/**
 * Fix User Groups - Add content_manager and admin groups to user
 */

const { fetchDataAsAdmin, updateDataAsAdmin } = require('../helpers/firebase-admin-utils');

async function fixUserGroups() {
  try {
    const uid = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

    console.log('🔍 Checking user groups for:', uid);

    // Fetch current user data
    const userData = await fetchDataAsAdmin(`forum/users/${uid}`);

    if (!userData) {
      console.error('❌ User not found in database');
      return;
    }

    console.log('📋 Current user data:', JSON.stringify(userData, null, 2));

    // Get current groups
    const currentGroups = userData.groups || [];
    console.log('📊 Current groups:', currentGroups);

    // Add required groups
    const requiredGroups = ['admin', 'content_manager'];
    const updatedGroups = [...new Set([...currentGroups, ...requiredGroups])];

    if (JSON.stringify(currentGroups.sort()) === JSON.stringify(updatedGroups.sort())) {
      console.log('✅ User already has all required groups');
      return;
    }

    console.log('🔄 Updating groups to:', updatedGroups);

    const success = await updateDataAsAdmin(`forum/users/${uid}/groups`, updatedGroups);

    if (success) {
      console.log('✅ Groups updated successfully!');
      console.log('📝 New groups:', updatedGroups);
      console.log('\n💡 Please refresh your browser to see the edit buttons');
    } else {
      console.error('❌ Failed to update groups');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixUserGroups().then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = fixUserGroups;
