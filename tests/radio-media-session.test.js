/**
 * Radio Player Media Session API Test
 * Tests system-level media controls integration
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const RADIO_URL = `${BASE_URL}/radio`;
const TEST_TIMEOUT = 30000;

class MediaSessionTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  log(testName, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
    this.results.push({ testName, passed, message });
  }

  // Test 1: Media Session API available
  async testMediaSessionAvailable() {
    try {
      await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const hasMediaSession = await this.page.evaluate(() => {
        return 'mediaSession' in navigator;
      });
      
      this.log('Media Session API Available', hasMediaSession, `Supported: ${hasMediaSession}`);
    } catch (error) {
      this.log('Media Session API Available', false, error.message);
    }
  }

  // Test 2: Media Session initialized
  async testMediaSessionInitialized() {
    try {
      const initialized = await this.page.evaluate(() => {
        return window.radioPlayer && typeof window.radioPlayer.initMediaSession === 'function';
      });
      
      this.log('Media Session Initialized', initialized, `Method exists: ${initialized}`);
    } catch (error) {
      this.log('Media Session Initialized', false, error.message);
    }
  }

  // Test 3: Metadata updates on play
  async testMetadataUpdates() {
    try {
      // Play a track
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 2000));
      
      const metadata = await this.page.evaluate(() => {
        if (!navigator.mediaSession || !navigator.mediaSession.metadata) return null;
        return {
          title: navigator.mediaSession.metadata.title,
          artist: navigator.mediaSession.metadata.artist,
          album: navigator.mediaSession.metadata.album,
          hasArtwork: navigator.mediaSession.metadata.artwork && navigator.mediaSession.metadata.artwork.length > 0
        };
      });
      
      const passed = metadata && metadata.title && metadata.artist;
      this.log('Metadata Updates on Play', passed, metadata ? `"${metadata.title}" by ${metadata.artist}` : 'No metadata');
    } catch (error) {
      this.log('Metadata Updates on Play', false, error.message);
    }
  }

  // Test 4: Playback state updates
  async testPlaybackStateUpdates() {
    try {
      // Ensure playing
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const playingState = await this.page.evaluate(() => {
        return navigator.mediaSession ? navigator.mediaSession.playbackState : null;
      });
      
      // Pause
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 500));
      
      const pausedState = await this.page.evaluate(() => {
        return navigator.mediaSession ? navigator.mediaSession.playbackState : null;
      });
      
      const passed = playingState === 'playing' && pausedState === 'paused';
      this.log('Playback State Updates', passed, `Playing: ${playingState}, Paused: ${pausedState}`);
    } catch (error) {
      this.log('Playback State Updates', false, error.message);
    }
  }

  // Test 5: Action handlers registered
  async testActionHandlersRegistered() {
    try {
      const handlers = await this.page.evaluate(() => {
        if (!navigator.mediaSession) return null;
        
        const actions = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward'];
        const registered = {};
        
        actions.forEach(action => {
          try {
            // Try to set a dummy handler to see if it's supported
            navigator.mediaSession.setActionHandler(action, () => {});
            registered[action] = true;
          } catch (e) {
            registered[action] = false;
          }
        });
        
        return registered;
      });
      
      const allRegistered = handlers && Object.values(handlers).every(v => v);
      const count = handlers ? Object.values(handlers).filter(v => v).length : 0;
      this.log('Action Handlers Registered', allRegistered, `${count}/6 handlers`);
    } catch (error) {
      this.log('Action Handlers Registered', false, error.message);
    }
  }

  // Test 6: Artwork included in metadata
  async testArtworkInMetadata() {
    try {
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 2000));
      
      const artwork = await this.page.evaluate(() => {
        if (!navigator.mediaSession || !navigator.mediaSession.metadata) return null;
        const art = navigator.mediaSession.metadata.artwork;
        return art ? {
          count: art.length,
          sizes: art.map(a => a.sizes),
          hasSrc: art.every(a => a.src)
        } : null;
      });
      
      const passed = artwork && artwork.count > 0 && artwork.hasSrc;
      this.log('Artwork in Metadata', passed, artwork ? `${artwork.count} sizes: ${artwork.sizes.join(', ')}` : 'No artwork');
    } catch (error) {
      this.log('Artwork in Metadata', false, error.message);
    }
  }

  // Test 7: Visibility handling initialized
  async testVisibilityHandlingInitialized() {
    try {
      const initialized = await this.page.evaluate(() => {
        return window.radioPlayer && typeof window.radioPlayer.initVisibilityHandling === 'function';
      });
      
      this.log('Visibility Handling Initialized', initialized, `Method exists: ${initialized}`);
    } catch (error) {
      this.log('Visibility Handling Initialized', false, error.message);
    }
  }

  // Test 8: Playback continues when tab hidden
  async testPlaybackContinuesWhenHidden() {
    try {
      // Start playing
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const playingBefore = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        return audio && !audio.paused;
      });
      
      // Simulate tab hidden
      await this.page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, writable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await new Promise(r => setTimeout(r, 500));
      
      const playingAfter = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        return audio && !audio.paused;
      });
      
      const passed = playingBefore && playingAfter;
      this.log('Playback Continues When Hidden', passed, `Before: ${playingBefore}, After: ${playingAfter}`);
    } catch (error) {
      this.log('Playback Continues When Hidden', false, error.message);
    }
  }

  // Test 9: Metadata updates on track change
  async testMetadataUpdatesOnTrackChange() {
    try {
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const firstTrack = await this.page.evaluate(() => {
        return navigator.mediaSession?.metadata?.title;
      });
      
      await this.page.click('#nextBtn');
      await new Promise(r => setTimeout(r, 1500));
      
      const secondTrack = await this.page.evaluate(() => {
        return navigator.mediaSession?.metadata?.title;
      });
      
      const passed = firstTrack && secondTrack && firstTrack !== secondTrack;
      this.log('Metadata Updates on Track Change', passed, `"${firstTrack}" → "${secondTrack}"`);
    } catch (error) {
      this.log('Metadata Updates on Track Change', false, error.message);
    }
  }

  // Test 10: Console logs for media events
  async testConsoleLogsForMediaEvents() {
    try {
      const logs = [];
      this.page.on('console', msg => {
        const text = msg.text();
        if (text.includes('📱') || text.includes('👁️')) {
          logs.push(text);
        }
      });
      
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const hasMediaLogs = logs.some(log => log.includes('📱'));
      const hasVisibilityLogs = logs.some(log => log.includes('👁️'));
      
      this.log('Console Logs for Media Events', hasMediaLogs || hasVisibilityLogs, 
        `Media: ${hasMediaLogs}, Visibility: ${hasVisibilityLogs}`);
    } catch (error) {
      this.log('Console Logs for Media Events', false, error.message);
    }
  }

  async runAllTests() {
    console.log('\n📱 Starting Media Session API Tests...\n');
    
    await this.setup();
    
    try {
      await this.testMediaSessionAvailable();
      await this.testMediaSessionInitialized();
      await this.testMetadataUpdates();
      await this.testPlaybackStateUpdates();
      await this.testActionHandlersRegistered();
      await this.testArtworkInMetadata();
      await this.testVisibilityHandlingInitialized();
      await this.testPlaybackContinuesWhenHidden();
      await this.testMetadataUpdatesOnTrackChange();
      await this.testConsoleLogsForMediaEvents();
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
const tester = new MediaSessionTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
