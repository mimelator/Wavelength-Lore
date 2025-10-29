#!/usr/bin/env node

/**
 * WAVELENGTH NPC QUEST SYSTEM - CORE ENGINE
 * 
 * This is the foundational engine for NPC interactions on Wavelength Lore.
 * Designed to be unit-testable, modular, and easily configurable.
 * 
 * Features:
 * - NPC configuration management
 * - Quest script execution
 * - Badge reward system
 * - State persistence
 * - Event-driven architecture
 * 
 * @version 1.0.0
 * @author Wavelength Lore Team
 */

class WavelengthNPCQuestEngine {
  constructor(config = {}) {
    this.config = {
      autoSave: true,
      persistenceLayer: 'localStorage', // 'localStorage', 'firebase', 'memory'
      debugMode: false,
      ...config
    };
    
    // Core state
    this.npcs = new Map();
    this.quests = new Map();
    this.playerState = {
      completedQuests: new Set(),
      earnedBadges: new Set(),
      npcInteractions: new Map(),
      currentQuestProgress: new Map()
    };
    
    // Event system for extensibility
    this.eventListeners = new Map();
    
    this.log('NPCQuestEngine initialized', this.config);
  }

  /**
   * Register an NPC with their configuration
   */
  registerNPC(npcId, npcConfig) {
    if (!npcId || typeof npcId !== 'string') {
      throw new Error('NPC ID must be a non-empty string');
    }

    const npc = {
      id: npcId,
      name: npcConfig.name || npcId,
      description: npcConfig.description || '',
      avatar: npcConfig.avatar || null,
      position: npcConfig.position || { x: 0, y: 0 },
      dialogues: npcConfig.dialogues || [],
      quests: npcConfig.quests || [],
      isActive: npcConfig.isActive !== false, // Default to true
      metadata: npcConfig.metadata || {},
      ...npcConfig
    };

    this.npcs.set(npcId, npc);
    this.emit('npcRegistered', { npcId, npc });
    
    this.log(`NPC registered: ${npcId}`, npc);
    return npc;
  }

  /**
   * Register a quest with its configuration
   */
  registerQuest(questId, questConfig) {
    if (!questId || typeof questId !== 'string') {
      throw new Error('Quest ID must be a non-empty string');
    }

    const quest = {
      id: questId,
      title: questConfig.title || questId,
      description: questConfig.description || '',
      steps: questConfig.steps || [],
      rewards: questConfig.rewards || [],
      prerequisites: questConfig.prerequisites || [],
      isRepeatable: questConfig.isRepeatable || false,
      metadata: questConfig.metadata || {},
      ...questConfig
    };

    // Validate quest steps
    if (!Array.isArray(quest.steps) || quest.steps.length === 0) {
      throw new Error(`Quest ${questId} must have at least one step`);
    }

    this.quests.set(questId, quest);
    this.emit('questRegistered', { questId, quest });
    
    this.log(`Quest registered: ${questId}`, quest);
    return quest;
  }

  /**
   * Start an interaction with an NPC
   */
  async interactWithNPC(npcId, context = {}) {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error(`NPC not found: ${npcId}`);
    }

    if (!npc.isActive) {
      this.log(`NPC ${npcId} is not active`);
      return { type: 'inactive', npc };
    }

    // Track interaction
    const interactions = this.playerState.npcInteractions.get(npcId) || [];
    interactions.push({
      timestamp: Date.now(),
      context
    });
    this.playerState.npcInteractions.set(npcId, interactions);

    // Determine dialogue based on context and player state
    const dialogue = this.selectDialogue(npc, context);
    
    const interaction = {
      type: 'dialogue',
      npc,
      dialogue,
      availableQuests: this.getAvailableQuests(npcId),
      timestamp: Date.now()
    };

    this.emit('npcInteraction', interaction);
    this.saveState();
    
