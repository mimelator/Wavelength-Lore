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
    history: [],
    maxCascades: 10, // Maximum cascade depth to prevent infinite loops
    currentCascadeDepth: 0,
    animationTimeout: null // Track animation timeout for failsafe
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
        history: [],
        maxCascades: 10,
        currentCascadeDepth: 0
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
 * Improved to check all four directions (left, right, up, down)
 * Only checks positions that have already been filled
 */
function createMatchAt(row, col, gemType) {
    const board = gameState.board;
    
    // Safety check: ensure row exists
    if (!board[row]) return false;
    
    // Check horizontal (left side) - only if positions exist
    if (col >= 2 && board[row][col - 1] && board[row][col - 2]) {
        if (board[row][col - 1] === gemType && board[row][col - 2] === gemType) {
            return true;
        }
    }
    
    // Check horizontal (right side) - only if positions exist
    if (col <= GAME_CONFIG.COLS - 3 && board[row][col + 1] && board[row][col + 2]) {
        if (board[row][col + 1] === gemType && board[row][col + 2] === gemType) {
            return true;
        }
    }
    
    // Check horizontal (middle) - only if positions exist
    if (col >= 1 && col <= GAME_CONFIG.COLS - 2 && board[row][col - 1] && board[row][col + 1]) {
        if (board[row][col - 1] === gemType && board[row][col + 1] === gemType) {
            return true;
        }
    }

    // Check vertical (top side) - only if positions exist
    if (row >= 2 && board[row - 1] && board[row - 2]) {
        if (board[row - 1][col] === gemType && board[row - 2][col] === gemType) {
            return true;
        }
    }
    
    // Check vertical (bottom side) - only if positions exist
    if (row <= GAME_CONFIG.ROWS - 3 && board[row + 1] && board[row + 2]) {
        if (board[row + 1][col] === gemType && board[row + 2][col] === gemType) {
            return true;
        }
    }
    
    // Check vertical (middle) - only if positions exist
    if (row >= 1 && row <= GAME_CONFIG.ROWS - 2 && board[row - 1] && board[row + 1]) {
        if (board[row - 1][col] === gemType && board[row + 1][col] === gemType) {
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
    // Find the gem element to verify its actual position
    const gemElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    const actualRow = gemElement ? gemElement.dataset.row : 'NOT FOUND';
    const actualCol = gemElement ? gemElement.dataset.col : 'NOT FOUND';
    const actualType = gemElement ? gemElement.dataset.type : 'NOT FOUND';
    
    // Get the gem's position in the DOM (for CSS Grid debugging)
    const allGems = Array.from(document.querySelectorAll('.gem'));
    const domIndex = gemElement ? allGems.indexOf(gemElement) : -1;
    const expectedIndex = row * GAME_CONFIG.COLS + col; // Expected index for row-major order
    
    console.log(`🖱️ Click: [${row}][${col}] | Gem data-attrs: [${actualRow}][${actualCol}] type=${actualType} | DOM index: ${domIndex} (expected: ${expectedIndex}) | isAnimating: ${gameState.isAnimating}, isPaused: ${gameState.isPaused}`);
    
    if (gameState.isAnimating || gameState.isPaused) {
        console.log('⏸️ Click blocked -', gameState.isAnimating ? 'animating' : 'paused');
        return;
    }

    if (!gameState.selectedGem) {
        // First selection
        gameState.selectedGem = { row, col };
        highlightGem(row, col);
        console.log('✅ First gem selected:', row, col);
    } else {
        // Second selection
        const dist = Math.abs(row - gameState.selectedGem.row) + Math.abs(col - gameState.selectedGem.col);

        if (dist === 1) {
            // Adjacent gem - swap
            console.log('🔄 Swapping gems:', gameState.selectedGem, 'with', {row, col});
            swapGems(gameState.selectedGem.row, gameState.selectedGem.col, row, col);
            gameState.selectedGem = null;
        } else if (dist === 0) {
            // Same gem - deselect
            unhighlightGem(gameState.selectedGem.row, gameState.selectedGem.col);
            gameState.selectedGem = null;
            console.log('❌ Deselected gem');
        } else {
            // Not adjacent - select new gem
            console.log(`⚠️ Gems not adjacent! Distance: ${dist} (from [${gameState.selectedGem.row}][${gameState.selectedGem.col}] to [${row}][${col}])`);
            unhighlightGem(gameState.selectedGem.row, gameState.selectedGem.col);
            gameState.selectedGem = { row, col };
            highlightGem(row, col);
            console.log('🔄 Changed selection to:', row, col);
        }
    }
}

/**
 * Swap two gems with animation
 */
function swapGems(row1, col1, row2, col2) {
    console.log('🔄 Starting swap:', {row1, col1, row2, col2});
    
    // Capture board state before swap
    const beforeSwap = createBoardSnapshot('Before Swap');
    
    console.log('📍 Before swap:');
    console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
    console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
    
    gameState.isAnimating = true;
    
    // Clear any existing animation timeout
    if (gameState.animationTimeout) {
        clearTimeout(gameState.animationTimeout);
    }
    
    // Failsafe: if animation doesn't complete in 10 seconds, force reset
    gameState.animationTimeout = setTimeout(() => {
        console.error('⚠️ Animation timeout! Forcing isAnimating = false');
        gameState.isAnimating = false;
        gameState.combo = 0;
        gameState.currentCascadeDepth = 0;
        gameState.animationTimeout = null;
        updateUI();
    }, 10000);

    // Swap in board immediately
    [gameState.board[row1][col1], gameState.board[row2][col2]] =
    [gameState.board[row2][col2], gameState.board[row1][col1]];
    
    console.log('📍 After swap:');
    console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
    console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
    console.log('🎨 Calling renderBoard()...');
    
    // Capture board state after swap
    const afterSwap = createBoardSnapshot('After Swap');
    compareBoardSnapshots(beforeSwap, afterSwap);

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
            // Found matches - start combo at 1
            gameState.combo = 1;
            gameState.currentCascadeDepth = 0; // Reset cascade depth on new player move
            console.log('🎮 Match found! Combo reset to:', gameState.combo, 'Matches:', matches.length);
            playSound('match');
            animateMatches(matches);
        } else {
            // No match - swap back with animation
            console.log('❌ No match found, swapping back...');
            console.log('📍 Before swap-back:');
            console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
            console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
            
            [gameState.board[row1][col1], gameState.board[row2][col2]] =
            [gameState.board[row2][col2], gameState.board[row1][col1]];
            
            console.log('📍 After swap-back:');
            console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
            console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
            console.log('❌ No match. Combo reset to 0');
            
            gameState.combo = 0;
            playSound('invalid');
            animateSwap(row1, col1, row2, col2);

            setTimeout(() => {
                console.log('🎨 Calling renderBoard() after swap-back...');
                gameState.isAnimating = false;
                
                // Clear animation timeout
                if (gameState.animationTimeout) {
                    clearTimeout(gameState.animationTimeout);
                    gameState.animationTimeout = null;
                }
                
                // Verify board consistency
                setTimeout(() => {
                    verifyBoardConsistency();
                }, 100);
                
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

    console.log('🎊 Showing combo indicator:', gameState.combo);

    // Remove after animation (400ms for animation + 100ms display time)
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, 500);
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
        for (let j = 0; j < GAME_CONFIG.COLS; j++) {
            newBoard[i][j] = null; // Initialize all positions to null
        }
    }

    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
        let writePos = GAME_CONFIG.ROWS - 1;

        for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
            if (gameState.board[row][col] !== null) {
                const gemType = gameState.board[row][col];
                const fallDistance = writePos - row; // Fixed: should be writePos - row, not row - writePos

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

    // Render the board with updated positions
    // This ensures DOM data attributes match the internal board state
    renderBoard();

    // Apply falling animation to moved gems
    movements.forEach(({newRow, newCol, fallDistance}) => {
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
        try {
            fillEmpty();
        } catch (error) {
            console.error('❌ Error in fillEmpty:', error);
            // Recover by setting isAnimating to false
            gameState.isAnimating = false;
            gameState.combo = 0;
            gameState.currentCascadeDepth = 0;
            updateUI();
            return;
        }

        // Check for cascade matches after animation
        setTimeout(() => {
            // Increment cascade depth
            gameState.currentCascadeDepth++;
            
            // Safety check: prevent infinite cascades
            if (gameState.currentCascadeDepth > gameState.maxCascades) {
                console.warn('⚠️ Maximum cascade depth reached (' + gameState.maxCascades + '), stopping cascades');
                gameState.combo = 0;
                gameState.currentCascadeDepth = 0;
                gameState.isAnimating = false;
                
                // Clear animation timeout
                if (gameState.animationTimeout) {
                    clearTimeout(gameState.animationTimeout);
                    gameState.animationTimeout = null;
                }
                
                updateUI();
                return;
            }
            
            const newMatches = findMatches();
            if (newMatches.length > 0) {
                gameState.combo++;
                console.log('🔄 Cascade match! Combo incremented to:', gameState.combo, 'Cascade depth:', gameState.currentCascadeDepth, 'Matches:', newMatches.length);
                playSound('match');
                animateMatches(newMatches);
            } else {
                console.log('✅ No more cascades. Combo final:', gameState.combo, 'Total cascade depth:', gameState.currentCascadeDepth);
                gameState.combo = 0;
                gameState.currentCascadeDepth = 0;
                gameState.isAnimating = false;
                
                // Clear animation timeout since we're done
                if (gameState.animationTimeout) {
                    clearTimeout(gameState.animationTimeout);
                    gameState.animationTimeout = null;
                }
                
                // Verify board consistency after all animations complete
                setTimeout(() => {
                    verifyBoardConsistency();
                }, 100);
                
                updateUI();
            }
        }, GAME_CONFIG.ANIMATION_DURATION);
    }, GAME_CONFIG.ANIMATION_DURATION);
}

/**
 * Fill empty spaces with new gems (avoiding immediate matches)
 * Improved to fill bottom-up to ensure all positions are validated correctly
 */
function fillEmpty() {
    let filledCount = 0;
    let nullCount = 0;
    
    // First, count how many null positions we have
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (gameState.board[row][col] === null) {
                nullCount++;
            }
        }
    }
    
    console.log('🔍 fillEmpty starting: found', nullCount, 'null positions');
    
    // Fill from bottom to top, left to right to ensure proper validation
    for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (gameState.board[row][col] === null) {
                // Avoid creating immediate matches
                let gemType;
                let attemptCount = 0;
                const maxAttempts = GAME_CONFIG.GEM_TYPES.length * 10; // More reasonable max attempts
                
                do {
                    gemType = getRandomGemType();
                    attemptCount++;
                    
                    if (attemptCount > maxAttempts) {
                        // Emergency fallback: try each gem type sequentially
                        for (let i = 0; i < GAME_CONFIG.GEM_TYPES.length; i++) {
                            gemType = GAME_CONFIG.GEM_TYPES[i];
                            if (!createMatchAt(row, col, gemType)) {
                                break;
                            }
                        }
                        console.warn('⚠️ fillEmpty: Using fallback gem selection at [' + row + '][' + col + ']');
                        break;
                    }
                } while (createMatchAt(row, col, gemType));
                
                gameState.board[row][col] = gemType;
                filledCount++;
            }
        }
    }
    
    console.log('📦 Filled:', filledCount, 'empty spaces (expected:', nullCount + ') at cascade depth:', gameState.currentCascadeDepth);

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
    console.log('🎨 renderBoard() called');
    const boardElement = document.getElementById('gameBoard');
    boardElement.style.gridTemplateColumns = `repeat(${GAME_CONFIG.COLS}, 60px)`;

    // Clear the entire board and rebuild in correct order
    // This ensures CSS Grid displays gems in the right visual positions
    boardElement.innerHTML = '';
    
    let gemCount = 0;
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const gemType = gameState.board[row][col];
            if (gemType) {
                const gem = createGemElement(row, col, gemType);
                boardElement.appendChild(gem);
                gemCount++;
            }
        }
    }
    
    console.log(`📊 Rendered ${gemCount} gems in correct grid order`);
    console.log('✅ renderBoard() complete');
}

