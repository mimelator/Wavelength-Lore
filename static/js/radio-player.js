// Wavelength Radio Player - Interactive Music Player with Game Elements

// Guard against double-loading
if (typeof window.WavelengthRadio !== 'undefined') {
    console.log('🎵 WavelengthRadio already loaded, skipping redefinition');
} else {

class WavelengthRadio {
    constructor() {
        // Detect player type and set appropriate audio element
        const fullPlayerAudio = document.getElementById('audioPlayer');
        const miniPlayerAudio = document.getElementById('globalRadioAudio');
        
        this.audio = fullPlayerAudio || miniPlayerAudio;
        this.isMiniPlayer = !fullPlayerAudio; // true if using global mini player
        
        console.log(`🔍 Radio player detection: fullPlayer=${!!fullPlayerAudio}, miniPlayer=${!!miniPlayerAudio}, isMiniPlayer=${this.isMiniPlayer}`);
        
        if (!this.audio) {
            throw new Error('No compatible audio element found (audioPlayer or globalRadioAudio)');
        }
        
        // Enhanced playlist loading with fallback
        this.loadPlaylist();
        this.cdnUrl = window.CDN_URL || '';

        // Player state
        this.currentTrackIndex = -1;
        this.playMode = localStorage.getItem('wavelength_play_mode') || 'sequential'; // sequential, random, loop
        this.currentSeasonFilter = localStorage.getItem('wavelength_season_filter') || 'all';
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 'off'; // off, one, all
        this.favorites = JSON.parse(localStorage.getItem('wavelength_favorites') || '[]');

        // Game state
        this.stats = {
            mushrooms: parseInt(localStorage.getItem('mushroom_count') || '0'),
            stars: parseInt(localStorage.getItem('star_count') || '0'),
            horseshoes: parseInt(localStorage.getItem('horseshoe_count') || '0'),
            sparkles: parseInt(localStorage.getItem('sparkle_count') || '0'),
            crystals: parseInt(localStorage.getItem('crystal_count') || '0'),
            moons: parseInt(localStorage.getItem('moon_count') || '0'),
            goblins: parseInt(localStorage.getItem('goblin_count') || '0'),
            magicLevel: parseInt(localStorage.getItem('magic_level') || '1'),
            totalPoints: parseInt(localStorage.getItem('total_points') || '0'),
            gameModePoints: parseInt(localStorage.getItem('game_mode_points') || '0')
        };

        // Visual elements spawning
        this.spawnInterval = null;
        this.activeElements = [];

        // Sound effects
        this.soundEnabled = localStorage.getItem('radio_sound_enabled') !== 'false'; // Enabled by default
        this.audioContext = null;

        // Screensaver module
        this.screensaver = null;

        // Initialize
        this.init();
    }

    // Enhanced playlist loading with multiple fallback strategies
    loadPlaylist() {
        try {
            // Check for content creator mode - if enabled, bypass server data and use API
            const urlParams = new URLSearchParams(window.location.search);
            const isCreatorMode = urlParams.get('creator') === 'true';
            
            if (isCreatorMode) {
                console.log('🔧 CREATOR MODE detected - loading playlist via API to include drafts');
                this.loadPlaylistFromAPI();
                return;
            }

            // Strategy 1: Use window.WAVELENGTH_PLAYLIST if available
            if (window.WAVELENGTH_PLAYLIST && window.WAVELENGTH_PLAYLIST.length > 0) {
                this.playlist = window.WAVELENGTH_PLAYLIST;
                console.log(`🎵 Loaded playlist from window.WAVELENGTH_PLAYLIST: ${this.playlist.length} tracks`);
                
                // If we're in full player mode, update the display immediately
                if (!this.isMiniPlayer) {
                    // Delay slightly to ensure DOM is ready
                    setTimeout(() => this.updatePlaylistDisplay(), 100);
                }
                return;
            }

            // Strategy 2: Use window.globalRadioPlaylist if available (used by global radio game)
            if (window.globalRadioPlaylist && window.globalRadioPlaylist.length > 0) {
                this.playlist = window.globalRadioPlaylist;
                console.log(`🎵 Loaded playlist from window.globalRadioPlaylist: ${this.playlist.length} tracks`);
                return;
            }

            // Strategy 3: Try to load from global radio game instance
            if (window.globalRadioGame && window.globalRadioGame.playlist && window.globalRadioGame.playlist.length > 0) {
                this.playlist = [...window.globalRadioGame.playlist]; // Create copy to avoid reference issues
                console.log(`🎵 Loaded playlist from globalRadioGame instance: ${this.playlist.length} tracks`);
                return;
            }

            // Strategy 4: Load playlist directly via API call
            this.loadPlaylistFromAPI();

            // Strategy 5: Fallback to empty playlist
            console.warn('⚠️ No playlist found, using empty playlist. Will retry during state restoration.');
            this.playlist = [];

        } catch (error) {
            console.error('Error loading playlist:', error);
            this.playlist = [];
        }
    }

    // Load playlist directly from dynamic Firebase API
    async loadPlaylistFromAPI() {
        try {
            // Check for content creator mode
            const urlParams = new URLSearchParams(window.location.search);
            const isCreatorMode = urlParams.get('creator') === 'true';
            const apiUrl = isCreatorMode ? '/api/radio/playlist?creator=true' : '/api/radio/playlist';
            
            console.log(`🌐 Loading ${isCreatorMode ? 'CREATOR MODE' : 'full'} playlist from Firebase API...`);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.length > 0) {
                this.playlist = data;
                console.log(`🎵 Loaded full playlist from Firebase: ${this.playlist.length} tracks`);
                
                // Update playlist UI if we're in full player mode
                if (!this.isMiniPlayer) {
                    this.updatePlaylistDisplay();
                }
                
                // If we have state waiting to be restored, try again now
                if (this.pendingStateRestore && this.pendingState) {
                    console.log('🔄 Playlist loaded, attempting delayed state restoration...');
                    this.restoreStateOnInit(this.pendingState);
                    this.pendingStateRestore = false;
                    this.pendingState = null;
                }
            } else {
                console.log('⚠️ No songs returned from Firebase API, keeping existing playlist');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load playlist from Firebase API:', error);
            console.log('🔄 Retrying with fallback endpoint...');
            
            // Try legacy endpoint as fallback
            try {
                const fallbackResponse = await fetch('/radio');
                if (fallbackResponse.ok) {
                    console.log('✅ Fallback endpoint available, playlist may load from server render');
                }
            } catch (fallbackError) {
                console.warn('⚠️ Fallback also failed:', fallbackError);
            }
        }
    }

    // Update playlist display in the UI (for full player)
    updatePlaylistDisplay() {
        const playlistContainer = document.querySelector('.playlist-items');
        if (!playlistContainer || this.isMiniPlayer) return;

        // Clear existing playlist items
        playlistContainer.innerHTML = '';

        // Add each track to the display
        this.playlist.forEach((track, index) => {
            const playlistItem = this.createPlaylistItem(track, index);
            playlistContainer.appendChild(playlistItem);
        });

        // Update season filter buttons dynamically
        this.updateSeasonFilterButtons();

        // Update playlist count
        this.updatePlaylistCount();

        // Rebind playlist events
        this.bindPlaylist();
        
        // Restore favorites
        this.loadFavorites();
        
        // Apply current season filter
        if (this.currentSeasonFilter && this.currentSeasonFilter !== 'all') {
            this.filterBySeason(this.currentSeasonFilter);
        }

        console.log(`🎵 Updated playlist display with ${this.playlist.length} tracks`);
    }

    // Update season filter buttons based on available seasons in playlist
    updateSeasonFilterButtons() {
        const filtersContainer = document.querySelector('.playlist-filters');
        if (!filtersContainer) return;

        // Get unique seasons from playlist
        const availableSeasons = [...new Set(this.playlist.map(track => track.season))].sort((a, b) => a - b);
        
        // Clear existing buttons
        filtersContainer.innerHTML = '';
        
        // Add "All" button
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn active';
        allBtn.dataset.season = 'all';
        allBtn.textContent = 'All';
        filtersContainer.appendChild(allBtn);
        
        // Add season buttons
        availableSeasons.forEach(season => {
            const seasonBtn = document.createElement('button');
            seasonBtn.className = 'filter-btn';
            seasonBtn.dataset.season = season;
            seasonBtn.textContent = `Season ${season}`;
            filtersContainer.appendChild(seasonBtn);
        });

        // Rebind filter events
        this.bindSeasonFilters();
        
        console.log(`🎵 Updated season filters: All + ${availableSeasons.join(', ')}`);
    }

    // Update playlist count display
    updatePlaylistCount() {
        const countElement = document.getElementById('playlistCount');
        if (countElement) {
            countElement.textContent = `(${this.playlist.length} songs)`;
        }
    }

    // Bind season filter events
    bindSeasonFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterBySeason(e.target.dataset.season));
        });
    }

    // Create a playlist item element
    createPlaylistItem(track, index) {
        const item = document.createElement('div');
        const episodeNum = this.getEpisodeNumber(track);
        
        item.className = 'playlist-item';
        item.dataset.index = index;
        item.dataset.season = track.season;
        item.dataset.episode = episodeNum;
        item.dataset.title = track.title;
        item.dataset.characters = JSON.stringify(track.characters || []);
        
        // Add episode image if available
        if (track.episodeImage) {
            item.dataset.episodeImage = track.episodeImage;
        }

        item.innerHTML = `
            <div class="playlist-item-info">
                <div class="playlist-item-title">${track.title}</div>
                <div class="playlist-item-episode">Season ${track.season} • Episode ${episodeNum}</div>
                <div class="playlist-item-duration">${track.durationFormatted || track.duration}</div>
            </div>
            <button class="playlist-item-favorite" title="Add to Favorites">♡</button>
        `;

        return item;
    }

    init() {
        // Pause and cleanup global radio player if it exists (shouldn't exist, but safeguard)
        this.pauseGlobalPlayer();

        this.bindControls();
        this.bindWidgetToggle(); // Add widget toggle functionality
        this.bindAudioEvents();
        
        if (this.isMiniPlayer) {
            // Mini player: core functionality for state synchronization
            console.log('🎵 Initializing mini radio player with state sync');
            this.bindPlaylist(); // Need playlist for track switching and state restoration
            this.recalculateTotalPoints(); // Ensure total points are accurate
            this.updateStats(); // Update widget stats display
            this.loadFavorites();
            this.initSoundSystem();
            this.initStateSync(); // Enhanced state synchronization for mini player
        } else {
            // Full player: complete initialization
            console.log('🎵 Initializing full radio player');
            this.bindPlaylist();
            this.recalculateTotalPoints(); // Ensure total points are accurate
            this.updateStats();
            this.startMysticalSpawner();
            this.loadFavorites();
            this.initFirebaseSync();
            this.initSoundSystem();
            this.bindSoundToggle();
            this.initWeatherEffects();
            this.initStateSync(); // Enhanced state synchronization for full player

            // Initialize screensaver module (if available)
            if (typeof RadioScreenSaver !== 'undefined') {
                this.screensaver = new RadioScreenSaver(this);
            }
        }

        // Restore saved player settings
        this.restorePlayerSettings();

        // Auto-resume from global radio player if it was playing
        this.restoreGlobalPlayerState();
        
        // Initialize Media Session API for system controls
        this.initMediaSession();
        
        // Initialize page visibility handling
        this.initVisibilityHandling();
        
        // Initialize health monitoring (full player only)
        if (!this.isMiniPlayer) {
            this.initHealthMonitoring();
        }
        
        // Make this instance globally accessible for debugging
        window.radioPlayer = this;
    }

    // Pause global radio player if it exists
    pauseGlobalPlayer() {
        try {
            const globalAudio = document.getElementById('globalRadioAudio');
            if (globalAudio) {
                globalAudio.pause();
                console.log('📻 Paused global radio player');
            }
        } catch (error) {
            console.warn('Error pausing global player:', error);
        }
    }

    // Initialize Web Audio API
    initSoundSystem() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.soundEnabled = false;
        }
    }

    // Bind sound toggle button
    bindSoundToggle() {
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => this.toggleSound());
            this.updateSoundButton();
        }
    }

    // Toggle sound on/off
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('radio_sound_enabled', this.soundEnabled);
        this.updateSoundButton();

        // Play a test sound when enabling
        if (this.soundEnabled) {
            this.playCollectSound({ class: 'star' });
        }
    }

    // Update sound button icon
    updateSoundButton() {
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
            soundToggle.title = this.soundEnabled ? 'Disable Sound Effects' : 'Enable Sound Effects';
        }
    }

    // Restore saved player settings (play mode and season filter)
    restorePlayerSettings() {
        try {
            // Restore play mode
            if (this.playMode) {
                this.setPlayMode(this.playMode);
                console.log(`⚙️ Restored play mode: ${this.playMode}`);
            }

            // Restore season filter
            if (this.currentSeasonFilter) {
                this.filterBySeason(this.currentSeasonFilter);
                console.log(`⚙️ Restored season filter: ${this.currentSeasonFilter}`);
            }
        } catch (error) {
            console.error('Error restoring player settings:', error);
        }
    }

    // Restore playback state from global radio player
    restoreGlobalPlayerState() {
        try {
            const savedState = localStorage.getItem('global_radio_playback_state');
            if (!savedState) return;

            const state = JSON.parse(savedState);

            // Only restore if the state is very recent (within last 10 seconds)
            // This ensures we only resume when coming from another page with mini player
            const tenSeconds = 10 * 1000;
            if (Date.now() - state.timestamp > tenSeconds) {
                return;
            }

            // Only restore if it was playing
            if (state.isPlaying && state.trackIndex >= 0 && state.trackIndex < this.playlist.length) {
                console.log(`📻 Resuming from global player: Track ${state.trackIndex} at ${Math.floor(state.currentTime)}s`);

                // Set volume to match global player
                if (state.volume !== undefined) {
                    const volumeSlider = document.getElementById('volumeSlider');
                    if (volumeSlider) {
                        volumeSlider.value = state.volume * 100;
                        this.setVolume(state.volume * 100);
                    }
                }

                // Play the track at the saved position after a small delay
                setTimeout(() => {
                    this.playTrack(state.trackIndex);
                    // Set the current time once metadata is loaded
                    this.audio.addEventListener('loadedmetadata', () => {
                        if (state.currentTime > 0 && state.currentTime < this.audio.duration) {
                            this.audio.currentTime = state.currentTime;
                        }
                    }, { once: true });
                }, 500);

                // Don't clear the state - keep it so global player can resume when navigating away
                // localStorage.removeItem('global_radio_playback_state');
            }
        } catch (error) {
            console.error('Error restoring global player state:', error);
        }
    }



    // Enhanced state synchronization for seamless mini/full player experience
    initStateSync() {
        console.log(`🔄 Initializing enhanced state sync for ${this.isMiniPlayer ? 'mini' : 'full'} player`);

        // Disable the global radio game since WavelengthRadio is taking control
        this.disableGlobalRadioGame();

        // Create cross-tab state synchronization
        if (typeof window !== 'undefined') {
            // Listen for storage changes from other tabs/players
            window.addEventListener('storage', (e) => {
                if (e.key === 'global_radio_playback_state' && e.newValue) {
                    this.handleRemoteStateChange(JSON.parse(e.newValue));
                }
            });

            // Enhanced periodic state sync for same-tab experience
            this.stateSyncInterval = setInterval(() => {
                this.syncState();
            }, 1000); // Sync every second
        }

        // Initial state restoration with enhanced logic
        this.restoreStateOnInit();
    }

    // Disable global radio game to prevent conflicts
    disableGlobalRadioGame() {
        try {
            // Signal to global radio game that WavelengthRadio is in control
            if (typeof window !== 'undefined') {
                window.wavelengthRadioActive = true;
                
                // If global radio game is already running, pause it
                if (window.globalRadioGame) {
                    console.log('🔄 Disabling global radio game - WavelengthRadio taking control');
                    if (window.globalRadioGame.audio) {
                        window.globalRadioGame.audio.pause();
                    }
                    // Disable its auto-resume
                    window.globalRadioGame.disabled = true;
                }
            }
        } catch (error) {
            console.warn('Error disabling global radio game:', error);
        }
    }

    // Handle state changes from other tabs/players
    handleRemoteStateChange(newState) {
        // Only sync if this isn't the active player (avoid feedback loops)
        if (!this.isPlaying && newState.isPlaying) {
            console.log('📻 Remote player started - syncing state');
            this.syncToRemoteState(newState);
        }
    }

    // Sync to remote state from another player instance
    syncToRemoteState(state) {
        if (state.trackIndex >= 0 && state.trackIndex < this.playlist.length) {
            this.currentTrackIndex = state.trackIndex;
            
            // Update UI to show current track (but don't auto-play)
            if (this.playlist[state.trackIndex]) {
                this.updateNowPlaying(this.playlist[state.trackIndex]);
            }
            
            // Sync volume
            if (state.volume !== undefined && Math.abs(this.audio.volume - state.volume) > 0.01) {
                this.audio.volume = state.volume;
                const volumeSlider = document.getElementById('volumeSlider') || document.getElementById('globalVolumeSlider');
                if (volumeSlider) {
                    volumeSlider.value = state.volume * 100;
                }
            }
        }
    }

    // Enhanced state restoration on initialization
    restoreStateOnInit() {
        try {
            const savedState = localStorage.getItem('global_radio_playback_state');
            if (!savedState) return;

            const state = JSON.parse(savedState);
            console.log('🔄 Restoring shared playback state:', state);

            // Check if we need to wait for playlist to load
            if ((!this.playlist || this.playlist.length === 0) && state.trackIndex >= 0) {
                console.warn('⚠️ Playlist not ready, setting flag to retry when API loads...');
                this.pendingStateRestore = true;
                this.pendingState = state;
                return;
            }

            // Always restore track and volume info for continuity
            if (state.trackIndex >= 0 && state.trackIndex < this.playlist.length) {
                this.currentTrackIndex = state.trackIndex;
                this.updateNowPlaying(this.playlist[state.trackIndex]);
                
                // Restore volume immediately
                if (state.volume !== undefined) {
                    this.audio.volume = state.volume;
                    const volumeSlider = document.getElementById('volumeSlider') || document.getElementById('globalVolumeSlider');
                    if (volumeSlider) {
                        volumeSlider.value = state.volume * 100;
                    }
                }
                
                // For mini player, restore full playback state including resuming if it was playing
                if (this.isMiniPlayer) {
                    console.log(`🔍 Mini player restore: playlist length=${this.playlist.length}, trackIndex=${state.trackIndex}`);
                    
                    const track = this.playlist[state.trackIndex];
                    if (!track) {
                        console.warn(`⚠️ Mini player: Track ${state.trackIndex} not found in playlist`);
                        return;
                    }
                    
                    const episodeNum = this.getEpisodeNumber(track);
                    console.log(`🎵 Mini player loading track: "${track.title}" (S${track.season}E${episodeNum})`);
                    const audioPath = this.getAudioUrl(track);
                    this.audio.src = audioPath;
                    this.audio.load();
                    
                    // Set current time and resume playback if it was playing
                    this.audio.addEventListener('loadedmetadata', () => {
                        console.log(`🎵 Mini player: loadedmetadata fired, duration=${this.audio.duration}s`);
                        
                        if (state.currentTime > 0 && state.currentTime < this.audio.duration) {
                            this.audio.currentTime = state.currentTime;
                            console.log(`🎵 Mini player: Set current time to ${state.currentTime}s`);
                        }
                        
                        // Resume playback if it was playing when we navigated away
                        if (state.isPlaying) {
                            console.log(`📻 Mini player resuming playback at ${Math.floor(state.currentTime)}s`);
                            this.audio.play().then(() => {
                                this.isPlaying = true;
                                this.updatePlayButton();
                                console.log(`✅ Mini player: Successfully resumed playback`);
                            }).catch(error => {
                                console.warn('🚫 Mini player autoplay prevented:', error);
                                // Update UI to show ready-to-play state
                                this.isPlaying = false;
                                this.updatePlayButton();
                            });
                        }
                    }, { once: true });
                    
                    // Add error handling for audio loading
                    this.audio.addEventListener('error', (e) => {
                        console.error('❌ Mini player: Audio loading error:', e);
                    }, { once: true });
                }
            }

        } catch (error) {
            console.error('Error restoring shared state:', error);
        }
    }



    // Periodic state synchronization
    syncState() {
        // Save current state if we're the active player
        if (this.isPlaying) {
            this.savePlaybackState();
        }
    }

    // Removed real-time playlist synchronization - not needed during development
    // Songs are not being released at runtime, so this just causes UX issues

    // Initialize health monitoring for Firebase connection
    initHealthMonitoring() {
        // Check health status on startup
        this.checkApiHealth();
        
        // Monitor health every 2 minutes
        this.healthCheckInterval = setInterval(() => {
            this.checkApiHealth();
        }, 120000);
    }

    // Check API health and Firebase connection status
    async checkApiHealth() {
        try {
            const response = await fetch('/api/radio/health');
            const health = await response.json();
            
            console.log('🏥 Radio API Health:', health);
            
            // Update health indicator in UI if it exists
            const healthIndicator = document.getElementById('apiHealthIndicator');
            if (healthIndicator) {
                if (health.firebaseService && health.firebaseSongs > 0) {
                    healthIndicator.textContent = '🟢';
                    healthIndicator.title = `Firebase Connected: ${health.firebaseSongs} songs available`;
                } else if (health.firebaseService) {
                    healthIndicator.textContent = '🟡';
                    healthIndicator.title = 'Firebase Connected: No songs found';
                } else {
                    healthIndicator.textContent = '🔴';
                    healthIndicator.title = `Firebase Disconnected: Using ${health.legacyPlaylistSize} legacy songs`;
                }
            }
            
            // Store health status for other components
            this.apiHealth = health;
            
        } catch (error) {
            console.warn('⚠️ Health check failed:', error);
            
            const healthIndicator = document.getElementById('apiHealthIndicator');
            if (healthIndicator) {
                healthIndicator.textContent = '❌';
                healthIndicator.title = 'Health check failed - may be using cached data';
            }
        }
    }

    // Manual refresh functionality
    async refreshPlaylist() {
        console.log('🔄 Manual playlist refresh requested...');
        
        // Show loading indicator
        const refreshBtn = document.getElementById('refreshPlaylistBtn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '🔄';
            refreshBtn.disabled = true;
        }

        try {
            const currentSeason = this.currentSeasonFilter === 'all' ? null : parseInt(this.currentSeasonFilter);
            await this.loadPlaylistFromAPI(currentSeason);
            
            // Also check health after refresh
            await this.checkApiHealth();
            
            // Show success feedback
            if (refreshBtn) {
                refreshBtn.innerHTML = '✅';
                setTimeout(() => {
                    refreshBtn.innerHTML = '🔄';
                    refreshBtn.disabled = false;
                }, 1500);
            }
            
            console.log('✅ Manual playlist refresh completed');
            
        } catch (error) {
            console.error('❌ Manual playlist refresh failed:', error);
            
            if (refreshBtn) {
                refreshBtn.innerHTML = '❌';
                setTimeout(() => {
                    refreshBtn.innerHTML = '🔄';
                    refreshBtn.disabled = false;
                }, 2000);
            }
        }
    }

    // Enhanced cleanup
    cleanup() {
        if (this.stateSyncInterval) {
            clearInterval(this.stateSyncInterval);
        }
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', this.handleRemoteStateChange);
        }
    }

    // Play collect sound based on collectible type
    playCollectSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create different sounds for different collectibles
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Different frequencies and patterns for each type
        switch (type.class) {
            case 'mushroom':
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.type = 'sine';
                break;
            case 'star':
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscillator.type = 'triangle';
                break;
            case 'horseshoe':
                oscillator.frequency.setValueAtTime(500, now);
                oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.2);
                gainNode.gain.setValueAtTime(0.35, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                oscillator.type = 'square';
                break;
            case 'sparkle':
                oscillator.frequency.setValueAtTime(1000, now);
                oscillator.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                oscillator.type = 'sine';
                break;
            case 'crystal':
                oscillator.frequency.setValueAtTime(700, now);
                oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.18);
                gainNode.gain.setValueAtTime(0.28, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.type = 'triangle';
                break;
            case 'moon':
                oscillator.frequency.setValueAtTime(350, now);
                oscillator.frequency.exponentialRampToValueAtTime(550, now + 0.25);
                gainNode.gain.setValueAtTime(0.32, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.type = 'sine';
                break;
            case 'goblin':
                // Special sound for rare goblin - more dramatic
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                oscillator.type = 'sawtooth';
                break;
            default:
                oscillator.frequency.setValueAtTime(440, now);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        }

        oscillator.start(now);
        oscillator.stop(now + 0.5);
    }

    // Initialize Firebase sync for game stats
    initFirebaseSync() {
        console.log('🔄 Initializing Firebase sync...');
        // Wait for Firebase to be ready
        if (window.firebaseAuth && window.firebaseUtils) {
            console.log('✅ Firebase ready, setting up auth listener');
            this.setupFirebaseAuth();
        } else {
            console.log('⏳ Firebase not ready, waiting for initialization...');
            // Listen for Firebase ready event
            const checkFirebase = () => {
                if (window.firebaseAuth && window.firebaseUtils) {
                    console.log('✅ Firebase became ready, setting up auth listener');
                    this.setupFirebaseAuth();
                } else {
                    console.log('⏳ Still waiting for Firebase, retrying in 500ms...');
                    setTimeout(checkFirebase, 500);
                }
            };
            checkFirebase();
        }
    }

    // Setup Firebase authentication listener
    setupFirebaseAuth() {
        window.firebaseUtils.onAuthStateChanged(window.firebaseAuth, (user) => {
            console.log('👤 Radio Player auth state changed:', user ? user.uid : 'No user');
            if (user) {
                this.currentUserId = user.uid;
                console.log('✅ Set currentUserId:', this.currentUserId);
                this.loadStatsFromFirebase();
                this.loadFavoritesFromFirebase();
            } else {
                console.log('⚠️ No authenticated user');
            }
        });
    }

    // Load stats from Firebase and merge with localStorage
    async loadStatsFromFirebase() {
        if (!this.currentUserId || !window.firebaseDB) return;

        try {
            const userStatsRef = window.firebaseUtils.ref(window.firebaseDB, `users/${this.currentUserId}/radioPlayerStats`);
            const snapshot = await window.firebaseUtils.get(userStatsRef);

            if (snapshot.exists()) {
                const firebaseStats = snapshot.val();

                // Merge Firebase stats with local stats (take the higher value)
                this.stats.mushrooms = Math.max(this.stats.mushrooms, firebaseStats.mushrooms || 0);
                this.stats.stars = Math.max(this.stats.stars, firebaseStats.stars || 0);
                this.stats.horseshoes = Math.max(this.stats.horseshoes, firebaseStats.horseshoes || 0);
                this.stats.sparkles = Math.max(this.stats.sparkles, firebaseStats.sparkles || 0);
                this.stats.crystals = Math.max(this.stats.crystals, firebaseStats.crystals || 0);
                this.stats.moons = Math.max(this.stats.moons, firebaseStats.moons || 0);
                this.stats.goblins = Math.max(this.stats.goblins, firebaseStats.goblins || 0);
                this.stats.magicLevel = Math.max(this.stats.magicLevel, firebaseStats.magicLevel || 1);
                this.stats.totalPoints = Math.max(this.stats.totalPoints, firebaseStats.totalPoints || 0);
                this.stats.gameModePoints = Math.max(this.stats.gameModePoints, firebaseStats.gameModePoints || 0);

                // Update localStorage with merged values
                localStorage.setItem('mushroom_count', this.stats.mushrooms);
                localStorage.setItem('star_count', this.stats.stars);
                localStorage.setItem('horseshoe_count', this.stats.horseshoes);
                localStorage.setItem('sparkle_count', this.stats.sparkles);
                localStorage.setItem('crystal_count', this.stats.crystals);
                localStorage.setItem('moon_count', this.stats.moons);
                localStorage.setItem('goblin_count', this.stats.goblins);
                localStorage.setItem('magic_level', this.stats.magicLevel);
                localStorage.setItem('total_points', this.stats.totalPoints);
                localStorage.setItem('game_mode_points', this.stats.gameModePoints);

                this.recalculateTotalPoints(); // Ensure total points are accurate after loading
                this.updateStats();

                console.log('✅ Loaded and merged game stats from Firebase');
            } else {
                // No Firebase stats yet, save current localStorage stats to Firebase
                await this.saveStatsToFirebase();
            }
        } catch (error) {
            console.error('Error loading stats from Firebase:', error);
        }
    }

    // Save stats to Firebase
    async saveStatsToFirebase() {
        if (!this.currentUserId || !window.firebaseDB) {
            console.log('🚫 Cannot save stats - missing userId or firebaseDB:', {
                userId: this.currentUserId,
                hasDB: !!window.firebaseDB
            });
            return;
        }

        try {
            console.log('💾 Saving stats to Firebase for user:', this.currentUserId, {
                totalPoints: this.stats.totalPoints,
                magicLevel: this.stats.magicLevel
            });
            const userStatsRef = window.firebaseUtils.ref(window.firebaseDB, `users/${this.currentUserId}/radioPlayerStats`);
            await window.firebaseUtils.set(userStatsRef, {
                mushrooms: this.stats.mushrooms,
                stars: this.stats.stars,
                horseshoes: this.stats.horseshoes,
                sparkles: this.stats.sparkles,
                crystals: this.stats.crystals,
                moons: this.stats.moons,
                goblins: this.stats.goblins,
                magicLevel: this.stats.magicLevel,
                totalPoints: this.stats.totalPoints,
                gameModePoints: this.stats.gameModePoints,
                lastUpdated: Date.now()
            });
            console.log('✅ Stats saved to Firebase successfully');
        } catch (error) {
            console.error('❌ Error saving stats to Firebase:', error);
        }
    }

    // Save favorites to Firebase
    async saveFavoritesToFirebase() {
        if (!this.currentUserId || !window.firebaseDB) return;

        try {
            const userFavoritesRef = window.firebaseUtils.ref(window.firebaseDB, `users/${this.currentUserId}/radioPlayerFavorites`);
            await window.firebaseUtils.set(userFavoritesRef, {
                favorites: this.favorites,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Error saving favorites to Firebase:', error);
        }
    }

    // Load favorites from Firebase
    async loadFavoritesFromFirebase() {
        if (!this.currentUserId || !window.firebaseDB) return;

        try {
            const userFavoritesRef = window.firebaseUtils.ref(window.firebaseDB, `users/${this.currentUserId}/radioPlayerFavorites`);
            const snapshot = await window.firebaseUtils.get(userFavoritesRef);

            if (snapshot.exists()) {
                const firebaseData = snapshot.val();

                // Merge Firebase favorites with local favorites
                const mergedFavorites = [...new Set([...this.favorites, ...(firebaseData.favorites || [])])];
                this.favorites = mergedFavorites;

                // Update localStorage
                localStorage.setItem('wavelength_favorites', JSON.stringify(this.favorites));

                // Update UI
                this.loadFavorites();

                console.log('✅ Loaded and merged favorites from Firebase');
            }
        } catch (error) {
            console.error('Error loading favorites from Firebase:', error);
        }
    }

    // Control bindings
    bindControls() {
        // Play/Pause - support both full player and mini player
        const playPauseBtn = document.getElementById('playPauseBtn') || document.getElementById('globalPlayBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlay());
        }

        // Previous/Next - support both full player and mini player
        const prevBtn = document.getElementById('prevBtn') || document.getElementById('globalPrevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }

        const nextBtn = document.getElementById('nextBtn') || document.getElementById('globalNextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        // Shuffle (full player only)
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }

        // Repeat (full player only)
        const repeatBtn = document.getElementById('repeatBtn');
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => this.cycleRepeat());
        }

        // Volume - support both full player and mini player
        const volumeSlider = document.getElementById('volumeSlider') || document.getElementById('globalVolumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
            this.setVolume(volumeSlider.value);
        }

        // Progress bar
        const progressBar = document.querySelector('.progress-bar');
        const progressHandle = document.getElementById('progressHandle');

        if (progressBar && progressHandle) {
            let isDragging = false;

            progressHandle.addEventListener('mousedown', () => isDragging = true);
            document.addEventListener('mouseup', () => isDragging = false);

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    this.seek(e, progressBar);
                }
            });

            progressBar.addEventListener('click', (e) => this.seek(e, progressBar));
        }

        // Playlist mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setPlayMode(e.target.dataset.mode));
        });

        // Season filters are now bound dynamically in updateSeasonFilterButtons()

        // Refresh playlist button (full player only)
        const refreshBtn = document.getElementById('refreshPlaylistBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshPlaylist());
        }

        // Mobile expand button
        const expandBtn = document.getElementById('mobileExpandBtn');
        const radioPlayer = document.getElementById('radioPlayer');
        if (expandBtn && radioPlayer) {
            expandBtn.addEventListener('click', () => {
                radioPlayer.classList.toggle('expanded');
            });
        }
    }

    // Widget toggle functionality for radio widget on every page
    bindWidgetToggle() {
        const toggle = document.getElementById('radioGameToggle');
        const closeBtn = document.getElementById('closeGameBtn');

        if (toggle) {
            toggle.addEventListener('click', () => this.toggleWidget());
            console.log('🎵 Radio widget toggle bound successfully');
        } else {
            console.warn('🚫 Radio widget toggle element not found');
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideWidget());
        }

        // Initialize widget state
        this.isWidgetActive = localStorage.getItem('global_radio_game_active') === 'true';
        if (this.isWidgetActive) {
            this.showWidget();
        }
    }

    // Toggle widget visibility
    toggleWidget() {
        if (this.isWidgetActive) {
            this.hideWidget();
        } else {
            this.showWidget();
        }
    }

    // Show widget
    showWidget() {
        const widget = document.getElementById('radioGameWidget');
        if (widget) {
            widget.classList.add('active');
            this.isWidgetActive = true;
            localStorage.setItem('global_radio_game_active', 'true');
            console.log('🎵 Radio widget opened');
        }
    }

    // Hide widget  
    hideWidget() {
        const widget = document.getElementById('radioGameWidget');
        if (widget) {
            widget.classList.remove('active');
            this.isWidgetActive = false;
            localStorage.setItem('global_radio_game_active', 'false');
            console.log('🎵 Radio widget closed');
        }
    }

    // Playlist item bindings
    bindPlaylist() {
        document.querySelectorAll('.playlist-item').forEach((item) => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('playlist-item-favorite')) {
                    this.playTrack(parseInt(item.dataset.index));
                }
            });

            // Favorite button
            const favBtn = item.querySelector('.playlist-item-favorite');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(parseInt(item.dataset.index));
            });
        });
    }

    // Save playback state for cross-page continuity
    savePlaybackState() {
        if (this.audio && this.currentTrackIndex >= 0) {
            const state = {
                trackIndex: this.currentTrackIndex,
                currentTime: this.audio.currentTime,
                isPlaying: this.isPlaying,
                volume: this.audio.volume,
                timestamp: Date.now()
            };
            localStorage.setItem('global_radio_playback_state', JSON.stringify(state));
        }
    }

    // Audio event bindings
    bindAudioEvents() {
        if (!this.audio) {
            console.error('Radio player: No audio element found, cannot bind events');
            return;
        }

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
            // Save state periodically while playing
            if (this.isPlaying) {
                this.savePlaybackState();
            }
        });
        this.audio.addEventListener('ended', () => this.onTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.savePlaybackState();
            // Notify screensaver when audio actually starts playing
            if (this.screensaver) {
                this.screensaver.onRadioPlay();
            }
        });
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.savePlaybackState();
            // Notify screensaver when audio pauses
            if (this.screensaver) {
                this.screensaver.onRadioStop();
            }
        });
        this.audio.addEventListener('error', (e) => {
            const currentTrack = this.playlist[this.currentTrackIndex];
            console.error(`🚨 AUDIO ERROR on track ${this.currentTrackIndex}:`, e);
            console.error(`🚨 FAILED AUDIO SRC:`, this.audio.src);
            console.error(`🚨 CURRENT TRACK DATA:`, currentTrack);
            // Try next track if current fails
            this.next();
        });
    }

    // Helper method to get episode number from track (handles both legacy and Firebase formats)
    getEpisodeNumber(track) {
        return track.episodeNumber || track.episode;
    }

    // Helper method to safely construct URLs (handles both relative and absolute URLs)
    safeUrlConstruct(path) {
        if (!path) return '';
        
        // If path is already a full URL, return as-is
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
        // If relative path, prepend CDN URL
        return this.cdnUrl + path;
    }

    // Helper method to get audio URL from track - ONLY uses normalized url field
    getAudioUrl(track) {
        if (!track.url) {
            console.error(`🚨 TRACK MISSING URL FIELD:`, track);
            return '';
        }
        
        // Check if track.url is already a full URL (starts with http)
        if (track.url.startsWith('http://') || track.url.startsWith('https://')) {
            return track.url;
        }
        
        // Construct full CDN URL at runtime using the configured CDN base URL
        return this.cdnUrl + track.url;
    }

    // Play specific track
    playTrack(index) {
        if (index < 0 || index >= this.playlist.length) {
            console.warn(`🚫 Cannot play track ${index}: playlist has ${this.playlist.length} tracks`);
            return;
        }

        this.currentTrackIndex = index;
        const track = this.playlist[index];

        const episodeNum = this.getEpisodeNumber(track);
        console.log(`🎵 Playing track ${index}: "${track.title}" (S${track.season}E${episodeNum})`);

        // Get audio path (handles both Firebase and legacy formats)
        const audioPath = this.getAudioUrl(track);
        
        // LOG THE FUCKING URL SO WE CAN DEBUG THIS SHIT
        console.log(`🔗 TRACK ${index} URL CONSTRUCTED:`, audioPath);
        console.log(`🔍 TRACK ${index} RAW DATA:`, {
            title: track.title,
            url: track.url || 'NO URL FIELD',
            file: track.file || 'NO FILE FIELD', 
            season: track.season,
            episode: track.episode
        });

        this.audio.src = audioPath;
        this.audio.load();

        // Update UI
        this.updateNowPlaying(track);
        this.updatePlaylistUI();

        // Update screen saver images if active
        if (this.screensaver?.active) {
            this.screensaver.updateImages();
        }

        // Save state immediately when track changes (before playing)
        this.savePlaybackState();

        // Play
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
                const albumArt = document.querySelector('.album-art');
                if (albumArt) albumArt.classList.add('playing');
                // Save state again after successful play start
                this.savePlaybackState();
                // Screensaver notification handled by audio 'play' event listener
            }).catch(error => {
                console.error(`💥 PLAYBACK ERROR for track ${index}:`, error);
                console.error(`💥 FAILED URL:`, audioPath);
                console.error(`💥 TRACK DATA:`, track);
            });
        }
    }

    // Toggle play/pause
    togglePlay() {
        if (this.currentTrackIndex === -1) {
            // Check if playlist is loaded
            if (!this.playlist || this.playlist.length === 0) {
                console.warn('🚫 Cannot play: playlist not loaded yet');
                // Try to load playlist if it's missing
                this.loadPlaylistFromAPI();
                return;
            }
            // Start with first track
            this.playTrack(0);
            return;
        }

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            const albumArt = document.querySelector('.album-art');
            if (albumArt) albumArt.classList.remove('playing');
            // Screensaver notification handled by audio 'pause' event listener
        } else {
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.isPlaying = true;
                    const albumArt = document.querySelector('.album-art');
                    if (albumArt) albumArt.classList.add('playing');
                    // Screensaver notification handled by audio 'play' event listener
                }).catch(error => {
                    console.error('Play error in togglePlay:', error);
                    this.isPlaying = false;
                    const albumArt = document.querySelector('.album-art');
                    if (albumArt) albumArt.classList.remove('playing');
                });
            } else {
                // Fallback for older browsers
                this.isPlaying = true;
                const albumArt = document.querySelector('.album-art');
                if (albumArt) albumArt.classList.add('playing');
                // Screensaver notification handled by audio 'play' event listener
            }
        }

        this.updatePlayButton();
        // Immediately sync state when play/pause changes
        this.savePlaybackState();
    }

    // Previous track
    previous() {
        let prevIndex;

        if (this.playMode === 'loop' && this.favorites.length > 0) {
            // Loop through favorites only
            const currentFavIndex = this.favorites.indexOf(this.currentTrackIndex);
            if (currentFavIndex !== -1) {
                const prevFavIndex = currentFavIndex - 1;
                prevIndex = this.favorites[prevFavIndex < 0 ? this.favorites.length - 1 : prevFavIndex];
            } else {
                // Not in favorites, go to last favorite
                prevIndex = this.favorites[this.favorites.length - 1];
            }
        } else {
            // Normal sequential mode
            prevIndex = this.currentTrackIndex - 1;
            if (prevIndex < 0) {
                prevIndex = this.playlist.length - 1;
            }
        }

        this.playTrack(prevIndex);
    }

    // Next track
    next() {
        let nextIndex;

        if (this.playMode === 'loop' && this.favorites.length > 0) {
            // Loop through favorites only
            const currentFavIndex = this.favorites.indexOf(this.currentTrackIndex);
            if (currentFavIndex !== -1) {
                const nextFavIndex = (currentFavIndex + 1) % this.favorites.length;
                nextIndex = this.favorites[nextFavIndex];
            } else {
                // Not in favorites, go to first favorite
                nextIndex = this.favorites[0];
            }
        } else if (this.isShuffle) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = this.currentTrackIndex + 1;
            if (nextIndex >= this.playlist.length) {
                nextIndex = 0;
            }
        }

        this.playTrack(nextIndex);
    }

    // Track end handler
    onTrackEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            // Always continue to next track (will loop back to start when reaching end)
            this.next();
        }
    }

    // Toggle shuffle
    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        const shuffleBtn = document.getElementById('shuffleBtn');
        shuffleBtn.classList.toggle('active', this.isShuffle);
    }

    // Cycle repeat mode
    cycleRepeat() {
        const modes = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];

        const repeatBtn = document.getElementById('repeatBtn');
        const icon = repeatBtn.querySelector('.repeat-icon');

        if (this.repeatMode === 'off') {
            repeatBtn.classList.remove('active');
            repeatBtn.title = 'Repeat Off';
            icon.textContent = '🔁';
        } else if (this.repeatMode === 'all') {
            repeatBtn.classList.add('active');
            repeatBtn.title = 'Repeat All';
            icon.textContent = '🔁';
        } else {
            repeatBtn.classList.add('active');
            repeatBtn.title = 'Repeat One';
            icon.textContent = '🔂';
        }
    }

    // Set volume
    setVolume(value) {
        if (!this.audio) return;
        
        this.audio.volume = value / 100;
        
        // Update volume display for full player (if element exists)
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = `${value}%`;
        }
        
        // Save volume change to shared state immediately for sync
        this.savePlaybackState();
    }

    // Seek to position
    seek(e, progressBar) {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = pos * this.audio.duration;
    }

    // Update progress bar
    updateProgress() {
        if (!this.audio.duration) return;

        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        
        // Update progress bar elements (full player only)
        const progressFill = document.getElementById('progressFill');
        const progressHandle = document.getElementById('progressHandle');
        const currentTime = document.getElementById('currentTime');
        
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressHandle) progressHandle.style.left = `${percent}%`;
        if (currentTime) currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    // Update duration display
    updateDuration() {
        const duration = document.getElementById('duration');
        if (duration) {
            duration.textContent = this.formatTime(this.audio.duration);
        }
    }

    // Format time (seconds to mm:ss)
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Update now playing display
    updateNowPlaying(track) {
        const episodeNum = this.getEpisodeNumber(track);
        
        // Update full player elements
        const trackTitle = document.getElementById('trackTitle');
        const trackEpisode = document.getElementById('trackEpisode');
        if (trackTitle) trackTitle.textContent = track.title;
        if (trackEpisode) trackEpisode.textContent = `Season ${track.season} • Episode ${episodeNum}`;
        
        // Update mini player elements
        const globalTrackTitle = document.getElementById('globalTrackTitle');
        const globalTrackMeta = document.getElementById('globalTrackMeta');
        if (globalTrackTitle) globalTrackTitle.textContent = track.title;
        if (globalTrackMeta) globalTrackMeta.textContent = `S${track.season}E${episodeNum}`;

        // Update broadcast status with in-world narrative (full player only)
        if (!this.isMiniPlayer) {
            this.updateBroadcastStatus(track);
        }

        // Get the playlist item for this track
        const playlistItem = document.querySelector(`.playlist-item[data-index="${this.currentTrackIndex}"]`);

        if (playlistItem) {
            // Update background gallery
            this.updateBackgroundGallery(playlistItem);

            // Update character badges
            this.updateCharacterBadges(playlistItem);

            // Update episode links
            this.updateEpisodeLinks(playlistItem);

            // Show episode info section
            document.getElementById('episodeInfoSection').style.display = 'block';
        }
    }

    // Update broadcast status with lore-driven labels
    updateBroadcastStatus(track) {
        const broadcastLabel = document.getElementById('broadcastLabel');
        const loreStatus = document.getElementById('loreStatus');
        
        if (!broadcastLabel || !loreStatus) return;

        // Generate lore-based broadcast label based on track content
        let broadcastType, loreMessage;
        
        // Battle/conflict tracks
        if (track.title.toLowerCase().includes('battle') || 
            track.title.toLowerCase().includes('war') ||
            track.title.toLowerCase().includes('fight') ||
            track.title.toLowerCase().includes('goblin')) {
            broadcastType = '⚔️ BATTLE REPORT';
            loreMessage = `ON AIR: The Battle Hymn of ${track.title}`;
        }
        // Character-focused tracks
        else if (track.title.toLowerCase().includes('daphne') ||
                 track.title.toLowerCase().includes('king') ||
                 this.hasCharacterFocus(track)) {
            broadcastType = '👑 HERO TRANSMISSION';
            loreMessage = `LORE TRACK: The Chronicles of ${track.title}`;
        }
        // Location/environment tracks  
        else if (track.title.toLowerCase().includes('shire') ||
                 track.title.toLowerCase().includes('fortress') ||
                 track.title.toLowerCase().includes('ice')) {
            broadcastType = '🏰 REALM UPDATE';
            loreMessage = `LOCATION REPORT: ${track.title}`;
        }
        // Emotional/story tracks
        else if (track.title.toLowerCase().includes('dream') ||
                 track.title.toLowerCase().includes('mourning') ||
                 track.title.toLowerCase().includes('falling')) {
            broadcastType = '💫 SAGA CHRONICLES';
            loreMessage = `STORY WAVE: The Tale of ${track.title}`;
        }
        // Default magical/mystical
        else {
            broadcastType = '✨ MYSTICAL FREQUENCIES';
            loreMessage = `SPELL TRACK: ${track.title} - Music as Magic`;
        }

        broadcastLabel.textContent = broadcastType;
        loreStatus.textContent = loreMessage;
    }

    // Helper function to detect character-focused tracks
    hasCharacterFocus(track) {
        // Check if track has character data or certain character-related keywords
        return (track.characters && track.characters.length > 0) ||
               track.title.toLowerCase().includes('charm') ||
               track.title.toLowerCase().includes('history');
    }

    // Update play button
    updatePlayButton() {
        // Update full player icon
        const icon = document.getElementById('playIcon');
        if (icon) {
            icon.textContent = this.isPlaying ? '⏸' : '▶';
        }
        
        // Update mini player button
        const globalPlayBtn = document.getElementById('globalPlayBtn');
        if (globalPlayBtn) {
            globalPlayBtn.textContent = this.isPlaying ? '⏸' : '▶';
            globalPlayBtn.title = this.isPlaying ? 'Pause' : 'Play';
        }
    }

    // Update playlist UI
    updatePlaylistUI() {
        document.querySelectorAll('.playlist-item').forEach((item, index) => {
            if (index === this.currentTrackIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Set play mode
    setPlayMode(mode) {
        this.playMode = mode;

        // Save to localStorage
        localStorage.setItem('wavelength_play_mode', mode);

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const shuffleBtn = document.getElementById('shuffleBtn');
        if (mode === 'random') {
            this.isShuffle = true;
            if (shuffleBtn) {
                shuffleBtn.classList.add('active');
            }
        } else if (mode === 'sequential') {
            this.isShuffle = false;
            if (shuffleBtn) {
                shuffleBtn.classList.remove('active');
            }
        } else if (mode === 'loop') {
            // Loop through favorites
            this.isShuffle = false;
            if (shuffleBtn) {
                shuffleBtn.classList.remove('active');
            }

            // Check if there are favorites
            if (this.favorites.length === 0) {
                alert('No favorites yet! Click the ♡ button on songs to add them to your favorites.');
                // Reset to sequential mode
                this.setPlayMode('sequential');
                return;
            }

            // If currently playing track is not in favorites, start with first favorite
            if (!this.favorites.includes(this.currentTrackIndex)) {
                this.playTrack(this.favorites[0]);
            }
        }
    }

    // Filter by season - show/hide tracks from existing playlist
    filterBySeason(season) {
        // Save current filter
        this.currentSeasonFilter = season;
        localStorage.setItem('wavelength_season_filter', season);

        // Update filter button UI
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.season === season);
        });

        // Show/hide tracks based on season filter
        let visibleCount = 0;
        document.querySelectorAll('.playlist-item').forEach(item => {
            if (season === 'all' || item.dataset.season === season) {
                item.classList.remove('hidden');
                visibleCount++;
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Update playlist count to show filtered count if not showing all
        const countElement = document.getElementById('playlistCount');
        if (countElement) {
            if (season === 'all') {
                countElement.textContent = `(${this.playlist.length} songs)`;
            } else {
                countElement.textContent = `(${visibleCount} songs - Season ${season})`;
            }
        }
        
        console.log(`🎵 Season ${season} filter applied - ${visibleCount} tracks visible`);
    }

    // Toggle favorite
    toggleFavorite(index) {
        const favIndex = this.favorites.indexOf(index);
        const item = document.querySelector(`.playlist-item[data-index="${index}"]`);
        const favBtn = item.querySelector('.playlist-item-favorite');

        if (favIndex === -1) {
            this.favorites.push(index);
            favBtn.classList.add('favorited');
            favBtn.textContent = '♥';
        } else {
            this.favorites.splice(favIndex, 1);
            favBtn.classList.remove('favorited');
            favBtn.textContent = '♡';
        }

        localStorage.setItem('wavelength_favorites', JSON.stringify(this.favorites));

        // Save to Firebase if user is authenticated
        if (this.currentUserId) {
            this.saveFavoritesToFirebase();
        }
    }

    // Load favorites from storage
    loadFavorites() {
        this.favorites.forEach(index => {
            const item = document.querySelector(`.playlist-item[data-index="${index}"]`);
            if (item) {
                const favBtn = item.querySelector('.playlist-item-favorite');
                favBtn.classList.add('favorited');
                favBtn.textContent = '♥';
            }
        });
    }

    // Update background gallery with episode image
    updateBackgroundGallery(playlistItem) {
        const episodeImage = playlistItem.dataset.episodeImage;
        const gallery = document.getElementById('background-gallery');

        // Clear existing images
        gallery.innerHTML = '';

        if (episodeImage) {
            // Create single large background image
            const img = document.createElement('img');
            img.src = this.cdnUrl + episodeImage;
            img.classList.add('background-gallery-image');

            // Center and fill the screen
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.left = '0';
            img.style.top = '0';
            img.style.objectFit = 'cover';

            gallery.appendChild(img);

            // Show gallery
            gallery.classList.add('active');
        } else {
            gallery.classList.remove('active');
        }
    }

    // Update character badges
    updateCharacterBadges(playlistItem) {
        const characters = JSON.parse(playlistItem.dataset.characters || '[]');
        const badgesContainer = document.getElementById('characterBadges');

        // Clear existing badges
        badgesContainer.innerHTML = '';

        if (characters.length > 0) {
            characters.forEach(character => {
                const badge = document.createElement('img');
                badge.src = this.cdnUrl + character.image;
                badge.alt = character.title;
                badge.title = character.title;
                badge.classList.add('character-badge');

                // Link to character or lore page based on type
                badge.addEventListener('click', () => {
                    const url = character.url || (character.type === 'lore' ? `/lore/${character.id}` : `/character/${character.id}`);
                    window.location.href = url;
                });

                badgesContainer.appendChild(badge);
            });
        }
    }

    // Update episode links
    updateEpisodeLinks(playlistItem) {
        const episodeUrl = playlistItem.dataset.episodeUrl;
        const season = playlistItem.dataset.season;
        const episode = playlistItem.dataset.episode;
        const title = playlistItem.dataset.title;

        // Update episode link
        const episodeLink = document.getElementById('episodeLink');
        if (episodeUrl) {
            episodeLink.href = episodeUrl;
        }

        // Update create post link
        const createPostLink = document.getElementById('createPostLink');
        createPostLink.href = `/forum/create?category=episodes&episodeTitle=${encodeURIComponent(title)}&seasonNumber=${season}&episodeNumber=${episode}`;
    }

    // Mystical element spawner
    startMysticalSpawner() {
        // Spawn elements at random intervals
        this.spawnInterval = setInterval(() => {
            if (this.isPlaying) {
                this.spawnMysticalElement();
            }
        }, 3000); // Spawn every 3 seconds when playing

        // Initial spawn
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.spawnMysticalElement(), i * 600);
        }
    }

    // Spawn a mystical element
    spawnMysticalElement() {
        const canvas = document.getElementById('mystical-canvas');

        // Don't spawn if canvas doesn't exist
        if (!canvas) {
            return;
        }

        const element = document.createElement('div');
        element.classList.add('mystical-element', 'appearing');

        // Random type - goblins are rare (10% chance)
        let type;
        const goblinChance = Math.random();

        if (goblinChance < 0.1) {
            // 10% chance for a goblin - they're rare and valuable!
            type = { emoji: '🧌', class: 'goblin', points: 25, stat: 'goblins', name: 'Goblin' };
        } else {
            // 90% chance for regular collectibles
            const types = [
                { emoji: '🍄', class: 'mushroom', points: 10, stat: 'mushrooms', name: 'Mushroom' },
                { emoji: '🌟', class: 'star', points: 5, stat: 'stars', name: 'Star' },
                { emoji: '🧲', class: 'horseshoe', points: 15, stat: 'horseshoes', name: 'Horseshoe' },
                { emoji: '✨', class: 'sparkle', points: 5, stat: 'sparkles', name: 'Sparkle' },
                { emoji: '🔮', class: 'crystal', points: 8, stat: 'crystals', name: 'Crystal' },
                { emoji: '🌙', class: 'moon', points: 7, stat: 'moons', name: 'Moon' }
            ];
            type = types[Math.floor(Math.random() * types.length)];
        }
        element.classList.add(type.class);
        element.textContent = type.emoji;
        element.dataset.points = type.points;
        element.dataset.stat = type.stat || '';

        // Random position
        const x = Math.random() * (window.innerWidth - 100);
        const y = Math.random() * (window.innerHeight - 100);
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        // Random animation delay
        element.style.animationDelay = `${Math.random() * 2}s`;

        // Click handler
        element.addEventListener('click', () => this.collectElement(element, type));

        canvas.appendChild(element);
        this.activeElements.push(element);

        // Remove after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.remove();
                this.activeElements = this.activeElements.filter(el => el !== element);
            }
        }, 8000);
    }

    // Collect element (game mechanic)
    collectElement(element, type) {
        // Play sound effect
        this.playCollectSound(type);

        // Add collecting animation
        element.classList.remove('appearing');
        element.classList.add('collecting');

        // Update stats for this specific collectible type
        if (type.stat && this.stats.hasOwnProperty(type.stat)) {
            this.stats[type.stat]++;
            localStorage.setItem(`${type.stat.slice(0, -1)}_count`, this.stats[type.stat]);
        }

        // Level up every 50 items (total across all types)
        const totalCollected = this.stats.mushrooms + this.stats.stars +
                               this.stats.horseshoes + this.stats.sparkles +
                               this.stats.crystals + this.stats.moons +
                               this.stats.goblins;
        const newLevel = Math.floor(totalCollected / 50) + 1;
        if (newLevel > this.stats.magicLevel) {
            this.stats.magicLevel = newLevel;
            localStorage.setItem('magic_level', this.stats.magicLevel);
            this.showLevelUpNotification();
        }

        this.recalculateTotalPoints(); // Recalculate total points after collecting
        this.updateStats();

        // Save to Firebase if user is authenticated
        console.log('🎮 Checking if should save to Firebase:', {
            hasUserId: !!this.currentUserId,
            userId: this.currentUserId,
            hasFirebaseDB: !!window.firebaseDB
        });
        if (this.currentUserId) {
            this.saveStatsToFirebase();
        } else {
            console.log('⚠️ Not saving - no currentUserId set');
        }

        // Remove element
        setTimeout(() => {
            element.remove();
            this.activeElements = this.activeElements.filter(el => el !== element);
        }, 600);
    }

    // Update game stats display
    updateStats() {
        // Update individual stat counters (for both full player and widget)
        const elements = {
            // Full radio player elements
            'mushroomCount': this.stats.mushrooms,
            'starCount': this.stats.stars,
            'horseshoeCount': this.stats.horseshoes,
            'sparkleCount': this.stats.sparkles,
            'crystalCount': this.stats.crystals,
            'moonCount': this.stats.moons,
            'goblinCount': this.stats.goblins,
            'magicLevel': this.stats.magicLevel,
            'totalPoints': this.stats.totalPoints,
            // Widget elements
            'globalMushrooms': this.stats.mushrooms,
            'globalStars': this.stats.stars,
            'globalHorseshoes': this.stats.horseshoes,
            'globalSparkles': this.stats.sparkles,
            'globalCrystals': this.stats.crystals,
            'globalMoons': this.stats.moons,
            'globalGoblins': this.stats.goblins,
            'globalTotalScore': this.stats.totalPoints
        };

        // Update each element if it exists (silently skip if not found)
        for (const [elementId, value] of Object.entries(elements)) {
            const element = document.getElementById(elementId);
            if (element) {
                if (elementId === 'totalPoints' || elementId === 'globalTotalScore') {
                    element.textContent = value.toLocaleString();
                } else {
                    element.textContent = value;
                }
            }
            // Silently skip if element not found (radio player runs on multiple pages)
        }

        console.log('📊 Stats updated:', {
            totalPoints: this.stats.totalPoints,
            mushrooms: this.stats.mushrooms,
            stars: this.stats.stars,
            horseshoes: this.stats.horseshoes
        });
    }

    // Recalculate total points from individual stats
    recalculateTotalPoints() {
        // Define point values for each collectible (matching global radio player)
        const pointValues = {
            mushrooms: 10,
            stars: 5,
            horseshoes: 15,
            sparkles: 5,
            crystals: 8,
            moons: 7,
            goblins: 25
        };

        // Calculate total from individual items
        let calculatedTotal = 0;
        for (const [stat, count] of Object.entries(this.stats)) {
            if (pointValues[stat]) {
                calculatedTotal += count * pointValues[stat];
            }
        }

        // Add any bonus game mode points
        calculatedTotal += this.stats.gameModePoints || 0;

        // Always update total points to the calculated value (don't just take the higher value)
        const oldTotal = this.stats.totalPoints;
        this.stats.totalPoints = calculatedTotal;
        localStorage.setItem('total_points', this.stats.totalPoints);
        
        console.log('🔄 Recalculated total points:', {
            from: oldTotal,
            to: calculatedTotal,
            breakdown: Object.entries(pointValues).map(([key, value]) => 
                `${key}: ${this.stats[key]} × ${value} = ${(this.stats[key] || 0) * value}`
            ).join(', '),
            gameModeBonus: this.stats.gameModePoints || 0
        });
        
        // Automatically save to Firebase after recalculation
        if (this.currentUserId) {
            this.saveStatsToFirebase();
        }
    }

    // Debug function to force recalculate and save stats
    forceRecalculateAndSave() {
        console.log('🔧 Force recalculating stats...');
        this.recalculateTotalPoints();
        this.updateStats();
        console.log('Current stats after recalculation:', this.stats);
        return this.stats;
    }

    // Show level up notification
    showLevelUpNotification() {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 30px 50px;
            border-radius: 20px;
            font-size: 2rem;
            z-index: 1000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: levelUpPulse 1s ease-in-out;
        `;
        notification.textContent = `🎉 Level Up! Magic Level ${this.stats.magicLevel} 🎉`;

        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 2000);
    }



    updateGameMode() {
        const activeGameBtn = document.querySelector('.game-btn.active');
        const gameMode = activeGameBtn ? activeGameBtn.dataset.game : 'off';
        
        this.stopGame();
        
        if (gameMode !== 'off') {
            this.startGame(gameMode);
        }
    }

    startGame(difficulty) {
        this.gameActive = true;
        this.gameScore = 0;
        this.gameStartTime = Date.now();
        this.gameCombo = 0;
        this.lastCollectTime = 0;
        
        // Set difficulty parameters
        const difficultySettings = {
            easy: { iconCount: 3, spawnInterval: 4000, speed: '10s' },
            medium: { iconCount: 5, spawnInterval: 3000, speed: '7s' },
            hard: { iconCount: 8, spawnInterval: 2000, speed: '5s' }
        };
        
        this.gameDifficulty = difficultySettings[difficulty] || difficultySettings.easy;
        
        // Available collectible icons
        this.gameIcons = ['🍄', '⭐', '🧲', '✨', '💎', '🌙'];
        
        // Show HUD
        const hud = document.querySelector('.game-hud');
        if (hud) {
            hud.classList.add('visible');
        }
        
        // Start spawning icons
        this.spawnGameIcons();
        this.gameSpawnInterval = setInterval(() => this.spawnGameIcons(), this.gameDifficulty.spawnInterval);
        
        // Start timer
        this.gameTimerInterval = setInterval(() => this.updateGameTimer(), 1000);
        
        console.log(`🎮 Game started in ${difficulty} mode`);
    }

    spawnGameIcons() {
        if (!this.gameActive) return;
        
        const container = document.querySelector('.floating-game-icons');
        if (!container) return;
        
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Create icons up to the difficulty count
        const currentIcons = container.querySelectorAll('.floating-icon').length;
        const iconsToSpawn = Math.min(this.gameDifficulty.iconCount - currentIcons, 2);
        
        for (let i = 0; i < iconsToSpawn; i++) {
            const icon = document.createElement('div');
            icon.className = 'floating-icon clickable';
            
            // Pick random icon
            const randomIcon = this.gameIcons[Math.floor(Math.random() * this.gameIcons.length)];
            icon.textContent = randomIcon;
            
            // Random starting position
            icon.style.left = Math.random() * (w - 100) + 'px';
            icon.style.top = Math.random() * (h - 100) + 'px';
            
            // Set animation speed based on difficulty
            icon.style.animationDuration = this.gameDifficulty.speed;
            icon.style.animationDelay = -(Math.random() * 2) + 's';
            
            // Add click handler for collecting
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.collectGameIcon(icon, randomIcon);
            });
            
            container.appendChild(icon);
        }
    }

    collectGameIcon(icon, iconType) {
        if (!this.gameActive) return;
        
        // Add collecting animation
        icon.classList.add('collecting');
        
        // Check for combo (collected within 2 seconds)
        const now = Date.now();
        if (now - this.lastCollectTime < 2000) {
            this.gameCombo++;
        } else {
            this.gameCombo = 1;
        }
        this.lastCollectTime = now;
        
        // Calculate points with combo multiplier
        let points = 10;
        if (this.gameCombo >= 5) {
            points = 50;
            this.showComboMessage('🔥 FIRE! x5');
        } else if (this.gameCombo >= 3) {
            points = 30;
            this.showComboMessage('⚡ COMBO x3');
        } else if (this.gameCombo >= 2) {
            points = 20;
            this.showComboMessage('✨ NICE x2');
        }
        
        // Increment score
        this.gameScore += points;
        document.getElementById('gameScore').textContent = this.gameScore;
        document.getElementById('hudScore').textContent = this.gameScore;
        
        // Update profile-wide points
        this.stats.gameModePoints += points;
        this.stats.totalPoints += points;
        localStorage.setItem('game_mode_points', this.stats.gameModePoints);
        localStorage.setItem('total_points', this.stats.totalPoints);
        
        // Save to Firebase
        this.saveStatsToFirebase();
        
        // Also update main stats if they exist
        const iconMap = {
            '🍄': 'mushrooms',
            '⭐': 'stars',
            '🧲': 'horseshoes',
            '✨': 'sparkles',
            '💎': 'crystals',
            '🌙': 'moons'
        };
        
        const statName = iconMap[iconType];
        if (statName && this.stats && this.stats.hasOwnProperty(statName)) {
            this.stats[statName]++;
            localStorage.setItem(`${statName.slice(0, -1)}_count`, this.stats[statName]); // Update localStorage
            this.recalculateTotalPoints(); // Recalculate total points
            this.updateStats();
        }
        
        // Remove icon
        setTimeout(() => {
            icon.remove();
        }, 300);
        
        console.log(`🎮 Collected ${iconType}! Score: ${this.gameScore} (+${points} pts, combo: ${this.gameCombo}) | Total Points: ${this.stats.totalPoints.toLocaleString()}`);
    }

    showComboMessage(message) {
        const comboText = document.getElementById('comboText');
        if (!comboText) return;
        
        comboText.textContent = message;
        comboText.classList.remove('show');
        
        // Force reflow
        void comboText.offsetWidth;
        
        comboText.classList.add('show');
        
        // Hide after 1 second
        setTimeout(() => {
            comboText.classList.remove('show');
        }, 1000);
    }

    updateGameTimer() {
        if (!this.gameActive) return;
        
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('gameTimer').textContent = timeString;
        document.getElementById('hudTimer').textContent = timeString;
    }

    stopGame() {
        this.gameActive = false;
        
        if (this.gameSpawnInterval) {
            clearInterval(this.gameSpawnInterval);
            this.gameSpawnInterval = null;
        }
        
        if (this.gameTimerInterval) {
            clearInterval(this.gameTimerInterval);
            this.gameTimerInterval = null;
        }
        
        // Hide HUD
        const hud = document.querySelector('.game-hud');
        if (hud) {
            hud.classList.remove('visible');
        }
        
        // Clear floating icons
        this.clearFloatingIcons();
        
        // Reset display
        if (document.getElementById('gameScore')) {
            document.getElementById('gameScore').textContent = '0';
        }
        if (document.getElementById('gameTimer')) {
            document.getElementById('gameTimer').textContent = '0:00';
        }
        if (document.getElementById('hudScore')) {
            document.getElementById('hudScore').textContent = '0';
        }
        if (document.getElementById('hudTimer')) {
            document.getElementById('hudTimer').textContent = '0:00';
        }
    }

    clearFloatingIcons() {
        const container = document.querySelector('.floating-game-icons');
        if (container) {
            container.innerHTML = '';
        }
    }



    // Weather Effects System
    initWeatherEffects() {
        this.weatherCanvas = document.querySelector('.weather-canvas');
        this.weatherCtx = this.weatherCanvas ? this.weatherCanvas.getContext('2d') : null;
        this.lightningFlash = document.querySelector('.lightning-flash');
        this.particles = [];
        this.currentWeather = null;
        this.weatherAnimationFrame = null;
        this.weatherMode = 'auto'; // 'auto' or specific weather type
        
        // Weather types with their durations (in seconds)
        this.weatherTypes = ['rain', 'snow', 'clear', 'clouds', 'wind', 'lightning'];
        this.weatherDurations = {
            rain: 30,
            snow: 40,
            clear: 20,
            clouds: 25,
            wind: 15,
            lightning: 20
        };
    }

    setWeatherMode(mode) {
        console.log(`🌤️ Weather mode set to: ${mode}`);
        this.weatherMode = mode;
        this.activeWeatherModes = [];
        
        if (mode === 'auto') {
            // Resume auto cycling
            if (this.weatherTimeout) {
                clearTimeout(this.weatherTimeout);
            }
            this.cycleWeather();
        } else {
            // Stop auto cycling and set specific weather
            if (this.weatherTimeout) {
                clearTimeout(this.weatherTimeout);
                this.weatherTimeout = null;
            }
            this.activeWeatherModes = [mode];
            this.initMultiParticles();
        }
    }

    updateActiveWeatherModes() {
        // Get all active weather buttons (except auto)
        const activeBtns = document.querySelectorAll('.weather-mode-btn.active:not([data-weather="auto"])');
        this.activeWeatherModes = Array.from(activeBtns).map(btn => btn.dataset.weather);
        
        console.log(`🌤️ Active weather modes:`, this.activeWeatherModes);
        
        if (this.activeWeatherModes.length === 0) {
            // No modes selected, go back to auto
            const autoBtn = document.querySelector('.weather-mode-btn[data-weather="auto"]');
            if (autoBtn) {
                autoBtn.classList.add('active');
            }
            this.setWeatherMode('auto');
        } else {
            // Stop auto cycling
            if (this.weatherTimeout) {
                clearTimeout(this.weatherTimeout);
                this.weatherTimeout = null;
            }
            this.weatherMode = 'multi';
            this.initMultiParticles();
        }
    }

    initMultiParticles() {
        // Initialize particles for all active weather modes
        this.multiParticles = {};
        this.activeWeatherModes.forEach(weather => {
            this.multiParticles[weather] = [];
            const count = this.getParticleCountForWeather(weather);
            for (let i = 0; i < count; i++) {
                this.multiParticles[weather].push(this.createParticleForWeather(weather));
            }
        });
    }

    getParticleCountForWeather(weather) {
        switch(weather) {
            case 'rain': return 200;
            case 'snow': return 100;
            case 'wind': return 150;
            case 'clouds': return 8;
            default: return 0;
        }
    }

    createParticleForWeather(weather) {
        const w = this.weatherCanvas.width;
        const h = this.weatherCanvas.height;
        
        switch(weather) {
            case 'rain':
                return {
                    x: Math.random() * w,
                    y: Math.random() * h - h,
                    length: 15 + Math.random() * 10,
                    speed: 15 + Math.random() * 10,
                    opacity: 0.3 + Math.random() * 0.4
                };
            case 'snow':
                return {
                    x: Math.random() * w,
                    y: Math.random() * h - h,
                    radius: 2 + Math.random() * 3,
                    speed: 1 + Math.random() * 2,
                    drift: Math.random() * 2 - 1,
                    opacity: 0.4 + Math.random() * 0.4
                };
            case 'wind':
                return {
                    x: -50,
                    y: Math.random() * h,
                    length: 20 + Math.random() * 30,
                    speed: 20 + Math.random() * 15,
                    opacity: 0.1 + Math.random() * 0.2
                };
            case 'clouds':
                return {
                    x: Math.random() * w,
                    y: Math.random() * h * 0.4,
                    width: 150 + Math.random() * 200,
                    height: 60 + Math.random() * 80,
                    speed: 0.3 + Math.random() * 0.5,
                    opacity: 0.3 + Math.random() * 0.3
                };
            default:
                return {};
        }
    }

    startWeatherEffects() {
        if (!this.weatherCanvas || !this.weatherCtx) return;
        
        // Set canvas size
        this.resizeWeatherCanvas();
        window.addEventListener('resize', () => this.resizeWeatherCanvas());
        
        // Start weather cycle
        this.cycleWeather();
    }

    resizeWeatherCanvas() {
        if (!this.weatherCanvas) return;
        this.weatherCanvas.width = window.innerWidth;
        this.weatherCanvas.height = window.innerHeight;
    }

    cycleWeather() {
        // Only cycle if in auto mode
        if (this.weatherMode !== 'auto') {
            return;
        }

        // Pick random weather
        const weatherIndex = Math.floor(Math.random() * this.weatherTypes.length);
        this.currentWeather = this.weatherTypes[weatherIndex];
        const duration = this.weatherDurations[this.currentWeather] * 1000;
        
        console.log(`🌤️ Weather changed to: ${this.currentWeather} for ${duration/1000}s`);
        
        // Initialize particles for this weather
        this.initParticles();
        
        // Start animation if not already running
        if (!this.weatherAnimationFrame) {
            this.animateWeather();
        }
        
        // Schedule next weather change (only in auto mode)
        this.weatherTimeout = setTimeout(() => this.cycleWeather(), duration);
    }

    initParticles() {
        this.particles = [];
        const count = this.getParticleCount();
        
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    getParticleCount() {
        switch(this.currentWeather) {
            case 'rain': return 200;
            case 'snow': return 100;
            case 'wind': return 150;
            case 'clouds': return 8;
            default: return 0;
        }
    }

    createParticle() {
        const w = this.weatherCanvas.width;
        const h = this.weatherCanvas.height;
        
        switch(this.currentWeather) {
            case 'rain':
                return {
                    x: Math.random() * w,
                    y: Math.random() * h - h,
                    length: 15 + Math.random() * 10,
                    speed: 15 + Math.random() * 10,
                    opacity: 0.3 + Math.random() * 0.4
                };
            case 'snow':
                return {
                    x: Math.random() * w,
                    y: Math.random() * h - h,
                    radius: 2 + Math.random() * 3,
                    speed: 1 + Math.random() * 2,
                    drift: Math.random() * 2 - 1,
                    opacity: 0.4 + Math.random() * 0.4
                };
            case 'wind':
                return {
                    x: -50,
                    y: Math.random() * h,
                    length: 20 + Math.random() * 30,
                    speed: 20 + Math.random() * 15,
                    opacity: 0.1 + Math.random() * 0.2
                };
            case 'clouds':
                return {
                    x: Math.random() * w,
                    y: Math.random() * h * 0.4,
                    width: 150 + Math.random() * 200,
                    height: 60 + Math.random() * 80,
                    speed: 0.3 + Math.random() * 0.5,
                    opacity: 0.3 + Math.random() * 0.3
                };
            default:
                return {};
        }
    }

    animateWeather() {
        if (!this.weatherCtx) return;
        
        const ctx = this.weatherCtx;
        const w = this.weatherCanvas.width;
        const h = this.weatherCanvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, w, h);
        
        // Draw based on weather mode
        if (this.weatherMode === 'multi' && this.activeWeatherModes.length > 0) {
            // Draw multiple weather effects simultaneously
            this.activeWeatherModes.forEach(weather => {
                switch(weather) {
                    case 'rain':
                        this.drawRainMulti(ctx, w, h, weather);
                        break;
                    case 'snow':
                        this.drawSnowMulti(ctx, w, h, weather);
                        break;
                    case 'wind':
                        this.drawWindMulti(ctx, w, h, weather);
                        break;
                    case 'clouds':
                        this.drawCloudsMulti(ctx, w, h, weather);
                        break;
                    case 'lightning':
                        this.drawLightning();
                        break;
                    case 'clear':
                        this.drawSunRays(ctx, w, h);
                        break;
                }
            });
        } else {
            // Single weather mode
            switch(this.currentWeather) {
                case 'rain':
                    this.drawRain(ctx, w, h);
                    break;
                case 'snow':
                    this.drawSnow(ctx, w, h);
                    break;
                case 'wind':
                    this.drawWind(ctx, w, h);
                    break;
                case 'clouds':
                    this.drawClouds(ctx, w, h);
                    break;
                case 'lightning':
                    this.drawLightning();
                    break;
                case 'clear':
                    this.drawSunRays(ctx, w, h);
                    break;
            }
        }
        
        // Continue animation
        this.weatherAnimationFrame = requestAnimationFrame(() => this.animateWeather());
    }

    drawRain(ctx, w, h) {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = 1;
        
        this.particles.forEach(drop => {
            ctx.globalAlpha = drop.opacity;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();
            
            // Update position
            drop.y += drop.speed;
            drop.x -= drop.speed * 0.1; // slight angle
            
            // Reset if off screen
            if (drop.y > h) {
                drop.y = -drop.length;
                drop.x = Math.random() * w;
            }
        });
    }

    drawSnow(ctx, w, h) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        this.particles.forEach(flake => {
            ctx.globalAlpha = flake.opacity;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Update position
            flake.y += flake.speed;
            flake.x += flake.drift;
            flake.drift += (Math.random() - 0.5) * 0.1;
            
            // Reset if off screen
            if (flake.y > h) {
                flake.y = -10;
                flake.x = Math.random() * w;
            }
        });
    }

    drawWind(ctx, w, h) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        
        this.particles.forEach(gust => {
            ctx.globalAlpha = gust.opacity;
            ctx.beginPath();
            ctx.moveTo(gust.x, gust.y);
            ctx.lineTo(gust.x + gust.length, gust.y);
            ctx.stroke();
            
            // Update position
            gust.x += gust.speed;
            gust.y += (Math.random() - 0.5) * 2;
            
            // Reset if off screen
            if (gust.x > w) {
                gust.x = -gust.length;
                gust.y = Math.random() * h;
            }
        });
    }

    drawClouds(ctx, w, h) {
        this.particles.forEach(cloud => {
            // Make clouds more visible
            ctx.globalAlpha = cloud.opacity * 0.6; // Even more visible
            
            // Add blur filter for softer edges
            ctx.filter = 'blur(35px)';
            
            // Draw cloud as multiple overlapping circles with gradient
            const gradient = ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.width / 2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            gradient.addColorStop(0.4, 'rgba(245, 248, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(230, 235, 250, 0)');
            
            ctx.fillStyle = gradient;
            
            const circles = 7;
            for (let i = 0; i < circles; i++) {
                const offsetX = (i - 3) * (cloud.width / 8);
                const offsetY = Math.sin(i * 0.8) * (cloud.height / 3);
                const radius = cloud.height / 2 + Math.sin(i * 1.2) * 15;
                ctx.beginPath();
                ctx.arc(cloud.x + offsetX, cloud.y + offsetY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.filter = 'none'; // Reset filter
            
            // Update position
            cloud.x += cloud.speed;
            
            // Reset if off screen
            if (cloud.x > w + cloud.width) {
                cloud.x = -cloud.width;
                cloud.y = Math.random() * h * 0.4;
            }
        });
    }

    drawLightning() {
        // Draw rain during lightning
        this.drawRain(this.weatherCtx, this.weatherCanvas.width, this.weatherCanvas.height);
        
        // Track lightning strikes for auto-rotation
        if (!this.lightningStrikeCount) {
            this.lightningStrikeCount = 0;
        }
        
        // Random lightning strikes with bolts (increased frequency)
        if (Math.random() < 0.025) { // 2.5% chance per frame for more strikes
            // Draw actual lightning bolt (bright and prominent)
            this.drawLightningBolt(this.weatherCtx, this.weatherCanvas.width, this.weatherCanvas.height);
            
            // Increment strike counter
            this.lightningStrikeCount++;
            
            // After 3-5 strikes in auto mode, rotate away from lightning
            if (this.weatherMode === 'auto' && this.lightningStrikeCount >= (3 + Math.floor(Math.random() * 3))) {
                console.log(`⚡ ${this.lightningStrikeCount} lightning strikes - rotating to new weather`);
                this.lightningStrikeCount = 0;
                
                // Schedule immediate weather change
                if (this.weatherTimeout) {
                    clearTimeout(this.weatherTimeout);
                }
                setTimeout(() => this.cycleWeather(), 2000); // Change after 2 seconds
            }
        }
    }

    drawLightningBolt(ctx, w, h) {
        // Start from top of screen
        const startX = Math.random() * w;
        const startY = 0;
        let currentX = startX;
        let currentY = startY;
        
        // Draw main bolt with intense glow
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(200, 220, 255, 1)';
        ctx.globalAlpha = 1;
        
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        
        // Create jagged bolt path with more segments for forked appearance
        const segments = 25 + Math.floor(Math.random() * 15);
        for (let i = 0; i < segments; i++) {
            currentX += (Math.random() - 0.5) * 70;
            currentY += h / segments + (Math.random() - 0.5) * 40;
            
            ctx.lineTo(currentX, currentY);
            
            // More frequent forking for dramatic effect
            if (Math.random() < 0.4) {
                const branchX = currentX + (Math.random() - 0.5) * 150;
                const branchY = currentY + 60 + Math.random() * 120;
                
                // Draw branch
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(currentX, currentY);
                ctx.lineTo(branchX, branchY);
                ctx.stroke();
                
                // Sub-branches for more forking
                if (Math.random() < 0.3) {
                    const subBranchX = branchX + (Math.random() - 0.5) * 80;
                    const subBranchY = branchY + 40 + Math.random() * 60;
                    ctx.beginPath();
                    ctx.moveTo(branchX, branchY);
                    ctx.lineTo(subBranchX, subBranchY);
                    ctx.stroke();
                }
                
                // Continue main bolt
                ctx.beginPath();
                ctx.moveTo(currentX, currentY);
            }
        }
        
        ctx.stroke();
        
        // Add bright core to bolt for intensity
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 50;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        
        // Redraw main bolt path for bright core
        currentX = startX;
        currentY = startY;
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        
        for (let i = 0; i < segments; i++) {
            currentX += (Math.random() - 0.5) * 70;
            currentY += h / segments + (Math.random() - 0.5) * 40;
            ctx.lineTo(currentX, currentY);
        }
        
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawSunRays(ctx, w, h) {
        // Draw soft, subtle sun rays
        const centerX = w * 0.8;
        const centerY = h * 0.15;
        const numRays = 16; // Fewer rays for subtlety
        
        // Add blur filter for soft edges
        ctx.filter = 'blur(20px)';
        
        // Draw main sun rays
        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2 + Date.now() * 0.0002;
            const length = 350 + Math.sin(Date.now() * 0.001 + i) * 80;
            
            const gradient = ctx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
            gradient.addColorStop(0, 'rgba(255, 250, 220, 0.25)');
            gradient.addColorStop(0.3, 'rgba(255, 240, 180, 0.15)');
            gradient.addColorStop(0.6, 'rgba(255, 230, 150, 0.08)');
            gradient.addColorStop(1, 'rgba(255, 220, 120, 0)');
            
            ctx.globalAlpha = 0.4; // Reduced from 0.6
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 50; // Slightly narrower
            ctx.lineCap = 'round'; // Rounded ends for softer look
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
            ctx.stroke();
        }
        
        ctx.filter = 'none'; // Reset filter
        
        // Draw rainbow arc
        this.drawRainbow(ctx, w, h);
    }

    drawRainbow(ctx, w, h) {
        const centerX = w * 0.3;
        const centerY = h * 1.5; // Further below screen for smaller arc
        const baseRadius = h * 0.7; // Smaller radius
        const arcWidth = 25; // Narrower bands
        
        const colors = [
            { r: 255, g: 0, b: 0 },       // Red
            { r: 255, g: 127, b: 0 },     // Orange
            { r: 255, g: 255, b: 0 },     // Yellow
            { r: 0, g: 255, b: 0 },       // Green
            { r: 0, g: 0, b: 255 },       // Blue
            { r: 75, g: 0, b: 130 },      // Indigo
            { r: 148, g: 0, b: 211 }      // Violet
        ];
        
        ctx.lineWidth = arcWidth;
        ctx.filter = 'blur(8px)'; // Add blur for color blending
        
        colors.forEach((color, i) => {
            const radius = baseRadius + (i * arcWidth * 0.8); // Overlap bands more
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
        });
        
        ctx.filter = 'none'; // Reset filter
    }

    // Multi-weather draw methods (use multiParticles)
    drawRainMulti(ctx, w, h, weather) {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = 1;
        
        if (!this.multiParticles[weather]) return;
        
        this.multiParticles[weather].forEach(drop => {
            ctx.globalAlpha = drop.opacity;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();
            
            drop.y += drop.speed;
            drop.x -= drop.speed * 0.1;
            
            if (drop.y > h) {
                drop.y = -drop.length;
                drop.x = Math.random() * w;
            }
        });
    }

    drawSnowMulti(ctx, w, h, weather) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        if (!this.multiParticles[weather]) return;
        
        this.multiParticles[weather].forEach(flake => {
            ctx.globalAlpha = flake.opacity;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            ctx.fill();
            
            flake.y += flake.speed;
            flake.x += flake.drift;
            flake.drift += (Math.random() - 0.5) * 0.1;
            
            if (flake.y > h) {
                flake.y = -10;
                flake.x = Math.random() * w;
            }
        });
    }

    drawWindMulti(ctx, w, h, weather) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        
        if (!this.multiParticles[weather]) return;
        
        this.multiParticles[weather].forEach(gust => {
            ctx.globalAlpha = gust.opacity;
            ctx.beginPath();
            ctx.moveTo(gust.x, gust.y);
            ctx.lineTo(gust.x + gust.length, gust.y);
            ctx.stroke();
            
            gust.x += gust.speed;
            gust.y += (Math.random() - 0.5) * 2;
            
            if (gust.x > w) {
                gust.x = -gust.length;
                gust.y = Math.random() * h;
            }
        });
    }

    drawCloudsMulti(ctx, w, h, weather) {
        if (!this.multiParticles[weather]) return;
        
        this.multiParticles[weather].forEach(cloud => {
            ctx.globalAlpha = cloud.opacity * 0.6;
            ctx.filter = 'blur(35px)';
            
            const gradient = ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.width / 2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            gradient.addColorStop(0.4, 'rgba(245, 248, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(230, 235, 250, 0)');
            
            ctx.fillStyle = gradient;
            
            const circles = 7;
            for (let i = 0; i < circles; i++) {
                const offsetX = (i - 3) * (cloud.width / 8);
                const offsetY = Math.sin(i * 0.8) * (cloud.height / 3);
                const radius = cloud.height / 2 + Math.sin(i * 1.2) * 15;
                ctx.beginPath();
                ctx.arc(cloud.x + offsetX, cloud.y + offsetY, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.filter = 'none';
            
            cloud.x += cloud.speed;
            
            if (cloud.x > w + cloud.width) {
                cloud.x = -cloud.width;
                cloud.y = Math.random() * h * 0.4;
            }
        });
    }

    stopWeatherEffects() {
        if (this.weatherAnimationFrame) {
            cancelAnimationFrame(this.weatherAnimationFrame);
            this.weatherAnimationFrame = null;
        }
        if (this.weatherTimeout) {
            clearTimeout(this.weatherTimeout);
            this.weatherTimeout = null;
        }
        if (this.weatherCtx && this.weatherCanvas) {
            this.weatherCtx.clearRect(0, 0, this.weatherCanvas.width, this.weatherCanvas.height);
        }
    }

    // ===================================
    // MEDIA SESSION API & SYSTEM CONTROLS
    // ===================================

    initMediaSession() {
        if (!('mediaSession' in navigator)) {
            console.log('📱 Media Session API not supported');
            return;
        }

        console.log('📱 Initializing Media Session API');

        navigator.mediaSession.setActionHandler('play', () => {
            console.log('📱 Media key: Play');
            if (!this.isPlaying) this.togglePlay();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            console.log('📱 Media key: Pause');
            if (this.isPlaying) this.togglePlay();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            console.log('📱 Media key: Previous');
            this.previous();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            console.log('📱 Media key: Next');
            this.next();
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            console.log('📱 Media key: Seek backward');
            this.audio.currentTime = Math.max(0, this.audio.currentTime - (details.seekOffset || 10));
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            console.log('📱 Media key: Seek forward');
            this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + (details.seekOffset || 10));
        });

        this.audio.addEventListener('play', () => this.updateMediaSessionMetadata());
        this.audio.addEventListener('pause', () => {
            navigator.mediaSession.playbackState = 'paused';
        });

        console.log('✅ Media Session API initialized');
    }

    updateMediaSessionMetadata() {
        if (!('mediaSession' in navigator) || this.currentTrackIndex < 0) return;

        const track = this.playlist[this.currentTrackIndex];
        if (!track) return;

        const artwork = [];
        if (track.episodeImage) {
            const imageUrl = this.cdnUrl + track.episodeImage;
            artwork.push(
                { src: imageUrl, sizes: '512x512', type: 'image/jpeg' },
                { src: imageUrl, sizes: '256x256', type: 'image/jpeg' },
                { src: imageUrl, sizes: '128x128', type: 'image/jpeg' }
            );
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: 'Wavelength Lore',
            album: `Season ${track.season} • Episode ${track.episode}`,
            artwork: artwork
        });

        navigator.mediaSession.playbackState = 'playing';

        console.log(`📱 Updated media session: ${track.title}`);
    }

    initVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('👁️ Page hidden - continuing playback');
            } else {
                console.log('👁️ Page visible');
            }
        });

        window.addEventListener('blur', () => {
            console.log('👁️ Window blurred - continuing playback');
        });

        window.addEventListener('focus', () => {
            console.log('👁️ Window focused');
        });

        console.log('✅ Visibility handling initialized');
    }
}

// Make class available globally
window.WavelengthRadio = WavelengthRadio;

// Initialize radio player when DOM is ready (guard against double initialization)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.wavelengthRadio) {
        console.log('🎵 Initializing WavelengthRadio instance');
        window.wavelengthRadio = new WavelengthRadio();
    } else {
        console.log('🎵 WavelengthRadio already initialized, skipping');
    }
});

// Add level up animation (only once).
// Guard against duplicate insertion when the same script or init file
// is included more than once across pages.
if (!document.getElementById('wavelength-levelup-style')) {
    const levelUpAnimationStyle = document.createElement('style');
    levelUpAnimationStyle.id = 'wavelength-levelup-style';
    levelUpAnimationStyle.textContent = `
    @keyframes levelUpPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
    }
    `;
    document.head.appendChild(levelUpAnimationStyle);

    // Add dynamic radio player styles for Firebase integration
    const dynamicRadioStyles = document.createElement('style');
    dynamicRadioStyles.id = 'wavelength-dynamic-radio-styles';
    dynamicRadioStyles.textContent = `
    /* Notification animations */
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    /* Loading indicator styles */
    .loading-indicator {
        text-align: center;
        padding: 40px 20px;
        font-size: 1.1rem;
        color: #7b68ee;
        animation: pulse 2s infinite ease-in-out;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 0.6;
        }
        50% {
            opacity: 1;
        }
    }

    /* Health indicator styles */
    #apiHealthIndicator {
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: 10px;
        transition: transform 0.2s ease;
    }

    #apiHealthIndicator:hover {
        transform: scale(1.2);
    }

    /* Refresh button styles */
    #refreshPlaylistBtn {
        background: linear-gradient(135deg, #4a90e2, #7b68ee);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        margin-left: 10px;
    }

    #refreshPlaylistBtn:hover:not(:disabled) {
        background: linear-gradient(135deg, #357abd, #6a59d9);
        transform: translateY(-1px);
    }

    #refreshPlaylistBtn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Enhanced playlist item animations */
    .playlist-item {
        transition: all 0.3s ease;
        border-left: 3px solid transparent;
    }

    .playlist-item:hover {
        background: rgba(123, 104, 238, 0.1);
        border-left-color: #7b68ee;
    }

    .playlist-item.active {
        background: linear-gradient(90deg, rgba(123, 104, 238, 0.2), transparent);
        border-left-color: #7b68ee;
    }

    .playlist-item.hidden {
        display: none;
    }
    `;
    
    if (!document.getElementById('wavelength-dynamic-radio-styles')) {
        document.head.appendChild(dynamicRadioStyles);
    }
}

} // End of WavelengthRadio guard
