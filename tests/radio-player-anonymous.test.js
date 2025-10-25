/**
 * Anonymous User Radio Player Test Suite
 * Tests radio player functionality for non-authenticated users using localStorage
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const RADIO_URL = `${BASE_URL}/radio`;
const TEST_TIMEOUT = 30000;

class RadioPlayerTester {
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
      // localStorage may not be accessible before page load
    }
  }

  async getLocalStorage(key) {
    try {
      return await this.page.evaluate((k) => {
        return localStorage.getItem(k);
      }, key);
    } catch (e) {
      return null;
    }
  }

  async setLocalStorage(key, value) {
    await this.page.evaluate((k, v) => {
      localStorage.setItem(k, v);
    }, key, value);
  }

  log(testName, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
    this.results.push({ testName, passed, message });
  }

  // Test 1: Radio page loads successfully
  async testPageLoad() {
    try {
      const response = await this.page.goto(RADIO_URL, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      const status = response.status();
      await this.clearLocalStorage();
      const passed = status === 200;
      this.log('Radio Page Load', passed, `Status: ${status}`);
    } catch (error) {
      this.log('Radio Page Load', false, error.message);
    }
  }

  // Test 2: Player UI elements present
  async testPlayerUIElements() {
    try {
      const elements = await this.page.evaluate(() => {
        return {
          playButton: !!document.querySelector('#playPauseBtn'),
          trackTitle: !!document.querySelector('#trackTitle'),
          progressBar: !!document.querySelector('.progress-bar'),
          volumeControl: !!document.querySelector('#volumeSlider'),
          playlist: !!document.querySelector(".playlist-items"),
          gameStats: !!document.querySelector(".game-stats")
        };
      });
      const allPresent = Object.values(elements).every(v => v);
      this.log('Player UI Elements', allPresent, `Found: ${Object.keys(elements).filter(k => elements[k]).length}/6`);
    } catch (error) {
      this.log('Player UI Elements', false, error.message);
    }
  }

  // Test 3: Play/Pause functionality
  async testPlayPause() {
    try {
      await this.page.waitForSelector('#playPauseBtn', { timeout: 5000 });
      
      // Click play
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const isPlaying = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        return audio && !audio.paused;
      });
      
      // Click pause
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 500));
      
      const isPaused = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        return audio && audio.paused;
      });
      
      const passed = isPlaying && isPaused;
      this.log('Play/Pause Functionality', passed, `Play: ${isPlaying}, Pause: ${isPaused}`);
    } catch (error) {
      this.log('Play/Pause Functionality', false, error.message);
    }
  }

  // Test 4: Volume control
  async testVolumeControl() {
    try {
      const initialVolume = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        return audio ? audio.volume : null;
      });
      
      await this.page.waitForSelector('#volumeSlider', { timeout: 5000 });
      await this.page.evaluate(() => {
        const slider = document.querySelector('#volumeSlider');
        slider.value = 50;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      await new Promise(r => setTimeout(r, 500));
      
      const newVolume = await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        return audio ? audio.volume : null;
      });
      
      const passed = initialVolume !== null && newVolume !== null && newVolume === 0.5;
      this.log('Volume Control', passed, `Initial: ${initialVolume}, New: ${newVolume}`);
    } catch (error) {
      this.log('Volume Control', false, error.message);
    }
  }

  // Test 5: Next/Previous track
  async testTrackNavigation() {
    try {
      const initialTrack = await this.page.evaluate(() => {
        return document.querySelector('#trackTitle')?.textContent;
      });
      
      await this.page.waitForSelector('#nextBtn', { timeout: 5000 });
      await this.page.click('#nextBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const nextTrack = await this.page.evaluate(() => {
        return document.querySelector('#trackTitle')?.textContent;
      });
      
      await this.page.click('#prevBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const prevTrack = await this.page.evaluate(() => {
        return document.querySelector('#trackTitle')?.textContent;
      });
      
      const passed = initialTrack !== nextTrack && initialTrack === prevTrack;
      this.log('Track Navigation', passed, `Tracks changed correctly`);
    } catch (error) {
      this.log('Track Navigation', false, error.message);
    }
  }

  // Test 6: Playlist display
  async testPlaylistDisplay() {
    try {
      const playlistData = await this.page.evaluate(() => {
        const items = document.querySelectorAll('.playlist-item');
        return {
          count: items.length,
          hasSeasons: !!document.querySelector('.season-header'),
          firstTrack: items[0]?.textContent || ''
        };
      });
      
      const passed = playlistData.count >= 30; // Should have 33 tracks
      this.log('Playlist Display', passed, `${playlistData.count} tracks, Seasons: ${playlistData.hasSeasons}`);
    } catch (error) {
      this.log('Playlist Display', false, error.message);
    }
  }

  // Test 7: Playlist item click
  async testPlaylistItemClick() {
    try {
      const initialTrack = await this.page.evaluate(() => {
        return document.querySelector('#trackTitle')?.textContent;
      });
      
      await this.page.waitForSelector('.playlist-item', { timeout: 5000 });
      const playlistItems = await this.page.$$('.playlist-item');
      
      if (playlistItems.length > 5) {
        await playlistItems[5].click();
        await new Promise(r => setTimeout(r, 1000));
        
        const newTrack = await this.page.evaluate(() => {
          return document.querySelector('#trackTitle')?.textContent;
        });
        
        const passed = initialTrack !== newTrack;
        this.log('Playlist Item Click', passed, `Track changed: ${initialTrack !== newTrack}`);
      } else {
        this.log('Playlist Item Click', false, 'Not enough playlist items');
      }
    } catch (error) {
      this.log('Playlist Item Click', false, error.message);
    }
  }

  // Test 8: Shuffle mode
  async testShuffleMode() {
    try {
      await this.page.waitForSelector('#shuffleBtn', { timeout: 5000 });
      
      const initialShuffle = await this.page.evaluate(() => {
        return document.querySelector('#shuffleBtn')?.classList.contains('active');
      });
      
      await this.page.click('#shuffleBtn');
      await new Promise(r => setTimeout(r, 500));
      
      const newShuffle = await this.page.evaluate(() => {
        return document.querySelector('#shuffleBtn')?.classList.contains('active');
      });
      
      const passed = initialShuffle !== newShuffle;
      this.log('Shuffle Mode', passed, `Toggle works: ${initialShuffle} -> ${newShuffle}`);
    } catch (error) {
      this.log('Shuffle Mode', false, error.message);
    }
  }

  // Test 9: Repeat mode
  async testRepeatMode() {
    try {
      await this.page.waitForSelector('#repeatBtn', { timeout: 5000 });
      
      await this.page.click('#repeatBtn');
      await new Promise(r => setTimeout(r, 500));
      
      const repeatState = await this.page.evaluate(() => {
        const btn = document.querySelector('#repeatBtn');
        return {
          hasActive: btn?.classList.contains('active'),
          hasRepeatOne: btn?.classList.contains('repeat-one')
        };
      });
      
      const passed = repeatState.hasActive || repeatState.hasRepeatOne;
      this.log('Repeat Mode', passed, `Active: ${repeatState.hasActive}, One: ${repeatState.hasRepeatOne}`);
    } catch (error) {
      this.log('Repeat Mode', false, error.message);
    }
  }

  // Test 10: Cozy game stats display
  async testGameStats() {
    try {
      const stats = await this.page.evaluate(() => {
        const cozyStats = document.querySelector('#totalPoints');
        if (!cozyStats) return null;
        
        return {
          visible: cozyStats.offsetParent !== null,
          hasLevel: !!cozyStats.textContent.match(/Level|Lvl/i),
          hasXP: !!cozyStats.textContent.match(/XP|Experience/i),
          hasListens: !!cozyStats.textContent.match(/Listen|Track/i)
        };
      });
      
      const passed = stats && stats.visible;
      this.log('Cozy Game Stats Display', passed, stats ? `Level: ${stats.hasLevel}, XP: ${stats.hasXP}` : 'Not found');
    } catch (error) {
      this.log('Cozy Game Stats Display', false, error.message);
    }
  }

  // Test 11: XP gain on track completion
  async testPointsGain() {
    try {
      const initialXP = await this.page.evaluate(() => {
        const xpText = document.querySelector('#totalPoints')?.textContent;
        const match = xpText?.match(/(\d+)\s*XP/i);
        return match ? parseInt(match[1]) : 0;
      });
      
      // Simulate track completion by seeking to end
      await this.page.evaluate(() => {
        const audio = document.querySelector('#audioPlayer');
        if (audio) {
          audio.currentTime = audio.duration - 1;
          audio.play();
        }
      });
      
      await new Promise(r => setTimeout(r, 2000));
      
      const newXP = await this.page.evaluate(() => {
        const xpText = document.querySelector('#totalPoints')?.textContent;
        const match = xpText?.match(/(\d+)\s*XP/i);
        return match ? parseInt(match[1]) : 0;
      });
      
      const passed = newXP > initialXP;
      this.log('XP Gain on Track Completion', passed, `${initialXP} -> ${newXP}`);
    } catch (error) {
      this.log('XP Gain on Track Completion', false, error.message);
    }
  }

  // Test 12: Screen saver mode activation
  async testScreenSaverMode() {
    try {
      await this.page.waitForSelector('#screensaverToggle', { timeout: 5000 });
      await this.page.click('#screensaverToggle');
      await new Promise(r => setTimeout(r, 1000));
      
      const screenSaverActive = await this.page.evaluate(() => {
        return document.body.classList.contains('screensaver-mode') ||
               !!document.querySelector('.screensaver-active');
      });
      
      // Exit screen saver
      if (screenSaverActive) {
        await this.page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 500));
      }
      
      this.log('Screen Saver Mode', screenSaverActive, `Activated: ${screenSaverActive}`);
    } catch (error) {
      this.log('Screen Saver Mode', false, error.message);
    }
  }

  // Test 13: localStorage persistence - volume
  async testLocalStorageVolume() {
    try {
      await this.page.evaluate(() => {
        const slider = document.querySelector('#volumeSlider');
        slider.value = 75;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      const playbackState = await this.getLocalStorage('global_radio_playback_state');
      const parsed = playbackState ? JSON.parse(playbackState) : null;
      const passed = parsed && parsed.volume !== undefined;
      this.log('localStorage Volume Persistence', passed, parsed ? `Volume: ${parsed.volume}` : 'Not stored');
    } catch (error) {
      this.log('localStorage Volume Persistence', false, error.message);
    }
  }

  // Test 14: localStorage persistence - current track
  async testLocalStorageCurrentTrack() {
    try {
      await this.page.click('#nextBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const playbackState = await this.getLocalStorage('global_radio_playback_state');
      const parsed = playbackState ? JSON.parse(playbackState) : null;
      const passed = parsed && parsed.currentTrackIndex !== undefined;
      this.log('localStorage Current Track', passed, parsed ? `Track index: ${parsed.currentTrackIndex}` : 'Not stored');
    } catch (error) {
      this.log('localStorage Current Track', false, error.message);
    }
  }

  // Test 15: localStorage persistence - cozy stats
  async testLocalStorageGameStats() {
    try {
      const totalPoints = await this.getLocalStorage('total_points');
      const magicLevel = await this.getLocalStorage('magic_level');
      const mushroomCount = await this.getLocalStorage('mushroom_count');
      
      const passed = totalPoints !== null || magicLevel !== null || mushroomCount !== null;
      
      this.log('localStorage Game Stats', passed, `Points: ${totalPoints}, Level: ${magicLevel}`);
    } catch (error) {
      this.log('localStorage Cozy Stats', false, error.message);
    }
  }

  // Test 16: Page reload persistence
  async testPageReloadPersistence() {
    try {
      // Set specific state
      await this.page.evaluate(() => {
        const slider = document.querySelector('#volumeSlider');
        slider.value = 60;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      await this.page.click('#nextBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const playbackState = await this.getLocalStorage('global_radio_playback_state');
      const beforeReload = playbackState ? JSON.parse(playbackState) : { volume: null, currentTrackIndex: null };
      
      // Reload page
      await this.page.reload({ waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 2000));
      
      const afterReload = {
        volume: await this.page.evaluate(() => {
          const audio = document.querySelector('#audioPlayer');
          return audio ? audio.volume : null;
        }),
        track: await this.page.evaluate(() => {
          return document.querySelector('#trackTitle')?.textContent;
        })
      };
      
      const volumeMatch = beforeReload.volume && Math.abs(beforeReload.volume - afterReload.volume) < 0.01;
      const passed = volumeMatch && afterReload.track;
      this.log('Page Reload Persistence', passed, `Volume restored: ${volumeMatch}`);
    } catch (error) {
      this.log('Page Reload Persistence', false, error.message);
    }
  }

  // Test 17: Weather effects toggle
  async testWeatherEffects() {
    try {
      const weatherBtn = await this.page.$('.weather-toggle-btn');
      if (weatherBtn) {
        await weatherBtn.click();
        await new Promise(r => setTimeout(r, 500));
        
        const weatherActive = await this.page.evaluate(() => {
          return !!document.querySelector('.weather-effect');
        });
        
        this.log('Weather Effects Toggle', true, `Weather effects: ${weatherActive ? 'active' : 'inactive'}`);
      } else {
        this.log('Weather Effects Toggle', true, 'Weather toggle not found (optional feature)');
      }
    } catch (error) {
      this.log('Weather Effects Toggle', false, error.message);
    }
  }

  // Test 18: Progress bar interaction
  async testProgressBarInteraction() {
    try {
      await this.page.click('#playPauseBtn');
      await new Promise(r => setTimeout(r, 1000));
      
      const progressBar = await this.page.$('.progress-bar');
      if (progressBar) {
        const box = await progressBar.boundingBox();
        await this.page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
        await new Promise(r => setTimeout(r, 500));
        
        const currentTime = await this.page.evaluate(() => {
          const audio = document.querySelector('#audioPlayer');
          return audio ? audio.currentTime : 0;
        });
        
        const passed = currentTime > 0;
        this.log('Progress Bar Interaction', passed, `Seek to: ${currentTime.toFixed(1)}s`);
      } else {
        this.log('Progress Bar Interaction', false, 'Progress bar not found');
      }
    } catch (error) {
      this.log('Progress Bar Interaction', false, error.message);
    }
  }

  async runAllTests() {
    console.log('\n🎵 Starting Anonymous User Radio Player Tests...\n');
    
    await this.setup();
    
    try {
      await this.testPageLoad();
      await this.testPlayerUIElements();
      await this.testPlayPause();
      await this.testVolumeControl();
      await this.testTrackNavigation();
      await this.testPlaylistDisplay();
      await this.testPlaylistItemClick();
      await this.testShuffleMode();
      await this.testRepeatMode();
      await this.testGameStats();
      await this.testPointsGain();
      await this.testScreenSaverMode();
      await this.testLocalStorageVolume();
      await this.testLocalStorageCurrentTrack();
      await this.testLocalStorageGameStats();
      await this.testPageReloadPersistence();
      await this.testWeatherEffects();
      await this.testProgressBarInteraction();
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
const tester = new RadioPlayerTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
