/**
 * WAVELENGTH GitHub Integration
 * Ingests GitHub issues, PRs, and commits for AI memory system
 */

import { Octokit } from '@octokit/rest';
import WavelengthVectorStorage from './vector-storage.js';

export class GitHubIntegration {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.vectorStorage = new WavelengthVectorStorage();
  }

  async ingestIssues(repository, options = {}) {
    const {
      state = 'closed',
      labels = ['bug', 'enhancement', 'production'],
      since = '2023-01-01',
      limit = 100
    } = options;

    try {
      const [owner, repo] = repository.split('/');
      
      console.log(`🔄 Ingesting GitHub issues from ${repository}...`);
      
      const issues = await this.octokit.paginate(this.octokit.rest.issues.listForRepo, {
        owner,
        repo,
        state,
        labels: labels.join(','),
        since,
        per_page: 100
      });

      let processed = 0;
      const results = [];

      for (const issue of issues.slice(0, limit)) {
        if (issue.pull_request) continue; // Skip PRs in issues endpoint
        
        const knowledge = {
          id: `github_issue_${issue.number}`,
          type: 'github_issue',
          content: `${issue.title}\n\n${issue.body || ''}`,
          tags: [
            'github',
            'issue',
            ...issue.labels.map(label => label.name),
            issue.state
          ],
          context: {
            issue_number: issue.number,
            state: issue.state,
            created_at: issue.created_at,
            closed_at: issue.closed_at,
            assignees: issue.assignees.map(a => a.login),
            milestone: issue.milestone?.title,
            repository,
            url: issue.html_url,
            comments_count: issue.comments
          },
          timestamp: issue.closed_at || issue.created_at
        };

        // Store in vector database
        await this.vectorStorage.storeKnowledge(knowledge);
        results.push(knowledge.id);
        processed++;

        if (processed % 10 === 0) {
          console.log(`📊 Processed ${processed}/${issues.length} issues`);
        }
      }

      console.log(`✅ Successfully ingested ${processed} GitHub issues`);
      return { success: true, processed, results };

    } catch (error) {
      console.error('❌ GitHub issues ingestion failed:', error);
      throw error;
    }
  }

  async ingestCommits(repository, options = {}) {
    const {
      since = '2023-01-01',
      limit = 200
    } = options;

    try {
      const [owner, repo] = repository.split('/');
      
      console.log(`🔄 Ingesting GitHub commits from ${repository}...`);
      
      const commits = await this.octokit.paginate(this.octokit.rest.repos.listCommits, {
        owner,
        repo,
        since,
        per_page: 100
      });

      let processed = 0;
      const results = [];

      for (const commit of commits.slice(0, limit)) {
        // Skip merge commits and minor changes
        if (commit.commit.message.startsWith('Merge') || 
            commit.commit.message.length < 20) continue;

        const knowledge = {
          id: `github_commit_${commit.sha.substring(0, 8)}`,
          type: 'github_commit',
          content: `${commit.commit.message}\n\nFiles changed: ${commit.files?.length || 0}`,
          tags: [
            'github',
            'commit',
            ...this.extractCommitTags(commit.commit.message)
          ],
          context: {
            sha: commit.sha,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            files_changed: commit.files?.map(f => f.filename) || [],
            additions: commit.stats?.additions || 0,
            deletions: commit.stats?.deletions || 0,
            repository,
            url: commit.html_url
          },
          timestamp: commit.commit.author.date
        };

        await this.vectorStorage.storeKnowledge(knowledge);
        results.push(knowledge.id);
        processed++;

        if (processed % 20 === 0) {
          console.log(`📊 Processed ${processed}/${commits.length} commits`);
        }
      }

      console.log(`✅ Successfully ingested ${processed} GitHub commits`);
      return { success: true, processed, results };

    } catch (error) {
      console.error('❌ GitHub commits ingestion failed:', error);
      throw error;
    }
  }

  extractCommitTags(message) {
    const tags = [];
    const lowerMessage = message.toLowerCase();
    
    // Common patterns
    if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) tags.push('fix');
    if (lowerMessage.includes('feat') || lowerMessage.includes('add')) tags.push('feature');
    if (lowerMessage.includes('docker')) tags.push('docker');
    if (lowerMessage.includes('build')) tags.push('build');
    if (lowerMessage.includes('deploy')) tags.push('deployment');
    if (lowerMessage.includes('test')) tags.push('testing');
    if (lowerMessage.includes('config')) tags.push('configuration');
    
    return tags;
  }

  async findSimilarIssues(currentIssue, repository) {
    try {
      const results = await this.vectorStorage.searchKnowledge(currentIssue, {
        type: 'github_issue',
        limit: 5,
        threshold: 0.6
      });

      const similarIssues = (results.results || [])
        .filter(result => result.context && result.context.repository === repository)
        .map(result => ({
          issue_number: result.context.issue_number,
          title: result.content.split('\n')[0],
          similarity: result.score,
          state: result.context.state,
          url: result.context.url,
          labels: result.tags.filter(tag => !['github', 'issue'].includes(tag))
        }));

      return { success: true, similar_issues: similarIssues };

    } catch (error) {
      console.error('❌ Similar issues search failed:', error);
      throw error;
    }
  }

  async getIngestionStats() {
    try {
      const stats = await this.vectorStorage.getStats();
      
      return {
        success: true,
        message: 'GitHub integration statistics',
        vector_storage_stats: stats.stats,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Stats retrieval failed:', error);
      throw error;
    }
  }
}

export default GitHubIntegration;