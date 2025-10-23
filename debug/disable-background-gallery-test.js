/**
 * Quick fix test: Disable background gallery to test if it's causing layout issues
 * Add this to the games hub page temporarily
 */

// Wait for page to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 TESTING: Disabling background gallery...');
    
    // Hide the background gallery
    const gallery = document.getElementById('games-background-gallery');
    if (gallery) {
        gallery.style.display = 'none';
        console.log('✅ Background gallery hidden');
    }
    
    // Check if layout is now correct
    setTimeout(() => {
        const header = document.querySelector('header');
        const main = document.querySelector('.games-container');
        
        if (header && main) {
            const headerRect = header.getBoundingClientRect();
            const mainRect = main.getBoundingClientRect();
            
            console.log('Header bottom:', headerRect.bottom);
            console.log('Main top:', mainRect.top);
            console.log('Gap between header and main:', mainRect.top - headerRect.bottom);
            
            if (mainRect.top - headerRect.bottom < 100) {
                console.log('✅ Layout appears normal');
            } else {
                console.log('❌ There may be other layout issues');
            }
        }
    }, 1000);
});