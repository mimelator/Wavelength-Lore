/**
 * Update Firebase Realtime Database Security Rules for Forum
 * This script updates the security rules to allow authenticated users to create posts and replies
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebaseServiceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://wavelength-lore-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Define security rules for the forum - Updated to support all necessary fields
const forumRules = {
    "rules": {
        "lore": {
            ".read": true,
            ".write": "auth != null && auth.token.isScript == true"
        },
        "characters": {
            ".read": true,
            ".write": "auth != null && auth.token.isScript == true"
        },
        "episodes": {
            ".read": true,
            ".write": "auth != null && auth.token.isScript == true"
        },
        "videos": {
            ".read": true,
            ".write": "auth != null && auth.token.isScript == true"
        },
        "forum": {
            "categories": {
                ".read": true,
                ".write": "auth != null && auth.token.isScript == true"
            },
            "posts": {
                ".read": true,
                "$postId": {
                    ".write": "auth != null && (!data.exists() || data.child('authorId').val() == auth.uid)",
                    ".validate": "newData.hasChildren(['title', 'content', 'authorId', 'authorName', 'createdAt', 'forumId'])",
                    "title": {
                        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 200"
                    },
                    "content": {
                        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 10000"
                    },
                    "authorId": {
                        ".validate": "newData.val() == auth.uid"
                    },
                    "authorName": {
                        ".validate": "newData.isString() && newData.val().length > 0"
                    },
                    "forumId": {
                        ".validate": "newData.isString() && (newData.val() == 'general' || newData.val() == 'lore' || newData.val() == 'episodes' || newData.val() == 'fanart')"
                    },
                    "type": {
                        ".validate": "newData.isString() && (newData.val() == 'discussion' || newData.val() == 'question' || newData.val() == 'theory' || newData.val() == 'fanart' || newData.val() == 'news')"
                    },
                    "tags": {
                        ".validate": "newData.hasChildren()"
                    },
                    "createdAt": {
                        ".validate": "newData.val() <= now"
                    },
                    "updatedAt": {
                        ".validate": "newData.val() <= now"
                    },
                    "likes": {
                        "$userId": {
                            ".write": "auth != null && $userId == auth.uid",
                            ".validate": "newData.val() == true"
                        }
                    },
                    "likeCount": {
                        ".validate": "newData.isNumber() && newData.val() >= 0"
                    },
                    "replyCount": {
                        ".validate": "newData.isNumber() && newData.val() >= 0"
                    },
                    "viewCount": {
                        ".validate": "newData.isNumber() && newData.val() >= 0"
                    }
                }
            },
            "replies": {
                ".read": true,
                "$replyId": {
                    ".write": "auth != null && (!data.exists() || data.child('authorId').val() == auth.uid)",
                    ".validate": "newData.hasChildren(['content', 'postId', 'authorId', 'authorName', 'createdAt'])",
                    "content": {
                        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 5000"
                    },
                    "postId": {
                        ".validate": "newData.isString() && newData.val().length > 0"
                    },
                    "authorId": {
                        ".validate": "newData.val() == auth.uid"
                    },
                    "authorName": {
                        ".validate": "newData.isString() && newData.val().length > 0"
                    },
                    "createdAt": {
                        ".validate": "newData.val() <= now"
                    },
                    "likes": {
                        "$userId": {
                            ".write": "auth != null && $userId == auth.uid",
                            ".validate": "newData.val() == true"
                        }
                    },
                    "likeCount": {
                        ".validate": "newData.isNumber() && newData.val() >= 0"
                    }
                }
            },
            "users": {
                "$userId": {
                    ".read": "auth != null && (auth.uid == $userId || auth.token.isScript == true)",
                    ".write": "auth != null && (auth.uid == $userId || auth.token.isScript == true)",
                    "displayName": {
                        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 50"
                    },
                    "name": {
                        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
                    },
                    "email": {
                        ".validate": "newData.isString() && newData.val().matches(/^[^@]+@[^@]+\\.[^@]+$/)"
                    },
                    "avatar": {
                        ".validate": "newData.isString()"
                    },
                    "bio": {
                        ".validate": "newData.isString() && newData.val().length <= 500"
                    },
                    "joinedAt": {
                        ".validate": "newData.val() <= now"
                    },
                    "joinDate": {
                        ".validate": "newData.val() <= now"
                    },
                    "lastActive": {
                        ".validate": "newData.val() <= now"
                    },
                    "lastSeen": {
                        ".validate": "newData.val() <= now"
                    },
                    "lastLogin": {
                        ".validate": "newData.isString()"
                    },
                    "groups": {
                        ".validate": "newData.hasChildren()"
                    },
                    "postCount": {
                        ".validate": "newData.isNumber() && newData.val() >= 0"
                    },
                    "replyCount": {
                        ".validate": "newData.isNumber() && newData.val() >= 0"
                    },
                    "updatedAt": {
                        ".validate": "newData.isString()"
                    },
                    "lastUpdatedBy": {
                        ".validate": "newData.isString()"
                    }
                }
            },
            "settings": {
                ".read": true,
                ".write": "auth != null && auth.token.isScript == true"
            },
            "moderation": {
                ".read": "auth != null && auth.token.isScript == true",
                ".write": "auth != null && auth.token.isScript == true"
            }
        },
        "analytics": {
            ".read": "auth != null && auth.token.isScript == true",
            ".write": "auth != null && auth.token.isScript == true"
        }
    }
};

async function updateFirebaseRules() {
    try {
        console.log('🔧 Generating Firebase Realtime Database security rules...');
        
        console.log('\n📋 Firebase Security Rules to Apply:');
        console.log('============================================');
        console.log(JSON.stringify(forumRules, null, 2));
        console.log('============================================\n');
        
        console.log('🚨 IMPORTANT: Due to Firebase security, rules must be updated manually:');
        console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
        console.log('2. Select your "wavelength-lore" project');
        console.log('3. Navigate to "Realtime Database" > "Rules"');
        console.log('4. Replace the existing rules with the rules shown above');
        console.log('5. Click "Publish" to apply the new rules\n');
        
        // For development, we can also create a temporary rules file
        const fs = require('fs');
        fs.writeFileSync('./firebase-database-rules.json', JSON.stringify(forumRules, null, 2));
        console.log('💾 Rules have been saved to: firebase-database-rules.json');
        console.log('📁 You can also import this file directly in Firebase Console\n');
        
        // Alternative: Set rules for development (less secure but functional)
        console.log('🔓 TEMPORARY DEVELOPMENT SOLUTION:');
        console.log('For immediate testing, you can use these simplified rules:');
        
        const devRules = {
            "rules": {
                ".read": true,
                ".write": "auth != null"
            }
        };
        
        console.log(JSON.stringify(devRules, null, 2));
        console.log('\n⚠️  WARNING: These development rules are not secure for production!');
        
        console.log('\n✅ Firebase rules update process completed!');
        console.log('🔧 Apply the rules manually in Firebase Console to enable forum functionality.');
        
    } catch (error) {
        console.error('❌ Error updating Firebase rules:', error);
        process.exit(1);
    }
}

// Run the update
updateFirebaseRules().then(() => {
    console.log('\n🎉 Rules update process finished!');
    process.exit(0);
});