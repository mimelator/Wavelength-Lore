/**
 * Cross-Tab Radio Coordination Debug Tool
 * 
 * Add this to browser console to help debug cross-tab coordination issues
 */

window.debugCrossTabRadio = {
    // Get status of all radio instances
    getStatus() {
        console.log('🔍 Cross-Tab Radio Debug Status');
        console.log('=====================================');
        
        // Check WavelengthRadio instance
        if (window.wavelengthRadio) {
            console.log('📻 WavelengthRadio Instance:');
            console.log('  - Type:', window.wavelengthRadio.isMiniPlayer ? 'Mini Player' : 'Full Player');
            console.log('  - Is Playing:', window.wavelengthRadio.isPlaying);
            console.log('  - Current Track:', window.wavelengthRadio.currentTrackIndex);
            
            if (window.wavelengthRadio.crossTabManager) {
                console.log('  - Cross-Tab Manager:', window.wavelengthRadio.crossTabManager.getStatus());
            } else {
                console.log('  - Cross-Tab Manager: ❌ Not initialized');
            }
        } else {
            console.log('📻 WavelengthRadio: ❌ Not found');
        }
        
        console.log('');
        
        // Check GlobalRadioGame instance
        if (window.globalRadioGame) {
            console.log('🎮 GlobalRadioGame Instance:');
            console.log('  - Is Playing:', window.globalRadioGame.isPlaying);
            console.log('  - Current Track:', window.globalRadioGame.currentTrackIndex);
            console.log('  - Disabled:', window.globalRadioGame.disabled);
            
            if (window.globalRadioGame.crossTabManager) {
                console.log('  - Cross-Tab Manager:', window.globalRadioGame.crossTabManager.getStatus());
            } else {
                console.log('  - Cross-Tab Manager: ❌ Not initialized');
            }
        } else {
            console.log('🎮 GlobalRadioGame: ❌ Not found');
        }
        
        console.log('');
        
        // Check localStorage state
        console.log('💾 localStorage State:');
        try {
            const playbackState = localStorage.getItem('global_radio_playback_state');
            if (playbackState) {
                const state = JSON.parse(playbackState);
                console.log('  - Playback State:', {
                    trackIndex: state.trackIndex,
                    isPlaying: state.isPlaying,
                    currentTime: Math.floor(state.currentTime || 0),
                    timestamp: new Date(state.timestamp).toLocaleTimeString()
                });
            } else {
                console.log('  - Playback State: ❌ None');
            }
            
            const activeTabs = localStorage.getItem('wavelength_active_tabs');
            if (activeTabs) {
                const tabs = JSON.parse(activeTabs);
                console.log('  - Active Tabs:', Object.keys(tabs).length);
                Object.entries(tabs).forEach(([tabId, timestamp]) => {
                    const age = Math.floor((Date.now() - timestamp) / 1000);
                    console.log(`    - ${tabId}: ${age}s ago`);
                });
            } else {
                console.log('  - Active Tabs: ❌ None');
            }
        } catch (error) {
            console.log('  - Error reading localStorage:', error.message);
        }
        
        console.log('');
        
        // Check BroadcastChannel support
        console.log('🌐 Browser Support:');
        console.log('  - BroadcastChannel API:', typeof BroadcastChannel !== 'undefined' ? '✅ Supported' : '❌ Not supported');
        console.log('  - localStorage API:', typeof localStorage !== 'undefined' ? '✅ Supported' : '❌ Not supported');
    },
    
    // Test cross-tab coordination manually
    testCoordination() {
        console.log('🧪 Testing Cross-Tab Coordination');
        console.log('==================================');
        
        // Try to play on current tab's radio player
        if (window.wavelengthRadio) {
            console.log('📻 Testing WavelengthRadio...');
            window.wavelengthRadio.togglePlay();
            setTimeout(() => {
                console.log('   Result:', window.wavelengthRadio.isPlaying ? '✅ Playing' : '❌ Not playing');
            }, 200);
        } else if (window.globalRadioGame) {
            console.log('🎮 Testing GlobalRadioGame...');
            window.globalRadioGame.togglePlay();
            setTimeout(() => {
                console.log('   Result:', window.globalRadioGame.isPlaying ? '✅ Playing' : '❌ Not playing');
            }, 200);
        } else {
            console.log('❌ No radio player found to test');
        }
    },
    
    // Clear all coordination state
    clearState() {
        console.log('🧹 Clearing Cross-Tab Coordination State');
        console.log('========================================');
        
        try {
            localStorage.removeItem('global_radio_playback_state');
            localStorage.removeItem('wavelength_active_tabs');
            localStorage.removeItem('wavelength_radio_coordination');
            console.log('✅ localStorage cleared');
        } catch (error) {
            console.log('❌ Error clearing localStorage:', error.message);
        }
        
        // Reset flags
        if (window.wavelengthRadio?.crossTabManager) {
            window.wavelengthRadio.crossTabManager.pausedByRemoteTab = false;
            window.wavelengthRadio.crossTabManager.isActiveTab = false;
        }
        
        if (window.globalRadioGame?.crossTabManager) {
            window.globalRadioGame.crossTabManager.pausedByRemoteTab = false;
            window.globalRadioGame.crossTabManager.isActiveTab = false;
        }
        
        console.log('✅ Coordination flags reset');
    },
    
    // Monitor coordination messages
    monitor() {
        console.log('👁️ Monitoring Cross-Tab Messages (check for 30 seconds)...');
        console.log('=========================================================');
        
        let messageCount = 0;
        
        // Monitor localStorage changes
        const storageHandler = (e) => {
            if (e.key === 'wavelength_radio_coordination') {
                try {
                    const data = JSON.parse(e.newValue);
                    console.log(`📨 Message #${++messageCount}:`, data.type, 'from', data.tabId);
                } catch (error) {
                    console.log(`📨 Message #${++messageCount}: Parse error`);
                }
            }
        };
        
        window.addEventListener('storage', storageHandler);
        
        // Stop monitoring after 30 seconds
        setTimeout(() => {
            window.removeEventListener('storage', storageHandler);
            console.log(`✅ Monitoring stopped. Captured ${messageCount} messages.`);
        }, 30000);
    }
};

console.log('🔧 Cross-Tab Radio Debug Tool loaded!');
console.log('Usage:');
console.log('  debugCrossTabRadio.getStatus()     - Show current status');
console.log('  debugCrossTabRadio.testCoordination() - Test coordination');
console.log('  debugCrossTabRadio.clearState()    - Clear all state');
console.log('  debugCrossTabRadio.monitor()       - Monitor messages');