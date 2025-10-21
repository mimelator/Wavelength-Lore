/**
 * Wavelength Gems - Match-3 Game Engine
 * Core game logic with smooth animations and visual feedback
 */

// Game configuration
const GAME_CONFIG = {
    ROWS: 8,
    COLS: 8,
    GEM_TYPES: ['daphne', 'jasper', 'miles', 'ivy', 'echo', 'atlas'],
    MATCH_MIN: 3,
    BASE_POINTS: 100,
    ANIMATION_DURATION: 300 // Duration of animations in ms
};

// Animation frame tracking
let animationFrames = new Map(); // Map of gem positions to their animation state

// Game state
let gameState = {
    board: [],
    selectedGem: null,
    score: 0,
    level: 1,
    moves: Infinity,
    isPaused: false,
    isAnimating: false,
    soundEnabled: true,
    combo: 0,
    history: []
};

/**
 * Initialize a new game
 */
function initGame() {
    // Disable collectibles while playing (keep radio visible)
    if (window.globalRadioGame && window.globalRadioGame.disableCollectiblesOnly) {
        window.globalRadioGame.disableCollectiblesOnly();
    }

    gameState = {
        board: [],
        selectedGem: null,
        score: 0,
        level: 1,
        moves: Infinity,
        isPaused: false,
        isAnimating: false,
        soundEnabled: true,
        combo: 0,
        history: []
    };

    animationFrames.clear();
    generateBoard();
    renderBoard();
    updateUI();
}

/**
 * Generate initial random board
 */
function generateBoard() {
    gameState.board = [];

    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            let gemType;
            do {
                gemType = getRandomGemType();
            } while (createMatchAt(row, col, gemType));

            gameState.board[row][col] = gemType;
        }
    }
}

/**
 * Check if placing a gem would create an immediate match
 */
function createMatchAt(row, col, gemType) {
    // Check horizontal
    if (col >= 2) {
        if (gameState.board[row][col - 1] === gemType && gameState.board[row][col - 2] === gemType) {
            return true;
        }
    }

    // Check vertical
    if (row >= 2) {
        if (gameState.board[row - 1][col] === gemType && gameState.board[row - 2][col] === gemType) {
            return true;
        }
    }

    return false;
}

/**
 * Get random gem type
 */
function getRandomGemType() {
    return GAME_CONFIG.GEM_TYPES[Math.floor(Math.random() * GAME_CONFIG.GEM_TYPES.length)];
}

/**
 * Handle gem click
 */
function onGemClick(row, col) {
    if (gameState.isAnimating || gameState.isPaused) return;

    if (!gameState.selectedGem) {
        // First selection
        gameState.selectedGem = { row, col };
        highlightGem(row, col);
    } else {
        // Second selection
        const dist = Math.abs(row - gameState.selectedGem.row) + Math.abs(col - gameState.selectedGem.col);

        if (dist === 1) {
            // Adjacent gem - swap
            swapGems(gameState.selectedGem.row, gameState.selectedGem.col, row, col);
            gameState.selectedGem = null;
        } else if (dist === 0) {
            // Same gem - deselect
            unhighlightGem(gameState.selectedGem.row, gameState.selectedGem.col);
            gameState.selectedGem = null;
        } else {
            // Not adjacent - select new gem
            unhighlightGem(gameState.selectedGem.row, gameState.selectedGem.col);
            gameState.selectedGem = { row, col };
            highlightGem(row, col);
        }
    }
}

/**
 * Swap two gems with animation
 */
