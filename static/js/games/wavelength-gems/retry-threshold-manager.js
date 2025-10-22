/**
 * Retry Threshold Manager for Wavelength Gems
 * Implements a daily threshold system for retries
 */

const RetryThresholdManager = {
  // Configuration 
  thresholdConfig: {
    defaultDailyLimit: 5,        // Number of free retries per day
    resetIntervalHours: 4,       // Reset threshold every X hours (e.g., 4, 6, 8, 12 hours)
    thresholdsPerDay: 6,         // Number of threshold periods per day (24h/resetIntervalHours)
    storageKey: 'wavelength_retry_threshold'
  },
  
  // Current state
  currentState: {
    retriesUsed: 0,              // Retries used in current threshold
    nextResetTime: null,         // Next threshold reset timestamp
    thresholdPeriod: 1,          // Current threshold period (1-6)
    lastResetDay: null           // Last day when full reset happened
  },
  
  /**
   * Initialize the threshold manager
   * @param {Object} config Optional configuration to override defaults
   */
  init(config = {}) {
    console.log('🕒 Initializing Retry Threshold Manager');
    
    // Override defaults with provided config
    if (config.defaultDailyLimit) this.thresholdConfig.defaultDailyLimit = config.defaultDailyLimit;
    if (config.resetIntervalHours) this.thresholdConfig.resetIntervalHours = config.resetIntervalHours;
    if (config.thresholdsPerDay) this.thresholdConfig.thresholdsPerDay = config.thresholdsPerDay;
    
    // Load existing state or initialize
    this.loadState();
    
    // Check if we need to update state based on time
    this.checkTimeBasedUpdates();
    
    console.log(`✅ Retry Threshold Manager initialized: ${this.getRemainingRetries()} retries available`);
    console.log(`   Next reset in: ${this.getTimeUntilNextReset()} minutes`);
  },
  
  /**
   * Load threshold state from localStorage
   */
  loadState() {
    try {
      const savedData = localStorage.getItem(this.thresholdConfig.storageKey);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        this.currentState = {
          ...this.currentState,
          ...parsedData
        };
        console.log('📂 Loaded threshold data:', this.currentState);
      } else {
        // Initialize with fresh state
        this.resetThreshold(true);
      }
    } catch (error) {
      console.error('Error loading threshold state:', error);
      // Initialize with fresh state
      this.resetThreshold(true);
    }
  },
  
  /**
   * Save current threshold state to localStorage
   */
  saveState() {
    try {
      localStorage.setItem(
        this.thresholdConfig.storageKey,
        JSON.stringify(this.currentState)
      );
    } catch (error) {
      console.error('Error saving threshold state:', error);
    }
  },
  
  /**
   * Check if we need to update based on time (resets)
   * @returns {boolean} True if an update was performed
   */
  checkTimeBasedUpdates() {
    const now = new Date();
    const currentDay = now.toDateString();
    const currentTime = now.getTime();
    let updated = false;
    
    // Check if we need a full daily reset
    if (this.currentState.lastResetDay !== currentDay) {
      console.log('🌅 New day detected, performing full threshold reset');
      this.resetThreshold(true);
      updated = true;
      return updated;
    }
    
    // Check if current threshold period has expired
    if (this.currentState.nextResetTime && currentTime >= this.currentState.nextResetTime) {
      console.log('⏰ Threshold period expired, resetting threshold');
      
      // Calculate threshold state directly to avoid circular calls
      const retriesRemaining = Math.max(0, this.thresholdConfig.defaultDailyLimit - this.currentState.retriesUsed);
      const wasAtThreshold = retriesRemaining <= 0;
      
      this.resetThreshold(false);
      updated = true;
      
      // Explicitly notify of time-based reset
      if (wasAtThreshold) {
        window.dispatchEvent(new CustomEvent('retryThresholdAutoReset', {
          detail: { timestamp: now.getTime() }
        }));
      }
    }
    
    return updated;
  },
  
  /**
   * Reset the threshold counter
   * @param {boolean} fullReset If true, reset everything including the period counter
   */
  resetThreshold(fullReset = false) {
    const now = new Date();
    const wasAtThreshold = this.isThresholdReached(); // Store previous threshold state
    
    if (fullReset) {
      // Full reset (new day)
      this.currentState.retriesUsed = 0;
      this.currentState.thresholdPeriod = 1;
      this.currentState.lastResetDay = now.toDateString();
    } else {
      // Partial reset (new threshold period)
      this.currentState.retriesUsed = 0;
      this.currentState.thresholdPeriod++;
      
      // If we've reached the max periods for the day, wrap around
      if (this.currentState.thresholdPeriod > this.thresholdConfig.thresholdsPerDay) {
        this.currentState.thresholdPeriod = 1;
      }
    }
    
    // Calculate next reset time
    const resetMilliseconds = this.thresholdConfig.resetIntervalHours * 60 * 60 * 1000;
    this.currentState.nextResetTime = now.getTime() + resetMilliseconds;
    
    // Save the updated state
    this.saveState();
    
    // Dispatch event for UI updates
    this.dispatchThresholdUpdated();
    
    // Dispatch timer reset event if we were at threshold
    if (wasAtThreshold) {
      console.log('🕒 Threshold timer reset - retries now available');
      window.dispatchEvent(new CustomEvent('retryThresholdTimerReset'));
    }
  },
  
  /**
   * Use a retry attempt
   * @returns {boolean} True if retry was successful, false if at threshold limit
   */
  useRetry() {
    // First check if we need time-based updates
    this.checkTimeBasedUpdates();
    
    // Check if we're at the threshold
    if (this.currentState.retriesUsed >= this.thresholdConfig.defaultDailyLimit) {
      console.log('❌ Retry threshold reached, cannot use retry');
      return false;
    }
    
    // Increment retry count
    this.currentState.retriesUsed++;
    console.log(`🔄 Retry used: ${this.currentState.retriesUsed}/${this.thresholdConfig.defaultDailyLimit}`);
    
    // Save the updated state
    this.saveState();
    
    // Dispatch event for UI updates
    this.dispatchThresholdUpdated();
    
    return true;
  },
  
  /**
   * Get number of remaining retries in current threshold
   * @param {boolean} skipTimeCheck If true, skip the time-based update check
   * @returns {number} Number of retries remaining
   */
  getRemainingRetries(skipTimeCheck = false) {
    // First check if we need time-based updates (unless skipTimeCheck is true)
    if (!skipTimeCheck) {
      this.checkTimeBasedUpdates();
    }
    
    return Math.max(0, this.thresholdConfig.defaultDailyLimit - this.currentState.retriesUsed);
  },
  
  /**
   * Check if user has reached the threshold limit
   * @param {boolean} skipTimeCheck If true, skip the time-based update check
   * @returns {boolean} True if threshold reached
   */
  isThresholdReached(skipTimeCheck = false) {
    // Use skipTimeCheck to prevent infinite recursion
    return this.getRemainingRetries(true) <= 0;
  },
  
  /**
   * Get formatted time until next reset
   * @returns {string} Time until next reset in appropriate format
   */
  getTimeUntilNextReset() {
    if (!this.currentState.nextResetTime) {
      return "0";
    }
    
    const now = new Date().getTime();
    const timeLeft = Math.max(0, this.currentState.nextResetTime - now);
    
    // For very short times (less than a minute), show seconds
    if (timeLeft < 60 * 1000) {
      const secondsLeft = Math.ceil(timeLeft / 1000);
      return `${secondsLeft} second${secondsLeft !== 1 ? 's' : ''}`;
    }
    
    // Convert to minutes for longer times
    const minutesLeft = Math.floor(timeLeft / (60 * 1000));
    
    if (minutesLeft < 60) {
      return `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutesLeft / 60);
      const minutes = minutesLeft % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  },
  
  /**
   * Get detailed threshold info for display
   * @returns {Object} Threshold information
   */
  getThresholdInfo() {
    // Ensure we have up-to-date data
    this.checkTimeBasedUpdates();
    
    // Calculate values directly to avoid circular calls
    const retriesRemaining = Math.max(0, this.thresholdConfig.defaultDailyLimit - this.currentState.retriesUsed);
    
    return {
      retriesUsed: this.currentState.retriesUsed,
      retriesTotal: this.thresholdConfig.defaultDailyLimit,
      retriesRemaining: retriesRemaining,
      nextResetTime: this.currentState.nextResetTime,
      timeUntilReset: this.getTimeUntilNextReset(),
      thresholdPeriod: this.currentState.thresholdPeriod,
      thresholdsPerDay: this.thresholdConfig.thresholdsPerDay,
      isAtThreshold: (retriesRemaining <= 0)
    };
  },
  
  /**
   * Dispatch custom event when threshold is updated
   */
  dispatchThresholdUpdated() {
    window.dispatchEvent(new CustomEvent('retryThresholdUpdated', {
      detail: this.getThresholdInfo()
    }));
  }
};

// Add to window object for global access
window.RetryThresholdManager = RetryThresholdManager;

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment for other systems to initialize
  setTimeout(() => {
    window.RetryThresholdManager.init();
  }, 1000);
});