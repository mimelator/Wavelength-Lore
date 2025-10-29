/**
 * WAVELENGTH NPC QUEST SYSTEM - WEB INTEGRATION
 * 
 * This script brings NPCs to life on character pages
 * Specifically designed for Alexandria's Harmony Challenge
 */

// Initialize the quest engine for web use
const npcQuestEngine = new WavelengthNPCQuestEngine({
  debugMode: false,
  autoSave: true,
  persistenceLayer: 'localStorage'
});

// Load saved state
npcQuestEngine.loadState();

/**
 * Alexandria NPC Configuration
 */
const alexandriaNPCConfig = {
  name: 'Alexandria',
  description: 'The Precocious Free-Spirited Violinist of Wavelength',
  avatar: '/images/characters/wavelength/alexandria-1.webp',
  position: { x: 20, y: 20 }, // Top-left corner of page
  dialogues: [
    {
      type: 'greeting',
      text: "🎻 Hello there! I'm Alexandria, and I love teaching music. Want to learn something magical about the violin?",
      mood: 'cheerful'
    },
    {
      type: 'quest_available',
      text: "I have a special harmony challenge for you! Are you ready to explore the mysteries of musical harmony?",
      mood: 'excited'
    },
    {
      type: 'quest_active',
      text: "You're doing great with the harmony challenge! Keep going!",
      mood: 'encouraging'
    },
    {
      type: 'quest_complete',
      text: "🌟 Wonderful! You've truly understood the essence of harmony. Wear this badge with pride!",
      mood: 'proud'
    },
    {
      type: 'return_visitor',
      text: "Welcome back! I see you've earned the Harmony Student badge. Ready for more advanced challenges?",
      mood: 'warm'
    }
  ],
  quests: ['alexandria-harmony-quest'],
  isActive: true,
  metadata: {
    character_page: '/character/alex',
    unlock_level: 'beginner'
  }
};

/**
 * Alexandria's Harmony Quest Configuration
 */
