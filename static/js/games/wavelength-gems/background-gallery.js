/**
 * Wavelength Gems - Background Gallery
 * Displays faint collage of images from currently playing radio song
 * Falls back to random episode images if nothing is playing
 */

class GameBackgroundGallery {
    constructor(containerId = 'game-background-gallery') {
        this.container = document.getElementById(containerId);
        this.currentSongImages = [];
        this.randomImages = [];
        this.updateInterval = null;
        this.cdnUrl = window.location.origin;

        // Check if radio player is available
        this.radioPlayer = window.radioPlayer || null;

        // Initialize
        this.init();
    }

    /**
     * Initialize the background gallery
     */
    async init() {
        // Try to load random fallback images
        await this.loadRandomImages();

        // Start monitoring radio player for song changes
        this.monitorRadioPlayer();

        // Update background every 5 seconds (in case radio player changes songs)
        this.updateInterval = setInterval(() => this.updateBackground(), 5000);

        // Initial update
        this.updateBackground();
    }

    /**
     * Monitor radio player for changes
     */
    monitorRadioPlayer() {
        // Listen for custom radio player events if available
        if (window.radioPlayer) {
            // Try to observe trackChanged events
            setInterval(() => {
                this.updateBackground();
            }, 3000);
        }
    }

    /**
     * Update background based on currently playing song
     */
    async updateBackground() {
        const songImages = this.getCurrentSongImages();

        if (songImages && songImages.length > 0) {
            // Display images from currently playing song
            this.displayImages(songImages);
        } else {
            // Display random fallback images
            this.displayImages(this.randomImages);
        }
    }

    /**
     * Get images from currently playing song
     */
    getCurrentSongImages() {
        if (!window.radioPlayer) return null;

        try {
            // Access the radio player instance
            const player = window.radioPlayer;

            if (player.currentTrackIndex >= 0 && player.playlist) {
                const currentTrack = player.playlist[player.currentTrackIndex];

                if (currentTrack) {
                    // Try different image sources
                    if (currentTrack.images && Array.isArray(currentTrack.images)) {
                        return currentTrack.images;
                    }

                    if (currentTrack.episodeImage) {
                        return [currentTrack.episodeImage];
                    }

                    if (currentTrack.carouselImages && Array.isArray(currentTrack.carouselImages)) {
                        return currentTrack.carouselImages;
                    }
                }
            }
        } catch (error) {
            console.log('Could not fetch current song images:', error);
        }

        return null;
    }

    /**
     * Load random episode images as fallback
     */
    async loadRandomImages() {
        try {
            // Fetch all episodes
            const response = await fetch('/api/episodes');
            const data = await response.json();

            if (data.success && data.episodes) {
                // Extract images from random episodes
                this.randomImages = data.episodes
                    .filter(ep => ep.image || ep.carouselImages)
                    .slice(0, 20) // Limit to 20 episodes
                    .map(ep => ep.image || (ep.carouselImages && ep.carouselImages[0]))
                    .filter(img => img); // Remove undefined
            }
        } catch (error) {
            console.log('Could not load random episode images:', error);
        }
    }

    /**
     * Display images in the background gallery
     */
    displayImages(images) {
        if (!images || images.length === 0) return;

        // Clear existing images
        this.container.innerHTML = '';

        // Add new images
        images.forEach((imgPath, index) => {
            const img = document.createElement('img');

            // Handle CDN URLs
            if (imgPath.startsWith('http')) {
                img.src = imgPath;
            } else {
                img.src = this.cdnUrl + imgPath;
            }

            img.classList.add('game-background-gallery-image');
            img.alt = `Background image ${index + 1}`;

            // Position images randomly for collage effect
            const randomX = Math.random() * 60; // 0-60%
            const randomY = Math.random() * 60; // 0-60%
            const randomSize = Math.random() * 0.3 + 0.7; // 70-100% size

            img.style.left = randomX + '%';
            img.style.top = randomY + '%';
            img.style.width = (50 * randomSize) + '%';
            img.style.height = (50 * randomSize) + '%';

            // Stagger animation start
            img.style.animationDelay = (index * 2) + 's';

            this.container.appendChild(img);
        });

        // Show gallery
        this.container.classList.add('active');
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.gameBackgroundGallery = new GameBackgroundGallery();
    });
} else {
    window.gameBackgroundGallery = new GameBackgroundGallery();
}
