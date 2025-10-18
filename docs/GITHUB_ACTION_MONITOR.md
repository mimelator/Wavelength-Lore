# GitHub Action Monitor Documentation

## 📋 Overview

The GitHub Action Monitor (`github-action-monitor.js`) is a comprehensive CI/CD pipeline monitoring tool that provides real-time tracking of GitHub Actions workflows. It's designed to give developers immediate visibility into deployment progress and pipeline status.

## 🚀 Features

### Real-time Monitoring
- **Live Status Updates**: 30-second polling intervals for current action status
- **Progress Tracking**: Monitor actions from queued to completion
- **Automatic Completion Detection**: Stops monitoring when actions finish
- **Graceful Interruption**: Handle Ctrl+C without breaking running deployments

### Comprehensive Information Display
- **Action Details**: Name, Run ID, status, and duration
- **Commit Information**: SHA, commit message, and branch details
- **Direct Access**: Clickable URLs to GitHub Actions interface
- **Visual Status Indicators**: Emoji-based status representation
- **Time Tracking**: Start time, duration, and completion timestamps

### Multi-Repository Support
- **Default Repository**: Configured for `mimelator/Wavelength-Lore`
- **Custom Repositories**: Monitor any GitHub repository with `--repo` flag
- **Cross-Project Monitoring**: Track multiple projects with different instances

## 🎯 Usage

### Basic Status Check
```bash
node scripts/github-action-monitor.js
```

**Output Example:**
```
🔍 GitHub Action Monitor for mimelator/Wavelength-Lore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Latest Action: Build and Deploy to ECR
🆔 Run ID: 18609624613
📊 Status: 🟡 IN PROGRESS
⏰ Started: 10/17/2025, 7:46:20 PM
⏱️ Duration: 2m 15s
🌐 URL: https://github.com/mimelator/Wavelength-Lore/actions/runs/18609624613
🔗 Commit: 6dc9634 - deployment and monitoring scripts and nginx fix
```

### Real-time Watch Mode
```bash
node scripts/github-action-monitor.js --watch
```

**Features:**
- Continuous monitoring until completion
- Real-time status updates every 30 seconds
- Progress indicators during execution
- Automatic termination on completion
- Ctrl+C safe interruption

### Custom Repository Monitoring
```bash
node scripts/github-action-monitor.js --repo owner/repository-name
```

## 📊 Status Indicators

| Status | Indicator | Description |
|--------|-----------|-------------|
| `queued` | ⏳ QUEUED | Action is waiting to start |
| `in_progress` | 🟡 IN PROGRESS | Action is currently running |
| `completed` + `success` | ✅ SUCCESS | Action completed successfully |
| `completed` + `failure` | ❌ FAILED | Action failed with errors |
| `completed` + `cancelled` | ⏹️ CANCELLED | Action was manually cancelled |
| `completed` + `skipped` | ⏭️ SKIPPED | Action was skipped |

## 🔧 Integration with Deployment Workflow

### Complete Deployment Monitoring
```bash
# 1. Check current GitHub Action status
node scripts/github-action-monitor.js

# 2. Watch GitHub Action deployment
node scripts/github-action-monitor.js --watch

# 3. Monitor App Runner deployment (after GitHub Action completes)
node scripts/apprunner-deploy-monitor.js

# 4. Verify production environment
node scripts/check-production-env.js
```

### Automated Deployment Pipeline
```bash
# Monitor the entire CI/CD pipeline
node scripts/github-action-monitor.js --watch && \
node scripts/apprunner-deploy-monitor.js --reason "Post-CI deployment check"
```

## 🎯 Use Cases

### Development Workflow
- **Code Push Verification**: Confirm actions start after git push
- **Build Status Monitoring**: Track compilation and testing progress
- **Deployment Verification**: Ensure successful deployment to staging/production

### DevOps Operations
- **Pipeline Health Monitoring**: Track CI/CD pipeline performance
- **Failure Investigation**: Quick access to failed action logs
- **Release Management**: Monitor production deployments in real-time

### Team Collaboration
- **Shared Monitoring**: Team members can track the same deployments
- **Status Communication**: Clear status indicators for team updates
- **Troubleshooting Support**: Direct links to action logs for debugging

## 🔍 Troubleshooting

### Common Issues

#### No Actions Found
```
❌ No GitHub Actions found for this repository
```
**Solutions:**
- Verify repository name spelling
- Check if GitHub Actions are enabled for the repository
- Ensure the repository has workflow files in `.github/workflows/`

#### API Rate Limiting
```
❌ Error fetching GitHub Action status: API rate limit exceeded
```
**Solutions:**
- Wait for rate limit reset (typically 1 hour)
- Use GitHub token authentication (future enhancement)
- Reduce monitoring frequency

#### Network Connectivity Issues
```
❌ GitHub API request failed: ENOTFOUND api.github.com
```
**Solutions:**
- Check internet connectivity
- Verify DNS resolution
- Check firewall/proxy settings

### Performance Considerations

- **Polling Frequency**: 30-second intervals balance responsiveness with API limits
- **Resource Usage**: Minimal CPU and memory footprint
- **Network Traffic**: Approximately 1-2KB per API request

## 🔮 Future Enhancements

### Planned Features
- **GitHub Token Authentication**: Support for private repositories and higher rate limits
- **Workflow-Specific Monitoring**: Filter by workflow name or type
- **Notification Integration**: Slack/email alerts on completion/failure
- **Historical Analysis**: Track deployment patterns and performance metrics
- **Multi-Repository Dashboard**: Monitor multiple repositories simultaneously

### Configuration Options
- **Custom Polling Intervals**: Adjustable monitoring frequency
- **Output Formatting**: JSON, CSV, or custom format options
- **Filtering Capabilities**: Monitor specific workflows or branches
- **Integration Hooks**: Webhook support for external integrations

## 📚 Related Tools

- **`apprunner-deploy-monitor.js`**: AWS App Runner deployment monitoring
- **`deploy.sh`**: Convenient deployment wrapper with monitoring
- **`apprunner-env-updater.js`**: Environment variable management and deployment
- **`production-port-diagnostic.js`**: Production troubleshooting and diagnostics

## 🎉 Best Practices

1. **Monitor Before Manual Intervention**: Always check GitHub Actions before triggering manual deployments
2. **Use Watch Mode for Critical Deployments**: Real-time monitoring for production releases
3. **Combine with App Runner Monitoring**: Complete deployment pipeline visibility
4. **Keep URLs Handy**: Use provided GitHub Actions URLs for detailed investigation
5. **Document Failures**: Record failed deployment details for post-mortem analysis

---

*The GitHub Action Monitor is designed to provide comprehensive CI/CD pipeline visibility and seamlessly integrate with the Wavelength Lore deployment workflow.*