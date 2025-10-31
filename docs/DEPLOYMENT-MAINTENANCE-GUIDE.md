# 🚀 DEPLOYMENT & MAINTENANCE GUIDE

**Document:** Operations Manual for Multi-Site Platform  
**Project:** Wavelength Multi-Site Replication System  
**Target:** 2 sites per day operational capability  

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment Setup (One-Time)

#### 1. Infrastructure Prerequisites
```bash
# ✅ Server Requirements
- Node.js 18+ with npm/yarn
- Firebase CLI installed globally
- AWS CLI configured with admin access
- Docker (optional, for containerized deployments)
- SSL certificates for *.wavelengthplatform.com

# ✅ Development Environment
- Git repository access
- Environment variables configured
- Database migration scripts ready
- Backup systems operational
```

#### 2. Master Platform Setup
```bash
# Clone and setup master platform
git clone https://github.com/your-org/wavelength-multi-tenant
cd wavelength-multi-tenant
npm install

# Copy environment template
cp .env.example .env.master

# Configure master environment variables
nano .env.master
```

#### 3. Template Validation
```bash
# Validate all site templates
npm run validate:templates

# Test template inheritance
npm run test:template-merging

# Verify feature toggles
npm run test:features
```

---

## 🏗️ SITE PROVISIONING WORKFLOW

### Daily Operations: 2 Sites Per Day

#### Morning Session (Site 1)
**Time Budget: 2 hours**

```bash
# 1. Client Intake (30 minutes)
./scripts/client-intake.js --interactive

# 2. Generate Site Configuration (15 minutes)
./scripts/generate-config.js \
  --template music-site \
  --tenant harmonic-tales \
  --loremaster "Alex Thompson <alex@harmonictales.com>" \
  --domain harmonictales.com

# 3. Provision External Services (45 minutes)
./scripts/provision-external.js harmonic-tales.json

# 4. Deploy Site (30 minutes)
./scripts/deploy-site.js harmonic-tales.json --production
```

#### Afternoon Session (Site 2)
**Time Budget: 2 hours**

```bash
# Repeat process for second site
./scripts/provision-workflow.js art-gallery-config.json
```

### Automated Provisioning Script
```bash
#!/bin/bash
# scripts/provision-workflow.js

set -e

CONFIG_FILE=$1
if [ -z "$CONFIG_FILE" ]; then
    echo "Usage: $0 <config-file.json>"
    exit 1
fi

echo "🌟 Starting site provisioning workflow..."

# Step 1: Validate configuration
echo "📋 Validating configuration..."
node scripts/validate-config.js "$CONFIG_FILE"

# Step 2: Provision external services
echo "🔗 Setting up external services..."
node scripts/provision-external.js "$CONFIG_FILE"

# Step 3: Create tenant configuration
echo "⚙️ Creating tenant configuration..."
node scripts/create-tenant-config.js "$CONFIG_FILE"

# Step 4: Initialize database
echo "💾 Initializing database..."
node scripts/init-database.js "$CONFIG_FILE"

# Step 5: Deploy application
echo "🚀 Deploying application..."
node scripts/deploy-site.js "$CONFIG_FILE" --production

# Step 6: Configure DNS
echo "🌐 Configuring DNS..."
node scripts/configure-dns.js "$CONFIG_FILE"

# Step 7: Health checks
echo "🏥 Running health checks..."
node scripts/health-check.js "$CONFIG_FILE"

# Step 8: Send welcome package
echo "📧 Sending welcome package..."
node scripts/send-welcome.js "$CONFIG_FILE"

echo "✅ Site provisioning completed successfully!"
```

---

## 🔧 CONFIGURATION MANAGEMENT

