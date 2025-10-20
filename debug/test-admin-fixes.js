/**
 * Debug script to test admin page fixes
 * Tests both avatar display and role detection
 */

// Load environment first
require('dotenv').config();
const { initializeFirebaseAdmin, fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');

async function testAdminFixes() {
    console.log('🔍 Testing admin page fixes...\n');
    
    try {
        // Initialize Firebase Admin first
        console.log('🔥 Initializing Firebase Admin...');
        const db = initializeFirebaseAdmin();
        
        if (!db) {
            console.log('❌ Failed to initialize Firebase Admin');
            return;
        }
        console.log('✅ Firebase Admin initialized\n');
        
        // Fetch users data
        console.log('📊 Fetching users data from Firebase...');
        const users = await fetchDataAsAdmin('forum/users');
        
        if (!users) {
            console.log('❌ No users found in database');
            return;
        }
        
        console.log(`✅ Found ${Object.keys(users).length} users\n`);
        
        // Process users like the admin API does
        Object.entries(users).forEach(([uid, userData]) => {
            console.log(`👤 User: ${uid}`);
            console.log(`   📧 Email: ${userData.email || 'N/A'}`);
            console.log(`   📛 Display Name: ${userData.displayName || userData.name || 'N/A'}`);
            console.log(`   🖼️  Avatar: ${userData.avatar || userData.photoURL || 'NONE'}`);
            console.log(`   👥 Groups: ${userData.groups ? JSON.stringify(userData.groups) : 'NONE'}`);
            
            // Determine role based on groups (like our fixed admin API)
            let role = userData.role || 'user';
            if (userData.groups) {
                if (userData.groups.includes('super_admin')) {
                    role = 'super_admin';
                } else if (userData.groups.includes('admin')) {
                    role = 'admin';
                } else if (userData.groups.includes('moderator')) {
                    role = 'moderator';
                }
            }
            
            console.log(`   👑 Role: ${role} ${role === 'admin' || role === 'super_admin' ? '(ADMIN!)' : ''}`);
            console.log('   ---');
        });
        
    } catch (error) {
        console.error('❌ Error testing admin fixes:', error);
    }
}

// Run the test
testAdminFixes().then(() => {
    console.log('\n✅ Admin fix test completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});