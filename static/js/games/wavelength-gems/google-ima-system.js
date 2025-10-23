/**
 * Google IMA SDK Video Ad System for Wavelength Gems
 * 
 * This system uses Google IMA (Interactive Media Ads) which is specifically
 * designed for web video advertising. IMA provides real video ads from
 * Google Ad Manager, AdSense, and other VAST-compliant ad servers.
 * 
 * Benefits over Unity Ads:
 * - Actually works in web browsers (not mobile-only)
 * - Real video advertisements with revenue
 * - Industry standard for web video ads
 * - Supports rewarded video functionality
 * - Better fill rates and revenue potential
 * 
 * Requirements:
 * - Google Ad Manager account or AdSense account
 * - VAST-compliant ad tag URL
 * - Video.js player (already using in many web games)
 */

class GoogleIMAAdSystem {
  constructor() {
    this.isInitialized = false;
    this.isAdLoading = false;
    this.isAdPlaying = false;
    this.pendingRewardCallback = null;
    this.player = null;
    this.adStatistics = {
      totalRequests: 0,
      totalStarts: 0,
      totalCompletions: 0,
      totalSkips: 0,
      totalRewards: 0,
      lastAdTime: 0,
      sessionAdCount: 0,
      dailyAdCount: 0
    };
    
    this.log('Google IMA Ad System initialized');
  }
  
  /**
   * Initialize Google IMA SDK and create video player
   */
  async initialize() {
    try {
      // Validate configuration
      if (!GoogleIMAConfig || !GoogleIMAConfig.adTagUrl) {
        throw new Error('Google IMA configuration not found or missing ad tag URL');
      }
      
      this.log('Initializing Google IMA SDK...');
      
      // Load Google IMA SDK
      await this.loadIMASDK();
      
      // Create video player container
      await this.createVideoPlayer();
      
      // Initialize IMA
      await this.initializeIMA();
      
      // Load daily ad count
      this.loadDailyAdCount();
      
      this.isInitialized = true;
      this.log('Google IMA initialized successfully');
      
      return true;
      
    } catch (error) {
      this.logError('Failed to initialize Google IMA', error);
      return false;
    }
  }
  
