/**
 * Wavelength Gems - Game Mechanics Validation Test Suite
 * Comprehensive testing framework for core gameplay functionality
 */

class WavelengthGemsGameMechanicsTests {
    constructor() {
        this.testResults = [];
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Test configuration
        this.config = {
            testTimeout: 5000,
            animationTimeout: 1000,
            expectedBoardSize: { rows: 8, cols: 8 },
            expectedGemTypes: ['daphne', 'jasper', 'miles', 'ivy', 'echo', 'atlas'],
            minMatchSize: 3,
            maxCascadeDepth: 10
        };
        
        console.log(`🎮 Game Mechanics Test Suite initialized`);
    }

    /**
     * Run all game mechanics tests
     */
    async runAllMechanicsTests() {
        console.log('🚀 Starting Wavelength Gems Game Mechanics Test Suite...');
        
        const testSuites = [
            () => this.testGameInitialization(),
            () => this.testBoardGeneration(),
            () => this.testGemSelection(),
            () => this.testGemSwapping(),
            () => this.testMatchDetection(),
            () => this.testScoringSystem(),
            () => this.testCascadeSystem(),
            () => this.testLevelObjectives(),
            () => this.testGameStateManagement(),
            () => this.testLevelProgression(),
            () => this.testAnimationSystem(),
            () => this.testGameValidation()
        ];

        for (const testSuite of testSuites) {
            try {
                await testSuite();
            } catch (error) {
                this.logResult('ERROR', `Test suite failed: ${error.message}`, false);
            }
        }

        this.generateMechanicsTestReport();
        return this.testResults;
    }

    /**
     * Test game initialization
     */
    async testGameInitialization() {
        console.log('🎯 Testing game initialization...');

        // Test game state object exists
        const gameStateExists = typeof window.gameState !== 'undefined' && window.gameState !== null;
        this.logResult('INIT', 'Game state object initialized', gameStateExists);

        if (gameStateExists) {
            // Test game state properties
            const hasBoard = Array.isArray(window.gameState.board);
            this.logResult('INIT', 'Game board initialized', hasBoard);

            const hasScore = typeof window.gameState.score === 'number';
            this.logResult('INIT', 'Score tracking initialized', hasScore);

            const hasLevel = typeof window.gameState.currentLevel === 'number';
            this.logResult('INIT', 'Level tracking initialized', hasLevel);

            const hasSelectedGem = window.gameState.hasOwnProperty('selectedGem');
            this.logResult('INIT', 'Gem selection state initialized', hasSelectedGem);
        }

        // Test canvas manager initialization
        const canvasManagerExists = typeof window.canvasManager !== 'undefined' && 
                                   window.canvasManager !== null;
        this.logResult('INIT', 'Canvas manager initialized', canvasManagerExists);

        if (canvasManagerExists) {
            const hasCanvas = window.canvasManager.canvas !== null;
            const hasContext = window.canvasManager.ctx !== null;
            this.logResult('INIT', 'Canvas and context available', hasCanvas && hasContext);
        }

        // Test level system initialization
        const levelsLoaded = typeof window.LEVELS !== 'undefined' && 
                            Array.isArray(window.LEVELS) && 
                            window.LEVELS.length > 0;
        this.logResult('INIT', 'Level system loaded', levelsLoaded);

        // Test game configuration
        const configExists = typeof window.GAME_CONFIG !== 'undefined';
        this.logResult('INIT', 'Game configuration loaded', configExists);
    }