### Client Configuration Template
```json
{
  "clientInfo": {
    "name": "Harmonic Tales Music",
    "contactEmail": "alex@harmonictales.com",
    "contactName": "Alex Thompson",
    "phone": "+1-555-0123",
    "timezone": "America/New_York"
  },
  "siteConfig": {
    "tenantId": "harmonic-tales",
    "template": "music-site",
    "customDomain": "harmonictales.com",
    "siteName": "Harmonic Tales",
    "tagline": "Progressive Rock Stories"
  },
  "branding": {
    "primaryColor": "#6A1B9A",
    "secondaryColor": "#D32F2F",
    "logoFile": "./assets/harmonic-tales-logo.png",
    "faviconFile": "./assets/harmonic-tales-favicon.ico"
  },
  "features": {
    "forum": true,
    "merchandise": true,
    "chatbot": true,
    "games": false,
    "quests": false,
    "badges": false
  },
  "externalServices": {
    "firebase": {
      "projectName": "harmonic-tales-lore"
    },
    "aws": {
      "region": "us-east-1",
      "bucketName": "harmonic-tales-assets"
    },
    "stripe": {
      "accountName": "Harmonic Tales LLC"
    },
    "printify": {
      "shopName": "Harmonic Tales Store"
    }
  },
  "contentPlan": {
    "initialAlbums": 3,
    "initialArtists": 5,
    "forumCategories": ["general", "music", "theory", "prog-rock"],
    "merchandiseProducts": ["apparel", "accessories"]
  }
}
```

### Configuration Generator Script
```javascript
// scripts/generate-config.js
#!/usr/bin/env node

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

class ConfigGenerator {
  async generateInteractive() {
    console.log('🎯 Wavelength Site Configuration Generator');
    console.log('━'.repeat(50));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientName',
        message: 'Client/Company Name:',
        validate: input => input.length > 0
      },
      {
        type: 'input', 
        name: 'contactEmail',
        message: 'LoreMaster Email:',
        validate: input => /\S+@\S+\.\S+/.test(input)
      },
      {
        type: 'input',
        name: 'contactName',
        message: 'LoreMaster Full Name:',
        validate: input => input.length > 0
      },
      {
        type: 'list',
        name: 'template',
        message: 'Site Template:',
        choices: [
          { name: '🎵 Music & Lore Site', value: 'music-site' },
          { name: '🎨 Visual Art Gallery', value: 'art-site' },
          { name: '📚 Literature Community', value: 'literature-site' },
          { name: '🎮 Gaming Hub', value: 'gaming-site' }
        ]
      },
      {
        type: 'input',
        name: 'tenantId',
        message: 'Site ID (lowercase, no spaces):',
        validate: input => /^[a-z0-9-]+$/.test(input)
      },
      {
        type: 'input',
        name: 'siteName',
        message: 'Site Display Name:',
        validate: input => input.length > 0
      },
      {
        type: 'input',
        name: 'tagline',
        message: 'Site Tagline:',
        default: 'Where Stories Come Alive'
      },
      {
        type: 'confirm',
        name: 'customDomain',
        message: 'Will you use a custom domain?',
        default: false
      },
      {
        type: 'input',
        name: 'domainName',
        message: 'Custom Domain Name:',
        when: answers => answers.customDomain,
        validate: input => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(input)
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Enable Features:',
        choices: [
          { name: 'Forum Discussion', value: 'forum', checked: true },
          { name: 'Merchandise Store', value: 'merchandise', checked: true },
          { name: 'AI Chatbot', value: 'chatbot', checked: true },
          { name: 'Games & Puzzles', value: 'games', checked: false },
          { name: 'Quests & Challenges', value: 'quests', checked: false },
          { name: 'Badges & Achievements', value: 'badges', checked: false }
        ]
      },
      {
        type: 'input',
        name: 'primaryColor',
        message: 'Primary Brand Color (hex):',
        default: '#8B5CF6',
        validate: input => /^#[0-9A-F]{6}$/i.test(input)
      },
      {
        type: 'confirm',
        name: 'generateExternal',
        message: 'Generate external service account setup scripts?',
        default: true
      }
    ]);

    return this.buildConfiguration(answers);
  }

  buildConfiguration(answers) {
    const config = {
      clientInfo: {
        name: answers.clientName,
        contactEmail: answers.contactEmail,
        contactName: answers.contactName,
        timezone: "America/New_York"
      },
      siteConfig: {
        tenantId: answers.tenantId,
        template: answers.template,
        siteName: answers.siteName,
        tagline: answers.tagline,
        customDomain: answers.customDomain ? answers.domainName : null
      },
      branding: {
        primaryColor: answers.primaryColor,
        secondaryColor: this.generateSecondaryColor(answers.primaryColor),
        logoFile: `./assets/${answers.tenantId}-logo.png`,
        faviconFile: `./assets/${answers.tenantId}-favicon.ico`
      },
      features: {
        forum: answers.features.includes('forum'),
        merchandise: answers.features.includes('merchandise'),
        chatbot: answers.features.includes('chatbot'),
        games: answers.features.includes('games'),
        quests: answers.features.includes('quests'),
        badges: answers.features.includes('badges')
      },
      externalServices: {
        firebase: {
          projectName: `${answers.tenantId}-lore`
        },
        aws: {
          region: "us-east-1",
          bucketName: `${answers.tenantId}-assets`
        },
        stripe: {
          accountName: `${answers.clientName} LLC`
        },
        printify: {
          shopName: `${answers.siteName} Store`
        }
      },
      generateExternal: answers.generateExternal
    };

    return config;
  }

  generateSecondaryColor(primary) {
    // Simple color generation logic
    const colorMap = {
      '#8B5CF6': '#EC4899', // Purple -> Pink
      '#6A1B9A': '#D32F2F', // Deep Purple -> Dark Red
      '#F44336': '#FF9800', // Red -> Orange
      '#3F51B5': '#9C27B0'  // Indigo -> Purple
    };
    
    return colorMap[primary] || '#EC4899';
  }

  async saveConfiguration(config) {
    const filename = `${config.siteConfig.tenantId}-config.json`;
    const filepath = path.join('./configs', filename);
    
    // Ensure configs directory exists
    if (!fs.existsSync('./configs')) {
      fs.mkdirSync('./configs');
    }

    fs.writeFileSync(filepath, JSON.stringify(config, null, 2));
    
    console.log(`\n✅ Configuration saved to: ${filepath}`);
    
    if (config.generateExternal) {
      this.generateExternalSetupScripts(config);
    }
    
    return filepath;
  }

  generateExternalSetupScripts(config) {
    const scriptsDir = `./scripts/setup-${config.siteConfig.tenantId}`;
    
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    // Firebase setup script
    const firebaseSetup = `#!/bin/bash
