/**
 * Wavelength Gems - Game Background Effects
 * Adapted from radio player screensaver for immersive game backgrounds
 */

class GameBackgroundManager {
    constructor() {
        this.backgroundGallery = document.querySelector('.game-background-gallery');
        this.weatherCanvas = document.querySelector('.game-weather-canvas');
        this.weatherCtx = this.weatherCanvas ? this.weatherCanvas.getContext('2d') : null;
        this.lightningFlash = document.querySelector('.game-lightning-flash');
        
        this.currentImages = [];
        this.currentImageIndex = 0;
        this.rotationInterval = null;
        this.weatherAnimationFrame = null;
        this.particles = [];
        this.currentWeather = 'clear';
        
        this.init();
    }

    init() {
        console.log('🎨 Initializing game background manager');
        console.log('Background gallery element:', this.backgroundGallery);
        console.log('Weather canvas element:', this.weatherCanvas);
        console.log('Lightning flash element:', this.lightningFlash);
        
        if (this.weatherCanvas && this.weatherCtx) {
            this.resizeWeatherCanvas();
            window.addEventListener('resize', () => this.resizeWeatherCanvas());
            console.log('✅ Weather canvas initialized');
        } else {
            console.warn('⚠️ Weather canvas not found or context failed');
        }
    }

