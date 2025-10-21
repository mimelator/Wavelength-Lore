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

        // Build audio path
        const audioPath = `${this.cdnUrl}/images/seasons/season${track.season}/episodes/episode${track.episode}/${track.file}`;

        this.audio.src = audioPath;
        this.audio.load();

        // Update UI
        this.updateNowPlaying(track);
        this.updatePlaylistUI();

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

    initScreenSaver() {
        this.screensaverActive = false;
        this.screensaverInterval = null;
        this.screensaverImages = [];
        this.currentScreensaverIndex = 0;

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
                this.previousTrack();
            });
        }

        if (screensaverNext) {
            screensaverNext.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextTrack();
            });
        }

        // Exit screen saver on any key press or click (except on controls)
        document.addEventListener('keydown', (e) => {
            if (this.screensaverActive) {
                this.exitScreenSaver();
            }
        });

        const overlay = document.getElementById('screensaverOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                // Don't exit if clicking on controls
                if (!e.target.closest('.screensaver-minimal-controls')) {
                    this.exitScreenSaver();
                }
            });
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

        console.log('🎨 Screen saver mode exited');
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