const alexandriaHarmonyQuest = {
  title: '🎵 Alexandria\'s Harmony Challenge',
  description: 'Learn the secrets of musical harmony with Alexandria herself!',
  steps: [
    {
      type: 'listen',
      title: 'Listen to the Harmony Lesson',
      description: 'Listen as Alexandria explains the basics of musical harmony',
      content: {
        type: 'audio_lesson',
        text: `🎼 Musical harmony is like friendship - different notes coming together to create something beautiful! 

When we play two or more notes at the same time, they can either sound pleasant (consonant) or tense (dissonant). The magic happens when we understand how these notes relate to each other.

Think of it like this: If one note is singing, harmony is when other notes join in to create a choir. Each voice is different, but together they make something more powerful than any single voice alone.

The most basic harmony is when we play notes that are a perfect fifth apart - like C and G. They sound so natural together, like they were meant to be friends!`,
        audio: '/audio/alexandria-harmony-lesson.mp3' // Optional audio file
      },
      validationType: 'interaction',
      validator: async (stepData) => {
        return { 
          valid: stepData.listened === true && stepData.timeSpent >= 30, 
          message: stepData.timeSpent < 30 ? 'Please listen to the full lesson (at least 30 seconds)' : 'Lesson completed!' 
        };
      }
    },
    {
      type: 'quiz',
      title: 'Harmony Knowledge Quiz',
      description: 'Answer questions about what you just learned',
      content: {
        type: 'multiple_choice_quiz',
        questions: [
          {
            question: "What makes two notes sound harmonious together?",
            options: [
              "They are exactly the same note",
              "They have a pleasant mathematical relationship",
              "They are played very loudly",
              "They are played by the same instrument"
            ],
            correct: 1,
            explanation: "Harmony comes from mathematical relationships between note frequencies!"
          },
          {
            question: "What is a perfect fifth?",
            options: [
              "Playing five notes at once",
              "A fifth of a musical scale",
              "Two notes with a specific harmonic relationship (like C and G)",
              "The fifth instrument in an orchestra"
            ],
            correct: 2,
            explanation: "A perfect fifth is one of the most consonant intervals in music!"
          },
          {
            question: "According to Alexandria, harmony is like:",
            options: [
              "A solo performance",
              "Friendship - different voices coming together",
              "Playing the same note repeatedly",
              "Making noise"
            ],
            correct: 1,
            explanation: "Just like friendship, harmony brings different elements together beautifully!"
          }
        ]
      },
      validationType: 'quiz',
      validator: async (stepData) => {
        const correctAnswers = stepData.answers?.filter(a => a.correct).length || 0;
        const totalQuestions = 3;
        const passingScore = 2;
        
        return { 
          valid: correctAnswers >= passingScore, 
          message: `You scored ${correctAnswers}/${totalQuestions}. ${correctAnswers >= passingScore ? 'Great job!' : `Need at least ${passingScore} correct to pass.`}`,
          score: correctAnswers,
          total: totalQuestions
        };
      }
    },
    {
      type: 'practice',
      title: 'Virtual Violin Practice',
      description: 'Play a simple harmony on the virtual violin',
      content: {
        type: 'virtual_instrument',
        instrument: 'violin',
        challenge: 'Play C and G together to create a perfect fifth harmony',
        targetNotes: ['C4', 'G4'],
        instructions: 'Click the C and G notes on the virtual violin. Listen to how they sound together!'
      },
      validationType: 'instrument_practice',
      validator: async (stepData) => {
        const playedNotes = stepData.playedNotes || [];
        const targetNotes = ['C4', 'G4'];
        const hasAllNotes = targetNotes.every(note => playedNotes.includes(note));
        const playedTogether = stepData.playedSimultaneously === true;
        
        return { 
          valid: hasAllNotes && playedTogether, 
          message: hasAllNotes && playedTogether ? 
            '🎻 Perfect! You played a beautiful perfect fifth harmony!' : 
            'Try playing both C and G notes at the same time to hear the harmony.'
        };
      }
    }
  ],
  rewards: [
    {
      type: 'badge',
      id: 'alexandria-harmony-student',
      name: 'Alexandria\'s Harmony Student',
      description: 'Completed Alexandria\'s Harmony Challenge and learned the secrets of musical harmony',
      image: '/images/badges/alexandria-harmony-student.webp',
      merchUnlock: {
        type: 'exclusive_design',
        products: ['t-shirt', 'mug', 'sticker', 'tote-bag'],
        design_id: 'alexandria-harmony-badge',
        design_name: 'Alexandria\'s Harmony Student',
        design_description: 'Exclusive design featuring Alexandria and musical harmony symbols, only available to quest completers!'
      }
    }
  ],
  prerequisites: [],
  isRepeatable: false,
  metadata: {
    difficulty: 'beginner',
    estimated_time: '5-10 minutes',
    character: 'alexandria',
    page: '/character/alex'
  }
};

/**
 * NPC UI Manager - Handles the visual representation of NPCs
 */
class NPCUIManager {
  constructor() {
    this.activeNPC = null;
    this.questUI = null;
  }

