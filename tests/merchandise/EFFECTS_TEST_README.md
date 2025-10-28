# Automated Effects Pipeline Test

## What Is This?

This is an **automated test** that validates the complete flow of image effects through the merchandise system:

```
User selects effects → Frontend captures them → API sends them → Backend converts to numeric params → Image processor applies them → Product created with effects
```

## Why Do We Need This?

The effects pipeline is complex with multiple steps where things can break:

1. ❌ **User selects effect in modal** → Not captured
2. ❌ **Effects sent to API** → Missing from payload
3. ❌ **Backend converts boolean→numeric** → Conversion fails
4. ❌ **Effects get applied to image** → EffectsProcessor fails
5. ❌ **Final product has effects** → Visual check shows no change

This test validates ALL 5 steps automatically, capturing detailed diagnostic data at each step.

## Quick Start (2 Commands)

```bash
# Terminal 1 - Start server
npm start

# Terminal 2 - Run the test (takes 30-60 seconds)
npm run test:effects
```

## What You Get

A detailed JSON report like: `tests/merchandise/effects-test-report-2024-10-28T15-30-45.json`

Contains:
- ✅/❌ results for each of 10 validation phases
- 📊 API payloads that were sent
- 📡 Server logs showing effect processing
- 💾 Diagnostic data at each step
- 📈 Success rate and timing

## File Structure

```
tests/merchandise/
├── effects-pipeline.test.js          ← Main test (300+ lines, heavily commented)
├── EFFECTS_TEST_README.md            ← This file
└── effects-test-report-*.json        ← Generated reports (one per run)

scripts/
└── run-effects-test.sh               ← Bash runner with nice formatting

docs/
└── EFFECTS_PIPELINE_DIAGNOSTICS.md   ← Complete troubleshooting guide (500+ lines)

EFFECTS_TEST_QUICK_REFERENCE.md       ← Quick lookup table version
```

## Reading the Report

### Show Summary
```bash
cat tests/merchandise/effects-test-report-*.json | jq '.summary'
```

Output:
```json
{
  "passed": 15,
  "failed": 2,
  "successRate": "88%"
}
```

### Show What Failed
```bash
cat tests/merchandise/effects-test-report-*.json | jq '.sections | .[] | .[] | select(.status == "FAIL")'
```

Output:
```json
{
  "status": "FAIL",
  "message": "Could not find checkbox for effect: dramatic",
  "timestamp": "2024-10-28T15:30:50.500Z"
}
```

## The 10 Validation Phases

| # | Phase | Validates | Looks For |
|---|-------|-----------|-----------|
| 1 | Server Connectivity | Server is reachable | Network connectivity |
| 2 | Browser Setup | Browser launches & navigates | Page loads |
| 3 | Product Discovery | Products exist in store | Gallery cards or product cards |
| 4 | Effect Selection | User can select effects | Modal appears, checkboxes clickable |
| 5 | API Payload | Effects sent to backend | `imageContext.effects` in request |
| 6 | Server Processing | Backend detects effects | Conversion logs in server output |
| 7 | Numeric Conversion | Boolean→numeric works | Logs showing `saturation: 1.4`, etc. |
| 8 | Image Processing | Image buffer modified | Buffer-related logs |
| 9 | Database Save | Effect metadata persisted | Firebase operation logs |
| 10 | Overall Health | Complete flow works | All evidence collected |

## When to Run This Test

### ✅ Run After:
- Making changes to effect selection code
- Modifying the effects conversion logic
- Updating effect presets
- Changing API payload structure
- Any changes to `merchandise.js`, `merchandise-modal-renderer.js`, or `effectsConfig.js`

### ✅ Run As Part Of:
- Pre-deployment validation
- Regression testing
- Bug verification ("is this actually fixed?")
- CI/CD pipeline

## How It Works Under The Hood

### Browser Automation (Puppeteer)
```javascript
// Launches headless Chrome, navigates to store, clicks UI elements
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:3001/merchandise');
```

### Network Interception
```javascript
// Captures API requests and responses
page.on('request', request => {
  if (request.url().includes('/api/merchandise/')) {
    console.log('Captured API payload:', request.postData());
  }
});
```

### Console Log Collection
```javascript
// Captures all browser console output (which includes server logs via fetch)
page.on('console', msg => {
  results.captureServerLog(msg.text());
});
```

### Diagnostic Reporting
```javascript
// Saves all findings to JSON for analysis
fs.writeFileSync('effects-test-report.json', JSON.stringify(report, null, 2));
```

## Troubleshooting Common Issues

### Test Hangs/Times Out
```bash
# Make sure server is running
curl http://localhost:3001

# If not running:
npm start  # In a separate terminal
```

### "No products found"
- Merchandise store needs at least one product or gallery image
- Create one manually in the UI first
- Or check that gallery images are loading

### "Modal didn't appear"
- Check browser console for JavaScript errors
- Check modal CSS selectors are correct
- Try clicking Edit button in store UI manually

### "No effect conversion logs"
- Verify `routes/merchandise.js` line 560+ has the conversion code
- Check that server is actually running (not just the test running against a dead server)
- Add more logging to `routes/merchandise.js` if needed

## Pro Tips

1. **Compare reports before/after**
   ```bash
   ls -t tests/merchandise/effects-test-report-*.json | head -2
   diff <(cat file1.json | jq .summary) <(cat file2.json | jq .summary)
   ```

2. **Filter for just effect-related logs**
   ```bash
   cat effects-test-report-*.json | jq '.serverLogs.logs[] | select(.text | contains("effect") or contains("saturation"))'
   ```

3. **Check API payload structure**
   ```bash
   cat effects-test-report-*.json | jq '.apiPayloads[] | {url, hasEffects: (.data.imageContext.effects != null)}'
   ```

4. **Watch the test run** (visual debugging)
   - Modify test to set `headless: false` in browser launch
   - You'll see the browser automation happen in real-time

## Integration With CI/CD

```yaml
# GitHub Actions example
- name: Test Effects Pipeline
  run: |
    npm start &
    sleep 5
    npm run test:effects

- name: Archive reports
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: effects-test-reports
    path: tests/merchandise/effects-test-report-*.json
```

## Full Documentation

For complete details including:
- How to interpret each phase
- How to fix common failures
- How to add new effect validation
- How to integrate with your workflow

See: `docs/EFFECTS_PIPELINE_DIAGNOSTICS.md`

## Questions?

1. **Is the test broken?** → Check EFFECTS_PIPELINE_DIAGNOSTICS.md troubleshooting section
2. **How do I add new effects?** → Modify `effectsToTest` array in Phase 4 of the test
3. **How do I see detailed logs?** → Use `jq` to filter the generated JSON report
4. **Why is test slow?** → Check server performance, network latency, or image file sizes

## Summary

| Item | Details |
|------|---------|
| **Purpose** | Automate validation of effects pipeline |
| **Run Command** | `npm run test:effects` |
| **Test File** | `tests/merchandise/effects-pipeline.test.js` |
| **Report Output** | `tests/merchandise/effects-test-report-{timestamp}.json` |
| **Duration** | 30-60 seconds |
| **Success Indicator** | Success rate > 80%, all phases pass |
| **Documentation** | `docs/EFFECTS_PIPELINE_DIAGNOSTICS.md` |
| **Quick Reference** | `EFFECTS_TEST_QUICK_REFERENCE.md` |

---

✅ **Test Status**: Ready to use
📅 **Created**: 2024-10-28
🔧 **Version**: 1.0.0