    this.log(`Interaction with ${npcId}`, interaction);
    return interaction;
  }

  /**
   * Start a quest
   */
  async startQuest(questId, context = {}) {
    const quest = this.quests.get(questId);
    if (!quest) {
      throw new Error(`Quest not found: ${questId}`);
    }

    // Check if quest is already completed (and not repeatable)
    if (this.playerState.completedQuests.has(questId) && !quest.isRepeatable) {
      return { type: 'alreadyCompleted', quest };
    }

    // Check prerequisites
    const missingPrereqs = quest.prerequisites.filter(
      prereq => !this.playerState.completedQuests.has(prereq)
    );
    
    if (missingPrereqs.length > 0) {
      return { 
        type: 'prerequisitesMissing', 
        quest, 
        missingPrerequisites: missingPrereqs 
      };
    }

    // Initialize quest progress
    const progress = {
      questId,
      startedAt: Date.now(),
      currentStep: 0,
      stepData: {},
      context
    };

    this.playerState.currentQuestProgress.set(questId, progress);
    
    const result = {
      type: 'questStarted',
      quest,
      progress,
      currentStep: quest.steps[0]
    };

    this.emit('questStarted', result);
    this.saveState();
    
    this.log(`Quest started: ${questId}`, result);
    return result;
  }

  /**
   * Advance quest progress
   */
  async advanceQuest(questId, stepData = {}) {
    const progress = this.playerState.currentQuestProgress.get(questId);
    if (!progress) {
      throw new Error(`No active quest found: ${questId}`);
    }

    const quest = this.quests.get(questId);
    const currentStep = quest.steps[progress.currentStep];
    
    // Validate step completion
    const isStepComplete = await this.validateStepCompletion(
      currentStep, 
      stepData, 
      progress
    );

    if (!isStepComplete.valid) {
      return {
        type: 'stepIncomplete',
        quest,
        progress,
        currentStep,
        validation: isStepComplete
      };
    }

    // Update progress
    progress.stepData[progress.currentStep] = stepData;
    progress.currentStep++;

    // Check if quest is complete
    if (progress.currentStep >= quest.steps.length) {
      return await this.completeQuest(questId);
    }

    // Continue to next step
    const nextStep = quest.steps[progress.currentStep];
    const result = {
      type: 'questProgressed',
      quest,
      progress,
      currentStep: nextStep,
      previousStep: currentStep
    };

    this.emit('questProgressed', result);
    this.saveState();
    
    this.log(`Quest progressed: ${questId}`, result);
    return result;
  }

  /**
   * Complete a quest and award rewards
   */
  async completeQuest(questId) {
    const progress = this.playerState.currentQuestProgress.get(questId);
    const quest = this.quests.get(questId);
    
    if (!progress || !quest) {
      throw new Error(`Invalid quest completion: ${questId}`);
    }

    // Remove from active quests
    this.playerState.currentQuestProgress.delete(questId);
    
    // Mark as completed
    this.playerState.completedQuests.add(questId);
    
    // Award rewards
    const awardedRewards = [];
    for (const reward of quest.rewards) {
      const awardResult = await this.awardReward(reward, questId);
      awardedRewards.push(awardResult);
    }

    const result = {
      type: 'questCompleted',
      quest,
      progress: {
        ...progress,
        completedAt: Date.now()
      },
      rewards: awardedRewards
    };

    this.emit('questCompleted', result);
    this.saveState();
    
    this.log(`Quest completed: ${questId}`, result);
    return result;
  }

  /**
   * Award a reward to the player
   */
  async awardReward(reward, sourceQuestId) {
    const rewardResult = {
      type: reward.type,
      id: reward.id,
      sourceQuest: sourceQuestId,
      awardedAt: Date.now()
    };

    switch (reward.type) {
      case 'badge':
        this.playerState.earnedBadges.add(reward.id);
        rewardResult.badge = reward;
        break;
        
      case 'item':
        // Could extend for inventory items
        rewardResult.item = reward;
        break;
        
      default:
        this.log(`Unknown reward type: ${reward.type}`, reward);
    }

    this.emit('rewardAwarded', rewardResult);
    return rewardResult;
  }

  /**
   * Get available quests for an NPC
   */
  getAvailableQuests(npcId) {
    const npc = this.npcs.get(npcId);
    if (!npc) return [];

    return npc.quests
      .map(questId => this.quests.get(questId))
      .filter(quest => quest && this.isQuestAvailable(quest));
  }

  /**
   * Check if a quest is available to the player
   */
  isQuestAvailable(quest) {
    // Already completed and not repeatable
    if (this.playerState.completedQuests.has(quest.id) && !quest.isRepeatable) {
      return false;
    }

    // Check prerequisites
    return quest.prerequisites.every(
      prereq => this.playerState.completedQuests.has(prereq)
    );
  }

  /**
   * Select appropriate dialogue for NPC interaction
   */
  selectDialogue(npc, context) {
    if (!npc.dialogues || npc.dialogues.length === 0) {
      return {
        text: `Hello! I'm ${npc.name}.`,
        type: 'greeting'
      };
    }

    // Simple dialogue selection logic (can be extended)
    const interactions = this.playerState.npcInteractions.get(npc.id) || [];
    const interactionCount = interactions.length;

    // First interaction
    if (interactionCount === 1) {
      const greeting = npc.dialogues.find(d => d.type === 'greeting');
      if (greeting) return greeting;
    }

    // Default dialogue
    return npc.dialogues[0] || { text: `Hello! I'm ${npc.name}.`, type: 'default' };
  }

  /**
   * Validate quest step completion
   */
  async validateStepCompletion(step, stepData, progress) {
    // Basic validation - can be extended for specific step types
    if (step.validationType === 'custom' && step.validator) {
      return await step.validator(stepData, progress);
    }

    // Default validation
    return { valid: true, message: 'Step completed' };
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        this.log(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * State persistence
   */
  saveState() {
    if (!this.config.autoSave) return;

    const state = {
      completedQuests: Array.from(this.playerState.completedQuests),
      earnedBadges: Array.from(this.playerState.earnedBadges),
      npcInteractions: Object.fromEntries(this.playerState.npcInteractions),
      currentQuestProgress: Object.fromEntries(this.playerState.currentQuestProgress)
    };

    if (this.config.persistenceLayer === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.setItem('wavelength_npc_quest_state', JSON.stringify(state));
    }

    this.emit('stateSaved', state);
  }

  loadState() {
    try {
      if (this.config.persistenceLayer === 'localStorage' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('wavelength_npc_quest_state');
        if (saved) {
          const state = JSON.parse(saved);
          this.playerState.completedQuests = new Set(state.completedQuests || []);
          this.playerState.earnedBadges = new Set(state.earnedBadges || []);
          this.playerState.npcInteractions = new Map(Object.entries(state.npcInteractions || {}));
          this.playerState.currentQuestProgress = new Map(Object.entries(state.currentQuestProgress || {}));
          
          this.emit('stateLoaded', state);
          this.log('State loaded from localStorage');
        }
      }
    } catch (error) {
      this.log('Error loading state:', error);
    }
  }

  /**
   * Get player statistics
   */
  getPlayerStats() {
    return {
      completedQuests: this.playerState.completedQuests.size,
      earnedBadges: this.playerState.earnedBadges.size,
      npcInteractions: Array.from(this.playerState.npcInteractions.entries())
        .reduce((sum, [_, interactions]) => sum + interactions.length, 0),
      activeQuests: this.playerState.currentQuestProgress.size
    };
  }

  /**
   * Debug logging
   */
  log(...args) {
    if (this.config.debugMode) {
      console.log('[NPCQuestEngine]', ...args);
    }
  }

  /**
   * Reset player state (for testing)
   */
  resetPlayerState() {
    this.playerState = {
      completedQuests: new Set(),
      earnedBadges: new Set(),
      npcInteractions: new Map(),
      currentQuestProgress: new Map()
    };
    
    if (this.config.persistenceLayer === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('wavelength_npc_quest_state');
    }
    
    this.emit('stateReset');
    this.log('Player state reset');
  }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WavelengthNPCQuestEngine;
} else if (typeof window !== 'undefined') {
  window.WavelengthNPCQuestEngine = WavelengthNPCQuestEngine;
}