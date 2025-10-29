# CTA Audit - Quick Reference

## Commands

```bash
# Full audit (collect + validate + report)
npm run cta:audit

# Just collect CTAs
npm run cta:collect

# Just validate (requires prior collection)
npm run cta:validate

# Just generate summary report
npm run cta:report

# Interactive chat CLI
npm run chat
npm run chat:cli

# Inspect collection results
cat reports/cta-audit.json
jq '.stats' reports/cta-audit.json

# View summary report
cat reports/cta-summary.md

# View validation issues
jq '.issues_summary' reports/cta-validation-report.json
```

## Setup

```bash
# 1. Set environment variable
echo "CHATBOT_API_KEY=your_key_here" >> .env

# 2. Run first audit
npm run cta:audit

# 3. Check results
cat reports/cta-summary.md
```

## Fix Workflow

1. **Run audit**
   ```bash
   npm run cta:audit
   ```

2. **Review issues**
   ```bash
   cat reports/cta-summary.md
   ```

3. **Edit YAML files**
   - `content/seasons/season*.yaml` - Episode CTAs
   - `content/characters/wavelength/wavelength.yaml` - Character CTAs
   - `content/lore/wavelength-lore.yaml` - Lore CTAs

4. **Re-validate**
   ```bash
   npm run cta:validate
   ```

5. **Commit changes**
   ```bash
   git add content/ reports/
   git commit -m "fix: Improve CTA consistency (issue #102)"
   ```

## Report Files

| File | Purpose |
|------|---------|
| `reports/cta-audit.json` | Raw collection data |
| `reports/cta-validation-report.json` | Detailed validation results |
| `reports/cta-summary.md` | Human-readable summary |

## CTA Fields by Type

### Episodes (seasons/season*.yaml)
```yaml
episodes:
  episode1:
    cta_tagline: "Hook question that makes viewers curious"
    cliffhanger_hook: "The dramatic ending that sets up next episode"
    next_episode_tease: "Preview of what's coming next"
```

### Lore (lore/wavelength-lore.yaml)
```yaml
nature:
  - id: item-id
    title: "Item Name"
    intrigue_hook: "Question to spark interest"
    CTA_HOOK: "Alternative hook format"
    enhanced_title: "Enriched description with storytelling"
```

### Characters (characters/wavelength/wavelength.yaml)
```yaml
- id: character-id
  title: "Character Name"
  cta_text: "Action button text"
  tagline: "Short character hook"
  stakes: "What the character has at risk"
```

## Evaluation Criteria

The chatbot checks:
- ✅ **Consistency** - Matches established lore
- ✅ **Accuracy** - Correctly represents the subject
- ✅ **Clarity** - Clear and understandable
- ✅ **Engagement** - Compelling and interesting

## Common Fixes

| Issue | Fix |
|-------|-----|
| "Unclear" | Rewrite with specific story references |
| "Inconsistent" | Align with character/episode description |
| "Weak" | Add more dramatic or compelling language |
| "Misleading" | Ensure CTA accurately represents content |

## Issues List

Run this to see all issues:
```bash
jq '.validations[] | select(.issues | length > 0) | {title, issues, assessment: .chatbot_assessment[0:100]}' reports/cta-validation-report.json
```

## Performance Notes

- **Collection:** ~5 seconds
- **Validation:** ~2 seconds per CTA (includes rate limiting)
- **Current:** 36 CTAs = ~12-15 minutes total
- **Interrupting:** Press Ctrl+C anytime; re-run to resume

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `CHATBOT_API_KEY not set` | Add to `.env` file |
| Audit file not found | Run `npm run cta:collect` first |
| API timeout | Run `npm run cta:validate` again |
| Permission denied | Check file permissions on scripts |

## Integration with Issue #102

This system directly addresses GitHub Issue #102: CTA Validation

**Include in PR:**
- Reference the issue: `Closes #102`
- Attach summary: Copy sections from `reports/cta-summary.md`
- Show improvements: Compare before/after validation results

---

**See [CTA_AUDIT_GUIDE.md](./CTA_AUDIT_GUIDE.md) for complete documentation**