# Firebase Setup for ${config.siteConfig.siteName}

echo "🔥 Setting up Firebase project..."

# Create new Firebase project
firebase projects:create ${config.externalServices.firebase.projectName} --display-name "${config.siteConfig.siteName}"

# Initialize Firestore
firebase firestore:deploy --project ${config.externalServices.firebase.projectName}

echo "✅ Firebase setup complete!"
echo "📝 Next steps:"
echo "   1. Enable Authentication in Firebase Console"
echo "   2. Add web app configuration"  
echo "   3. Download service account key"
`;

    fs.writeFileSync(`${scriptsDir}/setup-firebase.sh`, firebaseSetup);
    fs.chmodSync(`${scriptsDir}/setup-firebase.sh`, '755');

    // AWS setup script
    const awsSetup = `#!/bin/bash
# AWS Setup for ${config.siteConfig.siteName}

echo "☁️ Setting up AWS resources..."

# Create S3 bucket
aws s3 mb s3://${config.externalServices.aws.bucketName} --region ${config.externalServices.aws.region}

# Create IAM user
aws iam create-user --user-name ${config.siteConfig.tenantId}-app-user

# Attach S3 policy
aws iam attach-user-policy --user-name ${config.siteConfig.tenantId}-app-user --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name ${config.siteConfig.tenantId}-app-user

echo "✅ AWS setup complete!"
echo "📝 Save the access keys in your configuration"
`;

    fs.writeFileSync(`${scriptsDir}/setup-aws.sh`, awsSetup);
    fs.chmodSync(`${scriptsDir}/setup-aws.sh`, '755');

    console.log(`\n📜 Setup scripts generated in: ${scriptsDir}`);
  }
}

// CLI execution
if (require.main === module) {
  const generator = new ConfigGenerator();
  
  generator.generateInteractive()
    .then(config => generator.saveConfiguration(config))
    .then(filepath => {
      console.log('\n🎉 Configuration generation complete!');
      console.log(`\n🚀 Next step: ./scripts/provision-workflow.js ${filepath}`);
    })
    .catch(error => {
      console.error('❌ Configuration generation failed:', error);
      process.exit(1);
    });
}

module.exports = ConfigGenerator;
```

---

## 🔍 MONITORING & HEALTH CHECKS

