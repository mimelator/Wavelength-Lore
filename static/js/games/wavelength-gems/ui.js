/**
 * Wavelength Gems - UI Helper Functions
 * Manages UI interactions and updates
 */

// UI update handler
document.addEventListener('DOMContentLoaded', () => {
    // Ensure UI is set up
    if (document.getElementById('scoreDisplay')) {
        updateUI();
    }
});

// Watch for game state changes
setInterval(() => {
    if (document.getElementById('scoreDisplay')) {
        updateUI();
    }
}, 100);