/**
 * Create a gem DOM element
 */
function createGemElement(row, col, gemType) {
    const gem = document.createElement('div');
    gem.className = `gem gem-${gemType}`;
    gem.textContent = getGemEmoji(gemType);
    // Use event.target to get coordinates from data attributes at click time
    gem.onclick = function() {
        const clickedRow = parseInt(this.dataset.row);
        const clickedCol = parseInt(this.dataset.col);
        onGemClick(clickedRow, clickedCol);
    };
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
        console.log(`⭐ Highlighted gem at [${row}][${col}]`);
    } else {
        console.log(`❌ Could not find gem to highlight at [${row}][${col}]`);
    }
    
    // Highlight valid adjacent targets
    highlightValidTargets(row, col);
}

/**
 * Highlight valid adjacent gems that can be swapped with
 */
function highlightValidTargets(row, col) {
    // Clear any existing valid targets
    document.querySelectorAll('.valid-target').forEach(gem => {
        gem.classList.remove('valid-target');
    });
    
    // Highlight adjacent gems (up, down, left, right)
    const adjacents = [
        { row: row - 1, col: col, dir: 'up' },
        { row: row + 1, col: col, dir: 'down' },
        { row: row, col: col - 1, dir: 'left' },
        { row: row, col: col + 1, dir: 'right' }
    ];
    
    let highlightedCount = 0;
    const highlightedPositions = [];
    const notFoundPositions = [];
    
    adjacents.forEach(({ row: r, col: c, dir }) => {
        if (r >= 0 && r < GAME_CONFIG.ROWS && c >= 0 && c < GAME_CONFIG.COLS) {
            const adjacentGem = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (adjacentGem) {
                adjacentGem.classList.add('valid-target');
                highlightedCount++;
                highlightedPositions.push(`${dir}:[${r}][${c}]`);
                
                // Debug: Check computed styles
                const computedStyle = window.getComputedStyle(adjacentGem);
                const hasClass = adjacentGem.classList.contains('valid-target');
                console.log(`  🎨 ${dir}:[${r}][${c}] class=${hasClass}, animation=${computedStyle.animation}, border=${computedStyle.border}`);
            } else {
                notFoundPositions.push(`${dir}:[${r}][${c}] NOT FOUND`);
            }
        }
    });
    
    console.log(`💚 Highlighted ${highlightedCount} valid targets around [${row}][${col}]: ${highlightedPositions.join(', ')}`);
    if (notFoundPositions.length > 0) {
        console.log(`❌ Could not find gems at: ${notFoundPositions.join(', ')}`);
    }
    
    // Final verification: count how many .valid-target elements exist
    const validTargets = document.querySelectorAll('.valid-target');
    console.log(`✅ Total .valid-target elements in DOM: ${validTargets.length}`);
}