function swapGems(row1, col1, row2, col2) {
    gameState.isAnimating = true;

    // Swap in board immediately
    [gameState.board[row1][col1], gameState.board[row2][col2]] =
    [gameState.board[row2][col2], gameState.board[row1][col1]];

    // Save to history for undo
    gameState.history.push({
        row1, col1, row2, col2,
        gem1: gameState.board[row1][col1],
        gem2: gameState.board[row2][col2]
    });

    // Decrease moves if not infinite
    if (gameState.moves !== Infinity) {
        gameState.moves--;
    }

    // Render the swap animation
    animateSwap(row1, col1, row2, col2);

    // Check for matches after swap animation
    setTimeout(() => {
        const matches = findMatches();

        if (matches.length > 0) {
            // Found matches - animate them
            gameState.combo++;
            playSound('match');
            animateMatches(matches);
        } else {
            // No match - swap back with animation
            [gameState.board[row1][col1], gameState.board[row2][col2]] =
            [gameState.board[row2][col2], gameState.board[row1][col1]];
            playSound('invalid');
            animateSwap(row1, col1, row2, col2);

            setTimeout(() => {
                gameState.isAnimating = false;
                renderBoard();
            }, GAME_CONFIG.ANIMATION_DURATION);
        }
    }, GAME_CONFIG.ANIMATION_DURATION);

    renderBoard();
}

/**
 * Animate gem swap
 */
function animateSwap(row1, col1, row2, col2) {
    const gem1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
    const gem2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);

    if (gem1) gem1.classList.add('swapping');
    if (gem2) gem2.classList.add('swapping');
}

/**
 * Animate matched gems with explosion effect
 */
function animateMatches(matches) {
    const matchSet = new Set(matches.map(m => `${m.row},${m.col}`));

    // Calculate score for this match
    const matchCount = matches.length;
    const baseScore = GAME_CONFIG.BASE_POINTS * matchCount;
    const comboMultiplier = Math.max(1, gameState.combo);
    const matchScore = baseScore * comboMultiplier;

    // Update game score
    gameState.score += matchScore;

    matches.forEach(({ row, col }) => {
        const gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (gem) {
            gem.classList.add('matching');
            // Show score popup from this gem's position
            showScorePopup(gem, matchScore / matches.length);
        }
    });

    setTimeout(() => {
        // Clear the matched gems
        matches.forEach(({ row, col }) => {
            gameState.board[row][col] = null;
        });

        renderBoard();

        // Show combo indicator if combo > 1
        if (gameState.combo > 1) {
            showComboIndicator();
        }

        // Apply gravity and fill empty spaces
        setTimeout(() => {
            animateGravity();
        }, 100);
    }, GAME_CONFIG.ANIMATION_DURATION);
}

/**
 * Show floating score popup from gem position
 */
function showScorePopup(gemElement, points) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+' + Math.round(points);

    const rect = gemElement.getBoundingClientRect();
    popup.style.left = (rect.left + rect.width / 2) + 'px';
    popup.style.top = (rect.top + rect.height / 2) + 'px';
    popup.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(popup);

    // Remove after animation
    setTimeout(() => popup.remove(), 800);
}

/**
 * Show combo multiplier indicator
 */
