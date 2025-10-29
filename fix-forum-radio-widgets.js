#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of forum files that need to be updated
const forumFiles = [
    'views/forum/category-page.ejs',
    'views/forum/popular.ejs',
    'views/forum/admin.ejs',
    'views/forum/help.ejs',
    'views/forum/create-post-page.ejs',
    'views/forum/search.ejs',
    'views/forum/home-page.ejs',
    'views/forum/recent.ejs',
    'views/forum/post-page.ejs',
    'views/forum/guidelines.ejs'
];

// Old include line to replace
const oldInclude = `    <%- include('../partials/radio-player-widget') %>`;

// New unified radio system widget
const newRadioWidget = `    <!-- Unified Radio System Widget -->
    <div class="wavelength-radio-widget" data-wavelength-radio-widget="true">
      <div class="radio-widget-toggle" id="radioWidgetToggle" title="Show/Hide Radio Player">
        <span class="toggle-icon">📻</span>
        <span class="toggle-text">Radio Player</span>
      </div>

      <div class="radio-widget-content" id="radioWidgetContent">
        <div class="radio-widget-header">
          <h3>✨ Wavelength Radio ✨</h3>
          <button class="radio-widget-close" id="radioWidgetClose" title="Close">✕</button>
        </div>

        <div class="radio-widget-info">
          <div class="radio-widget-track" id="radioWidgetTrack">Select a track</div>
          <div class="radio-widget-progress" id="radioWidgetProgress">0:00 / 0:00</div>
        </div>

        <div class="radio-widget-controls">
          <button class="radio-widget-btn" id="radioWidgetPrev" title="Previous">⏮</button>
          <button class="radio-widget-btn radio-widget-play" id="radioWidgetPlay" title="Play">▶</button>
          <button class="radio-widget-btn" id="radioWidgetNext" title="Next">⏭</button>
        </div>

        <div class="radio-widget-volume">
          <span class="volume-icon">🔊</span>
          <input type="range" id="radioWidgetVolume" min="0" max="100" value="80" class="radio-widget-volume-slider">
          <span id="radioWidgetVolumeValue">80%</span>
        </div>

        <div class="radio-widget-footer">
          <a href="/radio" class="radio-widget-link">🎵 Full Player</a>
        </div>
      </div>

      <!-- Hidden audio element -->
      <audio id="radioWidgetAudio" preload="metadata"></audio>
    </div>

    <!-- Load Unified Radio System -->
    <script src="<%= cdnUrl %>/js/radio-player.js?v=<%= typeof version !== 'undefined' ? version : Date.now() %>"></script>
    
    <!-- Radio Widget Styles -->
    <style>
      .wavelength-radio-widget {
        position: fixed;
        bottom: 0;
        right: 20px;
        z-index: 9999;
        transition: all 0.3s ease;
      }

      .radio-widget-toggle {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 25px 25px 0 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 -4px 15px rgba(102, 126, 234, 0.4);
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .radio-widget-toggle:hover {
        transform: translateY(-2px);
        box-shadow: 0 -6px 20px rgba(102, 126, 234, 0.6);
      }

      .radio-widget-toggle .toggle-icon {
        font-size: 1.2rem;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .radio-widget-content {
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(43, 43, 66, 0.98) 100%);
        backdrop-filter: blur(10px);
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
        width: 350px;
        max-height: 400px;
        display: none;
        overflow: hidden;
        border: 2px solid rgba(102, 126, 234, 0.3);
      }

      .radio-widget-content.active {
        display: block;
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .radio-widget-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .radio-widget-header h3 {
        margin: 0;
        color: white;
        font-size: 1.1rem;
      }

      .radio-widget-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .radio-widget-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }

      .radio-widget-info {
        padding: 15px 20px;
        text-align: center;
        background: rgba(0, 0, 0, 0.2);
      }

      .radio-widget-track {
        color: white;
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .radio-widget-progress {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85rem;
      }

      .radio-widget-controls {
        padding: 15px 20px;
        display: flex;
        justify-content: center;
        gap: 15px;
        background: rgba(0, 0, 0, 0.3);
      }

      .radio-widget-btn {
        background: rgba(102, 126, 234, 0.3);
        border: 1px solid rgba(102, 126, 234, 0.5);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .radio-widget-btn:hover {
        background: rgba(102, 126, 234, 0.5);
        transform: scale(1.1);
      }

      .radio-widget-play {
        width: 50px;
        height: 50px;
        font-size: 1.2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 2px solid rgba(255, 255, 255, 0.3);
      }

      .radio-widget-volume {
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.3);
      }

      .radio-widget-volume .volume-icon {
        color: white;
        font-size: 1.2rem;
      }

      .radio-widget-volume-slider {
        flex: 1;
        height: 5px;
        border-radius: 5px;
        background: rgba(102, 126, 234, 0.3);
        outline: none;
        cursor: pointer;
      }

      .radio-widget-volume-slider::-webkit-slider-thumb {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        cursor: pointer;
      }

      #radioWidgetVolumeValue {
        color: white;
        font-size: 0.9rem;
        min-width: 40px;
        text-align: right;
      }

      .radio-widget-footer {
        text-align: center;
        padding: 15px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.3);
      }

      .radio-widget-link {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s ease;
      }

      .radio-widget-link:hover {
        color: #764ba2;
        text-decoration: underline;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .radio-widget-content {
          width: calc(100vw - 40px);
        }
        .wavelength-radio-widget {
          right: 20px;
          left: 20px;
        }
      }
    </style>`;

console.log('🎵 WAVELENGTH FORUM RADIO WIDGET UNIFICATION');
console.log('═══════════════════════════════════════════════');

let successCount = 0;
let errorCount = 0;

for (const filePath of forumFiles) {
    try {
        const fullPath = path.join(__dirname, filePath);
        console.log(`\n🔄 Processing: ${filePath}`);
        
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            errorCount++;
            continue;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        
        if (!content.includes(oldInclude)) {
            console.log(`ℹ️  Already updated or no radio widget found in: ${filePath}`);
            continue;
        }

        // Replace the old include with the new unified system
        const updatedContent = content.replace(oldInclude, newRadioWidget);
        
        if (updatedContent === content) {
            console.log(`⚠️  No changes made to: ${filePath}`);
            continue;
        }

        // Write the updated content back to the file
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
        successCount++;

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        errorCount++;
    }
}

console.log('\n═══════════════════════════════════════════════');
console.log(`🎯 SUMMARY:`);
console.log(`   ✅ Successfully updated: ${successCount} files`);
console.log(`   ❌ Errors encountered: ${errorCount} files`);
console.log(`   🎵 All forum pages now use unified radio system!`);
console.log('═══════════════════════════════════════════════');