/**
 * Wavelength Gems - Runtime Validator
 * Automatically detects board state issues, highlight problems, and visual inconsistencies
 */

class GameValidator {
    constructor() {
        this.enabled = true;
        this.errorLog = [];
        this.checkInterval = null;
        this.checksPerformed = 0;
        this.errorsFound = 0;
        
        console.log('🔍 GameValidator initialized - automatic validation enabled');
    }

    /**
     * Start continuous validation checks
     */
    startContinuousValidation(intervalMs = 500) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(() => {
            if (this.enabled && !gameState.isAnimating) {
                this.runAllChecks();
            }
        }, intervalMs);
        
        console.log(`✅ Continuous validation started (every ${intervalMs}ms)`);
    }

    /**
     * Stop continuous validation
     */
    stopContinuousValidation() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('⏸️ Continuous validation stopped');
    }

    /**
     * Run all validation checks
     */
    runAllChecks() {
        this.checksPerformed++;
        
        const results = {
            timestamp: Date.now(),
            checkNumber: this.checksPerformed,
            boardConsistency: this.validateBoardConsistency(),
            visualConsistency: this.validateVisualConsistency(),
            highlightValidity: this.validateHighlights(),
            adjacencyCorrectness: this.validateAdjacency(),
            domIntegrity: this.validateDOMIntegrity(),
            animationState: this.validateAnimationState(),
            visualPositioning: this.validateVisualPositioning()
        };

        const hasErrors = Object.values(results).some(r => r && r.errors && r.errors.length > 0);
        
        if (hasErrors) {
            this.errorsFound++;
            console.error('❌ VALIDATION FAILED - Check #' + this.checksPerformed, results);
            this.errorLog.push(results);
            this.reportErrors(results);
        }

        return results;
    }

    /**
     * Validate board internal consistency
     */
    validateBoardConsistency() {
        const errors = [];
        
        // Check for null/undefined confusion
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const value = gameState.board[row][col];
                
                if (value === undefined) {
                    errors.push({
                        type: 'UNDEFINED_VALUE',
                        position: [row, col],
                        message: `Board position [${row}][${col}] is undefined (should be null or gem type)`
                    });
                }
                
                if (value !== null && !GAME_CONFIG.GEM_TYPES.includes(value)) {
                    errors.push({
                        type: 'INVALID_GEM_TYPE',
                        position: [row, col],
                        value: value,
                        message: `Invalid gem type "${value}" at [${row}][${col}]`
                    });
                }
            }
        }

        return { passed: errors.length === 0, errors };
    }

    /**
     * Validate visual consistency (DOM matches internal state)
     */
    validateVisualConsistency() {
        const errors = [];
        
        // Check every position
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const internalValue = gameState.board[row][col];
                const domGem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                
                if (internalValue === null) {
                    if (domGem) {
                        errors.push({
                            type: 'PHANTOM_GEM',
                            position: [row, col],
                            domType: domGem.dataset.type,
                            message: `DOM has gem at [${row}][${col}] but internal state is null`
                        });
                    }
                } else {
                    if (!domGem) {
                        errors.push({
                            type: 'MISSING_GEM',
                            position: [row, col],
                            internalType: internalValue,
                            message: `Internal state has ${internalValue} at [${row}][${col}] but DOM gem missing`
                        });
                    } else {
                        const domType = domGem.dataset.type;
                        if (domType !== internalValue) {
                            errors.push({
                                type: 'TYPE_MISMATCH',
                                position: [row, col],
                                internalType: internalValue,
                                domType: domType,
                                message: `Type mismatch at [${row}][${col}]: internal=${internalValue}, DOM=${domType}`
                            });
                        }
                    }
                }
            }
        }

        return { passed: errors.length === 0, errors };
    }

    /**
     * Validate highlight validity
     */
    validateHighlights() {
        const errors = [];
        const selectedGems = document.querySelectorAll('.gem.selected');
        const validTargets = document.querySelectorAll('.gem.valid-target');

        // Should only have 0 or 1 selected gem
        if (selectedGems.length > 1) {
            errors.push({
                type: 'MULTIPLE_SELECTIONS',
                count: selectedGems.length,
                positions: Array.from(selectedGems).map(g => [g.dataset.row, g.dataset.col]),
                message: `${selectedGems.length} gems have .selected class (should be 0 or 1)`
            });
        }

        // Check if borders are actually visible
        validTargets.forEach(gem => {
            const computedStyle = window.getComputedStyle(gem);
            const borderColor = computedStyle.borderColor || computedStyle.border;
            
            // Check if border is transparent
            if (borderColor.includes('rgba(0, 0, 0, 0)') || borderColor.includes('transparent')) {
                // Check for conflicting classes
                const hasSpawning = gem.classList.contains('spawning');
                const hasFalling = gem.classList.contains('falling');
                const hasSwapping = gem.classList.contains('swapping');
                const hasMatching = gem.classList.contains('matching');
                
                errors.push({
                    type: 'INVISIBLE_BORDER',
                    position: [gem.dataset.row, gem.dataset.col],
                    borderColor: borderColor,
                    classes: gem.className,
                    conflictingClasses: {
                        spawning: hasSpawning,
                        falling: hasFalling,
                        swapping: hasSwapping,
                        matching: hasMatching
                    },
                    message: `Gem at [${gem.dataset.row}][${gem.dataset.col}] has .valid-target but border is transparent (possible class conflict)`
                });
            }
        });

        if (selectedGems.length === 1) {
            const gem = selectedGems[0];
            const computedStyle = window.getComputedStyle(gem);
            const borderColor = computedStyle.borderColor || computedStyle.border;
            
            if (borderColor.includes('rgba(0, 0, 0, 0)') || borderColor.includes('transparent')) {
                errors.push({
                    type: 'INVISIBLE_SELECTED_BORDER',
                    position: [gem.dataset.row, gem.dataset.col],
                    borderColor: borderColor,
                    classes: gem.className,
                    message: `Selected gem at [${gem.dataset.row}][${gem.dataset.col}] has transparent border`
                });
            }
        }

        // If we have selected gem, check gameState matches
        if (selectedGems.length === 1) {
            const domSelected = selectedGems[0];
            const domRow = parseInt(domSelected.dataset.row);
            const domCol = parseInt(domSelected.dataset.col);
            
            if (!gameState.selectedGem) {
                errors.push({
                    type: 'STATE_MISMATCH',
                    domPosition: [domRow, domCol],
                    statePosition: null,
                    message: `DOM has selected gem at [${domRow}][${domCol}] but gameState.selectedGem is null`
                });
            } else if (gameState.selectedGem.row !== domRow || gameState.selectedGem.col !== domCol) {
                errors.push({
                    type: 'STATE_MISMATCH',
                    domPosition: [domRow, domCol],
                    statePosition: [gameState.selectedGem.row, gameState.selectedGem.col],
                    message: `Selected gem mismatch: DOM=[${domRow}][${domCol}], state=[${gameState.selectedGem.row}][${gameState.selectedGem.col}]`
                });
            }
        }

        // If no selected gem, should have no valid targets
        if (selectedGems.length === 0 && validTargets.length > 0) {
            errors.push({
                type: 'ORPHANED_TARGETS',
                count: validTargets.length,
                positions: Array.from(validTargets).map(g => [g.dataset.row, g.dataset.col]),
                message: `${validTargets.length} gems have .valid-target but no gem is selected`
            });
        }
        
        // If game is not animating and no selection, there should be NO highlights at all
        if (!gameState.isAnimating && !gameState.selectedGem) {
            if (selectedGems.length > 0) {
                errors.push({
                    type: 'PERSISTENT_SELECTION',
                    count: selectedGems.length,
                    positions: Array.from(selectedGems).map(g => [g.dataset.row, g.dataset.col]),
                    message: `${selectedGems.length} gems still have .selected after animation complete (should be cleared)`
                });
            }
            if (validTargets.length > 0) {
                errors.push({
                    type: 'PERSISTENT_TARGETS',
                    count: validTargets.length,
                    positions: Array.from(validTargets).map(g => [g.dataset.row, g.dataset.col]),
                    message: `${validTargets.length} gems still have .valid-target after animation complete (should be cleared)`
                });
            }
        }

        return { passed: errors.length === 0, errors };
    }

    /**
     * Validate adjacency of highlighted targets
     */
    validateAdjacency() {
        const errors = [];
        const selectedGems = document.querySelectorAll('.gem.selected');
        const validTargets = document.querySelectorAll('.gem.valid-target');

        if (selectedGems.length === 1 && validTargets.length > 0) {
            const selected = selectedGems[0];
            const selectedRow = parseInt(selected.dataset.row);
            const selectedCol = parseInt(selected.dataset.col);

            validTargets.forEach(target => {
                const targetRow = parseInt(target.dataset.row);
                const targetCol = parseInt(target.dataset.col);
                const distance = Math.abs(targetRow - selectedRow) + Math.abs(targetCol - selectedCol);

                if (distance !== 1) {
                    errors.push({
                        type: 'NON_ADJACENT_TARGET',
                        selectedPosition: [selectedRow, selectedCol],
                        targetPosition: [targetRow, targetCol],
                        distance: distance,
                        message: `Target at [${targetRow}][${targetCol}] is distance ${distance} from selected [${selectedRow}][${selectedCol}] (should be 1)`
                    });
                }
            });

            // Also check that all adjacent positions ARE highlighted
            const adjacents = [
                { row: selectedRow - 1, col: selectedCol, dir: 'up' },
                { row: selectedRow + 1, col: selectedCol, dir: 'down' },
                { row: selectedRow, col: selectedCol - 1, dir: 'left' },
                { row: selectedRow, col: selectedCol + 1, dir: 'right' }
            ];

            adjacents.forEach(({ row, col, dir }) => {
                if (row >= 0 && row < GAME_CONFIG.ROWS && col >= 0 && col < GAME_CONFIG.COLS) {
                    const adjacentGem = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (adjacentGem && !adjacentGem.classList.contains('valid-target')) {
                        errors.push({
                            type: 'MISSING_TARGET_HIGHLIGHT',
                            selectedPosition: [selectedRow, selectedCol],
                            adjacentPosition: [row, col],
                            direction: dir,
                            message: `Adjacent gem at [${row}][${col}] (${dir}) is NOT highlighted but should be`
                        });
                    }
                }
            });
        }

        return { passed: errors.length === 0, errors };
    }

    /**
     * Validate visual positioning (DOM order matches data attributes)
     * This catches the critical bug where gems LOOK like they're at [3][4] 
     * but data-row/data-col say [5][2]
     */
    validateVisualPositioning() {
        const errors = [];
        const allGems = Array.from(document.querySelectorAll('.gem'));
        
        // In CSS Grid with row-major order, gem at [row][col] should be at DOM index: row * COLS + col
        allGems.forEach((gem, actualDOMIndex) => {
            const dataRow = parseInt(gem.dataset.row);
            const dataCol = parseInt(gem.dataset.col);
            const expectedDOMIndex = dataRow * GAME_CONFIG.COLS + dataCol;
            
            if (expectedDOMIndex !== actualDOMIndex) {
                // This gem's visual position doesn't match its data attributes!
                const visualRow = Math.floor(actualDOMIndex / GAME_CONFIG.COLS);
                const visualCol = actualDOMIndex % GAME_CONFIG.COLS;
                
                errors.push({
                    type: 'VISUAL_POSITION_MISMATCH',
                    dataPosition: [dataRow, dataCol],
                    visualPosition: [visualRow, visualCol],
                    expectedDOMIndex: expectedDOMIndex,
                    actualDOMIndex: actualDOMIndex,
                    offset: actualDOMIndex - expectedDOMIndex,
                    message: `Gem has data=[${dataRow}][${dataCol}] but appears visually at [${visualRow}][${visualCol}] (DOM index ${actualDOMIndex} vs expected ${expectedDOMIndex})`
                });
            }
        });

        // If we have mismatches, log them grouped by severity
        if (errors.length > 0) {
            const offsetCounts = {};
            errors.forEach(e => {
                const offset = e.offset;
                offsetCounts[offset] = (offsetCounts[offset] || 0) + 1;
            });
            
            console.warn('⚠️  Visual positioning mismatches detected:');
            Object.entries(offsetCounts).forEach(([offset, count]) => {
                console.warn(`  ${count} gems offset by ${offset} positions`);
            });
        }

        return { passed: errors.length === 0, errors };
    }

    /**
     * Validate animation state (detect stuck isAnimating flag)
     */
    validateAnimationState() {
        const errors = [];
        
        // Check if isAnimating has been true for too long
        if (gameState.isAnimating) {
            // Check if there are any actual animations running
            const animatingGems = document.querySelectorAll('.gem.swapping, .gem.matching, .gem.falling, .gem.spawning');
            
            if (animatingGems.length === 0) {
                // No gems are actually animating but flag is true
                errors.push({
                    type: 'STUCK_ANIMATING_FLAG',
                    isAnimating: true,
                    animatingGemsCount: 0,
                    message: 'isAnimating=true but no gems have animation classes (stuck state)'
                });
            }
        }
        
        // Check for orphaned animation classes
        const animatingGems = document.querySelectorAll('.gem.swapping, .gem.matching, .gem.falling, .gem.spawning');
        if (!gameState.isAnimating && animatingGems.length > 0) {
            errors.push({
                type: 'ORPHANED_ANIMATION_CLASSES',
                isAnimating: false,
                animatingGemsCount: animatingGems.length,
                classes: Array.from(animatingGems).map(g => ({
                    position: [g.dataset.row, g.dataset.col],
                    classes: g.className
                })),
                message: `isAnimating=false but ${animatingGems.length} gems still have animation classes`
            });
        }

        return { passed: errors.length === 0, errors };
    }

    /**
     * Validate DOM integrity (no duplicate positions, correct count)
     */
    validateDOMIntegrity() {
        const errors = [];
        const allGems = document.querySelectorAll('.gem');
        const positionMap = new Map();

        // Check for duplicate positions
        allGems.forEach(gem => {
            const row = gem.dataset.row;
            const col = gem.dataset.col;
            const key = `${row},${col}`;

            if (positionMap.has(key)) {
                errors.push({
                    type: 'DUPLICATE_POSITION',
                    position: [row, col],
                    count: positionMap.get(key) + 1,
                    message: `Multiple gems at position [${row}][${col}]`
                });
                positionMap.set(key, positionMap.get(key) + 1);
            } else {
                positionMap.set(key, 1);
            }
        });

        // Count non-null positions in board
        let expectedCount = 0;
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                if (gameState.board[row][col] !== null) {
                    expectedCount++;
                }
            }
        }

        if (allGems.length !== expectedCount) {
            errors.push({
                type: 'GEM_COUNT_MISMATCH',
                domCount: allGems.length,
                expectedCount: expectedCount,
                message: `DOM has ${allGems.length} gems but board state has ${expectedCount} non-null positions`
            });
        }

        return { passed: errors.length === 0, errors };
    }

    /**
     * Report errors to console with visual formatting
     */
    reportErrors(results) {
        console.group('🚨 VALIDATION ERRORS DETECTED');
        console.log('Check #' + results.checkNumber);
        console.log('Timestamp:', new Date(results.timestamp).toLocaleTimeString());
        
        Object.entries(results).forEach(([checkName, result]) => {
            if (result && result.errors && result.errors.length > 0) {
                console.group(`❌ ${checkName} (${result.errors.length} errors)`);
                result.errors.forEach((error, idx) => {
                    console.error(`Error ${idx + 1}:`, error.message);
                    console.log('Details:', error);
                });
                console.groupEnd();
            }
        });

        // Print current board state for context
        console.group('📊 Current Board State');
        this.printBoardState();
        console.groupEnd();

        console.groupEnd();
    }

    /**
     * Print board state to console
     */
    printBoardState() {
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            const rowData = [];
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const value = gameState.board[row][col];
                rowData.push(value ? value.substring(0, 3) : 'null');
            }
            console.log(`Row ${row}:`, rowData.join(' | '));
        }
    }

    /**
     * Generate summary report
     */
    getSummary() {
        return {
            enabled: this.enabled,
            checksPerformed: this.checksPerformed,
            errorsFound: this.errorsFound,
            errorRate: this.checksPerformed > 0 ? (this.errorsFound / this.checksPerformed * 100).toFixed(2) + '%' : 'N/A',
            errorLog: this.errorLog
        };
    }

    /**
     * Clear error log
     */
    clearLog() {
        this.errorLog = [];
        this.checksPerformed = 0;
        this.errorsFound = 0;
        console.log('✅ Error log cleared');
    }
}

