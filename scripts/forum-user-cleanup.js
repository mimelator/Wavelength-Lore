#!/usr/bin/env node

/**
 * Forum User Cleanup & Character Registration System
 * Clean test users and register Lore characters as forum users
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

class ForumUserManager {
    constructor() {
        this.db = null;
    }

    async initialize() {
        this.db = getAdminDatabase();
        if (!this.db) {
            throw new Error('Firebase admin not initialized');
        }
    }

    async listAllUsers() {
        const snapshot = await this.db.ref('forum/users').once('value');
        const users = snapshot.val() || {};
        
        console.log('📋 Current Forum Users:');
        Object.entries(users).forEach(([uid, user]) => {
            console.log(`  • ${uid}: ${user.displayName || user.name} (${user.email})`);
        });
        
        return users;
    }

    async deleteTestUsers() {
        const users = await this.listAllUsers();
        const testUserPatterns = [
            'test',
            'demo', 
            'example',
            'ai-ranger-thorne',
            'ai-healer-mira'
        ];

        let deletedCount = 0;
        
        for (const [uid, user] of Object.entries(users)) {
            const userName = (user.displayName || user.name || '').toLowerCase();
            const userEmail = (user.email || '').toLowerCase();
            
            const isTestUser = testUserPatterns.some(pattern => 
                userName.includes(pattern) || userEmail.includes(pattern) || uid.includes(pattern)
            );
            
            if (isTestUser) {
                console.log(`🗑️  Deleting test user: ${user.displayName || user.name} (${uid})`);
                await this.db.ref(`forum/users/${uid}`).remove();
                deletedCount++;
            }
        }
        
        console.log(`✅ Deleted ${deletedCount} test users`);
        return deletedCount;
    }

    async registerCharacterUser(characterData) {
        const characterId = `char_${characterData.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        const userData = {
            uid: characterId,
            displayName: characterData.name,
            email: `${characterId}@wavelength-lore.com`,
            avatar: characterData.avatar || '/icons/character-icon.svg',
            bio: characterData.bio || `I am ${characterData.name} from the Wavelength universe.`,
            joinedAt: Date.now(),
            postCount: 0,
            replyCount: 0,
            isCharacter: true,
            characterType: characterData.type || 'lore',
            characterRole: characterData.role || 'community_member',
            characterTraits: characterData.traits || [],
            characterLocation: characterData.location || 'Unknown',
            lastActive: Date.now()
        };

        await this.db.ref(`forum/users/${characterId}`).set(userData);
        console.log(`🎭 Registered character: ${characterData.name} (${characterId})`);
        
        return { characterId, userData };
    }

    async createCharacterPost(characterId, postData) {
        const postRef = this.db.ref('forum/posts').push();
        const postId = postRef.key;
        
        const character = await this.db.ref(`forum/users/${characterId}`).once('value');
        const characterData = character.val();
        
        if (!characterData) {
            throw new Error(`Character ${characterId} not found`);
        }

        const post = {
            id: postId,
            forumId: postData.category || 'general',
            title: postData.title,
            content: postData.content,
            authorId: characterId,
            authorName: characterData.displayName,
            authorAvatar: characterData.avatar,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            replyCount: 0,
            likes: 0,
            likedBy: {},
            isPinned: postData.isPinned || false,
            isLocked: false,
            tags: postData.tags || [],
            type: postData.type || 'roleplay',
            status: 'published',
            isCharacterPost: true,
            characterType: characterData.characterType
        };

        await postRef.set(post);
        
        // Update character post count
        await this.db.ref(`forum/users/${characterId}/postCount`).set((characterData.postCount || 0) + 1);
        
        console.log(`📝 Created character post: "${postData.title}" by ${characterData.displayName}`);
        return { postId, post };
    }
}

// CLI Interface
async function main() {
    const manager = new ForumUserManager();
    await manager.initialize();
    
    const action = process.argv[2];
    
    switch (action) {
        case 'list':
            await manager.listAllUsers();
            break;
            
        case 'cleanup':
            await manager.deleteTestUsers();
            break;
            
        case 'register-character':
            const characterName = process.argv[3];
            if (!characterName) {
                console.log('Usage: node forum-user-cleanup.js register-character "Character Name"');
                process.exit(1);
            }
            
            const characterData = {
                name: characterName,
                type: 'lore',
                role: 'community_member',
                bio: `Greetings! I am ${characterName} from the Wavelength universe. I'm here to share stories and connect with fellow travelers.`,
                traits: ['mysterious', 'wise', 'friendly'],
                location: 'The Wavelength Realm'
            };
            
            await manager.registerCharacterUser(characterData);
            break;
            
        case 'demo-characters':
            // Register some demo Lore characters
            const demoCharacters = [
                {
                    name: 'Lyra Stormweaver',
                    type: 'lore',
                    role: 'mage',
                    bio: 'A powerful storm mage who controls the winds and lightning. I seek to understand the deeper mysteries of the Wavelength.',
                    traits: ['powerful', 'curious', 'elemental'],
                    location: 'Storm Peak Observatory',
                    avatar: '/icons/mage-icon.svg'
                },
                {
                    name: 'Finn Shadowstep',
                    type: 'lore', 
                    role: 'rogue',
                    bio: 'A nimble scout who moves through shadows. I gather information and protect travelers from hidden dangers.',
                    traits: ['stealthy', 'observant', 'protective'],
                    location: 'The Hidden Paths',
                    avatar: '/icons/rogue-icon.svg'
                },
                {
                    name: 'Elder Sage Meridian',
                    type: 'lore',
                    role: 'scholar',
                    bio: 'Keeper of ancient knowledge and lore. I have studied the Wavelength for centuries and share wisdom with those who seek it.',
                    traits: ['wise', 'ancient', 'knowledgeable'],
                    location: 'The Great Library',
                    avatar: '/icons/sage-icon.svg'
                }
            ];
            
            for (const char of demoCharacters) {
                await manager.registerCharacterUser(char);
            }
            break;
            
        case 'create-character-posts':
            // Create sample posts from characters
            const posts = [
                {
                    characterId: 'char_lyra_stormweaver',
                    postData: {
                        title: 'The Storm Approaches - A Vision of Change',
                        content: `Fellow seekers of the Wavelength,

I have witnessed something extraordinary in my meditations atop Storm Peak. The very fabric of our reality seems to be shifting, and I sense great changes approaching our realm.

⚡ The lightning speaks of new energies gathering
🌪️ The winds carry whispers of distant lands
🔮 My scrying crystals show visions of heroes yet to come

Has anyone else felt these disturbances? I believe the Wavelength is calling to us, preparing us for something momentous.

Stay vigilant, friends. The storm brings both danger and opportunity.

- Lyra Stormweaver`,
                        category: 'lore',
                        tags: ['prophecy', 'visions', 'storm-magic', 'wavelength'],
                        type: 'theory'
                    }
                },
                {
                    characterId: 'char_finn_shadowstep',
                    postData: {
                        title: 'Safe Passage Routes - Updated Intelligence',
                        content: `Greetings, travelers!

I've just returned from scouting the eastern territories and have important updates on safe passage routes:

🛡️ **SAFE ROUTES:**
- Northern Pass: Clear of bandits, watch for ice wolves
- River Road: Merchants report smooth travel, bridge repairs complete
- Forest Trail: New waystation established at Moonwell Clearing

⚠️ **AVOID THESE AREAS:**
- Southern Marshlands: Strange mists causing disorientation
- Old Mine Road: Collapsed tunnel, seek alternate route
- Darkwood Crossing: Unusual creature activity reported

Travel in groups when possible, and trust your instincts. The shadows have been restless lately.

Safe journeys,
- Finn Shadowstep`,
                        category: 'general',
                        tags: ['travel', 'safety', 'routes', 'scouting'],
                        type: 'discussion'
                    }
                }
            ];
            
            for (const { characterId, postData } of posts) {
                try {
                    await manager.createCharacterPost(characterId, postData);
                } catch (error) {
                    console.log(`⚠️  Could not create post for ${characterId}: ${error.message}`);
                }
            }
            break;
            
        default:
            console.log(`
🎭 Forum User & Character Management

Usage:
  node forum-user-cleanup.js <action>

Actions:
  list                    - List all current forum users
  cleanup                 - Delete test users
  register-character "Name" - Register a single character
  demo-characters         - Register demo Lore characters
  create-character-posts  - Create sample posts from characters

Examples:
  node forum-user-cleanup.js cleanup
  node forum-user-cleanup.js demo-characters
  node forum-user-cleanup.js register-character "Aria Moonwhisper"
            `);
    }
    
    process.exit(0);
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error:', error.message);
        process.exit(1);
    });
}

module.exports = ForumUserManager;