    /**
     * Load images from level configuration
     */
    loadLevelImages(levelConfig) {
        console.log('🖼️ loadLevelImages called with:', levelConfig);
        
        if (!this.backgroundGallery) {
            console.error('❌ Background gallery element not found!');
            return;
        }
        
        if (!levelConfig) {
            console.error('❌ No level config provided!');
            return;
        }

        // Clear existing images
        this.backgroundGallery.innerHTML = '';
        this.currentImages = [];

        // Get images from level theme
        const images = levelConfig.theme?.carouselImages || [];
        
        console.log('📸 Images to load:', images);
        
        if (images.length === 0) {
            console.log('No images to load for background');
            return;
        }

        // Load and display images
        images.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Level ${levelConfig.level} Background`;
            
            // First image is active
            if (index === 0) {
                img.classList.add('active');
            }
            
            img.onload = () => {
                console.log(`✅ Image ${index + 1} loaded:`, src);
            };
            
            img.onerror = () => {
                console.error(`❌ Failed to load image ${index + 1}:`, src);
            };
            
            this.backgroundGallery.appendChild(img);
            this.currentImages.push(img);
        });

        this.currentImageIndex = 0;

        // Start rotation if multiple images
        if (images.length > 1) {
            this.startImageRotation();
            console.log('🔄 Started image rotation');
        }

        console.log(`🖼️ Loaded ${images.length} background images into gallery`);
    }

    /**
     * Start rotating background images
     */
    startImageRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }

        this.rotationInterval = setInterval(() => {
            this.rotateImage();
        }, 12000); // Rotate every 12 seconds
    }

    /**
     * Stop image rotation
     */
    stopImageRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
        }
    }

    /**
     * Rotate to next background image
     */
    rotateImage() {
        if (this.currentImages.length <= 1) return;

        const currentImg = this.currentImages[this.currentImageIndex];
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentImages.length;
        const nextImg = this.currentImages[this.currentImageIndex];

        console.log(`🔄 Rotating from image ${this.currentImageIndex === 0 ? this.currentImages.length - 1 : this.currentImageIndex - 1} to ${this.currentImageIndex}`);

        // Fade out current, fade in next
        currentImg.classList.remove('active');
        nextImg.classList.add('active');
    }

    /**
     * Set weather effect
     */
    setWeather(weatherType) {
        console.log(`🌤️ setWeather called with: ${weatherType}`);
        
        this.currentWeather = weatherType;
        this.particles = [];
        
        if (weatherType !== 'clear') {
            this.initWeatherParticles(weatherType);
            this.startWeatherAnimation();
            console.log(`✅ Weather animation started for: ${weatherType}`);
        } else {
            this.stopWeatherAnimation();
            console.log('✅ Weather cleared (no particles)');
        }
    }

    /**
     * Initialize weather particles
     */
    initWeatherParticles(weatherType) {
        if (!this.weatherCanvas) return;

        const w = this.weatherCanvas.width;
        const h = this.weatherCanvas.height;
        const count = this.getParticleCount(weatherType);

        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(weatherType, w, h));
        }
    }

    /**
     * Get particle count for weather type
     */
    getParticleCount(weatherType) {
        switch (weatherType) {
            case 'rain': return 150;
            case 'snow': return 80;
            case 'wind': return 100;
            default: return 0;
        }
    }

    /**
     * Create a particle for specific weather type
     */
    createParticle(weatherType, w, h) {
        switch (weatherType) {
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
            default:
                return {};
        }
    }

    /**
     * Start weather animation loop
     */
    startWeatherAnimation() {
        if (this.weatherAnimationFrame) return;

        const animate = () => {
            if (this.currentWeather === 'clear') {
                this.stopWeatherAnimation();
                return;
            }

            this.updateWeatherParticles();
            this.drawWeatherParticles();
            this.weatherAnimationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop weather animation
     */
    stopWeatherAnimation() {
        if (this.weatherAnimationFrame) {
            cancelAnimationFrame(this.weatherAnimationFrame);
            this.weatherAnimationFrame = null;
        }
        
        if (this.weatherCtx) {
            this.weatherCtx.clearRect(0, 0, this.weatherCanvas.width, this.weatherCanvas.height);
        }
    }

    /**
     * Update particle positions
     */
    updateWeatherParticles() {
        const w = this.weatherCanvas.width;
        const h = this.weatherCanvas.height;

        this.particles.forEach(p => {
            switch (this.currentWeather) {
                case 'rain':
                    p.y += p.speed;
                    if (p.y > h) {
                        p.y = -p.length;
                        p.x = Math.random() * w;
                    }
                    break;
                case 'snow':
                    p.y += p.speed;
                    p.x += p.drift;
                    if (p.y > h) {
                        p.y = -p.radius;
                        p.x = Math.random() * w;
                    }
                    if (p.x < 0) p.x = w;
                    if (p.x > w) p.x = 0;
                    break;
                case 'wind':
                    p.x += p.speed;
                    if (p.x > w + 50) {
                        p.x = -50;
                        p.y = Math.random() * h;
                    }
                    break;
            }
        });
    }

    /**
     * Draw weather particles on canvas
     */
    drawWeatherParticles() {
        if (!this.weatherCtx) return;

        const ctx = this.weatherCtx;
        const w = this.weatherCanvas.width;
        const h = this.weatherCanvas.height;

        ctx.clearRect(0, 0, w, h);

        this.particles.forEach(p => {
            ctx.globalAlpha = p.opacity;

            switch (this.currentWeather) {
                case 'rain':
                    ctx.strokeStyle = '#a0d0f0';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x, p.y + p.length);
                    ctx.stroke();
                    break;
                case 'snow':
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'wind':
                    ctx.strokeStyle = '#d0d0d0';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.length, p.y);
                    ctx.stroke();
                    break;
            }
        });

        ctx.globalAlpha = 1;
    }

    /**
     * Trigger lightning flash
     */
    triggerLightning() {
        if (!this.lightningFlash) return;

        this.lightningFlash.classList.add('active');
        setTimeout(() => {
            this.lightningFlash.classList.remove('active');
        }, 100);
    }

    /**
     * Resize weather canvas to match viewport
     */
    resizeWeatherCanvas() {
        if (!this.weatherCanvas) return;
        this.weatherCanvas.width = window.innerWidth;
        this.weatherCanvas.height = window.innerHeight;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopImageRotation();
        this.stopWeatherAnimation();
    }
}

// Export for use in main game
window.GameBackgroundManager = GameBackgroundManager;