function showComboIndicator() {
    // Remove existing indicator
    const existing = document.querySelector('.combo-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = 'combo-indicator';
    indicator.innerHTML = `<div class="combo-text">COMBO x${gameState.combo}!</div>`;

    document.body.appendChild(indicator);

    // Remove after animation
    setTimeout(() => indicator.remove(), 400);
}

/**
 * Animate gravity - gems falling down
 */
function animateGravity() {
    // Track gem movements: oldPos -> newPos with fall distance
    const movements = []; // Array of {oldRow, oldCol, newRow, newCol, gemType, fallDistance}

    // Calculate gravity and track movement
    const newBoard = [];
    for (let i = 0; i < GAME_CONFIG.ROWS; i++) {
        newBoard[i] = [];
    }

    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        let writePos = GAME_CONFIG.ROWS - 1;

        for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
            if (gameState.board[row][col] !== null) {
                const gemType = gameState.board[row][col];
                const fallDistance = row - writePos;

                if (fallDistance > 0) {
                    // Track this gem's movement
                    movements.push({
                        oldRow: row,
                        oldCol: col,
                        newRow: writePos,
                        newCol: col,
                        gemType,
                        fallDistance
                    });
                }

                newBoard[writePos][col] = gemType;
                writePos--;
            }
        }
    }

    // Update board state
    gameState.board = newBoard;

    // First, position all falling gems at their ORIGINAL positions
    movements.forEach(({oldRow, oldCol, newRow, newCol, gemType, fallDistance}) => {
        let gem = document.querySelector(`[data-row="${oldRow}"][data-col="${oldCol}"]`);
        if (!gem) {
            // Create gem element if it doesn't exist
            gem = createGemElement(oldRow, oldCol, gemType);
            document.getElementById('gameBoard').appendChild(gem);
        }
        gem.dataset.row = oldRow;
        gem.dataset.col = oldCol;
        gem.classList.remove('falling');
        gem.style.animationDuration = '';
    });

    // Force a reflow to ensure initial state is rendered
    void document.getElementById('gameBoard').offsetHeight;

    // Now render the final positions and trigger animations
    renderBoard();

    // Apply falling animation to moved gems
    movements.forEach(({oldRow, oldCol, newRow, newCol, gemType, fallDistance}) => {
        const gem = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (gem) {
            gem.classList.add('falling');
            // Adjust animation timing based on distance
            const duration = Math.min(150 + (fallDistance * 40), 450);
            gem.style.animationDuration = (duration / 1000) + 's';
        }
    });

    // Fill empty spaces with new gems
    setTimeout(() => {
        fillEmpty();

        // Check for cascade matches after animation
        setTimeout(() => {
            const newMatches = findMatches();
            if (newMatches.length > 0) {
                gameState.combo++;
                playSound('match');
                animateMatches(newMatches);
            } else {
                gameState.combo = 0;
                gameState.isAnimating = false;
                updateUI();
            }
        }, GAME_CONFIG.ANIMATION_DURATION);
    }, GAME_CONFIG.ANIMATION_DURATION);
}

/**
 * Fill empty spaces with new gems
 */
function fillEmpty() {
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            if (gameState.board[row][col] === null) {
                gameState.board[row][col] = getRandomGemType();
            }
        }
    }

    renderBoard();

    // Add spawn animation to new gems
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            const gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (gem && !gem.classList.contains('falling')) {
                gem.classList.add('spawning');
            }
        }
    }
}

/**
 * Find all matches on the board
 */
function findMatches() {
    const matches = [];
    const visited = new Set();

    // Check horizontal matches
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS - 2; col++) {
            const gem = gameState.board[row][col];
            if (gem === gameState.board[row][col + 1] && gem === gameState.board[row][col + 2]) {
                const matchCells = [];
                for (let i = col; i < GAME_CONFIG.COLS && gameState.board[row][i] === gem; i++) {
                    const key = `${row},${i}`;
                    if (!visited.has(key)) {
                        matchCells.push({ row, col: i });
                        visited.add(key);
                    }
                }
                if (matchCells.length >= GAME_CONFIG.MATCH_MIN) {
                    matches.push(...matchCells);
                }
            }
        }
    }

    // Check vertical matches
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        for (let row = 0; row < GAME_CONFIG.ROWS - 2; row++) {
            const gem = gameState.board[row][col];
            if (gem === gameState.board[row + 1][col] && gem === gameState.board[row + 2][col]) {
                const matchCells = [];
                for (let i = row; i < GAME_CONFIG.ROWS && gameState.board[i][col] === gem; i++) {
                    const key = `${i},${col}`;
                    if (!visited.has(key)) {
                        matchCells.push({ row: i, col });
                        visited.add(key);
                    }
                }
                if (matchCells.length >= GAME_CONFIG.MATCH_MIN) {
                    matches.push(...matchCells);
                }
            }
        }
    }

    return matches;
}

/**
 * Render the game board
 */
