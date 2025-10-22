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
    ANIMATION_DURATION: 300, // Duration of animations in ms
    GOBLIN_IMAGES: [ // Random goblin images for the glitch easter egg
        '/static/images/characters/wavelength/TheBattleOfTheShire-050.webp',
        '/static/images/characters/wavelength/TheBattleOfTheShire-058.webp',
        '/static/images/characters/wavelength/yeti-1.webp',
        '/static/images/characters/wavelength/yeti-2.webp'
    ],
    GOBLIN_MESSAGES: [
        "Goblin mischief detected! 👹",
        "The goblins are at it again!",
        "Pesky goblin interference!",
        "Goblin glitch in progress...",
        "A wild goblin appears!",
        "Goblins in the gemworks!"
    ]
};

// Animation frame tracking
let animationFrames = new Map(); // Map of gem positions to their animation state

// Get responsive gem size based on viewport width
// Calculates size so 8x8 board fits perfectly with gaps
function getGemSize() {
    const width = window.innerWidth;
    const GAP_SIZE = 2; // pixels between gems (reduced from 3)
    const BOARD_PADDING = 6; // pixels padding on board (reduced from 10)
    const CONTAINER_MARGIN = 10; // total page margins/padding (reduced from 20)
    const BORDER_WIDTH = 2; // board border (reduced from 3)

    // Available width = viewport - all constraints
    // Account for: container margins + board padding + board border
    const availableWidth = width - CONTAINER_MARGIN - (BOARD_PADDING * 2) - (BORDER_WIDTH * 2);

    // Formula: (gemSize * 8) + (gap * 7) = availableWidth
    // Solving: gemSize = (availableWidth - (gap * 7)) / 8
    const calculatedGemSize = Math.floor((availableWidth - (GAP_SIZE * 7)) / 8);

    // Clamp between reasonable min/max
    let gemSize = Math.max(32, Math.min(calculatedGemSize, 60));

    console.log(`📏 Viewport: ${width}px | Available: ${availableWidth}px (after margins/padding/border) | Calculated: ${calculatedGemSize}px | Final gem size: ${gemSize}px`);
    return gemSize;
}

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
    animationTimeout: null, // Track animation timeout for failsafe
    gemSize: 60 // Will be set dynamically by getGemSize()
};

/**
 * Initialize a new game
 */
