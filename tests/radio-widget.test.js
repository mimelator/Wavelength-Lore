/**
 * Radio Widget Test Suite
 * Tests radio widget functionality across different pages
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

class RadioWidgetTester {
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

  async clearLocalStorage() {
    try {
      await this.page.evaluate(() => {
        localStorage.clear();
      });
    } catch (e) {
      // localStorage may not be accessible
    }
  }

  log(testName, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
    this.results.push({ testName, passed, message });
  }

  // Test 1: Widget present on home page
  async testWidgetOnHomePage() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      await this.clearLocalStorage();
      
      const widget = await this.page.evaluate(() => {
        const w = document.querySelector('#globalRadioGame') || document.querySelector('.global-radio-game');
        return {
          exists: !!w,
          visible: w ? w.offsetParent !== null : false
        };
      });
      
      this.log('Widget on Home Page', widget.exists, `Visible: ${widget.visible}`);
    } catch (error) {
      this.log('Widget on Home Page', false, error.message);
    }
  }

  // Test 2: Widget present on characters page
  async testWidgetOnCharactersPage() {
    try {
      await this.page.goto(`${BASE_URL}/characters`, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const widget = await this.page.evaluate(() => {
        const w = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
        return {
          exists: !!w,
          visible: w ? w.offsetParent !== null : false
        };
      });
      
      this.log('Widget on Characters Page', widget.exists, `Visible: ${widget.visible}`);
    } catch (error) {
      this.log('Widget on Characters Page', false, error.message);
    }
  }

  // Test 3: Widget present on lore page
  async testWidgetOnLorePage() {
    try {
      await this.page.goto(`${BASE_URL}/lore`, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const widget = await this.page.evaluate(() => {
        const w = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
        return {
          exists: !!w,
          visible: w ? w.offsetParent !== null : false
        };
      });
      
      this.log('Widget on Lore Page', widget.exists, `Visible: ${widget.visible}`);
    } catch (error) {
      this.log('Widget on Lore Page', false, error.message);
    }
  }

  // Test 4: Widget toggle functionality
  async testWidgetToggle() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const toggleBtn = await this.page.$('#radioGameToggle') || await this.page.$('#radioGameToggle');
      if (toggleBtn) {
        const initialState = await this.page.evaluate(() => {
          const w = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
          return w ? w.classList.contains('expanded') || w.classList.contains('open') : false;
        });
        
        await toggleBtn.click();
        await new Promise(r => setTimeout(r, 500));
        
        const newState = await this.page.evaluate(() => {
          const w = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
          return w ? w.classList.contains('expanded') || w.classList.contains('open') : false;
        });
        
        const passed = initialState !== newState;
        this.log('Widget Toggle', passed, `${initialState} -> ${newState}`);
      } else {
        this.log('Widget Toggle', false, 'Toggle button not found');
      }
    } catch (error) {
      this.log('Widget Toggle', false, error.message);
    }
  }

  // Test 5: Widget play/pause
  async testWidgetPlayPause() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const playBtn = await this.page.$('.radio-widget .play-pause-btn') || 
                      await this.page.$('#globalPlayBtn');
      
      if (playBtn) {
        await playBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        
        const isPlaying = await this.page.evaluate(() => {
          const audio = document.querySelector('audio');
          return audio && !audio.paused;
        });
        
        this.log('Widget Play/Pause', isPlaying, `Playing: ${isPlaying}`);
      } else {
        this.log('Widget Play/Pause', false, 'Play button not found');
      }
    } catch (error) {
      this.log('Widget Play/Pause', false, error.message);
    }
  }

  // Test 6: Widget displays current track
  async testWidgetTrackDisplay() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const trackInfo = await this.page.evaluate(() => {
        const widget = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
        if (!widget) return null;
        
        const title = widget.querySelector('.track-title') || widget.querySelector('#globalTrackTitle');
        return {
          hasTitle: !!title,
          titleText: title ? title.textContent : ''
        };
      });
      
      const passed = trackInfo && trackInfo.hasTitle && trackInfo.titleText.length > 0;
      this.log('Widget Track Display', passed, trackInfo ? trackInfo.titleText.substring(0, 30) : 'Not found');
    } catch (error) {
      this.log('Widget Track Display', false, error.message);
    }
  }

  // Test 7: Widget state persists across navigation
  async testWidgetStatePersistence() {
    try {
      await this.clearLocalStorage();
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      // Start playing
      const playBtn = await this.page.$('.radio-widget .play-pause-btn') || 
                      await this.page.$('#globalPlayBtn');
      
      if (playBtn) {
        await playBtn.click();
        await new Promise(r => setTimeout(r, 1500));
        
        const trackBefore = await this.page.evaluate(() => {
          return document.querySelector('.radio-widget .track-title')?.textContent ||
                 document.querySelector('#globalTrackTitle')?.textContent;
        });
        
        // Navigate to another page
        await this.page.goto(`${BASE_URL}/characters`, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
        await new Promise(r => setTimeout(r, 1000));
        
        const trackAfter = await this.page.evaluate(() => {
          return document.querySelector('.radio-widget .track-title')?.textContent ||
                 document.querySelector('#globalTrackTitle')?.textContent;
        });
        
        const isStillPlaying = await this.page.evaluate(() => {
          const audio = document.querySelector('audio');
          return audio && !audio.paused;
        });
        
        const passed = trackBefore === trackAfter && isStillPlaying;
        this.log('Widget State Persistence', passed, `Playing: ${isStillPlaying}, Track maintained: ${trackBefore === trackAfter}`);
      } else {
        this.log('Widget State Persistence', false, 'Play button not found');
      }
    } catch (error) {
      this.log('Widget State Persistence', false, error.message);
    }
  }

  // Test 8: Widget next track across pages
  async testWidgetNextTrackAcrossPages() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const trackBefore = await this.page.evaluate(() => {
        return document.querySelector('.radio-widget .track-title')?.textContent ||
               document.querySelector('#globalTrackTitle')?.textContent;
      });
      
      const nextBtn = await this.page.$('.radio-widget .next-btn') || 
                      await this.page.$('#globalNextBtn');
      
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        
        // Navigate to another page
        await this.page.goto(`${BASE_URL}/lore`, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
        await new Promise(r => setTimeout(r, 1000));
        
        const trackAfter = await this.page.evaluate(() => {
          return document.querySelector('.radio-widget .track-title')?.textContent ||
                 document.querySelector('#globalTrackTitle')?.textContent;
        });
        
        const passed = trackBefore !== trackAfter;
        this.log('Widget Next Track Across Pages', passed, `Track changed: ${trackBefore !== trackAfter}`);
      } else {
        this.log('Widget Next Track Across Pages', false, 'Next button not found');
      }
    } catch (error) {
      this.log('Widget Next Track Across Pages', false, error.message);
    }
  }

  // Test 9: Widget link to full player
  async testWidgetLinkToFullPlayer() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const radioLink = await this.page.$('.radio-widget a[href*="radio"]') ||
                        await this.page.$('.widget-expand-btn');
      
      if (radioLink) {
        await radioLink.click();
        await new Promise(r => setTimeout(r, 2000));
        
        const currentUrl = this.page.url();
        const passed = currentUrl.includes('/radio');
        this.log('Widget Link to Full Player', passed, `URL: ${currentUrl}`);
      } else {
        this.log('Widget Link to Full Player', false, 'Radio link not found');
      }
    } catch (error) {
      this.log('Widget Link to Full Player', false, error.message);
    }
  }

  // Test 10: Widget volume control
  async testWidgetVolumeControl() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const volumeSlider = await this.page.$('.radio-widget .volume-slider') ||
                           await this.page.$('#globalVolumeSlider');
      
      if (volumeSlider) {
        await this.page.evaluate(() => {
          const slider = document.querySelector('.radio-widget .volume-slider') ||
                        document.querySelector('#globalVolumeSlider');
          if (slider) {
            slider.value = 40;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        
        await new Promise(r => setTimeout(r, 500));
        
        const volume = await this.page.evaluate(() => {
          const audio = document.querySelector('audio');
          return audio ? audio.volume : null;
        });
        
        const passed = volume !== null && Math.abs(volume - 0.4) < 0.01;
        this.log('Widget Volume Control', passed, `Volume: ${volume}`);
      } else {
        this.log('Widget Volume Control', true, 'Volume control not in widget (optional)');
      }
    } catch (error) {
      this.log('Widget Volume Control', false, error.message);
    }
  }

  // Test 11: Widget not on radio page
  async testWidgetNotOnRadioPage() {
    try {
      await this.page.goto(`${BASE_URL}/radio`, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const widget = await this.page.evaluate(() => {
        const w = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
        return w ? w.offsetParent !== null : false;
      });
      
      const passed = !widget;
      this.log('Widget Not on Radio Page', passed, `Widget hidden: ${!widget}`);
    } catch (error) {
      this.log('Widget Not on Radio Page', false, error.message);
    }
  }

  // Test 12: Widget minimized state persists
  async testWidgetMinimizedStatePersists() {
    try {
      await this.clearLocalStorage();
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const toggleBtn = await this.page.$('#radioGameToggle') || await this.page.$('#radioGameToggle');
      if (toggleBtn) {
        // Minimize widget
        await toggleBtn.click();
        await new Promise(r => setTimeout(r, 500));
        
        const minimizedState = await this.page.evaluate(() => {
          const w = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
          return w ? w.classList.contains('minimized') || !w.classList.contains('expanded') : false;
        });
        
        // Navigate to another page
        await this.page.goto(`${BASE_URL}/characters`, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
        await new Promise(r => setTimeout(r, 1000));
        
        const stillMinimized = await this.page.evaluate(() => {
          const w = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
          return w ? w.classList.contains('minimized') || !w.classList.contains('expanded') : false;
        });
        
        const passed = minimizedState && stillMinimized;
        this.log('Widget Minimized State Persists', passed, `Minimized: ${minimizedState} -> ${stillMinimized}`);
      } else {
        this.log('Widget Minimized State Persists', true, 'Toggle not found (optional feature)');
      }
    } catch (error) {
      this.log('Widget Minimized State Persists', false, error.message);
    }
  }

  // Test 13: Widget audio element shared
  async testWidgetAudioElementShared() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const audioCount = await this.page.evaluate(() => {
        return document.querySelectorAll('audio').length;
      });
      
      const passed = audioCount === 1;
      this.log('Widget Audio Element Shared', passed, `Audio elements: ${audioCount}`);
    } catch (error) {
      this.log('Widget Audio Element Shared', false, error.message);
    }
  }

  // Test 14: Widget progress indicator
  async testWidgetProgressIndicator() {
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const playBtn = await this.page.$('.radio-widget .play-pause-btn') || 
                      await this.page.$('#globalPlayBtn');
      
      if (playBtn) {
        await playBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        
        const hasProgress = await this.page.evaluate(() => {
          const widget = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
          if (!widget) return false;
          
          const progressBar = widget.querySelector('.progress-bar') || 
                            widget.querySelector('.widget-progress');
          return !!progressBar;
        });
        
        this.log('Widget Progress Indicator', hasProgress, `Progress bar: ${hasProgress}`);
      } else {
        this.log('Widget Progress Indicator', false, 'Play button not found');
      }
    } catch (error) {
      this.log('Widget Progress Indicator', false, error.message);
    }
  }

  // Test 15: Widget responsive on mobile viewport
  async testWidgetResponsive() {
    try {
      await this.page.setViewport({ width: 375, height: 667 }); // iPhone size
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      
      const widget = await this.page.evaluate(() => {
        const w = document.querySelector('#globalRadioGame') || document.querySelector('#globalRadioGame');
        if (!w) return null;
        
        const rect = w.getBoundingClientRect();
        return {
          exists: true,
          width: rect.width,
          fitsScreen: rect.width <= window.innerWidth
        };
      });
      
      const passed = widget && widget.exists && widget.fitsScreen;
      this.log('Widget Responsive Mobile', passed, widget ? `Width: ${widget.width}px` : 'Not found');
      
      // Reset viewport
      await this.page.setViewport({ width: 1280, height: 800 });
    } catch (error) {
      this.log('Widget Responsive Mobile', false, error.message);
    }
  }

  async runAllTests() {
    console.log('\n📻 Starting Radio Widget Tests...\n');
    
    await this.setup();
    
    try {
      await this.testWidgetOnHomePage();
      await this.testWidgetOnCharactersPage();
      await this.testWidgetOnLorePage();
      await this.testWidgetToggle();
      await this.testWidgetPlayPause();
      await this.testWidgetTrackDisplay();
      await this.testWidgetStatePersistence();
      await this.testWidgetNextTrackAcrossPages();
      await this.testWidgetLinkToFullPlayer();
      await this.testWidgetVolumeControl();
      await this.testWidgetNotOnRadioPage();
      await this.testWidgetMinimizedStatePersists();
      await this.testWidgetAudioElementShared();
      await this.testWidgetProgressIndicator();
      await this.testWidgetResponsive();
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
const tester = new RadioWidgetTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