/**
 * Unhighlight gem
 */
function unhighlightGem(row, col) {
    const gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (gem) {
        gem.classList.remove('selected');
    }
    
    // Clear valid targets
    document.querySelectorAll('.valid-target').forEach(gem => {
        gem.classList.remove('valid-target');
    });
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
 * Debug: Print board state to console
 */
function debugBoardState() {
    console.log('=== BOARD STATE DEBUG ===');
    console.log('Visual board layout:');
    
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        let rowStr = `Row ${row}: `;
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const gemType = gameState.board[row][col];
            const emoji = getGemEmoji(gemType);
            rowStr += emoji + ' ';
        }
        console.log(rowStr);
    }
    
    console.log('\nInternal board data:');
    console.table(gameState.board);
    
    console.log('\nDOM elements:');
    const gems = document.querySelectorAll('.gem');
    console.log(`Total DOM gems: ${gems.length}`);
    
    console.log('\nDOM Order Check (for CSS Grid):');
    const allGems = Array.from(gems);
    allGems.forEach((gem, domIndex) => {
        const row = parseInt(gem.dataset.row);
        const col = parseInt(gem.dataset.col);
        const type = gem.dataset.type;
        const expectedIndex = row * GAME_CONFIG.COLS + col;
        const orderMatch = domIndex === expectedIndex ? '✅' : '❌';
        const internalType = gameState.board[row] ? gameState.board[row][col] : 'undefined';
        const typeMatch = type === internalType ? '✅' : '❌';
        console.log(`${orderMatch} DOM[${domIndex}]: data=[${row}][${col}]=${type} (exp.idx:${expectedIndex}) Internal=${internalType} ${typeMatch}`);
    });
    
    console.log('========================');
}

