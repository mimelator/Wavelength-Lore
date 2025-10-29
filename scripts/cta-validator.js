#!/usr/bin/env node

/**
 * CTA Validator Script
 * Uses the Wavelength chatbot to evaluate CTAs for consistency with lore
 * Generates a comprehensive audit report
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const AUDIT_FILE = path.join(__dirname, '../reports/cta-audit.json');
const REPORT_FILE = path.join(__dirname, '../reports/cta-validation-report.json');
const REPORTS_DIR = path.dirname(REPORT_FILE);

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * CTA Validator Class
 */
class CTAValidator {
  constructor() {
    this.chatbotUrl = process.env.CHATBOT_URL || 'us-central1-wavelength-lore.cloudfunctions.net';
    this.apiKey = process.env.CHATBOT_API_KEY;
    this.conversationHistory = [];
    this.validations = [];
    this.stats = {
      total: 0,
      validated: 0,
      issues: 0,
      errors: 0
    };
  }

  /**
   * Send request to chatbot
   */
  async askChatbot(message) {
    if (!this.apiKey) {
      throw new Error('CHATBOT_API_KEY environment variable not set');
    }

    try {
      const response = await axios.post(
        `https://${this.chatbotUrl}/chat`,
        {
          message,
          conversation_history: this.conversationHistory.slice(-20) // Last 20 messages for context
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const result = response.data.response || '';

      // Maintain conversation history
      this.conversationHistory.push({ role: 'user', content: message });
      this.conversationHistory.push({ role: 'assistant', content: result });

      return result;
    } catch (error) {
      console.error('Chatbot error:', error.message);
      throw error;
    }
  }

  /**
   * Load audit data
   */
  loadAuditData() {
    if (!fs.existsSync(AUDIT_FILE)) {
      throw new Error(`Audit file not found: ${AUDIT_FILE}`);
    }

    const data = fs.readFileSync(AUDIT_FILE, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Build validation prompt for a CTA
   */
  buildValidationPrompt(cta) {
    let prompt = `Evaluate this CTA (Call-to-Action) for consistency with Wavelength lore:\n\n`;
    prompt += `Type: ${cta.type}\n`;
    prompt += `Title: ${cta.title}\n`;

    if (cta.type === 'character') {
      if (cta.cta_text) prompt += `CTA Text: "${cta.cta_text}"\n`;
      if (cta.tagline) prompt += `Tagline: "${cta.tagline}"\n`;
      if (cta.stakes) prompt += `Stakes: "${cta.stakes}"\n`;
    } else if (cta.type === 'episode') {
      if (cta.cta_tagline) prompt += `CTA Tagline: "${cta.cta_tagline}"\n`;
      if (cta.cliffhanger_hook) prompt += `Cliffhanger: "${cta.cliffhanger_hook}"\n`;
      if (cta.next_episode_tease) prompt += `Next Episode Tease: "${cta.next_episode_tease}"\n`;
      prompt += `Season: ${cta.season}\n`;
    } else if (cta.type === 'lore') {
      if (cta.intrigue_hook) prompt += `Intrigue Hook: "${cta.intrigue_hook}"\n`;
      if (cta.enhanced_title) prompt += `Enhanced Title: "${cta.enhanced_title}"\n`;
      prompt += `Category: ${cta.category}\n`;
    }

    prompt += `\nPlease evaluate:\n`;
    prompt += `1. Is this CTA consistent with Wavelength lore?\n`;
    prompt += `2. Does it accurately represent the character/episode/lore element?\n`;
    prompt += `3. Are there any concerns or issues?\n`;
    prompt += `4. Rate consistency: Poor (1) / Fair (2) / Good (3) / Excellent (4)\n\n`;
    prompt += `Provide a brief assessment.`;

    return prompt;
  }

  /**
   * Validate a single CTA
   */
  async validateCTA(cta, index, total) {
    this.stats.total++;

    try {
      process.stdout.write(`[${index}/${total}] Validating ${cta.type}: ${cta.title}... `);

      const prompt = this.buildValidationPrompt(cta);
      const response = await this.askChatbot(prompt);

      const validation = {
        id: `${cta.type}-${cta.id}`,
        type: cta.type,
        title: cta.title,
        category: cta.category || null,
        source: cta.source,
        cta_content: {
          cta_text: cta.cta_text || null,
          tagline: cta.tagline || null,
          stakes: cta.stakes || null,
          cta_tagline: cta.cta_tagline || null,
          cliffhanger_hook: cta.cliffhanger_hook || null,
          intrigue_hook: cta.intrigue_hook || null
        },
        chatbot_assessment: response,
        timestamp: new Date().toISOString(),
        issues: this.extractIssues(response)
      };

      this.validations.push(validation);
      this.stats.validated++;

      if (validation.issues.length > 0) {
        this.stats.issues++;
        console.log(`⚠️  ${validation.issues.length} issue(s)`);
      } else {
        console.log(`✅`);
      }

      // Rate limit to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ Error`);
      this.stats.errors++;

      this.validations.push({
        id: `${cta.type}-${cta.id}`,
        type: cta.type,
        title: cta.title,
        source: cta.source,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Extract potential issues from chatbot response
   */
  extractIssues(response) {
    const issues = [];
    const lowerResponse = response.toLowerCase();

    // Keywords that might indicate issues
    const issueKeywords = [
      'inconsistent',
      'unclear',
      'confusing',
      'doesn\'t match',
      'misleading',
      'inaccurate',
      'problematic',
      'concern',
      'issue',
      'poor',
      'weak'
    ];

    issueKeywords.forEach(keyword => {
      if (lowerResponse.includes(keyword)) {
        issues.push(keyword);
      }
    });

    // Extract rating if present
    const ratingMatch = response.match(/rating:?\s*([1-4])/i);
    if (ratingMatch && parseInt(ratingMatch[1]) < 3) {
      issues.push(`low_rating_${ratingMatch[1]}`);
    }

    return issues;
  }

  /**
   * Validate all CTAs
   */
  async validateAll() {
    const auditData = this.loadAuditData();
    const ctas = auditData.ctas || [];

    console.log(`\n🔍 Starting validation of ${ctas.length} CTAs...\n`);

    for (let i = 0; i < ctas.length; i++) {
      await this.validateCTA(ctas[i], i + 1, ctas.length);
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_ctas: this.stats.total,
        successfully_validated: this.stats.validated,
        with_issues: this.stats.issues,
        validation_errors: this.stats.errors,
        success_rate: this.stats.total > 0
          ? ((this.stats.validated / this.stats.total) * 100).toFixed(2) + '%'
          : 'N/A'
      },
      validations: this.validations,
      issues_summary: this.generateIssueSummary(),
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${REPORT_FILE}`);

    return report;
  }

  /**
   * Generate summary of issues
   */
  generateIssueSummary() {
    const issueSummary = {};

    this.validations.forEach(validation => {
      if (validation.issues && validation.issues.length > 0) {
        if (!issueSummary[validation.type]) {
          issueSummary[validation.type] = [];
        }

        issueSummary[validation.type].push({
          title: validation.title,
          issues: validation.issues,
          assessment: validation.chatbot_assessment ?
            validation.chatbot_assessment.substring(0, 200) :
            'N/A'
        });
      }
    });

    return issueSummary;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.stats.issues > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Review CTAs with flagged issues',
        count: this.stats.issues,
        details: 'CTAs marked with issues should be reviewed and revised for consistency'
      });
    }

    if (this.stats.errors > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Retry validation for failed CTAs',
        count: this.stats.errors,
        details: 'Some CTAs failed validation; retry after API issues are resolved'
      });
    }

    if (this.stats.validated > 0) {
      recommendations.push({
        priority: 'info',
        action: 'Update lore documentation',
        details: 'Review all feedback and update character/episode/lore descriptions as needed'
      });
    }

    return recommendations;
  }

  /**
   * Display summary
   */
  displaySummary() {
    console.log('\n📊 Validation Summary:');
    console.log(`  Total CTAs: ${this.stats.total}`);
    console.log(`  Successfully Validated: ${this.stats.validated}`);
    console.log(`  With Issues: ${this.stats.issues}`);
    console.log(`  Validation Errors: ${this.stats.errors}`);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🎵 Wavelength Lore CTA Validator\n');

    const validator = new CTAValidator();
    await validator.validateAll();

    const report = validator.generateReport();
    validator.displaySummary();

    console.log(`\n✨ Validation complete!`);
  } catch (error) {
    console.error('❌ Error during validation:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CTAValidator;
