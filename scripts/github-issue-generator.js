#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH SUPER TOOL: GitHub Issue Knowledge Generator
 * 
 * Generates completed GitHub issues from problem-solving sessions for
 * WAVELENGTH AGENTS dynamic vector store knowledge base integration.
 * 
 * Usage: node scripts/github-issue-generator.js [options]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GitHubIssueGenerator {
  constructor() {
    this.issueTemplate = {
      metadata: {
        generatedBy: 'WAVELENGTH AGENTS',
        purpose: 'Dynamic Vector Store Knowledge Base',
        category: 'problem-solving-session',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      },
      structure: {
        title: '',
        summary: '',
        problemDescription: '',
        rootCauseAnalysis: '',
        solutionImplemented: '',
        technicalDetails: '',
        filesModified: [],
        commands: [],
        verification: [],
        preventionMeasures: [],
        tags: [],
        difficulty: 'medium',
        timeToResolve: '',
        commitHash: ''
      }
    };
  }

  /**
   * Generate GitHub issue from session data
   */
  async generateIssue(sessionData) {
    console.log('🌊 WAVELENGTH: Generating GitHub issue for knowledge base...');
    
    const issue = this.buildIssueContent(sessionData);
    const filename = this.createIssueFile(issue);
    const githubUrl = await this.createGitHubIssue(issue, filename);
    
    console.log(`✅ GitHub issue created: ${githubUrl}`);
    console.log(`📄 Documentation saved: ${filename}`);
    
    return {
      githubUrl,
      filename,
      issueNumber: this.extractIssueNumber(githubUrl),
      metadata: issue.metadata
    };
  }

  /**
   * Build comprehensive issue content from session data
   */
  buildIssueContent(data) {
    const issue = JSON.parse(JSON.stringify(this.issueTemplate));
    
    // Core issue information
    issue.structure.title = data.title || 'WAVELENGTH Problem Resolution Session';
    issue.structure.summary = data.summary || '';
    issue.structure.problemDescription = this.formatProblemDescription(data);
    issue.structure.rootCauseAnalysis = this.formatRootCause(data);
    issue.structure.solutionImplemented = this.formatSolution(data);
    issue.structure.technicalDetails = this.formatTechnicalDetails(data);
    
    // Session metadata
    issue.structure.filesModified = data.filesModified || [];
    issue.structure.commands = data.commands || [];
    issue.structure.verification = data.verification || [];
    issue.structure.preventionMeasures = data.prevention || [];
    issue.structure.tags = this.generateTags(data);
    issue.structure.difficulty = data.difficulty || this.assessDifficulty(data);
    issue.structure.timeToResolve = data.timeToResolve || 'Not specified';
    issue.structure.commitHash = this.getLatestCommitHash();
    
    return issue;
  }

  /**
   * Format problem description section
   */
  formatProblemDescription(data) {
    let description = '## Problem Description\n\n';
    
    if (data.initialError) {
      description += `**Initial Error**: ${data.initialError}\n\n`;
    }
    
    if (data.symptoms && data.symptoms.length > 0) {
      description += '**Symptoms Observed**:\n';
      data.symptoms.forEach(symptom => {
        description += `- ${symptom}\n`;
      });
      description += '\n';
    }
    
    if (data.impact) {
      description += `**Impact**: ${data.impact}\n\n`;
    }
    
    return description;
  }

  /**
   * Format root cause analysis section
   */
  formatRootCause(data) {
    let analysis = '## Root Cause Analysis\n\n';
    
    if (data.investigation && data.investigation.length > 0) {
      analysis += '**Investigation Steps**:\n';
      data.investigation.forEach((step, index) => {
        analysis += `${index + 1}. ${step}\n`;
      });
      analysis += '\n';
    }
    
    if (data.rootCause) {
      analysis += `**Root Cause Identified**: ${data.rootCause}\n\n`;
    }
    
    if (data.whyItHappened) {
      analysis += `**Why It Happened**: ${data.whyItHappened}\n\n`;
    }
    
    return analysis;
  }

  /**
   * Format solution implementation section
   */
  formatSolution(data) {
    let solution = '## Solution Implemented\n\n';
    
    if (data.approach) {
      solution += `**Approach**: ${data.approach}\n\n`;
    }
    
    if (data.changes && data.changes.length > 0) {
      solution += '**Changes Made**:\n';
      data.changes.forEach(change => {
        solution += `- ${change}\n`;
      });
      solution += '\n';
    }
    
    if (data.codeChanges && data.codeChanges.length > 0) {
      solution += '**Code Changes**:\n';
      data.codeChanges.forEach(change => {
        solution += `\`\`\`${change.language || 'text'}\n${change.code}\n\`\`\`\n\n`;
      });
    }
    
    return solution;
  }

  /**
   * Format technical details section
   */
  formatTechnicalDetails(data) {
    let details = '## Technical Details\n\n';
    
    if (data.technologies && data.technologies.length > 0) {
      details += '**Technologies Involved**:\n';
      data.technologies.forEach(tech => {
        details += `- ${tech}\n`;
      });
      details += '\n';
    }
    
    if (data.architecture) {
      details += `**Architecture**: ${data.architecture}\n\n`;
    }
    
    if (data.dependencies && data.dependencies.length > 0) {
      details += '**Dependencies**:\n';
      data.dependencies.forEach(dep => {
        details += `- ${dep}\n`;
      });
      details += '\n';
    }
    
    return details;
  }

  /**
   * Generate relevant tags for the issue
   */
  generateTags(data) {
    const tags = new Set(['wavelength-agents', 'knowledge-base', 'resolved']);
    
    // Add technology tags
    if (data.technologies) {
      data.technologies.forEach(tech => {
        tags.add(tech.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-'));
      });
    }
    
    // Add difficulty tag
    if (data.difficulty) {
      tags.add(`difficulty-${data.difficulty}`);
    }
    
    // Add category tags
    if (data.category) {
      tags.add(data.category);
    }
    
    return Array.from(tags);
  }

  /**
   * Assess difficulty level based on session data
   */
  assessDifficulty(data) {
    let score = 0;
    
    // Complexity indicators
    if (data.investigation && data.investigation.length > 5) score += 1;
    if (data.filesModified && data.filesModified.length > 3) score += 1;
    if (data.technologies && data.technologies.length > 2) score += 1;
    if (data.multipleApproaches) score += 1;
    if (data.systemLevelChanges) score += 2;
    
    if (score >= 4) return 'expert';
    if (score >= 2) return 'hard';
    if (score >= 1) return 'medium';
    return 'easy';
  }

  /**
   * Create issue markdown file
   */
  createIssueFile(issue) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `GITHUB_ISSUE_${timestamp}_${Date.now()}.md`;
    const filepath = path.join(process.cwd(), filename);
    
    const content = this.formatIssueMarkdown(issue);
    fs.writeFileSync(filepath, content, 'utf8');
    
    return filename;
  }

  /**
   * Format issue as markdown
   */
  formatIssueMarkdown(issue) {
    const { metadata, structure } = issue;
    
    let markdown = `# ${structure.title}\n\n`;
    
    // Metadata section
    markdown += '<!-- WAVELENGTH AGENTS METADATA\n';
    markdown += JSON.stringify(metadata, null, 2);
    markdown += '\n-->\n\n';
    
    // Summary
    if (structure.summary) {
      markdown += `## Summary\n${structure.summary}\n\n`;
    }
    
    // Core sections
    markdown += structure.problemDescription;
    markdown += structure.rootCauseAnalysis;
    markdown += structure.solutionImplemented;
    markdown += structure.technicalDetails;
    
    // Files modified
    if (structure.filesModified.length > 0) {
      markdown += '## Files Modified\n';
      structure.filesModified.forEach(file => {
        markdown += `- \`${file}\`\n`;
      });
      markdown += '\n';
    }
    
    // Commands executed
    if (structure.commands.length > 0) {
      markdown += '## Commands Executed\n';
      structure.commands.forEach(cmd => {
        markdown += `\`\`\`bash\n${cmd}\n\`\`\`\n\n`;
      });
    }
    
    // Verification steps
    if (structure.verification.length > 0) {
      markdown += '## Verification\n';
      structure.verification.forEach(step => {
        markdown += `- ✅ ${step}\n`;
      });
      markdown += '\n';
    }
    
    // Prevention measures
    if (structure.preventionMeasures.length > 0) {
      markdown += '## Prevention Measures\n';
      structure.preventionMeasures.forEach(measure => {
        markdown += `- ${measure}\n`;
      });
      markdown += '\n';
    }
    
    // Footer metadata
    markdown += '---\n';
    markdown += `**Difficulty**: ${structure.difficulty}\n`;
    markdown += `**Time to Resolve**: ${structure.timeToResolve}\n`;
    markdown += `**Commit Hash**: \`${structure.commitHash}\`\n`;
    markdown += `**Tags**: ${structure.tags.join(', ')}\n`;
    markdown += `**Generated**: ${metadata.timestamp}\n`;
    
    return markdown;
  }

  /**
   * Create GitHub issue using CLI
   */
  async createGitHubIssue(issue, filename) {
    try {
      const title = issue.structure.title;
      const labels = issue.structure.tags.slice(0, 5).join(','); // GitHub has label limits
      
      const command = `gh issue create --title "${title}" --body-file "${filename}" --label "${labels}"`;
      const output = execSync(command, { encoding: 'utf8' });
      
      return output.trim();
    } catch (error) {
      console.error('❌ Failed to create GitHub issue:', error.message);
      throw error;
    }
  }

  /**
   * Close issue as completed
   */
  async closeIssueAsCompleted(issueNumber, comment = '✅ RESOLVED: Issue documented and integrated into WAVELENGTH knowledge base.') {
    try {
      const command = `gh issue close ${issueNumber} --comment "${comment}"`;
      execSync(command, { encoding: 'utf8' });
      console.log(`✅ Issue #${issueNumber} closed as completed`);
    } catch (error) {
      console.error(`❌ Failed to close issue #${issueNumber}:`, error.message);
    }
  }

  /**
   * Extract issue number from GitHub URL
   */
  extractIssueNumber(url) {
    const match = url.match(/issues\/(\d+)$/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Get latest commit hash
   */
  getLatestCommitHash() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }
}

// CLI Interface
if (require.main === module) {
  const generator = new GitHubIssueGenerator();
  
  // Example usage with session data
  const exampleSession = {
    title: 'Docker Container Startup Script Configuration Issue',
    summary: 'Production deployments failing due to incorrect startup script selection causing App Runner rollbacks.',
    initialError: '/app/start.sh: not found',
    symptoms: [
      'Docker builds completing but containers failing to start',
      'App Runner automatically rolling back all deployments',
      'Health checks failing on container startup'
    ],
    impact: 'Critical - No new deployments possible in production',
    investigation: [
      'Analyzed Docker build logs for file path issues',
      'Examined App Runner deployment history and rollback patterns',
      'Compared development vs production startup scripts',
      'Identified two different startup script approaches'
    ],
    rootCause: 'Wrong startup script being copied in Dockerfile - development script instead of production template-based script',
    whyItHappened: 'Recent change to fix file path used incorrect script with hardcoded values instead of environment variable templates',
    approach: 'Switch to correct production startup script and enhance nginx template configuration',
    changes: [
      'Modified Dockerfile to copy docker/docker-start.sh instead of docker-start.sh',
      'Enhanced nginx.conf.template with comprehensive configuration',
      'Fixed startup script to run nginx without sudo and proper process management'
    ],
    technologies: ['Docker', 'AWS App Runner', 'Nginx', 'Node.js', 'GitHub Actions', 'ECR'],
    filesModified: ['Dockerfile', 'config/nginx.conf.template', 'docker/docker-start.sh'],
    commands: [
      'docker build -t wavelength-lore .',
      'aws apprunner update-service --service-arn ...',
      'git commit -m "Fix startup script configuration"'
    ],
    verification: [
      'Docker build completes successfully',
      'Container starts without errors',
      'Nginx configuration generates correctly',
      'Health checks respond on both ports',
      'App Runner deployment succeeds without rollback'
    ],
    prevention: [
      'Document distinction between development and production scripts',
      'Add container startup validation to CI/CD pipeline',
      'Implement enhanced monitoring for deployment rollbacks'
    ],
    difficulty: 'expert',
    timeToResolve: '2 hours',
    category: 'infrastructure'
  };
  
  console.log('🌊 WAVELENGTH GitHub Issue Generator');
  console.log('Usage: Provide session data object to generate comprehensive GitHub issues\n');
  
  // For CLI usage, you would typically read session data from a file or stdin
  // generator.generateIssue(exampleSession).then(result => {
  //   console.log('Generated issue:', result);
  // });
}

module.exports = GitHubIssueGenerator;