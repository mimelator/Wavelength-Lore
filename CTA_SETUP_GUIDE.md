# CTA Audit Setup Guide

## Overview

The CTA Audit system requires a `CHATBOT_API_KEY` to validate your CTAs. This guide shows you the easy ways to set it up without remembering bash syntax.

---

## Quick Setup (Recommended)

### Option 1: Interactive Setup Wizard (Easiest)

```bash
npm run cta:setup -- --interactive
```

This will prompt you to enter your API key and save it automatically to `.env`.

**Steps:**
1. Run the command above
2. Paste your API key when prompted
3. Press Enter
4. Done! ✅

### Option 2: Direct Command

```bash
npm run cta:setup -- --add-key YOUR_ACTUAL_KEY_HERE
```

Replace `YOUR_ACTUAL_KEY_HERE` with your actual API key.

### Option 3: Check Configuration

```bash
npm run cta:setup -- --check
```

This shows whether your API key is properly configured:

```
📋 Current Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHATBOT_API_KEY is configured (66 chars, ...2c0")
ℹ️  CHATBOT_URL: Using default
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Manual Setup (If Needed)

### Edit .env File Directly

1. Open `.env` in your editor
2. Find or add this line:
   ```
   CHATBOT_API_KEY=your_actual_key_here
   ```
3. Replace `your_actual_key_here` with your real API key
4. Save the file

**Example:**
```
CHATBOT_API_KEY=sk-proj-abc123xyz789...
CHATBOT_URL=us-central1-wavelength-lore.cloudfunctions.net
```

---

## Available Setup Commands

| Command | Purpose |
|---------|---------|
| `npm run cta:setup` | Check current status |
| `npm run cta:setup -- --check` | Verify API key |
| `npm run cta:setup -- --interactive` | Interactive wizard |
| `npm run cta:setup -- --add-key <key>` | Set key directly |
| `npm run cta:setup -- --help` | Show help |

---

## Getting Your API Key

Your `CHATBOT_API_KEY` should be:
- At least 10 characters long
- Stored securely in `.env` (never commit to git)
- Available from your Firebase Cloud Functions setup

**Where to find it:**
1. Go to Firebase Console
2. Navigate to Cloud Functions
3. Find the chatbot function
4. Copy the API key from environment variables or authentication settings

---

## Verification

After setting up, verify your configuration:

```bash
npm run cta:setup -- --check
```

You should see:
```
✅ CHATBOT_API_KEY is configured
```

---

## Automatic Validation

The validation scripts now automatically check your setup before running:

```bash
npm run cta:validate
```

If your API key is missing or invalid, you'll see:
```
❌ Setup validation failed
Run: npm run cta:setup -- --interactive
```

The script will guide you through setup.

---

## Troubleshooting

### "API key not found"

Run:
```bash
npm run cta:setup -- --interactive
```

Then paste your key when prompted.

### "API key appears too short"

Check that you copied the full key. API keys are typically 40+ characters.

### "Still getting errors after setup"

1. Verify the key in `.env`:
   ```bash
   npm run cta:setup -- --check
   ```

2. Make sure you're in the correct directory:
   ```bash
   pwd  # Should end with Wavelength-Lore.fresh
   ```

3. Try setting it again with the interactive wizard:
   ```bash
   npm run cta:setup -- --interactive
   ```

---

## Environment Variables

### Required

```
CHATBOT_API_KEY=your_key_here
```

This is required for CTA validation to work.

### Optional

```
CHATBOT_URL=custom-url.cloudfunctions.net
```

If not set, defaults to: `us-central1-wavelength-lore.cloudfunctions.net`

---

## Using .env.example

To create a template file:

```bash
npm run cta:setup -- --example
```

This creates `.env.example` showing what variables are needed.

---

## Security Notes

⚠️ **Important:**
- Never commit `.env` to git (it's in `.gitignore`)
- Never share your API key
- Treat it like a password
- Rotate keys periodically

---

## Next Steps

After setup:

1. **Check configuration:**
   ```bash
   npm run cta:setup -- --check
   ```

2. **Collect CTAs:**
   ```bash
   npm run cta:collect
   ```

3. **Validate CTAs:**
   ```bash
   npm run cta:validate
   ```

4. **Review results:**
   ```bash
   cat reports/cta-summary.md
   ```

---

## Support

If you need help:

1. Check this guide's troubleshooting section
2. Run the help command:
   ```bash
   npm run cta:setup -- --help
   ```
3. See [CTA_AUDIT_GUIDE.md](./CTA_AUDIT_GUIDE.md) for complete documentation

---

**That's it! No bash syntax to remember.** 🎉
