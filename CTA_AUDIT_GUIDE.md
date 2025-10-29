# Wavelength Lore CTA Audit Guide

## Overview

The CTA (Call-to-Action) Audit system is designed to systematically review and validate all call-to-action elements across the Wavelength Lore database for consistency with the established lore canon. This addresses **Issue #102: CTA Validation**.

### What Gets Audited?

- **Episodes:** `cta_tagline`, `cliffhanger_hook`, `next_episode_tease`
- **Characters:** `cta_text`, `tagline`, `stakes`
- **Lore:** `intrigue_hook`, `enhanced_title`, `CTA_HOOK`

The audit uses the Wavelength AI chatbot to evaluate each CTA for:
1. **Consistency** - Does it align with established lore?
2. **Accuracy** - Does it correctly represent the character/episode/lore element?
3. **Quality** - Is the messaging clear and compelling?

---

## Quick Start

### 1. Run Full Audit (Recommended First Time)

```bash
npm run cta:audit
```

This will:
- ✅ Collect all CTAs from YAML files
- ✅ Validate each CTA against the lore using the chatbot
- ✅ Generate detailed reports
- ✅ Create a summary markdown document

**Estimated Time:** 15-30 minutes depending on CTA count

### 2. Run Individual Steps

#### Collect Only
```bash
npm run cta:collect
```
Scans all content files and extracts CTAs. Useful for reviewing what will be validated without running the full audit.

#### Validate Only
```bash
npm run cta:validate
```
Validates previously collected CTAs. Use this to re-validate after making changes.

#### Report Only
```bash
npm run cta:report
```
Regenerates the summary markdown report from existing validation data.

---

## Setup Requirements

### 1. Set Chatbot API Key

The validation step requires access to the Wavelength chatbot API. Set up your `.env` file:

```bash
# .env
CHATBOT_API_KEY=your_api_key_here
# CHATBOT_URL=us-central1-wavelength-lore.cloudfunctions.net  # Optional, defaults to this
```

**How to get the API Key:**
- Check your Firebase Cloud Functions configuration
- Ask a project maintainer for the key
- The key should be kept secret and never committed to git

### 2. Verify Dependencies

The scripts use dependencies already in your `package.json`:
- `js-yaml` - For reading YAML files
- `axios` - For API calls to the chatbot

---

## Understanding the Reports

After running the audit, you'll find three report files in the `reports/` directory:

### 1. **cta-audit.json** (Collection Results)

Contains all collected CTAs and basic statistics:

```json
{
  "timestamp": "2024-10-28T12:34:56.789Z",
  "stats": {
    "total": 36,
    "characters": 0,
    "episodes": 25,
    "lore": 11,
    "empty": 16
  },
  "ctas": [
    {
      "type": "episode",
      "id": "episode1",
      "title": "My Lucky Charm",
      "season": "1",
      "source": "seasons/season1.yaml",
      "cta_tagline": "What happens when music awakens ancient vengeance?",
      "cliffhanger_hook": "But when the Goblin King hears Wavelength's innocent lyrics...",
      "next_episode_tease": "The adventure continues as Wavelength faces the consequences..."
    }
    // ... more CTAs
  ]
}
```

### 2. **cta-validation-report.json** (Detailed Validation Results)

Complete validation results for each CTA:

```json
{
  "timestamp": "2024-10-28T12:34:56.789Z",
  "summary": {
    "total_ctas": 36,
    "successfully_validated": 36,
    "with_issues": 3,
    "validation_errors": 0,
    "success_rate": "100.00%"
  },
  "validations": [
    {
      "id": "episode-episode1",
      "type": "episode",
      "title": "My Lucky Charm",
      "source": "seasons/season1.yaml",
      "cta_content": {
        "cta_tagline": "What happens when music awakens ancient vengeance?",
        "cliffhanger_hook": "But when the Goblin King hears Wavelength's innocent lyrics...",
        "next_episode_tease": "The adventure continues as Wavelength faces the consequences..."
      },
      "chatbot_assessment": "This CTA is excellent. It captures the tension between...",
      "timestamp": "2024-10-28T12:34:56.789Z",
      "issues": []
    }
    // ... validations for each CTA
  ],
  "issues_summary": {
    "episode": [
      {
        "title": "Example Episode Title",
        "issues": ["unclear", "misleading"],
        "assessment": "This CTA doesn't clearly convey the episode's core conflict..."
      }
    ]
  },
  "recommendations": [
    {
      "priority": "high",
      "action": "Review CTAs with flagged issues",
      "count": 3,
      "details": "CTAs marked with issues should be reviewed and revised..."
    }
  ]
}
```

### 3. **cta-summary.md** (Executive Summary)

A human-readable markdown report highlighting:
- Overall statistics
- Issues identified (grouped by type)
- Recommendations prioritized by importance
- Next steps for remediation

**Example:**
```markdown
# Wavelength Lore CTA Audit Report

**Generated:** 2024-10-28T12:34:56.789Z

## Summary

- **Total CTAs Evaluated:** 36
- **Successfully Validated:** 36
- **With Issues:** 3
- **Success Rate:** 100%

## Issues Identified

### Episode Issues (2)

**Episode Title Here**
- Issues: unclear, misleading
- Assessment: This CTA doesn't clearly convey...

## Recommendations

### [HIGH] Review CTAs with flagged issues
- Count: 3
- Details: CTAs marked with issues should be reviewed...
```

---

## Workflow: How to Fix Issues

### Step 1: Review the Summary Report

```bash
cat reports/cta-summary.md
```

Identify which CTAs have issues and understand the feedback.

### Step 2: Review Detailed Assessment

Open `reports/cta-validation-report.json` and search for CTAs with issues:

```json
"issues": ["unclear", "misleading"],
"chatbot_assessment": "This CTA doesn't clearly convey the episode's core conflict..."
```

### Step 3: Update CTA Content

Edit the YAML file for the problematic CTA:

**For Episodes:**
```yaml
# content/seasons/season1.yaml
episodes:
  episode1:
    cta_tagline: "Updated and improved CTA text here..."
    cliffhanger_hook: "Better phrasing of the hook..."
```

**For Lore:**
```yaml
# content/lore/wavelength-lore.yaml
nature:
  - id: daphne-flower
    intrigue_hook: "Updated intriguing question here..."
    enhanced_title: "Improved title and description..."
```

### Step 4: Re-run Validation

```bash
npm run cta:validate
```

This re-validates only the collected CTAs (much faster than collection).

### Step 5: Check Results

```bash
cat reports/cta-summary.md
```

Verify that the issues have been resolved.

---

## Common Issues & Solutions

### Issue: "CHATBOT_API_KEY not set"

**Error Message:**
```
Error: CHATBOT_API_KEY environment variable not set
```

**Solution:**
1. Create or update `.env` file in project root
2. Add: `CHATBOT_API_KEY=your_key_here`
3. Verify the key is valid
4. Re-run the validation

### Issue: "Inconsistent with lore"

**Problem:** A CTA contradicts established story elements

**Solution:**
1. Review the `chatbot_assessment` in the report
2. Consult the character/lore/episode descriptions
3. Ensure the CTA accurately reflects the canon
4. Update the CTA text to match the established narrative

### Issue: "Unclear or confusing"

**Problem:** The CTA messaging is ambiguous

**Solution:**
1. Make the CTA more direct and specific
2. Reference concrete story elements instead of vague language
3. Ensure it poses a clear question or call-to-action
4. Keep taglines concise (5-8 words ideal)

### Issue: Validation errors or timeouts

**Problem:** Some CTAs failed to validate (network/API issues)

**Solution:**
```bash
# Retry validation
npm run cta:validate
```

