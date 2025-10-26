#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH SUPER TOOL: Quick Issue Generator CLI
 * 
 * Simple command-line interface for generating GitHub issues
 * from WAVELENGTH problem-solving sessions.
 * 
 * Usage: node scripts/quick-issue-gen.js
 */

const GitHubIssueGenerator = require('./github-issue-generator');
const readline = require('readline');

class QuickIssueGenerator {
  constructor() {
    this.generator = new GitHubIssueGenerator();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  async promptArray(question) {
    const answer = await this.prompt(question + ' (separate with commas): ');
    return answer.split(',').map(item => item.trim()).filter(item => item);
  }

  async collectSessionData() {
    console.log('🌊 WAVELENGTH Quick Issue Generator');
    console.log('Please provide the following information:\n');

    const sessionData = {};

    sessionData.title = await this.prompt('Issue title: ');
    sessionData.summary = await this.prompt('Brief summary: ');
    sessionData.initialError = await this.prompt('Initial error/problem: ');
    
    sessionData.symptoms = await this.promptArray('Symptoms observed');
    sessionData.impact = await this.prompt('Impact of the issue: ');
    
    sessionData.investigation = await this.promptArray('Investigation steps taken');
    sessionData.rootCause = await this.prompt('Root cause identified: ');
    sessionData.whyItHappened = await this.prompt('Why it happened: ');
    
    sessionData.approach = await this.prompt('Solution approach: ');
    sessionData.changes = await this.promptArray('Changes made');
    
    sessionData.technologies = await this.promptArray('Technologies involved');
    sessionData.filesModified = await this.promptArray('Files modified');
    sessionData.commands = await this.promptArray('Key commands executed');
    
    sessionData.verification = await this.promptArray('Verification steps');
    sessionData.prevention = await this.promptArray('Prevention measures');
    
    const difficulty = await this.prompt('Difficulty level (easy/medium/hard/expert): ');
    sessionData.difficulty = ['easy', 'medium', 'hard', 'expert'].includes(difficulty) ? difficulty : 'medium';
    
    sessionData.timeToResolve = await this.prompt('Time to resolve: ');
    sessionData.category = await this.prompt('Category (infrastructure/bug/feature/etc): ');

    return sessionData;
  }

  async run() {
    try {
      const sessionData = await this.collectSessionData();
      
      console.log('\n🔄 Generating GitHub issue...');
      const result = await this.generator.generateIssue(sessionData);
      
      console.log('\n✅ Issue generated successfully!');
      console.log(`📄 File: ${result.filename}`);
      console.log(`🔗 GitHub: ${result.githubUrl}`);
      console.log(`#️⃣ Issue: #${result.issueNumber}`);
      
      const shouldClose = await this.prompt('\nClose issue as completed? (y/n): ');
      if (shouldClose.toLowerCase() === 'y') {
        await this.generator.closeIssueAsCompleted(result.issueNumber);
      }
      
    } catch (error) {
      console.error('❌ Error generating issue:', error.message);
    } finally {
      this.rl.close();
    }
  }
}

// Predefined session templates for common scenarios
const templates = {
  'docker-issue': {
    title: 'Docker Container Configuration Issue',
    technologies: ['Docker', 'Node.js', 'Nginx'],
    category: 'infrastructure'
  },
  'deployment-issue': {
    title: 'Production Deployment Failure',
    technologies: ['AWS', 'GitHub Actions', 'Docker'],
    category: 'deployment'
  },
  'performance-issue': {
    title: 'Application Performance Problem',
    technologies: ['Node.js', 'Database'],
    category: 'performance'
  }
};

// CLI Arguments handling
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🌊 WAVELENGTH Quick Issue Generator

Usage:
  node scripts/quick-issue-gen.js              # Interactive mode
  node scripts/quick-issue-gen.js --template   # Show available templates
  node scripts/quick-issue-gen.js --example    # Generate with example data

Options:
  --help, -h        Show this help message
  --template        List available templates
  --example         Use example session data
`);
  process.exit(0);
}

if (args.includes('--template')) {
  console.log('🌊 Available templates:');
  Object.keys(templates).forEach(key => {
    console.log(`  ${key}: ${templates[key].title}`);
  });
  process.exit(0);
}

if (args.includes('--example')) {
  // Use the example from the main generator
  const generator = new GitHubIssueGenerator();
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
    rootCause: 'Wrong startup script being copied in Dockerfile',
    whyItHappened: 'Recent change used incorrect script with hardcoded values',
    approach: 'Switch to correct production startup script',
    changes: [
      'Modified Dockerfile to copy correct startup script',
      'Enhanced nginx configuration template',
      'Fixed startup script process management'
    ],
    technologies: ['Docker', 'AWS App Runner', 'Nginx', 'Node.js'],
    filesModified: ['Dockerfile', 'config/nginx.conf.template', 'docker/docker-start.sh'],
    verification: ['Container starts successfully', 'Health checks pass', 'No rollback occurs'],
    prevention: ['Document script differences', 'Add validation to CI/CD'],
    difficulty: 'expert',
    timeToResolve: '2 hours',
    category: 'infrastructure'
  };

  generator.generateIssue(exampleSession).then(result => {
    console.log('✅ Example issue generated:', result.githubUrl);
  });
} else {
  // Interactive mode
  const quickGen = new QuickIssueGenerator();
  quickGen.run();
}