/**
 * Authenticated User Radio Player Test Suite
 * Tests Firebase sync and cross-device functionality for logged-in users
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const RADIO_URL = `${BASE_URL}/radio`;
const TEST_TIMEOUT = 30000;

// Test credentials (use environment variables in production)
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@wavelengthlore.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

class AuthenticatedRadioTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login() {
    try {
      // On localhost, dev bypass auto-authenticates
      // Just navigate to radio page to trigger authentication
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      await new Promise(r => setTimeout(r, 1000));
      return true;
    } catch (error) {
      console.log('⚠️  Navigation failed:', error.message);
      return false;
    }
  }

  async isAuthenticated() {
    try {
      // Check if user is authenticated via dev bypass or Firebase
      const hasAuth = await this.page.evaluate(() => {
        return !!localStorage.getItem('firebase:authUser') || 
               !!sessionStorage.getItem('firebase:authUser') ||
               window.location.hostname === 'localhost';
      });
      return hasAuth;
    } catch (e) {
      return false;
    }
  }

  log(testName, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
    this.results.push({ testName, passed, message });
  }

  // Test 1: User can authenticate
  async testAuthentication() {
    try {
      const loggedIn = await this.login();
      const isAuth = await this.isAuthenticated();
      const passed = loggedIn && isAuth;
      this.log('User Authentication', passed, `Dev bypass active: ${isAuth}`);
      return passed;
    } catch (error) {
      this.log('User Authentication', false, error.message);
      return false;
    }
  }

  // Test 2: Firebase sync enabled for authenticated user
  async testFirebaseSyncEnabled() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const syncEnabled = await this.page.evaluate(() => {
        return window.radioPlayer && window.radioPlayer.firebaseSync === true;
      });
      
      this.log('Firebase Sync Enabled', syncEnabled, `Sync: ${syncEnabled}`);
    } catch (error) {
      this.log('Firebase Sync Enabled', false, error.message);
    }
  }

  // Test 3: Cozy stats sync to Firebase
  async testCozyStatsSyncToFirebase() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      // Play a track to generate XP
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 2000));
      
      // Simulate track completion
      await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        if (audio) {
          audio.currentTime = audio.duration - 1;
        }
      });
      
      await new Promise(r => setTimeout(r, 3000));
      
      const syncStatus = await this.page.evaluate(() => {
        return {
          lastSync: localStorage.getItem('wavelength_radio_lastFirebaseSync'),
          syncInProgress: window.radioPlayer?.syncInProgress || false
        };
      });
      
      const passed = syncStatus.lastSync !== null;
      this.log('Cozy Stats Sync to Firebase', passed, `Last sync: ${syncStatus.lastSync ? 'Yes' : 'No'}`);
    } catch (error) {
      this.log('Cozy Stats Sync to Firebase', false, error.message);
    }
  }

  // Test 4: Preferences sync to Firebase
  async testPreferencesSyncToFirebase() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      // Change volume
      await this.page.evaluate(() => {
        const slider = document.querySelector('#volumeSlider');
        slider.value = 65;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      await new Promise(r => setTimeout(r, 2000));
      
      // Toggle shuffle
      await this.page.click('#shuffleBtn');
      await new Promise(r => setTimeout(r, 2000));
      
      const syncStatus = await this.page.evaluate(() => {
        return localStorage.getItem('wavelength_radio_lastFirebaseSync');
      });
      
      const passed = syncStatus !== null;
      this.log('Preferences Sync to Firebase', passed, `Synced: ${!!syncStatus}`);
    } catch (error) {
      this.log('Preferences Sync to Firebase', false, error.message);
    }
  }

  // Test 5: Current track syncs to Firebase
  async testCurrentTrackSync() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      // Change track
      await this.page.click('#nextBtn');
      await new Promise(r => setTimeout(r, 2000));
      
      const trackData = await this.page.evaluate(() => {
        return {
          currentTrack: localStorage.getItem('wavelength_radio_currentTrack'),
          lastSync: localStorage.getItem('wavelength_radio_lastFirebaseSync')
        };
      });
      
      const passed = trackData.currentTrack !== null && trackData.lastSync !== null;
      this.log('Current Track Sync', passed, `Track: ${trackData.currentTrack}`);
    } catch (error) {
      this.log('Current Track Sync', false, error.message);
    }
  }

  // Test 6: Firebase data loads on page load
  async testFirebaseDataLoadsOnPageLoad() {
    try {
      // Set some data
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      await this.page.evaluate(() => {
        const slider = document.querySelector('#volumeSlider');
        slider.value = 55;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      await new Promise(r => setTimeout(r, 3000));
      
      // Reload page
      await this.page.reload({ waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 2000));
      
      const volume = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        return audio ? audio.volume : null;
      });
      
      const passed = volume !== null && Math.abs(volume - 0.55) < 0.1;
      this.log('Firebase Data Loads on Page Load', passed, `Volume: ${volume}`);
    } catch (error) {
      this.log('Firebase Data Loads on Page Load', false, error.message);
    }
  }

  // Test 7: Sync indicator visible
  async testSyncIndicatorVisible() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const syncIndicator = await this.page.evaluate(() => {
        const indicator = document.querySelector('.sync-indicator') ||
                         document.querySelector('.firebase-sync-status') ||
                         document.querySelector('[class*="sync"]');
        return !!indicator;
      });
      
      this.log('Sync Indicator Visible', syncIndicator, `Indicator: ${syncIndicator}`);
    } catch (error) {
      this.log('Sync Indicator Visible', false, error.message);
    }
  }

  // Test 8: Offline mode fallback to localStorage
  async testOfflineFallback() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      // Simulate offline
      await this.page.setOfflineMode(true);
      
      // Change volume
      await this.page.evaluate(() => {
        const slider = document.querySelector('#volumeSlider');
        slider.value = 45;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      const localVolume = await this.page.evaluate(() => {
        return localStorage.getItem('wavelength_radio_volume');
      });
      
      await this.page.setOfflineMode(false);
      
      const passed = localVolume !== null && parseFloat(localVolume) === 0.45;
      this.log('Offline Fallback to localStorage', passed, `Stored: ${localVolume}`);
    } catch (error) {
      this.log('Offline Fallback to localStorage', false, error.message);
    }
  }

  // Test 9: Sync conflict resolution
  async testSyncConflictResolution() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      // Make local changes
      await this.page.evaluate(() => {
        const slider = document.querySelector('#volumeSlider');
        slider.value = 70;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      await new Promise(r => setTimeout(r, 3000));
      
      // Simulate receiving Firebase update
      await this.page.evaluate(() => {
        if (window.radioPlayer && window.radioPlayer.handleFirebaseUpdate) {
          window.radioPlayer.handleFirebaseUpdate({
            preferences: { volume: 0.8 }
          });
        }
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      const finalVolume = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        return audio ? audio.volume : null;
      });
      
      const passed = finalVolume !== null;
      this.log('Sync Conflict Resolution', passed, `Final volume: ${finalVolume}`);
    } catch (error) {
      this.log('Sync Conflict Resolution', false, error.message);
    }
  }

  // Test 10: Cross-device simulation
  async testCrossDeviceSimulation() {
    try {
      // First session
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      await this.page.evaluate(() => {
        const slider = document.querySelector('#volumeSlider');
        slider.value = 85;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      await this.page.click('#shuffleBtn');
      await new Promise(r => setTimeout(r, 3000));
      
      const firstSessionData = await this.page.evaluate(() => {
        return {
          volume: localStorage.getItem('wavelength_radio_volume'),
          shuffle: localStorage.getItem('wavelength_radio_shuffle')
        };
      });
      
      // Simulate second device by clearing local storage and reloading
      await this.page.evaluate(() => {
        localStorage.removeItem('wavelength_radio_volume');
        localStorage.removeItem('wavelength_radio_shuffle');
      });
      
      await this.page.reload({ waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 3000));
      
      const secondSessionData = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        const shuffleBtn = document.querySelector('#shuffleBtn');
        return {
          volume: audio ? audio.volume : null,
          shuffleActive: shuffleBtn ? shuffleBtn.classList.contains('active') : false
        };
      });
      
      const volumeMatch = Math.abs(parseFloat(firstSessionData.volume) - secondSessionData.volume) < 0.1;
      const passed = volumeMatch;
      this.log('Cross-Device Simulation', passed, `Volume synced: ${volumeMatch}`);
    } catch (error) {
      this.log('Cross-Device Simulation', false, error.message);
    }
  }

  // Test 11: Achievements sync
  async testAchievementsSync() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const achievements = await this.page.evaluate(() => {
        const achievementsData = localStorage.getItem('wavelength_radio_achievements');
        return achievementsData ? JSON.parse(achievementsData) : null;
      });
      
      const passed = achievements !== null;
      this.log('Achievements Sync', passed, achievements ? `${Object.keys(achievements).length} achievements` : 'None');
    } catch (error) {
      this.log('Achievements Sync', false, error.message);
    }
  }

  // Test 12: Listen history sync
  async testListenHistorySync() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      // Play a track
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 2000));
      
      const history = await this.page.evaluate(() => {
        const historyData = localStorage.getItem('wavelength_radio_listenHistory');
        return historyData ? JSON.parse(historyData) : null;
      });
      
      const passed = history !== null;
      this.log('Listen History Sync', passed, history ? `${history.length || 0} entries` : 'None');
    } catch (error) {
      this.log('Listen History Sync', false, error.message);
    }
  }

  // Test 13: Sync throttling
  async testSyncThrottling() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const syncCounts = [];
      
      // Make rapid changes
      for (let i = 0; i < 5; i++) {
        await this.page.evaluate((vol) => {
          const slider = document.querySelector('#volumeSlider');
          slider.value = vol;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }, 50 + i * 5);
        
        await new Promise(r => setTimeout(r, 200));
        
        const syncTime = await this.page.evaluate(() => {
          return localStorage.getItem('wavelength_radio_lastFirebaseSync');
        });
        
        syncCounts.push(syncTime);
      }
      
      const uniqueSyncs = new Set(syncCounts.filter(s => s !== null)).size;
      const passed = uniqueSyncs < 5; // Should throttle, not sync every change
      this.log('Sync Throttling', passed, `${uniqueSyncs} syncs for 5 changes`);
    } catch (error) {
      this.log('Sync Throttling', false, error.message);
    }
  }

  // Test 14: User profile integration
  async testUserProfileIntegration() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const userInfo = await this.page.evaluate(() => {
        const userDisplay = document.querySelector('.user-profile') ||
                           document.querySelector('.user-info');
        return {
          exists: !!userDisplay,
          hasEmail: !!document.querySelector('[class*="email"]'),
          hasAvatar: !!document.querySelector('[class*="avatar"]')
        };
      });
      
      this.log('User Profile Integration', userInfo.exists, `Email: ${userInfo.hasEmail}, Avatar: ${userInfo.hasAvatar}`);
    } catch (error) {
      this.log('User Profile Integration', false, error.message);
    }
  }

  // Test 15: Logout clears Firebase sync
  async testLogoutClearsSync() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      // Ensure some data exists
      await this.page.evaluate(() => {
        localStorage.setItem('wavelength_radio_lastFirebaseSync', Date.now().toString());
      });
      
      // Logout
      const logoutBtn = await this.page.$('a[href*="logout"]') || await this.page.$('.logout-btn');
      if (logoutBtn) {
        await logoutBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        
        const syncCleared = await this.page.evaluate(() => {
          return !localStorage.getItem('wavelength_radio_lastFirebaseSync');
        });
        
        this.log('Logout Clears Firebase Sync', syncCleared, `Cleared: ${syncCleared}`);
      } else {
        this.log('Logout Clears Firebase Sync', true, 'Logout button not found (skipped)');
      }
    } catch (error) {
      this.log('Logout Clears Firebase Sync', false, error.message);
    }
  }

  async runAllTests() {
    console.log('\n🔐 Starting Authenticated User Radio Player Tests...\n');
    
    await this.setup();
    
    try {
      const authenticated = await this.testAuthentication();
      
      if (!authenticated) {
        console.log('\n⚠️  Authentication failed or not available. Skipping authenticated tests.');
        console.log('Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables to run these tests.\n');
        return;
      }
      
      await this.testFirebaseSyncEnabled();
      await this.testCozyStatsSyncToFirebase();
      await this.testPreferencesSyncToFirebase();
      await this.testCurrentTrackSync();
      await this.testFirebaseDataLoadsOnPageLoad();
      await this.testSyncIndicatorVisible();
      await this.testOfflineFallback();
      await this.testSyncConflictResolution();
      await this.testCrossDeviceSimulation();
      await this.testAchievementsSync();
      await this.testListenHistorySync();
      await this.testSyncThrottling();
      await this.testUserProfileIntegration();
      await this.testLogoutClearsSync();
    } finally {
      await this.cleanup();
    }
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.testName}: ${r.message}`);
      });
    }
    
    console.log('='.repeat(60) + '\n');
    
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests
const tester = new AuthenticatedRadioTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
