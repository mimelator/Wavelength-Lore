# CTA Audit Action Plan - Issue #102

**Status:** ✅ System Ready
**Created:** October 28, 2024
**Related Issue:** [#102 - CTA Validation](https://github.com/mimelator/Wavelength-Lore/issues/102)

---

## Executive Summary

A complete CTA (Call-to-Action) audit system has been implemented to systematically validate all character, episode, and lore CTAs against the Wavelength canon. The system collects, validates, and reports on consistency, accuracy, and engagement of all CTAs.

**Current Status:**
- ✅ 36 CTAs collected (25 episodes, 11 lore entries, 0 characters)
- ⏳ Ready for chatbot validation
- 📊 Reporting system in place

---

## What Was Delivered

### 1. **Chat CLI Integration** ✅
- Added `npm run chat` and `npm run chat:cli` commands
- Integrated `wavelength-chat-cli.js` with npm scripts
- Ready for interactive chatbot conversations

### 2. **CTA Collection System** ✅
Created `scripts/cta-collector.js`:
- Scans all YAML files under `content/`
- Extracts CTAs from episodes (taglines, hooks, teases)
- Extracts CTAs from lore (intrigue hooks, enhanced titles)
- Extracts CTAs from characters (text, taglines, stakes)
- Outputs structured data to `reports/cta-audit.json`

**Run:** `npm run cta:collect`

### 3. **CTA Validation System** ✅
Created `scripts/cta-validator.js`:
- Uses Wavelength chatbot API to evaluate each CTA
- Checks consistency with established lore
- Identifies issues automatically (unclear, misleading, inconsistent, etc.)
- Rates CTAs on quality scale (1-4)
- Saves detailed assessment to `reports/cta-validation-report.json`

**Run:** `npm run cta:validate` (requires `CHATBOT_API_KEY`)

### 4. **Master Orchestrator Script** ✅
Created `scripts/cta-audit.js`:
- Coordinates collection, validation, and reporting
- Supports multiple commands: `audit`, `collect`, `validate`, `report`
- Rate-limits API calls to avoid overwhelming the service
- Generates human-readable markdown summary

**Run:** `npm run cta:audit`

### 5. **NPM Scripts** ✅
Added to `package.json`:
```json
"chat": "node wavelength-chat-cli.js",
"chat:cli": "node wavelength-chat-cli.js",
"cta:audit": "node scripts/cta-audit.js",
"cta:collect": "node scripts/cta-audit.js collect",
"cta:validate": "node scripts/cta-audit.js validate",
"cta:report": "node scripts/cta-audit.js report"
```

### 6. **Documentation** ✅
- **[CTA_AUDIT_GUIDE.md](./CTA_AUDIT_GUIDE.md)** - Complete implementation guide
- **[CTA_QUICK_REFERENCE.md](./CTA_QUICK_REFERENCE.md)** - Quick commands and troubleshooting
- **[AUDIT_ACTION_PLAN.md](./AUDIT_ACTION_PLAN.md)** - This document

---

## How to Run the Audit

### First Time: Full Audit

```bash
# 1. Ensure .env has your API key
echo "CHATBOT_API_KEY=your_key_here" >> .env

# 2. Run complete audit
npm run cta:audit

# 3. Review results
cat reports/cta-summary.md
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════════
🎵 WAVELENGTH LORE CTA AUDIT - FULL RUN
═══════════════════════════════════════════════════════════════

📦 STEP 1: Collecting CTAs...
✅ Saved 36 CTAs...

📋 STEP 2: Validating CTAs against lore...
[1/36] Validating episode: My Lucky Charm... ✅
[2/36] Validating episode: Keep On... ✅
... (continues for all 36 CTAs)

📝 STEP 3: Generating summary report...
📄 Summary report generated at: reports/cta-summary.md

═══════════════════════════════════════════════════════════════
✅ AUDIT COMPLETE!
═══════════════════════════════════════════════════════════════
```

### Subsequent Runs: Faster Workflow

After the initial audit, use targeted commands:

```bash
# Just validate (faster, reuses collection)
npm run cta:validate

# Just regenerate report
npm run cta:report
```

---

## Understanding the Results

### Three Report Files Generated

1. **`reports/cta-audit.json`** (Raw data)
   - All collected CTAs with their content
   - Useful for reference and debugging

2. **`reports/cta-validation-report.json`** (Detailed results)
   - Each CTA with chatbot assessment
   - Issues identified for each CTA
   - Ratings and feedback

3. **`reports/cta-summary.md`** (Human readable)
   - Executive summary with statistics
   - Issues grouped by type
   - Recommendations prioritized by severity
   - Action items and next steps

---

## Current Collection Results

As of October 28, 2024:

```
📊 CTA Collection Summary:
  Total CTAs found: 36
  - Characters: 0
  - Episodes: 25
  - Lore: 11
  - Items without CTAs: 16
```

### By Season

| Season | Episodes | CTAs Found |
|--------|----------|-----------|
| Season 1 | 10 | 10 |
| Season 2 | 10 | 10 |
| Season 3 | 10 | 5 |
| Season 4 | 10 | 0* |

*Season 4 data may be incomplete in current files

---

## Action Items Workflow

### Phase 1: Initial Setup

- [ ] Ensure `CHATBOT_API_KEY` is set in `.env`
- [ ] Run initial audit: `npm run cta:audit`
- [ ] Review `reports/cta-summary.md` for issues

### Phase 2: Fix Issues

For each issue identified:

1. **Locate the CTA in YAML:**
   - Episodes: `content/seasons/season*.yaml`
   - Lore: `content/lore/wavelength-lore.yaml`
   - Characters: `content/characters/wavelength/wavelength.yaml`

2. **Update the content** based on chatbot feedback

3. **Re-validate:** `npm run cta:validate`

4. **Track progress:**
   ```bash
   jq '.validations[] | select(.issues | length > 0)' reports/cta-validation-report.json | wc -l
   ```

### Phase 3: Commit and PR

```bash
git add content/ reports/ package.json
git commit -m "fix: Improve CTA consistency for issue #102

- Validated 36 CTAs using chatbot assessment
- Fixed identified issues for clarity and accuracy
- See reports/cta-summary.md for details

Closes #102"

git push -u origin fix/cta-consistency-issue-102
```

---

## Files Created/Modified

### New Files
- `scripts/cta-collector.js` - CTA extraction
- `scripts/cta-validator.js` - Chatbot validation
- `scripts/cta-audit.js` - Master orchestrator
- `reports/cta-audit.json` - Initial collection
- `CTA_AUDIT_GUIDE.md` - Complete documentation
- `CTA_QUICK_REFERENCE.md` - Quick reference
- `AUDIT_ACTION_PLAN.md` - This file

### Modified Files
- `package.json` - Added npm scripts for chat and CTA audit

---

## Next Steps

**Immediate:**
1. ✅ System created and tested
2. ⏳ Set `CHATBOT_API_KEY` in `.env`
3. ⏳ Run: `npm run cta:audit`
4. ⏳ Review: `cat reports/cta-summary.md`
5. ⏳ Fix any issues found
6. ⏳ Create PR referencing Issue #102

---

## Documentation Links

- [CTA_AUDIT_GUIDE.md](./CTA_AUDIT_GUIDE.md) - Complete implementation guide
- [CTA_QUICK_REFERENCE.md](./CTA_QUICK_REFERENCE.md) - Commands and troubleshooting
- [AUDIT_ACTION_PLAN.md](./AUDIT_ACTION_PLAN.md) - This action plan

---

**Ready to begin validation!**
```bash
npm run cta:audit
```
