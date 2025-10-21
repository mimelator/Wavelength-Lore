// Global Radio Game - Full-page collectibles with functional mini radio player

class GlobalRadioGame {
    constructor() {
        // Game stats
        this.stats = {
            mushrooms: parseInt(localStorage.getItem('mushroom_count') || '0'),
            stars: parseInt(localStorage.getItem('star_count') || '0'),
            horseshoes: parseInt(localStorage.getItem('horseshoe_count') || '0'),
            sparkles: parseInt(localStorage.getItem('sparkle_count') || '0'),
            crystals: parseInt(localStorage.getItem('crystal_count') || '0'),
            moons: parseInt(localStorage.getItem('moon_count') || '0'),
            goblins: parseInt(localStorage.getItem('goblin_count') || '0')
        };

        // Widget state
        this.isActive = localStorage.getItem('global_radio_game_active') === 'true';
        this.isEnabled = localStorage.getItem('global_radio_game_enabled') !== 'false';

        // Game state
        this.spawnInterval = null;
        this.activeElements = [];

        // Sound effects
        this.soundEnabled = localStorage.getItem('radio_sound_enabled') !== 'false';
        this.audioContext = null;

        // Radio player state
        this.audio = null;
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;

        this.init();
    }

    async init() {
        if (!this.isEnabled) {
            this.hideGame();
            return;
        }

        this.bindControls();
        this.updateStats();
        this.initSoundSystem();
        await this.loadPlaylist();
        this.bindRadioControls();

        // Restore previous active state
        if (this.isActive) {
            this.showWidget();
            this.startSpawning();
        }

        // Auto-resume playback if it was playing before navigation
        this.restorePlaybackState();
    }

    async loadPlaylist() {
        try {
            const response = await fetch('/api/radio/playlist');
            if (response.ok) {
                this.playlist = await response.json();
                console.log(`📻 Loaded ${this.playlist.length} tracks`);
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            // Fallback: Use empty playlist
            this.playlist = [];
        }
    }

    bindControls() {
        const toggle = document.getElementById('radioGameToggle');
        const closeBtn = document.getElementById('closeGameBtn');

        if (toggle) {
            toggle.addEventListener('click', () => this.toggleWidget());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideWidget());
        }
    }

    bindRadioControls() {
        this.audio = document.getElementById('globalRadioAudio');

        const playBtn = document.getElementById('globalPlayBtn');
        const prevBtn = document.getElementById('globalPrevBtn');
        const nextBtn = document.getElementById('globalNextBtn');
        const volumeSlider = document.getElementById('globalVolumeSlider');

        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
            this.setVolume(volumeSlider.value);
        }

