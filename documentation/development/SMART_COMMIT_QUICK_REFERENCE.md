# 🤖 Smart Commit System - Quick Reference

## Overview
The Smart Commit System prevents git commit message failures by using file-based messages instead of shell command-line arguments.

## 🚀 Quick Start

### Basic Usage
```bash
# Simple commit with existing message
node scripts/unified/smart-commit.js

# Interactive mode (recommended)
node scripts/unified/smart-commit.js --interactive

# Edit message and push
node scripts/unified/smart-commit.js --edit --push
```

### Message Files (checked in order)
1. `commit-message.txt`
2. `.commit-message.txt` 
3. `COMMIT_MESSAGE.txt`

## 📋 Command Options

| Option | Short | Description |
|--------|-------|-------------|
| `--interactive` | `-i` | Interactive mode with confirmations |
| `--edit` | `-e` | Open editor for commit message |
| `--push` | `-p` | Automatically push after commit |
| `--no-stage` | | Don't stage changes automatically |
| `--force` | | Commit even if no changes detected |
| `--help` | `-h` | Show help |

## 📝 Message Template

When no message file exists, the system creates this template:

```
🎨 Add amazing new feature

✨ Features:
- Feature 1: Description
- Feature 2: Description

🔧 Technical Implementation:
- Technical detail 1
- Technical detail 2

📚 Documentation:
- Updated README
- Added examples

# Lines starting with # are comments and will be ignored
# 
# Common emoji prefixes:
# 🎨 Features/UI improvements
# 🔧 Technical changes/fixes  
# 📚 Documentation
# 🚀 Performance improvements
# 🔒 Security updates
# 🧹 Code cleanup/refactoring
# 🐛 Bug fixes
# ✅ Tests
# 🔄 CI/CD changes
```

## 🛡️ Safety Features

### 1. Package.json Validation
- Checks package.json integrity before commit
- Attempts automatic recovery if corrupted
- Prevents commits with broken dependencies

### 2. Message Validation
- Removes comment lines (starting with #)
- Strips trailing whitespace
- Validates message is not empty
- Preserves intentional formatting

### 3. Change Detection
- Checks for unstaged changes
- Shows git diff preview
- Confirms before committing

## 💡 Workflow Examples

### Daily Development
```bash
# 1. Make your changes
# 2. Run smart commit
node scripts/unified/smart-commit.js -i

# System will:
# - Check package.json health
# - Stage all changes  
# - Show diff preview
# - Use existing commit message or create template
# - Ask for confirmation
# - Commit and optionally push
```

### Complex Feature Commit
```bash
# 1. Create detailed commit message
echo "🎨 FEAT: Advanced user authentication system

✨ New Features:
- OAuth 2.0 integration with Google/GitHub
- Multi-factor authentication support
- Session management with Redis
- Password strength validation

🔧 Technical Implementation:
- JWT token-based authentication
- Encrypted password storage with bcrypt
- Rate limiting for login attempts
- Audit logging for security events

📚 Documentation:
- Updated API documentation
- Added authentication guide
- Security best practices doc

This commit implements a comprehensive authentication system
that supports modern security practices and multiple identity
providers while maintaining backward compatibility." > commit-message.txt

# 2. Commit with smart system
node scripts/unified/smart-commit.js --push
```

### Emergency Fixes
```bash
# Quick fix with simple message
echo "🐛 Fix critical security vulnerability in auth middleware" > commit-message.txt
node scripts/unified/smart-commit.js --force --push
```

## ⚠️ When NOT to Use Smart Commit

### Simple Single-Line Messages
These are safe for direct git commit:
```bash
git commit -m "Fix typo"
git commit -m "Update README"
git commit -m "Bump version to 1.2.3"
```

### Automated Scripts/CI
For automated commits, consider using git directly:
```bash
git commit -m "chore: automated dependency update"
```

## 🔧 Environment Setup

### Required
- Node.js
- Git repository
- Text editor (set via `EDITOR` or `VISUAL` environment variables)

### Optional Environment Variables
```bash
export EDITOR=code          # Use VS Code
export EDITOR=nano          # Use nano (default)
export VISUAL=vim           # Alternative editor
```

## 🚨 Troubleshooting

### "No changes to commit"
```bash
# Check git status
git status

# Force commit anyway
node scripts/unified/smart-commit.js --force
```

### "Commit message is empty"
```bash
# Edit the message file
nano commit-message.txt

# Or use interactive mode
node scripts/unified/smart-commit.js --edit
```

### "package.json corrupted"
```bash
# System will attempt auto-recovery
# If that fails, restore from backup:
cp package.json.backup package.json
```

## 📊 Success Indicators

When smart commit runs successfully, you'll see:
```
🤖 Smart Git Commit Tool

🛡️ Validating package.json integrity...
✅ package.json is healthy
📦 Staging all changes...
✅ All changes staged
📊 Changes staged for commit
📝 Commit message:
────────────────────────────────────
[Your commit message here]
────────────────────────────────────
🚀 Committing changes...
✅ Commit successful!
📋 abc1234 Your commit message first line
```

## 🎯 Best Practices

1. **Use Interactive Mode** (`-i`) for important commits
2. **Review Changes** before committing
3. **Write Descriptive Messages** with emojis and structure
4. **Test Package.json** integrity is maintained
5. **Push Regularly** to share your work

---

*Quick Reference for the Smart Commit System - preventing git commit message failures since 2025* 🚀