/**
 * RETRY THRESHOLD DEBUG TEST
 * =========================
 * 
 * This script helps debug why the retry threshold check isn't working
 * when users navigate away and back to the game.
 */

console.log('🔍 RETRY THRESHOLD DEBUG TEST');
console.log('=============================');

// Test 1: Check if RetryThresholdManager is available
console.log('1. RetryThresholdManager available:', !!window.RetryThresholdManager);

if (window.RetryThresholdManager) {
    // Test 2: Check current threshold state
    const isThresholdReached = RetryThresholdManager.isThresholdReached();
    console.log('2. Is threshold reached:', isThresholdReached);
    
    // Test 3: Get threshold info
    const thresholdInfo = RetryThresholdManager.getThresholdInfo();
    console.log('3. Threshold info:', thresholdInfo);
    
    // Test 4: Check localStorage directly
    const retryData = localStorage.getItem('wavelength_gems_retry_threshold');
    console.log('4. Raw localStorage data:', retryData);
    
    if (retryData) {
        try {
            const parsed = JSON.parse(retryData);
            console.log('5. Parsed retry data:', parsed);
            
            if (parsed.resetTime) {
                const resetTime = new Date(parsed.resetTime);
                const now = new Date();
                console.log('6. Reset time:', resetTime);
                console.log('7. Current time:', now);
                console.log('8. Time until reset:', resetTime > now ? 'Future' : 'Past');
            }
        } catch (e) {
            console.log('5. Error parsing retry data:', e);
        }
    }
} else {
    console.log('❌ RetryThresholdManager not found!');
}

// Test 5: Monitor initGame calls
if (window.initGame) {
    const originalInitGame = window.initGame;
    window.initGame = function(...args) {
        console.log('🎮 initGame called with args:', args);
        console.log('   - Threshold reached?', window.RetryThresholdManager ? RetryThresholdManager.isThresholdReached() : 'Manager not available');
        return originalInitGame.apply(this, args);
    };
    console.log('9. initGame monitoring enabled');
} else {
    console.log('9. initGame function not found');
}

console.log('=============================');