        if (this.audio) {
            this.audio.addEventListener('ended', () => this.next());

            // Periodically save playback state while playing
            this.audio.addEventListener('timeupdate', () => {
                if (this.isPlaying) {
                    this.savePlaybackState();
                }
            });

            // Save state when pausing
            this.audio.addEventListener('pause', () => {
                this.savePlaybackState();
            });
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.currentTrackIndex === -1 && this.playlist.length > 0) {
            this.playTrack(0);
        } else if (this.audio) {
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            this.startSpawning(); // Start spawning collectibles when music plays
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
            this.stopSpawning(); // Stop spawning when music pauses
        }
    }

    playTrack(index, startTime = 0) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentTrackIndex = index;
        const track = this.playlist[index];

        // Build CDN path
        const cdnUrl = window.CDN_URL || '';
        const audioPath = `${cdnUrl}/images/seasons/season${track.season}/episodes/episode${track.episode}/${track.file}`;

        this.audio.src = audioPath;
        this.audio.load();

        // Update UI
        this.updateNowPlaying(track);

        // Set start time if resuming
        if (startTime > 0) {
            this.audio.currentTime = startTime;
        }

        // Play
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.savePlaybackState();
            this.startSpawning(); // Start spawning when track plays
        }).catch(err => {
            console.error('Error playing audio:', err);
        });
    }

    savePlaybackState() {
        // Save current playback state to localStorage for cross-page persistence
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

    restorePlaybackState() {
        try {
            const savedState = localStorage.getItem('global_radio_playback_state');
            if (!savedState) return;

            const state = JSON.parse(savedState);

            // Only restore if the state is recent (within last 5 minutes)
            const fiveMinutes = 5 * 60 * 1000;
            if (Date.now() - state.timestamp > fiveMinutes) {
                localStorage.removeItem('global_radio_playback_state');
                return;
            }

            // Restore track and position if it was playing
            if (state.isPlaying && this.playlist.length > 0) {
                console.log(`📻 Resuming playback: Track ${state.trackIndex} at ${Math.floor(state.currentTime)}s`);

                // Set volume
                if (state.volume !== undefined) {
                    this.audio.volume = state.volume;
                    const volumeSlider = document.getElementById('globalVolumeSlider');
                    if (volumeSlider) {
                        volumeSlider.value = state.volume * 100;
                    }
                }

                // Resume playback
                setTimeout(() => {
                    this.playTrack(state.trackIndex, state.currentTime);
                }, 500); // Small delay to ensure everything is loaded
            } else if (!state.isPlaying) {
                // If it was paused, restore the track and position but don't auto-play
                console.log(`📻 Restoring paused track: Track ${state.trackIndex} at ${Math.floor(state.currentTime)}s`);
                
                if (state.volume !== undefined) {
                    this.audio.volume = state.volume;
                    const volumeSlider = document.getElementById('globalVolumeSlider');
                    if (volumeSlider) {
                        volumeSlider.value = state.volume * 100;
                    }
                }

                // Load the track at the saved position without playing
                setTimeout(() => {
                    if (this.playlist.length > 0 && state.trackIndex >= 0 && state.trackIndex < this.playlist.length) {
                        this.currentTrackIndex = state.trackIndex;
                        const track = this.playlist[state.trackIndex];
                        const cdnUrl = window.CDN_URL || '';
                        const audioPath = `${cdnUrl}/images/seasons/season${track.season}/episodes/episode${track.episode}/${track.file}`;
                        
                        this.audio.src = audioPath;
                        this.audio.load();
                        this.updateNowPlaying(track);
                        
                        this.audio.addEventListener('loadedmetadata', () => {
                            this.audio.currentTime = state.currentTime;
                        }, { once: true });
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error restoring playback state:', error);
            localStorage.removeItem('global_radio_playback_state');
        }
    }

    updateNowPlaying(track) {
        const titleEl = document.getElementById('globalTrackTitle');
        const metaEl = document.getElementById('globalTrackMeta');

        if (titleEl) {
            titleEl.textContent = track.title;
        }

        if (metaEl) {
            metaEl.textContent = `Season ${track.season}, Episode ${track.episode}`;
        }
    }

    updatePlayButton() {
        const playBtn = document.getElementById('globalPlayBtn');
        if (playBtn) {
            playBtn.textContent = this.isPlaying ? '⏸' : '▶';
            playBtn.title = this.isPlaying ? 'Pause' : 'Play';
        }
    }

    previous() {
        if (this.currentTrackIndex > 0) {
            this.playTrack(this.currentTrackIndex - 1);
        }
    }

    next() {
        if (this.currentTrackIndex < this.playlist.length - 1) {
            this.playTrack(this.currentTrackIndex + 1);
        } else {
            // Loop back to start
            this.playTrack(0);
        }
    }

    setVolume(value) {
        if (this.audio) {
            this.audio.volume = value / 100;
        }
    }

    toggleWidget() {
        if (this.isActive) {
            this.hideWidget();
        } else {
            this.showWidget();
        }
    }

    showWidget() {
        const widget = document.getElementById('radioGameWidget');
        if (widget) {
            widget.classList.add('active');
            this.isActive = true;
            localStorage.setItem('global_radio_game_active', 'true');
            // Start spawning if music is playing
            if (this.isPlaying) {
                this.startSpawning();
            }
        }
    }

    hideWidget() {
        const widget = document.getElementById('radioGameWidget');
        if (widget) {
            widget.classList.remove('active');
            this.isActive = false;
            localStorage.setItem('global_radio_game_active', 'false');
            // Keep spawning if music is playing! Don't stop spawning when minimizing
            // this.stopSpawning(); // REMOVED - we want collectibles even when minimized
        }
    }

    hideGame() {
        const gameContainer = document.getElementById('globalRadioGame');
        const canvas = document.getElementById('globalGameCanvas');
        if (gameContainer) {
            gameContainer.classList.add('disabled');
        }
        if (canvas) {
            canvas.style.display = 'none';
        }
    }

    showGame() {
        const gameContainer = document.getElementById('globalRadioGame');
        const canvas = document.getElementById('globalGameCanvas');
        if (gameContainer) {
            gameContainer.classList.remove('disabled');
        }
        if (canvas) {
            canvas.style.display = 'block';
        }
    }

    startSpawning() {
        if (this.spawnInterval) return;

        this.spawnInterval = setInterval(() => {
            this.spawnCollectible();
        }, 3000);
    }

    stopSpawning() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

        this.activeElements.forEach(el => el.element.remove());
        this.activeElements = [];
    }

    spawnCollectible() {
        const canvas = document.getElementById('globalGameCanvas');
        if (!canvas) return;

        const types = [
            { class: 'mushroom', emoji: '🍄', points: 10 },
            { class: 'star', emoji: '⭐', points: 5 },
            { class: 'horseshoe', emoji: '🧲', points: 15 },
            { class: 'sparkle', emoji: '✨', points: 5 },
            { class: 'crystal', emoji: '💎', points: 8 },
            { class: 'moon', emoji: '🌙', points: 7 }
        ];

        if (Math.random() < 0.05) {
            types.push({ class: 'goblin', emoji: '👺', points: 25 });
        }

        const type = types[Math.floor(Math.random() * types.length)];

        const element = document.createElement('div');
        element.className = `mystical-element ${type.class}`;
        element.textContent = type.emoji;
        element.style.position = 'absolute';
        element.style.left = `${Math.random() * 90 + 5}%`;
        element.style.top = `${Math.random() * 80 + 10}%`;
        element.style.fontSize = '2.5rem';
        element.style.cursor = 'pointer';
        element.style.animation = 'float 3s ease-in-out infinite, fadeIn 0.3s ease';
        element.style.transition = 'all 0.3s ease';

        if (type.class === 'horseshoe') {
            element.style.filter = 'drop-shadow(0 0 8px #00ff00) drop-shadow(0 0 15px #39ff14) brightness(0) saturate(100%) invert(100%) sepia(100%) saturate(10000%) hue-rotate(90deg)';
        }

        element.addEventListener('click', () => this.collectItem(element, type));

        canvas.appendChild(element);

        const elementData = { element, type, timestamp: Date.now() };
        this.activeElements.push(elementData);

        setTimeout(() => {
            if (element.parentNode) {
                element.style.opacity = '0';
                setTimeout(() => {
                    element.remove();
                    this.activeElements = this.activeElements.filter(e => e.element !== element);
                }, 300);
            }
        }, 5000);
    }

    collectItem(element, type) {
        this.playCollectSound(type);

        element.style.transform = 'scale(1.5) rotate(360deg)';
        element.style.opacity = '0';

        this.stats[type.class + 's']++;
        localStorage.setItem(`${type.class}_count`, this.stats[type.class + 's']);
        this.updateStats();
        this.syncToFirebase();

        setTimeout(() => {
            element.remove();
            this.activeElements = this.activeElements.filter(e => e.element !== element);
        }, 300);
    }

    updateStats() {
        document.getElementById('globalMushrooms').textContent = this.stats.mushrooms;
        document.getElementById('globalStars').textContent = this.stats.stars;
        document.getElementById('globalHorseshoes').textContent = this.stats.horseshoes;
        document.getElementById('globalSparkles').textContent = this.stats.sparkles;
        document.getElementById('globalCrystals').textContent = this.stats.crystals;
        document.getElementById('globalMoons').textContent = this.stats.moons;
        document.getElementById('globalGoblins').textContent = this.stats.goblins;

        const totalScore = (this.stats.mushrooms * 10) +
                          (this.stats.stars * 5) +
                          (this.stats.horseshoes * 15) +
                          (this.stats.sparkles * 5) +
                          (this.stats.crystals * 8) +
                          (this.stats.moons * 7) +
                          (this.stats.goblins * 25);

        document.getElementById('globalTotalScore').textContent = totalScore;
    }

    async syncToFirebase() {
        if (!window.firebaseDB || !window.firebaseAuth || !window.firebaseAuth.currentUser) {
            return;
        }

        try {
            const userId = window.firebaseAuth.currentUser.uid;
            const userStatsRef = window.firebaseUtils.ref(window.firebaseDB, `users/${userId}/radioPlayerStats`);

            await window.firebaseUtils.set(userStatsRef, {
                mushrooms: this.stats.mushrooms,
                stars: this.stats.stars,
                horseshoes: this.stats.horseshoes,
                sparkles: this.stats.sparkles,
                crystals: this.stats.crystals,
                moons: this.stats.moons,
                goblins: this.stats.goblins,
                magicLevel: 1,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Error syncing to Firebase:', error);
        }
    }

    initSoundSystem() {
        if (!this.soundEnabled) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.soundEnabled = false;
        }
    }

    playCollectSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        switch (type.class) {
            case 'mushroom':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.linearRampToValueAtTime(600, now + 0.1);
                break;
            case 'star':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.linearRampToValueAtTime(1200, now + 0.15);
                break;
            case 'horseshoe':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(500, now);
                oscillator.frequency.linearRampToValueAtTime(300, now + 0.2);
                break;
            case 'sparkle':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1000, now);
                oscillator.frequency.linearRampToValueAtTime(1500, now + 0.1);
                break;
            case 'crystal':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(700, now);
                oscillator.frequency.linearRampToValueAtTime(900, now + 0.15);
                break;
            case 'moon':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(350, now);
                oscillator.frequency.linearRampToValueAtTime(550, now + 0.2);
                break;
            case 'goblin':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
                break;
        }

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    enableGame() {
        this.isEnabled = true;
        localStorage.setItem('global_radio_game_enabled', 'true');
        this.showGame();
        this.init();
    }

    disableGame() {
        this.isEnabled = false;
        localStorage.setItem('global_radio_game_enabled', 'false');
        this.stopSpawning();
        this.hideGame();
    }
}

// Prevent duplicate initialization
if (window.globalRadioGame) {
    console.log('Global Radio Game already initialized');
} else {
    // Floating animation for collectibles (only add if not already present)
    if (!document.getElementById('global-radio-game-animations')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'global-radio-game-animations';
        styleElement.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(styleElement);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.globalRadioGame = new GlobalRadioGame();
        });
    } else {
        window.globalRadioGame = new GlobalRadioGame();
    }
}