function initGame() {
    // Disable collectibles while playing (keep radio visible)
    if (window.globalRadioGame && window.globalRadioGame.disableCollectiblesOnly) {
        window.globalRadioGame.disableCollectiblesOnly();
    }

    // Set responsive gem size
    gameState.gemSize = getGemSize();
    console.log(`📏 Gem size set to: ${gameState.gemSize}px (viewport width: ${window.innerWidth}px)`);

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
        currentCascadeDepth: 0,
        shouldAnimateNewGems: false, // Flag to control spawn animation
        gemSize: gameState.gemSize // Preserve the dynamically set gem size
    };

    // Apply gem size to CSS on mobile
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            .gem {
                width: ${gameState.gemSize}px !important;
                height: ${gameState.gemSize}px !important;
            }
        }
    `;
    document.head.appendChild(style);
    console.log(`📐 Injected dynamic gem size CSS: ${gameState.gemSize}px`);

    // Debug: Log actual board dimensions after rendering
    setTimeout(() => {
        const boardElement = document.getElementById('gameBoard');
        if (boardElement) {
            const rect = boardElement.getBoundingClientRect();
            console.log(`🎯 Board dimensions: ${rect.width}px wide × ${rect.height}px tall`);
            console.log(`📱 Viewport: ${window.innerWidth}px wide`);
            if (rect.width > window.innerWidth) {
                console.warn(`⚠️ BOARD OVERFLOW: Board (${rect.width}px) exceeds viewport (${window.innerWidth}px) by ${rect.width - window.innerWidth}px`);
            } else {
                console.log(`✅ Board fits within viewport`);
            }
        }
    }, 500);

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
            unhighlightGem(gameState.selectedGem.row, gameState.selectedGem.col);
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
    animateSwap(row1, col1, row2, col2, () => {
        console.log('🔄 Swap animation complete, updating data attributes...');
        // After animation completes, update data attributes to match swapped data
        const gem1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const gem2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        console.log('Found gem1:', gem1 ? `${gem1.dataset.row},${gem1.dataset.col} type=${gem1.dataset.type}` : 'NOT FOUND');
        console.log('Found gem2:', gem2 ? `${gem2.dataset.row},${gem2.dataset.col} type=${gem2.dataset.type}` : 'NOT FOUND');
        console.log('Board expects at [' + row1 + '][' + col1 + ']:', gameState.board[row1][col1]);
        console.log('Board expects at [' + row2 + '][' + col2 + ']:', gameState.board[row2][col2]);
        
        if (gem1) {
            console.log(`Updating gem1 from [${gem1.dataset.row}][${gem1.dataset.col}] to [${row2}][${col2}]`);
            gem1.dataset.row = row2;
            gem1.dataset.col = col2;
        }
        if (gem2) {
            console.log(`Updating gem2 from [${gem2.dataset.row}][${gem2.dataset.col}] to [${row1}][${col1}]`);
            gem2.dataset.row = row1;
            gem2.dataset.col = col1;
        }
        // Don't call renderBoard() here - wait for match detection
        // If there's a match, gravity will handle DOM reordering
        // If no match, swap-back will handle it
    });

    // Check for matches after swap animation
    setTimeout(() => {
        const matches = findMatches();

        if (matches.length > 0) {
            // Found matches - start combo at 1
            gameState.combo = 1;
            gameState.currentCascadeDepth = 0; // Reset cascade depth on new player move
            console.log('🎮 Match found! Combo reset to:', gameState.combo, 'Matches:', matches.length);
            clearAllHighlights(); // Clear highlights before animating matches
            playSound('match');
            highlightMatches(matches); // Highlight matched gems briefly
            setTimeout(() => {
                animateMatches(matches);
            }, 300); // Brief delay to show the match
        } else {
            // No match - swap back with animation
            console.log('❌ No match found, swapping back...');
            console.log('📍 Before swap-back:');
            console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
            console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
            
            // Show shake animation first
            showInvalidSwap(row1, col1, row2, col2);
            
            setTimeout(() => {
                [gameState.board[row1][col1], gameState.board[row2][col2]] =
                [gameState.board[row2][col2], gameState.board[row1][col1]];
                
                console.log('📍 After swap-back:');
                console.log(`  [${row1}][${col1}] = ${gameState.board[row1][col1]}`);
                console.log(`  [${row2}][${col2}] = ${gameState.board[row2][col2]}`);
                console.log('❌ No match. Combo reset to 0');
                
                gameState.combo = 0;
                playSound('invalid');
                animateSwap(row1, col1, row2, col2, () => {
                    // After swap-back animation, update data attributes back
                    const gem1 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
                    const gem2 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
                    if (gem1) {
                        gem1.dataset.row = row1;
                        gem1.dataset.col = col1;
                    }
                    if (gem2) {
                        gem2.dataset.row = row2;
                        gem2.dataset.col = col2;
                    }
                    // Don't call renderBoard() here - board should already be correct
                    // Data attributes are back to original positions after swap-back
                    console.log('🎨 Swap-back complete, data attributes restored');
                    gameState.isAnimating = false;
                
                    // Clear animation timeout
                    if (gameState.animationTimeout) {
                        clearTimeout(gameState.animationTimeout);
                        gameState.animationTimeout = null;
                    }
                    
                    // Clear all visual highlights since swap failed
                    clearAllHighlights();
                    
                    // Verify board consistency
                    setTimeout(() => {
                        verifyBoardConsistency();
                    }, 100);
                });
            }, 400); // Wait for shake animation
        }
    }, GAME_CONFIG.ANIMATION_DURATION);

    // Don't call renderBoard here - let the animation system handle DOM updates
    // renderBoard() will be called after matches are cleared or swap-back completes
}

/**
 * Animate gem swap
 */
function animateSwap(row1, col1, row2, col2, callback) {
    const gem1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
    const gem2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);

    if (!gem1 || !gem2) {
        console.warn('⚠️ Could not find gems for swap animation');
        if (callback) callback();
        return;
    }

    // Calculate the distance to swap using responsive gem size
    const deltaRow = row2 - row1;
    const deltaCol = col2 - col1;
    const gemSize = gameState.gemSize;
    const distance1X = deltaCol * gemSize;
    const distance1Y = deltaRow * gemSize;
    
    // Apply the swap animation with actual movement
    gem1.classList.add('swapping');
    gem2.classList.add('swapping');
    gem1.style.transition = 'transform 0.3s ease-out';
    gem2.style.transition = 'transform 0.3s ease-out';
    gem1.style.transform = `translate(${distance1X}px, ${distance1Y}px)`;
    gem2.style.transform = `translate(${-distance1X}px, ${-distance1Y}px)`;
    
    // After animation, clear transforms and call callback
    setTimeout(() => {
        gem1.classList.remove('swapping');
        gem2.classList.remove('swapping');
        gem1.style.transition = '';
        gem1.style.transform = '';
        gem2.style.transition = '';
        gem2.style.transform = '';
        
        if (callback) callback();
    }, 300);
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
        // Calculate and show points for each match
        const pointsPerGem = 10 * gameState.combo;
        const totalPoints = pointsPerGem * matches.length;
        
        // Show floating points for first gem in match
        if (matches.length > 0) {
            showFloatingPoints(totalPoints, matches[0].row, matches[0].col);
        }
        
        // Update score with animation
        updateScoreAnimated(totalPoints);
        
        // Clear the matched gems from board data
        matches.forEach(({ row, col }) => {
            gameState.board[row][col] = null;
        });

        // Don't call renderBoard() here - matched gems will fade out with animation
        // Gravity will handle removing them and filling spaces

        // Show combo indicator if combo > 1
        if (gameState.combo > 1) {
            showComboIndicator(gameState.combo);
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
    console.log('🎬 animateGravity() called');

    // First, remove any gems that are marked as null in the board (matched gems)
    // This cleans up after the match animation
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (gameState.board[row][col] === null) {
                const gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (gem) {
                    gem.remove();
                    console.log(`🗑️ Removed matched gem at [${row}][${col}]`);
                }
            }
        }
    }

    // Track gem movements BEFORE modifying the board
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
                const fallDistance = writePos - row;

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

    if (movements.length === 0) {
        console.log('📊 No gems need to fall, but checking for empty spaces...');
        gameState.board = newBoard;
        // Don't render yet - wait until after fillEmpty() so no holes appear

        // Still need to fill empty spaces even if nothing fell
        try {
            fillEmpty(); // This will call renderBoard() with new gems

            // Check for cascade matches after filling
            setTimeout(() => {
                gameState.currentCascadeDepth++;

                // Safety check: prevent infinite cascades
                if (gameState.currentCascadeDepth > gameState.maxCascades) {
                    console.warn('⚠️ Maximum cascade depth reached (' + gameState.maxCascades + '), stopping cascades');
                    gameState.isAnimating = false;
                    gameState.combo = 0;
                    gameState.currentCascadeDepth = 0;
                    clearAllHighlights();
                    updateUI();
                    return;
                }

                const newMatches = findMatches();
                if (newMatches.length > 0) {
                    gameState.combo++;
                    console.log('🔄 Cascade match! Combo incremented to:', gameState.combo, 'Cascade depth:', gameState.currentCascadeDepth, 'Matches:', newMatches.length);
                    playSound('match');
                    highlightMatches(newMatches);
                    setTimeout(() => {
                        animateMatches(newMatches);
                    }, 300);
                } else {
                    console.log('✅ No more cascades. Combo final:', gameState.combo, 'Total cascade depth:', gameState.currentCascadeDepth);
                    gameState.combo = 0;
                    gameState.currentCascadeDepth = 0;
                    gameState.isAnimating = false;
                    clearAllHighlights();
                    updateUI();
                }
            }, 400); // Wait for spawn animation

        } catch (error) {
            console.error('❌ Error in fillEmpty:', error);
            gameState.isAnimating = false;
            gameState.combo = 0;
            gameState.currentCascadeDepth = 0;
            updateUI();
        }
        return;
    }

    console.log(`📊 ${movements.length} gems will fall`);

    // Group movements by column for staggered animation
    const columnMovements = {};
    movements.forEach(movement => {
        if (!columnMovements[movement.oldCol]) {
            columnMovements[movement.oldCol] = [];
        }
        columnMovements[movement.oldCol].push(movement);
    });

    // FIRST: Mark ALL gems as falling immediately (before stagger delays)
    movements.forEach(({oldRow, oldCol}) => {
        const gem = document.querySelector(`[data-row="${oldRow}"][data-col="${oldCol}"]`);
        if (gem) {
            gem.classList.add('falling');
        }
    });

    // THEN: Apply CSS transforms with stagger delay per column
    Object.keys(columnMovements).forEach(col => {
        const colIndex = parseInt(col);
        const staggerDelay = colIndex * 30; // 30ms delay per column for waterfall effect

        setTimeout(() => {
            columnMovements[col].forEach(({oldRow, oldCol, newRow, fallDistance}) => {
                const gem = document.querySelector(`[data-row="${oldRow}"][data-col="${oldCol}"]`);
                if (gem) {
                    const fallPixels = fallDistance * gameState.gemSize; // Responsive gem size
                    // .falling class already added above
                    gem.style.transition = 'transform 0.3s ease-out';
                    gem.style.transform = `translateY(${fallPixels}px)`;
                    console.log(`💫 Gem [${oldRow}][${oldCol}] falling ${fallDistance} rows to [${newRow}][${oldCol}]`);
                }
            });
        }, staggerDelay);
    });

    // Calculate total animation time (base animation + stagger delay for last column)
    const maxStaggerDelay = (GAME_CONFIG.COLS - 1) * 30;
    const totalAnimationTime = 300 + maxStaggerDelay;

    // After animation, update board state, fix data attributes, and ensure renderBoard waits for completion
    setTimeout(() => {
        // Update board state FIRST
        gameState.board = newBoard;

        // Update DOM data attributes to match new positions
        // CRITICAL: Update ALL data attributes BEFORE any renderBoard calls
        movements.forEach(({oldRow, oldCol, newRow, newCol}) => {
            const gem = document.querySelector(`[data-row="${oldRow}"][data-col="${oldCol}"]`);
            if (gem) {
                gem.dataset.row = newRow;
                gem.dataset.col = newCol; // FIX: Also update col to maintain proper position mapping
                // Clear transforms and animations immediately to lock gems in place
                gem.style.transform = '';
                gem.style.transition = '';
                gem.classList.remove('falling'); // Remove falling class to unlock from deferred rendering
                console.log(`🔧 Updated data attributes: [${oldRow}][${oldCol}] → [${newRow}][${newCol}]`);
            }
        });

        console.log('✅ Gravity animation complete and data attributes updated');

        // Fill empty spaces with new gems
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

        // Check for cascade matches after filling
        // Extend timeout to ensure fillEmpty() and renderBoard() complete fully
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
                highlightMatches(newMatches); // Highlight before animating
                setTimeout(() => {
                    animateMatches(newMatches);
                }, 300);
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

                // Clear all highlights now that cascades are complete
                clearAllHighlights();

                // Verify board consistency after all animations complete
                setTimeout(() => {
                    verifyBoardConsistency();
                }, 100);

                updateUI();
            }
        }, GAME_CONFIG.ANIMATION_DURATION + 100); // Add extra buffer to ensure renderBoard completes
    }, totalAnimationTime);
}

/**
 * Fill empty spaces with new gems (avoiding immediate matches)
 * Improved to fill bottom-up to ensure all positions are validated correctly
 */
function fillEmpty() {
    let filledCount = 0;
    let nullCount = 0;
    const newlyFilledPositions = []; // Track which positions we fill
    
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
                newlyFilledPositions.push({ row, col });
                filledCount++;
            }
        }
    }
    
    console.log('📦 Filled:', filledCount, 'empty spaces (expected:', nullCount + ') at cascade depth:', gameState.currentCascadeDepth);

    // Set flag to animate new gems, then render
    gameState.shouldAnimateNewGems = true;
    renderBoard();
    gameState.shouldAnimateNewGems = false;
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
 * Intelligently updates only what changed to preserve animations
 */
/**
 * Render the game board
 * Reorders existing gems and adds/removes as needed without flashing
 */
function renderBoard() {
    console.log('🎨 renderBoard() called');
    const boardElement = document.getElementById('gameBoard');

    // Check if any gems are currently animating (spawning, falling, or swapping)
    const spawningGems = boardElement.querySelectorAll('.gem.spawning');
    const fallingGems = boardElement.querySelectorAll('.gem.falling');
    const swappingGems = boardElement.querySelectorAll('.gem.swapping');
    const animatingGems = spawningGems.length + fallingGems.length + swappingGems.length;

    if (animatingGems > 0 && !gameState.shouldAnimateNewGems) {
        // Animating gems exist but this isn't the initial fillEmpty() call
        // Calculate proper wait time based on actual animations
        const hasSpawning = spawningGems.length > 0;
        const hasFalling = fallingGems.length > 0;
        const hasSwapping = swappingGems.length > 0;

        // CRITICAL FIX: After animateGravity completes and clears the 'falling' class,
        // this condition should be false. If still true, wait longer to ensure animations finish.
        // Spawn animation: 400ms
        // Fall animation: 300ms base + up to 210ms stagger (7 cols × 30ms) = 510ms max
        // Swap animation: 300ms
        let waitTime = 100; // Base buffer
        if (hasSpawning) waitTime = Math.max(waitTime, 450); // 400ms spawn + 50ms buffer
        if (hasFalling) waitTime = Math.max(waitTime, 600); // INCREASED: 510ms max fall + 90ms safety margin
        if (hasSwapping) waitTime = Math.max(waitTime, 350); // 300ms swap + 50ms buffer

        console.log(`⏸️ Deferring renderBoard() for ${waitTime}ms - ${spawningGems.length} spawning, ${fallingGems.length} falling, ${swappingGems.length} swapping`);

        // 👹 Show goblin glitch easter egg when new gems spawn (indicates cascade/refill after match)
        if (hasSpawning) {
            console.log('👹 GOBLIN TRIGGER: hasSpawning =', hasSpawning, 'spawning gems:', spawningGems.length);
            showGoblinGlitch();
        }

        setTimeout(() => {
            console.log('⏩ Retrying renderBoard() after animations');
            renderBoard();
        }, waitTime);
        return;
    }

    // Use responsive gem size from gameState
    boardElement.style.gridTemplateColumns = `repeat(${GAME_CONFIG.COLS}, ${gameState.gemSize}px)`;

    // Build target state
    const targetGems = []; // Array of {row, col, type} in correct order
    for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const gemType = gameState.board[row][col];
            if (gemType) {
                targetGems.push({ row, col, type: gemType });
            }
        }
    }
    
    console.log(`🎯 Target: ${targetGems.length} gems expected`);
    
    // Get current gems
    const currentGems = Array.from(boardElement.querySelectorAll('.gem'));
    console.log(`📦 Current: ${currentGems.length} gems in DOM`);
    
    // Create a map of existing gems by position
    const existingGemsMap = new Map();
    currentGems.forEach(gem => {
        const key = `${gem.dataset.row},${gem.dataset.col}`;
        existingGemsMap.set(key, gem);
    });
    
    // Remove gems that shouldn't exist
    currentGems.forEach(gem => {
        const key = `${gem.dataset.row},${gem.dataset.col}`;
        if (!targetGems.find(t => `${t.row},${t.col}` === key)) {
            console.log(`🗑️ Removing gem at ${key} (not in target)`);
            gem.remove();
        }
    });
    
    // Track which gems need spawn animation (used by fillEmpty)
    const newGems = [];
    
    // Now reorder gems - detach all, then reattach in correct order
    let addedCount = 0;
    let typeChangedCount = 0;
    
    // First, remove all gems that need to be repositioned
    const gemsToReorder = [];
    targetGems.forEach((target, targetIndex) => {
        const key = `${target.row},${target.col}`;
        let gem = existingGemsMap.get(key);
        
        if (!gem) {
            // Gem doesn't exist - create it
            console.log(`➕ Creating new gem at [${target.row}][${target.col}] type=${target.type}`);
            gem = createGemElement(target.row, target.col, target.type);
            // Only add spawn animation if this is from fillEmpty
            if (gameState.shouldAnimateNewGems) {
                gem.classList.add('spawning');
                newGems.push(gem);
            }
            addedCount++;
        } else if (gem.dataset.type !== target.type) {
            // Gem exists but wrong type - update it
            console.log(`🔄 Changing gem at [${target.row}][${target.col}] from ${gem.dataset.type} to ${target.type}`);
            const oldType = gem.dataset.type;
            gem.dataset.type = target.type;
            gem.dataset.row = target.row;
            gem.dataset.col = target.col;
            gem.textContent = getGemEmoji(target.type);
            gem.classList.remove(`gem-${oldType}`);
            gem.classList.add(`gem-${target.type}`);
            gem.onclick = function() {
                const clickedRow = parseInt(this.dataset.row);
                const clickedCol = parseInt(this.dataset.col);
                onGemClick(clickedRow, clickedCol);
            };
            typeChangedCount++;
        }
        
        gemsToReorder.push(gem);
    });
    
    console.log(`🧹 Detaching ${gemsToReorder.length} gems to reorder (including ${gemsToReorder.filter(g => g.classList.contains('spawning')).length} spawning)`);
    
    // Detach ALL gems (CSS animations will continue on detached elements)
    gemsToReorder.forEach(gem => {
        if (gem.parentNode) {
            gem.parentNode.removeChild(gem);
        }
    });
    
    // Reattach all gems in correct row-major order
    gemsToReorder.forEach(gem => {
        boardElement.appendChild(gem);
    });
    
    // Clean up animation classes and transforms now that reordering is complete
    gemsToReorder.forEach(gem => {
        gem.classList.remove('falling');
        gem.classList.remove('swapping');
        // Clear any residual transforms from animations
        if (gem.style.transform) gem.style.transform = '';
        if (gem.style.transition) gem.style.transition = '';
        // Keep 'spawning' class for newly created gems
    });
    
    if (addedCount > 0) console.log(`➕ Added ${addedCount} gems`);
    if (typeChangedCount > 0) console.log(`🔄 Changed type of ${typeChangedCount} gems`);
    console.log(`📊 Rendered ${targetGems.length} gems in correct row-major order`);
    console.log('✅ renderBoard() complete');
    console.log('✅ renderBoard() complete');
    
    // Trigger spawn animation for new gems after a small delay
    if (newGems.length > 0) {
        requestAnimationFrame(() => {
            newGems.forEach(gem => {
                // Remove spawn class after animation completes
                setTimeout(() => {
                    gem.classList.remove('spawning');
                }, 400);
            });
        });
    }
    
    // Validate board after rendering
    if (window.validateGame && !gameState.isAnimating) {
        setTimeout(() => window.validateGame(), 50);
    }
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
    // First, clear any existing selections
    document.querySelectorAll('.gem.selected').forEach(gem => {
        gem.classList.remove('selected');
    });
    
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
    
    // Validate highlights after applying
    if (window.validateGame) {
        setTimeout(() => window.validateGame(), 50);
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
    
    // Clear valid targets
    document.querySelectorAll('.valid-target').forEach(gem => {
        gem.classList.remove('valid-target');
    });
}

/**
 * Clear all highlights and selections
 */
function clearAllHighlights() {
    console.log('🧹 Clearing all highlights');
    document.querySelectorAll('.gem.selected').forEach(gem => {
        gem.classList.remove('selected');
    });
    document.querySelectorAll('.gem.valid-target').forEach(gem => {
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
 * Update score with count-up animation
 */
function updateScoreAnimated(points) {
    const oldScore = gameState.score;
    gameState.score += points;
    const newScore = gameState.score;
    
    const scoreElement = document.getElementById('scoreDisplay');
    const duration = 300; // ms
    const steps = 20;
    const increment = (newScore - oldScore) / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
        currentStep++;
        const displayScore = Math.floor(oldScore + (increment * currentStep));
        scoreElement.textContent = displayScore.toLocaleString();
        
        if (currentStep >= steps) {
            clearInterval(interval);
            scoreElement.textContent = newScore.toLocaleString();
        }
    }, stepDuration);
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
        notification.remove();
    }, 3000);
}

/**
 * Highlight matched gems before removal
 */
function highlightMatches(matches) {
    matches.forEach(match => {
        const gem = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
        if (gem) {
            gem.classList.add('matched');
        }
    });
}

/**
 * Show invalid swap animation
 */
function showInvalidSwap(row1, col1, row2, col2) {
    const gem1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
    const gem2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
    
    if (gem1) gem1.classList.add('invalid-swap');
    if (gem2) gem2.classList.add('invalid-swap');
    
    setTimeout(() => {
        if (gem1) gem1.classList.remove('invalid-swap');
        if (gem2) gem2.classList.remove('invalid-swap');
    }, 400);
}

/**
 * Show floating points text
 */
function showFloatingPoints(points, row, col) {
    const boardElement = document.getElementById('gameBoard');
    const gem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (!gem || !boardElement) return;
    
    const rect = gem.getBoundingClientRect();
    const boardRect = boardElement.getBoundingClientRect();
    
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-points';
    floatingText.textContent = `+${points}`;
    floatingText.style.left = `${rect.left - boardRect.left + rect.width/2}px`;
    floatingText.style.top = `${rect.top - boardRect.top}px`;
    
    boardElement.appendChild(floatingText);
    
    setTimeout(() => {
        floatingText.remove();
    }, 1000);
}

/**
 * Show combo multiplier indicator
 */
function showComboIndicator(combo) {
    if (combo <= 1) return;
    
    const boardElement = document.getElementById('gameBoard');
    if (!boardElement) return;
    
    const comboText = document.createElement('div');
    comboText.className = 'combo-indicator';
    
    if (combo === 2) comboText.textContent = 'COMBO! 2x';
    else if (combo === 3) comboText.textContent = 'GREAT! 3x';
    else if (combo === 4) comboText.textContent = 'AMAZING! 4x';
    else comboText.textContent = `MEGA! ${combo}x`;
    
    boardElement.appendChild(comboText);
    
    setTimeout(() => {
        comboText.remove();
    }, 600);
}

/**
 * Show notification
 */
function showNotification_old(message) {
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

/**
 * Show Goblin Glitch Easter Egg
 * "It's not a bug, it's a goblin!" 
 * Appears IN the hole at the bottom of the game board
 */
function showGoblinGlitch() {
    console.log('👹 showGoblinGlitch() called!');
    
    // Get the game board wrapper (parent of the board)
    const boardWrapper = document.querySelector('.game-board-wrapper');
    if (!boardWrapper) {
        console.error('❌ Could not find .game-board-wrapper');
        return;
    }
    
    // Remove any existing goblin
    const existingGoblin = document.querySelector('.goblin-glitch');
    const existingTooltip = document.querySelector('.goblin-tooltip');
    if (existingGoblin) existingGoblin.remove();
    if (existingTooltip) existingTooltip.remove();
    
    // Create goblin container
    const goblin = document.createElement('div');
    goblin.className = 'goblin-glitch';
    
    // Random goblin image
    const randomImage = GAME_CONFIG.GOBLIN_IMAGES[Math.floor(Math.random() * GAME_CONFIG.GOBLIN_IMAGES.length)];
    goblin.innerHTML = `<img src="${randomImage}" alt="Mischievous Goblin">`;
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'goblin-tooltip';
    const randomMessage = GAME_CONFIG.GOBLIN_MESSAGES[Math.floor(Math.random() * GAME_CONFIG.GOBLIN_MESSAGES.length)];
    tooltip.textContent = randomMessage;
    
    // Add to game board wrapper (so it appears over the board)
    boardWrapper.appendChild(goblin);
    boardWrapper.appendChild(tooltip);
    
    console.log('👹 Goblin elements added to DOM');
    
    // Animate in
    requestAnimationFrame(() => {
        goblin.classList.add('active');
        tooltip.classList.add('active');
        console.log('👹 Goblin animated in!');
        
        // Add glitch shake
        setTimeout(() => {
            goblin.classList.add('glitching');
        }, 200);
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        goblin.classList.remove('active', 'glitching');
        tooltip.classList.remove('active');
        
        setTimeout(() => {
            goblin.remove();
            tooltip.remove();
            console.log('👹 Goblin removed');
        }, 500);
    }, 3000);
    
    console.log('👹 Goblin glitch easter egg triggered!');
}
