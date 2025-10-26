#!/usr/bin/env node

/**
 * Character Forum System Test Suite
 * Comprehensive testing for Lore character registration and forum interaction
 */

const ForumUserManager = require('./forum-user-cleanup');

class CharacterForumTester {
    constructor() {
        this.manager = new ForumUserManager();
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async test(name, testFn) {
        try {
            console.log(`🧪 Testing: ${name}`);
            await testFn();
            this.testResults.passed++;
            this.testResults.tests.push({ name, status: 'PASS' });
            console.log(`✅ PASS: ${name}`);
        } catch (error) {
            this.testResults.failed++;
            this.testResults.tests.push({ name, status: 'FAIL', error: error.message });
            console.log(`❌ FAIL: ${name} - ${error.message}`);
        }
    }

    async runAllTests() {
        console.log('🎭 Starting Character Forum System Tests...\n');
        
        await this.manager.initialize();

        // Test 1: Register a new character
        await this.test('Register New Lore Character', async () => {
            const characterData = {
                name: 'Aria Moonwhisper',
                type: 'lore',
                role: 'bard',
                bio: 'A traveling bard who weaves magic through music and stories. I collect tales from across the Wavelength realm.',
                traits: ['musical', 'storyteller', 'charismatic'],
                location: 'The Wandering Roads',
                avatar: '/icons/bard-icon.svg'
            };

            const result = await this.manager.registerCharacterUser(characterData);
            if (!result.characterId.includes('aria_moonwhisper')) {
                throw new Error('Character ID not generated correctly');
            }
            if (!result.userData.isCharacter) {
                throw new Error('Character flag not set');
            }
        });

        // Test 2: Create character post
        await this.test('Create Character Post', async () => {
            const postData = {
                title: 'Songs of the Ancient Wavelength',
                content: `Greetings, fellow travelers!

I have just returned from the far reaches of our realm, where I discovered an ancient melody that seems to resonate with the very essence of the Wavelength itself.

🎵 The song speaks of:
- Origins lost to time
- Heroes who shaped our world  
- Mysteries yet to be uncovered
- The eternal dance of light and shadow

I would love to perform this piece at our next gathering. Has anyone else encountered music that seems to channel the Wavelength's power?

May your journeys be filled with wonder,
- Aria Moonwhisper`,
                category: 'lore',
                tags: ['music', 'ancient-lore', 'wavelength-mysteries', 'performance'],
                type: 'story'
            };

            const result = await this.manager.createCharacterPost('char_aria_moonwhisper', postData);
            if (!result.postId) {
                throw new Error('Post ID not generated');
            }
            if (!result.post.isCharacterPost) {
                throw new Error('Character post flag not set');
            }
        });

        // Test 3: Verify character appears in user list
        await this.test('Character Appears in User List', async () => {
            const users = await this.manager.listAllUsers();
            const ariaExists = Object.values(users).some(user => 
                user.displayName === 'Aria Moonwhisper' && user.isCharacter
            );
            if (!ariaExists) {
                throw new Error('Character not found in user list');
            }
        });

        // Test 4: Register multiple character types
        await this.test('Register Multiple Character Types', async () => {
            const characters = [
                {
                    name: 'Captain Thorne Ironbeard',
                    role: 'warrior',
                    bio: 'A seasoned warrior who has defended the realm for decades. My sword and shield are at the service of all who seek justice.',
                    traits: ['brave', 'honorable', 'protective'],
                    location: 'The Iron Citadel'
                },
                {
                    name: 'Whisper the Healer',
                    role: 'healer',
                    bio: 'A gentle soul who tends to the wounded and weary. I believe in the power of compassion to heal both body and spirit.',
                    traits: ['compassionate', 'wise', 'gentle'],
                    location: 'The Sanctuary of Light'
                }
            ];

            for (const char of characters) {
                const result = await this.manager.registerCharacterUser(char);
                if (!result.userData.isCharacter) {
                    throw new Error(`Character flag not set for ${char.name}`);
                }
            }
        });

        // Test 5: Create conversation between characters
        await this.test('Create Multi-Character Conversation', async () => {
            // Create initial post by Captain Thorne
            const conversationPost = {
                title: 'Preparing for the Autumn Festival - All Hands Needed!',
                content: `Fellow citizens of the Wavelength realm,

The Autumn Festival approaches, and we need all hands to ensure it's a celebration worthy of our community!

🛡️ **Security Preparations:**
- Patrol routes need to be established
- Festival grounds must be secured
- Emergency protocols reviewed

I'm calling upon all able-bodied defenders to volunteer. But this isn't just about security - we need everyone's unique talents!

@Aria Moonwhisper - Your musical talents would be perfect for the opening ceremony
@Whisper the Healer - We'll need medical support for the festivities
@Lyra Stormweaver - Perhaps you could provide weather protection?

What say you all? How can we make this festival unforgettable?

For the realm!
- Captain Thorne Ironbeard`,
                category: 'general',
                tags: ['autumn-festival', 'community', 'collaboration', 'celebration'],
                type: 'discussion'
            };

            const result = await this.manager.createCharacterPost('char_captain_thorne_ironbeard', conversationPost);
            if (!result.post.content.includes('@Aria Moonwhisper')) {
                throw new Error('Character mentions not preserved');
            }
        });

        // Test 6: Character post statistics
        await this.test('Character Post Statistics', async () => {
            const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
            const db = getAdminDatabase();
            
            const postsSnapshot = await db.ref('forum/posts').once('value');
            const posts = postsSnapshot.val() || {};
            
            const characterPosts = Object.values(posts).filter(post => post.isCharacterPost);
            if (characterPosts.length < 3) {
                throw new Error(`Expected at least 3 character posts, found ${characterPosts.length}`);
            }

            const uniqueCharacters = new Set(characterPosts.map(post => post.authorName));
            if (uniqueCharacters.size < 3) {
                throw new Error(`Expected posts from at least 3 characters, found ${uniqueCharacters.size}`);
            }
        });

        this.printResults();
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🎭 CHARACTER FORUM SYSTEM TEST RESULTS');
        console.log('='.repeat(60));
        
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.tests
                .filter(test => test.status === 'FAIL')
                .forEach(test => {
                    console.log(`   • ${test.name}: ${test.error}`);
                });
        }
        
        console.log('\n🎯 CHARACTER SYSTEM ASSESSMENT:');
        const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100;
        
        if (successRate >= 95) {
            console.log('🟢 EXCELLENT - Character system is ready for production!');
            console.log('🎭 Lore characters can now participate in forum discussions');
            console.log('🤖 Ready for AI-driven character interactions');
        } else if (successRate >= 85) {
            console.log('🟡 GOOD - Character system mostly functional, minor issues to address');
        } else {
            console.log('🔴 NEEDS WORK - Character system requires fixes before use');
        }
        
        console.log('\n🚀 NEXT STEPS:');
        if (this.testResults.failed === 0) {
            console.log('   • Character system fully validated!');
            console.log('   • Begin creating character-driven content');
            console.log('   • Use MCP tools for automated character interactions');
            console.log('   • Launch community engagement with Lore characters');
        } else {
            console.log('   • Fix failed tests above');
            console.log('   • Re-run validation suite');
            console.log('   • Ensure 95%+ success rate before launch');
        }
        
        console.log('='.repeat(60));
        
        process.exit(this.testResults.failed > 0 ? 1 : 0);
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new CharacterForumTester();
    tester.runAllTests().catch(error => {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = CharacterForumTester;