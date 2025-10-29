#!/usr/bin/env node

/**
 * WAVELENGTH NPC QUEST ENGINE - UNIT TESTS
 * 
 * Comprehensive test suite for the NPC Quest Engine
 * Tests all core functionality with edge cases
 */

const WavelengthNPCQuestEngine = require('./wavelength-npc-quest-engine.js');

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 WAVELENGTH NPC QUEST ENGINE - UNIT TESTS');
    console.log('━'.repeat(60));

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
        this.failed++;
      }
    }

    console.log('━'.repeat(60));
    console.log(`📊 Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 All tests passed!');
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertThrows(fn, message) {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      if (error.message === message || error.message.includes('Expected function to throw')) {
        throw error;
      }
      // Function threw as expected
    }
  }
}

const runner = new TestRunner();

// Test Engine Initialization
runner.test('Engine initializes with default config', () => {
  const engine = new WavelengthNPCQuestEngine();
  runner.assert(engine.npcs instanceof Map, 'NPCs should be a Map');
  runner.assert(engine.quests instanceof Map, 'Quests should be a Map');
  runner.assert(engine.config.autoSave === true, 'AutoSave should be true by default');
});

runner.test('Engine accepts custom config', () => {
  const config = { debugMode: true, autoSave: false };
  const engine = new WavelengthNPCQuestEngine(config);
  runner.assertEqual(engine.config.debugMode, true, 'Debug mode should be enabled');
  runner.assertEqual(engine.config.autoSave, false, 'AutoSave should be disabled');
});

// Test NPC Registration
runner.test('Can register basic NPC', () => {
  const engine = new WavelengthNPCQuestEngine();
  const npc = engine.registerNPC('test-npc', {
    name: 'Test NPC',
    description: 'A test character'
  });
  
  runner.assertEqual(npc.id, 'test-npc', 'NPC ID should match');
  runner.assertEqual(npc.name, 'Test NPC', 'NPC name should match');
  runner.assert(engine.npcs.has('test-npc'), 'NPC should be stored');
});

runner.test('NPC registration validates ID', () => {
  const engine = new WavelengthNPCQuestEngine();
  
  runner.assertThrows(() => {
    engine.registerNPC('', { name: 'Invalid' });
  }, 'Empty NPC ID should throw');
  
  runner.assertThrows(() => {
    engine.registerNPC(null, { name: 'Invalid' });
  }, 'Null NPC ID should throw');
});

runner.test('NPC has default values', () => {
  const engine = new WavelengthNPCQuestEngine();
  const npc = engine.registerNPC('minimal-npc', {});
  
  runner.assertEqual(npc.name, 'minimal-npc', 'Name should default to ID');
  runner.assertEqual(npc.isActive, true, 'Should be active by default');
  runner.assert(Array.isArray(npc.dialogues), 'Dialogues should be array');
  runner.assert(Array.isArray(npc.quests), 'Quests should be array');
});

// Test Quest Registration
runner.test('Can register basic quest', () => {
  const engine = new WavelengthNPCQuestEngine();
  const quest = engine.registerQuest('test-quest', {
    title: 'Test Quest',
    description: 'A test quest',
    steps: [
      { type: 'talk', description: 'Talk to NPC' }
    ],
    rewards: [
      { type: 'badge', id: 'test-badge' }
    ]
  });
  
  runner.assertEqual(quest.id, 'test-quest', 'Quest ID should match');
  runner.assertEqual(quest.title, 'Test Quest', 'Quest title should match');
  runner.assert(engine.quests.has('test-quest'), 'Quest should be stored');
});

runner.test('Quest registration requires steps', () => {
  const engine = new WavelengthNPCQuestEngine();
  
  runner.assertThrows(() => {
    engine.registerQuest('invalid-quest', {
      title: 'Invalid Quest',
      steps: []
    });
  }, 'Quest without steps should throw');
});

runner.test('Quest has default values', () => {
  const engine = new WavelengthNPCQuestEngine();
  const quest = engine.registerQuest('minimal-quest', {
    steps: [{ type: 'test' }]
  });
  
  runner.assertEqual(quest.title, 'minimal-quest', 'Title should default to ID');
  runner.assertEqual(quest.isRepeatable, false, 'Should not be repeatable by default');
  runner.assert(Array.isArray(quest.rewards), 'Rewards should be array');
});

// Test NPC Interactions
runner.test('Can interact with active NPC', async () => {
  const engine = new WavelengthNPCQuestEngine();
  engine.registerNPC('friendly-npc', {
    name: 'Friendly NPC',
    dialogues: [
      { type: 'greeting', text: 'Hello there!' }
    ]
  });
  
  const interaction = await engine.interactWithNPC('friendly-npc');
  
  runner.assertEqual(interaction.type, 'dialogue', 'Should return dialogue interaction');
  runner.assertEqual(interaction.npc.id, 'friendly-npc', 'Should include NPC data');
  runner.assert(interaction.dialogue, 'Should include dialogue');
});

runner.test('Cannot interact with inactive NPC', async () => {
  const engine = new WavelengthNPCQuestEngine();
  engine.registerNPC('inactive-npc', {
    name: 'Inactive NPC',
    isActive: false
  });
  
  const interaction = await engine.interactWithNPC('inactive-npc');
  
  runner.assertEqual(interaction.type, 'inactive', 'Should return inactive interaction');
});

runner.test('Interaction with non-existent NPC throws', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  try {
    await engine.interactWithNPC('non-existent');
    runner.assert(false, 'Should have thrown error');
  } catch (error) {
    runner.assert(error.message.includes('NPC not found'), 'Should throw NPC not found error');
  }
});

// Test Quest Management
runner.test('Can start available quest', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  engine.registerQuest('starter-quest', {
    title: 'Starter Quest',
    steps: [
      { type: 'talk', description: 'Say hello' }
    ]
  });
  
  const result = await engine.startQuest('starter-quest');
  
  runner.assertEqual(result.type, 'questStarted', 'Should start quest');
  runner.assertEqual(result.quest.id, 'starter-quest', 'Should include quest data');
  runner.assertEqual(result.progress.currentStep, 0, 'Should start at step 0');
});

runner.test('Cannot start quest with missing prerequisites', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  engine.registerQuest('advanced-quest', {
    title: 'Advanced Quest',
    prerequisites: ['starter-quest'],
    steps: [
      { type: 'talk', description: 'Advanced conversation' }
    ]
  });
  
  const result = await engine.startQuest('advanced-quest');
  
  runner.assertEqual(result.type, 'prerequisitesMissing', 'Should reject due to prerequisites');
  runner.assert(result.missingPrerequisites.includes('starter-quest'), 'Should list missing prerequisites');
});

runner.test('Can advance quest progress', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  engine.registerQuest('multi-step-quest', {
    title: 'Multi Step Quest',
    steps: [
      { type: 'talk', description: 'Step 1' },
      { type: 'action', description: 'Step 2' }
    ],
    rewards: [
      { type: 'badge', id: 'completion-badge' }
    ]
  });
  
  // Start quest
  await engine.startQuest('multi-step-quest');
  
  // Advance first step
  const progress1 = await engine.advanceQuest('multi-step-quest', { talked: true });
  runner.assertEqual(progress1.type, 'questProgressed', 'Should progress quest');
  runner.assertEqual(progress1.progress.currentStep, 1, 'Should be on step 1');
  
  // Complete quest
  const completion = await engine.advanceQuest('multi-step-quest', { actionDone: true });
  runner.assertEqual(completion.type, 'questCompleted', 'Should complete quest');
  runner.assert(engine.playerState.completedQuests.has('multi-step-quest'), 'Should mark as completed');
});

// Test Reward System
runner.test('Quest completion awards badges', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  engine.registerQuest('badge-quest', {
    title: 'Badge Quest',
    steps: [
      { type: 'simple', description: 'Do something' }
    ],
    rewards: [
      { type: 'badge', id: 'special-badge', name: 'Special Badge' }
    ]
  });
  
  await engine.startQuest('badge-quest');
  const result = await engine.advanceQuest('badge-quest');
  
  runner.assertEqual(result.type, 'questCompleted', 'Quest should complete');
  runner.assert(engine.playerState.earnedBadges.has('special-badge'), 'Should earn badge');
  runner.assertEqual(result.rewards[0].type, 'badge', 'Should include badge reward');
});

// Test State Persistence
runner.test('Player state tracks interactions', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  engine.registerNPC('trackable-npc', { name: 'Trackable' });
  
  await engine.interactWithNPC('trackable-npc', { context: 'test' });
  await engine.interactWithNPC('trackable-npc', { context: 'test2' });
  
  const interactions = engine.playerState.npcInteractions.get('trackable-npc');
  runner.assertEqual(interactions.length, 2, 'Should track 2 interactions');
  runner.assertEqual(interactions[0].context.context, 'test', 'Should store interaction context');
});

runner.test('Player stats are accurate', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  // Register and complete a quest
  engine.registerQuest('stats-quest', {
    steps: [{ type: 'test' }],
    rewards: [{ type: 'badge', id: 'stats-badge' }]
  });
  
  await engine.startQuest('stats-quest');
  await engine.advanceQuest('stats-quest');
  
  const stats = engine.getPlayerStats();
  runner.assertEqual(stats.completedQuests, 1, 'Should show 1 completed quest');
  runner.assertEqual(stats.earnedBadges, 1, 'Should show 1 earned badge');
  runner.assertEqual(stats.activeQuests, 0, 'Should show 0 active quests');
});

// Test Event System
runner.test('Events are emitted correctly', async () => {
  const engine = new WavelengthNPCQuestEngine();
  const events = [];
  
  engine.on('npcRegistered', (data) => events.push('npcRegistered'));
  engine.on('questStarted', (data) => events.push('questStarted'));
  engine.on('questCompleted', (data) => events.push('questCompleted'));
  
  engine.registerNPC('event-npc', { name: 'Event NPC' });
  engine.registerQuest('event-quest', {
    steps: [{ type: 'test' }]
  });
  
  await engine.startQuest('event-quest');
  await engine.advanceQuest('event-quest');
  
  runner.assert(events.includes('npcRegistered'), 'Should emit npcRegistered');
  runner.assert(events.includes('questStarted'), 'Should emit questStarted');
  runner.assert(events.includes('questCompleted'), 'Should emit questCompleted');
});

// Test Edge Cases
runner.test('Cannot start non-existent quest', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  try {
    await engine.startQuest('non-existent-quest');
    runner.assert(false, 'Should have thrown error');
  } catch (error) {
    runner.assert(error.message.includes('Quest not found'), 'Should throw quest not found error');
  }
});

runner.test('Cannot advance non-active quest', async () => {
  const engine = new WavelengthNPCQuestEngine();
  
  try {
    await engine.advanceQuest('non-active-quest');
    runner.assert(false, 'Should have thrown error');
  } catch (error) {
    runner.assert(error.message.includes('No active quest found'), 'Should throw no active quest error');
  }
});

runner.test('State reset clears all data', () => {
  const engine = new WavelengthNPCQuestEngine();
  
  // Add some state
  engine.playerState.completedQuests.add('test');
  engine.playerState.earnedBadges.add('badge');
  
  runner.assertEqual(engine.playerState.completedQuests.size, 1, 'Should have completed quest');
  runner.assertEqual(engine.playerState.earnedBadges.size, 1, 'Should have earned badge');
  
  engine.resetPlayerState();
  
  runner.assertEqual(engine.playerState.completedQuests.size, 0, 'Should clear completed quests');
  runner.assertEqual(engine.playerState.earnedBadges.size, 0, 'Should clear earned badges');
});

// Run all tests
if (require.main === module) {
  runner.run().catch(console.error);
}

module.exports = TestRunner;