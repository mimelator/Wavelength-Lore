#!/usr/bin/env node

/**
 * WAVELENGTH GitHub History Ingestion
 * Ingests GitHub issues and commits into the memory system
 */

import GitHubIntegration from '../lib/github-integration.js';

async function ingestGitHubHistory() {
  console.log('📚 Ingesting WAVELENGTH GitHub History...\n');

  try {
    const github = new GitHubIntegration();
    
    // Repository to ingest from
    const repository = 'mimelator/Wavelength-Lore';
    
    console.log(`🔄 Starting ingestion from ${repository}...`);

    // Ingest closed issues (bugs and enhancements)
    console.log('\n1️⃣ Ingesting GitHub Issues...');
    const issuesResult = await github.ingestIssues(repository, {
      state: 'closed',
      labels: ['bug', 'enhancement', 'production', 'docker', 'build'],
      since: '2023-01-01',
      limit: 50 // Start with recent issues
    });

    if (issuesResult.success) {
      console.log(`✅ Successfully ingested ${issuesResult.processed} GitHub issues`);
    } else {
      console.log('❌ GitHub issues ingestion failed');
    }

    // Ingest recent commits with meaningful changes
    console.log('\n2️⃣ Ingesting GitHub Commits...');
    const commitsResult = await github.ingestCommits(repository, {
      since: '2024-01-01', // Focus on recent commits
      limit: 100
    });

    if (commitsResult.success) {
      console.log(`✅ Successfully ingested ${commitsResult.processed} GitHub commits`);
    } else {
      console.log('❌ GitHub commits ingestion failed');
    }

    // Test correlation with current Docker issue
    console.log('\n3️⃣ Testing Issue Correlation...');
    const correlationResult = await github.findSimilarIssues(
      'Docker build failing /app/start.sh not found',
      repository
    );

    if (correlationResult.success) {
      console.log(`✅ Found ${correlationResult.similar_issues.length} similar issues in history`);
      correlationResult.similar_issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. Issue #${issue.issue_number}: ${issue.title} (${issue.similarity.toFixed(3)} similarity)`);
      });
    }

    // Get final statistics
    console.log('\n📊 Final Statistics:');
    const stats = await github.getIngestionStats();
    if (stats.success && stats.vector_storage_stats) {
      console.log(`   Total vectors in storage: ${stats.vector_storage_stats.total_vectors || 'Unknown'}`);
      console.log(`   Index fullness: ${((stats.vector_storage_stats.index_fullness || 0) * 100).toFixed(2)}%`);
    }

    console.log('\n🎉 GitHub history ingestion completed!');
    console.log('\n📋 What\'s Available Now:');
    console.log('   • Historical issue solutions and patterns');
    console.log('   • Commit-based fix strategies');
    console.log('   • Automatic correlation with current problems');
    console.log('   • Smart suggestions based on past successes');

    console.log('\n🚀 Try It Out:');
    console.log('   await mcp.callTool("wavelength_memory", {');
    console.log('     action: "recall",');
    console.log('     query: "Docker build issues"');
    console.log('   });');

  } catch (error) {
    console.error('❌ GitHub ingestion failed:', error);
    
    // Provide helpful error context
    if (error.message.includes('API rate limit')) {
      console.log('\n💡 Tip: GitHub API rate limit reached. Try again in an hour or use a GitHub token with higher limits.');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Tip: Set GITHUB_TOKEN environment variable with repo read permissions.');
    }
    
    process.exit(1);
  }
}

// Run ingestion
ingestGitHubHistory();