// Create global validator instance
window.gameValidator = new GameValidator();

// Export validation function to be called after game operations
window.validateGame = function() {
    if (window.gameValidator && window.gameValidator.enabled) {
        return window.gameValidator.runAllChecks();
    }
};

// Add command to start/stop validation
window.startValidation = function(intervalMs = 500) {
    window.gameValidator.startContinuousValidation(intervalMs);
};

window.stopValidation = function() {
    window.gameValidator.stopContinuousValidation();
};

window.validationSummary = function() {
    const summary = window.gameValidator.getSummary();
    console.table(summary);
    return summary;
};

window.diagnoseStuckGame = function() {
    console.group('🔍 GAME STATE DIAGNOSIS');
    
    console.log('Game State Flags:');
    console.log('  isAnimating:', gameState.isAnimating);
    console.log('  isPaused:', gameState.isPaused);
    console.log('  selectedGem:', gameState.selectedGem);
    console.log('  combo:', gameState.combo);
    console.log('  currentCascadeDepth:', gameState.currentCascadeDepth);
    console.log('  animationTimeout:', gameState.animationTimeout ? 'SET' : 'null');
    
    console.log('\nAnimation Classes:');
    const swapping = document.querySelectorAll('.gem.swapping').length;
    const matching = document.querySelectorAll('.gem.matching').length;
    const falling = document.querySelectorAll('.gem.falling').length;
    const spawning = document.querySelectorAll('.gem.spawning').length;
    console.log('  .swapping:', swapping);
    console.log('  .matching:', matching);
    console.log('  .falling:', falling);
    console.log('  .spawning:', spawning);
    console.log('  TOTAL animating:', swapping + matching + falling + spawning);
    
    console.log('\nHighlight Classes:');
    const selected = document.querySelectorAll('.gem.selected').length;
    const validTargets = document.querySelectorAll('.gem.valid-target').length;
    console.log('  .selected:', selected);
    console.log('  .valid-target:', validTargets);
    
    console.log('\nDiagnosis:');
    if (gameState.isAnimating && (swapping + matching + falling + spawning) === 0) {
        console.error('❌ STUCK: isAnimating=true but no gems are animating!');
        console.log('💡 Fix: Run resetAnimationState() to unstuck');
    } else if (!gameState.isAnimating && (swapping + matching + falling + spawning) > 0) {
        console.warn('⚠️  WARNING: isAnimating=false but gems have animation classes');
    } else if (gameState.isAnimating) {
        console.log('✅ Game is animating normally');
    } else {
        console.log('✅ Game is idle and ready for input');
    }
    
    console.groupEnd();
    
    return {
        isAnimating: gameState.isAnimating,
        animatingGems: swapping + matching + falling + spawning,
        stuck: gameState.isAnimating && (swapping + matching + falling + spawning) === 0
    };
};

