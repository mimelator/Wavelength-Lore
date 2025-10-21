// Wavelength Radio Player - Interactive Music Player with Game Elements

class WavelengthRadio {
    constructor() {
        // Audio elements
        this.audio = document.getElementById('audioPlayer');
        this.playlist = window.WAVELENGTH_PLAYLIST || [];
        this.cdnUrl = window.CDN_URL || '';

        // Player state
        this.currentTrackIndex = -1;
        this.playMode = 'sequential'; // sequential, random, loop
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
            magicLevel: parseInt(localStorage.getItem('magic_level') || '1')
        };

        // Visual elements spawning
        this.spawnInterval = null;
        this.activeElements = [];

        // Sound effects
        this.soundEnabled = localStorage.getItem('radio_sound_enabled') !== 'false'; // Enabled by default
        this.audioContext = null;

        // Initialize
        this.init();
    }

    init() {
        this.bindControls();
        this.bindPlaylist();
        this.bindAudioEvents();
        this.updateStats();
        this.startMysticalSpawner();
        this.loadFavorites();
        this.initFirebaseSync();
        this.initSoundSystem();
        this.bindSoundToggle();
        this.initScreenSaver();
        this.initWeatherEffects();

        // Auto-resume from global radio player if it was playing
        this.restoreGlobalPlayerState();
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
        // Wait for Firebase to be ready
        if (window.firebaseAuth && window.firebaseUtils) {
            window.firebaseUtils.onAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    this.currentUserId = user.uid;
                    this.loadStatsFromFirebase();
                    this.loadFavoritesFromFirebase();
                }
            });
        } else {
            // Retry after a delay if Firebase isn't ready yet
            setTimeout(() => this.initFirebaseSync(), 500);
        }
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

                // Update localStorage with merged values
                localStorage.setItem('mushroom_count', this.stats.mushrooms);
                localStorage.setItem('star_count', this.stats.stars);
                localStorage.setItem('horseshoe_count', this.stats.horseshoes);
                localStorage.setItem('sparkle_count', this.stats.sparkles);
                localStorage.setItem('crystal_count', this.stats.crystals);
                localStorage.setItem('moon_count', this.stats.moons);
                localStorage.setItem('goblin_count', this.stats.goblins);
                localStorage.setItem('magic_level', this.stats.magicLevel);

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
        if (!this.currentUserId || !window.firebaseDB) return;

        try {
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
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Error saving stats to Firebase:', error);
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
        // Play/Pause
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlay());

        // Previous/Next
        document.getElementById('prevBtn').addEventListener('click', () => this.previous());
        document.getElementById('nextBtn').addEventListener('click', () => this.next());

        // Shuffle
        document.getElementById('shuffleBtn').addEventListener('click', () => this.toggleShuffle());

        // Repeat
        document.getElementById('repeatBtn').addEventListener('click', () => this.cycleRepeat());

        // Volume
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.setVolume(volumeSlider.value);

        // Progress bar
        const progressBar = document.querySelector('.progress-bar');
        const progressHandle = document.getElementById('progressHandle');

        let isDragging = false;

        progressHandle.addEventListener('mousedown', () => isDragging = true);
        document.addEventListener('mouseup', () => isDragging = false);

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.seek(e, progressBar);
            }
        });

        progressBar.addEventListener('click', (e) => this.seek(e, progressBar));

        // Playlist mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setPlayMode(e.target.dataset.mode));
        });

        // Season filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterBySeason(e.target.dataset.season));
        });

        // Mobile expand button
        const expandBtn = document.getElementById('mobileExpandBtn');
        const radioPlayer = document.getElementById('radioPlayer');
        if (expandBtn && radioPlayer) {
            expandBtn.addEventListener('click', () => {
                radioPlayer.classList.toggle('expanded');
            });
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
        });
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.savePlaybackState();
        });
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            // Try next track if current fails
            this.next();
        });
    }

    // Play specific track
    playTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentTrackIndex = index;
        const track = this.playlist[index];

        console.log(`🎵 Playing track ${index}: "${track.title}" (S${track.season}E${track.episode})`);

        // Build audio path
        const audioPath = `${this.cdnUrl}/images/seasons/season${track.season}/episodes/episode${track.episode}/${track.file}`;

        this.audio.src = audioPath;
        this.audio.load();

        // Update UI
        this.updateNowPlaying(track);
        this.updatePlaylistUI();

        // Update screen saver images if active
        if (this.screensaverActive) {
            this.updateScreenSaverImages();
        }

        // Play
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
                document.querySelector('.album-art').classList.add('playing');
            }).catch(error => {
                console.error('Playback error:', error);
            });
        }
    }

    // Toggle play/pause
    togglePlay() {
        if (this.currentTrackIndex === -1) {
            // Start with first track
            this.playTrack(0);
            return;
        }

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            document.querySelector('.album-art').classList.remove('playing');
        } else {
            this.audio.play();
            this.isPlaying = true;
            document.querySelector('.album-art').classList.add('playing');
        }

        this.updatePlayButton();
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
        } else if (this.repeatMode === 'all' || this.currentTrackIndex < this.playlist.length - 1) {
            this.next();
        } else {
            this.isPlaying = false;
            this.updatePlayButton();
            document.querySelector('.album-art').classList.remove('playing');
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
        this.audio.volume = value / 100;
        document.getElementById('volumeValue').textContent = `${value}%`;
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
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('progressHandle').style.left = `${percent}%`;

        document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
    }

    // Update duration display
    updateDuration() {
        document.getElementById('duration').textContent = this.formatTime(this.audio.duration);
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
        document.getElementById('trackTitle').textContent = track.title;
        document.getElementById('trackEpisode').textContent = `Season ${track.season} • Episode ${track.episode}`;

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

    // Update play button
    updatePlayButton() {
        const icon = document.getElementById('playIcon');
        icon.textContent = this.isPlaying ? '⏸' : '▶';
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

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        if (mode === 'random') {
            this.isShuffle = true;
            document.getElementById('shuffleBtn').classList.add('active');
        } else if (mode === 'sequential') {
            this.isShuffle = false;
            document.getElementById('shuffleBtn').classList.remove('active');
        } else if (mode === 'loop') {
            // Loop through favorites
            this.isShuffle = false;
            document.getElementById('shuffleBtn').classList.remove('active');

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

    // Filter by season
    filterBySeason(season) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.season === season);
        });

        document.querySelectorAll('.playlist-item').forEach(item => {
            if (season === 'all' || item.dataset.season === season) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
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

                // Link to character page
                badge.addEventListener('click', () => {
                    window.open(`/character/${character.id}`, '_blank');
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

        this.updateStats();

        // Save to Firebase if user is authenticated
        if (this.currentUserId) {
            this.saveStatsToFirebase();
        }

        // Remove element
        setTimeout(() => {
            element.remove();
            this.activeElements = this.activeElements.filter(el => el !== element);
        }, 600);
    }

    // Update game stats display
    updateStats() {
        document.getElementById('mushroomCount').textContent = this.stats.mushrooms;
        document.getElementById('starCount').textContent = this.stats.stars;
        document.getElementById('horseshoeCount').textContent = this.stats.horseshoes;
        document.getElementById('sparkleCount').textContent = this.stats.sparkles;
        document.getElementById('crystalCount').textContent = this.stats.crystals;
        document.getElementById('moonCount').textContent = this.stats.moons;
        document.getElementById('goblinCount').textContent = this.stats.goblins;
        document.getElementById('magicLevel').textContent = this.stats.magicLevel;
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

    // ===================================
    // SCREEN SAVER MODE
    // ===================================

    saveScreenSaverPreferences() {
        try {
            const preferences = {
                weather: [],
                imageEffects: [],
                icons: [],
                lyrics: 'off',
                title: 'on'
            };

            // Save active weather modes
            document.querySelectorAll('.weather-btn.active').forEach(btn => {
                preferences.weather.push(btn.dataset.weather);
            });

            // Save active image effects
            document.querySelectorAll('.image-btn.active').forEach(btn => {
                preferences.imageEffects.push(btn.dataset.effect);
            });

            // Save active game icons
            document.querySelectorAll('.icon-btn.active').forEach(btn => {
                preferences.icons.push(btn.textContent.trim());
            });

            // Save lyrics mode
            const activeLyricsBtn = document.querySelector('.lyrics-btn.active');
            if (activeLyricsBtn) {
                preferences.lyrics = activeLyricsBtn.dataset.lyrics;
            }

            // Save title display preference
            const activeTitleBtn = document.querySelector('.title-btn.active');
            if (activeTitleBtn) {
                preferences.title = activeTitleBtn.dataset.title;
            }

            localStorage.setItem('wavelength_screensaver_prefs', JSON.stringify(preferences));
            console.log('💾 Saved screen saver preferences:', preferences);
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    loadScreenSaverPreferences() {
        try {
            const saved = localStorage.getItem('wavelength_screensaver_prefs');
            if (!saved) {
                console.log('📂 No saved preferences found, using defaults');
                return;
            }

            const preferences = JSON.parse(saved);
            console.log('📂 Loading screen saver preferences:', preferences);

            // Restore weather modes
            document.querySelectorAll('.weather-btn').forEach(btn => {
                const weather = btn.dataset.weather;
                if (preferences.weather.includes(weather)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Restore image effects
            document.querySelectorAll('.image-btn').forEach(btn => {
                const effect = btn.dataset.effect;
                if (preferences.imageEffects.includes(effect)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Restore game icons
            document.querySelectorAll('.icon-btn').forEach(btn => {
                const icon = btn.textContent.trim();
                if (preferences.icons.includes(icon)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Restore lyrics mode
            document.querySelectorAll('.lyrics-btn').forEach(btn => {
                if (btn.dataset.lyrics === preferences.lyrics) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Restore title display preference
            document.querySelectorAll('.title-btn').forEach(btn => {
                if (btn.dataset.title === preferences.title) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            console.log('✅ Screen saver preferences restored');
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    initScreenSaver() {
        this.screensaverActive = false;
        this.screensaverInterval = null;
        this.screensaverImages = [];
        this.currentScreensaverIndex = 0;

        // Load saved preferences
        this.loadScreenSaverPreferences();

        // Bind toggle button
        const toggleBtn = document.getElementById('screensaverToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleScreenSaver());
        }

        // Bind minimal controls
        const screensaverPlayPause = document.getElementById('screensaverPlayPause');
        const screensaverPrev = document.getElementById('screensaverPrev');
        const screensaverNext = document.getElementById('screensaverNext');

        if (screensaverPlayPause) {
            screensaverPlayPause.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlay();
            });
        }

        if (screensaverPrev) {
            screensaverPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                this.previous();
            });
        }

        if (screensaverNext) {
            screensaverNext.addEventListener('click', (e) => {
                e.stopPropagation();
                this.next();
            });
        }

        // Bind customization toggle
        const customizationToggle = document.getElementById('customizationToggle');
        const customizationPanel = document.getElementById('customizationPanel');
        
        if (customizationToggle && customizationPanel) {
            customizationToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                customizationPanel.classList.toggle('expanded');
            });
        }

        // Bind weather mode selector buttons (multi-select support)
        const weatherBtns = document.querySelectorAll('.weather-btn');
        weatherBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const weatherMode = btn.dataset.weather;
                
                if (weatherMode === 'auto') {
                    // Auto mode: deselect all others
                    weatherBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.setWeatherMode('auto');
                } else {
                    // Toggle this weather effect
                    btn.classList.toggle('active');
                    
                    // If toggling on a weather, remove auto
                    const autoBtn = document.querySelector('.weather-btn[data-weather="auto"]');
                    if (btn.classList.contains('active') && autoBtn) {
                        autoBtn.classList.remove('active');
                    }
                    
                    // Update active weather modes
                    this.updateActiveWeatherModes();
                }
                
                // Save preferences
                this.saveScreenSaverPreferences();
            });
        });

        // Bind image effect buttons
        const imageBtns = document.querySelectorAll('.image-btn');
        imageBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.classList.toggle('active');
                this.updateActiveImageEffects();
                this.saveScreenSaverPreferences();
            });
        });

        // Bind game icon buttons
        const iconBtns = document.querySelectorAll('.icon-btn');
        iconBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.classList.toggle('active');
                this.updateFloatingIcons();
                this.saveScreenSaverPreferences();
            });
        });

        // Bind lyrics buttons
        const lyricsBtns = document.querySelectorAll('.lyrics-btn');
        lyricsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Remove active class from all lyrics buttons
                lyricsBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                // Update lyrics display
                this.updateLyricsDisplay();
                this.saveScreenSaverPreferences();
            });
        });

        // Bind title display buttons
        const titleBtns = document.querySelectorAll('.title-btn');
        titleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Remove active class from all title buttons
                titleBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                this.saveScreenSaverPreferences();
            });
        });

        // Exit screen saver on any key press or click (except on controls)
        document.addEventListener('keydown', (e) => {
            if (this.screensaverActive) {
                this.exitScreenSaver();
            }
        });

        const overlay = document.getElementById('screensaverOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                // Check if customization panel is open
                const customizationPanel = document.getElementById('customizationPanel');
                const isCustomizationOpen = customizationPanel && customizationPanel.classList.contains('expanded');
                
                // If customization is open and click is outside of it, just close customization
                if (isCustomizationOpen && !e.target.closest('.screensaver-customization')) {
                    customizationPanel.classList.remove('expanded');
                    return; // Don't exit screen saver
                }
                
                // Don't exit if clicking on controls or customization
                if (!e.target.closest('.screensaver-minimal-controls') && 
                    !e.target.closest('.screensaver-customization')) {
                    this.exitScreenSaver();
                }
            });
        }
    }

    updateActiveImageEffects() {
        // Get all active image effect buttons
        const activeEffectBtns = document.querySelectorAll('.image-btn.active');
        const activeEffects = Array.from(activeEffectBtns).map(btn => btn.dataset.effect);
        
        console.log(`🖼️ Active image effects:`, activeEffects);
        
        // Build custom animation based on selected effects
        this.applyImageEffects(activeEffects);
    }

    applyImageEffects(effects) {
        const gallery = document.querySelector('.screensaver-gallery');
        if (!gallery) return;

        // Build keyframes based on selected effects
        let keyframes = '@keyframes customWarpFilter {\n';
        keyframes += '    0% {\n';
        keyframes += '        filter:';
        
        const filters = [];
        
        if (effects.includes('hue')) {
            filters.push(' hue-rotate(0deg)');
        }
        if (effects.includes('brightness')) {
            filters.push(' brightness(0.9)');
        }
        if (effects.includes('contrast')) {
            filters.push(' contrast(1)');
        }
        
        keyframes += filters.join('') + ';\n';
        
        let transform = '        transform:';
        const transforms = [];
        
        if (effects.includes('zoom')) {
            transforms.push(' scale(1)');
        }
        if (effects.includes('rotate')) {
            transforms.push(' rotate(0deg)');
        }
        
        if (transforms.length > 0) {
            keyframes += transform + transforms.join('') + ';\n';
        }
        
        keyframes += '    }\n';
        keyframes += '    50% {\n';
        keyframes += '        filter:';
        
        const filters50 = [];
        
        if (effects.includes('hue')) {
            filters50.push(' hue-rotate(180deg)');
        }
        if (effects.includes('brightness')) {
            filters50.push(' brightness(1.2)');
        }
        if (effects.includes('contrast')) {
            filters50.push(' contrast(1.35)');
        }
        
        keyframes += filters50.join('') + ';\n';
        
        if (transforms.length > 0) {
            keyframes += '        transform:';
            const transforms50 = [];
            
            if (effects.includes('zoom')) {
                transforms50.push(' scale(1.25)');
            }
            if (effects.includes('rotate')) {
                transforms50.push(' rotate(3deg)');
            }
            
            keyframes += transforms50.join('') + ';\n';
        }
        
        keyframes += '    }\n';
        keyframes += '    100% {\n';
        keyframes += '        filter:';
        
        const filters100 = [];
        
        if (effects.includes('hue')) {
            filters100.push(' hue-rotate(360deg)');
        }
        if (effects.includes('brightness')) {
            filters100.push(' brightness(0.9)');
        }
        if (effects.includes('contrast')) {
            filters100.push(' contrast(1)');
        }
        
        keyframes += filters100.join('') + ';\n';
        
        if (transforms.length > 0) {
            keyframes += '        transform:';
            const transforms100 = [];
            
            if (effects.includes('zoom')) {
                transforms100.push(' scale(1)');
            }
            if (effects.includes('rotate')) {
                transforms100.push(' rotate(0deg)');
            }
            
            keyframes += transforms100.join('') + ';\n';
        }
        
        keyframes += '    }\n';
        keyframes += '}\n';

        // Remove old custom animation style
        let styleEl = document.getElementById('customImageEffects');
        if (styleEl) {
            styleEl.remove();
        }

        // Add new animation if any effects selected
        if (effects.length > 0) {
            styleEl = document.createElement('style');
            styleEl.id = 'customImageEffects';
            styleEl.textContent = keyframes + '\n.screensaver-gallery img { animation: customWarpFilter 45s ease-in-out infinite !important; }';
            document.head.appendChild(styleEl);
        } else {
            // Reset to default warpFilter if no effects
            styleEl = document.createElement('style');
            styleEl.id = 'customImageEffects';
            styleEl.textContent = '.screensaver-gallery img { animation: warpFilter 45s ease-in-out infinite !important; }';
            document.head.appendChild(styleEl);
        }
    }

    toggleScreenSaver() {
        if (this.screensaverActive) {
            this.exitScreenSaver();
        } else {
            this.enterScreenSaver();
        }
    }

    enterScreenSaver() {
        this.screensaverActive = true;
        const overlay = document.getElementById('screensaverOverlay');
        const gallery = overlay.querySelector('.screensaver-gallery');

        // Get images from currently playing episode's gallery
        this.screensaverImages = [];
        
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.playlist.length) {
            const currentTrack = this.playlist[this.currentTrackIndex];
            
            // Get gallery images from the current episode
            if (currentTrack.images && Array.isArray(currentTrack.images) && currentTrack.images.length > 0) {
                currentTrack.images.forEach(img => {
                    this.screensaverImages.push(this.cdnUrl + img);
                });
            }
            
            // Fallback: include episode main image if no gallery images
            if (this.screensaverImages.length === 0 && currentTrack.episodeImage) {
                this.screensaverImages.push(this.cdnUrl + currentTrack.episodeImage);
            }
        }

        // If no current track or no images found, collect from all episodes
        if (this.screensaverImages.length === 0) {
            this.playlist.forEach(track => {
                if (track.images && Array.isArray(track.images)) {
                    track.images.forEach(img => {
                        this.screensaverImages.push(this.cdnUrl + img);
                    });
                } else if (track.episodeImage) {
                    this.screensaverImages.push(this.cdnUrl + track.episodeImage);
                }
            });
        }

        // Remove duplicates
        this.screensaverImages = [...new Set(this.screensaverImages)];

        if (this.screensaverImages.length === 0) {
            console.warn('No images available for screen saver');
            return;
        }

        // Clear gallery and populate with images
        gallery.innerHTML = '';
        this.screensaverImages.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `Episode gallery image ${index + 1}`;
            if (index === 0) {
                img.classList.add('active');
            }
            gallery.appendChild(img);
        });

        // Show overlay
        overlay.classList.add('active');
        document.body.classList.add('screensaver-active');

        // Start image rotation
        this.currentScreensaverIndex = 0;
        this.startScreenSaverRotation();

        // Start weather effects
        this.startWeatherEffects();

        // Initialize image effects (all active by default)
        this.updateActiveImageEffects();

        // Initialize lyrics display
        this.updateLyricsDisplay();

        // Show song title
        this.showSongTitle();

        console.log(`🎨 Screen saver mode activated with ${this.screensaverImages.length} images from current episode`);
    }

    exitScreenSaver() {
        this.screensaverActive = false;
        const overlay = document.getElementById('screensaverOverlay');

        // Hide overlay
        overlay.classList.remove('active');
        document.body.classList.remove('screensaver-active');

        // Stop image rotation
        this.stopScreenSaverRotation();

        // Stop weather effects
        this.stopWeatherEffects();

        // Clear floating icons
        this.clearFloatingIcons();

        // Clear lyrics display
        const lyricsContainer = document.querySelector('.screensaver-lyrics');
        if (lyricsContainer) {
            lyricsContainer.classList.remove('visible');
            lyricsContainer.innerHTML = '';
        }

        // Clear title overlay
        const titleOverlay = document.querySelector('.screensaver-title-overlay');
        if (titleOverlay) {
            titleOverlay.classList.remove('visible', 'fade-out');
        }
        if (this.titleFadeTimeout) {
            clearTimeout(this.titleFadeTimeout);
            this.titleFadeTimeout = null;
        }

        console.log('🎨 Screen saver mode exited');
    }

    updateFloatingIcons() {
        const activeIconBtns = document.querySelectorAll('.icon-btn.active');
        const activeIcons = Array.from(activeIconBtns).map(btn => btn.textContent.trim());
        
        console.log(`🎮 Active game icons:`, activeIcons);
        
        // Clear existing icons
        this.clearFloatingIcons();
        
        if (activeIcons.length > 0) {
            this.createFloatingIcons(activeIcons);
        }
    }

    createFloatingIcons(icons) {
        const container = document.querySelector('.floating-game-icons');
        if (!container) return;
        
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        // Create 3-4 floating icons total (reduced from 8-12)
        const iconCount = 3 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < iconCount; i++) {
            const icon = document.createElement('div');
            icon.className = 'floating-icon';
            
            // Pick random icon from active ones
            const randomIcon = icons[Math.floor(Math.random() * icons.length)];
            icon.textContent = randomIcon;
            
            // Random starting position
            icon.style.left = Math.random() * (w - 100) + 'px';
            icon.style.top = Math.random() * (h - 100) + 'px';
            
            // Random animation duration and delay for variety
            icon.style.animationDuration = (8 + Math.random() * 4) + 's';
            icon.style.animationDelay = -(Math.random() * 8) + 's';
            
            container.appendChild(icon);
        }
    }

    clearFloatingIcons() {
        const container = document.querySelector('.floating-game-icons');
        if (container) {
            container.innerHTML = '';
        }
    }

    showSongTitle() {
        const activeTitleBtn = document.querySelector('.title-btn.active');
        const showTitle = activeTitleBtn ? activeTitleBtn.dataset.title === 'on' : true;

        if (!showTitle) return;

        const titleOverlay = document.querySelector('.screensaver-title-overlay');
        const titleContent = titleOverlay?.querySelector('.title-content');
        if (!titleOverlay || !titleContent) return;

        const currentTrack = this.playlist[this.currentTrackIndex];
        const title = currentTrack?.title || 'Unknown Track';

        // Set title text
        titleContent.textContent = title;

        // Clear any existing timeout
        if (this.titleFadeTimeout) {
            clearTimeout(this.titleFadeTimeout);
        }

        // Show title with fade in
        titleOverlay.classList.remove('fade-out');
        titleOverlay.classList.add('visible');

        // Fade out after 3 seconds
        this.titleFadeTimeout = setTimeout(() => {
            titleOverlay.classList.add('fade-out');
            titleOverlay.classList.remove('visible');
        }, 3000);

        console.log(`🎼 Showing song title: "${title}"`);
    }

    updateLyricsDisplay() {
        const lyricsContainer = document.querySelector('.screensaver-lyrics');
        if (!lyricsContainer) return;

        const activeBtn = document.querySelector('.lyrics-btn.active');
        const mode = activeBtn ? activeBtn.dataset.lyrics : 'off';

        console.log(`🎵 Lyrics mode:`, mode);

        if (mode === 'off') {
            lyricsContainer.classList.remove('visible');
            lyricsContainer.innerHTML = '';
            return;
        }

        // Get current track lyrics
        const currentTrack = this.playlist[this.currentTrackIndex];
        const lyrics = currentTrack?.lyrics || 'No lyrics available for this track';
        const trackTitle = currentTrack?.title || 'Unknown';

        console.log(`🎵 Current track index: ${this.currentTrackIndex}, Title: "${trackTitle}"`);
        console.log(`🎵 Lyrics: "${lyrics.substring(0, 50)}..."`);

        // Show lyrics container
        lyricsContainer.classList.add('visible');

        // Create or update lyrics content
        let lyricsContent = lyricsContainer.querySelector('.lyrics-content');
        if (!lyricsContent) {
            lyricsContent = document.createElement('div');
            lyricsContent.className = 'lyrics-content';
            lyricsContainer.appendChild(lyricsContent);
        }

        // Update content and styling based on mode
        lyricsContent.textContent = lyrics;
        lyricsContent.classList.remove('scrolling', 'static');
        
        if (mode === 'scroll') {
            // Remove animation temporarily to force restart
            lyricsContent.style.animation = 'none';
            
            // Calculate animation duration based on text length
            // Aim for a comfortable reading speed - about 3-4 characters per second
            const textLength = lyrics.length;
            const charsPerSecond = 3.5; // Comfortable reading speed
            const duration = Math.max(20, textLength / charsPerSecond); // minimum 20s
            
            // Force reflow to restart animation
            void lyricsContent.offsetWidth;
            
            // Reapply animation
            lyricsContent.classList.add('scrolling');
            lyricsContent.style.animation = '';
            lyricsContent.style.animationDuration = `${duration}s`;
            
            console.log(`🎵 Text length: ${textLength}, Duration: ${duration}s`);
        } else if (mode === 'static') {
            lyricsContent.classList.add('static');
            lyricsContent.style.animationDuration = '';
        }

        console.log(`✅ Updated lyrics display: ${mode} mode for track "${trackTitle}"`);
    }

    updateScreenSaverImages() {
        if (!this.screensaverActive) return;
        
        const overlay = document.getElementById('screensaverOverlay');
        const gallery = overlay?.querySelector('.screensaver-gallery');
        if (!gallery) return;

        console.log('🔄 Updating screen saver images for new track');

        // Get images from new current track
        this.screensaverImages = [];
        
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.playlist.length) {
            const currentTrack = this.playlist[this.currentTrackIndex];
            
            // Get gallery images from the current episode
            if (currentTrack.images && Array.isArray(currentTrack.images) && currentTrack.images.length > 0) {
                currentTrack.images.forEach(img => {
                    this.screensaverImages.push(this.cdnUrl + img);
                });
            }
            
            // Fallback: include episode main image if no gallery images
            if (this.screensaverImages.length === 0 && currentTrack.episodeImage) {
                this.screensaverImages.push(this.cdnUrl + currentTrack.episodeImage);
            }
        }

        // Update gallery with new images
        if (this.screensaverImages.length > 0) {
            gallery.innerHTML = '';
            this.screensaverImages.forEach((imgSrc, index) => {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = `Episode gallery image ${index + 1}`;
                if (index === 0) {
                    img.classList.add('active');
                }
                gallery.appendChild(img);
            });

            // Reset rotation to first image
            this.currentScreensaverIndex = 0;
            
            // Update lyrics for new track
            this.updateLyricsDisplay();
            
            // Show new song title
            this.showSongTitle();
            
            console.log(`✅ Updated screen saver with ${this.screensaverImages.length} images from new episode`);
        }
    }

    startScreenSaverRotation() {
        // Rotate images every 8 seconds
        this.screensaverInterval = setInterval(() => {
            this.rotateScreenSaverImage();
        }, 8000);
    }

    stopScreenSaverRotation() {
        if (this.screensaverInterval) {
            clearInterval(this.screensaverInterval);
            this.screensaverInterval = null;
        }
    }

    rotateScreenSaverImage() {
        const gallery = document.querySelector('.screensaver-gallery');
        if (!gallery) return;

        const images = gallery.querySelectorAll('img');
        if (images.length <= 1) return;

        // Get current and next indices
        const currentImg = images[this.currentScreensaverIndex];
        this.currentScreensaverIndex = (this.currentScreensaverIndex + 1) % images.length;
        const nextImg = images[this.currentScreensaverIndex];

        // Fade out current, fade in next
        currentImg.classList.remove('active');
        currentImg.classList.add('fading-out');

        nextImg.classList.remove('fading-out');
        nextImg.classList.add('active');

        // Clean up fading-out class after transition
        setTimeout(() => {
            currentImg.classList.remove('fading-out');
        }, 2000);
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
}

// Initialize radio player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wavelengthRadio = new WavelengthRadio();
});

// Add level up animation
const levelUpAnimationStyle = document.createElement('style');
levelUpAnimationStyle.textContent = `
    @keyframes levelUpPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
    }
`;
document.head.appendChild(levelUpAnimationStyle);
