/**
 * Wavelength Lore Site Tour System
 * 
 * A comprehensive tour guide for new visitors to explore the unique features of Wavelength Lore.
 * Unlike any fan site - combines fan content with game-like exploration and rewards.
 * 
 * Based on GitHub Issue #149: Welcome to WavelengthLore Tour
 */

// Guard against double-loading
if (typeof window.WavelengthSiteTour !== 'undefined') {
  console.log('🌊 WavelengthSiteTour already loaded, skipping redefinition');
} else {

class WavelengthSiteTour {
  constructor() {
    this.currentTourStep = 0;
    this.tourSteps = [];
    this.tourId = null; // Unique identifier for different tour types
    this.isActive = false;
    
    // Initialize tour configurations
    this.init();
  }

  init() {
    console.log('🌊 Wavelength Site Tour system initialized');
    
    // Make globally accessible
    if (typeof window !== 'undefined') {
      window.wavelengthSiteTour = this;
    }
  }

  /**
   * Start the main site tour (homepage/episodes)
   */
  startMainSiteTour(forceStart = false) {
    const tourCompleted = !forceStart && localStorage.getItem('wavelength_site_tour_completed') === 'true';
    
    if (tourCompleted && !forceStart) {
      this.showTourReplayOption();
      return;
    }

    this.tourId = 'main-site';
    this.currentTourStep = 0;
    
    this.tourSteps = [
      {
        title: "Welcome to Wavelength Lore 🌊",
        content: "This isn't just a fan site—it's a journey. Here you'll explore the complete lore across all seasons, play interactive games, collect images, and unlock rewards. Think of it as a fan site meets World of Warcraft!",
        target: ".main-content, .episodes-grid, header",
        placement: "bottom",
        highlightSelector: "header"
      },
      {
        title: "Browse All Lore & Episodes 📚",
        content: "Scroll through episodes from all seasons. Each episode contains rich lore, character stories, and connections to the Wavelength universe. Click any episode to dive deep into its story.",
        target: ".episodes-grid, .episode-grid, section.episodes",
        placement: "top",
        highlightSelector: ".episodes-grid, .episode-grid"
      },
      {
        title: "Radio Widget on Every Page 📻",
        content: "The RadioWidget appears on every page. You can listen to the soundtrack while browsing. Click to expand for more features including the screensaver mode!",
        target: ".radio-player-widget, #radioPlayerWidget, .radio-widget-container, .mini-radio-player",
        placement: "left",
        highlightSelector: ".radio-player-widget, #radioPlayerWidget, .mini-radio-player",
        previewImage: "/images/previews/radio-widget-preview.jpeg",
        previewNote: "The mini radio player appears at the bottom of every page"
      },
      {
        title: "Visit the Full Radio Player 🎵",
        content: "For advanced features like the screensaver and playlist management, visit the main Radio Player page. It's in the navigation menu!",
        target: "nav, .navigation, header nav",
        placement: "bottom",
        highlightSelector: "nav a[href*='radio'], nav a[href='/radio']",
        previewImage: "/images/previews/radio-full-preview.jpeg",
        actionHint: "Look for 'Radio' in the navigation menu",
        previewNote: "The full Radio Player includes screensaver mode, full playlist controls, and episode information"
      },
      {
        title: "Play Interactive Games 🎮",
        content: "Wavelength Lore has built-in games that let you experience the lore in new ways. Play Wavelength Gems (match-3 puzzle game) to unlock badges and rewards!",
        target: "nav a[href*='game'], .games-link, nav a[href='/games']",
        placement: "bottom",
        highlightSelector: "nav a[href*='game'], nav a[href='/games']",
        actionHint: "Find 'Games' in the navigation menu",
        previewImage: "/images/previews/games-preview.jpeg",
        previewNote: "Wavelength Gems: Match-3 puzzle game where each level tells an episode's story"
      },
      {
        title: "Collect Images from Episodes 🖼️",
        content: "As you explore episodes, you can collect images to your personal gallery. These can later be used to create custom merchandise in The Liberation Vault!",
        target: ".episodes-grid .episode img, .gallery-collect-btn",
        placement: "top",
        highlightSelector: ".episodes-grid .episode img",
        previewImage: "/images/previews/gallery-preview.jpeg",
        previewNote: "Click the collect button on any episode image to save it to your gallery"
      },
      {
        title: "Visit The Liberation Vault 🏛️",
        content: "Transform your collected images into custom merchandise! The Liberation Vault lets you create unique products like t-shirts, tote bags, and more. Your symbols of liberation await!",
        target: "nav a[href*='merchandise'], nav a[href='/merchandise'], .merchandise-link",
        placement: "bottom",
        highlightSelector: "nav a[href*='merchandise'], nav a[href='/merchandise']",
        actionHint: "Find 'The Liberation Vault' or 'Merchandise' in the navigation",
        previewImage: "/images/previews/liberation-vault-preview.jpeg",
        previewNote: "Use your gallery images to create custom t-shirts, tote bags, mugs, and more"
      }
    ];

    console.log('🎭 Starting main site tour with', this.tourSteps.length, 'steps');
    this.showTourStep(0);
  }

  /**
   * Start the radio player tour
   */
  startRadioTour(forceStart = false) {
    const tourCompleted = !forceStart && localStorage.getItem('wavelength_radio_tour_completed') === 'true';
    
    if (tourCompleted && !forceStart) {
      return;
    }

    this.tourId = 'radio';
    this.currentTourStep = 0;
    
    this.tourSteps = [
      {
        title: "The Radio Player 📻",
        content: "Listen to the complete Wavelength soundtrack. All songs are organized by season and episode, matching the lore you're exploring.",
        target: ".radio-player, #radioPlayer",
        placement: "bottom",
        previewImage: "/images/previews/radio-full-preview.jpeg",
        previewNote: "Full-featured player with all episodes organized by season"
      },
      {
        title: "Screensaver Mode 🎬",
        content: "Enable the screensaver for a beautiful visual experience while listening. Perfect for when you want to let the music play while you explore!",
        target: ".screensaver-toggle, #screensaverToggle, .screensaver-controls",
        placement: "left",
        previewImage: "/images/previews/screensaver-preview.jpeg",
        previewNote: "Click the screensaver button to activate visual mode"
      },
      {
        title: "Playlist Management 📋",
        content: "Create playlists, shuffle tracks, and control your listening experience. Each track is connected to an episode's story!",
        target: ".playlist-container, .playlist-controls",
        placement: "top"
      }
    ];

    this.showTourStep(0);
  }

  /**
   * Start the games tour
   */
  startGamesTour(forceStart = false) {
    const tourCompleted = !forceStart && localStorage.getItem('wavelength_games_tour_completed') === 'true';
    
    if (tourCompleted && !forceStart) {
      return;
    }

    this.tourId = 'games';
    this.currentTourStep = 0;
    
    this.tourSteps = [
      {
        title: "Wavelength Gems 🎮",
        content: "Play this cozy match-3 puzzle game where each level tells a story from Wavelength Lore. Match gems themed after beloved characters!",
        target: ".game-container, .wavelength-gems-game, #gameBoard",
        placement: "bottom",
        previewImage: "/images/previews/games-preview.jpeg",
        previewNote: "Match-3 gameplay with Wavelength Lore themes and characters"
      },
      {
        title: "Unlock Badges & Rewards 🏆",
        content: "Complete levels and challenges to unlock badges. These badges unlock special features and access to The Liberation Vault!",
        target: ".badges-section, .badge-collection, .npc-quest-panel",
        placement: "top",
        previewImage: "/images/previews/badges-preview.jpeg",
        previewNote: "Earn badges and rewards as you progress through levels"
      },
      {
        title: "Collect & Play 🎯",
        content: "Games help you enjoy the lore in new ways while earning collectibles and unlocking exclusive content. Keep playing to discover more!",
        target: ".game-rewards, .collection-display",
        placement: "top"
      }
    ];

    this.showTourStep(0);
  }

  /**
   * Show a specific tour step
   */
  showTourStep(stepIndex) {
    if (!this.tourSteps || !Array.isArray(this.tourSteps) || this.tourSteps.length === 0) {
      console.error('🌊 Tour steps not initialized!');
      return;
    }

    if (stepIndex >= this.tourSteps.length) {
      this.completeTour();
      return;
    }

    if (stepIndex < 0) {
      stepIndex = 0;
    }

    const step = this.tourSteps[stepIndex];
    this.currentTourStep = stepIndex;
    this.isActive = true;

    // Remove existing overlay
    this.removeTourOverlay();

    // Create tour overlay
    const overlay = document.createElement('div');
    overlay.className = 'wavelength-tour-overlay';
    overlay.innerHTML = `
      <div class="tour-backdrop"></div>
      <div class="tour-spotlight" id="tour-spotlight"></div>
      <div class="tour-tooltip" id="tour-tooltip">
        <div class="tour-header">
          <h3>${step.title}</h3>
          <div class="tour-progress">
            <span>${stepIndex + 1} of ${this.tourSteps.length}</span>
          </div>
        </div>
        <div class="tour-content">
          <p>${step.content}</p>
          ${step.actionHint ? `<div class="tour-hint">💡 ${step.actionHint}</div>` : ''}
          ${step.previewImage ? `
            <div class="tour-preview-image-container">
              <img src="${step.previewImage}" 
                   alt="${step.title}" 
                   class="tour-preview-image"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <div class="tour-preview-placeholder" style="display: none;">
                <div class="placeholder-icon">🖼️</div>
                <div class="placeholder-text">Preview Image</div>
              </div>
              ${step.previewNote ? `<div class="tour-preview-note">${step.previewNote}</div>` : ''}
            </div>
          ` : ''}
        </div>
        <div class="tour-actions">
          <button class="tour-btn tour-skip" onclick="window.wavelengthSiteTour.skipTour()">Skip Tour</button>
          <div class="tour-nav">
            ${stepIndex > 0 ? '<button class="tour-btn tour-prev" onclick="window.wavelengthSiteTour.previousTourStep()">Previous</button>' : ''}
            <button class="tour-btn tour-next primary" onclick="window.wavelengthSiteTour.nextTourStep()">
              ${stepIndex === this.tourSteps.length - 1 ? 'Complete Tour' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Position tooltip
    setTimeout(() => {
      this.positionTourTooltip(step);
    }, 50);
  }

  /**
   * Position the tour tooltip relative to target element
   */
  positionTourTooltip(step) {
    const target = this.findTargetElement(step.target);
    const tooltip = document.getElementById('tour-tooltip');
    const spotlight = document.getElementById('tour-spotlight');

    if (!tooltip) return;

    // Use highlight selector if available, otherwise use target selector
    const highlightTarget = step.highlightSelector ? 
      this.findTargetElement(step.highlightSelector) : target;

    if (!target && !highlightTarget) {
      console.warn('🌊 Tour target not found:', step.target);
      // Fallback: center tooltip
      tooltip.style.left = '50%';
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      tooltip.style.position = 'fixed';
      if (spotlight) spotlight.style.display = 'none';
      return;
    }

    const targetElement = highlightTarget || target;
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Position spotlight
    if (spotlight && highlightTarget) {
      spotlight.style.display = 'block';
      spotlight.style.left = `${targetRect.left - 10}px`;
      spotlight.style.top = `${targetRect.top - 10}px`;
      spotlight.style.width = `${targetRect.width + 20}px`;
      spotlight.style.height = `${targetRect.height + 20}px`;
    } else if (spotlight) {
      spotlight.style.display = 'none';
    }

    // Position tooltip based on placement
    let tooltipLeft, tooltipTop;
    const placement = step.placement || 'bottom';

    switch (placement) {
      case 'bottom':
        tooltipLeft = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        tooltipTop = targetRect.bottom + 20;
        break;
      case 'top':
        tooltipLeft = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        tooltipTop = targetRect.top - tooltipRect.height - 20;
        break;
      case 'right':
        tooltipLeft = targetRect.right + 20;
        tooltipTop = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'left':
        tooltipLeft = targetRect.left - tooltipRect.width - 20;
        tooltipTop = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        break;
      default:
        tooltipLeft = targetRect.left;
        tooltipTop = targetRect.bottom + 20;
    }

    // Keep tooltip within viewport
    const safeMargin = 40;
    tooltipLeft = Math.max(safeMargin, Math.min(tooltipLeft, window.innerWidth - tooltipRect.width - safeMargin));
    tooltipTop = Math.max(safeMargin, Math.min(tooltipTop, window.innerHeight - tooltipRect.height - safeMargin));

    tooltip.style.left = `${tooltipLeft}px`;
    tooltip.style.top = `${tooltipTop}px`;
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '10001';
  }

  /**
   * Find target element with fallback options
   */
  findTargetElement(selector) {
    if (!selector) return null;
    
    // Try exact selector first
    let element = document.querySelector(selector);
    if (element) return element;

    // Try splitting by comma (multiple selectors)
    const selectors = selector.split(',').map(s => s.trim());
    for (const sel of selectors) {
      element = document.querySelector(sel);
      if (element) return element;
    }

    return null;
  }

  /**
   * Navigate to next tour step
   */
  nextTourStep() {
    if (this.tourSteps && Array.isArray(this.tourSteps)) {
      this.showTourStep(this.currentTourStep + 1);
    }
  }

  /**
   * Navigate to previous tour step
   */
  previousTourStep() {
    if (this.tourSteps && Array.isArray(this.tourSteps)) {
      this.showTourStep(this.currentTourStep - 1);
    }
  }

  /**
   * Skip the tour
   */
  skipTour() {
    this.removeTourOverlay();
    this.isActive = false;
    // Don't mark as completed if skipped
  }

  /**
   * Complete the tour
   */
  completeTour() {
    if (this.tourId === 'main-site') {
      localStorage.setItem('wavelength_site_tour_completed', 'true');
    } else if (this.tourId === 'radio') {
      localStorage.setItem('wavelength_radio_tour_completed', 'true');
    } else if (this.tourId === 'games') {
      localStorage.setItem('wavelength_games_tour_completed', 'true');
    }

    this.removeTourOverlay();
    this.isActive = false;
    this.showTourCompletionMessage();
  }

  /**
   * Show tour completion message
   */
  showTourCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'tour-completion-message';
    message.innerHTML = `
      <div class="completion-content">
        <h3>🎉 Welcome to Wavelength Lore!</h3>
        <p>You're ready to explore! Browse episodes, play games, collect images, and unlock rewards. Your journey begins now.</p>
      </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 4000);
  }

  /**
   * Show tour replay option
   */
  showTourReplayOption() {
    // Check if notification already exists
    if (document.querySelector('.tour-replay-notification')) return;

    const notification = document.createElement('div');
    notification.className = 'tour-replay-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span>Want a refresher?</span>
        <button onclick="window.wavelengthSiteTour.startMainSiteTour(true)">Replay Tour</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 8000);
  }

  /**
   * Remove tour overlay
   */
  removeTourOverlay() {
    const existing = document.querySelector('.wavelength-tour-overlay');
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Reset tour state (for testing)
   */
  resetTourState() {
    localStorage.removeItem('wavelength_site_tour_completed');
    localStorage.removeItem('wavelength_radio_tour_completed');
    localStorage.removeItem('wavelength_games_tour_completed');
    console.log('🌊 Tour state reset - reload page to see tour again');
  }
}

// Initialize on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.wavelengthSiteTour = new WavelengthSiteTour();
      
      // Auto-start main site tour for first-time visitors on homepage
      if (window.location.pathname === '/' || window.location.pathname === '/lore') {
        const tourCompleted = localStorage.getItem('wavelength_site_tour_completed') === 'true';
        if (!tourCompleted) {
          // Wait a bit for page to fully load
          setTimeout(() => {
            window.wavelengthSiteTour.startMainSiteTour();
          }, 1500);
        }
      }
    });
  } else {
    window.wavelengthSiteTour = new WavelengthSiteTour();
  }
}

// Make class globally available
if (typeof window !== 'undefined') {
  window.WavelengthSiteTour = WavelengthSiteTour;
}

} // End of double-loading guard

