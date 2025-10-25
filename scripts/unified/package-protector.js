#!/usr/bin/env node

/**
 * Package.json Protection System
 * Comprehensive backup, validation, and recovery for package.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PackageProtector {
    constructor() {
        this.packagePath = path.join(process.cwd(), 'package.json');
        this.backupDir = path.join(process.cwd(), '.package-backups');
        this.lockFile = path.join(process.cwd(), '.package.lock');
    }

    // Create timestamped backup
    backup() {
        if (!fs.existsSync(this.packagePath)) {
            throw new Error('package.json not found');
        }

        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `package.json.${timestamp}`);
        
        fs.copyFileSync(this.packagePath, backupPath);
        console.log(`✅ Backup created: ${backupPath}`);
        return backupPath;
    }

    // Validate package.json integrity
    validate() {
        try {
            const content = fs.readFileSync(this.packagePath, 'utf8');
            const pkg = JSON.parse(content);
            
            const required = ['name', 'version', 'description', 'main', 'scripts'];
            const missing = required.filter(field => !pkg[field]);
            
            if (missing.length > 0) {
                return { valid: false, missing, corruption: true };
            }

            return { valid: true, package: pkg };
        } catch (error) {
            return { valid: false, error: error.message, corruption: true };
        }
    }

    // Restore from most recent backup
    restore() {
        if (!fs.existsSync(this.backupDir)) {
            throw new Error('No backups available');
        }

        const backups = fs.readdirSync(this.backupDir)
            .filter(f => f.startsWith('package.json.'))
            .sort()
            .reverse();

        if (backups.length === 0) {
            throw new Error('No package.json backups found');
        }

        const latestBackup = path.join(this.backupDir, backups[0]);
        fs.copyFileSync(latestBackup, this.packagePath);
        console.log(`✅ Restored from: ${latestBackup}`);
        return latestBackup;
    }

    // Git-based recovery
    gitRestore() {
        try {
            execSync('git checkout HEAD -- package.json', { stdio: 'inherit' });
            console.log('✅ Restored package.json from git');
            return true;
        } catch (error) {
            console.error('❌ Git restore failed:', error.message);
            return false;
        }
    }

    // Acquire file lock
    lock() {
        if (fs.existsSync(this.lockFile)) {
            const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
            const age = Date.now() - lockData.timestamp;
            
            if (age < 30000) { // 30 second timeout
                throw new Error(`package.json locked by ${lockData.process} (${Math.round(age/1000)}s ago)`);
            }
        }

        const lockData = {
            process: process.pid,
            timestamp: Date.now(),
            command: process.argv.join(' ')
        };

        fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
    }

    // Release file lock
    unlock() {
        if (fs.existsSync(this.lockFile)) {
            fs.unlinkSync(this.lockFile);
        }
    }

    // Emergency recovery sequence
    emergencyRecover() {
        console.log('🚨 Starting emergency recovery...');
        
        // Try git first
        if (this.gitRestore()) {
            const validation = this.validate();
            if (validation.valid) {
                console.log('✅ Git recovery successful');
                return true;
            }
        }

        // Try backup restore
        try {
            this.restore();
            const validation = this.validate();
            if (validation.valid) {
                console.log('✅ Backup recovery successful');
                return true;
            }
        } catch (error) {
            console.error('❌ Backup recovery failed:', error.message);
        }

        console.error('❌ All recovery methods failed');
        return false;
    }

    // Clean old backups (keep last 10)
    cleanup() {
        if (!fs.existsSync(this.backupDir)) return;

        const backups = fs.readdirSync(this.backupDir)
            .filter(f => f.startsWith('package.json.'))
            .sort()
            .reverse();

        if (backups.length > 10) {
            const toDelete = backups.slice(10);
            toDelete.forEach(backup => {
                fs.unlinkSync(path.join(this.backupDir, backup));
                console.log(`🗑️ Cleaned old backup: ${backup}`);
            });
        }
    }
}

// CLI Interface
if (require.main === module) {
    const protector = new PackageProtector();
    const command = process.argv[2];

    try {
        switch (command) {
            case 'backup':
                protector.backup();
                break;
                
            case 'validate':
                const result = protector.validate();
                if (result.valid) {
                    console.log('✅ package.json is valid');
                    process.exit(0);
                } else {
                    console.error('❌ package.json validation failed:', result);
                    process.exit(1);
                }
                break;
                
            case 'restore':
                protector.restore();
                break;
                
            case 'git-restore':
                protector.gitRestore();
                break;
                
            case 'emergency':
                const recovered = protector.emergencyRecover();
                process.exit(recovered ? 0 : 1);
                break;
                
            case 'cleanup':
                protector.cleanup();
                break;
                
            case 'protect':
                // Full protection workflow
                protector.backup();
                protector.lock();
                console.log('🛡️ Package protection active');
                break;
                
            case 'unprotect':
                protector.unlock();
                console.log('🔓 Package protection released');
                break;
                
            default:
                console.log(`
Package.json Protection System

Usage: node package-protector.js <command>

Commands:
  backup      Create timestamped backup
  validate    Check package.json integrity
  restore     Restore from latest backup
  git-restore Restore from git HEAD
  emergency   Full recovery sequence
  cleanup     Remove old backups
  protect     Enable protection (backup + lock)
  unprotect   Disable protection (unlock)
`);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

module.exports = PackageProtector;