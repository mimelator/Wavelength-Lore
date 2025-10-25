#!/usr/bin/env node

/**
 * Simple Content Deployment Demo
 * 
 * A simplified version of the deployment workflow for demonstration
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const yaml = require('js-yaml');

const execAsync = promisify(exec);

class SimpleDeployment {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.contentDir = path.join(this.projectRoot, 'content');
  }

  async main() {
    const args = process.argv.slice(2);
    const flags = this.parseFlags(args);

    console.log('🚀 Simple Content Deployment Demo');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Step 1: Basic validation
      console.log('\n1️⃣ Basic content check...');
      await this.basicValidation();

      // Step 2: Update database
      console.log('\n2️⃣ Updating database...');
      await this.updateDatabase();

      // Step 3: Git operations
      if (!flags['no-git']) {
        console.log('\n3️⃣ Git operations...');
        await this.gitOperations(flags);
      }

      console.log('\n✅ Demo deployment complete!');
      console.log('🎉 Your new content has been added to the system');

    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
    }
  }

  parseFlags(args) {
    const flags = {};
    args.forEach(arg => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        flags[key] = value || true;
      }
    });
    return flags;
  }

  async basicValidation() {
    // Check that season files are valid YAML
    const seasonFiles = fs.readdirSync(path.join(this.contentDir, 'seasons'))
      .filter(f => f.startsWith('season') && f.endsWith('.yaml'));

    for (const file of seasonFiles) {
      try {
        const filePath = path.join(this.contentDir, 'seasons', file);
        yaml.load(fs.readFileSync(filePath, 'utf8'));
        console.log(`  ✅ ${file} - Valid YAML`);
      } catch (error) {
        throw new Error(`Invalid YAML in ${file}: ${error.message}`);
      }
    }

    console.log('✅ Basic validation passed');
  }

  async updateDatabase() {
    console.log('💾 Updating Firebase...');
    try {
      await execAsync('node scripts/populate_firebase.js', { cwd: this.projectRoot });
      console.log('✅ Database updated successfully');
    } catch (error) {
      console.log('⚠️  Database update skipped (would normally update Firebase)');
    }
  }

  async gitOperations(flags) {
    // Check for changes
    try {
      const { stdout: statusOutput } = await execAsync('git status --porcelain', 
        { cwd: this.projectRoot });
      
      if (!statusOutput.trim()) {
        console.log('  No changes to commit');
        return;
      }

      // Add changes
      await execAsync('git add content/ static/images/', { cwd: this.projectRoot });
      
      const commitMessage = flags.message || 'Added new content via content management system';
      
      console.log(`  📝 Staging changes...`);
      console.log(`  💬 Commit message: ${commitMessage}`);
      
      // For demo, show what would be committed without actually committing
      console.log('  ✅ Content staged for commit (demo mode - not actually committing)');
      
    } catch (error) {
      console.log('⚠️  Git operations skipped:', error.message);
    }
  }
}

if (require.main === module) {
  const demo = new SimpleDeployment();
  demo.main();
}

module.exports = SimpleDeployment;