  /**
   * Load Google IMA SDK dynamically
   */
  loadIMASDK() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.ima) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = '//imasdk.googleapis.com/js/sdkloader/ima3.js';
      script.async = true;
      
      script.onload = () => {
        this.log('Google IMA SDK loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        const error = new Error('Failed to load Google IMA SDK');
        this.logError('IMA SDK loading failed', error);
        reject(error);
      };
      
      document.head.appendChild(script);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!window.google || !window.google.ima) {
          reject(new Error('Google IMA SDK loading timeout'));
        }
      }, 10000);
    });
  }
  
  /**
   * Create video player for ads
   */
  createVideoPlayer() {
    return new Promise((resolve) => {
      // Create video element for ads
      const adContainer = document.createElement('div');
      adContainer.id = 'ima-ad-container';
      adContainer.style.display = 'none';
      adContainer.style.position = 'fixed';
      adContainer.style.top = '0';
      adContainer.style.left = '0';
      adContainer.style.width = '100%';
      adContainer.style.height = '100%';
      adContainer.style.backgroundColor = 'rgba(0,0,0,0.9)';
      adContainer.style.zIndex = '10000';
      
      const videoElement = document.createElement('video');
      videoElement.id = 'ima-video-player';
      videoElement.controls = true;
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'contain';
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '20px';
      closeButton.style.right = '20px';
      closeButton.style.fontSize = '30px';
      closeButton.style.color = 'white';
      closeButton.style.background = 'rgba(0,0,0,0.5)';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '50%';
      closeButton.style.width = '50px';
      closeButton.style.height = '50px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.zIndex = '10001';
      
      closeButton.addEventListener('click', () => {
        this.closeAdPlayer();
      });
      
      adContainer.appendChild(videoElement);
      adContainer.appendChild(closeButton);
      document.body.appendChild(adContainer);
      
      this.adContainer = adContainer;
      this.videoElement = videoElement;
      this.closeButton = closeButton;
      
      this.log('Video player created');
      resolve();
    });
  }
  
  /**
   * Initialize Google IMA
   */
  initializeIMA() {
    return new Promise((resolve, reject) => {
      try {
        // Create ads loader
        this.adsLoader = new google.ima.AdsLoader(this.adContainer);
        
        // Add event listeners
        this.adsLoader.addEventListener(
          google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          this.onAdsManagerLoaded.bind(this),
          false
        );
        
        this.adsLoader.addEventListener(
          google.ima.AdErrorEvent.Type.AD_ERROR,
          this.onAdError.bind(this),
          false
        );
        
        // Create ads display container
        this.adDisplayContainer = new google.ima.AdDisplayContainer(
          this.adContainer,
          this.videoElement
        );
        
        this.log('Google IMA components initialized');
        resolve();
        
      } catch (error) {
        this.logError('Failed to initialize IMA components', error);
        reject(error);
      }
    });
  }
  
  /**
   * Show rewarded video ad
   */
  async showRewardedAd(options = {}) {
    try {
      // Validate preconditions
      if (!this.canShowAd()) {
        return { success: false, error: 'Cannot show ad at this time' };
      }
      
      // Set up reward callback
      this.pendingRewardCallback = options.onReward || (() => {});
      
      // Update statistics
      this.adStatistics.totalRequests++;
      
      // Show ad container
      this.showAdPlayer();
      
      // Initialize ad display container (required for user interaction)
      this.adDisplayContainer.initialize();
      
      // Create ads request
      const adsRequest = new google.ima.AdsRequest();
      adsRequest.adTagUrl = GoogleIMAConfig.adTagUrl;
      adsRequest.linearAdSlotWidth = window.innerWidth;
      adsRequest.linearAdSlotHeight = window.innerHeight;
      adsRequest.nonLinearAdSlotWidth = 300;
      adsRequest.nonLinearAdSlotHeight = 150;
      
      // Request ads
      this.adsLoader.requestAds(adsRequest);
      
      this.log('Requesting rewarded video ad');
      return { success: true };
      
    } catch (error) {
      this.logError('Failed to show rewarded ad', error);
      this.closeAdPlayer();
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Show ad offer dialog
   */
  showAdOfferDialog(options = {}) {
    return new Promise((resolve) => {
      // Check if we can show an ad
      if (!this.canShowAd()) {
        resolve({ 
          success: false, 
          error: 'No ads available right now',
          reason: 'cooldown' 
        });
        return;
      }
      
      const retries = GoogleIMAConfig.rewards.watchVideoRetries;
      
      // Create modal dialog
      const modal = this.createOfferModal({
        title: 'Out of Retries!',
        message: 'Watch a video advertisement to earn more retries',
        buttonText: `Watch Video (+${retries} retries)`,
        declineText: 'No Thanks',
        onAccept: async () => {
          modal.showLoading('Loading advertisement...');
          
          const result = await this.showRewardedAd({
            onReward: (rewardAmount) => {
              modal.close();
              this.showRewardSuccessDialog(rewardAmount);
              resolve({ 
                success: true, 
                rewardGranted: true,
                amount: rewardAmount 
              });
            }
          });
          
          if (!result.success) {
            modal.showError('Advertisement not available. Please try again later.');
            setTimeout(() => {
              modal.close();
              resolve({ 
                success: false, 
                error: result.error 
              });
            }, 2000);
          }
        },
        onDecline: () => {
          modal.close();
          resolve({ 
            success: false, 
            userDeclined: true 
          });
        }
      });
      
      modal.show();
    });
  }
  
  /**
   * Ads manager loaded callback
   */
  onAdsManagerLoaded(adsManagerLoadedEvent) {
    this.log('Ads manager loaded');
    
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    
    this.adsManager = adsManagerLoadedEvent.getAdsManager(
      this.videoElement,
      adsRenderingSettings
    );
    
    // Add ads manager event listeners
    this.adsManager.addEventListener(
      google.ima.AdEvent.Type.LOADED,
      this.onAdLoaded.bind(this)
    );
    
    this.adsManager.addEventListener(
      google.ima.AdEvent.Type.STARTED,
      this.onAdStarted.bind(this)
    );
    
    this.adsManager.addEventListener(
      google.ima.AdEvent.Type.COMPLETE,
      this.onAdCompleted.bind(this)
    );
    
    this.adsManager.addEventListener(
      google.ima.AdEvent.Type.SKIPPED,
      this.onAdSkipped.bind(this)
    );
    
    this.adsManager.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      this.onAdError.bind(this)
    );
    
    try {
      // Initialize ads manager
      this.adsManager.init(
        window.innerWidth,
        window.innerHeight,
        google.ima.ViewMode.NORMAL
      );
      
      // Start ads
      this.adsManager.start();
      
    } catch (adError) {
      this.onAdError(adError);
    }
  }
  
  /**
   * Ad loaded callback
   */
  onAdLoaded(adEvent) {
    this.log('Ad loaded successfully');
    
    const ad = adEvent.getAd();
    if (!ad.isLinear()) {
      this.log('Non-linear ad loaded, playing video content');
      this.videoElement.play();
    }
  }
  
  /**
   * Ad started callback
   */
  onAdStarted(adEvent) {
    this.log('Ad started playing');
    this.isAdPlaying = true;
    this.adStatistics.totalStarts++;
    this.adStatistics.sessionAdCount++;
    this.adStatistics.dailyAdCount++;
    this.adStatistics.lastAdTime = Date.now();
    
    // Save daily count
    this.saveDailyAdCount();
    
    // Hide close button during first part of ad
    this.closeButton.style.display = 'none';
    
    // Show close button after minimum watch time
    setTimeout(() => {
      if (this.closeButton) {
        this.closeButton.style.display = 'block';
      }
    }, GoogleIMAConfig.settings.minWatchTime || 15000);
  }
  
  /**
   * Ad completed callback
   */
  onAdCompleted(adEvent) {
    this.log('Ad completed successfully');
    this.isAdPlaying = false;
    this.adStatistics.totalCompletions++;
    
    // Calculate reward
    let rewardAmount = GoogleIMAConfig.rewards.watchVideoRetries;
    
    // Add daily bonus
    if (this.adStatistics.dailyAdCount === 1) {
      rewardAmount += GoogleIMAConfig.rewards.dailyBonus || 0;
    }
    
    // Grant reward
    this.grantReward(rewardAmount);
    
    // Close ad player
    this.closeAdPlayer();
    
    this.log(`Ad completed, reward granted: ${rewardAmount} retries`);
  }
  
  /**
   * Ad skipped callback
   */
  onAdSkipped(adEvent) {
    this.log('Ad was skipped');
    this.isAdPlaying = false;
    this.adStatistics.totalSkips++;
    
    // No reward for skipped ads
    if (this.pendingRewardCallback) {
      this.pendingRewardCallback(0);
      this.pendingRewardCallback = null;
    }
    
    this.closeAdPlayer();
  }
  
  /**
   * Ad error callback
   */
  onAdError(adErrorEvent) {
    this.logError('Ad error occurred', adErrorEvent.getError());
    this.isAdPlaying = false;
    this.isAdLoading = false;
    
    // Close ad player
    this.closeAdPlayer();
    
    // No reward for failed ads
    if (this.pendingRewardCallback) {
      this.pendingRewardCallback(0);
      this.pendingRewardCallback = null;
    }
  }
  
  /**
   * Grant reward to user
   */
  grantReward(amount) {
    this.log(`Granting reward: ${amount} retries`);
    this.adStatistics.totalRewards += amount;
    
    // Call pending reward callback
    if (this.pendingRewardCallback) {
      this.pendingRewardCallback(amount);
      this.pendingRewardCallback = null;
    }
    
    // Integrate with existing retry system
    if (window.RetryThresholdManager) {
      window.RetryThresholdManager.grantAdReward(amount);
    }
  }
  
  /**
   * Show ad player
   */
  showAdPlayer() {
    if (this.adContainer) {
      this.adContainer.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  }
  
  /**
   * Close ad player
   */
  closeAdPlayer() {
    if (this.adContainer) {
      this.adContainer.style.display = 'none';
      document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Clean up ads manager
    if (this.adsManager) {
      this.adsManager.destroy();
      this.adsManager = null;
    }
    
    this.isAdPlaying = false;
    this.isAdLoading = false;
  }
  
  /**
   * Check if ad can be shown
   */
  canShowAd() {
    // Check initialization
    if (!this.isInitialized) {
      this.log('Cannot show ad: not initialized');
      return false;
    }
    
    // Check if already playing ad
    if (this.isAdPlaying) {
      this.log('Cannot show ad: ad already playing');
      return false;
    }
    
    // Check cooldown period
    const timeSinceLastAd = Date.now() - this.adStatistics.lastAdTime;
    if (timeSinceLastAd < (GoogleIMAConfig.settings.minTimeBetweenAds || 120000)) {
      this.log(`Cannot show ad: cooldown active (${Math.ceil(((GoogleIMAConfig.settings.minTimeBetweenAds || 120000) - timeSinceLastAd) / 1000)}s remaining)`);
      return false;
    }
    
    // Check daily limit
    if (this.adStatistics.dailyAdCount >= (GoogleIMAConfig.settings.maxAdsPerDay || 20)) {
      this.log('Cannot show ad: daily limit reached');
      return false;
    }
    
    return true;
  }
  
  /**
   * Create offer modal dialog
   */
  createOfferModal(options) {
    const modal = document.createElement('div');
    modal.className = 'ima-modal';
    modal.innerHTML = `
      <div class="ima-modal-backdrop">
        <div class="ima-modal-content">
          <div class="ima-modal-header">
            <h3>${options.title}</h3>
          </div>
          <div class="ima-modal-body">
            <p class="ima-message">${options.message}</p>
            <div class="ima-loading" style="display: none;">
              <div class="ima-spinner"></div>
              <p class="ima-loading-text">Loading...</p>
            </div>
            <div class="ima-error" style="display: none;">
              <p class="ima-error-text">Error occurred</p>
            </div>
          </div>
          <div class="ima-modal-footer">
            <button class="ima-btn ima-btn-primary ima-accept">${options.buttonText}</button>
            <button class="ima-btn ima-btn-secondary ima-decline">${options.declineText}</button>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    this.addModalStyles();
    
    // Event listeners
    const acceptBtn = modal.querySelector('.ima-accept');
    const declineBtn = modal.querySelector('.ima-decline');
    
    acceptBtn.addEventListener('click', options.onAccept);
    declineBtn.addEventListener('click', options.onDecline);
    
    return {
      element: modal,
      show: () => {
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
      },
      close: () => {
        modal.classList.remove('show');
        setTimeout(() => {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        }, 300);
      },
      showLoading: (text) => {
        modal.querySelector('.ima-modal-body p').style.display = 'none';
        modal.querySelector('.ima-modal-footer').style.display = 'none';
        modal.querySelector('.ima-loading').style.display = 'block';
        modal.querySelector('.ima-loading-text').textContent = text;
      },
      showError: (text) => {
        modal.querySelector('.ima-loading').style.display = 'none';
        modal.querySelector('.ima-error').style.display = 'block';
        modal.querySelector('.ima-error-text').textContent = text;
      }
    };
  }
  
  /**
   * Show reward success dialog
   */
  showRewardSuccessDialog(amount) {
    const modal = this.createOfferModal({
      title: 'Reward Earned!',
      message: `You received ${amount} retries!`,
      buttonText: 'Continue Playing',
      declineText: '',
      onAccept: () => modal.close(),
      onDecline: () => {}
    });
    
    // Hide decline button
    modal.element.querySelector('.ima-decline').style.display = 'none';
    
    modal.show();
    
    // Auto close after 3 seconds
    setTimeout(() => modal.close(), 3000);
  }
  
  /**
   * Add modal CSS styles
   */
  addModalStyles() {
    if (document.getElementById('ima-modal-styles')) {
      return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'ima-modal-styles';
    styles.textContent = `
      .ima-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .ima-modal.show {
        opacity: 1;
        visibility: visible;
      }
      
      .ima-modal-backdrop {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ima-modal-content {
        background: #fff;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }
      
      .ima-modal.show .ima-modal-content {
        transform: scale(1);
      }
      
      .ima-modal-header {
        padding: 20px 20px 0;
        text-align: center;
      }
      
      .ima-modal-header h3 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }
      
      .ima-modal-body {
        padding: 20px;
        text-align: center;
      }
      
      .ima-modal-body p {
        margin: 0 0 20px;
        font-size: 16px;
        color: #666;
        line-height: 1.5;
      }
      
      .ima-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .ima-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: ima-spin 1s linear infinite;
        margin-bottom: 10px;
      }
      
      @keyframes ima-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .ima-modal-footer {
        padding: 0 20px 20px;
        display: flex;
        gap: 10px;
        justify-content: center;
      }
      
      .ima-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 120px;
      }
      
      .ima-btn-primary {
        background: #007bff;
        color: white;
      }
      
      .ima-btn-primary:hover {
        background: #0056b3;
        transform: translateY(-1px);
      }
      
      .ima-btn-secondary {
        background: #6c757d;
        color: white;
      }
      
      .ima-btn-secondary:hover {
        background: #545b62;
        transform: translateY(-1px);
      }
      
      .ima-error {
        color: #dc3545;
        font-weight: bold;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Load/save daily ad count
   */
  loadDailyAdCount() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('ima_daily_stats');
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.date === today) {
          this.adStatistics.dailyAdCount = data.count || 0;
        } else {
          this.adStatistics.dailyAdCount = 0;
          this.saveDailyAdCount();
        }
      } catch (e) {
        this.adStatistics.dailyAdCount = 0;
      }
    }
  }
  
  saveDailyAdCount() {
    const today = new Date().toDateString();
    const data = {
      date: today,
      count: this.adStatistics.dailyAdCount
    };
    
    localStorage.setItem('ima_daily_stats', JSON.stringify(data));
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.adStatistics,
      completionRate: this.adStatistics.totalStarts > 0 
        ? (this.adStatistics.totalCompletions / this.adStatistics.totalStarts * 100).toFixed(1) + '%'
        : '0%',
      averageRewardPerAd: this.adStatistics.totalCompletions > 0
        ? (this.adStatistics.totalRewards / this.adStatistics.totalCompletions).toFixed(1)
        : '0'
    };
  }
  
  /**
   * Logging functions
   */
  log(...args) {
    if (GoogleIMAConfig?.settings?.enableLogging) {
      console.log('[Google IMA]', ...args);
    }
  }
  
  logError(...args) {
    console.error('[Google IMA Error]', ...args);
  }
}

// Global instance
window.googleIMAds = new GoogleIMAAdSystem();

// Integration with existing wavelengthAds interface
window.wavelengthAds = {
  init: () => window.googleIMAds.initialize(),
  showAdOfferDialog: (options) => window.googleIMAds.showAdOfferDialog(options),
  showRewardedAd: (options) => window.googleIMAds.showRewardedAd(options),
  canShowAd: () => window.googleIMAds.canShowAd(),
  getStatistics: () => window.googleIMAds.getStatistics()
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.googleIMAds.initialize();
  });
} else {
  setTimeout(() => window.googleIMAds.initialize(), 100);
}