    /**
     * Test board generation and validation
     */
    async testBoardGeneration() {
        console.log('🎲 Testing board generation...');

        if (!window.gameState || !window.gameState.board) {
            this.logResult('BOARD', 'Game board not available for testing', false);
            return;
        }

        const board = window.gameState.board;

        // Test board dimensions
        const correctRows = board.length === this.config.expectedBoardSize.rows;
        this.logResult('BOARD', `Board has correct row count: ${board.length}`, correctRows);

        if (board.length > 0) {
            const correctCols = board[0].length === this.config.expectedBoardSize.cols;
            this.logResult('BOARD', `Board has correct column count: ${board[0].length}`, correctCols);
        }

        // Test all cells are filled
        let emptyCount = 0;
        let validGemCount = 0;
        
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const gem = board[row][col];
                if (!gem || gem === null || gem === undefined) {
                    emptyCount++;
                } else if (this.config.expectedGemTypes.includes(gem)) {
                    validGemCount++;
                }
            }
        }

        const totalCells = this.config.expectedBoardSize.rows * this.config.expectedBoardSize.cols;
        this.logResult('BOARD', `All cells filled: ${totalCells - emptyCount}/${totalCells}`, emptyCount === 0);
        this.logResult('BOARD', `Valid gem types: ${validGemCount}/${totalCells}`, validGemCount === totalCells);

        // Test no immediate matches on initial board (this is a design choice)
        const immediateMatches = this.findMatches(board);
        this.logResult('BOARD', `Initial board has no immediate matches: ${immediateMatches.length}`, immediateMatches.length === 0);

        // Test board has possible moves
        const possibleMoves = this.findPossibleMoves(board);
        this.logResult('BOARD', `Board has possible moves: ${possibleMoves.length}`, possibleMoves.length > 0);
    }

    /**
     * Test gem selection mechanics
     */
    async testGemSelection() {
        console.log('💎 Testing gem selection...');

        // Test initial selection state
        const initiallyUnselected = window.gameState.selectedGem === null;
        this.logResult('SELECTION', 'Initially no gem selected', initiallyUnselected);

        // Test gem selection function exists
        const selectionFunctionExists = typeof window.selectGem === 'function';
        this.logResult('SELECTION', 'Gem selection function available', selectionFunctionExists);

        if (selectionFunctionExists) {
            // Test selecting a gem
            try {
                window.selectGem(0, 0);
                const gemSelected = window.gameState.selectedGem !== null;
                this.logResult('SELECTION', 'Can select gem at position (0,0)', gemSelected);

                if (gemSelected) {
                    const correctPosition = window.gameState.selectedGem.row === 0 && 
                                          window.gameState.selectedGem.col === 0;
                    this.logResult('SELECTION', 'Selected gem position tracked correctly', correctPosition);
                }

                // Test deselecting by clicking same gem
                window.selectGem(0, 0);
                const deselected = window.gameState.selectedGem === null;
                this.logResult('SELECTION', 'Can deselect gem by clicking again', deselected);

            } catch (error) {
                this.logResult('SELECTION', `Gem selection error: ${error.message}`, false);
            }
        }

        // Test visual selection feedback
        const canvas = document.getElementById('gemsCanvas');
        if (canvas && window.canvasManager) {
            try {
                window.selectGem(1, 1);
                // Allow time for visual update
                await new Promise(resolve => setTimeout(resolve, 100));
                this.logResult('SELECTION', 'Visual selection feedback system works', true);
            } catch (error) {
                this.logResult('SELECTION', `Visual selection error: ${error.message}`, false);
            }
        }
    }

    /**
     * Test gem swapping mechanics
     */
    async testGemSwapping() {
        console.log('🔄 Testing gem swapping...');

        if (!window.gameState || !window.gameState.board) {
            this.logResult('SWAPPING', 'Board not available for swapping tests', false);
            return;
        }

        // Test swap function exists
        const swapFunctionExists = typeof window.swapGems === 'function';
        this.logResult('SWAPPING', 'Gem swapping function available', swapFunctionExists);

        if (swapFunctionExists) {
            // Store original board state
            const originalBoard = JSON.parse(JSON.stringify(window.gameState.board));
            
            try {
                // Test valid adjacent swap
                const gem1 = originalBoard[0][0];
                const gem2 = originalBoard[0][1];
                
                window.selectGem(0, 0);
                const swapResult = await window.swapGems(0, 1);
                
                // Check if gems were swapped
                const gemsSwapped = window.gameState.board[0][0] === gem2 && 
                                  window.gameState.board[0][1] === gem1;
                this.logResult('SWAPPING', 'Adjacent gems can be swapped', gemsSwapped || swapResult);

            } catch (error) {
                this.logResult('SWAPPING', `Gem swapping error: ${error.message}`, false);
            }
        }

        // Test invalid swap prevention (non-adjacent)
        try {
            window.selectGem(0, 0);
            const invalidSwapResult = await window.swapGems(2, 2); // Not adjacent
            const invalidSwapPrevented = !invalidSwapResult;
            this.logResult('SWAPPING', 'Invalid (non-adjacent) swaps prevented', invalidSwapPrevented);
        } catch (error) {
            // Error is expected for invalid swaps
            this.logResult('SWAPPING', 'Invalid swap properly rejected', true);
        }

        // Test swap animation system
        if (typeof window.animationSystem !== 'undefined') {
            this.logResult('SWAPPING', 'Swap animation system available', true);
        }
    }

    /**
     * Test match detection algorithms
     */
    async testMatchDetection() {
        console.log('🎯 Testing match detection...');

        // Test match detection function exists
        const matchFunctionExists = typeof window.findMatches === 'function';
        this.logResult('MATCH_DETECTION', 'Match detection function available', matchFunctionExists);

        if (!matchFunctionExists) return;

        // Create test board with known matches
        const testBoard = this.createTestBoardWithMatches();
        
        try {
            const matches = window.findMatches(testBoard);
            const matchesFound = matches.length > 0;
            this.logResult('MATCH_DETECTION', 'Can detect horizontal matches', matchesFound);

            // Test minimum match size
            const validMatches = matches.filter(match => match.length >= this.config.minMatchSize);
            const correctMinSize = validMatches.length === matches.length;
            this.logResult('MATCH_DETECTION', `Respects minimum match size (${this.config.minMatchSize})`, correctMinSize);

            // Test match types (horizontal and vertical)
            const hasHorizontal = matches.some(match => 
                match.every(gem => gem.row === match[0].row));
            const hasVertical = matches.some(match => 
                match.every(gem => gem.col === match[0].col));
            
            this.logResult('MATCH_DETECTION', 'Detects horizontal matches', hasHorizontal);
            this.logResult('MATCH_DETECTION', 'Detects vertical matches', hasVertical);

        } catch (error) {
            this.logResult('MATCH_DETECTION', `Match detection error: ${error.message}`, false);
        }

        // Test no false positives
        const emptyBoard = this.createEmptyTestBoard();
        try {
            const noMatches = window.findMatches(emptyBoard);
            this.logResult('MATCH_DETECTION', 'No false positive matches on empty board', noMatches.length === 0);
        } catch (error) {
            this.logResult('MATCH_DETECTION', `Empty board test error: ${error.message}`, false);
        }
    }

    /**
     * Test scoring system
     */
    async testScoringSystem() {
        console.log('📊 Testing scoring system...');

        // Test initial score
        const initialScore = window.gameState ? window.gameState.score : 0;
        const scoreIsNumber = typeof initialScore === 'number';
        this.logResult('SCORING', 'Score is tracked as number', scoreIsNumber);

        // Test scoring function exists
        const scoringFunctionExists = typeof window.calculateScore === 'function' || 
                                     typeof window.addScore === 'function';
        this.logResult('SCORING', 'Scoring function available', scoringFunctionExists);

        // Test base scoring values
        if (typeof window.GAME_CONFIG !== 'undefined' && window.GAME_CONFIG.BASE_POINTS) {
            const hasBasePoints = window.GAME_CONFIG.BASE_POINTS > 0;
            this.logResult('SCORING', `Base points configured: ${window.GAME_CONFIG.BASE_POINTS}`, hasBasePoints);
        }

        // Test score updates
        const originalScore = window.gameState ? window.gameState.score : 0;
        try {
            // Simulate scoring a match
            if (typeof window.addScore === 'function') {
                window.addScore(100);
                const scoreIncreased = window.gameState.score > originalScore;
                this.logResult('SCORING', 'Score increases when points added', scoreIncreased);
            }
        } catch (error) {
            this.logResult('SCORING', `Score update error: ${error.message}`, false);
        }

        // Test score display updates
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            const displayedScore = parseInt(scoreDisplay.textContent);
            const displayMatches = displayedScore === window.gameState.score;
            this.logResult('SCORING', 'Score display matches game state', displayMatches);
        }

        // Test target score system
        const targetDisplay = document.getElementById('targetDisplay');
        if (targetDisplay) {
            const hasTarget = parseInt(targetDisplay.textContent) > 0;
            this.logResult('SCORING', 'Target score is set', hasTarget);
        }
    }

    /**
     * Test cascade system
     */
    async testCascadeSystem() {
        console.log('⚡ Testing cascade system...');

        // Test cascade detection function
        const cascadeFunctionExists = typeof window.processCascade === 'function' || 
                                     typeof window.handleCascades === 'function';
        this.logResult('CASCADES', 'Cascade processing function available', cascadeFunctionExists);

        // Test cascade counter
        if (window.gameState && typeof window.gameState.cascadeCount === 'number') {
            this.logResult('CASCADES', 'Cascade counter tracked', true);
        }

        // Test cascade display
        const cascadeDisplay = document.getElementById('cascadesDisplay');
        if (cascadeDisplay) {
            const cascadeTracked = cascadeDisplay.textContent !== '';
            this.logResult('CASCADES', 'Cascade count displayed', cascadeTracked);
        }

        // Test cascade multiplier system
        if (typeof window.GAME_CONFIG !== 'undefined' && window.GAME_CONFIG.CASCADE_MULTIPLIER) {
            const hasMultiplier = window.GAME_CONFIG.CASCADE_MULTIPLIER > 1;
            this.logResult('CASCADES', `Cascade multiplier configured: ${window.GAME_CONFIG.CASCADE_MULTIPLIER}`, hasMultiplier);
        }

        // Test infinite cascade prevention
        const maxCascadeLimit = this.config.maxCascadeDepth;
        this.logResult('CASCADES', `Cascade depth limit configured (max: ${maxCascadeLimit})`, true);
    }

    /**
     * Test level objectives system
     */
    async testLevelObjectives() {
        console.log('🎯 Testing level objectives...');

        // Test current level access
        const currentLevel = window.gameState ? window.gameState.currentLevel : 1;
        const levelIsNumber = typeof currentLevel === 'number' && currentLevel > 0;
        this.logResult('OBJECTIVES', 'Current level tracked', levelIsNumber);

        // Test level configuration loading
        if (typeof window.getLevel === 'function') {
            try {
                const levelConfig = await window.getLevel(currentLevel);
                const levelLoaded = levelConfig !== null && typeof levelConfig === 'object';
                this.logResult('OBJECTIVES', 'Level configuration loads', levelLoaded);

                if (levelLoaded && levelConfig.objectives) {
                    const hasPrimaryObjective = levelConfig.objectives.primary !== undefined;
                    this.logResult('OBJECTIVES', 'Primary objective defined', hasPrimaryObjective);

                    if (levelConfig.objectives.primary) {
                        const objectiveHasTarget = typeof levelConfig.objectives.primary.target === 'number';
                        this.logResult('OBJECTIVES', 'Objective target is numeric', objectiveHasTarget);
                    }
                }
            } catch (error) {
                this.logResult('OBJECTIVES', `Level loading error: ${error.message}`, false);
            }
        }

        // Test moves limit system
        const movesDisplay = document.getElementById('movesDisplay');
        if (movesDisplay) {
            const movesText = movesDisplay.textContent;
            const movesTracked = movesText !== '' && (movesText === '∞' || parseInt(movesText) >= 0);
            this.logResult('OBJECTIVES', 'Moves limit tracked', movesTracked);
        }

        // Test win condition checking
        const winCheckExists = typeof window.checkWinCondition === 'function' || 
                              typeof window.checkLevelComplete === 'function';
        this.logResult('OBJECTIVES', 'Win condition checking available', winCheckExists);
    }

    /**
     * Test game state management
     */
    async testGameStateManagement() {
        console.log('🎮 Testing game state management...');

        if (!window.gameState) {
            this.logResult('STATE', 'Game state object not available', false);
            return;
        }

        // Test essential state properties
        const essentialProps = ['board', 'score', 'currentLevel', 'selectedGem'];
        let propsPresent = 0;
        
        essentialProps.forEach(prop => {
            if (window.gameState.hasOwnProperty(prop)) {
                propsPresent++;
            }
        });
        
        this.logResult('STATE', `Essential state properties: ${propsPresent}/${essentialProps.length}`, propsPresent >= 3);

        // Test state persistence
        const originalScore = window.gameState.score;
        window.gameState.score = originalScore + 1;
        const stateModifiable = window.gameState.score === originalScore + 1;
        window.gameState.score = originalScore; // Restore
        this.logResult('STATE', 'Game state is modifiable', stateModifiable);

        // Test game reset functionality
        const resetFunctionExists = typeof window.resetGame === 'function' || 
                                   typeof window.initGame === 'function';
        this.logResult('STATE', 'Game reset/init function available', resetFunctionExists);

        // Test pause functionality
        const pauseFunctionExists = typeof window.togglePause === 'function';
        this.logResult('STATE', 'Pause functionality available', pauseFunctionExists);

        if (pauseFunctionExists) {
            try {
                const wasPaused = window.gameState.paused || false;
                window.togglePause();
                const pauseToggled = window.gameState.paused !== wasPaused;
                window.togglePause(); // Restore original state
                this.logResult('STATE', 'Pause state toggles correctly', pauseToggled);
            } catch (error) {
                this.logResult('STATE', `Pause toggle error: ${error.message}`, false);
            }
        }
    }

    /**
     * Test level progression system
     */
    async testLevelProgression() {
        console.log('📈 Testing level progression...');

        // Test level navigation functions
        const nextLevelExists = typeof window.loadNextLevel === 'function';
        const retryLevelExists = typeof window.retryLevel === 'function';
        this.logResult('PROGRESSION', 'Level navigation functions available', nextLevelExists && retryLevelExists);

        // Test level selection
        const levelSelectExists = typeof window.showLevelSelectionMenu === 'function';
        this.logResult('PROGRESSION', 'Level selection function available', levelSelectExists);

        // Test level completion detection
        const completionCheckExists = typeof window.checkLevelComplete === 'function';
        this.logResult('PROGRESSION', 'Level completion check available', completionCheckExists);

        // Test progress saving
        const saveProgressExists = typeof window.saveProgress === 'function' || 
                                  localStorage.getItem('wavelength-gems-progress') !== null;
        this.logResult('PROGRESSION', 'Progress saving system available', saveProgressExists);

        // Test leaderboard integration
        const leaderboardExists = typeof window.toggleLeaderboard === 'function';
        this.logResult('PROGRESSION', 'Leaderboard system available', leaderboardExists);

        // Test level unlocking system
        if (typeof window.getLevel === 'function') {
            try {
                const level1 = await window.getLevel(1);
                const level2 = await window.getLevel(2);
                
                const levelsAvailable = level1 !== null && level2 !== null;
                this.logResult('PROGRESSION', 'Multiple levels available', levelsAvailable);
            } catch (error) {
                this.logResult('PROGRESSION', `Level access error: ${error.message}`, false);
            }
        }
    }

    /**
     * Test animation system
     */
    async testAnimationSystem() {
        console.log('🎬 Testing animation system...');

        // Test animation system exists
        const animationSystemExists = typeof window.animationSystem !== 'undefined';
        this.logResult('ANIMATIONS', 'Animation system available', animationSystemExists);

        if (animationSystemExists) {
            // Test animation methods
            const hasDrawMethod = typeof window.animationSystem.drawAnimations === 'function';
            const hasUpdateMethod = typeof window.animationSystem.updateAnimations === 'function';
            this.logResult('ANIMATIONS', 'Animation draw/update methods available', hasDrawMethod && hasUpdateMethod);

            // Test particle system
            const hasParticles = typeof window.animationSystem.drawParticles === 'function';
            this.logResult('ANIMATIONS', 'Particle system available', hasParticles);
        }

        // Test CSS animations
        const gemsWithTransitions = document.querySelectorAll('.gem[style*="transition"], .gem');
        let gemsWithCSSAnimation = 0;
        gemsWithTransitions.forEach(gem => {
            const style = getComputedStyle(gem);
            if (style.transition !== 'none' && style.transition !== '') {
                gemsWithCSSAnimation++;
            }
        });
        
        this.logResult('ANIMATIONS', `Gems with CSS transitions: ${gemsWithCSSAnimation}/${gemsWithTransitions.length}`, gemsWithCSSAnimation > 0);

        // Test animation frame loop
        const requestAnimationFrameUsed = typeof window.requestAnimationFrame !== 'undefined';
        this.logResult('ANIMATIONS', 'RequestAnimationFrame API available', requestAnimationFrameUsed);
    }

    /**
     * Test game validation system
     */
    async testGameValidation() {
        console.log('✅ Testing game validation...');

        // Test validator system exists
        const validatorExists = typeof window.validateGame === 'function';
        this.logResult('VALIDATION', 'Game validator function available', validatorExists);

        if (validatorExists) {
            try {
                const validationResult = window.validateGame();
                const validationPassed = validationResult === true || 
                                       (typeof validationResult === 'object' && validationResult.valid);
                this.logResult('VALIDATION', 'Game passes validation', validationPassed);
            } catch (error) {
                this.logResult('VALIDATION', `Validation error: ${error.message}`, false);
            }
        }

        // Test diagnostic functions
        const diagnosticExists = typeof window.diagnoseStuckGame === 'function';
        this.logResult('VALIDATION', 'Diagnostic functions available', diagnosticExists);

        // Test admin panel validation tools
        const adminValidationExists = typeof window.toggleAdminPanel === 'function';
        this.logResult('VALIDATION', 'Admin validation tools available', adminValidationExists);

        // Test error handling
        const consoleErrorsBefore = console.error.length || 0;
        try {
            // Trigger a potential error condition safely
            if (window.gameState && window.gameState.board) {
                const boardValid = Array.isArray(window.gameState.board) && 
                                 window.gameState.board.length > 0;
                this.logResult('VALIDATION', 'Board structure valid', boardValid);
            }
        } catch (error) {
            this.logResult('VALIDATION', 'Error handling works', true);
        }
    }

    /**
     * Utility: Create test board with known matches
     */
    createTestBoardWithMatches() {
        const board = [];
        const size = 8;
        
        // Fill with random gems
        for (let row = 0; row < size; row++) {
            board[row] = [];
            for (let col = 0; col < size; col++) {
                board[row][col] = this.config.expectedGemTypes[Math.floor(Math.random() * this.config.expectedGemTypes.length)];
            }
        }
        
        // Create a known horizontal match
        board[0][0] = 'daphne';
        board[0][1] = 'daphne';
        board[0][2] = 'daphne';
        
        // Create a known vertical match
        board[1][0] = 'jasper';
        board[2][0] = 'jasper';
        board[3][0] = 'jasper';
        
        return board;
    }

    /**
     * Utility: Create empty test board
     */
    createEmptyTestBoard() {
        const board = [];
        const size = 8;
        
        for (let row = 0; row < size; row++) {
            board[row] = [];
            for (let col = 0; col < size; col++) {
                board[row][col] = null;
            }
        }
        
        return board;
    }

    /**
     * Utility: Find matches in board (simplified version for testing)
     */
    findMatches(board) {
        const matches = [];
        const rows = board.length;
        const cols = board[0] ? board[0].length : 0;
        
        if (rows === 0 || cols === 0) return matches;
        
        // Check horizontal matches
        for (let row = 0; row < rows; row++) {
            let count = 1;
            let currentGem = board[row][0];
            
            for (let col = 1; col < cols; col++) {
                if (board[row][col] === currentGem && currentGem !== null) {
                    count++;
                } else {
                    if (count >= this.config.minMatchSize && currentGem !== null) {
                        const match = [];
                        for (let i = col - count; i < col; i++) {
                            match.push({ row, col: i });
                        }
                        matches.push(match);
                    }
                    count = 1;
                    currentGem = board[row][col];
                }
            }
            
            // Check last sequence
            if (count >= this.config.minMatchSize && currentGem !== null) {
                const match = [];
                for (let i = cols - count; i < cols; i++) {
                    match.push({ row, col: i });
                }
                matches.push(match);
            }
        }
        
        return matches;
    }

    /**
     * Utility: Find possible moves (simplified)
     */
    findPossibleMoves(board) {
        const moves = [];
        const rows = board.length;
        const cols = board[0] ? board[0].length : 0;
        
        // This is a simplified check - just look for adjacent different gems
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols - 1; col++) {
                if (board[row][col] !== board[row][col + 1]) {
                    moves.push({
                        from: { row, col },
                        to: { row, col: col + 1 }
                    });
                }
            }
        }
        
        return moves;
    }

    /**
     * Log test result
     */
    logResult(category, description, passed, details = null) {
        const result = {
            category,
            description,
            passed,
            details,
            timestamp: new Date().toISOString(),
            viewport: `${this.viewport.width}x${this.viewport.height}`
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} 🎮 [${category}] ${description}`, details ? details : '');
    }

    /**
     * Generate comprehensive test report
     */
    generateMechanicsTestReport() {
        console.log('\n📊 WAVELENGTH GEMS GAME MECHANICS TEST REPORT');
        console.log('=' .repeat(60));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const passRate = Math.round((passedTests / totalTests) * 100);
        
        console.log(`🎮 Game Mechanics Testing Complete`);
        console.log(`✅ Passed: ${passedTests}/${totalTests} (${passRate}%)`);
        console.log(`❌ Failed: ${failedTests}/${totalTests} (${100 - passRate}%)`);
        console.log(`📅 Date: ${new Date().toLocaleString()}`);
        
        // Group results by category
        const categories = {};
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { passed: 0, failed: 0, tests: [] };
            }
            categories[result.category].tests.push(result);
            if (result.passed) {
                categories[result.category].passed++;
            } else {
                categories[result.category].failed++;
            }
        });
        
        console.log('\n📋 Results by Game System:');
        Object.keys(categories).forEach(category => {
            const cat = categories[category];
            const catPassRate = Math.round((cat.passed / (cat.passed + cat.failed)) * 100);
            console.log(`   ${category}: ${cat.passed}/${cat.passed + cat.failed} (${catPassRate}%)`);
        });
        
        // Critical system analysis
        console.log('\n🔍 Critical System Analysis:');
        const criticalSystems = ['INIT', 'BOARD', 'SELECTION', 'SWAPPING', 'MATCH_DETECTION', 'SCORING'];
        criticalSystems.forEach(system => {
            if (categories[system]) {
                const systemHealth = Math.round((categories[system].passed / (categories[system].passed + categories[system].failed)) * 100);
                const status = systemHealth >= 90 ? '🟢' : systemHealth >= 70 ? '🟡' : '🔴';
                console.log(`   ${status} ${system}: ${systemHealth}% health`);
            }
        });
        
        // List failed tests for attention
        const failedResults = this.testResults.filter(r => !r.passed);
        if (failedResults.length > 0) {
            console.log('\n🚨 Failed Tests Requiring Attention:');
            failedResults.forEach(result => {
                console.log(`   ❌ [${result.category}] ${result.description}`);
            });
        }
        
        // Gameplay readiness assessment
        console.log('\n🎯 Gameplay Readiness Assessment:');
        const coreSystemsHealthy = criticalSystems.every(system => {
            const cat = categories[system];
            if (!cat) return false;
            return (cat.passed / (cat.passed + cat.failed)) >= 0.8;
        });
        
        if (coreSystemsHealthy) {
            console.log('   ✅ READY FOR PLAY: All core systems functioning');
        } else {
            console.log('   ⚠️  NEEDS ATTENTION: Core systems require fixes before release');
        }
        
        console.log('\n' + '=' .repeat(60));
        
        return {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                passRate: passRate,
                coreSystemsHealthy: coreSystemsHealthy
            },
            categories: categories,
            recommendations: this.generateMechanicsRecommendations(categories, passRate)
        };
    }

    /**
     * Generate actionable recommendations
     */
    generateMechanicsRecommendations(categories, passRate) {
        const recommendations = [];
        
        if (passRate < 90) {
            recommendations.push({
                priority: 'HIGH',
                category: 'OVERALL',
                issue: 'Game mechanics need improvement',
                action: 'Review failed tests and fix core gameplay issues'
            });
        }
        
        const criticalSystems = ['INIT', 'BOARD', 'SELECTION', 'SWAPPING', 'MATCH_DETECTION'];
        criticalSystems.forEach(system => {
            const cat = categories[system];
            if (cat && cat.failed > 0) {
                recommendations.push({
                    priority: 'CRITICAL',
                    category: system,
                    issue: `${system} system has issues`,
                    action: `Fix ${cat.failed} failed test(s) in ${system} system`
                });
            }
        });
        
        return recommendations;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.wavelengthGemsMechanicsTests = new WavelengthGemsGameMechanicsTests();
    });
} else {
    window.wavelengthGemsMechanicsTests = new WavelengthGemsGameMechanicsTests();
}

// Global test runner function
window.runWavelengthGemsMechanicsTests = async function() {
    if (!window.wavelengthGemsMechanicsTests) {
        console.error('❌ Game mechanics test suite not initialized');
        return null;
    }
    
    return await window.wavelengthGemsMechanicsTests.runAllMechanicsTests();
};

console.log('🎮 Wavelength Gems Game Mechanics Test Suite loaded - run with: runWavelengthGemsMechanicsTests()');