  /**
   * Create and display an NPC on the page
   */
  createNPC(npcId, npc) {
    // Remove existing NPC if any
    this.removeNPC();

    // Create NPC container
    const npcContainer = document.createElement('div');
    npcContainer.id = `npc-${npcId}`;
    npcContainer.className = 'wavelength-npc';
    npcContainer.style.cssText = `
      position: fixed;
      top: ${npc.position.y}px;
      left: ${npc.position.x}px;
      width: 80px;
      height: 80px;
      background-image: url('${npc.avatar}');
      background-size: cover;
      background-position: center;
      border-radius: 50%;
      border: 3px solid #3498db;
      cursor: pointer;
      z-index: 1000;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
      animation: npcPulse 2s infinite;
    `;

    // Add click handler
    npcContainer.addEventListener('click', () => {
      this.handleNPCClick(npcId);
    });

    // Add tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'npc-tooltip';
    tooltip.textContent = `Click to talk to ${npc.name}`;
    tooltip.style.cssText = `
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    npcContainer.appendChild(tooltip);

    // Show tooltip on hover
    npcContainer.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
    });

    npcContainer.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });

    document.body.appendChild(npcContainer);
    this.activeNPC = { id: npcId, element: npcContainer, data: npc };

    console.log(`🎭 NPC ${npc.name} appeared on the page!`);
  }

  /**
   * Remove NPC from page
   */
  removeNPC() {
    if (this.activeNPC) {
      this.activeNPC.element.remove();
      this.activeNPC = null;
    }
  }

  /**
   * Handle NPC click interaction
   */
  async handleNPCClick(npcId) {
    try {
      const interaction = await npcQuestEngine.interactWithNPC(npcId);
      this.showInteractionDialog(interaction);
    } catch (error) {
      console.error('Error interacting with NPC:', error);
      this.showErrorMessage('Sorry, there was an error talking to the NPC.');
    }
  }

  /**
   * Show interaction dialog
   */
  showInteractionDialog(interaction) {
    const dialog = this.createDialog();
    const npc = interaction.npc;
    
    // Determine dialogue based on quest state
    let dialogue = interaction.dialogue;
    const activeQuest = npcQuestEngine.playerState.currentQuestProgress.get('alexandria-harmony-quest');
    const completedQuest = npcQuestEngine.playerState.completedQuests.has('alexandria-harmony-quest');
    
    if (completedQuest) {
      dialogue = npc.dialogues.find(d => d.type === 'return_visitor') || dialogue;
    } else if (activeQuest) {
      dialogue = npc.dialogues.find(d => d.type === 'quest_active') || dialogue;
    } else if (interaction.availableQuests.length > 0) {
      dialogue = npc.dialogues.find(d => d.type === 'quest_available') || dialogue;
    }

    dialog.innerHTML = `
      <div class="npc-dialog-header">
        <div class="npc-avatar" style="background-image: url('${npc.avatar}')"></div>
        <div class="npc-name">${npc.name}</div>
        <button class="dialog-close" onclick="this.closest('.wavelength-dialog').remove()">×</button>
      </div>
      <div class="npc-dialog-content">
        <div class="npc-message">${dialogue.text}</div>
        ${this.generateDialogActions(interaction, activeQuest, completedQuest)}
      </div>
    `;

    document.body.appendChild(dialog);
  }

  /**
   * Generate dialog action buttons
   */
  generateDialogActions(interaction, activeQuest, completedQuest) {
    let actions = '';

    if (completedQuest) {
      actions += `
        <div class="dialog-actions">
          <button class="btn btn-info" onclick="window.npcUI.showBadgeCollection()">
            🏆 View My Badges
          </button>
          <button class="btn btn-primary" onclick="window.open('/merchandise', '_blank')">
            🛍️ Visit Merch Store
          </button>
        </div>
      `;
    } else if (activeQuest) {
      actions += `
        <div class="dialog-actions">
          <button class="btn btn-success" onclick="window.npcUI.continueQuest('alexandria-harmony-quest')">
            ⚡ Continue Quest
          </button>
          <button class="btn btn-secondary" onclick="window.npcUI.showQuestProgress('alexandria-harmony-quest')">
            📊 View Progress
          </button>
        </div>
      `;
    } else if (interaction.availableQuests.length > 0) {
      const quest = interaction.availableQuests[0];
      actions += `
        <div class="quest-preview">
          <h4>🎵 ${quest.title}</h4>
          <p>${quest.description}</p>
          <div class="quest-meta">
            <span class="difficulty">📈 ${quest.metadata.difficulty}</span>
            <span class="time">⏱️ ${quest.metadata.estimated_time}</span>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-success" onclick="window.npcUI.startQuest('${quest.id}')">
            🚀 Accept Challenge
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.wavelength-dialog').remove()">
            Maybe Later
          </button>
        </div>
      `;
    } else {
      actions += `
        <div class="dialog-actions">
          <button class="btn btn-secondary" onclick="this.closest('.wavelength-dialog').remove()">
            👋 Goodbye
          </button>
        </div>
      `;
    }

    return actions;
  }

  /**
   * Start a quest
   */
  async startQuest(questId) {
    try {
      const result = await npcQuestEngine.startQuest(questId);
      
      if (result.type === 'questStarted') {
        this.closeAllDialogs();
        this.showQuestUI(result.quest, result.progress, result.currentStep);
      } else {
        this.showErrorMessage('Unable to start quest: ' + result.type);
      }
    } catch (error) {
      console.error('Error starting quest:', error);
      this.showErrorMessage('Error starting quest.');
    }
  }

  /**
   * Continue an active quest
   */
  async continueQuest(questId) {
    const progress = npcQuestEngine.playerState.currentQuestProgress.get(questId);
    const quest = npcQuestEngine.quests.get(questId);
    
    if (progress && quest) {
      this.closeAllDialogs();
      this.showQuestUI(quest, progress, quest.steps[progress.currentStep]);
    }
  }

  /**
   * Show quest UI
   */
  showQuestUI(quest, progress, currentStep) {
    const questDialog = this.createDialog('quest-dialog');
    
    questDialog.innerHTML = `
      <div class="quest-header">
        <h2>${quest.title}</h2>
        <div class="quest-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((progress.currentStep) / quest.steps.length) * 100}%"></div>
          </div>
          <span class="progress-text">Step ${progress.currentStep + 1} of ${quest.steps.length}</span>
        </div>
        <button class="dialog-close" onclick="this.closest('.wavelength-dialog').remove()">×</button>
      </div>
      <div class="quest-content">
        <div class="step-content">
          <h3>${currentStep.title}</h3>
          <p>${currentStep.description}</p>
          ${this.generateStepContent(currentStep)}
        </div>
      </div>
    `;

    document.body.appendChild(questDialog);
    this.questUI = questDialog;
  }

  /**
   * Generate step-specific content
   */
  generateStepContent(step) {
    switch (step.type) {
      case 'listen':
        return this.generateListenContent(step);
      case 'quiz':
        return this.generateQuizContent(step);
      case 'practice':
        return this.generatePracticeContent(step);
      default:
        return `<p>Step type: ${step.type}</p>`;
    }
  }

  /**
   * Generate listening step content
   */
  generateListenContent(step) {
    return `
      <div class="lesson-content">
        <div class="lesson-text">${step.content.text.replace(/\n/g, '<br>')}</div>
        <div class="lesson-actions">
          <button class="btn btn-primary" onclick="window.npcUI.startListening()">
            🎧 Start Lesson
          </button>
        </div>
        <div id="listening-timer" class="listening-timer" style="display: none;">
          <p>⏱️ Listening... <span id="timer-display">0</span> seconds</p>
          <button class="btn btn-success" onclick="window.npcUI.completeListening()" disabled id="complete-btn">
            Complete Lesson (need 30 seconds)
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Generate quiz content
   */
  generateQuizContent(step) {
    const questions = step.content.questions;
    let quizHTML = '<div class="quiz-content">';
    
    questions.forEach((question, index) => {
      quizHTML += `
        <div class="quiz-question" data-question="${index}">
          <h4>Question ${index + 1}: ${question.question}</h4>
          <div class="quiz-options">
            ${question.options.map((option, optionIndex) => `
              <label class="quiz-option">
                <input type="radio" name="question_${index}" value="${optionIndex}">
                <span>${option}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });
    
    quizHTML += `
      <div class="quiz-actions">
        <button class="btn btn-primary" onclick="window.npcUI.submitQuiz()">
          📝 Submit Quiz
        </button>
      </div>
      <div id="quiz-results" class="quiz-results"></div>
    </div>`;
    
    return quizHTML;
  }

  /**
   * Generate practice content
   */
  generatePracticeContent(step) {
    return `
      <div class="practice-content">
        <div class="virtual-violin">
          <h4>🎻 Virtual Violin</h4>
          <p>${step.content.challenge}</p>
          <div class="violin-keys">
            <button class="violin-key" data-note="C4" onclick="window.npcUI.playNote('C4')">
              C
            </button>
            <button class="violin-key" data-note="D4" onclick="window.npcUI.playNote('D4')">
              D
            </button>
            <button class="violin-key" data-note="E4" onclick="window.npcUI.playNote('E4')">
              E
            </button>
            <button class="violin-key" data-note="F4" onclick="window.npcUI.playNote('F4')">
              F
            </button>
            <button class="violin-key" data-note="G4" onclick="window.npcUI.playNote('G4')">
              G
            </button>
            <button class="violin-key" data-note="A4" onclick="window.npcUI.playNote('A4')">
              A
            </button>
            <button class="violin-key" data-note="B4" onclick="window.npcUI.playNote('B4')">
              B
            </button>
          </div>
          <div class="harmony-challenge">
            <p><strong>Challenge:</strong> Click C and G at the same time to play a perfect fifth!</p>
            <button class="btn btn-success" onclick="window.npcUI.playHarmony(['C4', 'G4'])">
              🎵 Play C + G Harmony
            </button>
          </div>
          <div id="practice-feedback" class="practice-feedback"></div>
        </div>
      </div>
    `;
  }

  /**
   * Listening step methods
   */
  startListening() {
    const timer = document.getElementById('listening-timer');
    const timerDisplay = document.getElementById('timer-display');
    const completeBtn = document.getElementById('complete-btn');
    
    timer.style.display = 'block';
    
    let seconds = 0;
    this.listeningInterval = setInterval(() => {
      seconds++;
      timerDisplay.textContent = seconds;
      
      if (seconds >= 30) {
        completeBtn.disabled = false;
        completeBtn.textContent = 'Complete Lesson ✅';
      }
    }, 1000);
  }

  async completeListening() {
    if (this.listeningInterval) {
      clearInterval(this.listeningInterval);
    }
    
    const seconds = parseInt(document.getElementById('timer-display').textContent);
    
    try {
      const result = await npcQuestEngine.advanceQuest('alexandria-harmony-quest', {
        listened: true,
        timeSpent: seconds
      });
      
      this.handleQuestProgress(result);
    } catch (error) {
      console.error('Error completing listening step:', error);
    }
  }

  /**
   * Quiz methods
   */
  async submitQuiz() {
    const questions = alexandriaHarmonyQuest.steps[1].content.questions;
    const answers = [];
    
    questions.forEach((question, index) => {
      const selectedOption = document.querySelector(`input[name="question_${index}"]:checked`);
      const selectedValue = selectedOption ? parseInt(selectedOption.value) : -1;
      
      answers.push({
        question: question.question,
        selected: selectedValue,
        correct: selectedValue === question.correct,
        explanation: question.explanation
      });
    });
    
    try {
      const result = await npcQuestEngine.advanceQuest('alexandria-harmony-quest', {
        answers: answers
      });
      
      // Show quiz results
      this.showQuizResults(answers, result);
      
      if (result.type === 'questProgressed') {
        setTimeout(() => {
          this.handleQuestProgress(result);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  }

  showQuizResults(answers, result) {
    const resultsDiv = document.getElementById('quiz-results');
    const correctCount = answers.filter(a => a.correct).length;
    
    let resultsHTML = `
      <h4>Quiz Results: ${correctCount}/${answers.length} correct</h4>
      <div class="quiz-feedback">
    `;
    
    answers.forEach((answer, index) => {
      resultsHTML += `
        <div class="answer-feedback ${answer.correct ? 'correct' : 'incorrect'}">
          <strong>Question ${index + 1}:</strong> ${answer.correct ? '✅' : '❌'}
          <br><small>${answer.explanation}</small>
        </div>
      `;
    });
    
    resultsHTML += `</div>`;
    
    if (result.validation) {
      resultsHTML += `<p class="result-message">${result.validation.message}</p>`;
    }
    
    resultsDiv.innerHTML = resultsHTML;
  }

  /**
   * Practice methods
   */
  playNote(note) {
    console.log(`🎵 Playing note: ${note}`);
    // Here you could add actual audio playback
    
    const keyElement = document.querySelector(`[data-note="${note}"]`);
    keyElement.style.backgroundColor = '#3498db';
    setTimeout(() => {
      keyElement.style.backgroundColor = '';
    }, 200);
  }

  async playHarmony(notes) {
    console.log(`🎵 Playing harmony: ${notes.join(' + ')}`);
    
    // Visual feedback
    notes.forEach(note => {
      const keyElement = document.querySelector(`[data-note="${note}"]`);
      if (keyElement) {
        keyElement.style.backgroundColor = '#27ae60';
      }
    });
    
    setTimeout(() => {
      notes.forEach(note => {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
          keyElement.style.backgroundColor = '';
        }
      });
    }, 1000);
    
    // Complete the practice step
    try {
      const result = await npcQuestEngine.advanceQuest('alexandria-harmony-quest', {
        playedNotes: notes,
        playedSimultaneously: true
      });
      
      document.getElementById('practice-feedback').innerHTML = `
        <div class="success-message">
          🎻 Beautiful! You played a perfect fifth harmony!
        </div>
      `;
      
      setTimeout(() => {
        this.handleQuestProgress(result);
      }, 2000);
      
    } catch (error) {
      console.error('Error completing practice step:', error);
    }
  }

  /**
   * Handle quest progression
   */
  handleQuestProgress(result) {
    if (result.type === 'questCompleted') {
      this.showQuestCompletion(result);
    } else if (result.type === 'questProgressed') {
      // Move to next step
      this.closeAllDialogs();
      this.showQuestUI(result.quest, result.progress, result.currentStep);
    }
  }

  /**
   * Show quest completion
   */
  showQuestCompletion(result) {
    this.closeAllDialogs();
    
    const completionDialog = this.createDialog('quest-completion');
    const badge = result.rewards[0];
    
    completionDialog.innerHTML = `
      <div class="completion-header">
        <h2>🎉 Quest Complete!</h2>
        <button class="dialog-close" onclick="this.closest('.wavelength-dialog').remove()">×</button>
      </div>
      <div class="completion-content">
        <div class="completion-message">
          <h3>Congratulations!</h3>
          <p>You've successfully completed ${result.quest.title}!</p>
        </div>
        
        <div class="badge-earned">
          <h4>🏆 Badge Earned!</h4>
          <div class="badge-display">
            <img src="${badge.badge.image}" alt="${badge.badge.name}" class="badge-image">
            <div class="badge-info">
              <h5>${badge.badge.name}</h5>
              <p>${badge.badge.description}</p>
            </div>
          </div>
        </div>
        
        <div class="merch-unlock">
          <h4>🛍️ Exclusive Merch Unlocked!</h4>
          <p>Your badge unlocks exclusive merchandise designs in our store!</p>
          <div class="merch-products">
            ${badge.badge.merchUnlock.products.map(product => 
              `<span class="product-tag">${product}</span>`
            ).join('')}
          </div>
        </div>
        
        <div class="completion-actions">
          <button class="btn btn-primary" onclick="window.open('/merchandise?badge=${badge.badge.id}', '_blank')">
            🛍️ Shop Exclusive Design
          </button>
          <button class="btn btn-success" onclick="window.npcUI.showBadgeCollection()">
            🏆 View All Badges
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.wavelength-dialog').remove()">
            Continue Exploring
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(completionDialog);
  }

  /**
   * Show badge collection
   */
  showBadgeCollection() {
    this.closeAllDialogs();
    
    const badges = Array.from(npcQuestEngine.playerState.earnedBadges);
    const dialog = this.createDialog('badge-collection');
    
    dialog.innerHTML = `
      <div class="badge-collection-header">
        <h2>🏆 Your Badge Collection</h2>
        <button class="dialog-close" onclick="this.closest('.wavelength-dialog').remove()">×</button>
      </div>
      <div class="badge-collection-content">
        ${badges.length > 0 ? `
          <div class="badges-grid">
            ${badges.map(badgeId => `
              <div class="collected-badge">
                <img src="/images/badges/${badgeId}.webp" alt="${badgeId}">
                <h5>${badgeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h5>
              </div>
            `).join('')}
          </div>
          <div class="collection-actions">
            <button class="btn btn-primary" onclick="window.open('/merchandise?badges=true', '_blank')">
              🛍️ Shop Badge Exclusives
            </button>
          </div>
        ` : `
          <div class="no-badges">
            <p>No badges earned yet. Complete quests to start your collection!</p>
          </div>
        `}
      </div>
    `;
    
    document.body.appendChild(dialog);
  }

  /**
   * Utility methods
   */
  createDialog(className = 'npc-dialog') {
    const dialog = document.createElement('div');
    dialog.className = `wavelength-dialog ${className}`;
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      z-index: 2000;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      animation: dialogFadeIn 0.3s ease;
    `;
    
    return dialog;
  }

  closeAllDialogs() {
    document.querySelectorAll('.wavelength-dialog').forEach(dialog => {
      dialog.remove();
    });
  }

  showErrorMessage(message) {
    const error = document.createElement('div');
    error.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 3000;
    `;
    error.textContent = message;
    
    document.body.appendChild(error);
    
    setTimeout(() => {
      error.remove();
    }, 3000);
  }
}

// Initialize the system when page loads
document.addEventListener('DOMContentLoaded', function() {
  // DISABLED FOR FRAMEWORK ITERATION - Alexandria quest temporarily disabled
  if (window.location.pathname === '/character/alex' && false) {
    console.log('🌊 Initializing Wavelength NPC Quest System for Alexandria...');
    
    // Register NPCs and quests
    npcQuestEngine.registerNPC('alexandria', alexandriaNPCConfig);
    npcQuestEngine.registerQuest('alexandria-harmony-quest', alexandriaHarmonyQuest);
    
    // Create UI manager
    window.npcUI = new NPCUIManager();
    
    // Create Alexandria NPC on page
    setTimeout(() => {
      window.npcUI.createNPC('alexandria', alexandriaNPCConfig);
    }, 1000);
    
    console.log('🎭 Alexandria is now interactive on this page!');
    console.log('🎯 Click on Alexandria to start her Harmony Challenge!');
  } else if (window.location.pathname === '/character/alex') {
    console.log('🌊 WAVELENGTH NPC QUEST SYSTEM: Framework loaded but quest disabled for iteration');
    console.log('🎯 Revolutionary interactive NPC system ready for development!');
  }
});

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
  @keyframes npcPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes dialogFadeIn {
    from { opacity: 0; transform: translate(-50%, -60%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
  
  .wavelength-npc:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(52, 152, 219, 0.6);
  }
  
  .wavelength-dialog {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .npc-dialog-header, .quest-header, .completion-header, .badge-collection-header {
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    border-radius: 12px 12px 0 0;
  }
  
  .npc-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-size: cover;
    margin-right: 12px;
  }
  
  .npc-name {
    font-size: 1.2em;
    font-weight: bold;
    flex-grow: 1;
  }
  
  .dialog-close {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .npc-dialog-content, .quest-content, .completion-content, .badge-collection-content {
    padding: 20px;
  }
  
  .npc-message {
    font-size: 1.1em;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  
  .quest-preview {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
  }
  
  .quest-meta {
    display: flex;
    gap: 15px;
    margin-top: 10px;
    opacity: 0.8;
  }
  
  .dialog-actions, .completion-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;
  }
  
  .btn-primary { background: #3498db; color: white; }
  .btn-success { background: #27ae60; color: white; }
  .btn-info { background: #17a2b8; color: white; }
  .btn-secondary { background: #6c757d; color: white; }
  
  .btn:hover { opacity: 0.9; transform: translateY(-1px); }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #27ae60, #2ecc71);
    transition: width 0.3s ease;
  }
  
  .step-content h3 {
    color: #2c3e50;
    margin-bottom: 10px;
  }
  
  .lesson-content, .quiz-content, .practice-content {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-top: 15px;
  }
  
  .lesson-text {
    line-height: 1.6;
    margin-bottom: 20px;
  }
  
  .listening-timer {
    background: #e8f6f3;
    padding: 15px;
    border-radius: 6px;
    text-align: center;
  }
  
  .quiz-question {
    margin-bottom: 25px;
  }
  
  .quiz-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
  }
  
  .quiz-option {
    display: flex;
    align-items: center;
    padding: 8px;
    background: white;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .quiz-option input {
    margin-right: 10px;
  }
  
  .quiz-results {
    margin-top: 20px;
    padding: 15px;
    background: #f1f3f4;
    border-radius: 6px;
  }
  
  .answer-feedback {
    padding: 8px;
    margin-bottom: 8px;
    border-radius: 4px;
  }
  
  .answer-feedback.correct {
    background: #d4edda;
    border-left: 4px solid #27ae60;
  }
  
  .answer-feedback.incorrect {
    background: #f8d7da;
    border-left: 4px solid #e74c3c;
  }
  
  .virtual-violin {
    text-align: center;
  }
  
  .violin-keys {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin: 20px 0;
  }
  
  .violin-key {
    width: 40px;
    height: 60px;
    background: white;
    border: 2px solid #333;
    border-radius: 0 0 6px 6px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s ease;
  }
  
  .violin-key:hover {
    background: #f0f0f0;
    transform: translateY(2px);
  }
  
  .harmony-challenge {
    margin-top: 20px;
    padding: 15px;
    background: #e8f4fd;
    border-radius: 6px;
  }
  
  .practice-feedback {
    margin-top: 15px;
  }
  
  .success-message {
    background: #d4edda;
    color: #155724;
    padding: 12px;
    border-radius: 6px;
    text-align: center;
    font-weight: bold;
  }
  
  .badge-display {
    display: flex;
    align-items: center;
    gap: 15px;
    margin: 15px 0;
  }
  
  .badge-image {
    width: 60px;
    height: 60px;
    border-radius: 50%;
  }
  
  .badge-info h5 {
    margin: 0 0 5px 0;
    color: #2c3e50;
  }
  
  .merch-products {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  
  .product-tag {
    background: #3498db;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
  }
  
  .badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .collected-badge {
    text-align: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .collected-badge img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-bottom: 8px;
  }
  
  .collected-badge h5 {
    margin: 0;
    font-size: 12px;
    color: #2c3e50;
  }
`;

document.head.appendChild(style);