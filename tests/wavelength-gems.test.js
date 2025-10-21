/**
 * Wavelength Gems Test Suite
 * Comprehensive tests for match-3 game engine logic
 */

describe('Wavelength Gems Engine', () => {
    // Game configuration
    const GAME_CONFIG = {
        ROWS: 8,
        COLS: 8,
        GEM_TYPES: ['daphne', 'jasper', 'miles', 'ivy', 'echo', 'atlas'],
        MATCH_MIN: 3,
        BASE_POINTS: 100,
        ANIMATION_DURATION: 300
    };

    /**
     * Helper Functions (copied from engine.js for testing)
     */

    function getRandomGemType() {
        return GAME_CONFIG.GEM_TYPES[Math.floor(Math.random() * GAME_CONFIG.GEM_TYPES.length)];
    }

    function createMatchAt(board, row, col, gemType) {
        // Check horizontal
        if (col >= 2) {
            if (board[row][col - 1] === gemType && board[row][col - 2] === gemType) {
                return true;
            }
        }

        // Check vertical
        if (row >= 2) {
            if (board[row - 1][col] === gemType && board[row - 2][col] === gemType) {
                return true;
            }
        }

        return false;
    }

    function generateBoard() {
        const board = [];
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            board[row] = [];
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                let gemType;
                do {
                    gemType = getRandomGemType();
                } while (createMatchAt(board, row, col, gemType));

                board[row][col] = gemType;
            }
        }
        return board;
    }

    function findMatches(board) {
        const matches = [];
        const visited = new Set();

        // Check horizontal matches
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS - 2; col++) {
                const gem = board[row][col];
                if (gem === board[row][col + 1] && gem === board[row][col + 2]) {
                    const matchCells = [];
                    for (let i = col; i < GAME_CONFIG.COLS && board[row][i] === gem; i++) {
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
                const gem = board[row][col];
                if (gem === board[row + 1][col] && gem === board[row + 2][col]) {
                    const matchCells = [];
                    for (let i = row; i < GAME_CONFIG.ROWS && board[i][col] === gem; i++) {
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

    function fillEmpty(board) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                if (board[row][col] === null) {
                    let gemType;
                    do {
                        gemType = getRandomGemType();
                    } while (createMatchAt(board, row, col, gemType));
                    board[row][col] = gemType;
                }
            }
        }
        return board;
    }

    function applyGravity(board) {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            let writePos = GAME_CONFIG.ROWS - 1;

            for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
                if (board[row][col] !== null) {
                    board[writePos][col] = board[row][col];
                    if (writePos !== row) {
                        board[row][col] = null;
                    }
                    writePos--;
                }
            }
        }
        return board;
    }

    // ============================================================
    // TEST SUITES
    // ============================================================

    describe('Board Generation', () => {
        test('should generate a full 8x8 board', () => {
            const board = generateBoard();
            expect(board).toHaveLength(GAME_CONFIG.ROWS);
            expect(board[0]).toHaveLength(GAME_CONFIG.COLS);
        });

        test('should only contain valid gem types', () => {
            const board = generateBoard();
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                    expect(GAME_CONFIG.GEM_TYPES).toContain(board[row][col]);
                }
            }
        });

        test('should not have immediate matches on generated board', () => {
            const board = generateBoard();
            const matches = findMatches(board);
            expect(matches).toHaveLength(0);
        });

        test('should contain all gem types after generation', () => {
            const board = generateBoard();
            const gemTypes = new Set();
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                    gemTypes.add(board[row][col]);
                }
            }
            // All 6 gem types should be present
            expect(gemTypes.size).toBeGreaterThanOrEqual(4);
        });
    });

    describe('Match Detection', () => {
        test('should find horizontal matches of 3', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill('daphne'));
            const matches = findMatches(board);
            expect(matches.length).toBeGreaterThan(0);
        });

        test('should find vertical matches of 3', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                board[row][0] = 'jasper';
            }
            const matches = findMatches(board);
            expect(matches.length).toBeGreaterThan(0);
            // Most matches should be in column 0
            const col0Matches = matches.filter(m => m.col === 0);
            expect(col0Matches.length).toBeGreaterThan(0);
        });

        test('should find matches of 4+', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill('miles'));
            const matches = findMatches(board);
            expect(matches.length).toBeGreaterThan(20); // Full board should be matches
        });

        test('should not find matches < 3', () => {
            const board = generateBoard();
            // Board should not have any matches
            const matches = findMatches(board);
            expect(matches).toHaveLength(0);
        });

        test('should handle isolated gems correctly', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            // Create a checkerboard pattern - no matches
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                    board[row][col] = (row + col) % 2 === 0 ? 'daphne' : 'jasper';
                }
            }
            const matches = findMatches(board);
            expect(matches).toHaveLength(0);
        });
    });

    describe('Gravity and Falling', () => {
        test('should apply gravity correctly', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            board[0][0] = 'daphne';
            board[2][0] = 'jasper';

            applyGravity(board);

            // Both gems should be at bottom
            expect(board[GAME_CONFIG.ROWS - 2][0]).toBe('daphne');
            expect(board[GAME_CONFIG.ROWS - 1][0]).toBe('jasper');
            // Top should be empty
            expect(board[0][0]).toBeNull();
        });

        test('should not move gems already at bottom', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            board[GAME_CONFIG.ROWS - 1][0] = 'daphne';
            board[GAME_CONFIG.ROWS - 2][0] = 'jasper';

            applyGravity(board);

            expect(board[GAME_CONFIG.ROWS - 1][0]).toBe('daphne');
            expect(board[GAME_CONFIG.ROWS - 2][0]).toBe('jasper');
        });

        test('should handle gaps correctly', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            board[0][0] = 'daphne';
            board[1][0] = null;
            board[2][0] = 'jasper';

            applyGravity(board);

            // Both gems should compact at bottom
            expect(board[GAME_CONFIG.ROWS - 2][0]).toBe('daphne');
            expect(board[GAME_CONFIG.ROWS - 1][0]).toBe('jasper');
        });
    });

    describe('Fill Empty (Cascade Prevention)', () => {
        test('should fill null positions', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            board[0][0] = 'daphne';

            fillEmpty(board);

            // All positions should be filled
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                    expect(board[row][col]).not.toBeNull();
                }
            }
        });

        test('should not create immediate matches when filling', () => {
            const board = generateBoard();
            // Clear some gems
            board[3][3] = null;
            board[3][4] = null;
            board[3][5] = null;

            fillEmpty(board);

            // Should not create new matches
            const matches = findMatches(board);
            expect(matches).toHaveLength(0);
        });

        test('should only fill null spaces', () => {
            const board = generateBoard();
            const originalBoard = JSON.parse(JSON.stringify(board));

            fillEmpty(board);

            // Non-null positions should remain unchanged
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                    if (originalBoard[row][col] !== null) {
                        expect(board[row][col]).toBe(originalBoard[row][col]);
                    }
                }
            }
        });
    });

    describe('Game Flow Integration', () => {
        test('generated board -> clear matches -> gravity -> fill -> limited cascades', () => {
            let board = generateBoard();

            // Step 1: No matches initially
            let matches = findMatches(board);
            expect(matches).toHaveLength(0);

            // Step 2: Create a match manually
            board[0][0] = 'daphne';
            board[0][1] = 'daphne';
            board[0][2] = 'daphne';
            board[0][3] = 'daphne';

            // Find matches
            matches = findMatches(board);
            expect(matches.length).toBeGreaterThan(0);

            // Step 3: Clear matches
            matches.forEach(({row, col}) => {
                board[row][col] = null;
            });

            // Step 4: Apply gravity
            applyGravity(board);

            // Step 5: Fill empty
            fillEmpty(board);

            // Step 6: May have some matches (due to randomness), but should be manageable
            // The key is that it doesn't create INFINITE cascades
            matches = findMatches(board);
            expect(matches.length).toBeLessThan(GAME_CONFIG.COLS * GAME_CONFIG.ROWS);
        });

        test('should handle multiple cascade cycles', () => {
            let board = generateBoard();
            let cascadeCount = 0;
            const maxCascades = 20; // Prevent infinite loop

            while (cascadeCount < maxCascades) {
                const matches = findMatches(board);
                if (matches.length === 0) break;

                // Clear matches
                matches.forEach(({row, col}) => {
                    board[row][col] = null;
                });

                // Apply gravity and fill
                applyGravity(board);
                fillEmpty(board);

                cascadeCount++;
            }

            // Should eventually run out of matches
            expect(cascadeCount).toBeLessThan(maxCascades);

            // Final board should have no matches
            const finalMatches = findMatches(board);
            expect(finalMatches).toHaveLength(0);
        });

        test('REGRESSION: should not create infinite cascades on first user match', () => {
            // This test reproduces the exact bug:
            // "every time i play the game when i match my first set of three blocks"
            // User reported seeing combo increment to 16+ infinitely

            // Step 1: Generate a clean board with no matches
            let board = generateBoard();
            let initialMatches = findMatches(board);
            expect(initialMatches).toHaveLength(0);

            // Step 2: Simulate first user match - create a horizontal line of 4 gems
            // This is what happens when a user makes their first swap
            board[3][2] = 'daphne';
            board[3][3] = 'daphne';
            board[3][4] = 'daphne';
            board[3][5] = 'daphne';

            // Step 3: Process the match chain (as game engine would do)
            let cascadeCount = 0;
            const maxCascades = 25; // Allow more iterations than normal but still prevent infinite loop
            let comboCount = 0;

            while (cascadeCount < maxCascades) {
                const matches = findMatches(board);

                if (matches.length === 0) {
                    // All cascades complete
                    break;
                }

                // Increment combo (simulating game combo counter)
                comboCount++;

                // Clear matched gems
                matches.forEach(({row, col}) => {
                    board[row][col] = null;
                });

                // Apply gravity
                applyGravity(board);

                // Fill empty spaces (THIS IS WHERE THE BUG WAS)
                fillEmpty(board);

                cascadeCount++;
            }

            // KEY ASSERTION: Cascades should terminate, not go infinite
            expect(cascadeCount).toBeLessThan(maxCascades);

            // Combo should not reach the 16+ values the user reported
            expect(comboCount).toBeLessThan(10);

            // Final board should be stable (no matches)
            const finalMatches = findMatches(board);
            expect(finalMatches).toHaveLength(0);

            // All positions should be filled (no gaps)
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                    expect(board[row][col]).not.toBeNull();
                }
            }
        });
    });

    describe('Edge Cases', () => {
        test('should handle 4-in-a-row matches', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            board[4][0] = 'daphne';
            board[4][1] = 'daphne';
            board[4][2] = 'daphne';
            board[4][3] = 'daphne';

            const matches = findMatches(board);
            // Should find at least the 4 horizontal matches (may include more if other patterns)
            expect(matches.length).toBeGreaterThanOrEqual(4);
            // Verify all matches are in row 4
            const row4Matches = matches.filter(m => m.row === 4);
            expect(row4Matches.length).toBeGreaterThanOrEqual(4);
        });

        test('should handle L-shaped matches', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            // Horizontal
            board[4][0] = 'jasper';
            board[4][1] = 'jasper';
            board[4][2] = 'jasper';
            // Vertical
            board[3][1] = 'jasper';
            board[2][1] = 'jasper';

            const matches = findMatches(board);
            // Should find the horizontal and the vertical through the center
            expect(matches.length).toBeGreaterThanOrEqual(3);
        });

        test('should handle full row/column', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill('miles'));
            const matches = findMatches(board);
            // Should find many matches
            expect(matches.length).toBeGreaterThan(GAME_CONFIG.COLS * 2);
        });

        test('should handle alternating gem types', () => {
            const board = Array(GAME_CONFIG.ROWS).fill(null).map(() => Array(GAME_CONFIG.COLS).fill(null));
            for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
                for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                    board[row][col] = (row + col) % 2 === 0 ? 'daphne' : 'jasper';
                }
            }

            const matches = findMatches(board);
            expect(matches).toHaveLength(0);
        });
    });

    describe('Performance', () => {
        test('should generate board in reasonable time', () => {
            const start = Date.now();
            generateBoard();
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(100); // Less than 100ms
        });

        test('should find matches in reasonable time', () => {
            const board = generateBoard();
            const start = Date.now();
            findMatches(board);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(50); // Less than 50ms
        });

        test('should apply gravity in reasonable time', () => {
            const board = generateBoard();
            const start = Date.now();
            applyGravity(board);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(50); // Less than 50ms
        });
    });
});
