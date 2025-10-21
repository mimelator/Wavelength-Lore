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
            horseshoes: parseInt(localStorage.getItem('horseshoe_count') || '0'),
            magicLevel: parseInt(localStorage.getItem('magic_level') || '1')
        };

        // Visual elements spawning
        this.spawnInterval = null;
        this.activeElements = [];

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

    // Audio event bindings
    bindAudioEvents() {
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
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

    // Update background gallery with episode images
    updateBackgroundGallery(playlistItem) {
        const carouselImages = JSON.parse(playlistItem.dataset.carouselImages || '[]');
        const gallery = document.getElementById('background-gallery');

        // Clear existing images
        gallery.innerHTML = '';

        if (carouselImages.length > 0) {
            // Select 5-8 random images from carousel
            const numImages = Math.min(Math.floor(Math.random() * 4) + 5, carouselImages.length);
            const selectedImages = [];

            for (let i = 0; i < numImages; i++) {
                const randomIndex = Math.floor(Math.random() * carouselImages.length);
                if (!selectedImages.includes(carouselImages[randomIndex])) {
                    selectedImages.push(carouselImages[randomIndex]);
                }
            }

            // Create and position images
            selectedImages.forEach((imagePath, index) => {
                const img = document.createElement('img');
                img.src = this.cdnUrl + imagePath;
                img.classList.add('background-gallery-image');

                // Random size - 125% to 175% larger (250-875px, was 200-500px)
                const size = Math.floor(Math.random() * 625) + 250; // 250-875px
                img.style.width = `${size}px`;
                img.style.height = `${size}px`;

                // Random position
                img.style.left = `${Math.random() * 100}%`;
                img.style.top = `${Math.random() * 100}%`;

                // Random animation delay
                img.style.animationDelay = `${index * 2}s`;

                gallery.appendChild(img);
            });

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

        // Random type
        const types = [
            { emoji: '🍄', class: 'mushroom', points: 10, stat: 'mushrooms' },
            { emoji: '🌟', class: 'sparkle', points: 5, stat: null },
            { emoji: '🧲', class: 'horseshoe', points: 15, stat: 'horseshoes' },
            { emoji: '✨', class: 'sparkle', points: 5, stat: null },
            { emoji: '🔮', class: 'sparkle', points: 8, stat: null },
            { emoji: '🌙', class: 'sparkle', points: 7, stat: null }
        ];

        const type = types[Math.floor(Math.random() * types.length)];
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
        // Add collecting animation
        element.classList.remove('appearing');
        element.classList.add('collecting');

        // Update stats
        if (type.stat === 'mushrooms') {
            this.stats.mushrooms++;
            localStorage.setItem('mushroom_count', this.stats.mushrooms);
        } else if (type.stat === 'horseshoes') {
            this.stats.horseshoes++;
            localStorage.setItem('horseshoe_count', this.stats.horseshoes);
        }

        // Level up every 50 items
        const totalCollected = this.stats.mushrooms + this.stats.horseshoes;
        const newLevel = Math.floor(totalCollected / 50) + 1;
        if (newLevel > this.stats.magicLevel) {
            this.stats.magicLevel = newLevel;
            localStorage.setItem('magic_level', this.stats.magicLevel);
            this.showLevelUpNotification();
        }

        this.updateStats();

        // Remove element
        setTimeout(() => {
            element.remove();
            this.activeElements = this.activeElements.filter(el => el !== element);
        }, 600);
    }

    // Update game stats display
    updateStats() {
        document.getElementById('mushroomCount').textContent = this.stats.mushrooms;
        document.getElementById('horseshoeCount').textContent = this.stats.horseshoes;
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
}

// Initialize radio player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wavelengthRadio = new WavelengthRadio();
});

// Add level up animation
const style = document.createElement('style');
style.textContent = `
    @keyframes levelUpPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
    }
`;
document.head.appendChild(style);
