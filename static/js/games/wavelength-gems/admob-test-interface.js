/**
 * AdMob Test Interface
 * This file adds testing buttons to the game to test different ad types
 * REMOVE THIS FILE BEFORE PRODUCTION
 */

document.addEventListener('DOMContentLoaded', () => {
  // Wait for game to initialize
  setTimeout(() => {
    // Create test panel
    const testPanel = document.createElement('div');
    testPanel.id = 'ad-test-panel';
    testPanel.style.position = 'fixed';
    testPanel.style.top = '10px';  // Changed from bottom to top
    testPanel.style.left = '10px'; // Changed from right to left
    testPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    testPanel.style.padding = '10px';
    testPanel.style.borderRadius = '5px';
    testPanel.style.zIndex = '1'; // Lowered from 9999 to allow game interaction
    testPanel.style.color = 'white';
    testPanel.style.fontFamily = 'Arial, sans-serif';
    testPanel.style.fontSize = '14px';
    
    testPanel.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">AdMob Test Panel</div>
      <button id="test-interstitial" style="display: block; margin: 5px 0; padding: 5px; width: 100%;">Test Interstitial Ad</button>
      <button id="test-extra-life" style="display: block; margin: 5px 0; padding: 5px; width: 100%;">Test Extra Life Ad</button>
      <button id="test-power-gem" style="display: block; margin: 5px 0; padding: 5px; width: 100%;">Test Power Gem Ad</button>
      <button id="test-score-multi" style="display: block; margin: 5px 0; padding: 5px; width: 100%;">Test Score Multiplier Ad</button>
      <button id="test-toggle-panel" style="display: block; margin: 5px 0; padding: 5px; width: 100%;">Hide Panel</button>
      <div id="ad-test-info" style="margin-top: 8px; font-size: 12px;">
        Current frequency: ${window.AdMobConfig?.settings?.interstitialFrequency || 'N/A'}<br>
        Min time between ads: ${window.AdMobConfig?.settings?.minTimeBetweenInterstitials/1000 || 'N/A'}s<br>
        Test ads enabled: ${window.AdMobConfig?.settings?.useTestAds ? 'Yes' : 'No'}<br>
        Ads enabled: ${window.AdMobConfig?.settings?.adsEnabled ? 'Yes' : 'No'}<br>
      </div>
    `;
    
    document.body.appendChild(testPanel);
    
    // Add event listeners
    document.getElementById('test-interstitial').addEventListener('click', () => {
      console.log('Manually triggering interstitial ad');
      window.wavelengthAds.showInterstitialAd();
    });
    
    document.getElementById('test-extra-life').addEventListener('click', () => {
      console.log('Manually triggering extra life ad offer');
      window.wavelengthAds.offerExtraLife();
    });
    
    document.getElementById('test-power-gem').addEventListener('click', () => {
      console.log('Manually triggering power gem ad offer');
      window.wavelengthAds.offerSpecialGem();
    });
    
    document.getElementById('test-score-multi').addEventListener('click', () => {
      console.log('Manually triggering score multiplier ad offer');
      window.wavelengthAds.offerScoreMultiplier();
    });
    
    let panelVisible = true;
    document.getElementById('test-toggle-panel').addEventListener('click', () => {
      if (panelVisible) {
        testPanel.style.height = '30px';
        testPanel.style.overflow = 'hidden';
        document.getElementById('test-toggle-panel').textContent = 'Show Panel';
      } else {
        testPanel.style.height = 'auto';
        testPanel.style.overflow = 'visible';
        document.getElementById('test-toggle-panel').textContent = 'Hide Panel';
      }
      panelVisible = !panelVisible;
    });
    
    // Refresh settings every 5 seconds
    setInterval(() => {
      const infoDiv = document.getElementById('ad-test-info');
      if (infoDiv && window.AdMobConfig) {
        infoDiv.innerHTML = `
          Current frequency: ${window.AdMobConfig?.settings?.interstitialFrequency || 'N/A'}<br>
          Min time between ads: ${window.AdMobConfig?.settings?.minTimeBetweenInterstitials/1000 || 'N/A'}s<br>
          Test ads enabled: ${window.AdMobConfig?.settings?.useTestAds ? 'Yes' : 'No'}<br>
          Ads enabled: ${window.AdMobConfig?.settings?.adsEnabled ? 'Yes' : 'No'}<br>
        `;
      }
    }, 5000);
    
  }, 2000); // Wait 2 seconds for everything to load
});