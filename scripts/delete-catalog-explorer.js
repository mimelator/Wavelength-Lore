#!/usr/bin/env node

/**
 * Delete Catalog Explorer - Issue #79
 * 
 * Removes the transient catalog-explorer route, view, and all supporting files
 * as requested in GitHub issue #79
 */

const fs = require('fs');
const path = require('path');

class CatalogExplorerCleaner {
  constructor() {
    this.deletedFiles = [];
    this.modifiedFiles = [];
    this.errors = [];
  }

  /**
   * Main cleanup process
   */
  async cleanup() {
    console.log('🗑️  CATALOG EXPLORER CLEANUP - Issue #79');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('Removing transient catalog-explorer route, view, and supporting files...\n');

    try {
      // Step 1: Delete main catalog-explorer view file
      await this.deleteFile('views/catalog-explorer.ejs');

      // Step 2: Remove route from app.js
      await this.removeRouteFromApp();

      // Step 3: Remove links from admin panel
      await this.removeLinksFromAdmin();

      // Step 4: Delete related test files
      await this.deleteTestFiles();

      // Step 5: Delete supporting admin views if they exist
      await this.deleteAdminViews();

      // Step 6: Clean up any related routes
      await this.cleanupRelatedRoutes();

      // Summary
      this.printSummary();

    } catch (error) {
      console.error('💥 Fatal error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Delete a file if it exists
   */
  async deleteFile(relativePath) {
    const fullPath = path.join(__dirname, '..', relativePath);
    
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.deletedFiles.push(relativePath);
        console.log(`✅ Deleted file: ${relativePath}`);
      } else {
        console.log(`ℹ️  File not found (already deleted?): ${relativePath}`);
      }
    } catch (error) {
      const errorMsg = `Failed to delete ${relativePath}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Remove catalog-explorer route from app.js
   */
  async removeRouteFromApp() {
    const appJsPath = path.join(__dirname, '..', 'app.js');
    
    try {
      if (!fs.existsSync(appJsPath)) {
        console.log('⚠️  app.js not found');
        return;
      }

      let content = fs.readFileSync(appJsPath, 'utf8');
      const originalContent = content;

      // Remove the catalog-explorer route block
      const routePattern = /\s*\/\/ Catalog Explorer - accessible to all users\s*\n\s*app\.get\('\/catalog-explorer',[\s\S]*?\}\);\s*\n/g;
      content = content.replace(routePattern, '\n');

      // Also remove any standalone catalog-explorer route
      const standalonePattern = /\s*app\.get\('\/catalog-explorer',[\s\S]*?\}\);\s*\n/g;
      content = content.replace(standalonePattern, '');

      if (content !== originalContent) {
        fs.writeFileSync(appJsPath, content, 'utf8');
        this.modifiedFiles.push('app.js');
        console.log('✅ Removed catalog-explorer route from app.js');
      } else {
        console.log('ℹ️  No catalog-explorer route found in app.js');
      }

    } catch (error) {
      const errorMsg = `Failed to modify app.js: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Remove catalog-explorer links from admin panel
   */
  async removeLinksFromAdmin() {
    const adminEjsPath = path.join(__dirname, '..', 'views', 'forum', 'admin.ejs');
    
    try {
      if (!fs.existsSync(adminEjsPath)) {
        console.log('⚠️  admin.ejs not found');
        return;
      }

      let content = fs.readFileSync(adminEjsPath, 'utf8');
      const originalContent = content;

      // Remove catalog-explorer links
      const linkPattern = /\s*<a href="\/catalog-explorer"[\s\S]*?<\/a>\s*/g;
      content = content.replace(linkPattern, '');

      if (content !== originalContent) {
        fs.writeFileSync(adminEjsPath, content, 'utf8');
        this.modifiedFiles.push('views/forum/admin.ejs');
        console.log('✅ Removed catalog-explorer links from admin panel');
      } else {
        console.log('ℹ️  No catalog-explorer links found in admin panel');
      }

    } catch (error) {
      const errorMsg = `Failed to modify admin.ejs: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Delete test files related to catalog-explorer
   */
  async deleteTestFiles() {
    const testFiles = [
      'tests/test-catalog-page-functionality.js',
      'tests/vendor-catalog-action-test.js',
      'tests/vendor-catalog-proof.js',
      'tests/browser-catalog-test.js'
    ];

    console.log('\n🧪 Cleaning up test files...');
    for (const testFile of testFiles) {
      await this.deleteFile(testFile);
    }
  }

  /**
   * Delete admin catalog views
   */
  async deleteAdminViews() {
    const adminViews = [
      'views/admin/unified-catalog-explorer.ejs',
      'views/admin/vendor-catalog.ejs'
    ];

    console.log('\n👑 Cleaning up admin catalog views...');
    for (const viewFile of adminViews) {
      await this.deleteFile(viewFile);
    }
  }

  /**
   * Clean up related route files
   */
  async cleanupRelatedRoutes() {
    console.log('\n🛣️  Cleaning up related route files...');
    
    // Check if admin-catalog-api.js should be deleted
    const catalogApiPath = path.join(__dirname, '..', 'routes', 'admin-catalog-api.js');
    if (fs.existsSync(catalogApiPath)) {
      // Read the file to see if it's only catalog-explorer related
      const content = fs.readFileSync(catalogApiPath, 'utf8');
      if (content.includes('Lightweight Admin Catalog API') && content.includes('Non-graphical')) {
        await this.deleteFile('routes/admin-catalog-api.js');
      }
    }

    // Check admin-vendor-catalog.js - this might be used by other features
    const vendorCatalogPath = path.join(__dirname, '..', 'routes', 'admin-vendor-catalog.js');
    if (fs.existsSync(vendorCatalogPath)) {
      const content = fs.readFileSync(vendorCatalogPath, 'utf8');
      
      // If it only contains unified-catalog-explorer, we can delete it
      if (content.includes('unified-catalog-explorer') && !content.includes('vendor-research')) {
        console.log('ℹ️  admin-vendor-catalog.js appears to be catalog-explorer specific');
        // But let's be conservative and leave it for manual review
        console.log('⚠️  Leaving admin-vendor-catalog.js for manual review (may have other dependencies)');
      }
    }
  }

  /**
   * Print cleanup summary
   */
  printSummary() {
    console.log('\n📊 CATALOG EXPLORER CLEANUP SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    
    console.log(`✅ Files deleted: ${this.deletedFiles.length}`);
    if (this.deletedFiles.length > 0) {
      this.deletedFiles.forEach(file => console.log(`   • ${file}`));
    }

    console.log(`\n📝 Files modified: ${this.modifiedFiles.length}`);
    if (this.modifiedFiles.length > 0) {
      this.modifiedFiles.forEach(file => console.log(`   • ${file}`));
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${this.errors.length}`);
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    console.log('\n🎉 Catalog Explorer cleanup completed!');
    console.log('\n⚠️  MANUAL REVIEW RECOMMENDED:');
    console.log('   • routes/admin-vendor-catalog.js - May have other dependencies');
    console.log('   • Any remaining references in other files');
    console.log('   • Test your application after cleanup to ensure no broken links');
    
    if (this.modifiedFiles.length > 0) {
      console.log('\n🔍 MODIFIED FILES TO REVIEW:');
      console.log('   • app.js - Catalog explorer route removed');
      console.log('   • views/forum/admin.ejs - Catalog explorer links removed');
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🗑️  Catalog Explorer Cleanup Tool - Issue #79

DESCRIPTION:
  Removes the transient catalog-explorer route, view, and supporting files
  as requested in GitHub issue #79

USAGE:
  node scripts/delete-catalog-explorer.js [options]

OPTIONS:
  --help, -h    Show this help message

WHAT IT REMOVES:
  • /catalog-explorer route from app.js
  • views/catalog-explorer.ejs template
  • Related test files
  • Admin panel links
  • Supporting admin views
  • Related API routes

⚠️  WARNING: This action cannot be undone!
Review the changes before committing.
`);
    process.exit(0);
  }

  const cleaner = new CatalogExplorerCleaner();
  
  try {
    await cleaner.cleanup();
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = CatalogExplorerCleaner;