/**
 * Create a snapshot of the current board for debugging
 */
function createBoardSnapshot(label) {
    const snapshot = {
        label: label,
        timestamp: new Date().toISOString(),
        internalBoard: gameState.board.map(row => [...row]),
        domGems: []
    };
    
    const gems = document.querySelectorAll('.gem');
    gems.forEach(gem => {
        snapshot.domGems.push({
            row: parseInt(gem.dataset.row),
            col: parseInt(gem.dataset.col),
            type: gem.dataset.type
        });
    });
    
    return snapshot;
}

/**
 * Compare two board snapshots
 */
function compareBoardSnapshots(before, after) {
    console.log(`\n=== COMPARING: ${before.label} → ${after.label} ===`);
    
    // Compare internal boards
    let internalChanges = 0;
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const beforeVal = before.internalBoard[row][col];
            const afterVal = after.internalBoard[row][col];
            if (beforeVal !== afterVal) {
                console.log(`  Internal[${row}][${col}]: ${beforeVal} → ${afterVal}`);
                internalChanges++;
            }
        }
    }
    
    console.log(`Total internal changes: ${internalChanges}`);
    console.log(`DOM gems before: ${before.domGems.length}, after: ${after.domGems.length}`);
    console.log('====================================\n');
}

// Expose debug functions globally
window.debugBoardState = debugBoardState;
window.createBoardSnapshot = createBoardSnapshot;
window.compareBoardSnapshots = compareBoardSnapshots;

