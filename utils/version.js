/**
 * Version Management Utility
 * Provides consistent version information across the application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionManager {
  constructor() {
    this.packagePath = path.join(__dirname, '../package.json');
    this.versionPath = path.join(__dirname, '../version.json');
    this.packageJson = this.loadPackageJson();
    this.versionJson = this.loadVersionJson();
  }

  loadPackageJson() {
    try {
      return JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    } catch (error) {
      console.error('Warning: Could not load package.json:', error.message);
      return { version: '0.0.0' };
    }
  }

  loadVersionJson() {
    try {
      if (fs.existsSync(this.versionPath)) {
        return JSON.parse(fs.readFileSync(this.versionPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Warning: Could not load version.json:', error.message);
    }
    
    // Return fallback version info if version.json doesn't exist
    return {
      version: this.packageJson.version,
      buildDate: new Date().toISOString(),
      commitHash: this.getGitCommitHash(),
      commitShort: this.getGitCommitHash().substring(0, 7),
      buildNumber: 'dev',
      environment: 'development'
    };
  }

  getGitCommitHash() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getVersionInfo() {
    // Use branch from version.json if available (production), otherwise try git (development)
    const branch = this.versionJson.branch || this.getGitBranch();
    
    const versionInfo = {
      version: this.versionJson.version,
      buildDate: this.versionJson.buildDate,
      commitHash: this.versionJson.commitHash,
      commitShort: this.versionJson.commitShort,
      buildNumber: this.versionJson.buildNumber,
      environment: this.versionJson.environment,
      // Runtime info
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      branch: branch
    };

    return versionInfo;
  }

  getDisplayVersion() {
    return `v${this.versionJson.version} (${this.versionJson.commitShort})`;
  }

  getFullVersionString() {
    return `${this.versionJson.version}+${this.versionJson.commitShort}.${this.versionJson.buildNumber}`;
  }

  logStartupVersion() {
    const info = this.getVersionInfo();
    console.log('🚀 =====================================');
    console.log(`📦 Wavelength Lore v${info.version}`);
    console.log(`🔨 Build: #${info.buildNumber} (${info.environment})`);
    console.log(`📅 Built: ${new Date(info.buildDate).toLocaleString()}`);
    console.log(`🔗 Commit: ${info.commitShort} (${info.branch})`);
    console.log(`⚡ Node.js: ${info.nodeVersion} on ${info.platform}`);
    console.log('🚀 =====================================');
  }

  // For EJS templates
  getTemplateData() {
    const info = this.getVersionInfo();
    return {
      version: info.version,
      displayVersion: this.getDisplayVersion(),
      commitShort: info.commitShort,
      buildDate: info.buildDate,
      buildNumber: info.buildNumber,
      environment: info.environment
    };
  }
}

// Singleton instance
const versionManager = new VersionManager();

module.exports = versionManager;