/**
 * Wavelength Gems - Admin/Developer Debug Panel
 * 
 * Press Ctrl+Shift+D (or Cmd+Shift+D on Mac) to toggle the admin panel
 * 
 * Features:
 * - Jump to any level
 * - Modify moves remaining
 * - Adjust current score
 * - Unlock all levels
 * - Reset progress
 * - Toggle god mode (infinite moves)
 * - Add cascades to counter
 * - View game state
 */

let adminPanelVisible = false;
let adminPanelElement = null;
let godModeEnabled = false;

/**
 * Initialize admin panel
 */
function initAdminPanel() {
    // Create the panel HTML
    createAdminPanelHTML();
    
    // Listen for keyboard shortcut: Ctrl+Shift+D or Cmd+Shift+D
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            toggleAdminPanel();
        }
    });
    
    console.log('🛠️ Admin Panel initialized. Press Ctrl+Shift+D (Cmd+Shift+D on Mac) to open.');
}

/**
 * Create admin panel HTML structure
 */
function createAdminPanelHTML() {
    const panel = document.createElement('div');
    panel.id = 'adminPanel';
    panel.className = 'admin-panel';
    panel.style.display = 'none';
    
    panel.innerHTML = `
        <div class="admin-panel-header">
            <h3>🛠️ Developer Debug Panel</h3>
            <button class="admin-close-btn" onclick="toggleAdminPanel()">✕</button>
        </div>
        
        <div class="admin-panel-content">
            <!-- Level Selection -->
            <div class="admin-section">
                <h4>📍 Level Control</h4>
                <div class="admin-row">
                    <label>Jump to Level:</label>
                    <select id="adminLevelSelect" class="admin-input">
                        <option value="">Loading...</option>
                    </select>
                    <button onclick="adminJumpToLevel()" class="admin-btn">Go</button>
                </div>
                <div class="admin-row">
                    <button onclick="adminLoadNextLevel()" class="admin-btn">Next Level</button>
                    <button onclick="adminRetryLevel()" class="admin-btn">Retry Level</button>
                </div>
            </div>
            
            <!-- Game State Modification -->
            <div class="admin-section">
                <h4>🎮 Game State</h4>
                <div class="admin-row">
                    <label>Score:</label>
                    <input type="number" id="adminScore" class="admin-input" placeholder="Current: 0">
                    <button onclick="adminSetScore()" class="admin-btn">Set</button>
                    <button onclick="adminAddScore(1000)" class="admin-btn-small">+1k</button>
                </div>
                <div class="admin-row">
                    <label>Moves:</label>
                    <input type="number" id="adminMoves" class="admin-input" placeholder="Current: 0">
                    <button onclick="adminSetMoves()" class="admin-btn">Set</button>
                    <button onclick="adminAddMoves(10)" class="admin-btn-small">+10</button>
                </div>
                <div class="admin-row">
                    <label>Combo:</label>
                    <input type="number" id="adminCombo" class="admin-input" placeholder="Current: 0">
                    <button onclick="adminSetCombo()" class="admin-btn">Set</button>
                    <button onclick="adminAddCombo(5)" class="admin-btn-small">+5</button>
                </div>
            </div>
            
            <!-- God Mode & Cheats -->
            <div class="admin-section">
                <h4>⚡ Power Tools</h4>
                <div class="admin-row">
                    <button onclick="adminToggleGodMode()" class="admin-btn" id="godModeBtn">
                        🛡️ God Mode: OFF
                    </button>
                    <button onclick="adminWinLevel()" class="admin-btn admin-btn-success">
                        ✅ Instant Win
                    </button>
                </div>
                <div class="admin-row">
                    <button onclick="adminUnlockAllLevels()" class="admin-btn">
                        🔓 Unlock All Levels
                    </button>
                    <button onclick="adminResetProgress()" class="admin-btn admin-btn-danger">
                        🔄 Reset Progress
                    </button>
                </div>
            </div>
            
            <!-- Board Control -->
            <div class="admin-section">
                <h4>🎲 Board Control</h4>
                <div class="admin-row">
                    <button onclick="adminShuffleBoard()" class="admin-btn">🔀 Shuffle Board</button>
                    <button onclick="adminClearBoard()" class="admin-btn">🧹 Clear Board</button>
                </div>
                <div class="admin-row">
                    <button onclick="adminFillBoard()" class="admin-btn">🎨 Refill Board</button>
                    <button onclick="adminCreateCascade()" class="admin-btn">⚡ Force Cascade</button>
                </div>
            </div>
            
            <!-- Debug Info -->
            <div class="admin-section">
                <h4>📊 Debug Info</h4>
                <div class="admin-info" id="adminDebugInfo">
                    <div class="admin-info-row">
                        <span>Current Level:</span>
                        <span id="debugCurrentLevel">-</span>
                    </div>
                    <div class="admin-info-row">
                        <span>Game State:</span>
                        <span id="debugGameState">-</span>
                    </div>
                    <div class="admin-info-row">
                        <span>Selected Gem:</span>
                        <span id="debugSelectedGem">None</span>
                    </div>
                    <div class="admin-info-row">
                        <span>Cascade Depth:</span>
                        <span id="debugCascadeDepth">0</span>
                    </div>
                    <div class="admin-info-row">
                        <span>Target Score:</span>
                        <span id="debugTargetScore">-</span>
                    </div>
                </div>
                <div class="admin-row">
                    <button onclick="adminRefreshDebugInfo()" class="admin-btn admin-btn-small">
                        🔄 Refresh Info
                    </button>
                    <button onclick="adminLogGameState()" class="admin-btn admin-btn-small">
                        📝 Log State
                    </button>
                    <button onclick="adminDebugBoard()" class="admin-btn admin-btn-small">
                        🔍 Debug Board
                    </button>
                </div>
            </div>
            
            <!-- Retry Threshold Controls -->
            <div class="admin-section">
                <h4>🔄 Retry Threshold Controls</h4>
                <div class="admin-row">
                    <label>Free Retries:</label>
                    <input type="number" id="adminRetryCount" class="admin-input" min="0" max="10" value="0">
                    <button onclick="adminSetRetryCount()" class="admin-btn">Set</button>
                </div>
                <div class="admin-info" id="thresholdDebugInfo">
                    <div class="admin-info-row">
                        <span>Retries Used:</span>
                        <span id="debugRetriesUsed">-</span>
                    </div>
                    <div class="admin-info-row">
                        <span>Daily Limit:</span>
                        <span id="debugRetriesLimit">-</span>
                    </div>
                    <div class="admin-info-row">
                        <span>Threshold Status:</span>
                        <span id="debugThresholdStatus">-</span>
                    </div>
                    <div class="admin-info-row">
                        <span>Next Reset:</span>
                        <span id="debugNextReset">-</span>
                    </div>
                </div>
                <div class="admin-row">
                    <button onclick="adminResetThreshold()" class="admin-btn">🔄 Reset Threshold</button>
                    <button onclick="adminForceThreshold()" class="admin-btn admin-btn-warning">⚠️ Force Threshold</button>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="admin-section">
                <h4>⚡ Quick Actions</h4>
                <div class="admin-row">
                    <button onclick="adminPauseResume()" class="admin-btn" id="pauseBtn">⏸️ Pause</button>
                    <button onclick="adminToggleDebugMode()" class="admin-btn" id="debugModeBtn">🐛 Debug Mode</button>
                </div>
            </div>
        </div>
        
        <div class="admin-panel-footer">
            <small>Press Ctrl+Shift+D (Cmd+Shift+D) to close</small>
        </div>
    `;
    
    document.body.appendChild(panel);
    adminPanelElement = panel;
    
    // Load levels into dropdown
    loadLevelsIntoDropdown();
}