function renderBoard() {
    const boardElement = document.getElementById('gameBoard');
    boardElement.style.gridTemplateColumns = `repeat(${GAME_CONFIG.COLS}, 60px)`;

    // Create a map of current gems on the board
    const boardMap = new Map();
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const gemType = gameState.board[row][col];
            if (gemType) {
                boardMap.set(`${row},${col}`, gemType);
            }
        }
    }

    // Remove gems that are no longer on the board
    const currentGems = boardElement.querySelectorAll('.gem');
    currentGems.forEach(gem => {
        const row = gem.dataset.row;
        const col = gem.dataset.col;
        const key = `${row},${col}`;

        if (!boardMap.has(key) || boardMap.get(key) !== gem.dataset.type) {
            gem.remove();
        }
    });

    // Add or update gems on the board
    boardMap.forEach((gemType, key) => {
        const [row, col] = key.split(',');
        let gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

        if (!gem) {
            gem = createGemElement(parseInt(row), parseInt(col), gemType);
            boardElement.appendChild(gem);
        }
    });
}

/**
 * Create a gem DOM element
 */
function createGemElement(row, col, gemType) {
    const gem = document.createElement('div');
    gem.className = `gem gem-${gemType}`;
    gem.textContent = getGemEmoji(gemType);
    gem.onclick = () => onGemClick(row, col);
    gem.dataset.row = row;
    gem.dataset.col = col;
    gem.dataset.type = gemType;
    return gem;
}

/**
 * Get emoji for gem type
 */
function getGemEmoji(gemType) {
    const emojis = {
        'daphne': '💜',
        'jasper': '💙',
        'miles': '💚',
        'ivy': '💕',
        'echo': '🧡',
        'atlas': '💎'
    };
    return emojis[gemType] || '✨';
}

/**
 * Highlight selected gem
 */
function highlightGem(row, col) {
    const gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (gem) {
        gem.classList.add('selected');
    }
}

/**
 * Unhighlight gem
 */
function unhighlightGem(row, col) {
    const gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (gem) {
        gem.classList.remove('selected');
    }
}

/**
 * Toggle pause
 */
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.textContent = gameState.isPaused ? '▶ Resume' : '⏸ Pause';
}

/**
 * Toggle sound
 */
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundBtn = document.getElementById('soundBtn');
    soundBtn.textContent = gameState.soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
}

/**
 * Play sound effect
 */
function playSound(type) {
    if (!gameState.soundEnabled) return;

    // Create audio context for simple beep sounds
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (type) {
            case 'match':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'invalid':
                oscillator.frequency.value = 300;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
        }
    } catch (e) {
        console.log('Audio not available');
    }
}

/**
 * Update UI displays
 */
function updateUI() {
    document.getElementById('scoreDisplay').textContent = gameState.score.toLocaleString();
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('movesDisplay').textContent = gameState.moves === Infinity ? '∞' : gameState.moves;
}

/**
 * Submit score to Firebase
 */
async function submitScoreToFirebase() {
    try {
        const token = await getFirebaseToken();
        if (!token) {
            console.log('No auth token available, skipping score submission');
            return;
        }

        const response = await fetch('/api/games/scores/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                gameId: 'wavelength-gems',
                score: gameState.score,
                level: gameState.level,
                combo: gameState.combo,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();
        if (data.success) {
            console.log('Score submitted successfully', data);
            if (data.newHighScore) {
                showNotification('🎉 New high score!');
            }
        } else {
            console.error('Failed to submit score:', data.error);
        }
    } catch (error) {
        console.error('Error submitting score:', error);
    }
}

/**
 * Get Firebase ID token
 */
async function getFirebaseToken() {
    try {
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            return await window.firebaseAuth.currentUser.getIdToken();
        }
    } catch (error) {
        console.error('Error getting Firebase token:', error);
    }
    return null;
}

/**
 * Load user stats from Firebase
 */
async function loadUserStats() {
    try {
        const token = await getFirebaseToken();
        if (!token) return;

        const response = await fetch('/api/games/wavelength-gems/user-stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            gameState.userStats = data.stats;
            console.log('User stats loaded:', data.stats);
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

/**
 * Show notification
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #8b5cf6, #6366f1);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * End game and submit score
 */
function endGame() {
    gameState.isPaused = true;
    submitScoreToFirebase();
}
