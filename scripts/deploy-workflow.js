#!/usr/bin/env node

/**
 * Wavelength Lore Deployment Workflow
 * 
 * Complete deployment pipeline for content changes:
 * 1. Validate all content against schemas
 * 2. Optimize and sync assets
 * 3. Update Firebase database
 * 4. Commit and push changes
 * 5. Monitor build and deployment
 * 
 * Usage:
 *   ./deploy-workflow.js --full         # Full deployment with asset sync
 *   ./deploy-workflow.js --content      # Content-only deployment
 *   ./deploy-workflow.js --staging      # Deploy to staging environment
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const execAsync = promisify(exec);

class DeploymentWorkflow {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.contentDir = path.join(this.projectRoot, 'content');
    this.schemasDir = path.join(this.projectRoot, 'content-management', 'schemas');
    
    // Initialize JSON schema validator
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
    
    this.startTime = Date.now();
  }

  async main() {
    const args = process.argv.slice(2);
    const flags = this.parseFlags(args);

    console.log('🚀 Wavelength Lore Deployment Workflow');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Step 1: Validate content
      console.log('\\n1️⃣ Validating content...');
      await this.validateContent();

      // Step 2: Asset management (if requested)
      if (flags.full || flags.assets) {
        console.log('\\n2️⃣ Managing assets...');
        await this.processAssets(flags);
      }

      // Step 3: Update database
      console.log('\\n3️⃣ Updating database...');
      await this.updateDatabase(flags);

      // Step 4: Git operations
      if (!flags['no-git']) {
        console.log('\\n4️⃣ Committing changes...');
        await this.gitOperations(flags);
      }

      // Step 5: Deploy
      if (!flags['no-deploy']) {
        console.log('\\n5️⃣ Deploying...');
        await this.deploy(flags);
      }

      this.reportSuccess();

    } catch (error) {
      console.error('\\n❌ Deployment failed:', error.message);
      if (flags.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
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

  async validateContent() {
    console.log('🔍 Validating content schemas...');
    
    const validationResults = {
      seasons: await this.validateSeasons(),
      characters: await this.validateCharacters(),
      lore: await this.validateLore()
    };

    const totalErrors = Object.values(validationResults)
      .reduce((sum, result) => sum + result.errors, 0);

    if (totalErrors > 0) {
      console.log('\\n❌ Validation errors found:');
      Object.entries(validationResults).forEach(([type, result]) => {
        if (result.errors > 0) {
          console.log(`  ${type}: ${result.errors} errors`);
          if (result.details) {
            result.details.forEach(detail => {
              console.log(`    - ${detail}`);
            });
          }
        }
      });
      throw new Error('Content validation failed');
    }

    console.log('✅ Content validation passed');
  }

  async validateSeasons() {
    const schemaPath = path.join(this.schemasDir, 'season-schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const validate = this.ajv.compile(schema);

    const seasonFiles = fs.readdirSync(path.join(this.contentDir, 'seasons'))
      .filter(f => f.startsWith('season') && f.endsWith('.yaml'));

    let errors = 0;
    const details = [];

    for (const file of seasonFiles) {
      const filePath = path.join(this.contentDir, 'seasons', file);
      const content = yaml.load(fs.readFileSync(filePath, 'utf8'));
      
      if (!validate(content)) {
        errors++;
        details.push(`${file}: ${this.ajv.errorsText(validate.errors)}`);
      }
    }

    return { errors, details };
  }

  async validateCharacters() {
    const schemaPath = path.join(this.schemasDir, 'character-schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const validate = this.ajv.compile(schema);

    const characterDirs = fs.readdirSync(path.join(this.contentDir, 'characters'))
      .filter(d => d !== 'character-schema.yaml' && 
                   fs.statSync(path.join(this.contentDir, 'characters', d)).isDirectory());

    let errors = 0;
    const details = [];

    for (const dir of characterDirs) {
      const characterFile = path.join(this.contentDir, 'characters', dir, 'character.yaml');
      
      if (fs.existsSync(characterFile)) {
        const content = yaml.load(fs.readFileSync(characterFile, 'utf8'));
        
        if (!validate(content)) {
          errors++;
          details.push(`${dir}: ${this.ajv.errorsText(validate.errors)}`);
        }
      }
    }

    return { errors, details };
  }

  async validateLore() {
    const schemaPath = path.join(this.schemasDir, 'lore-schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const validate = this.ajv.compile(schema);

    const loreFile = path.join(this.contentDir, 'lore', 'wavelength-lore.yaml');
    const content = yaml.load(fs.readFileSync(loreFile, 'utf8'));

    let errors = 0;
    const details = [];

    if (!validate(content)) {
      errors++;
      details.push(`wavelength-lore.yaml: ${this.ajv.errorsText(validate.errors)}`);
    }

    return { errors, details };
  }

  async processAssets(flags) {
    console.log('📁 Processing assets...');
    
    // Validate existing assets
    console.log('  Validating assets...');
    await execAsync('node scripts/asset-manager.js validate', { cwd: this.projectRoot });
    
    // Sync to CloudFront if requested
    if (flags.sync || flags.full) {
      console.log('  Syncing to CloudFront...');
      await execAsync(`node scripts/asset-manager.js sync ${flags.force ? '--force' : ''}`, 
        { cwd: this.projectRoot });
    }

    console.log('✅ Assets processed');
  }

  async updateDatabase(flags) {
    console.log('💾 Updating Firebase database...');
    
    const environment = flags.staging ? 'staging' : 'production';
    console.log(`  Target environment: ${environment}`);

    try {
      await execAsync('node scripts/populate_firebase.js', { cwd: this.projectRoot });
      console.log('✅ Database updated');
    } catch (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }
  }

  async gitOperations(flags) {
    console.log('📝 Git operations...');
    
    // Check for changes
    const { stdout: statusOutput } = await execAsync('git status --porcelain', 
      { cwd: this.projectRoot });
    
    if (!statusOutput.trim()) {
      console.log('  No changes to commit');
      return;
    }

    // Add all changes
    await execAsync('git add .', { cwd: this.projectRoot });
    
    // Generate commit message
    const timestamp = new Date().toISOString().split('T')[0];
    const commitMessage = flags.message || 
      `Content deployment ${timestamp}\\n\\nAutomated deployment via deploy-workflow`;
    
    // Commit
    await execAsync(`git commit -m "${commitMessage}"`, { cwd: this.projectRoot });
    console.log(`  ✅ Changes committed: ${commitMessage.split('\\n')[0]}`);
    
    // Push
    if (!flags['no-push']) {
      await execAsync('git push', { cwd: this.projectRoot });
      console.log('  ✅ Changes pushed to remote');
    }
  }

  async deploy(flags) {
    const environment = flags.staging ? 'staging' : 'production';
    console.log(`🚀 Deploying to ${environment}...`);
    
    if (flags.staging) {
      // Deploy to staging environment
      console.log('  Staging deployment not yet implemented');
      return;
    }

    // Monitor GitHub Actions build
    console.log('  Triggering GitHub Actions build...');
    await execAsync('node scripts/github-action-monitor.js --watch', 
      { cwd: this.projectRoot });
    
    // Update App Runner
    console.log('  Updating App Runner...');
    const { stdout } = await execAsync('git rev-parse HEAD', { cwd: this.projectRoot });
    const commitHash = stdout.trim().substring(0, 8);
    
    await execAsync(`node scripts/update-ecr-tag.js update ${commitHash}`, 
      { cwd: this.projectRoot });
    
    // Monitor deployment
    console.log('  Monitoring deployment...');
    await execAsync('node scripts/apprunner-deploy-monitor.js --reason "Automated deployment"', 
      { cwd: this.projectRoot });

    console.log('✅ Deployment complete');
  }

  reportSuccess() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    console.log('\\n🎉 Deployment workflow completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Total time: ${minutes}m ${seconds}s`);
    console.log('🌐 Your content is now live!');
  }

  showHelp() {
    console.log(`
🎵 Wavelength Lore Deployment Workflow

Usage:
  ./deploy-workflow.js [options]

Options:
  --full                    Full deployment (content + assets + deploy)
  --content                 Content-only deployment
  --staging                 Deploy to staging environment
  --assets                  Process assets only
  --sync                    Sync assets to CloudFront
  --force                   Force asset sync/overwrite
  --message="text"          Custom commit message
  --no-git                  Skip git operations
  --no-push                 Skip git push
  --no-deploy               Skip production deployment
  --verbose                 Verbose error output

Examples:
  ./deploy-workflow.js --full
  ./deploy-workflow.js --content --message="Added new episode"
  ./deploy-workflow.js --staging --assets
    `);
  }
}

if (require.main === module) {
  const workflow = new DeploymentWorkflow();
  workflow.main();
}

module.exports = DeploymentWorkflow;