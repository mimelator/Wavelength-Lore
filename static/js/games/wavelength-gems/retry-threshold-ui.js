/**
 * Retry Threshold UI Component
 * Displays the current threshold status to the user
 */

const RetryThresholdUI = {
  // DOM element references
  elements: {
    container: null,
    counterText: null,
    timerText: null,
    progressBar: null
  },
  
  // Configuration
  config: {
    containerId: 'retry-threshold-ui',
    updateInterval: 1000, // Update timer display every second (more responsive)
    pollingInterval: 2000 // Check for time-based updates every 2 seconds
  },
  
  // Timer references
  updateTimer: null,
  pollingTimer: null,
  
  /**
   * Initialize the UI component
   */
  init() {
    console.log('🖼️ Initializing Retry Threshold UI');
    
    // Create UI elements if they don't exist
    this.createUIElements();
    
    // Register event listeners
    this.registerEventListeners();
    
    // Initial update
    this.updateDisplay();
    
    // Start timer for updates
    this.startUpdateTimer();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
  },
  
  /**
   * Clean up timers and resources
   */
  cleanup() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  },
  
  /**
   * Create UI elements for threshold display
   */
  createUIElements() {
    // Check if container already exists
    let container = document.getElementById(this.config.containerId);
    
    if (!container) {
      // Create container
      container = document.createElement('div');
      container.id = this.config.containerId;
      container.className = 'retry-threshold-container';
      
      // Create inner HTML structure
      container.innerHTML = `
        <div class="threshold-header">Free Retries</div>
        <div class="threshold-counter" id="threshold-counter">5/5</div>
        <div class="threshold-progress-container">
          <div class="threshold-progress-bar" id="threshold-progress-bar"></div>
        </div>
        <div class="threshold-timer" id="threshold-timer">Resets in: 4 hours</div>
      `;
      
      // Add styles
      const styles = `
        .retry-threshold-container {
          background-color: #2c3e50;
          border-radius: 8px;
          color: #ffffff;
          padding: 10px 15px;
          margin: 10px 0;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          font-family: 'Arial', sans-serif;
          max-width: 250px;
        }
        .threshold-header {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #ecf0f1;
        }
        .threshold-counter {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .threshold-progress-container {
          background-color: #34495e;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .threshold-progress-bar {
          background-color: #2ecc71;
          height: 100%;
          width: 100%;
          transition: width 0.3s ease;
        }
        .threshold-timer {
          font-size: 12px;
          color: #bdc3c7;
        }
        .threshold-warning {
          color: #e74c3c;
        }
      `;
      
      // Add styles to head
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
      
      // Add to the game container
      const gameContainer = document.querySelector('.game-container, #game-container');
      if (gameContainer) {
        gameContainer.appendChild(container);
      } else {
        // Fallback to body
        document.body.appendChild(container);
      }
    }
    
    // Store references to elements
    this.elements.container = container;
    this.elements.counterText = document.getElementById('threshold-counter');
    this.elements.progressBar = document.getElementById('threshold-progress-bar');
    this.elements.timerText = document.getElementById('threshold-timer');
  },
  
  /**
   * Register event listeners
   */
  registerEventListeners() {
    // Listen for threshold updates
    window.addEventListener('retryThresholdUpdated', (event) => {
      this.updateDisplay(event.detail);
    });
    
    // Listen for timer reset events
    window.addEventListener('retryThresholdTimerReset', () => {
      this.showResetNotification('Threshold timer reset! Free retries are now available.');
    });
    
    // Listen for automatic time-based resets
    window.addEventListener('retryThresholdAutoReset', () => {
      this.showResetNotification('Your free retries have been refreshed!');
    });
  },
  
  /**
   * Show a notification when the threshold resets
   * @param {string} message The notification message
   */
  showResetNotification(message) {
    // Update UI first
    this.updateDisplay();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'threshold-reset-notification';
    notification.innerHTML = `
      <div class="notification-icon">🔄</div>
      <div class="notification-message">${message}</div>
    `;
    
    // Style the notification
    const styles = `
      .threshold-reset-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #2ecc71;
        color: white;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.5s ease, fadeOut 0.5s ease 3.5s forwards;
        max-width: 80%;
      }
      .notification-icon {
        font-size: 24px;
        margin-right: 10px;
      }
      .notification-message {
        font-weight: bold;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    
    // Add styles if not already added
    if (!document.getElementById('threshold-notification-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'threshold-notification-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
      notification.remove();
    }, 4000);
  },
  
  /**
   * Start timer for updating display
   */
  startUpdateTimer() {
    // Clear existing timers if any
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
    
    // Start UI update timer (updates display with current data)
    this.updateTimer = setInterval(() => {
      this.updateDisplay();
    }, this.config.updateInterval);
    
    // Start polling timer (checks for time-based resets)
    this.pollingTimer = setInterval(() => {
      this.checkTimeBasedUpdates();
    }, this.config.pollingInterval);
    
    console.log('🖼️ Threshold UI: Started update timers');
  },
  
  /**
   * Check for time-based updates and refresh display if needed
   */
  checkTimeBasedUpdates() {
    if (window.RetryThresholdManager) {
      try {
        // Force a check for time-based updates
        const updated = window.RetryThresholdManager.checkTimeBasedUpdates();
        
        // Only update the display if something actually changed
        if (updated) {
          console.log('🖼️ Time-based update detected, refreshing display');
          this.updateDisplay();
        }
      } catch (error) {
        console.error('Error in checkTimeBasedUpdates:', error);
      }
    }
  },
  
  /**
   * Update the display with current threshold info
   * @param {Object} info Optional threshold info, if not provided will be fetched
   */
  updateDisplay(info = null) {
    // Get threshold info if not provided
    if (!info && window.RetryThresholdManager) {
      info = window.RetryThresholdManager.getThresholdInfo();
    }
    
    // If we still don't have info, return
    if (!info) return;
    
    // Update counter text
    if (this.elements.counterText) {
      this.elements.counterText.textContent = `${info.retriesRemaining}/${info.retriesTotal}`;
      
      // Add warning class if at threshold
      if (info.isAtThreshold) {
        this.elements.counterText.classList.add('threshold-warning');
      } else {
        this.elements.counterText.classList.remove('threshold-warning');
      }
    }
    
    // Update progress bar
    if (this.elements.progressBar) {
      const progressPercent = (info.retriesRemaining / info.retriesTotal) * 100;
      this.elements.progressBar.style.width = `${progressPercent}%`;
      
      // Change color based on remaining retries
      if (progressPercent <= 0) {
        this.elements.progressBar.style.backgroundColor = '#e74c3c'; // Red when depleted
      } else if (progressPercent <= 30) {
        this.elements.progressBar.style.backgroundColor = '#f39c12'; // Orange when low
      } else {
        this.elements.progressBar.style.backgroundColor = '#2ecc71'; // Green when good
      }
    }
    
    // Update timer text
    if (this.elements.timerText) {
      if (info.isAtThreshold) {
        this.elements.timerText.textContent = `Next retries in: ${info.timeUntilReset}`;
        this.elements.timerText.classList.add('threshold-warning');
      } else {
        this.elements.timerText.textContent = `Resets in: ${info.timeUntilReset}`;
        this.elements.timerText.classList.remove('threshold-warning');
      }
    }
  }
};

// Add to window object for global access
window.RetryThresholdUI = RetryThresholdUI;

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment for other systems to initialize
  setTimeout(() => {
    window.RetryThresholdUI.init();
  }, 1500);
});