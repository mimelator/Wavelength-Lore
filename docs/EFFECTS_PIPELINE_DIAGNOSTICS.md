# Effects Pipeline Diagnostics Guide

## Overview

This guide explains how to use the automated effects pipeline test to validate the complete flow of image effects from user selection through final product creation.

## Quick Start

### Run the Test

```bash
# Option 1: NPM script
npm run test:effects

# Option 2: Direct Node
node tests/merchandise/effects-pipeline.test.js

# Option 3: Using the shell script
bash scripts/run-effects-test.sh
```

### Prerequisites

- Node.js installed
- Server running (`npm start` in another terminal)
- Merchandise store accessible at `http://localhost:3001/merchandise`
- At least one product or gallery image available

## Test Overview

The automated test validates the complete effects pipeline in 10 phases:

### Phase 1: Server Log Monitoring Setup
- **What**: Establishes connection to capture server logs
- **Why**: Need server-side evidence of effect processing
- **Expected**: "Server is reachable"

### Phase 2: Browser Setup
- **What**: Launches Puppeteer and navigates to merchandise store
- **Why**: Must interact with UI to trigger effect selection
- **Expected**: Store loads successfully

### Phase 3: Product Discovery
- **What**: Finds gallery images or product cards in the store
- **Why**: Need a product to edit and customize
- **Expected**: At least one product card found

### Phase 4: Effect Selection
- **What**: Clicks checkboxes for effects (vibrancy, dramatic, etc.)
- **Why**: User must select effects to test the pipeline
- **Expected**: "Vibrancy selected", "Dramatic selected" messages

### Phase 5: API Payload Validation
- **What**: Intercepts the API request to preview finished product
- **Why**: Must verify effects are sent to backend in imageContext
- **Expected**: `imageContext.effects` contains selected effects

### Phase 6: Server-Side Effect Processing
- **What**: Analyzes server logs for effect conversion evidence
- **Why**: Backend must convert boolean flags to numeric parameters
- **Expected**: Logs showing "Converting effect selections" or "Final effect parameters"

### Phase 7: Numeric Parameter Verification
- **What**: Searches logs for numeric parameters (saturation: 1.4, etc.)
- **Why**: Confirms preset conversion is working
- **Expected**: Logs with numeric values like `saturation: 1.4`, `vignette: 0.5`

### Phase 8: Image Buffer Verification
- **What**: Looks for buffer processing logs
- **Why**: Confirms EffectsProcessor actually modified the image
- **Expected**: Buffer-related logs

### Phase 9: Firebase Persistence
- **What**: Checks for Firebase save operations
- **Why**: Confirm effect metadata is saved to database
- **Expected**: Firebase operation logs

### Phase 10: Final Validation
- **What**: Summarizes evidence collected
- **Why**: Determine overall pipeline health
- **Expected**: All phases have evidence

## Reading the Test Report

The test generates a JSON report file in `tests/merchandise/`:

```
effects-test-report-2024-10-28T15-30-45-123Z.json
```

### Report Structure

```json
{
  "testName": "Effects Pipeline Validation",
  "timestamp": "2024-10-28T15:30:45.123Z",
  "duration": 45000,
  "summary": {
    "passed": 15,
    "failed": 2,
    "total": 17,
    "successRate": "88%"
  },
  "sections": {
    "PHASE 1: Server Log Monitoring Setup": [
      {
        "status": "PASS",
        "message": "Server is reachable",
        "details": null,
        "timestamp": "2024-10-28T15:30:45.200Z"
      }
    ],
    "PHASE 4: Effect Selection": [
      {
        "status": "PASS",
        "message": "Selected effect: vibrancy",
        "details": {
          "expectedParams": {
            "saturation": 1.4,
            "colorTemperature": 3800,
            "brightness": 1.08,
            "contrast": 1.15
          }
        }
      },
      {
        "status": "FAIL",
        "message": "Could not find checkbox for effect: dramatic",
        "timestamp": "2024-10-28T15:30:50.500Z"
      }
    ]
  },
  "apiPayloads": [
    {
      "method": "POST",
      "url": "/api/merchandise/preview-finished-product",
      "data": {
        "imageContext": {
          "effects": {
            "vibrancy": true,
            "dramatic": true
          },
          "imageBuffer": "...",
          "imageUrl": "..."
        }
      }
    }
  ],
  "serverLogs": {
    "total": 245,
    "logs": [
      {
        "type": "log",
        "text": "🔍 Converting effect selections to numeric parameters:",
        "timestamp": "2024-10-28T15:30:52.100Z"
      }
    ]
  },
  "diagnosticData": {
    "modalEffects": { "vibrancy": true, "dramatic": true },
    "apiPayload": {
      "hasEffects": true,
      "effects": { "vibrancy": true, "dramatic": true }
    },
    "effectConversionLogs": [...],
    "numericParams": [...]
  }
}
```