window.resetAnimationState = function() {
    console.log('🔧 Resetting animation state...');
    gameState.isAnimating = false;
    gameState.combo = 0;
    gameState.currentCascadeDepth = 0;
    if (gameState.animationTimeout) {
        clearTimeout(gameState.animationTimeout);
        gameState.animationTimeout = null;
    }
    
    // Clear all animation classes
    document.querySelectorAll('.gem.swapping, .gem.matching, .gem.falling, .gem.spawning').forEach(gem => {
        gem.classList.remove('swapping', 'matching', 'falling', 'spawning');
    });
    
    clearAllHighlights();
    updateUI();
    
    console.log('✅ Animation state reset - game should be playable now');
};

window.visualizePositionMismatches = function() {
    console.group('🎯 VISUAL POSITION ANALYSIS');
    
    const allGems = Array.from(document.querySelectorAll('.gem'));
    const mismatches = [];
    
    allGems.forEach((gem, domIndex) => {
        const dataRow = parseInt(gem.dataset.row);
        const dataCol = parseInt(gem.dataset.col);
        const expectedIndex = dataRow * 8 + dataCol;
        
        if (domIndex !== expectedIndex) {
            const visualRow = Math.floor(domIndex / 8);
            const visualCol = domIndex % 8;
            
            mismatches.push({
                gem: gem,
                dataRow: dataRow,
                dataCol: dataCol,
                visualRow: visualRow,
                visualCol: visualCol,
                domIndex: domIndex,
                expectedIndex: expectedIndex,
                offset: domIndex - expectedIndex
            });
        }
    });
    
    if (mismatches.length === 0) {
        console.log('✅ All gems are in correct visual positions!');
    } else {
        console.error(`❌ Found ${mismatches.length} position mismatches:`);
        console.table(mismatches.map(m => ({
            'Data Position': `[${m.dataRow}][${m.dataCol}]`,
            'Visual Position': `[${m.visualRow}][${m.visualCol}]`,
            'DOM Index': m.domIndex,
            'Expected Index': m.expectedIndex,
            'Offset': m.offset,
            'Type': m.gem.dataset.type
        })));
        
        // Highlight mismatched gems with red border
        mismatches.forEach(m => {
            m.gem.style.border = '3px solid red';
            m.gem.style.outline = '2px solid yellow';
        });
        
        console.log('🔴 Mismatched gems now have RED borders in the game!');
    }
    
    console.groupEnd();
    return mismatches;
};

console.log('✅ GameValidator loaded. Commands: validateGame(), startValidation(), stopValidation(), validationSummary(), diagnoseStuckGame(), resetAnimationState(), visualizePositionMismatches()');
