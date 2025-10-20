/**
 * Simulate the admin page workflow to debug the role issue
 * This script will manually test the admin status and users API calls
 */

require('dotenv').config();
const { initializeFirebaseAdmin, fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');

async function simulateAdminWorkflow() {
    console.log('🔍 Simulating admin page workflow...\n');
    
    try {
        // Initialize Firebase Admin
        console.log('🔥 Initializing Firebase Admin...');
        const db = initializeFirebaseAdmin();
        if (!db) {
            console.log('❌ Failed to initialize Firebase Admin');
            return;
        }
        console.log('✅ Firebase Admin initialized\n');
        
        // Step 1: Check what admin-status API would return
        console.log('1️⃣ Simulating /api/user/admin-status endpoint...');
        const userData = await fetchDataAsAdmin('forum/users/4fdbYxJHjEP4xksk9sgFE3lgYUs2');
        if (userData) {
            const userGroups = userData.groups || [];
            const isAdmin = userGroups.includes('admin') || userGroups.includes('super_admin');
            
            console.log('   📊 Admin status response:', {
                success: true,
                isAdmin,
                groups: userGroups,
                uid: '4fdbYxJHjEP4xksk9sgFE3lgYUs2',
                email: userData.email
            });
        } else {
            console.log('   ❌ User not found');
        }
        
        // Step 2: Simulate the /api/admin/users call  
        console.log('\n2️⃣ Simulating /api/admin/users endpoint...');
        const users = await fetchDataAsAdmin('forum/users');
        
        if (users) {
            console.log(`   ✅ Found ${Object.keys(users).length} users`);
            
            // Process exactly like our fixed admin API
            const userArray = Object.entries(users).map(([uid, userData]) => {
                let role = userData.role || 'user';
                console.log(`   🔍 Processing user ${uid}:`, {
                    email: userData.email,
                    groups: userData.groups,
                    originalRole: userData.role
                });
                
                if (userData.groups) {
                    if (userData.groups.includes('super_admin')) {
                        role = 'super_admin';
                        console.log(`   👑 User ${uid} assigned super_admin role`);
                    } else if (userData.groups.includes('admin')) {
                        role = 'admin';
                        console.log(`   👑 User ${uid} assigned admin role`);
                    } else if (userData.groups.includes('moderator')) {
                        role = 'moderator';
                        console.log(`   🛡️ User ${uid} assigned moderator role`);
                    }
                } else {
                    console.log(`   👤 User ${uid} has no groups, defaulting to user role`);
                }
                
                return {
                    uid,
                    email: userData.email,
                    displayName: userData.displayName || userData.name,
                    avatar: userData.avatar || userData.photoURL,
                    groups: userData.groups,
                    role: role,
                    createdAt: userData.createdAt || new Date().toISOString(),
                    lastActive: userData.lastActive || userData.createdAt || new Date().toISOString(),
                    postCount: userData.postCount || 0,
                    isActive: userData.isActive !== false
                };
            });
            
            console.log('\n   📋 Final user array for admin page:');
            userArray.forEach(user => {
                console.log(`   👤 ${user.email} | Role: ${user.role} | Avatar: ${user.avatar ? 'Present' : 'None'}`);
            });
            
            // Simulate what the admin page should render
            console.log('\n   🎨 What admin page should display:');
            userArray.forEach(user => {
                console.log(`   • ${user.displayName || user.email}`);
                console.log(`     - Role Badge: "${user.role}" with ${user.role === 'admin' ? '👑' : '👤'} icon`);
                console.log(`     - Avatar: ${user.avatar || 'fallback icon'}`);
                console.log(`     - Admin Status: ${user.role === 'admin' || user.role === 'super_admin' ? 'YES ✅' : 'NO ❌'}`);
            });
            
        } else {
            console.log('   ❌ No users found');
        }
        
    } catch (error) {
        console.error('❌ Error in simulation:', error);
    }
}

simulateAdminWorkflow().then(() => {
    console.log('\n✅ Admin workflow simulation completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
});