The script will re-validate only the failed CTAs.

---

## Integration with GitHub

### Linking to Issue #102

This audit system directly addresses:
- **GitHub Issue:** #102 - CTA Validation
- **Goal:** Systematically validate all CTAs for consistency with lore

### Workflow Integration

1. **Create a PR with CTA fixes**
   ```bash
   git checkout -b fix/cta-consistency-issue-102
   npm run cta:audit
   # Review reports/cta-summary.md
   # Make necessary updates to YAML files
   git add content/ reports/
   git commit -m "fix: Improve CTA consistency for issue #102"
   git push
   ```

2. **Link PR to Issue**
   - Include `Closes #102` or `Fixes #102` in PR description

3. **Include Report in PR**
   - Reference the `cta-summary.md` in the PR
   - Copy relevant sections into the PR description
   - Show before/after validation results

---

## Script Architecture

### cta-collector.js
Scans all YAML files under `content/` and extracts CTA content:
- Reads character definitions
- Reads episode data from season files
- Reads lore entries
- Saves collected data to `reports/cta-audit.json`

### cta-validator.js
Uses the Wavelength chatbot API to validate each CTA:
- Builds context-aware prompts for the chatbot
- Sends each CTA for evaluation
- Captures chatbot assessment and ratings
- Identifies issues based on response keywords
- Saves detailed results to `reports/cta-validation-report.json`

### cta-audit.js (Master Script)
Orchestrates the collection, validation, and reporting:
- Handles command routing (`collect`, `validate`, `report`, `audit`)
- Manages rate limiting during validation
- Generates human-readable markdown summary
- Provides helpful error messages

---

## Advanced Usage

### Custom Chatbot URL

If using a non-default chatbot endpoint:

```bash
CHATBOT_URL=custom-url.cloudfunctions.net npm run cta:audit
```

### Batch Testing Specific Types

The scripts validate all CTAs at once, but you can manually inspect specific types:

```bash
# View just episode CTAs
jq '.ctas[] | select(.type == "episode")' reports/cta-audit.json | head -20
```

### Dry Run (Collection Only)

To preview what will be validated without hitting the API:

```bash
npm run cta:collect
cat reports/cta-audit.json
```

Then decide if you want to proceed with validation.

---

## Maintenance & Updates

### Updating YAML Files

When you add new CTAs to YAML files:
1. Run collection again: `npm run cta:collect`
2. New CTAs will be included in the next validation
3. Run validation: `npm run cta:validate`

### Periodic Audits

Schedule regular audits to maintain consistency:
- **Weekly:** For active development
- **Before Release:** Essential validation
- **After Major Updates:** Whenever significant lore changes occur

### Archiving Reports

Keep historical reports for tracking improvements:

```bash
mkdir -p reports/archive
cp reports/cta-* reports/archive/cta-audit-2024-10-28.json
```

---

## FAQ

**Q: How long does the full audit take?**
A: Depends on CTA count and API latency, typically 15-30 minutes for ~36 CTAs.

**Q: Can I interrupt the validation?**
A: Yes, press `Ctrl+C`. Previously validated CTAs will be saved. Re-run to continue.

**Q: Do I need to validate every time I make changes?**
A: No, only when you want to check new/updated CTAs. Use `npm run cta:validate` for incremental updates.

**Q: Can I share these reports?**
A: Yes! The JSON files contain structured data. The markdown summary is designed for sharing in PRs and documentation.

**Q: How do I handle false positives?**
A: Review the chatbot's assessment carefully. If the feedback is incorrect, you can manually verify the CTA and proceed with the current version.

---

## Support

For issues or questions:
1. Check this guide's FAQ and troubleshooting sections
2. Review the detailed assessment in `cta-validation-report.json`
3. Open an issue on GitHub with the relevant report sections
4. Contact the project maintainers

---

**Last Updated:** October 28, 2024
**Version:** 1.0
