# Smart Git Commit System

A sophisticated commit management system that uses ignored commit message files for better commit practices.

## 🚀 Quick Start

```bash
# Quick commit (uses existing commit-message.txt)
./scripts/commit

# Interactive mode with confirmations
./scripts/commit -i

# Edit commit message in your editor
./scripts/commit -e

# Edit, commit, and push in one go
./scripts/commit -e -p

# Full interactive workflow
./scripts/commit --interactive --push
```

## 📋 Features

### 🎯 **Smart Message Management**
- Uses `commit-message.txt` (ignored by git)
- Automatic template generation with structured format
- Support for multiple message file locations
- Comment support (lines starting with `#`)

### ✏️ **Editor Integration**
- Opens your preferred editor (`$EDITOR` or `$VISUAL`)
- Supports any terminal editor (nano, vim, emacs, etc.)
- Intelligent message validation and cleanup

### 🔄 **Intelligent Workflow**
- Automatically stages all changes
- Shows diff preview before committing
- Optional interactive confirmations
- Automatic push option
- Handles empty repositories and edge cases

### 📝 **Rich Commit Messages**
- Emoji-prefixed sections for visual clarity
- Structured format: Features, Technical, Documentation, Use Cases
- Comment-based guidelines and examples
- Professional, detailed commit history

## 📁 Commit Message Files

The script checks for these files in order:
1. `commit-message.txt` (recommended)
2. `.commit-message.txt` 
3. `COMMIT_MESSAGE.txt`

All are automatically added to `.gitignore`.

## 🎨 Message Template

When no message file exists, the script creates this template:

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

🎯 Use Cases:
- Use case 1
- Use case 2

💡 Configuration:
- Environment variables
- Setup instructions

This commit adds [brief summary] to improve [area of improvement].

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

## 🛠️ Usage Examples

### Basic Workflow
```bash
# 1. Write your commit message
echo "🎨 Add new feature

✨ Features:
- Added user authentication
- Enhanced security

This commit improves user management." > commit-message.txt

# 2. Commit with the message
./scripts/commit
```

### Interactive Workflow
```bash
# Interactive mode guides you through each step
./scripts/commit -i

# Output:
# 🤖 Smart Git Commit Tool
# 📋 Changes to commit: [shows file list]
# 📝 Commit message: [shows preview]
# 📊 Current changes: [shows diff]
# Proceed with commit? (y/N): y
# ✅ Commit successful!
# Push to remote? (y/N): y
# ✅ Pushed to remote
```

### Editor Integration
```bash
# Open your editor to write/edit the commit message
./scripts/commit -e

# Set your preferred editor
export EDITOR=code  # VS Code
export EDITOR=vim   # Vim
export EDITOR=nano  # Nano (default)
```

## ⚙️ Configuration

### Environment Variables
- `EDITOR`: Your preferred editor (default: nano)
- `VISUAL`: Alternative editor setting

### Command Line Options
- `--edit, -e`: Open editor for commit message
- `--interactive, -i`: Interactive mode with confirmations
- `--push, -p`: Automatically push after commit
- `--no-stage`: Don't stage changes automatically
- `--force`: Commit even if no changes detected
- `--help, -h`: Show help

## 🎯 Best Practices

### 1. **Structured Messages**
Use the template sections to organize your commit:
- **Features**: What new functionality was added
- **Technical**: How it was implemented
- **Documentation**: What docs were updated
- **Use Cases**: Why this change matters
- **Configuration**: Any setup changes needed

### 2. **Emoji Prefixes**
- 🎨 Features/UI improvements
- 🔧 Technical changes/fixes
- 📚 Documentation updates
- 🚀 Performance improvements
- 🔒 Security updates
- 🧹 Code cleanup/refactoring
- 🐛 Bug fixes
- ✅ Tests
- 🔄 CI/CD changes

### 3. **Detailed Descriptions**
- Explain what changed and why
- Include technical details for complex changes
- Mention any breaking changes
- Add configuration notes if needed

### 4. **Workflow Integration**
```bash
# Daily development workflow
echo "🔧 Fix user authentication bug

🐛 Bug Fix:
- Fixed session timeout issue
- Added proper error handling

Technical details..." > commit-message.txt

./scripts/commit -p  # Commit and push
```

## 🔗 Integration

### With VS Code
Add to your VS Code settings:
```json
{
  "terminal.integrated.shellArgs.osx": ["-c", "cd /path/to/project && ./scripts/commit -i"]
}
```

### With Git Aliases
```bash
# Add to ~/.gitconfig
[alias]
  sc = !cd $(git rev-parse --show-toplevel) && ./scripts/commit
  sci = !cd $(git rev-parse --show-toplevel) && ./scripts/commit -i
  scp = !cd $(git rev-parse --show-toplevel) && ./scripts/commit -p
```

### As a Global Tool
```bash
# Make it available globally
ln -s $(pwd)/scripts/smart-commit.js /usr/local/bin/smart-commit
chmod +x /usr/local/bin/smart-commit

# Use anywhere
smart-commit -i
```

## 🧹 Maintenance

The system automatically:
- Cleans up temporary files
- Validates commit messages
- Handles empty messages gracefully
- Removes comment lines
- Trims whitespace

## 🤖 Advanced Features

### Batch Operations
```bash
# Commit multiple related changes
./scripts/commit --force  # Even with no changes
```

### CI/CD Integration
```bash
# Non-interactive for automated environments
export CI=true
./scripts/commit  # Skips interactive prompts
```

### Custom Templates
Create your own template in `commit-message.txt`:
```bash
# Your custom format
echo "🚀 Release v1.2.3

## Changes
- Change 1
- Change 2

## Notes
- Note 1" > commit-message.txt
```

This smart commit system ensures consistent, professional, and detailed commit messages while streamlining your development workflow!