## Interpreting Results

### Success Indicators

**All Phases Pass ✅**
- Effects flow is working correctly end-to-end
- Products created with this flow should have effects applied

**Most Phases Pass ⚠️**
- Check FAIL entries - they indicate where the pipeline breaks
- See "Diagnosing Failures" section below

### Common Failure Scenarios

#### "No gallery images found" (Phase 3)
**Problem**: Test couldn't find products to edit
**Solution**:
1. Create a product in the merchandise store UI
2. Ensure gallery has images (check `/merchandise` in browser)
3. Manually test: Select a product → click Edit/Customize → observe modal

#### "Customization modal did not appear" (Phase 3)
**Problem**: Click on product didn't open the modal
**Solution**:
1. Check browser console for JavaScript errors
2. Verify modal selectors: `.product-customization-modal`, `[role="dialog"]`, `.modal`
3. Check `merchandise-modal-renderer.js` - modal rendering code

#### "Could not find checkbox for effect" (Phase 4)
**Problem**: Effect selection buttons don't have expected selectors
**Solution**:
1. Inspect the modal HTML: Right-click modal → Inspect Element
2. Find the actual effect checkbox selectors
3. Update test to use correct selectors:
   ```bash
   # In browser console:
   document.querySelector('[data-effect="vibrancy"]')  // Check what exists
   ```

#### "API payload missing imageContext.effects" (Phase 5)
**Problem**: Effects aren't being sent to the backend
**Solution**:
1. Check `merchandise-modal-renderer.js` line 2237-2249
2. Verify effects are saved: `const selectedEffects = JSON.parse(modal.dataset.selectedEffects || '{}')`
3. Verify effects are included in customization object
4. Check browser console for any errors when clicking preview

#### "No evidence of effect processing" (Phase 6)
**Problem**: Server logs don't show effect conversion
**Solution**:
1. Check `routes/merchandise.js` line 560-601
2. Verify logging statements are present:
   ```javascript
   console.log('\n🔍 Converting effect selections to numeric parameters:');
   console.log('\n✅ Final effect parameters to apply:');
   ```
3. Enable DEBUG mode if available
4. Check server console (not browser console) for logs

#### "No numeric parameter evidence found" (Phase 7)
**Problem**: Effect presets aren't being merged
**Solution**:
1. Check `config/effectsConfig.js` - verify presets are defined
2. Check `routes/merchandise.js` line 560-601 - verify merging logic
3. Test the merging locally:
   ```javascript
   // In Node REPL or test script:
   const effectsConfig = require('./config/effectsConfig');
   console.log(effectsConfig.effectTypes.vibrancy.preset);
   // Should output: { saturation: 1.4, colorTemperature: 3800, ... }
   ```

## Advanced Diagnostics

### Viewing API Payloads

```bash
# Using jq (if installed)
cat tests/merchandise/effects-test-report-*.json | jq '.apiPayloads'

# Or using Node:
node -e "const r = require('./tests/merchandise/effects-test-report-*.json'); console.log(JSON.stringify(r.apiPayloads, null, 2))"
```

### Finding Effect Processing Logs

```bash
# All server logs mentioning "effect"
cat tests/merchandise/effects-test-report-*.json | jq '.serverLogs.logs[] | select(.text | contains("effect"))'

# All server logs with numeric parameters
cat tests/merchandise/effects-test-report-*.json | jq '.serverLogs.logs[] | select(.text | contains("saturation") or .text | contains("vignette"))'
```

### Finding Failed Checks

```bash
# All failed test checks
cat tests/merchandise/effects-test-report-*.json | jq '.sections | map_values(map(select(.status == "FAIL")))'
```

### Server-Side Logging

To add more detailed server logging, modify `routes/merchandise.js`:

