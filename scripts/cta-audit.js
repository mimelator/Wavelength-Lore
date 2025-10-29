#!/usr/bin/env node

/**
 * CTA Audit Master Script
 * Orchestrates collection, validation, and reporting of all CTAs
 * Usage:
 *   npm run cta:audit              - Run full audit (collect + validate)
 *   npm run cta:collect            - Only collect CTAs
 *   npm run cta:validate           - Only validate CTAs (requires prior collection)
 *   npm run cta:report             - Generate summary report
 */

const fs = require('fs');
const path = require('path');
const CTACollector = require('./cta-collector');
const CTAValidator = require('./cta-validator');
const { validateSetup } = require('./cta-setup');

const AUDIT_FILE = path.join(__dirname, '../reports/cta-audit.json');
const VALIDATION_REPORT = path.join(__dirname, '../reports/cta-validation-report.json');
const SUMMARY_REPORT = path.join(__dirname, '../reports/cta-summary.md');
const REPORTS_DIR = path.dirname(AUDIT_FILE);

/**
 * Ensure reports directory exists
 */
function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Generate markdown summary report
 */
function generateSummaryReport(validationReport) {
  let markdown = `# Wavelength Lore CTA Audit Report\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;

  // Summary section
  markdown += `## Summary\n\n`;
  const summary = validationReport.summary;
  markdown += `- **Total CTAs Evaluated:** ${summary.total_ctas}\n`;
  markdown += `- **Successfully Validated:** ${summary.successfully_validated}\n`;
  markdown += `- **With Issues:** ${summary.with_issues}\n`;
  markdown += `- **Validation Errors:** ${summary.validation_errors}\n`;
  markdown += `- **Success Rate:** ${summary.success_rate}\n\n`;

  // Issues section
  const issues = validationReport.issues_summary;
  if (Object.keys(issues).length > 0) {
    markdown += `## Issues Identified\n\n`;
    Object.entries(issues).forEach(([type, items]) => {
      markdown += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Issues (${items.length})\n\n`;
      items.forEach(item => {
        markdown += `**${item.title}**\n`;
        markdown += `- Issues: ${item.issues.join(', ')}\n`;
        markdown += `- Assessment: ${item.assessment}\n\n`;
      });
    });
  } else {
    markdown += `## Issues\n\nNo issues identified! ✨\n\n`;
  }

  // Recommendations section
  if (validationReport.recommendations && validationReport.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    validationReport.recommendations.forEach(rec => {
      markdown += `### [${rec.priority.toUpperCase()}] ${rec.action}\n`;
      if (rec.count) {
        markdown += `- Count: ${rec.count}\n`;
      }
      markdown += `- Details: ${rec.details}\n\n`;
    });
  }

  // Action items section
  markdown += `## Next Steps\n\n`;
  markdown += `1. Review the detailed validation report at: \`reports/cta-validation-report.json\`\n`;
  markdown += `2. Address issues in the order specified (high → medium → low priority)\n`;
  markdown += `3. Update CTA content in the YAML files under \`content/\`\n`;
  markdown += `4. Re-run validation to confirm fixes: \`npm run cta:validate\`\n\n`;

  // Detailed findings
  markdown += `## Detailed Findings\n\n`;
  markdown += `See \`reports/cta-validation-report.json\` for complete validation details including:\n`;
  markdown += `- Individual CTA assessments\n`;
  markdown += `- Chatbot feedback for each CTA\n`;
  markdown += `- Consistency ratings\n`;
  markdown += `- Actionable feedback for improvements\n`;

  fs.writeFileSync(SUMMARY_REPORT, markdown);
  console.log(`\n📄 Summary report generated at: ${SUMMARY_REPORT}`);
}

/**
 * Run full audit
 */
async function runFullAudit() {
  ensureReportsDir();

  console.log('═'.repeat(60));
  console.log('🎵 WAVELENGTH LORE CTA AUDIT - FULL RUN');
  console.log('═'.repeat(60));

  // Step 1: Collect
  console.log('\n📦 STEP 1: Collecting CTAs...\n');
  const collector = new CTACollector();
  collector.collectAll();
  collector.save();
  collector.displaySummary();

  // Step 2: Validate
  console.log('\n📋 STEP 2: Validating CTAs against lore...\n');
  const validator = new CTAValidator();
  await validator.validateAll();
  const report = validator.generateReport();
  validator.displaySummary();

  // Step 3: Summary Report
  console.log('\n📝 STEP 3: Generating summary report...');
  generateSummaryReport(report);

  console.log('\n' + '═'.repeat(60));
  console.log('✅ AUDIT COMPLETE!');
  console.log('═'.repeat(60));
  console.log('\n📁 Generated files:');
  console.log(`  - ${AUDIT_FILE}`);
  console.log(`  - ${VALIDATION_REPORT}`);
  console.log(`  - ${SUMMARY_REPORT}`);
}

/**
 * Run collection only
 */
function runCollection() {
  ensureReportsDir();

  console.log('📦 Collecting CTAs...\n');
  const collector = new CTACollector();
  collector.collectAll();
  collector.save();
  collector.displaySummary();

  console.log(`\n✅ Collection complete!`);
  console.log(`Next step: npm run cta:validate`);
}

/**
 * Run validation only
 */
async function runValidation() {
  if (!fs.existsSync(AUDIT_FILE)) {
    console.error(`❌ Audit file not found: ${AUDIT_FILE}`);
    console.error(`Run \`npm run cta:collect\` first`);
    process.exit(1);
  }

  // Check if API key is configured
  const isSetupValid = await validateSetup();
  if (!isSetupValid) {
    console.error('\n❌ Setup validation failed');
    console.error('Run: npm run cta:setup -- --interactive');
    process.exit(1);
  }

  console.log('📋 Validating CTAs...\n');
  const validator = new CTAValidator();
  await validator.validateAll();
  const report = validator.generateReport();
  validator.displaySummary();

  console.log(`\n✅ Validation complete!`);
  generateSummaryReport(report);
}

/**
 * Generate report only
 */
function runReport() {
  if (!fs.existsSync(VALIDATION_REPORT)) {
    console.error(`❌ Validation report not found: ${VALIDATION_REPORT}`);
    console.error(`Run \`npm run cta:audit\` or \`npm run cta:validate\` first`);
    process.exit(1);
  }

  const validationReport = JSON.parse(fs.readFileSync(VALIDATION_REPORT, 'utf8'));
  generateSummaryReport(validationReport);
  console.log(`\n✅ Report generated!`);
}

/**
 * Main
 */
async function main() {
  const command = process.argv[2] || 'full';

  try {
    switch (command) {
      case 'full':
      case 'audit':
        await runFullAudit();
        break;
      case 'collect':
        runCollection();
        break;
      case 'validate':
        await runValidation();
        break;
      case 'report':
        runReport();
        break;
      case 'help':
        console.log(`
Usage: npm run cta:audit [command]

Commands:
  full      - Run complete audit (collect + validate + report) [default]
  collect   - Only collect CTAs from content files
  validate  - Only validate collected CTAs
  report    - Only generate summary report (requires prior validation)
  help      - Show this help message

Environment Variables:
  CHATBOT_API_KEY - Required for validation (set in .env)
  CHATBOT_URL     - Optional, defaults to us-central1-wavelength-lore.cloudfunctions.net

Examples:
  npm run cta:audit              # Full audit
  npm run cta:audit collect      # Collect only
  npm run cta:audit validate     # Validate only
  npm run cta:audit report       # Report only
        `);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log(`Run: npm run cta:audit help`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runFullAudit, runCollection, runValidation, runReport };