### Automated Health Monitoring
```javascript
// scripts/health-monitor.js
class HealthMonitor {
  constructor() {
    this.tenants = this.loadTenantList();
    this.healthChecks = {
      database: this.checkDatabaseConnection,
      storage: this.checkStorageAccess,
      payment: this.checkPaymentProcessing,
      dns: this.checkDNSResolution,
      ssl: this.checkSSLCertificate
    };
  }

  async runAllHealthChecks() {
    const results = {};
    
    for (const tenant of this.tenants) {
      console.log(`🏥 Checking health for: ${tenant.tenantId}`);
      results[tenant.tenantId] = await this.runTenantHealthCheck(tenant);
    }
    
    return this.generateHealthReport(results);
  }

  async runTenantHealthCheck(tenant) {
    const results = {};
    
    for (const [checkName, checkFunction] of Object.entries(this.healthChecks)) {
      try {
        const startTime = Date.now();
        const result = await checkFunction.call(this, tenant);
        const duration = Date.now() - startTime;
        
        results[checkName] = {
          status: 'healthy',
          responseTime: duration,
          details: result
        };
      } catch (error) {
        results[checkName] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return results;
  }

  async checkDatabaseConnection(tenant) {
    const serviceFactory = new TenantServiceFactory(tenant.tenantId, tenant.config);
    const firebase = serviceFactory.getFirebaseService();
    
    // Test database read/write
    const testDoc = await firebase.collection('health-check').doc('test').set({
      timestamp: new Date(),
      tenantId: tenant.tenantId
    });
    
    await firebase.collection('health-check').doc('test').delete();
    
    return { connection: 'successful' };
  }

  async checkStorageAccess(tenant) {
    const serviceFactory = new TenantServiceFactory(tenant.tenantId, tenant.config);
    const s3 = serviceFactory.getS3Service();
    
    // Test file upload/delete
    const testContent = Buffer.from(`Health check ${Date.now()}`);
    const result = await s3.uploadFile(testContent, 'health-check.txt');
    await s3.deleteFile('health-check.txt');
    
    return { storage: 'accessible', uploadTime: result.uploadTime };
  }

  generateHealthReport(results) {
    const summary = {
      timestamp: new Date().toISOString(),
      totalTenants: Object.keys(results).length,
      healthyTenants: 0,
      unhealthyTenants: 0,
      issues: []
    };

    for (const [tenantId, checks] of Object.entries(results)) {
      const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
      
      if (isHealthy) {
        summary.healthyTenants++;
      } else {
        summary.unhealthyTenants++;
        summary.issues.push({
          tenant: tenantId,
          failedChecks: Object.entries(checks)
            .filter(([_, check]) => check.status === 'unhealthy')
            .map(([name, check]) => ({ name, error: check.error }))
        });
      }
    }

    return { summary, details: results };
  }
}

// Automated monitoring
if (require.main === module) {
  const monitor = new HealthMonitor();
  
  monitor.runAllHealthChecks()
    .then(report => {
      console.log(JSON.stringify(report, null, 2));
      
      if (report.summary.unhealthyTenants > 0) {
        console.error(`⚠️ ${report.summary.unhealthyTenants} tenants need attention`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Health monitoring failed:', error);
      process.exit(1);
    });
}
```

---

## 🛠️ MAINTENANCE OPERATIONS

### Daily Maintenance Tasks
```bash
#!/bin/bash
# scripts/daily-maintenance.sh

echo "🔧 Starting daily maintenance..."

# 1. Health checks
echo "🏥 Running health checks..."
node scripts/health-monitor.js

# 2. Backup verification  
echo "💾 Verifying backups..."
node scripts/verify-backups.js

# 3. Credit usage monitoring
echo "💳 Monitoring credit usage..."
node scripts/monitor-credits.js

# 4. Performance metrics
echo "📊 Collecting performance metrics..."
node scripts/collect-metrics.js

# 5. Security scans
echo "🔒 Running security scans..."
node scripts/security-scan.js

# 6. Update check
echo "🆙 Checking for updates..."
node scripts/check-updates.js

echo "✅ Daily maintenance complete!"
```

### Weekly Maintenance Tasks
```bash
#!/bin/bash
# scripts/weekly-maintenance.sh

echo "🗓️ Starting weekly maintenance..."

# 1. Full database backup
echo "💾 Full database backup..."
node scripts/backup-databases.js --full

# 2. Certificate renewal check
echo "🔐 Certificate renewal check..."
node scripts/check-certificates.js

# 3. Performance optimization
echo "⚡ Performance optimization..."
node scripts/optimize-performance.js

# 4. Cleanup old logs
echo "🧹 Cleaning old logs..."
node scripts/cleanup-logs.js --older-than 30d

# 5. Update tenant statistics
echo "📈 Updating tenant statistics..."
node scripts/update-stats.js

echo "✅ Weekly maintenance complete!"
```

