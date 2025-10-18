#!/usr/bin/env node

/**
 * Git Commit and Push Script
 * 
 * Automates the process of checking in and pushing changes to trigger deployment
 * Usage: node git-commit-push.js [--message "commit message"] [--force] [--dry-run]
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');

class GitCommitPush {
  constructor(options = {}) {
    this.message = options.message || this.generateCommitMessage();
    this.force = options.force || false;
    this.dryRun = options.dryRun || false;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  generateCommitMessage() {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return `Enhanced port configuration and deployment monitoring - ${timestamp}`;
  }

  async runCommand(command, description) {
    console.log(`🔧 ${description}...`);
    
    if (this.dryRun) {
      console.log(`   [DRY RUN] Would run: ${command}`);
      return '';
    }
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log(`✅ ${description} completed`);
      return output;
    } catch (error) {
      console.error(`❌ ${description} failed: ${error.message}`);
      if (error.stdout) console.log('STDOUT:', error.stdout);
      if (error.stderr) console.log('STDERR:', error.stderr);
      throw error;
    }
  }

  async checkGitStatus() {
    console.log(`🔍 Checking Git Status`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const status = await this.runCommand('git status --porcelain', 'Getting git status');
      const branch = await this.runCommand('git branch --show-current', 'Getting current branch');
      
      console.log(`📋 Current branch: ${branch.trim()}`);
      
      if (!status.trim()) {
        console.log('✅ Working directory is clean - no changes to commit');
        return false;
      }
      
      console.log('📝 Changes detected:');
      const statusLines = status.trim().split('\n');
      statusLines.forEach(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        const statusIcon = this.getStatusIcon(status);
        console.log(`   ${statusIcon} ${file}`);
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to check git status');
      throw error;
    }
  }

  getStatusIcon(status) {
    const icons = {
      'M ': '📝', // Modified
      ' M': '📝', // Modified
      'A ': '➕', // Added
      ' A': '➕', // Added
      'D ': '🗑️', // Deleted
      ' D': '🗑️', // Deleted
      'R ': '🔄', // Renamed
      ' R': '🔄', // Renamed
      'C ': '📋', // Copied
      ' C': '📋', // Copied
      '??': '❓', // Untracked
      '!!': '🚫'  // Ignored
    };
    return icons[status] || '📄';
  }

  async confirmAction(message) {
    if (this.force) {
      console.log(`⚡ Force mode: Skipping confirmation`);
      return true;
    }
    
    return new Promise((resolve) => {
      this.rl.question(`${message} (y/N): `, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async commitAndPush() {
    console.log(`🚀 Git Commit and Push Automation`);
    console.log(`📝 Commit message: "${this.message}"`);
    console.log(`⚡ Force mode: ${this.force ? 'enabled' : 'disabled'}`);
    console.log(`🧪 Dry run: ${this.dryRun ? 'enabled' : 'disabled'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      // Check git status
      const hasChanges = await this.checkGitStatus();
      
      if (!hasChanges) {
        console.log('\n🎉 No changes to commit. Repository is up to date!');
        return;
      }

      // Confirm commit
      console.log('\n📋 Commit Plan:');
      console.log(`   1. Add all changes to staging`);
      console.log(`   2. Commit with message: "${this.message}"`);
      console.log(`   3. Push to origin main`);
      console.log(`   4. Trigger automatic deployment`);

      const shouldProceed = await this.confirmAction('\n🤔 Proceed with commit and push?');
      if (!shouldProceed) {
        console.log('❌ Operation cancelled by user');
        return;
      }

      // Add all changes
      await this.runCommand('git add .', 'Adding all changes to staging');

      // Show what will be committed
      if (!this.dryRun) {
        console.log('\n📋 Files to be committed:');
        const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
        staged.trim().split('\n').forEach(file => {
          if (file) console.log(`   ✅ ${file}`);
        });
      }

      // Commit
      const commitCommand = `git commit -m "${this.message}"`;
      await this.runCommand(commitCommand, 'Committing changes');

      // Push
      await this.runCommand('git push origin main', 'Pushing to origin main');

      // Success message
      console.log('\n🎉 SUCCESS! Changes committed and pushed successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Next Steps:');
      console.log('   1. GitHub Actions will automatically start building');
      console.log('   2. Monitor deployment: node scripts/github-action-monitor.js --watch');
      console.log('   3. Check production logs after deployment completes');
      console.log('   4. Verify enhanced logging appears in production');
      console.log('   5. Confirm port configuration fix resolves 502 errors\n');

      // Suggest monitoring
      const shouldMonitor = await this.confirmAction('🔍 Start monitoring GitHub Actions now?');
      if (shouldMonitor && !this.dryRun) {
        console.log('\n🚀 Starting GitHub Actions monitor...\n');
        this.rl.close();
        
        // Start monitoring in a new process
        const monitor = spawn('node', ['github-action-monitor.js', '--watch'], {
          stdio: 'inherit',
          cwd: __dirname
        });
        
        monitor.on('close', (code) => {
          console.log(`\n📊 GitHub Actions monitoring completed with code: ${code}`);
        });
        
        return;
      }

    } catch (error) {
      console.error('\n❌ COMMIT AND PUSH FAILED!');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`💥 Error: ${error.message}`);
      console.error('\n🔧 Troubleshooting:');
      console.error('   1. Check git repository status manually');
      console.error('   2. Verify you have write access to the repository');
      console.error('   3. Ensure you are on the correct branch');
      console.error('   4. Check network connectivity for push operation\n');
      
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--message':
      case '-m':
        options.message = args[++i];
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
🚀 Git Commit and Push Automation

Usage: node git-commit-push.js [options]

Options:
  --message, -m "text"    Custom commit message
  --force, -f            Skip confirmation prompts
  --dry-run              Show what would be done without executing
  --help, -h             Show this help message

Examples:
  node git-commit-push.js
  node git-commit-push.js --message "Fix production port configuration"
  node git-commit-push.js --force --message "Emergency hotfix"
  node git-commit-push.js --dry-run

Default commit message format:
  "Enhanced port configuration and deployment monitoring - YYYY-MM-DD HH:MM"

The script will:
  1. Check git status and show pending changes
  2. Add all changes to staging (git add .)
  3. Commit with specified or generated message
  4. Push to origin main branch
  5. Optionally start monitoring GitHub Actions deployment
`);
        process.exit(0);
        break;
    }
  }

  const gitHandler = new GitCommitPush(options);
  await gitHandler.commitAndPush();
}

if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = GitCommitPush;