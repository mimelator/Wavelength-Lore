#!/usr/bin/env node

/**
 * WAVELENGTH NPC QUEST CONFIGURATION DEMO
 * 
 * This demonstrates how easy it is to configure NPCs and quests
 * for the immersive experience on Wavelength Lore.
 */

const WavelengthNPCQuestEngine = require('./wavelength-npc-quest-engine.js');

// Initialize the engine
const questEngine = new WavelengthNPCQuestEngine({
  debugMode: true,
  autoSave: true
});

console.log('🌊 WAVELENGTH NPC QUEST SYSTEM - CONFIGURATION DEMO');
console.log('━'.repeat(60));

// Configure Alexandria as an interactive NPC
const alexandriaConfig = {
  name: 'Alexandria',
  description: 'The Precocious Free-Spirited Violinist of Wavelength',
  avatar: '/images/characters/wavelength/alexandria-1.webp',
  position: { x: 100, y: 200 }, // Position on webpage
  dialogues: [
    {
      type: 'greeting',
      text: "🎻 Hello there! I'm Alexandria, and I love teaching music. Want to learn something magical about the violin?",
      mood: 'cheerful'
    },
    {
      type: 'quest_available',
      text: "I have a special challenge for you! Are you ready to explore the mysteries of harmony?",
      mood: 'excited'
    },
    {
      type: 'quest_complete',
      text: "🌟 Wonderful! You've truly understood the essence of music. Wear this badge with pride!",
      mood: 'proud'
    }
  ],
  quests: ['music-harmony-quest', 'violin-mastery-quest'],
  isActive: true,
  metadata: {
    character_page: '/characters/alex',
    unlock_level: 'beginner'
  }
};

// Configure Lucky as a wise guide NPC
const luckyConfig = {
  name: 'Lucky',
  description: 'The wise leprechaun with endless Golden Advice',
  avatar: '/images/characters/wavelength/lucky_closeup.webp',
  position: { x: 300, y: 150 },
  dialogues: [
    {
      type: 'greeting',
      text: "🍀 Ah, another seeker of wisdom! Lucky you found me. I have some golden advice to share...",
      mood: 'wise'
    },
    {
      type: 'riddle',
      text: "Here's a riddle for ye: What grows stronger when shared but never diminishes? Answer correctly for a special reward!",
      mood: 'mysterious'
    }
  ],
  quests: ['golden-advice-quest', 'fishing-wisdom-quest'],
  isActive: true,
  metadata: {
    character_page: '/characters/lucky',
    unlock_level: 'intermediate'
  }
};

// Configure Music Harmony Quest
const musicHarmonyQuest = {
  title: '🎵 The Harmony Challenge',
  description: 'Learn the secrets of musical harmony with Alexandria',
  steps: [
    {
      type: 'interaction',
      description: 'Listen to Alexandria explain the basics of harmony',
      validationType: 'custom',
      validator: async (stepData) => {
        return { valid: stepData.listened === true, message: 'Please listen to the harmony lesson' };
      }
    },
    {
      type: 'quiz',
      description: 'Answer 3 questions about musical intervals',
      validationType: 'custom',
      validator: async (stepData) => {
        const correctAnswers = stepData.answers?.filter(a => a.correct).length || 0;
        return { 
          valid: correctAnswers >= 2, 
          message: `You got ${correctAnswers}/3 correct. Need at least 2 to pass.` 
        };
      }
    },
    {
      type: 'practice',
      description: 'Play a simple harmony on the virtual violin',
      validationType: 'custom',
      validator: async (stepData) => {
        return { valid: stepData.harmonyPlayed === true, message: 'Play the harmony sequence' };
      }
    }
  ],
  rewards: [
    {
      type: 'badge',
      id: 'harmony-student',
      name: 'Harmony Student',
      description: 'Completed Alexandria\'s Harmony Challenge',
      image: '/images/badges/harmony-student.webp',
      merchUnlock: {
        type: 'design',
        products: ['t-shirt', 'mug', 'sticker'],
        design_id: 'harmony-student-badge'
      }
    }
  ],
  prerequisites: [],
  isRepeatable: false,
  metadata: {
    difficulty: 'beginner',
    estimated_time: '5-10 minutes',
    character: 'alexandria'
  }
};

// Configure Advanced Violin Quest (requires harmony completion)
const violinMasteryQuest = {
  title: '🎻 Violin Mastery Path',
  description: 'Master advanced violin techniques with Alexandria',
  steps: [
    {
      type: 'demonstration',
      description: 'Watch Alexandria demonstrate advanced bow techniques'
    },
    {
      type: 'challenge',
      description: 'Complete the Crescendo Challenge',
      validationType: 'custom',
      validator: async (stepData) => {
        return { 
          valid: stepData.crescendoScore >= 80, 
          message: `Crescendo score: ${stepData.crescendoScore}/100. Need 80+ to pass.` 
        };
      }
    }
  ],
  rewards: [
    {
      type: 'badge',
      id: 'violin-virtuoso',
      name: 'Violin Virtuoso',
      description: 'Mastered advanced violin techniques',
      image: '/images/badges/violin-virtuoso.webp',
      merchUnlock: {
        type: 'design',
        products: ['premium-shirt', 'canvas-print', 'phone-case'],
        design_id: 'violin-virtuoso-badge'
      }
    }
  ],
  prerequisites: ['music-harmony-quest'], // Must complete harmony first
  isRepeatable: false,
  metadata: {
    difficulty: 'advanced',
    estimated_time: '10-15 minutes',
    character: 'alexandria'
  }
};

