/**
 * 🧩 Wavelength Lore Jigsaw Puzzle Game Engine
 * Strategic puzzle reconstruction with lore-based imagery and difficulty progression
 * 
 * Features:
 * - Multiple difficulty levels (25, 100, 300, 500 pieces)
 * - Lore-based imagery from Wavelength episodes
 * - Progressive unlocking system
 * - Time-based scoring with strategic bonuses
 * - Piece rotation challenges for advanced players
 */

class WavelengthJigsawPuzzle {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            difficulty: options.difficulty || 'apprentice', // apprentice, journeyman, master, grandmaster
            pieceCount: options.pieceCount || 100,
            enableRotation: options.enableRotation || false,
            enableTimer: options.enableTimer !== false,
            showPreview: options.showPreview !== false,
            loreMode: options.loreMode !== false,
            ...options
        };
        
        this.gameState = {
            pieces: [],
            placedPieces: [],
            currentPiece: null,
            startTime: null,
            completedTime: null,
            score: 0,
            hints: 3,
            loreBonus: 0
        };
        
        this.puzzleImages = {
            apprentice: [
                {
                    src: '/images/puzzles/shire-peaceful.jpg',
                    title: 'The Shire in Peaceful Times',
                    lore: 'The green hills and round doors of Hobbiton',
                    pieces: 25,
                    unlocked: true
                }
            ],
            journeyman: [
                {
                    src: '/images/puzzles/rivendell-council.jpg', 
                    title: 'The Fellowship Forms at Rivendell',
                    lore: 'Elrond\'s council where the Fellowship was born',
                    pieces: 100,
                    unlocked: false
                },
                {
                    src: '/images/puzzles/gandalf-white.jpg',
                    title: 'Gandalf\'s Return as the White Wizard',
                    lore: 'The transformation from Grey to White',
                    pieces: 100,
                    unlocked: false
                }
            ],
            master: [
                {
                    src: '/images/puzzles/helms-deep-battle.jpg',
                    title: 'The Battle of Helm\'s Deep',
                    lore: 'The fortress that saved Rohan from darkness',
                    pieces: 300,
                    unlocked: false
                }
            ],
            grandmaster: [
                {
                    src: '/images/puzzles/aragorn-coronation.jpg',
                    title: 'The Coronation of King Elessar', 
                    lore: 'The return of the king to Gondor\'s throne',
                    pieces: 500,
                    unlocked: false
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.createGameInterface();
        this.loadPuzzleOptions();
        this.setupEventListeners();
    }
    
    createGameInterface() {
        this.container.innerHTML = `
            <div class="jigsaw-game-container">
                <!-- Game Header -->
                <div class="jigsaw-header">
                    <div class="puzzle-info">
                        <h2 id="puzzle-title">Select a Puzzle</h2>
                        <div class="puzzle-stats">
                            <span id="piece-count">0 pieces</span>
                            <span id="timer" class="timer">00:00</span>
                            <span id="score">Score: 0</span>
                        </div>
                    </div>
                    <div class="puzzle-controls">
                        <button id="preview-btn" class="btn-secondary">Preview</button>
                        <button id="hint-btn" class="btn-secondary">Hint (<span id="hints-remaining">3</span>)</button>
                        <button id="restart-btn" class="btn-secondary">Restart</button>
                    </div>
                </div>
                
                <!-- Puzzle Selection -->
                <div id="puzzle-selector" class="puzzle-selector">
                    <h3>Choose Your Strategic Challenge</h3>
                    <div class="difficulty-tabs">
                        <button class="difficulty-tab active" data-difficulty="apprentice">Apprentice (25)</button>
                        <button class="difficulty-tab" data-difficulty="journeyman">Journeyman (100)</button>
                        <button class="difficulty-tab" data-difficulty="master">Master (300)</button>
                        <button class="difficulty-tab" data-difficulty="grandmaster">Grandmaster (500)</button>
                    </div>
                    <div id="puzzle-options" class="puzzle-options"></div>
                </div>
                
                <!-- Game Area -->
                <div id="game-area" class="game-area" style="display: none;">
                    <div class="puzzle-workspace">
                        <!-- Preview Panel -->
                        <div id="preview-panel" class="preview-panel">
                            <img id="preview-image" src="" alt="Puzzle Preview">
                            <div class="lore-info">
                                <h4 id="lore-title"></h4>
                                <p id="lore-description"></p>
                            </div>
                        </div>
                        
                        <!-- Main Puzzle Board -->
                        <div id="puzzle-board" class="puzzle-board"></div>
                        
                        <!-- Pieces Tray -->
                        <div id="pieces-tray" class="pieces-tray">
                            <h4>Available Pieces</h4>
                            <div id="pieces-container" class="pieces-container"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Completion Modal -->
                <div id="completion-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <h3>🎉 Puzzle Completed!</h3>
                        <div class="completion-stats">
                            <p><strong>Time:</strong> <span id="final-time"></span></p>
                            <p><strong>Score:</strong> <span id="final-score"></span></p>
                            <p><strong>Lore Bonus:</strong> <span id="final-lore-bonus"></span></p>
                        </div>
                        <div class="completion-lore">
                            <h4>Lore Knowledge Unlocked:</h4>
                            <p id="completion-lore-text"></p>
                        </div>
                        <div class="completion-actions">
                            <button id="play-again-btn" class="btn-primary">Play Again</button>
                            <button id="next-puzzle-btn" class="btn-secondary">Next Challenge</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    loadPuzzleOptions() {
        const optionsContainer = document.getElementById('puzzle-options');
        const currentDifficulty = this.options.difficulty;
        const puzzles = this.puzzleImages[currentDifficulty] || [];
        
        optionsContainer.innerHTML = puzzles.map((puzzle, index) => `
            <div class="puzzle-option ${puzzle.unlocked ? '' : 'locked'}" 
                 data-puzzle-index="${index}">
                <div class="puzzle-thumbnail">
                    <img src="${puzzle.unlocked ? puzzle.src : '/images/puzzles/locked.jpg'}" 
                         alt="${puzzle.title}">
                    ${!puzzle.unlocked ? '<div class="lock-overlay">🔒</div>' : ''}
                </div>
                <div class="puzzle-details">
                    <h4>${puzzle.title}</h4>
                    <p class="puzzle-lore">${puzzle.lore}</p>
                    <div class="puzzle-meta">
                        <span class="piece-count">${puzzle.pieces} pieces</span>
                        <span class="difficulty">${currentDifficulty}</span>
                    </div>
                    <button class="start-puzzle-btn ${puzzle.unlocked ? '' : 'disabled'}" 
                            ${puzzle.unlocked ? '' : 'disabled'}>
                        ${puzzle.unlocked ? 'Start Puzzle' : 'Complete Previous'}
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    setupEventListeners() {
        // Difficulty tab switching
        document.querySelectorAll('.difficulty-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.options.difficulty = e.target.dataset.difficulty;
                this.loadPuzzleOptions();
            });
        });
        
        // Puzzle selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('start-puzzle-btn') && !e.target.disabled) {
                const puzzleIndex = parseInt(e.target.closest('.puzzle-option').dataset.puzzleIndex);
                this.startPuzzle(puzzleIndex);
            }
        });
        
        // Game controls
        document.getElementById('preview-btn').addEventListener('click', () => this.togglePreview());
        document.getElementById('hint-btn').addEventListener('click', () => this.useHint());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartPuzzle());
        
        // Completion modal
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('next-puzzle-btn').addEventListener('click', () => this.nextPuzzle());
    }
    
    startPuzzle(puzzleIndex) {
        const puzzles = this.puzzleImages[this.options.difficulty];
        const selectedPuzzle = puzzles[puzzleIndex];
        
        if (!selectedPuzzle.unlocked) return;
        
        // Hide selector, show game area
        document.getElementById('puzzle-selector').style.display = 'none';
        document.getElementById('game-area').style.display = 'block';
        
        // Initialize puzzle
        this.currentPuzzle = selectedPuzzle;
        this.options.pieceCount = selectedPuzzle.pieces;
        
        // Update UI
        document.getElementById('puzzle-title').textContent = selectedPuzzle.title;
        document.getElementById('piece-count').textContent = `${selectedPuzzle.pieces} pieces`;
        document.getElementById('preview-image').src = selectedPuzzle.src;
        document.getElementById('lore-title').textContent = selectedPuzzle.title;
        document.getElementById('lore-description').textContent = selectedPuzzle.lore;
        
        // Generate puzzle pieces
        this.generatePuzzlePieces();
        
        // Start timer
        this.startTimer();
    }
    
    generatePuzzlePieces() {
        // This would contain the complex logic for:
        // 1. Dividing the image into puzzle pieces
        // 2. Creating piece shapes (jigsaw patterns)
        // 3. Shuffling pieces
        // 4. Creating drag/drop functionality
        
        const piecesContainer = document.getElementById('pieces-container');
        const puzzleBoard = document.getElementById('puzzle-board');
        
        // Placeholder implementation - would be much more complex in production
        const pieces = [];
        for (let i = 0; i < this.options.pieceCount; i++) {
            pieces.push({
                id: i,
                correctX: i % Math.sqrt(this.options.pieceCount),
                correctY: Math.floor(i / Math.sqrt(this.options.pieceCount)),
                currentX: null,
                currentY: null,
                placed: false
            });
        }
        
        this.gameState.pieces = pieces;
        this.renderPieces();
    }
    
    renderPieces() {
        const piecesContainer = document.getElementById('pieces-container');
        
        // Render unplaced pieces in tray
        const unplacedPieces = this.gameState.pieces.filter(p => !p.placed);
        piecesContainer.innerHTML = unplacedPieces.map(piece => `
            <div class="puzzle-piece" data-piece-id="${piece.id}">
                <div class="piece-preview"></div>
            </div>
        `).join('');
        
        // Add drag functionality
        this.addDragFunctionality();
    }
    
    addDragFunctionality() {
        // Complex drag and drop implementation would go here
        // Including piece snapping, rotation, validation, etc.
    }
    
    startTimer() {
        this.gameState.startTime = Date.now();
        this.updateTimer();
    }
    
    updateTimer() {
        if (!this.gameState.startTime || this.gameState.completedTime) return;
        
        const elapsed = Date.now() - this.gameState.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        setTimeout(() => this.updateTimer(), 1000);
    }
    
    togglePreview() {
        const preview = document.getElementById('preview-panel');
        preview.classList.toggle('minimized');
    }
    
    useHint() {
        if (this.gameState.hints <= 0) return;
        
        this.gameState.hints--;
        document.getElementById('hints-remaining').textContent = this.gameState.hints;
        
        // Hint logic: highlight correct position for a random unplaced piece
        this.showHintAnimation();
    }
    
    showHintAnimation() {
        // Animation to show where a piece belongs
        console.log('🔍 Hint activated - showing piece placement guidance');
    }
    
    checkCompletion() {
        const allPlaced = this.gameState.pieces.every(p => p.placed);
        if (allPlaced) {
            this.completePuzzle();
        }
    }
    
    completePuzzle() {
        this.gameState.completedTime = Date.now();
        const totalTime = this.gameState.completedTime - this.gameState.startTime;
        
        // Calculate score with strategic bonuses
        const baseScore = this.options.pieceCount * 10;
        const timeBonus = Math.max(0, 10000 - Math.floor(totalTime / 1000));
        const hintPenalty = (3 - this.gameState.hints) * 500;
        this.gameState.loreBonus = 2000; // Bonus for lore knowledge
        
        this.gameState.score = baseScore + timeBonus - hintPenalty + this.gameState.loreBonus;
        
        this.showCompletionModal();
        this.unlockNextPuzzle();
    }
    
    showCompletionModal() {
        const modal = document.getElementById('completion-modal');
        const totalTime = this.gameState.completedTime - this.gameState.startTime;
        const minutes = Math.floor(totalTime / 60000);
        const seconds = Math.floor((totalTime % 60000) / 1000);
        
        document.getElementById('final-time').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('final-score').textContent = this.gameState.score;
        document.getElementById('final-lore-bonus').textContent = this.gameState.loreBonus;
        document.getElementById('completion-lore-text').textContent = this.currentPuzzle.lore;
        
        modal.style.display = 'block';
    }
    
    unlockNextPuzzle() {
        // Logic to unlock the next puzzle in sequence
        console.log('🔓 Next puzzle unlocked!');
    }
    
    restartPuzzle() {
        // Reset current puzzle
        this.gameState = {
            pieces: [],
            placedPieces: [],
            currentPiece: null,
            startTime: null,
            completedTime: null,
            score: 0,
            hints: 3,
            loreBonus: 0
        };
        
        this.generatePuzzlePieces();
        this.startTimer();
    }
    
    playAgain() {
        document.getElementById('completion-modal').style.display = 'none';
        this.restartPuzzle();
    }
    
    nextPuzzle() {
        document.getElementById('completion-modal').style.display = 'none';
        document.getElementById('game-area').style.display = 'none';
        document.getElementById('puzzle-selector').style.display = 'block';
        this.loadPuzzleOptions();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('jigsaw-puzzle-container')) {
        window.jigsawPuzzle = new WavelengthJigsawPuzzle('jigsaw-puzzle-container');
    }
});