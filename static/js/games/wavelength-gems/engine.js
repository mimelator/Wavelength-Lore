/**
 * Wavelength Gems - Match-3 Game Engine
 * Core game logic and mechanics
 */

// Game configuration
const GAME_CONFIG = {
    ROWS: 8,
    COLS: 8,
    GEM_TYPES: ['daphne', 'jasper', 'miles', 'ivy', 'echo', 'atlas'],
    MATCH_MIN: 3,
    BASE_POINTS: 100
};

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
    // Disable global radio game while playing
    if (window.globalRadioGame) {
        window.globalRadioGame.disableGame();
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
 * Swap two gems
 */
function swapGems(row1, col1, row2, col2) {
    gameState.isAnimating = true;

    // Swap in board
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

    // Animate swap
    setTimeout(() => {
        // Check for matches
        const matches = findMatches();

        if (matches.length > 0) {
            // Clear matches
            clearMatches(matches);
            gameState.combo++;
            playSound('match');
        } else {
            // No match - swap back
            [gameState.board[row1][col1], gameState.board[row2][col2]] =
            [gameState.board[row2][col2], gameState.board[row1][col1]];
            playSound('invalid');
        }

        gameState.isAnimating = false;
    }, 200);

    renderBoard();
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
 * Clear matched gems
 */
function clearMatches(matches) {
    // Calculate points
    const basePoints = matches.length * GAME_CONFIG.BASE_POINTS;
    const comboMultiplier = Math.max(1, gameState.combo);
    const pointsEarned = basePoints * comboMultiplier;

    gameState.score += pointsEarned;

    // Remove gems
    matches.forEach(({ row, col }) => {
        gameState.board[row][col] = null;
    });

    renderBoard();

    // Apply gravity
    setTimeout(() => {
        applyGravity();
        fillEmpty();

        // Check for cascade matches
        setTimeout(() => {
            const newMatches = findMatches();
            if (newMatches.length > 0) {
                clearMatches(newMatches);
            } else {
                gameState.combo = 0;
                gameState.isAnimating = false;
                updateUI();
            }
        }, 300);
    }, 200);
}

/**
 * Apply gravity - gems fall down
 */
function applyGravity() {
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        let writePos = GAME_CONFIG.ROWS - 1;

        for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
            if (gameState.board[row][col] !== null) {
                gameState.board[writePos][col] = gameState.board[row][col];
                if (writePos !== row) {
                    gameState.board[row][col] = null;
                }
                writePos--;
            }
        }
    }

    renderBoard();
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
}

/**
 * Render the game board
 */
function renderBoard() {
    const boardElement = document.getElementById('gameBoard');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${GAME_CONFIG.COLS}, 60px)`;

    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const gemType = gameState.board[row][col];
            if (gemType) {
                const gemElement = createGemElement(row, col, gemType);
                boardElement.appendChild(gemElement);
            }
        }
    }
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
