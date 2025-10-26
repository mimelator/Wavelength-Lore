/**
 * Forum Activity Tracking JavaScript
 * Handles real-time activity updates and notifications
 */

// Activity tracking functions
function trackUserActivity() {
    // Track user activity for engagement metrics
    if (window.sessionManager) {
        window.sessionManager.updateActivity();
    }
}

// Set up activity tracking
document.addEventListener('DOMContentLoaded', function() {
    // Track activity every 5 minutes
    setInterval(trackUserActivity, 5 * 60 * 1000);
    
    // Track on user interactions
    ['click', 'keydown', 'scroll'].forEach(event => {
        document.addEventListener(event, trackUserActivity, { passive: true });
    });
});

// Export functions for global use
window.forumActivity = {
    trackUserActivity
};