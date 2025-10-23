/**
 * Shared Screensaver Utility
 * Reusable screensaver functionality extracted from radio player for use across the application.
 * Supports image rotation, transitions, weather effects, and customization options.
 */

class WavelengthScreensaver {
  constructor(config = {}) {
    // Configuration
    this.config = {
      containerId: config.containerId || 'screensaverOverlay',
      gallerySelector: config.gallerySelector || '.screensaver-gallery',
      exitOnClick: config.exitOnClick !== false,
      exitOnKeypress: config.exitOnKeypress !== false,
      autoRotate: config.autoRotate !== false,
      rotationInterval: config.rotationInterval || 8000,
      transitionsEnabled: config.transitionsEnabled !== false,
      weatherEffects: config.weatherEffects || false,
      showControls: config.showControls || false,
      ...config
    };

    // State
    this.active = false;
    this.images = [];
    this.currentIndex = 0;
    this.rotationInterval = null;
    this.weatherInterval = null;
    this.particles = [];
    this.canvas = null;
    this.ctx = null;

    // Bind methods
    this.init = this.init.bind(this);
    this.enter = this.enter.bind(this);
    this.exit = this.exit.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.rotateImage = this.rotateImage.bind(this);
  }

  /**
   * Initialize the screensaver
   */
  init() {
    this.setupEventListeners();
    this.loadPreferences();
    
    // Create weather canvas if weather effects are enabled
    if (this.config.weatherEffects) {
      this.createWeatherCanvas();
    }

    console.log('🎨 Screensaver initialized');
  }

  /**
   * Setup event listeners for exit conditions
   */
  setupEventListeners() {
    if (this.config.exitOnKeypress) {
      document.addEventListener('keydown', this.handleKeydown);
    }

    if (this.config.exitOnClick) {
      const overlay = document.getElementById(this.config.containerId);
      if (overlay) {
        overlay.addEventListener('click', this.handleClick);
      }
    }
  }

  /**
   * Handle keydown events for exiting screensaver
   */
  handleKeydown(e) {
    if (this.active) {
      this.exit();
    }
  }

  /**
   * Handle click events for exiting screensaver
   */
  handleClick(e) {
    // Don't exit if clicking on controls
    if (e.target.closest('.screensaver-controls') || 
        e.target.closest('.screensaver-customization')) {
      return;
    }
    
    if (this.active) {
      this.exit();
    }
  }

  /**
   * Load saved preferences from localStorage
   */
  loadPreferences() {
    try {
      const saved = localStorage.getItem('wavelength_screensaver_preferences');
      if (saved) {
        this.preferences = JSON.parse(saved);
      } else {
        this.preferences = {
          transitions: 'on',
          weather: [],
          rotationSpeed: 'normal'
        };
      }
    } catch (error) {
      console.error('Error loading screensaver preferences:', error);
      this.preferences = {};
    }
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences() {
    try {
      localStorage.setItem('wavelength_screensaver_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving screensaver preferences:', error);
    }
  }

  /**
   * Enter screensaver mode
   */
  enter(images = []) {
    if (this.active || images.length === 0) {
      console.warn('Screensaver already active or no images provided');
      return false;
    }

    this.active = true;
    this.images = images;
    this.currentIndex = 0;

    const overlay = document.getElementById(this.config.containerId);
    const gallery = overlay?.querySelector(this.config.gallerySelector);

    if (!overlay || !gallery) {
      console.error('Screensaver overlay or gallery not found');
      return false;
    }

    // Clear and populate gallery
    gallery.innerHTML = '';
    this.images.forEach((imgSrc, index) => {
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = `Screensaver image ${index + 1}`;
      img.dataset.index = index;
      
      if (index === 0) {
        img.classList.add('active');
      }
      
      gallery.appendChild(img);
    });

    // Show overlay
    overlay.classList.add('active');
    document.body.classList.add('screensaver-active');

    // Start image rotation if enabled
    if (this.config.autoRotate) {
      this.startRotation();
    }

    // Start weather effects if enabled
    if (this.config.weatherEffects) {
      this.startWeatherEffects();
    }

    // Apply saved preferences
    this.applyPreferences();

    console.log(`🎨 Screensaver activated with ${this.images.length} images`);
    return true;
  }

  /**
   * Exit screensaver mode
   */
  exit() {
    if (!this.active) return;

    this.active = false;
    
    const overlay = document.getElementById(this.config.containerId);
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    document.body.classList.remove('screensaver-active');

    // Stop rotation
    this.stopRotation();

    // Stop weather effects
    this.stopWeatherEffects();

    console.log('🎨 Screensaver exited');
  }

  /**
   * Start automatic image rotation
   */
  startRotation() {
    if (this.rotationInterval || this.images.length <= 1) return;

    this.rotationInterval = setInterval(() => {
      this.rotateImage();
    }, this.config.rotationInterval);
  }

  /**
   * Stop automatic image rotation
   */
  stopRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }

  /**
   * Rotate to the next image with transition effects
   */
  rotateImage() {
    const gallery = document.querySelector(this.config.gallerySelector);
    if (!gallery) return;

    const images = gallery.querySelectorAll('img');
    if (images.length <= 1) return;

    // Get current and next images
    const currentImg = images[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % images.length;
    const nextImg = images[this.currentIndex];

    // Available transitions
    const transitions = [
      'transition-fade',
      'transition-slide-left',
      'transition-slide-right',
      'transition-slide-up',
      'transition-slide-down',
      'transition-zoom-in',
      'transition-zoom-out',
      'transition-rotate-left',
      'transition-rotate-right',
      'transition-blur',
      'transition-diagonal-tl',
      'transition-diagonal-br'
    ];

    // Clean up previous transition classes
    images.forEach(img => {
      transitions.forEach(t => img.classList.remove(t));
    });

    // Apply random transition if enabled
    if (this.config.transitionsEnabled && this.preferences.transitions !== 'off') {
      const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
      currentImg.classList.add(randomTransition);
      nextImg.classList.add(randomTransition);
    }

    // Perform transition
    currentImg.classList.remove('active');
    currentImg.classList.add('fading-out');

    nextImg.classList.remove('fading-out');
    nextImg.classList.add('active');

    // Clean up after transition
    setTimeout(() => {
      currentImg.classList.remove('fading-out');
    }, 3000);
  }

  /**
   * Manually go to next image
   */
  nextImage() {
    this.rotateImage();
  }

  /**
   * Manually go to previous image
   */
  previousImage() {
    const gallery = document.querySelector(this.config.gallerySelector);
    if (!gallery) return;

    const images = gallery.querySelectorAll('img');
    if (images.length <= 1) return;

    const currentImg = images[this.currentIndex];
    this.currentIndex = (this.currentIndex - 1 + images.length) % images.length;
    const prevImg = images[this.currentIndex];

    // Simple fade transition for manual navigation
    currentImg.classList.remove('active');
    prevImg.classList.add('active');
  }

  /**
   * Create weather effects canvas
   */
  createWeatherCanvas() {
    const overlay = document.getElementById(this.config.containerId);
    if (!overlay) return;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'weather-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '2';

    this.ctx = this.canvas.getContext('2d');
    overlay.appendChild(this.canvas);

    // Initialize particles
    this.initWeatherParticles();
  }

  /**
   * Initialize weather particles
   */
  initWeatherParticles() {
    this.particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: Math.random() * 3 + 1,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
  }

  /**
   * Start weather effects animation
   */
  startWeatherEffects() {
    if (!this.canvas || !this.ctx) return;

    const animate = () => {
      if (!this.active) return;

      this.updateCanvas();
      this.drawWeatherEffects();
      
      requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Stop weather effects
   */
  stopWeatherEffects() {
    // Weather effects stop automatically when this.active becomes false
  }

  /**
   * Update canvas size
   */
  updateCanvas() {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Draw weather effects (snow by default)
   */
  drawWeatherEffects() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Update particle position
      particle.y += particle.speed;
      particle.x += Math.sin(particle.y * 0.01) * 0.5;

      // Reset if off screen
      if (particle.y > this.canvas.height) {
        particle.y = -10;
        particle.x = Math.random() * this.canvas.width;
      }
    });
  }

  /**
   * Apply saved preferences
   */
  applyPreferences() {
    // Apply transition settings
    if (this.preferences.transitions === 'off') {
      this.config.transitionsEnabled = false;
    }

    // Apply rotation speed
    if (this.preferences.rotationSpeed === 'fast') {
      this.config.rotationInterval = 4000;
    } else if (this.preferences.rotationSpeed === 'slow') {
      this.config.rotationInterval = 15000;
    }

    // Restart rotation with new interval if active
    if (this.active && this.config.autoRotate) {
      this.stopRotation();
      this.startRotation();
    }
  }

  /**
   * Toggle transitions on/off
   */
  toggleTransitions() {
    this.preferences.transitions = this.preferences.transitions === 'off' ? 'on' : 'off';
    this.config.transitionsEnabled = this.preferences.transitions === 'on';
    this.savePreferences();
  }

  /**
   * Set rotation speed
   */
  setRotationSpeed(speed) {
    this.preferences.rotationSpeed = speed;
    this.savePreferences();
    this.applyPreferences();
  }

  /**
   * Cleanup - remove event listeners
   */
  destroy() {
    this.exit();
    document.removeEventListener('keydown', this.handleKeydown);
    
    const overlay = document.getElementById(this.config.containerId);
    if (overlay) {
      overlay.removeEventListener('click', this.handleClick);
    }

    if (this.canvas) {
      this.canvas.remove();
    }
  }
}

// Export for module systems or global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WavelengthScreensaver;
} else {
  window.WavelengthScreensaver = WavelengthScreensaver;
}