### Troubleshooting Guide

#### Common Issues & Solutions

**Issue: Site Not Loading**
```bash
# 1. Check DNS resolution
dig +short example.com

# 2. Verify SSL certificate
openssl s_client -connect example.com:443 -servername example.com

# 3. Check application logs
node scripts/get-logs.js --tenant example-tenant --last 1h

# 4. Test tenant configuration
node scripts/validate-tenant.js example-tenant
```

**Issue: Database Connection Failures**
```bash
# 1. Test Firebase connectivity
node scripts/test-firebase.js --tenant example-tenant

# 2. Check service account permissions
node scripts/verify-permissions.js --tenant example-tenant

# 3. Validate environment variables
node scripts/check-env.js --tenant example-tenant
```

**Issue: Payment Processing Errors**
```bash
# 1. Test Stripe connectivity
node scripts/test-stripe.js --tenant example-tenant

# 2. Verify webhook endpoints
node scripts/test-webhooks.js --tenant example-tenant

# 3. Check payment logs
node scripts/get-payment-logs.js --tenant example-tenant --last 24h
```

---

## 📊 PERFORMANCE MONITORING

### Key Performance Indicators

#### Deployment Metrics
- **Provisioning Time**: Target <4 hours per site
- **Success Rate**: Target >95% successful deployments
- **Rollback Time**: Target <30 minutes for failed deployments

#### System Performance
- **Response Time**: Target <2 seconds for all pages
- **Uptime**: Target >99.9% per tenant
- **Concurrent Users**: Support 1000+ across all tenants

#### Business Metrics  
- **Site Revenue**: Track per-tenant monthly revenue
- **Credit Usage**: Monitor AI service consumption
- **User Growth**: Track active users per tenant

### Monitoring Dashboard
```javascript
// dashboard/metrics.js
class MetricsDashboard {
  constructor() {
    this.metrics = {
      deployments: new Map(),
      performance: new Map(),
      revenue: new Map(),
      errors: new Map()
    };
  }

  async collectAllMetrics() {
    const tenants = await this.getTenantList();
    
    for (const tenant of tenants) {
      await this.collectTenantMetrics(tenant);
    }
    
    return this.generateDashboard();
  }

  async collectTenantMetrics(tenant) {
    // Collect various metrics for tenant
    const performanceMetrics = await this.getPerformanceMetrics(tenant);
    const revenueMetrics = await this.getRevenueMetrics(tenant);
    const errorMetrics = await this.getErrorMetrics(tenant);
    
    this.metrics.performance.set(tenant.id, performanceMetrics);
    this.metrics.revenue.set(tenant.id, revenueMetrics);
    this.metrics.errors.set(tenant.id, errorMetrics);
  }
}
```

---

## 🔐 SECURITY MAINTENANCE

### Security Checklist (Monthly)
```bash
#!/bin/bash
# scripts/security-maintenance.sh

# 1. Update all dependencies
npm audit fix

# 2. Rotate API keys (if needed)
node scripts/rotate-keys.js --check

# 3. Review access logs
node scripts/analyze-access.js --suspicious

# 4. Update security headers
node scripts/update-security-headers.js

# 5. Scan for vulnerabilities
npm audit --audit-level moderate

# 6. Backup security configurations
node scripts/backup-security.js
```

### Security Monitoring
- **Failed Login Attempts**: Alert on >5 attempts per IP
- **Unusual API Usage**: Monitor for suspicious patterns
- **Data Access Patterns**: Alert on cross-tenant access attempts
- **SSL Certificate Expiry**: Alert 30 days before expiration

---

## 📈 SCALING OPERATIONS

### Horizontal Scaling Strategy
```javascript
// When to scale up:
// - >80% CPU utilization for >10 minutes
// - Response times >3 seconds consistently  
// - >50 concurrent tenant sites
// - Database connection pool exhaustion

// Scaling actions:
// 1. Deploy additional application instances
// 2. Configure load balancer
// 3. Scale database read replicas
// 4. Implement CDN for static assets
```

### Capacity Planning
- **Current Capacity**: 50 tenant sites per server instance
- **Target Growth**: 100 new sites per month
- **Resource Scaling**: Plan server additions quarterly
- **Cost Optimization**: Monitor resource usage vs. revenue

This comprehensive deployment and maintenance guide provides the operational framework needed to successfully manage your ambitious 2-sites-per-day goal while maintaining high quality, security, and performance standards across all tenant sites.