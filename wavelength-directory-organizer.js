#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH ROOT DIRECTORY CLEANUP EXECUTOR
 * AUTO-GENERATED cleanup script using pure WAVELENGTH methodology
 */

const fs = require('fs');
const path = require('path');

console.log('🌊 WAVELENGTH: Executing root directory organization...');

const moves = [
  // All WAVELENGTH super tools and utilities
  ['debug-current-merch.js', 'wavelength-tools/'],
  ['debug-js-errors.js', 'wavelength-tools/'],
  ['debug-merch-current.js', 'wavelength-tools/'],
  ['debug-product-types.js', 'wavelength-tools/'],
  ['direct-super-power-test.js', 'wavelength-tools/'],
  ['execute-now.js', 'wavelength-tools/'],
  ['execute-super-power-test.js', 'wavelength-tools/'],
  ['mcp-test-execution.js', 'wavelength-tools/'],
  ['temp-health-check.js', 'wavelength-tools/'],
  ['test-admin-access.js', 'wavelength-tools/'],
  ['test-aria-post-super-power.js', 'wavelength-tools/'],
  ['test-http-tool.js', 'wavelength-tools/'],
  ['test-mcp-tools.js', 'wavelength-tools/'],
  ['test-merch-fix.js', 'wavelength-tools/'],
  ['test-results.js', 'wavelength-tools/'],
  ['wavelength-build-failure-detective.js', 'wavelength-tools/'],
  ['wavelength-build-verify.js', 'wavelength-tools/'],
  ['wavelength-commit-fix.js', 'wavelength-tools/'],
  ['wavelength-commit-super-power.js', 'wavelength-tools/'],
  ['wavelength-deployment-diagnostic.js', 'wavelength-tools/'],
  ['wavelength-direct-failure-analyzer.js', 'wavelength-tools/'],
  ['wavelength-directory-analyzer.js', 'wavelength-tools/'],
  ['wavelength-docker-deploy.js', 'wavelength-tools/'],
  ['wavelength-docker-fix-plan.js', 'wavelength-tools/'],
  ['wavelength-docker-validator.js', 'wavelength-tools/'],
  ['wavelength-ecr-build-simulator.js', 'wavelength-tools/'],
  ['wavelength-ecr-image-validator.js', 'wavelength-tools/'],
  ['wavelength-enhanced-docker-committer.js', 'wavelength-tools/'],
  ['wavelength-failure-diagnosis.js', 'wavelength-tools/'],
  ['wavelength-github-failure-investigator.js', 'wavelength-tools/'],
  ['wavelength-live-build-monitor.js', 'wavelength-tools/'],
  ['wavelength-live-github-monitor.js', 'wavelength-tools/'],
  ['wavelength-mcp-github-activator.js', 'wavelength-tools/'],
  ['wavelength-monitor-github.js', 'wavelength-tools/'],
  ['wavelength-monitor.js', 'wavelength-tools/'],
  ['wavelength-pure-github-execution.js', 'wavelength-tools/'],
  ['wavelength-pure-github-monitor.js', 'wavelength-tools/'],
  ['wavelength-pure-mcp-github.js', 'wavelength-tools/'],
  ['wavelength-pure-validation.js', 'wavelength-tools/'],
  ['wavelength-pure-vscode-commit.js', 'wavelength-tools/'],
  ['wavelength-test-execution.js', 'wavelength-tools/'],
  ['wavelength-ultimate-github-monitor.js', 'wavelength-tools/'],

  // Maintenance and analysis documentation
  ['CACHE_FLAW_ANALYSIS.md', 'documentation/maintenance/'],
  ['CODING WITH AI.MD', 'documentation/maintenance/'],
  ['COMPREHENSIVE_SCRIPTS_AUDIT.md', 'documentation/maintenance/'],
  ['CRITICAL_REMINDERS.md', 'documentation/maintenance/'],
  ['DEPLOYMENT-GUIDE.md', 'documentation/maintenance/'],
  ['MAP_SUCCESS_SUMMARY.md', 'documentation/maintenance/'],
  ['SECURITY_AUDIT_REPORT.md', 'documentation/maintenance/'],
  ['SVG_FIX_SUMMARY.md', 'documentation/maintenance/'],
  ['commit-message.txt', 'documentation/maintenance/'],
  ['maintenance-report.md', 'documentation/maintenance/'],

  // Project achievements and milestones
  ['LORE_MANAGEMENT_ACHIEVEMENT.md', 'documentation/achievements/'],
  ['MAP_SUCCESS_SUMMARY.md', 'documentation/achievements/'],
  ['WAVELENGTH_GEMS_TESTING_COMPLETE.md', 'documentation/achievements/'],

  // Testing documentation and results
  ['BROWSER_TEST_RESULTS.md', 'documentation/testing/'],
  ['MERCHANDISE_ISSUE_TESTING.md', 'documentation/testing/'],
  ['TEST_RESULTS.md', 'documentation/testing/'],
  ['TEST_SUITE_RATIONALIZATION_PLAN.md', 'documentation/testing/'],
  ['TIERED_PRODUCT_FLOW_TEST_RESULTS.md', 'documentation/testing/'],

  // Integration and system documentation
  ['ADVANCED_LINK_SYSTEM.md', 'documentation/integration/'],
  ['FULL_CATALOG_INTEGRATION.md', 'documentation/integration/'],
  ['TIERED_PRODUCT_INTEGRATION.md', 'documentation/integration/'],
  ['WORLD_MAP_INTEGRATION_CONTEXT.md', 'documentation/integration/'],

  // All log files and test outputs
  ['.server.log', 'logs/'],
  ['enhanced-test-results.log', 'logs/'],
  ['final-enhanced-test.log', 'logs/'],
  ['integration-proof.log', 'logs/'],
  ['navigation-test.log', 'logs/'],
  ['quick-nav-results.log', 'logs/'],
  ['server-final-test.log', 'logs/'],
  ['server-validation-2.log', 'logs/'],
  ['server-validation-3.log', 'logs/'],
  ['server-validation.log', 'logs/'],
  ['server.log', 'logs/'],
  ['simple-proof.log', 'logs/'],
  ['simple-test-results-fixed.log', 'logs/'],
  ['simple-test-results.log', 'logs/'],
  ['visual-validation.log', 'logs/'],

  // Screenshots and proof images
  ['debug-product-mapping-proof.png', 'proof/'],
  ['dialog-behavior-test-proof.png', 'proof/'],
  ['enhanced-dialog-test-proof.png', 'proof/'],
  ['navigator-debug-proof.png', 'proof/'],
  ['navigator-navigation-proof.png', 'proof/'],
  ['pillow-poster-test-proof.png', 'proof/'],
  ['preselection-test-proof.png', 'proof/'],
  ['product-creation-flow-proof.png', 'proof/'],
  ['product-type-test-proof.png', 'proof/'],
  ['product-type-validation-proof.png', 'proof/'],
  ['productnavigator-test-proof.png', 'proof/'],
  ['variant-display-test-proof.png', 'proof/'],

  // Backup files and restore points
  ['.env.bak', 'backup/'],
  ['GOOD-PACKAGE-JSON-RESTORE-THIS.backup', 'backup/'],
  ['HEALTHY-package.json.backup.20251025-154405', 'backup/'],

  // Temporary files and quick scripts
  ['cleanup.sh', 'temp-files/'],
  ['commit.sh', 'temp-files/'],
  ['dev-terminal.sh', 'temp-files/'],
  ['generate-test-products.js', 'temp-files/'],
  ['isolated-run.sh', 'temp-files/'],
  ['quick-html-check.js', 'temp-files/'],
  ['run-merch-tests.sh', 'temp-files/'],

  // Docker related files
  ['Dockerfile.fixed', 'docker/'],
  ['docker-start.sh', 'docker/'],

];

// Create directories and move files
moves.forEach(([file, targetDir]) => {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`📁 Created directory: ${targetDir}`);
    }
    
    if (fs.existsSync(file)) {
      const targetPath = path.join(targetDir, file);
      fs.renameSync(file, targetPath);
      console.log(`✅ Moved ${file} -> ${targetPath}`);
    }
  } catch (error) {
    console.error(`❌ Error moving ${file}:`, error.message);
  }
});

console.log('🎉 WAVELENGTH root directory organization complete!');