/**
 * Toggle admin panel visibility
 */
function toggleAdminPanel() {
    adminPanelVisible = !adminPanelVisible;
    
    if (adminPanelElement) {
        adminPanelElement.style.display = adminPanelVisible ? 'block' : 'none';
        
        if (adminPanelVisible) {
            refreshAdminPanel();
        }
    }
}

/**
 * Load all levels into the dropdown
 */
async function loadLevelsIntoDropdown() {
    try {
        const levels = await getAllLevels();
        const select = document.getElementById('adminLevelSelect');
        
        if (select && levels && levels.length > 0) {
            select.innerHTML = levels.map(level => 
                `<option value="${level.level}">Level ${level.level}: ${level.title}</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Failed to load levels:', error);
    }
}

/**
 * Refresh all admin panel values
 */
function refreshAdminPanel() {
    // Update input placeholders with current values
    if (typeof gameState !== 'undefined') {
        const scoreInput = document.getElementById('adminScore');
        const movesInput = document.getElementById('adminMoves');
        const comboInput = document.getElementById('adminCombo');
        
        if (scoreInput) scoreInput.placeholder = `Current: ${gameState.score || 0}`;
        if (movesInput) movesInput.placeholder = `Current: ${gameState.moves || 0}`;
        if (comboInput) comboInput.placeholder = `Current: ${gameState.combo || 0}`;
        
        // Update god mode button
        const godModeBtn = document.getElementById('godModeBtn');
        if (godModeBtn) {
            godModeBtn.textContent = godModeEnabled ? '🛡️ God Mode: ON' : '🛡️ God Mode: OFF';
            godModeBtn.style.backgroundColor = godModeEnabled ? '#10b981' : '';
        }
        
        // Update retry threshold values if available
        if (window.RetryThresholdManager) {
            const thresholdInfo = RetryThresholdManager.getThresholdInfo();
            const retryCountInput = document.getElementById('adminRetryCount');
            
            if (retryCountInput) {
                retryCountInput.value = thresholdInfo.retriesUsed || 0;
            }
            
            // Update threshold debug info
            updateThresholdDebugInfo(thresholdInfo);
        }
    }
    
    adminRefreshDebugInfo();
}

/**
 * Update retry threshold debug information
 */
function updateThresholdDebugInfo(thresholdInfo) {
    if (!thresholdInfo) return;
    
    const updates = {
        debugRetriesUsed: `${thresholdInfo.retriesUsed} / ${thresholdInfo.retriesTotal}`,
        debugRetriesLimit: thresholdInfo.retriesTotal,
        debugThresholdStatus: thresholdInfo.isAtThreshold ? 
            '⚠️ Threshold Reached' : '✅ Below Threshold',
        debugNextReset: thresholdInfo.timeUntilReset
    };
    
    for (const [id, value] of Object.entries(updates)) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.textContent = value;
            
            // Apply warning style if at threshold
            if (id === 'debugThresholdStatus' && thresholdInfo.isAtThreshold) {
                elem.style.color = '#e74c3c';
                elem.style.fontWeight = 'bold';
            } else if (id === 'debugThresholdStatus') {
                elem.style.color = '#2ecc71';
                elem.style.fontWeight = 'normal';
            }
        }
    }
}

/**
 * Refresh debug info display
 */
function adminRefreshDebugInfo() {
    if (typeof gameState === 'undefined') return;
    
    const updates = {
        debugCurrentLevel: gameState.currentLevel || 'Menu',
        debugGameState: gameState.isPaused ? 'Paused' : 
                        gameState.selectedGem ? 'Gem Selected' : 'Playing',
        debugSelectedGem: gameState.selectedGem ? 
                          `(${gameState.selectedGem.row}, ${gameState.selectedGem.col})` : 'None',
        debugCascadeDepth: gameState.currentCascadeDepth || 0,
        debugTargetScore: gameState.targetScore || 'N/A'
    };
    
    for (const [id, value] of Object.entries(updates)) {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = value;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN ACTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Jump to selected level
 */
async function adminJumpToLevel() {
    const select = document.getElementById('adminLevelSelect');
    const levelNum = parseInt(select.value);
    
    if (!levelNum) {
        alert('Please select a level');
        return;
    }
    
    console.log(`🎮 Admin: Jumping to Level ${levelNum}`);
    
    try {
        if (typeof loadLevel === 'function') {
            await loadLevel(levelNum);
            toggleAdminPanel();
        } else {
            alert('loadLevel function not found');
        }
    } catch (error) {
        console.error('Failed to jump to level:', error);
        alert('Failed to load level: ' + error.message);
    }
}

/**
 * Load next level
 */
function adminLoadNextLevel() {
    if (typeof loadNextLevel === 'function') {
        loadNextLevel();
        toggleAdminPanel();
    } else {
        alert('loadNextLevel function not found');
    }
}

/**
 * Retry current level
 */
function adminRetryLevel() {
    if (typeof retryLevel === 'function') {
        retryLevel();
        toggleAdminPanel();
    } else {
        alert('retryLevel function not found');
    }
}

/**
 * Set score
 */
function adminSetScore() {
    const input = document.getElementById('adminScore');
    const value = parseInt(input.value);
    
    if (isNaN(value)) {
        alert('Please enter a valid number');
        return;
    }
    
    if (typeof gameState !== 'undefined') {
        gameState.score = value;
        if (typeof updateUI === 'function') updateUI();
        console.log(`🎮 Admin: Score set to ${value}`);
        refreshAdminPanel();
    }
}

/**
 * Add to score
 */
function adminAddScore(amount) {
    if (typeof gameState !== 'undefined') {
        gameState.score += amount;
        if (typeof updateUI === 'function') updateUI();
        console.log(`🎮 Admin: Added ${amount} to score`);
        refreshAdminPanel();
    }
}

/**
 * Set moves
 */
function adminSetMoves() {
    const input = document.getElementById('adminMoves');
    const value = parseInt(input.value);
    
    if (isNaN(value)) {
        alert('Please enter a valid number');
        return;
    }
    
    if (typeof gameState !== 'undefined') {
        gameState.moves = value;
        if (typeof updateUI === 'function') updateUI();
        console.log(`🎮 Admin: Moves set to ${value}`);
        refreshAdminPanel();
    }
}

/**
 * Add moves
 */
function adminAddMoves(amount) {
    if (typeof gameState !== 'undefined') {
        gameState.moves += amount;
        if (typeof updateUI === 'function') updateUI();
        console.log(`🎮 Admin: Added ${amount} moves`);
        refreshAdminPanel();
    }
}

/**
 * Set combo
 */
function adminSetCombo() {
    const input = document.getElementById('adminCombo');
    const value = parseInt(input.value);
    
    if (isNaN(value)) {
        alert('Please enter a valid number');
        return;
    }
    
    if (typeof gameState !== 'undefined') {
        gameState.combo = value;
        console.log(`🎮 Admin: Combo set to ${value}`);
        refreshAdminPanel();
    }
}

/**
 * Add to combo
 */
function adminAddCombo(amount) {
    if (typeof gameState !== 'undefined') {
        gameState.combo += amount;
        console.log(`🎮 Admin: Added ${amount} to combo`);
        refreshAdminPanel();
    }
}

/**
 * Toggle god mode (infinite moves)
 * Access restricted to users in developer group
 */
function adminToggleGodMode() {
    // Check if user belongs to developer group
    if (window.PermissionManager && !window.PermissionManager.isDeveloper()) {
        alert('⚠️ Access Denied: God Mode is restricted to developer group members only.');
        console.log('🔒 Access Denied: God Mode attempted by non-developer user');
        return;
    }
    
    godModeEnabled = !godModeEnabled;
    
    if (godModeEnabled && typeof gameState !== 'undefined') {
        gameState.moves = Infinity;
        if (typeof updateUI === 'function') updateUI();
    }
    
    console.log(`🎮 Admin: God Mode ${godModeEnabled ? 'ENABLED' : 'DISABLED'}`);
    refreshAdminPanel();
}

/**
 * Instantly win the level
 */
function adminWinLevel() {
    if (typeof gameState !== 'undefined' && typeof showLevelComplete === 'function') {
        gameState.score = gameState.targetScore || 10000;
        if (typeof updateUI === 'function') updateUI();
        setTimeout(() => {
            showLevelComplete();
        }, 100);
        console.log('🎮 Admin: Level completed instantly');
        toggleAdminPanel();
    } else {
        alert('Cannot win level in current state');
    }
}

/**
 * Unlock all levels
 */
async function adminUnlockAllLevels() {
    if (!confirm('Unlock all levels? This will mark all levels as completed in your progress.')) {
        return;
    }
    
    try {
        const levels = await getAllLevels();
        const completedLevels = levels.map(l => l.level);
        
        // Save progress for all levels
        for (const levelNum of completedLevels) {
            await fetch('/api/games/wavelength-gems/save-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: levelNum,
                    score: 10000,
                    stars: 3,
                    completed: true
                })
            });
        }
        
        console.log('🎮 Admin: All levels unlocked');
        alert('All levels have been unlocked!');
    } catch (error) {
        console.error('Failed to unlock levels:', error);
        alert('Failed to unlock levels: ' + error.message);
    }
}

/**
 * Reset all progress
 */
async function adminResetProgress() {
    if (!confirm('Reset all progress? This will delete all saved progress and cannot be undone!')) {
        return;
    }
    
    try {
        await fetch('/api/games/wavelength-gems/reset-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('🎮 Admin: Progress reset');
        alert('Progress has been reset. Reload the page to start fresh.');
    } catch (error) {
        console.error('Failed to reset progress:', error);
        alert('Failed to reset progress: ' + error.message);
    }
}

/**
 * Shuffle the board
 */
function adminShuffleBoard() {
    if (typeof gameState !== 'undefined' && typeof initializeBoard === 'function') {
        initializeBoard();
        console.log('🎮 Admin: Board shuffled');
    } else {
        alert('Cannot shuffle board in current state');
    }
}

/**
 * Clear the board
 */
function adminClearBoard() {
    if (typeof gameState !== 'undefined' && gameState.board) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                gameState.board[row][col] = null;
            }
        }
        if (typeof draw === 'function') draw();
        console.log('🎮 Admin: Board cleared');
    }
}

/**
 * Fill/refill the board
 */
function adminFillBoard() {
    if (typeof fillBoard === 'function') {
        fillBoard();
        console.log('🎮 Admin: Board refilled');
    } else if (typeof initializeBoard === 'function') {
        initializeBoard();
        console.log('🎮 Admin: Board reinitialized');
    }
}

/**
 * Force a cascade
 */
function adminCreateCascade() {
    if (typeof gameState !== 'undefined' && gameState.board) {
        // Create a line of matching gems to trigger cascade
        const gemType = gameState.gemTypes[0];
        for (let col = 0; col < 5; col++) {
            gameState.board[0][col] = gemType;
        }
        if (typeof draw === 'function') draw();
        console.log('🎮 Admin: Cascade setup created (top row)');
    }
}

/**
 * Pause/resume game
 */
function adminPauseResume() {
    if (typeof togglePause === 'function') {
        togglePause();
        const btn = document.getElementById('pauseBtn');
        if (btn && typeof gameState !== 'undefined') {
            btn.textContent = gameState.isPaused ? '▶️ Resume' : '⏸️ Pause';
        }
    }
}

/**
 * Toggle debug mode
 */
function adminToggleDebugMode() {
    // Toggle console logging or debug visuals
    const debugModeBtn = document.getElementById('debugModeBtn');
    if (debugModeBtn) {
        const isActive = debugModeBtn.textContent.includes('ON');
        debugModeBtn.textContent = isActive ? '🐛 Debug Mode: OFF' : '🐛 Debug Mode: ON';
        debugModeBtn.style.backgroundColor = isActive ? '' : '#10b981';
        
        // Could add visual debug overlays here
        console.log(`🎮 Admin: Debug mode ${isActive ? 'OFF' : 'ON'}`);
    }
}

/**
 * Log full game state to console
 */
function adminLogGameState() {
    if (typeof gameState !== 'undefined') {
        console.group('🎮 Admin: Full Game State');
        console.log('Score:', gameState.score);
        console.log('Moves:', gameState.moves);
        console.log('Combo:', gameState.combo);
        console.log('Current Level:', gameState.currentLevel);
        console.log('Target Score:', gameState.targetScore);
        console.log('Is Paused:', gameState.isPaused);
        console.log('Cascade Depth:', gameState.currentCascadeDepth);
        console.log('Selected Gem:', gameState.selectedGem);
        console.log('Gem Types:', gameState.gemTypes);
        console.log('Full State Object:', gameState);
        console.groupEnd();
    } else {
        console.log('🎮 Admin: gameState is undefined');
    }
}

/**
 * Debug board state (calls engine's debugBoardState function)
 */
function adminDebugBoard() {
    if (typeof debugBoardState === 'function') {
        console.log('🎮 Admin: Running board diagnostics...');
        debugBoardState();
    } else {
        console.error('🎮 Admin: debugBoardState function not found');
        alert('Debug board function not available');
    }
}

/**
 * Set retry count (retries used)
 */
function adminSetRetryCount() {
    const input = document.getElementById('adminRetryCount');
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < 0) {
        alert('Please enter a valid number of retries');
        return;
    }
    
    if (window.RetryThresholdManager) {
        // Set retry count by setting state directly
        RetryThresholdManager.currentState.retriesUsed = value;
        RetryThresholdManager.saveState();
        
        console.log(`🎮 Admin: Retries used set to ${value}`);
        alert(`Retries used set to ${value}`);
        refreshAdminPanel();
    } else {
        alert('Retry Threshold Manager not available');
    }
}

/**
 * Reset threshold (start fresh)
 */
function adminResetThreshold() {
    if (window.RetryThresholdManager) {
        RetryThresholdManager.resetThreshold(true);
        
        console.log('🎮 Admin: Threshold reset');
        alert('Threshold has been reset');
        refreshAdminPanel();
    } else {
        alert('Retry Threshold Manager not available');
    }
}

/**
 * Force threshold (max out retries)
 */
function adminForceThreshold() {
    if (window.RetryThresholdManager) {
        const limit = RetryThresholdManager.thresholdConfig.defaultDailyLimit;
        RetryThresholdManager.currentState.retriesUsed = limit;
        RetryThresholdManager.saveState();
        
        console.log(`🎮 Admin: Threshold forced (${limit}/${limit} retries used)`);
        alert(`Threshold reached: ${limit}/${limit} retries used`);
        refreshAdminPanel();
    } else {
        alert('Retry Threshold Manager not available');
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTO-INITIALIZE
// ═════════════════════════════════════════════════════════════════════════════

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}
