#!/usr/bin/env node

/**
 * Smart Git Commit Script
 * Always uses a commit message from a file that's in .gitignore
 * Supports different commit message files and templates
 */

import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import PackageProtector from './package-protector.js';

const execAsync = promisify(exec);

class SmartCommit {
  constructor() {
    // Fix: Point to the actual project root (two levels up from scripts/unified/)
    // ES module __dirname equivalent
    const __filename = new URL(import.meta.url).pathname;
    const __dirname = path.dirname(__filename);
    this.projectRoot = path.resolve(__dirname, '..', '..');
    this.commitMessageFiles = [
      'commit-message.txt',
      '.commit-message.txt', 
      'COMMIT_MESSAGE.txt'
    ];
    this.defaultEditor = process.env.EDITOR || process.env.VISUAL || 'nano';
    this.protector = new PackageProtector();
  }

  /**
   * Find the commit message file
   */
  findCommitMessageFile() {
    for (const filename of this.commitMessageFiles) {
      const filePath = path.join(this.projectRoot, filename);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  }

  /**
   * Create a template commit message file
   */
  createTemplate(filePath) {
    const template = `🎨 Add amazing new feature

✨ Features:
- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

🔧 Technical Implementation:
- Technical detail 1
- Technical detail 2
- Configuration changes

📚 Documentation:
- Updated README
- Added examples
- API documentation

🎯 Use Cases:
- Use case 1
- Use case 2
- Integration scenarios

💡 Configuration:
- Environment variables
- Setup instructions
- Dependencies

This commit adds [brief summary] to improve [area of improvement].

# Lines starting with # are comments and will be ignored
# 
# Commit Message Guidelines:
# - Use emoji prefixes for visual clarity
# - Include sections: Features, Technical, Documentation, Use Cases
# - Be specific about what changed and why
# - Mention any breaking changes
# - Include configuration or setup notes
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
`;

    fs.writeFileSync(filePath, template);
    console.log(`📝 Created commit message template: ${filePath}`);
    return filePath;
  }

  /**
   * Open the commit message file in an editor
   */
  async openEditor(filePath) {
    console.log(`✏️  Opening commit message in ${this.defaultEditor}...`);
    console.log(`💡 Edit the message, save and close to continue`);
    
    return new Promise((resolve, reject) => {
      const editor = spawn(this.defaultEditor, [filePath], {
        stdio: 'inherit'
      });

      editor.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Editor closed successfully');
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });

      editor.on('error', (error) => {
        reject(new Error(`Failed to open editor: ${error.message}`));
      });
    });
  }

  /**
   * 🛡️ Security Scanner for Credentials
   */
  scanForCredentials(text) {
    const patterns = [
      { type: 'aws_access_key', pattern: /AKIA[0-9A-Z]{16}/g, description: 'AWS Access Key' },
      { type: 'aws_secret_key', pattern: /[A-Za-z0-9/+=]{40}/g, description: 'AWS Secret Key' },
      { type: 'slack_token', pattern: /xox[baprs]-[0-9a-zA-Z-]+/g, description: 'Slack Token' },
      { type: 'stripe_key', pattern: /sk_live_[0-9a-zA-Z]{24}/g, description: 'Stripe Live Key' },
      { type: 'google_api_key', pattern: /AIza[0-9A-Za-z-_]{35}/g, description: 'Google API Key' },
      { type: 'github_token', pattern: /ghp_[A-Za-z0-9]{36}/g, description: 'GitHub Personal Access Token' },
      { type: 'jwt_token', pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, description: 'JWT Token' }
    ];
    
    const findings = [];
    patterns.forEach(({ type, pattern, description }) => {
      const matches = text.match(pattern);
      if (matches) {
        findings.push({
          type,
          description,
          count: matches.length,
          samples: matches.slice(0, 3).map(match => match.substring(0, 10) + '...')
        });
      }
    });
    
    return findings;
  }

  /**
   * 🛡️ Scan staged files for credentials
   */
  async scanStagedFiles() {
    try {
      // Get list of staged files
      const { stdout } = await execAsync('git diff --cached --name-only', {
        cwd: this.projectRoot
      });
      
      const stagedFiles = stdout.trim().split('\n').filter(f => f.trim());
      if (stagedFiles.length === 0) {
        return [];
      }
      
      const allFindings = [];
      
      for (const file of stagedFiles) {
        try {
          // Get staged content of the file
          const { stdout: content } = await execAsync(`git show :"${file}"`, {
            cwd: this.projectRoot
          });
          
          const findings = this.scanForCredentials(content);
          if (findings.length > 0) {
            allFindings.push({ file, findings });
          }
        } catch (error) {
          // Skip files that can't be read (binary, deleted, etc.)
          continue;
        }
      }
      
      return allFindings;
    } catch (error) {
      console.warn('⚠️  Warning: Could not scan staged files for credentials:', error.message);
      return [];
    }
  }

  /**
   * Read and clean the commit message
   */
  readCommitMessage(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 🛡️ SECURITY: Scan commit message for credentials
    const credentialFindings = this.scanForCredentials(content);
    if (credentialFindings.length > 0) {
      console.error('🚨 SECURITY ALERT: Potential credentials found in commit message!');
      credentialFindings.forEach(finding => {
        console.error(`  - ${finding.description}: ${finding.count} occurrence(s)`);
        console.error(`    Samples: ${finding.samples.join(', ')}`);
      });
      throw new Error('Commit message contains potential credentials. Please remove them before committing.');
    }
    
    // Remove comment lines and empty lines at the end
    const lines = content.split('\n')
      .filter(line => !line.trim().startsWith('#'))
      .map(line => line.trimRight());
    
    // Remove trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    const message = lines.join('\n').trim();
    
    if (!message) {
      throw new Error('Commit message is empty after removing comments');
    }
    
    return message;
  }

  /**
   * Check if there are changes to commit
   */
  async checkForChanges() {
    try {
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: this.projectRoot
      });
      
      if (!stdout.trim()) {
        console.log('📭 No changes to commit');
        return false;
      }
      
      console.log('📋 Changes to commit:');
      console.log(stdout);
      return true;
    } catch (error) {
      throw new Error(`Failed to check git status: ${error.message}`);
    }
  }

  /**
   * Show git diff for review
   */
  async showDiff() {
    try {
      console.log('\n📊 Current changes:');
      await execAsync('git diff --cached --stat', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
    } catch (error) {
      // Ignore errors for diff
      console.log('📊 Changes staged for commit');
    }
  }

  /**
   * Stage all changes
   */
  async stageChanges() {
    try {
      console.log('📦 Staging all changes...');
      await execAsync('git add .', {
        cwd: this.projectRoot
      });
      console.log('✅ All changes staged');
    } catch (error) {
      throw new Error(`Failed to stage changes: ${error.message}`);
    }
  }

  /**
   * Commit with the message
   */
  async commitChanges(message) {
    try {
      console.log('🚀 Committing changes...');
      
      // Write message to a temporary file for git commit
      const tempFile = path.join(this.projectRoot, '.temp-commit-message');
      fs.writeFileSync(tempFile, message);
      
      await execAsync(`git commit -F "${tempFile}"`, {
        cwd: this.projectRoot
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      console.log('✅ Commit successful!');
      
      // Show the commit
      const { stdout } = await execAsync('git log -1 --oneline', {
        cwd: this.projectRoot
      });
      console.log(`📋 ${stdout.trim()}`);
      
    } catch (error) {
      throw new Error(`Failed to commit: ${error.message}`);
    }
  }

  /**
   * Confirm action with user
   */
  async confirm(message) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${message} (y/N): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * Main execution flow
   */
  async run(options = {}) {
    try {
      console.log('🤖 Smart Git Commit Tool\n');
      
      console.log('💡 TIP: Make sure commit-message.txt reflects your CURRENT work!');
      console.log('   Previous messages may not match your latest changes.\n');

      // Check for changes
      const hasChanges = await this.checkForChanges();
      if (!hasChanges && !options.force) {
        return;
      }

      // Validate package.json integrity
      console.log('🛡️ Validating package.json integrity...');
      const validation = this.protector.validate();
      if (!validation.valid) {
        console.error('❌ package.json corrupted! Attempting recovery...');
        const recovered = this.protector.emergencyRecover();
        if (!recovered) {
          throw new Error('package.json recovery failed. Cannot commit safely.');
        }
        console.log('✅ package.json recovered');
      } else {
        console.log('✅ package.json is healthy');
      }

      // Find or create commit message file
      let messageFile = this.findCommitMessageFile();
      
      if (!messageFile) {
        console.log('📝 No commit message file found, creating template...');
        messageFile = path.join(this.projectRoot, this.commitMessageFiles[0]);
        this.createTemplate(messageFile);
      }

      // Open editor if requested or if file is empty/template
      if (options.edit || options.interactive) {
        await this.openEditor(messageFile);
      }

      // Read commit message
      let message;
      try {
        message = this.readCommitMessage(messageFile);
      } catch (error) {
        if (options.interactive) {
          console.log('❌ ' + error.message);
          const shouldEdit = await this.confirm('Open editor to fix the message?');
          if (shouldEdit) {
            await this.openEditor(messageFile);
            message = this.readCommitMessage(messageFile);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      // 🛡️ SECURITY: Scan staged files for credentials
      console.log('\n🛡️ Scanning staged files for credentials...');
      const credentialFindings = await this.scanStagedFiles();
      
      if (credentialFindings.length > 0) {
        console.error('\n🚨 SECURITY ALERT: Potential credentials found in staged files!');
        credentialFindings.forEach(({ file, findings }) => {
          console.error(`\n  File: ${file}`);
          findings.forEach(finding => {
            console.error(`    - ${finding.description}: ${finding.count} occurrence(s)`);
            console.error(`      Samples: ${finding.samples.join(', ')}`);
          });
        });
        
        if (options.interactive) {
          const shouldContinue = await this.confirm('\nCredentials detected! Continue anyway? (NOT RECOMMENDED)');
          if (!shouldContinue) {
            console.log('❌ Commit cancelled for security reasons');
            return;
          }
        } else {
          throw new Error('Staged files contain potential credentials. Use --interactive to override (NOT RECOMMENDED).');
        }
      } else {
        console.log('✅ No credentials detected in staged files');
      }

      // Show commit message preview with prominent warning
      console.log('\n' + '🚨'.repeat(20));
      console.log('⚠️  WARNING: VERIFY COMMIT MESSAGE MATCHES YOUR CURRENT WORK! ⚠️');
      console.log('🔍 This message may be from previous work - UPDATE if needed!');
      console.log('📝 Edit: nano commit-message.txt (or your preferred editor)');
      console.log('🚨'.repeat(20));
      console.log('\n📝 Commit message:');
      console.log('─'.repeat(60));
      console.log(message);
      console.log('─'.repeat(60));

      // Stage changes if not already staged
      if (!options.noStage) {
        await this.stageChanges();
      }

      // Show diff
      await this.showDiff();

      // Confirm commit in interactive mode
      if (options.interactive) {
        console.log('\n💡 REMINDER: Does the commit message above match your current work?');
        console.log('   If not, press Ctrl+C now and update commit-message.txt');
        const shouldCommit = await this.confirm('\nProceed with commit? (Double-check message first!)');
        if (!shouldCommit) {
          console.log('❌ Commit cancelled');
          return;
        }
      }

      // Commit
      await this.commitChanges(message);

      // Offer to push
      if (options.push || (options.interactive && await this.confirm('Push to remote?'))) {
        console.log('🌐 Pushing to remote...');
        await execAsync('git push', { cwd: this.projectRoot });
        console.log('✅ Pushed to remote');
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🤖 Smart Git Commit Tool

Usage: node smart-commit.js [options]

Options:
  --edit, -e               Open editor for commit message
  --interactive, -i        Interactive mode with confirmations
  --push, -p              Automatically push after commit
  --no-stage              Don't stage changes automatically
  --force                 Commit even if no changes detected
  --help, -h              Show this help

Commit Message Files (checked in order):
  - commit-message.txt
  - .commit-message.txt
  - COMMIT_MESSAGE.txt

The script will:
1. Check for existing commit message file
2. Create template if none exists
3. Open editor if requested
4. Stage all changes (unless --no-stage)
5. Show commit preview
6. Commit with the message
7. Optionally push to remote

Examples:
  node smart-commit.js                    # Quick commit with existing message
  node smart-commit.js -i                 # Interactive mode
  node smart-commit.js -e -p             # Edit message and push
  node smart-commit.js --interactive --push  # Full interactive workflow

Environment Variables:
  EDITOR                  Preferred editor (default: nano)
  VISUAL                  Visual editor (alternative to EDITOR)
`);
    process.exit(0);
  }

  const options = {
    edit: args.includes('--edit') || args.includes('-e'),
    interactive: args.includes('--interactive') || args.includes('-i'),
    push: args.includes('--push') || args.includes('-p'),
    noStage: args.includes('--no-stage'),
    force: args.includes('--force')
  };

  const commit = new SmartCommit();
  await commit.run(options);
}

// Run if called directly (ES module detection)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Smart commit failed:', error.message);
    process.exit(1);
  });
}

export default SmartCommit;