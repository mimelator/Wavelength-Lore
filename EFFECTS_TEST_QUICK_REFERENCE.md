# Effects Pipeline Test - Quick Reference

## 🚀 Quick Start (30 seconds)

```bash
# Terminal 1: Start the server (if not already running)
npm start

# Terminal 2: Run the effects test
npm run test:effects
```

## 📊 What Gets Validated

| Component | What's Tested | Success Indicator |
|-----------|---------------|-------------------|
| **Frontend** | Effects selected in modal | ✅ "Selected effect: vibrancy" |
| **Frontend** | Effects stored in modal | ✅ "Effects found in modal.dataset" |
| **API** | Effects sent to backend | ✅ "imageContext.effects" in payload |
| **Backend** | Boolean → Numeric conversion | ✅ "Converting effect selections" logs |
| **Backend** | Preset merging | ✅ "Final effect parameters" logs |
| **Backend** | Image processing | ✅ Buffer logs or size changes |
| **Database** | Effect metadata saved | ✅ Firebase operation logs |
| **Overall** | Complete flow works | ✅ Success rate > 80% |

## 📁 Files Created

```
tests/merchandise/
├── effects-pipeline.test.js          # Main automated test (300+ lines)

scripts/
├── run-effects-test.sh               # Bash test runner with nice output

docs/
├── EFFECTS_PIPELINE_DIAGNOSTICS.md   # Comprehensive guide (500+ lines)

EFFECTS_TEST_QUICK_REFERENCE.md        # This file

package.json (updated)
├── Added: "test:effects" script
```

## 🎯 Test Phases (10 Total)

| Phase | Purpose | Expected Result |
|-------|---------|-----------------|
| 1 | Server connectivity | ✅ Server reachable |
| 2 | Browser setup | ✅ Store loads |
| 3 | Find products | ✅ Products found |
| 4 | Select effects | ✅ "Vibrancy", "Dramatic" selected |
| 5 | Validate API | ✅ imageContext.effects present |
| 6 | Server processing | ✅ Conversion logs appear |
| 7 | Numeric params | ✅ saturation: 1.4, vignette: 0.5, etc. |
| 8 | Image buffer | ✅ Buffer processing confirmed |
| 9 | Firebase save | ✅ Data persisted |
| 10 | Final validation | ✅ Overall pipeline healthy |

## 📋 How to Read the Report

Test generates: `tests/merchandise/effects-test-report-TIMESTAMP.json`

### Quick Summary
```bash
# Show what passed/failed
cat tests/merchandise/effects-test-report-*.json | jq '.summary'

# Output:
# {
#   "passed": 15,
#   "failed": 2,
#   "total": 17,
#   "successRate": "88%"
# }
```

### View Failed Checks
```bash
cat tests/merchandise/effects-test-report-*.json | jq '.sections | map_values(map(select(.status == "FAIL")))'
```

### View Effect Conversion Evidence
```bash
cat tests/merchandise/effects-test-report-*.json | jq '.serverLogs.logs[] | select(.text | contains("Converting effect"))'
```

### View API Payload
```bash
cat tests/merchandise/effects-test-report-*.json | jq '.apiPayloads[0].data.imageContext.effects'
```

## 🔧 Troubleshooting Quick Guide

| Issue | Fix |
|-------|-----|
| **Test hangs** | Check server running: `curl http://localhost:3001` |
| **"No products found"** | Manually add product to store first |
| **"Modal didn't open"** | Check browser console for JS errors |
| **"No API payloads"** | Verify `/api/merchandise/preview-finished-product` endpoint exists |
| **"No effect conversion logs"** | Check that `routes/merchandise.js` has effect processing code (line 560+) |
| **"No numeric parameters"** | Verify `effectsConfig.js` has effect presets defined |

## 🎯 Common Test Results

### ✅ All Phases Pass (100%)
```
Status: EXCELLENT
Meaning: Effects pipeline is fully functional
Action: All effects should work end-to-end
```

### ✅ Phase 1-5 Pass, 6-10 Warn/Fail (50-80%)
```
Status: PARTIAL
Meaning: Frontend works but backend has issues
Action: Fix effect conversion in routes/merchandise.js
Common cause: Missing preset merging logic
```

