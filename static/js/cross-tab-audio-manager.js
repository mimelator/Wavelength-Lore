/**
 * CrossTabAudioManager - Prevents multiple audio streams across browser tabs
 * 
 * Uses BroadcastChannel API as primary coordination method with localStorage fallback
 * for older browsers. Ensures only one Wavelength Radio instance plays at a time.
 */

class CrossTabAudioManager {
    constructor(radioPlayer) {
        this.radioPlayer = radioPlayer;
        this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.isActiveTab = false;
        this.lastHeartbeat = Date.now();
        this.pausedByRemoteTab = false; // Flag to prevent auto-resume conflicts
        
        // BroadcastChannel for modern browsers
        this.channel = null;
        this.channelSupported = false;
        
        // Initialize coordination system
        this.init();
        
        console.log(`🔄 CrossTabAudioManager initialized for ${radioPlayer.isMiniPlayer ? 'mini' : 'full'} player, tabId: ${this.tabId}`);
    }
    
    init() {
        // Try to initialize BroadcastChannel
        this.initBroadcastChannel();
        
        // Set up localStorage fallback
        this.initLocalStorageFallback();
        
        // Start heartbeat system
        this.startHeartbeat();
        
        // Clean up on page unload
        this.setupCleanup();
    }
    
    /**
     * Initialize BroadcastChannel for modern browsers
     */
    initBroadcastChannel() {
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                this.channel = new BroadcastChannel('wavelength-radio-coordination');
                this.channelSupported = true;
                
                this.channel.addEventListener('message', (event) => {
                    this.handleBroadcastMessage(event.data);
                });
                
                console.log('✅ BroadcastChannel coordination enabled');
            }
        } catch (error) {
            console.warn('BroadcastChannel not supported, using localStorage fallback:', error);
            this.channelSupported = false;
        }
    }
    
    /**
     * Initialize localStorage fallback for cross-tab coordination
     */
    initLocalStorageFallback() {
        // Listen for localStorage changes from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === 'wavelength_radio_coordination') {
                try {
                    const data = JSON.parse(event.newValue);
                    if (data) {
                        this.handleCoordinationMessage(data);
                    }
                } catch (error) {
                    console.warn('Error parsing coordination message:', error);
                }
            }
        });
        
        console.log('✅ localStorage coordination fallback enabled');
    }
    
    /**
     * Handle incoming coordination messages
     */
    handleBroadcastMessage(data) {
        this.handleCoordinationMessage(data);
    }
    
    handleCoordinationMessage(data) {
        // Ignore messages from this tab
        if (data.tabId === this.tabId) {
            return;
        }
        
        switch (data.type) {
            case 'PLAY_STARTED':
                this.handleRemotePlayStarted(data);
                break;
            case 'PLAY_STOPPED':
                this.handleRemotePlayStopped(data);
                break;
            case 'TAB_HEARTBEAT':
                this.handleTabHeartbeat(data);
                break;
            case 'REQUEST_PAUSE':
                this.handlePauseRequest(data);
                break;
        }
    }
    
    /**
     * Another tab started playing - pause this tab's audio
     */
    handleRemotePlayStarted(data) {
        if (this.radioPlayer.isPlaying) {
            console.log(`🔄 Another tab (${data.tabId}) started playing, pausing this tab`);
            this.pausedByRemoteTab = true; // Mark as paused by remote tab
            this.radioPlayer.audio.pause();
            this.radioPlayer.isPlaying = false;
            this.radioPlayer.updatePlayButton?.();
            this.isActiveTab = false;
        }
    }
    
    /**
     * Another tab stopped playing
     */
    handleRemotePlayStopped(data) {
        console.log(`🔄 Tab ${data.tabId} stopped playing`);
        // Clear the paused-by-remote flag so this tab can resume if needed
        this.pausedByRemoteTab = false;
        // This tab doesn't automatically resume - user must click play
    }
    
    /**
     * Handle tab heartbeat to detect if tabs are still alive
     */
    handleTabHeartbeat(data) {
        // Update registry of active tabs (could be used for cleanup)
        const activeTabsKey = 'wavelength_active_tabs';
        try {
            const activeTabs = JSON.parse(localStorage.getItem(activeTabsKey) || '{}');
            activeTabs[data.tabId] = data.timestamp;
            localStorage.setItem(activeTabsKey, JSON.stringify(activeTabs));
        } catch (error) {
            console.warn('Error updating active tabs registry:', error);
        }
    }
    
    /**
     * Handle direct pause request
     */
    handlePauseRequest(data) {
        if (this.radioPlayer.isPlaying) {
            console.log(`🔄 Received pause request from tab ${data.tabId}`);
            this.radioPlayer.audio.pause();
            this.radioPlayer.isPlaying = false;
            this.radioPlayer.updatePlayButton?.();
            this.isActiveTab = false;
        }
    }
    
    /**
     * Request exclusive audio playback
     */
    async requestPlay() {
        // Clear the paused-by-remote flag since we're intentionally playing
        this.pausedByRemoteTab = false;
        
        // First, ask all other tabs to pause
        this.broadcastMessage({
            type: 'REQUEST_PAUSE',
            tabId: this.tabId,
            timestamp: Date.now(),
            reason: 'requesting_exclusive_playback'
        });
        
        // Wait a brief moment for other tabs to respond
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mark this tab as active
        this.isActiveTab = true;
        
        // Broadcast that we're starting playback
        this.broadcastMessage({
            type: 'PLAY_STARTED',
            tabId: this.tabId,
            timestamp: Date.now(),
            trackIndex: this.radioPlayer.currentTrackIndex,
            trackTitle: this.radioPlayer.playlist?.[this.radioPlayer.currentTrackIndex]?.title || 'Unknown'
        });
        
        console.log(`🎵 Tab ${this.tabId} claimed exclusive audio playback`);
    }
    
    /**
     * Notify that playback stopped
     */
    notifyPlayStopped() {
        this.isActiveTab = false;
        
        this.broadcastMessage({
            type: 'PLAY_STOPPED',
            tabId: this.tabId,
            timestamp: Date.now(),
            trackIndex: this.radioPlayer.currentTrackIndex
        });
        
        console.log(`🔄 Tab ${this.tabId} released audio playback`);
    }
    
    /**
     * Broadcast message to other tabs
     */
    broadcastMessage(data) {
        // Try BroadcastChannel first
        if (this.channelSupported && this.channel) {
            try {
                this.channel.postMessage(data);
            } catch (error) {
                console.warn('BroadcastChannel error, falling back to localStorage:', error);
                this.channelSupported = false;
            }
        }
        
        // Use localStorage as fallback (or primary if BroadcastChannel unavailable)
        if (!this.channelSupported) {
            try {
                localStorage.setItem('wavelength_radio_coordination', JSON.stringify(data));
                // Clear after a moment to prevent storage bloat
                setTimeout(() => {
                    try {
                        localStorage.removeItem('wavelength_radio_coordination');
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }, 1000);
            } catch (error) {
                console.warn('localStorage coordination error:', error);
            }
        }
    }
    
    /**
     * Start heartbeat system to detect dead tabs
     */
    startHeartbeat() {
        setInterval(() => {
            this.lastHeartbeat = Date.now();
            
            this.broadcastMessage({
                type: 'TAB_HEARTBEAT',
                tabId: this.tabId,
                timestamp: this.lastHeartbeat,
                isPlaying: this.radioPlayer.isPlaying,
                isActive: this.isActiveTab
            });
        }, 5000); // Heartbeat every 5 seconds
    }
    
    /**
     * Clean up dead tabs from registry
     */
    cleanupDeadTabs() {
        const activeTabsKey = 'wavelength_active_tabs';
        try {
            const activeTabs = JSON.parse(localStorage.getItem(activeTabsKey) || '{}');
            const now = Date.now();
            const timeout = 15000; // 15 second timeout
            
            let hasChanges = false;
            Object.keys(activeTabs).forEach(tabId => {
                if (now - activeTabs[tabId] > timeout) {
                    delete activeTabs[tabId];
                    hasChanges = true;
                    console.log(`🧹 Cleaned up dead tab: ${tabId}`);
                }
            });
            
            if (hasChanges) {
                localStorage.setItem(activeTabsKey, JSON.stringify(activeTabs));
            }
        } catch (error) {
            console.warn('Error cleaning up dead tabs:', error);
        }
    }
    
    /**
     * Setup cleanup on page unload
     */
    setupCleanup() {
        const cleanup = () => {
            // Notify that this tab is closing
            this.broadcastMessage({
                type: 'TAB_CLOSING',
                tabId: this.tabId,
                timestamp: Date.now()
            });
            
            // Clean up from active tabs registry
            try {
                const activeTabsKey = 'wavelength_active_tabs';
                const activeTabs = JSON.parse(localStorage.getItem(activeTabsKey) || '{}');
                delete activeTabs[this.tabId];
                localStorage.setItem(activeTabsKey, JSON.stringify(activeTabs));
            } catch (error) {
                // Ignore cleanup errors on unload
            }
        };
        
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('unload', cleanup);
        
        // Also cleanup on visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.radioPlayer.isPlaying) {
                // Tab is hidden but playing - this is fine, just update status
                this.broadcastMessage({
                    type: 'TAB_HIDDEN',
                    tabId: this.tabId,
                    timestamp: Date.now(),
                    stillPlaying: true
                });
            }
        });
    }
    
    /**
     * Check if this tab should be allowed to play
     */
    canPlay() {
        // Always allow if we're already the active tab
        if (this.isActiveTab) {
            return true;
        }
        
        // Check if any other tab is currently playing
        const activeTabsKey = 'wavelength_active_tabs';
        try {
            const activeTabs = JSON.parse(localStorage.getItem(activeTabsKey) || '{}');
            const now = Date.now();
            const timeout = 15000; // 15 second timeout
            
            for (const [tabId, timestamp] of Object.entries(activeTabs)) {
                if (tabId !== this.tabId && (now - timestamp) < timeout) {
                    // There's another active tab - need to coordinate
                    return false;
                }
            }
            
            return true; // No other active tabs found
        } catch (error) {
            console.warn('Error checking active tabs:', error);
            return true; // Allow play on error
        }
    }
    
    /**
     * Check if this tab should be allowed to auto-resume
     */
    canAutoResume() {
        // Don't auto-resume if we were paused by another tab
        return !this.pausedByRemoteTab;
    }
    
    /**
     * Get status for debugging
     */
    getStatus() {
        return {
            tabId: this.tabId,
            isActiveTab: this.isActiveTab,
            channelSupported: this.channelSupported,
            lastHeartbeat: this.lastHeartbeat,
            pausedByRemoteTab: this.pausedByRemoteTab,
            canPlay: this.canPlay(),
            canAutoResume: this.canAutoResume()
        };
    }
    
    /**
     * Destroy the manager (cleanup)
     */
    destroy() {
        if (this.channel) {
            this.channel.close();
        }
        
        // Final cleanup broadcast
        this.broadcastMessage({
            type: 'TAB_DESTROYED',
            tabId: this.tabId,
            timestamp: Date.now()
        });
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.CrossTabAudioManager = CrossTabAudioManager;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossTabAudioManager;
}