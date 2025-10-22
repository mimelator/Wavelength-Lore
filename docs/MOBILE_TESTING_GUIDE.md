# Mobile Testing Guide - Wavelength Gems

## Overview
This guide provides a systematic approach to testing and optimizing Wavelength Gems for mobile devices.

## Quick Start

### 1. Access Mobile Diagnostics
The mobile diagnostics tool automatically runs on devices with viewport width ≤ 768px.

**Manual Execution:**
```javascript
// Run full diagnostics
window.mobileDiagnostics.runFullDiagnostics()

// Enable touch event logging
window.mobileDiagnostics.enableTouchLogging()

// View recent touch events
window.mobileDiagnostics.getTouchLog()

// Export diagnostic data
window.mobileDiagnostics.exportDiagnostics()
```

### 2. Testing Methods

#### A. Browser DevTools (Easiest)
1. Open Chrome/Edge DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M / Cmd+Shift+M)
3. Select device profile (iPhone, Pixel, etc.)
4. Refresh page to trigger mobile diagnostics
5. Check console for diagnostic output

**Recommended Test Devices:**
- iPhone 12/13 Pro (390x844)
- iPhone SE (375x667)
- Samsung Galaxy S20 (360x800)
- iPad Mini (768x1024)
- Pixel 5 (393x851)

#### B. Real Device Testing
1. Get local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Ensure phone on same WiFi network
3. Access: `http://YOUR_IP:3000/games/wavelength-gems`
4. Open Safari/Chrome DevTools on device (if available)

#### C. Remote Debugging
**iOS (Safari):**
1. Enable Web Inspector on iPhone: Settings > Safari > Advanced > Web Inspector
2. Connect iPhone to Mac via USB
3. Safari > Develop > [Your iPhone] > [Page]

**Android (Chrome):**
1. Enable USB Debugging on phone
2. Connect via USB
3. Chrome > More Tools > Remote Devices
4. Inspect your device

## What to Test

### 1. Layout & Display ✓
- [ ] Game board fits within viewport (no horizontal scroll)
- [ ] Hero badge displays correctly or hides appropriately
- [ ] Controls are accessible without scrolling
- [ ] Stats display properly
- [ ] No elements overlap or overflow

### 2. Touch Interaction ✓
- [ ] Gems respond to tap/touch
- [ ] Swipe gestures work for gem swapping
- [ ] No double-tap zoom interference
- [ ] Touch targets are large enough (minimum 44x44px)
- [ ] Multi-touch doesn't trigger unintended actions

### 3. Performance ✓
- [ ] 60 FPS during gameplay (check diagnostics)
- [ ] No lag when swiping gems
- [ ] Smooth animations
- [ ] Quick level transitions
- [ ] Responsive after resize/orientation change

### 4. Orientation ✓
- [ ] Portrait mode works correctly
- [ ] Landscape mode works correctly
- [ ] Switching orientation doesn't break layout
- [ ] Game state preserved during orientation change

### 5. Responsive Breakpoints ✓
Test at these widths:
- [ ] 320px (small mobile)
- [ ] 375px (iPhone)
- [ ] 414px (large mobile)
- [ ] 768px (tablet portrait)
- [ ] 1024px (tablet landscape)

## Common Issues & Solutions

### Issue: Game board disappears on resize
**Status:** ✅ FIXED (v61590c8)
**Solution:** Added `this.draw()` call in `resizeCanvas()` method

### Issue: Canvas larger than viewport
**Diagnostic Check:** Look for warning in mobile diagnostics
**Solution:** Adjust canvas sizing in `calculateBoardDimensions()`

### Issue: Touch events not working
**Diagnostic Check:** Check "TOUCH SUPPORT" section
**Possible Causes:**
- touch-action CSS not set to "none"
- Event listener not attached to canvas
- Touch coordinates not properly calculated

### Issue: Horizontal scrolling
**Diagnostic Check:** Look for overflow warning
**Common Culprits:**
- Fixed-width elements
- Sidebars not properly hidden
- Canvas width exceeding viewport
- Padding/margins causing overflow