/**
 * Verify board consistency between DOM and internal state
 * Returns true if consistent, false if there are mismatches
 */
function verifyBoardConsistency() {
    let isConsistent = true;
    const errors = [];
    
    // Check all positions in internal board
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const internalGem = gameState.board[row][col];
            const domGem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            
            if (internalGem !== null) {
                // Internal board has a gem at this position
                if (!domGem) {
                    errors.push(`❌ Missing DOM element at [${row}][${col}] (should be ${internalGem})`);
                    isConsistent = false;
                } else if (domGem.dataset.type !== internalGem) {
                    errors.push(`❌ Mismatch at [${row}][${col}]: DOM=${domGem.dataset.type}, Internal=${internalGem}`);
                    isConsistent = false;
                }
            } else {
                // Internal board has null at this position
                if (domGem) {
                    errors.push(`❌ Unexpected DOM element at [${row}][${col}] (type=${domGem.dataset.type}, should be null)`);
                    isConsistent = false;
                }
            }
        }
    }
    
    // Check for DOM gems with wrong coordinates
    const allDomGems = document.querySelectorAll('.gem');
    allDomGems.forEach(gem => {
        const row = parseInt(gem.dataset.row);
        const col = parseInt(gem.dataset.col);
        
        if (isNaN(row) || isNaN(col)) {
            errors.push(`❌ Invalid coordinates on DOM gem: row=${gem.dataset.row}, col=${gem.dataset.col}`);
            isConsistent = false;
        }
    });
    
    if (!isConsistent) {
        console.error('⚠️ BOARD CONSISTENCY CHECK FAILED:');
        errors.forEach(err => console.error(err));
        debugBoardState();
    } else {
        console.log('✅ Board consistency verified');
    }
    
    return isConsistent;
}

// Expose debug functions globally
window.debugBoardState = debugBoardState;
window.verifyBoardConsistency = verifyBoardConsistency;

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
