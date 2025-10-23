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
      weatherEffects: config.weatherEffects !== false,
      showControls: config.showControls || false,
      imageEffects: config.imageEffects !== false,
      gameMode: config.gameMode || false,
      lyrics: config.lyrics || false,
      titleDisplay: config.titleDisplay || false,
      badges: config.badges || false,
      summary: config.summary || false,
      ...config
    };

    // State
    this.active = false;
    this.images = [];
    this.currentIndex = 0;
    this.rotationInterval = null;
    this.weatherInterval = null;
    this.weatherTimeout = null;
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    
    // Advanced features state
    this.weatherMode = 'auto';
    this.activeWeatherModes = [];
    this.weatherTypes = ['rain', 'snow', 'clear', 'clouds', 'wind', 'lightning'];
    this.weatherDurations = {
      rain: 30000,
      snow: 40000,
      clear: 20000,
      clouds: 25000,
      wind: 15000,
      lightning: 20000
    };
    this.currentWeather = null;
    this.gameActive = false;
    this.gameScore = 0;
    this.gameTimer = 0;
    this.gameStartTime = null;

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

    // Setup customization panel if present
    this.setupCustomizationPanel();

    // Load preferences into UI
    this.loadPreferencesIntoUI();

    console.log('🎨 Screensaver initialized with advanced features');
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
      // Use the same localStorage key as radio player for consistency
      const saved = localStorage.getItem('wavelength_screensaver_prefs');
      if (saved) {
        this.preferences = JSON.parse(saved);
      } else {
        // Default preferences matching radio player defaults
        this.preferences = {
          weather: ['auto'],
          imageEffects: ['hue', 'zoom', 'rotate', 'brightness', 'contrast'],
          gameMode: 'off',
          lyrics: 'off',
          title: 'on',
          transition: 'on',
          animation: 'on',
          summary: 'off',
          badges: 'on',
          rotationSpeed: 'normal'
        };
      }
    } catch (error) {
      console.error('Error loading screensaver preferences:', error);
      this.preferences = {
        weather: ['auto'],
        imageEffects: ['hue', 'zoom', 'rotate', 'brightness', 'contrast'],
        gameMode: 'off',
        lyrics: 'off',
        title: 'on',
        transition: 'on',
        animation: 'on',
        summary: 'off',
        badges: 'on',
        rotationSpeed: 'normal'
      };
    }
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences() {
    try {
      // Use the same localStorage key as radio player for consistency
      localStorage.setItem('wavelength_screensaver_prefs', JSON.stringify(this.preferences));
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

    // Stop game
    this.stopGame();

    // Stop image animation
    this.stopImageAnimation();

    // Clear any weather timeouts
    if (this.weatherTimeout) {
      clearTimeout(this.weatherTimeout);
      this.weatherTimeout = null;
    }

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
   * Create weather effects canvas (matching radio player setup)
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

    // Set initial canvas size
    this.resizeWeatherCanvas();
    
    // Add resize listener
    window.addEventListener('resize', () => this.resizeWeatherCanvas());
  }

  /**
   * Resize weather canvas to match window size (matching radio player)
   */
  resizeWeatherCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Start weather effects animation (matching radio player approach)
   */
  startWeatherEffects() {
    if (!this.canvas || !this.ctx) return;

    // Set canvas size
    this.resizeWeatherCanvas();

    // Start weather cycle
    this.cycleWeather();
  }

  /**
   * Cycle through weather types automatically (matching radio player)
   */
  cycleWeather() {
    if (this.weatherMode !== 'auto') return;

    // Pick random weather
    const weatherIndex = Math.floor(Math.random() * this.weatherTypes.length);
    this.currentWeather = this.weatherTypes[weatherIndex];
    const duration = this.weatherDurations[this.currentWeather];

    console.log(`🌤️ Weather changed to: ${this.currentWeather} for ${duration}s`);

    // Initialize particles for this weather
    this.initWeatherParticles();

    // Start animation if not already running
    if (!this.weatherAnimationFrame) {
      this.animateWeather();
    }

    // Schedule next weather change (only in auto mode)
    this.weatherTimeout = setTimeout(() => this.cycleWeather(), duration);
  }

  /**
   * Animate weather effects (matching radio player animation loop)
   */
  animateWeather() {
    if (!this.ctx || !this.active) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Draw current weather
    this.drawWeatherEffects();

    // Continue animation
    this.weatherAnimationFrame = requestAnimationFrame(() => this.animateWeather());
  }

  /**
   * Initialize weather particles with proper counts matching radio player
   */
  initWeatherParticles() {
    this.particles = [];
    const particleCount = this.getParticleCount();

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   * Get particle count based on weather type (matching radio player)
   */
  getParticleCount() {
    switch(this.currentWeather) {
      case 'rain': return 200;
      case 'snow': return 100;
      case 'wind': return 150;
      case 'clouds': return 8;
      case 'lightning': return 50;
      case 'clear': return 30;
      default: return 50;
    }
  }

  /**
   * Create particle based on weather type (matching radio player)
   */
  createParticle() {
    const w = this.canvas?.width || window.innerWidth;
    const h = this.canvas?.height || window.innerHeight;
    
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
      case 'lightning':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 1 + 0.5,
          opacity: Math.random() * 0.3 + 0.2
        };
      case 'clear':
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.5 + 0.3,
          opacity: Math.random() * 0.2 + 0.1
        };
      default:
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 3 + 1,
          speed: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.3
        };
    }
  }

  /**
   * Stop weather effects
   */
  stopWeatherEffects() {
    if (this.weatherAnimationFrame) {
      cancelAnimationFrame(this.weatherAnimationFrame);
      this.weatherAnimationFrame = null;
    }
  }

  /**
   * Draw weather effects (snow by default)
   */
  drawWeatherEffects() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw based on current weather type
    switch (this.currentWeather) {
      case 'rain':
        this.drawRain();
        break;
      case 'snow':
        this.drawSnow();
        break;
      case 'clouds':
        this.drawClouds();
        break;
      case 'wind':
        this.drawWind();
        break;
      case 'lightning':
        this.drawLightning();
        break;
      case 'clear':
        this.drawSun();
        break;
      default:
        this.drawSnow(); // Default fallback
    }
  }

  /**
   * Draw rain particles (matching radio player implementation)
   */
  drawRain() {
    this.ctx.strokeStyle = 'rgba(173, 216, 230, 0.7)';
    this.ctx.lineWidth = 2;

    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.beginPath();
      this.ctx.moveTo(particle.x, particle.y);
      this.ctx.lineTo(particle.x - 2, particle.y + particle.length);
      this.ctx.stroke();

      // Update particle position
      particle.y += particle.speed;
      particle.x += Math.sin(particle.y * 0.01) * 0.5;

      // Reset if off screen
      if (particle.y > this.canvas.height + particle.length) {
        particle.y = -particle.length;
        particle.x = Math.random() * this.canvas.width;
      }
    });
  }

  /**
   * Draw snow particles (matching radio player implementation)
   */
  drawSnow() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Update particle position with drift
      particle.y += particle.speed;
      particle.x += particle.drift;

      // Reset if off screen
      if (particle.y > this.canvas.height + particle.radius) {
        particle.y = -particle.radius;
        particle.x = Math.random() * this.canvas.width;
      }
      if (particle.x > this.canvas.width + particle.radius) {
        particle.x = -particle.radius;
      }
      if (particle.x < -particle.radius) {
        particle.x = this.canvas.width + particle.radius;
      }
    });
  }

  /**
   * Draw cloud particles (matching radio player implementation)
   */
  drawClouds() {
    this.ctx.fillStyle = 'rgba(220, 220, 220, 0.6)';

    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.opacity;
      
      // Draw cloud shape with multiple circles
      for (let i = 0; i < 5; i++) {
        const offsetX = (i - 2) * particle.width * 0.15;
        const offsetY = Math.sin(i) * particle.height * 0.2;
        const radius = particle.width * (0.2 + Math.sin(i) * 0.1);
        
        this.ctx.beginPath();
        this.ctx.arc(
          particle.x + offsetX, 
          particle.y + offsetY, 
          radius, 
          0, 
          Math.PI * 2
        );
        this.ctx.fill();
      }

      // Update particle position
      particle.x += particle.speed;

      // Reset if off screen
      if (particle.x > this.canvas.width + particle.width) {
        particle.x = -particle.width;
        particle.y = Math.random() * this.canvas.height * 0.4;
      }
    });
  }

  /**
   * Draw wind particles (matching radio player implementation)
   */
  drawWind() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;

    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.beginPath();
      this.ctx.moveTo(particle.x, particle.y);
      this.ctx.lineTo(particle.x + particle.length, particle.y);
      this.ctx.stroke();

      // Update particle position
      particle.x += particle.speed;
      particle.y += Math.sin(particle.x * 0.01) * 0.5;

      // Reset if off screen
      if (particle.x > this.canvas.width + particle.length) {
        particle.x = -particle.length;
        particle.y = Math.random() * this.canvas.height;
      }
    });
  }

  /**
   * Draw lightning effect (matching radio player implementation)
   */
  drawLightning() {
    // Random lightning strikes
    if (Math.random() < 0.02) {
      const flash = document.querySelector('.lightning-flash');
      if (flash) {
        flash.style.opacity = '0.4';
        setTimeout(() => {
          flash.style.opacity = '0';
        }, 150);
      }
    }

    // Draw ambient electric particles
    this.ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Gentle floating movement
      particle.y += particle.speed;
      particle.x += Math.sin(particle.y * 0.01) * 0.3;

      if (particle.y > this.canvas.height) {
        particle.y = -10;
        particle.x = Math.random() * this.canvas.width;
      }
    });
  }

  /**
   * Draw sun rays effect (matching radio player implementation)
   */
  drawSun() {
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';

    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Very slow floating movement
      particle.y += particle.speed;
      particle.x += Math.sin(particle.y * 0.005) * 0.1;

      if (particle.y > this.canvas.height) {
        particle.y = -10;
        particle.x = Math.random() * this.canvas.width;
      }
    });
  }

  /**
   * Set weather mode
   */
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
      this.currentWeather = mode;
      this.initWeatherParticles();
    }
  }

  /**
   * Cycle through weather types automatically
   */
  cycleWeather() {
    if (this.weatherMode !== 'auto') return;

    const randomWeather = this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
    this.currentWeather = randomWeather;
    this.initWeatherParticles();

    console.log(`🌤️ Auto weather changed to: ${randomWeather}`);

    // Schedule next weather change
    const duration = this.weatherDurations[randomWeather] || 20000;
    this.weatherTimeout = setTimeout(() => {
      this.cycleWeather();
    }, duration);
  }

  /**
   * Update active weather modes from preferences
   */
  updateActiveWeatherModes() {
    this.activeWeatherModes = [];
    
    const activeButtons = document.querySelectorAll('.weather-btn.active');
    activeButtons.forEach(btn => {
      const weather = btn.dataset.weather;
      this.activeWeatherModes.push(weather);
    });

    // If only auto is selected or no specific weather is selected
    if (this.activeWeatherModes.includes('auto') || this.activeWeatherModes.length === 0) {
      this.setWeatherMode('auto');
    } else {
      // Pick random weather from active modes
      const randomWeather = this.activeWeatherModes[Math.floor(Math.random() * this.activeWeatherModes.length)];
      this.setWeatherMode(randomWeather);
    }
  }

  /**
   * Apply saved preferences (matching radio player logic)
   */
  applyPreferences() {
    // Apply transition settings
    if (this.preferences.transition === 'off') {
      this.config.transitionsEnabled = false;
    } else {
      this.config.transitionsEnabled = true;
    }

    // Apply rotation speed
    if (this.preferences.rotationSpeed === 'fast') {
      this.config.rotationInterval = 4000;
    } else if (this.preferences.rotationSpeed === 'slow') {
      this.config.rotationInterval = 15000;
    }

    // Apply weather preferences
    if (this.preferences.weather && this.preferences.weather.length > 0) {
      if (this.preferences.weather.includes('auto')) {
        this.setWeatherMode('auto');
      } else {
        // Set specific weather modes
        this.activeWeatherModes = [...this.preferences.weather];
        const randomWeather = this.activeWeatherModes[Math.floor(Math.random() * this.activeWeatherModes.length)];
        this.setWeatherMode(randomWeather);
      }
    }

    // Apply image effects (this is crucial!)
    if (this.preferences.imageEffects && this.preferences.imageEffects.length > 0) {
      this.applyImageEffects(this.preferences.imageEffects);
    }

    // Apply game mode
    if (this.preferences.gameMode && this.preferences.gameMode !== 'off') {
      this.startGame(this.preferences.gameMode);
    }

    // Restart rotation with new interval if active
    if (this.active && this.config.autoRotate) {
      this.stopRotation();
      this.startRotation();
    }
  }

  /**
   * Update active image effects (matching radio player approach)
   */
  updateActiveImageEffects() {
    if (this.preferences.imageEffects && this.preferences.imageEffects.length > 0) {
      this.applyImageEffects(this.preferences.imageEffects);
    }
  }

  /**
   * Apply image effects to all images (matching radio player implementation)
   */
  applyImageEffects(effects) {
    const gallery = document.querySelector(this.config.gallerySelector);
    if (!gallery) return;

    // Build keyframes based on selected effects (matching radio player exactly)
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
      styleEl.textContent = keyframes + `\n${this.config.gallerySelector} img { animation: customWarpFilter 45s ease-in-out infinite !important; }`;
      document.head.appendChild(styleEl);
    } else {
      // Reset to default if no effects (optional)
      styleEl = document.createElement('style');
      styleEl.id = 'customImageEffects';
      styleEl.textContent = `${this.config.gallerySelector} img { animation: none !important; }`;
      document.head.appendChild(styleEl);
    }
  }

  /**
   * Start image animation effects (placeholder - effects handled by CSS keyframes)
   */
  startImageAnimation() {
    // Image animation is handled by the CSS keyframes generated in applyImageEffects
    // This method is kept for compatibility but doesn't need to do anything
  }

  /**
   * Stop image animation effects (placeholder - effects handled by CSS keyframes)
   */
  stopImageAnimation() {
    // Animation stop is handled by removing the CSS style in applyImageEffects
    // This method is kept for compatibility but doesn't need to do anything
  }

  /**
   * Start game mode
   */
  startGame(difficulty) {
    if (this.gameActive) return;

    this.gameActive = true;
    this.gameScore = 0;
    this.gameStartTime = Date.now();
    this.gameDifficulty = difficulty;

    console.log(`🎮 Game started in ${difficulty} mode`);

    // Update HUD
    this.updateGameHUD();

    // Start spawning icons
    this.startGameIconSpawning();

    // Start game timer
    this.gameTimerInterval = setInterval(() => {
      this.updateGameTimer();
    }, 1000);
  }

  /**
   * Stop game mode
   */
  stopGame() {
    if (!this.gameActive) return;

    this.gameActive = false;

    // Clear intervals
    if (this.gameTimerInterval) {
      clearInterval(this.gameTimerInterval);
      this.gameTimerInterval = null;
    }

    if (this.gameSpawnInterval) {
      clearInterval(this.gameSpawnInterval);
      this.gameSpawnInterval = null;
    }

    // Remove floating icons
    const iconsContainer = document.querySelector('.floating-game-icons');
    if (iconsContainer) {
      iconsContainer.innerHTML = '';
    }

    console.log(`🎮 Game stopped. Final score: ${this.gameScore}`);
  }

  /**
   * Start spawning game icons
   */
  startGameIconSpawning() {
    if (this.gameSpawnInterval) return;

    // Spawn rate based on difficulty
    const spawnRates = {
      easy: 3000,
      medium: 2000,
      hard: 1000
    };

    const spawnRate = spawnRates[this.gameDifficulty] || 2000;

    this.gameSpawnInterval = setInterval(() => {
      this.spawnGameIcon();
    }, spawnRate);
  }

  /**
   * Spawn a game icon
   */
  spawnGameIcon() {
    const iconsContainer = document.querySelector('.floating-game-icons');
    if (!iconsContainer) return;

    const icons = ['🎵', '🎸', '🎤', '🎹', '🥁', '🎺', '🎻', '🎪'];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    const icon = document.createElement('div');
    icon.className = 'floating-game-icon';
    icon.textContent = randomIcon;
    icon.style.position = 'absolute';
    icon.style.left = Math.random() * 80 + '%';
    icon.style.top = Math.random() * 80 + '%';
    icon.style.fontSize = '2rem';
    icon.style.cursor = 'pointer';
    icon.style.zIndex = '15';
    icon.style.userSelect = 'none';
    icon.style.animation = 'fadeInOut 5s ease-in-out forwards';

    // Add click handler
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.collectGameIcon(icon, randomIcon);
    });

    iconsContainer.appendChild(icon);

    // Remove after timeout
    setTimeout(() => {
      if (icon.parentNode) {
        icon.remove();
      }
    }, 5000);
  }

  /**
   * Collect a game icon
   */
  collectGameIcon(icon, iconType) {
    // Award points based on difficulty
    const points = {
      easy: 10,
      medium: 20,
      hard: 30
    };

    const earnedPoints = points[this.gameDifficulty] || 10;
    this.gameScore += earnedPoints;

    // Visual feedback
    const feedback = document.createElement('div');
    feedback.textContent = `+${earnedPoints}`;
    feedback.style.position = 'absolute';
    feedback.style.left = icon.style.left;
    feedback.style.top = icon.style.top;
    feedback.style.color = '#00ff00';
    feedback.style.fontWeight = 'bold';
    feedback.style.fontSize = '1.5rem';
    feedback.style.zIndex = '20';
    feedback.style.pointerEvents = 'none';
    feedback.style.animation = 'scorePopup 1s ease-out forwards';

    icon.parentNode.appendChild(feedback);

    // Remove elements
    icon.remove();
    setTimeout(() => feedback.remove(), 1000);

    // Update HUD
    this.updateGameHUD();
  }

  /**
   * Update game HUD
   */
  updateGameHUD() {
    const scoreElement = document.getElementById('hudScore');
    if (scoreElement) {
      scoreElement.textContent = this.gameScore;
    }
  }

  /**
   * Update game timer
   */
  updateGameTimer() {
    if (!this.gameActive) return;

    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const timerElement = document.getElementById('gameTimer');
    if (timerElement) {
      timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
   * Setup customization panel event handlers
   */
  setupCustomizationPanel() {
    // Customization toggle
    const customizationToggle = document.getElementById('customizationToggle');
    const customizationPanel = document.getElementById('customizationPanel');
    
    if (customizationToggle && customizationPanel) {
      customizationToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        customizationPanel.classList.toggle('expanded');
      });
    }

    // Weather mode buttons
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
        
        this.savePreferences();
      });
    });

    // Image effect buttons
    const imageBtns = document.querySelectorAll('.image-btn');
    imageBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.toggle('active');
        this.updateActiveImageEffectsFromButtons();
        this.savePreferences();
      });
    });

    // Game mode buttons
    const gameBtns = document.querySelectorAll('.game-btn');
    gameBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Single selection for game mode
        gameBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const gameMode = btn.dataset.game;
        if (gameMode === 'off') {
          this.stopGame();
        } else {
          this.startGame(gameMode);
        }
        
        this.preferences.gameMode = gameMode;
        this.savePreferences();
      });
    });

    // Transition buttons
    const transitionBtns = document.querySelectorAll('.transition-btn');
    transitionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        transitionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.preferences.transition = btn.dataset.transition;
        this.config.transitionsEnabled = this.preferences.transition === 'on';
        this.savePreferences();
      });
    });

    // Animation buttons
    const animationBtns = document.querySelectorAll('.animation-btn');
    animationBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        animationBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.preferences.animation = btn.dataset.animation;
        this.savePreferences();
      });
    });

    // Other feature buttons (lyrics, title, summary, badges)
    const featureButtons = [
      { selector: '.lyrics-btn', preference: 'lyrics' },
      { selector: '.title-btn', preference: 'title' },
      { selector: '.summary-btn', preference: 'summary' },
      { selector: '.badges-btn', preference: 'badges' }
    ];

    featureButtons.forEach(({ selector, preference }) => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          this.preferences[preference] = btn.dataset[preference];
          this.savePreferences();
        });
      });
    });
  }

  /**
   * Update active image effects from button states (matching radio player)
   */
  updateActiveImageEffectsFromButtons() {
    this.preferences.imageEffects = [];
    
    const activeButtons = document.querySelectorAll('.image-btn.active');
    activeButtons.forEach(btn => {
      this.preferences.imageEffects.push(btn.dataset.effect);
    });

    // Apply effects immediately (this is the key difference!)
    this.applyImageEffects(this.preferences.imageEffects);
  }

  /**
   * Load preferences and update UI (matching radio player structure)
   */
  loadPreferencesIntoUI() {
    // Weather buttons
    document.querySelectorAll('.weather-btn').forEach(btn => {
      const weather = btn.dataset.weather;
      if (this.preferences.weather && this.preferences.weather.includes(weather)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Image effect buttons
    document.querySelectorAll('.image-btn').forEach(btn => {
      const effect = btn.dataset.effect;
      if (this.preferences.imageEffects && this.preferences.imageEffects.includes(effect)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Game mode buttons
    document.querySelectorAll('.game-btn').forEach(btn => {
      if (btn.dataset.game === this.preferences.gameMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Feature buttons (using radio player preference names)
    const features = [
      { selector: '.lyrics-btn', preference: 'lyrics', attribute: 'lyrics' },
      { selector: '.title-btn', preference: 'title', attribute: 'title' },
      { selector: '.summary-btn', preference: 'summary', attribute: 'summary' },
      { selector: '.badges-btn', preference: 'badges', attribute: 'badges' },
      { selector: '.transition-btn', preference: 'transition', attribute: 'transition' },
      { selector: '.animation-btn', preference: 'animation', attribute: 'animation' }
    ];

    features.forEach(({ selector, preference, attribute }) => {
      document.querySelectorAll(selector).forEach(btn => {
        if (btn.dataset[attribute] === this.preferences[preference]) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  }

  /**
   * Save all preferences from current UI state
   */
  saveAllPreferences() {
    // Weather preferences
    this.preferences.weather = [];
    document.querySelectorAll('.weather-btn.active').forEach(btn => {
      this.preferences.weather.push(btn.dataset.weather);
    });

    // Image effects
    this.preferences.imageEffects = [];
    document.querySelectorAll('.image-btn.active').forEach(btn => {
      this.preferences.imageEffects.push(btn.dataset.effect);
    });

    // Single-select preferences
    const singleSelects = [
      { selector: '.game-btn.active', preference: 'gameMode', attribute: 'game' },
      { selector: '.lyrics-btn.active', preference: 'lyrics', attribute: 'lyrics' },
      { selector: '.title-btn.active', preference: 'title', attribute: 'title' },
      { selector: '.summary-btn.active', preference: 'summary', attribute: 'summary' },
      { selector: '.badges-btn.active', preference: 'badges', attribute: 'badges' },
      { selector: '.transition-btn.active', preference: 'transition', attribute: 'transition' },
      { selector: '.animation-btn.active', preference: 'animation', attribute: 'animation' }
    ];

    singleSelects.forEach(({ selector, preference, attribute }) => {
      const activeBtn = document.querySelector(selector);
      if (activeBtn) {
        this.preferences[preference] = activeBtn.dataset[attribute];
      }
    });

    this.savePreferences();
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

    // Clear all intervals and timeouts
    if (this.gameTimerInterval) {
      clearInterval(this.gameTimerInterval);
    }
    if (this.gameSpawnInterval) {
      clearInterval(this.gameSpawnInterval);
    }
    if (this.imageAnimationInterval) {
      clearInterval(this.imageAnimationInterval);
    }
    if (this.weatherTimeout) {
      clearTimeout(this.weatherTimeout);
    }
  }
}

// Export for module systems or global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WavelengthScreensaver;
} else {
  window.WavelengthScreensaver = WavelengthScreensaver;
}