### ❌ Phase 3-5 Fail (40-60%)
```
Status: UI ISSUES
Meaning: Modal or effect selection isn't working
Action: Check merchandise-modal-renderer.js
Common cause: Wrong CSS selectors or modal not opening
```

### ❌ All Phases Fail (0-40%)
```
Status: CRITICAL
Meaning: Fundamental problem (server down, etc.)
Action: Check prerequisites - server must be running
Run: npm start in separate terminal
```

## 📈 Iterative Testing Workflow

After making changes:

1. **Run test**
   ```bash
   npm run test:effects
   ```

2. **Check result**
   ```bash
   cat tests/merchandise/effects-test-report-*.json | jq '.summary'
   ```

3. **If FAIL entries exist**
   ```bash
   # Find exactly what failed
   cat tests/merchandise/effects-test-report-*.json | jq '.sections | .[] | .[] | select(.status == "FAIL")'
   ```

4. **Fix the code** (see EFFECTS_PIPELINE_DIAGNOSTICS.md for detailed guidance)

5. **Run test again** to verify fix
   ```bash
   npm run test:effects
   ```

## 🔍 Debugging Tips

### Enable Server-Side Logging
Add to `routes/merchandise.js` at line 560:
```javascript
console.log('\n🔍🔍 DETAILED DEBUGGING:');
console.log('   Effects from context:', imageContext.effects);
console.log('   Config available:', !!effectsConfig);
```

### Inspect Modal in Browser
```javascript
// In browser console (F12):
const modal = document.querySelector('.product-customization-modal');
console.log('Selected effects:', JSON.parse(modal.dataset.selectedEffects || '{}'));
```

### Verify Effect Presets
```javascript
// In Node REPL:
const effectsConfig = require('./config/effectsConfig.js');
console.log(effectsConfig.effectTypes.vibrancy.preset);
// Should output: { saturation: 1.4, colorTemperature: 3800, brightness: 1.08, contrast: 1.15 }
```

### Manual Test Without Automation
1. Go to `http://localhost:3001/merchandise`
2. Click "Edit" on a product
3. Check "Vibrancy" effect
4. Open DevTools → Console
5. Click "Preview Finished Product"
6. Look for "Converting effect selections" in server logs
7. Look for "saturation: 1.4" in server logs

## 📞 Key Code Locations

| What | Where | Lines |
|------|-------|-------|
| Effect selection capture | `merchandise-modal-renderer.js` | 2237-2249 |
| Effect → Numeric conversion | `routes/merchandise.js` | 560-601 |
| Effect presets | `config/effectsConfig.js` | 12-84 |
| Image processing | `services/EffectsProcessor.js` | - |
| Effects test | `tests/merchandise/effects-pipeline.test.js` | - |

## 💡 Pro Tips

1. **Run test in CI/CD**: Add to GitHub Actions to catch effects breaking
2. **Compare reports**: Save old reports to see improvements over time
3. **Visual testing after**: Create product with effects and manually inspect in Printify
4. **Log everything**: When stuck, add `console.log()` liberally and re-run test
5. **Use jq filters**: Process report JSON with jq for quick analysis

## ⏱️ Expected Test Duration

- **Fast**: 30-45 seconds (server responding well)
- **Normal**: 45-60 seconds (typical performance)
- **Slow**: 60-90+ seconds (server under load or slow network)

If consistently >90s, check:
- Server CPU/memory usage
- Network latency
- Image file sizes being processed

## 🎓 Full Documentation

For complete details, see: `docs/EFFECTS_PIPELINE_DIAGNOSTICS.md`

## 📝 Summary

| Metric | Details |
|--------|---------|
| **Test File** | `tests/merchandise/effects-pipeline.test.js` |
| **Run Command** | `npm run test:effects` |
| **Report Location** | `tests/merchandise/effects-test-report-*.json` |
| **Phases** | 10 validation phases |
| **Expected Pass Rate** | >80% for healthy pipeline |
| **Typical Duration** | 30-60 seconds |
| **Returns** | Detailed JSON report with diagnostic data |

---

**Last Updated**: 2024-10-28
**Test Status**: ✅ Ready for use
**Version**: 1.0.0