### Issue: Elements overlapping
**Diagnostic Check:** Check "LAYOUT ELEMENTS" section
**Solutions:**
- Verify responsive CSS media queries
- Check z-index values
- Ensure proper flexbox/grid usage

## Mobile Optimization Checklist

### CSS Optimizations
- [ ] `touch-action: none` on interactive elements
- [ ] `-webkit-tap-highlight-color: transparent` to remove tap flash
- [ ] Appropriate media queries for mobile breakpoints
- [ ] Remove/hide non-essential elements on mobile
- [ ] Use `viewport` meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`

### JavaScript Optimizations
- [ ] Use touch events in addition to click events
- [ ] Debounce/throttle scroll/resize handlers
- [ ] Reduce canvas size on mobile (current: 52px gems)
- [ ] Optimize animation frame rate if needed
- [ ] Add passive event listeners where appropriate

### Performance Optimizations
- [ ] Minimize DOM manipulations
- [ ] Use CSS transforms for animations (GPU accelerated)
- [ ] Reduce shadow/glow effects on mobile
- [ ] Lazy load non-critical resources
- [ ] Consider reducing particle effects

## Current Mobile Implementation

### Gem Sizing
- **Mobile (≤768px):** Fixed 52px gems
- **Desktop:** Dynamic sizing (40-100px based on viewport)

### Touch Handling
```javascript
canvas.addEventListener('touchstart', (e) => this.handleCanvasClick(e));
canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
```

### Responsive Breakpoints
- **≤768px:** Mobile optimizations active
- **900px:** Hero badge hidden
- **1100px:** Hero badge visibility threshold
- **1300px:** Hero badge size adjustment
- **1600px:** Hero badge size adjustment

## Diagnostic Output Interpretation

### Viewport Section
- Check if detected as mobile (≤768px)
- Verify DPR (Device Pixel Ratio) for retina displays
- Confirm viewport meta tag is present

### Touch Support Section
- All should be ✅ for proper mobile support
- maxTouchPoints should be > 0

### Canvas Section
- Display size should fit within viewport
- touchAction should be "none"
- Canvas should be visible

### Layout Section
- Check which elements are visible
- Sidebars should be hidden on mobile
- No horizontal overflow

### Performance Section
- Monitor memory usage
- Check for memory leaks during extended play

## Testing Workflow

### Phase 1: Initial Setup (Current Phase)
1. ✅ Create mobile diagnostics tool
2. ✅ Integrate diagnostics into game page
3. ⏳ Run diagnostics on actual mobile devices
4. ⏳ Document baseline metrics

### Phase 2: Issue Identification
1. Test all checklist items
2. Document failing tests
3. Prioritize issues by severity
4. Create GitHub issues for tracking

### Phase 3: Optimization
1. Fix critical issues first (gameplay blockers)
2. Address layout/display issues
3. Optimize performance
4. Polish touch interactions

### Phase 4: Validation
1. Re-test all checklist items
2. Verify fixes on multiple devices
3. Performance benchmarking
4. User acceptance testing

## Next Steps

1. **Run diagnostics on real mobile device:**
   - Access game on phone via local network
   - Open browser console if possible
   - Screenshot diagnostic output
   - Note any visual issues

2. **Test basic gameplay:**
   - Can you tap gems?
   - Can you swap gems?
   - Do matches work?
   - Can you complete a level?

3. **Document findings:**
   - What works?
   - What doesn't work?
   - What feels wrong?
   - Performance issues?

4. **Create action plan:**
   - Prioritize issues
   - Estimate effort
   - Begin implementation

## Resources

- **Mobile Diagnostics:** `/static/js/games/wavelength-gems/mobile-diagnostics.js`
- **Game Engine:** `/static/js/games/wavelength-gems/engine.js`
- **Styles:** `/views/games/wavelength-gems.ejs` (inline CSS)
- **Auto Diagnostics:** `/static/js/games/wavelength-gems/auto-diagnostics.js`

## Contact & Support

For issues or questions about mobile testing:
1. Check this guide first
2. Run diagnostics and export data
3. Document steps to reproduce
4. Include diagnostic output in bug reports