```javascript
// Add this to the effects processing section (line 560+):
console.log('\n🔍🔍 DETAILED EFFECT DEBUGGING:');
console.log('   imageContext.effects:', imageContext.effects);
console.log('   Selected effects keys:', Object.keys(imageContext.effects || {}));
console.log('   effectsConfig available:', !!effectsConfig.effectTypes);
console.log('   Available effect presets:', Object.keys(effectsConfig.effectTypes || {}));

// Then after merging:
console.log('   Final merged parameters:', JSON.stringify(effectsToApply, null, 2));
```

## Manual Testing Workflow

If automated test doesn't work, test manually:

1. **Navigate to store**
   - Go to `http://localhost:3001/merchandise`

2. **Edit a product**
   - Click Edit/Customize on any product

3. **Select effects**
   - Check "Vibrancy" and "Dramatic"
   - Open browser DevTools → Console

4. **Preview product**
   - Click "Preview Finished Product"
   - Look in browser console for logs

5. **Check server logs**
   - Look in terminal running `npm start`
   - Search for: "Converting effect", "Final effect parameters", "Processing effects"

6. **View final product**
   - After preview completes
   - Check if new product card shows effects applied
   - Compare image to original (should be more vibrant/dramatic)

## Iterative Testing

After making changes to effects code:

1. **Run the test** to get baseline
   ```bash
   npm run test:effects
   ```

2. **Review report** for failures
   ```bash
   cat tests/merchandise/effects-test-report-*.json | jq '.sections'
   ```

3. **Fix the issue** identified
   - Edit `routes/merchandise.js`, `config/effectsConfig.js`, etc.

4. **Run test again** to validate fix
   ```bash
   npm run test:effects
   ```

5. **Compare reports** to see improvement
   ```bash
   # Show the 2 most recent test results
   ls -t tests/merchandise/effects-test-report-*.json | head -2
   ```

## Troubleshooting

### Test Times Out
- **Problem**: Test hangs waiting for modal or other element
- **Solution**:
  1. Check that server is running: `curl http://localhost:3001`
  2. Check that merchandise store loads: visit `http://localhost:3001/merchandise` manually
  3. Check for JavaScript errors in browser console
  4. Increase timeouts in test if needed:
     ```javascript
     await page.waitForSelector('.modal', { timeout: 20000 }); // Increase from 10000
     ```

### No API Payloads Captured
- **Problem**: `apiPayloads` array is empty in report
- **Solution**:
  1. Verify API route exists: `POST /api/merchandise/preview-finished-product`
  2. Check network tab in browser for actual endpoint name
  3. Update test interceptor pattern if endpoint name differs

### All Phases Pass But Effects Don't Actually Work
- **Problem**: Test passes but product visually has no effects
- **Possible Cause**: Image processing fails silently
- **Solution**:
  1. Check EffectsProcessor service for errors
  2. Verify image buffer size changes after processing
  3. Add image comparison: before/after effect application
  4. Check Printify upload for stripped effects

## Performance Considerations

Test typical duration: 30-60 seconds

- Phase 1-2: 5s
- Phase 3-4: 10s (waiting for modal)
- Phase 5-10: 15-45s (depends on server processing speed)

If test consistently takes >90s:
1. Check server performance (slow image processing)
2. Check network latency (slow API responses)
3. Check file sizes (large images slow down processing)

## Integration with CI/CD

To run this test in CI/CD pipeline:

```bash
# In GitHub Actions or similar:
- name: Run Effects Pipeline Test
  run: |
    npm start &
    sleep 5
    npm run test:effects

- name: Archive test reports
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: effects-test-reports
    path: tests/merchandise/effects-test-report-*.json
```

## Questions & Support

**Q: Why doesn't the test work with headless=false?**
A: The test script defaults to headless mode for CI/CD compatibility. To debug visually, modify the script to set `headless: false` and run locally.

**Q: Can I test multiple effects at once?**
A: Yes! The test is configured to test both "vibrancy" and "dramatic" effects. Modify the `effectsToTest` array in Phase 4 to test more.

**Q: How do I know if the visual effects are actually applied?**
A: The test doesn't do image comparison (yet). For now:
1. Create a product with effects via test
2. Manually inspect the Printify product in your Printify account
3. Compare to product created without effects

**Q: What if I want to test a new effect type?**
A: 1. Add it to `effectsToTest` in Phase 4 of the test
   2. Verify it's defined in `config/effectsConfig.js`
   3. Run test to see if it's processed correctly

## Next Steps

1. Run the test: `npm run test:effects`
2. Review the report
3. Fix any FAIL entries
4. Run test again to confirm fix
5. Create a new product with effects to visually verify
