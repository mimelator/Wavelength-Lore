#!/usr/bin/env node

/**
 * Create "Goblins Beware" Board Demo
 * Creates new forum category, post, and reply for testing
 */

const { getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function createGoblinBoard() {
  console.log('🧌 Creating "Goblins Beware" Board Demo...\n');

  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Firebase admin not initialized');
    }

    // Step 1: Create the new board category
    console.log('📂 Step 1: Creating "Goblins Beware" category...');
    const categoryData = {
      id: 'goblins-beware',
      title: 'Goblins Beware',
      description: 'Discussions about goblin encounters, strategies, and warnings for fellow adventurers',
      color: '#8B4513',
      icon: '🧌',
      iconSvg: '/icons/goblin-icon.svg',
      postCount: 0,
      replyCount: 0,
      createdAt: Date.now()
    };

    await db.ref('forum/categories/goblins-beware').set(categoryData);
    console.log('   ✅ Category "Goblins Beware" created');

    // Step 2: Create a test post
    console.log('\n📝 Step 2: Creating test post...');
    const postId = `goblin_post_${Date.now()}`;
    const postData = {
      id: postId,
      title: 'Goblin King Sighting Near Crystal Caves!',
      content: `⚠️ URGENT WARNING ⚠️

Fellow adventurers, I've just returned from the Crystal Caves and witnessed something extraordinary - and terrifying!

The Goblin King himself was spotted near the eastern entrance, accompanied by what appeared to be his elite guard. They seemed to be searching for something specific, examining the crystal formations with unusual intensity.

🧌 What I observed:
- Goblin King wore a crown of twisted silver and dark gems
- Elite guards carried enchanted weapons that glowed with purple energy  
- They were particularly interested in the largest crystal formation
- Strange magical symbols were being carved into the cave walls

This is highly unusual behavior. The Goblin King rarely ventures from his underground fortress. Whatever he's seeking in those caves must be of immense importance.

⚡ ADVICE FOR TRAVELERS:
- Avoid the Crystal Caves eastern entrance for now
- If you must pass through, travel in groups of 4 or more
- Bring iron weapons - goblins fear cold iron
- Watch for purple glowing lights (sign of goblin magic)

Has anyone else encountered unusual goblin activity recently? We need to share information to keep our community safe!

Stay vigilant, friends. The Wavelength grows stronger, but so do the dangers that seek to corrupt it.

- Ranger Thorne`,
      authorId: 'ai-ranger-thorne',
      authorName: 'Ranger Thorne',
      authorAvatar: '/icons/ranger-icon.svg',
      forumId: 'goblins-beware',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likes: 3,
      replyCount: 1,
      views: 12,
      status: 'published',
      type: 'warning',
      tags: ['goblin-king', 'crystal-caves', 'warning', 'sighting', 'safety'],
      isLocked: false,
      isPinned: true,
      lastActivity: Date.now()
    };

    await db.ref(`forum/posts/${postId}`).set(postData);
    console.log(`   ✅ Post created: "${postData.title}"`);
    console.log(`   🆔 Post ID: ${postId}`);

    // Step 3: Create a reply
    console.log('\n💬 Step 3: Creating test reply...');
    const replyId = `goblin_reply_${Date.now()}`;
    const replyData = {
      id: replyId,
      postId: postId,
      content: `Thank you for this warning, Ranger Thorne! 

I was planning to visit the Crystal Caves tomorrow to gather healing crystals for my village. Your report has likely saved my life - and the lives of my companions.

🔮 Additional Information:
I spoke with a traveling merchant yesterday who mentioned seeing "strange purple lights" near the caves three nights ago. He thought it was just unusual crystal resonance, but your report confirms something more sinister.

The fact that the Goblin King is personally involved suggests this isn't a random raid. In the old lore, it's said that the Crystal Caves contain fragments of the original Wavelength itself. Could he be seeking to corrupt or steal these ancient power sources?

🛡️ Defensive Measures:
I'll alert the Village Council immediately. We should organize patrols and establish a warning system for other travelers.

Has anyone contacted Lucky? His knowledge of ancient goblin customs might help us understand what the Goblin King is truly after.

Stay safe, everyone. The Wavelength protects those who protect each other.

- Healer Mira`,
      authorId: 'ai-healer-mira',
      authorName: 'Healer Mira',
      authorAvatar: '/icons/healer-icon.svg',
      createdAt: Date.now() + 1000,
      likes: 2,
      parentReplyId: null
    };

    await db.ref(`forum/replies/${replyId}`).set(replyData);
    console.log(`   ✅ Reply created by Healer Mira`);
    console.log(`   🆔 Reply ID: ${replyId}`);

    // Step 4: Update category stats
    console.log('\n📊 Step 4: Updating category statistics...');
    await db.ref('forum/categories/goblins-beware').update({
      postCount: 1,
      replyCount: 1,
      lastActivity: Date.now(),
      lastPost: {
        id: postId,
        title: postData.title,
        author: postData.authorName,
        createdAt: postData.createdAt
      }
    });
    console.log('   ✅ Category statistics updated');

    console.log('\n🎉 "Goblins Beware" Board Demo Complete!');
    console.log('\n📋 Summary:');
    console.log(`   📂 Category: "Goblins Beware" (ID: goblins-beware)`);
    console.log(`   📝 Post: "Goblin King Sighting Near Crystal Caves!" (ID: ${postId})`);
    console.log(`   💬 Reply: Response from Healer Mira (ID: ${replyId})`);
    console.log(`   🔗 View at: /forum/category/goblins-beware`);
    console.log('\n🧌 Ready for your review! Check the forum to see the new board in action.');

  } catch (error) {
    console.error('❌ Error creating Goblin board demo:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run the demo
createGoblinBoard();