// Configure Lucky's Golden Advice Quest
const goldenAdviceQuest = {
  title: '🍀 The Golden Advice',
  description: 'Solve Lucky\'s riddles to earn his legendary wisdom',
  steps: [
    {
      type: 'riddle',
      description: 'Answer Lucky\'s riddle about what grows when shared',
      validationType: 'custom',
      validator: async (stepData) => {
        const correctAnswers = ['knowledge', 'wisdom', 'love', 'happiness', 'joy'];
        const answer = stepData.answer?.toLowerCase() || '';
        const isCorrect = correctAnswers.some(correct => answer.includes(correct));
        return { 
          valid: isCorrect, 
          message: isCorrect ? 'Correct! Wisdom grows when shared!' : 'Think about things that multiply when given away...' 
        };
      }
    },
    {
      type: 'reflection',
      description: 'Write about a time you shared knowledge with someone',
      validationType: 'custom',
      validator: async (stepData) => {
        const wordCount = stepData.reflection?.split(' ').length || 0;
        return { 
          valid: wordCount >= 20, 
          message: `Your reflection has ${wordCount} words. Need at least 20 for thoughtful response.` 
        };
      }
    }
  ],
  rewards: [
    {
      type: 'badge',
      id: 'golden-wisdom',
      name: 'Golden Wisdom',
      description: 'Earned Lucky\'s legendary golden advice',
      image: '/images/badges/golden-wisdom.webp',
      merchUnlock: {
        type: 'design',
        products: ['lucky-charm-necklace', 'wisdom-mug', 'golden-sticker'],
        design_id: 'golden-wisdom-badge'
      }
    }
  ],
  prerequisites: [],
  isRepeatable: true, // Lucky always has new wisdom to share
  metadata: {
    difficulty: 'intermediate',
    estimated_time: '5-8 minutes',
    character: 'lucky'
  }
};

// Register all NPCs and Quests
async function setupDemo() {
  console.log('📝 Registering NPCs...');
  questEngine.registerNPC('alexandria', alexandriaConfig);
  questEngine.registerNPC('lucky', luckyConfig);
  
  console.log('🎯 Registering Quests...');
  questEngine.registerQuest('music-harmony-quest', musicHarmonyQuest);
  questEngine.registerQuest('violin-mastery-quest', violinMasteryQuest);
  questEngine.registerQuest('golden-advice-quest', goldenAdviceQuest);
  
  console.log('\n🎮 DEMO INTERACTIONS:');
  console.log('━'.repeat(40));
  
  // Demo interaction with Alexandria
  console.log('\n👋 Interacting with Alexandria...');
  const alexInteraction = await questEngine.interactWithNPC('alexandria');
  console.log(`💬 "${alexInteraction.dialogue.text}"`);
  console.log(`🎯 Available quests: ${alexInteraction.availableQuests.map(q => q.title).join(', ')}`);
  
  // Demo starting a quest
  console.log('\n🚀 Starting Harmony Challenge...');
  const questStart = await questEngine.startQuest('music-harmony-quest');
  console.log(`✅ Quest started: ${questStart.quest.title}`);
  console.log(`📋 Current step: ${questStart.currentStep.description}`);
  
  // Demo quest progression
  console.log('\n⚡ Progressing through quest...');
  const step1 = await questEngine.advanceQuest('music-harmony-quest', { listened: true });
  console.log(`📈 Step 1 complete! Current step: ${step1.currentStep.description}`);
  
  const step2 = await questEngine.advanceQuest('music-harmony-quest', { 
    answers: [
      { question: 'What is a perfect fifth?', answer: 'Seven semitones', correct: true },
      { question: 'What is a major third?', answer: 'Four semitones', correct: true },
      { question: 'What is an octave?', answer: 'Twelve semitones', correct: true }
    ]
  });
  console.log(`📈 Step 2 complete! Current step: ${step2.currentStep.description}`);
  
  // Complete the quest
  const completion = await questEngine.advanceQuest('music-harmony-quest', { harmonyPlayed: true });
  console.log(`🎉 Quest completed: ${completion.quest.title}`);
  console.log(`🏆 Rewards earned: ${completion.rewards.map(r => r.badge?.name || r.type).join(', ')}`);
  
  // Show player stats
  console.log('\n📊 PLAYER STATS:');
  console.log('━'.repeat(40));
  const stats = questEngine.getPlayerStats();
  console.log(`✅ Completed Quests: ${stats.completedQuests}`);
  console.log(`🏆 Earned Badges: ${stats.earnedBadges}`);
  console.log(`💬 NPC Interactions: ${stats.npcInteractions}`);
  console.log(`⏳ Active Quests: ${stats.activeQuests}`);
  
  // Show earned badges
  console.log('\n🎖️ EARNED BADGES:');
  console.log('━'.repeat(40));
  Array.from(questEngine.playerState.earnedBadges).forEach(badgeId => {
    console.log(`🏅 ${badgeId}`);
  });
  
  console.log('\n🌟 DEMO COMPLETE! The foundation is ready for immersive NPC interactions!');
}

// Run the demo
if (require.main === module) {
  setupDemo().catch(console.error);
}

module.exports = { questEngine, setupDemo };