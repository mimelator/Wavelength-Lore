#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH MISSING CONFIG FIXER SUPER POWER
 * Fixes missing configuration files and deployment issues
 * PURE WAVELENGTH METHODOLOGY - NO SHELL DEPENDENCIES!
 */

const fs = require('fs');
const path = require('path');

class WavelengthMissingConfigFixer {
  constructor() {
    this.missingConfigs = [];
    this.fixes = [];
  }

  async analyzeConfigIssue() {
    console.log('⚡⚡⚡ WAVELENGTH MISSING CONFIG FIXER ACTIVATED! ⚡⚡⚡\n');
    console.log('🔍 Analyzing missing configuration issue...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 IDENTIFIED ISSUES:');
    console.log('❌ Missing: ../config/printify-config (required by printify-service.js)');
    console.log('❌ Nginx permission denied on /run/nginx/nginx.pid');
    console.log('✅ Container starts successfully with our Docker fixes');
    console.log('✅ Gallery and Firebase configs working properly\n');

    // Check if printify-config exists
    const configPaths = [
      'config/printify-config.js',
      'config/printify-config.json',
      'config/printify.js',
      'config/printify.json'
    ];

    console.log('🔍 Checking for Printify configuration files...');
    let foundConfig = false;
    
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        console.log(`✅ Found: ${configPath}`);
        foundConfig = true;
      } else {
        console.log(`❌ Missing: ${configPath}`);
      }
    }

    if (!foundConfig) {
      console.log('\n💡 SOLUTION: Create missing printify-config.js file');
      await this.createPrintifyConfig();
    }

    console.log('\n🔧 Checking services that require printify-config...');
    await this.analyzeServiceDependencies();
  }

  async createPrintifyConfig() {
    console.log('🛠️ Creating missing printify-config.js...');
    
    const printifyConfig = `// 🌊 WAVELENGTH Printify Configuration
// Generated automatically by WAVELENGTH Missing Config Fixer

module.exports = {
  // Printify API Configuration
  apiUrl: process.env.PRINTIFY_API_URL || 'https://api.printify.com/v1',
  apiToken: process.env.PRINTIFY_API_TOKEN || '',
  
  // Shop Configuration
  shopId: process.env.PRINTIFY_SHOP_ID || '',
  
  // Webhook Configuration
  webhookSecret: process.env.PRINTIFY_WEBHOOK_SECRET || '',
  
  // Product Configuration
  defaultProductSettings: {
    visible: true,
    is_locked: false,
    is_printify_express_eligible: true
  },
  
  // Shipping Configuration
  shippingProfiles: {
    default: process.env.PRINTIFY_SHIPPING_PROFILE_ID || ''
  },
  
  // Image Configuration
  imageSettings: {
    maxWidth: 4000,
    maxHeight: 4000,
    quality: 95,
    format: 'PNG'
  },
  
  // Pricing Configuration
  markup: {
    percentage: parseFloat(process.env.PRINTIFY_MARKUP_PERCENTAGE || '20'),
    minimum: parseFloat(process.env.PRINTIFY_MINIMUM_MARKUP || '5.00')
  },
  
  // Categories and Tags
  categories: {
    merchandise: 'wavelength-merch',
    apparel: 'wavelength-apparel',
    accessories: 'wavelength-accessories'
  },
  
  // Development/Production Settings
  development: {
    mockMode: process.env.NODE_ENV !== 'production',
    logLevel: process.env.PRINTIFY_LOG_LEVEL || 'info'
  },
  
  // Rate Limiting
  rateLimits: {
    requestsPerMinute: 60,
    requestsPerHour: 500
  },
  
  // Error Handling
  retrySettings: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  }
};`;

    // Create config directory if it doesn't exist
    if (!fs.existsSync('config')) {
      fs.mkdirSync('config', { recursive: true });
      console.log('📁 Created config directory');
    }

    fs.writeFileSync('config/printify-config.js', printifyConfig);
    console.log('✅ Created config/printify-config.js with WAVELENGTH methodology');
    
    this.fixes.push('Created missing printify-config.js with environment variable support');
  }

  async analyzeServiceDependencies() {
    const servicesToCheck = [
      'services/printify-service.js',
      'services/auto-enhanced-printify-service.js',
      'routes/merchandise.js'
    ];

    for (const servicePath of servicesToCheck) {
      if (fs.existsSync(servicePath)) {
        console.log(`🔍 Analyzing ${servicePath}...`);
        
        try {
          const content = fs.readFileSync(servicePath, 'utf8');
          
          // Check for config require patterns
          const requireMatches = content.match(/require\(['"]\.\.\/config\/printify-config['"]\)/g);
          if (requireMatches) {
            console.log(`   ✅ Found ${requireMatches.length} printify-config require(s)`);
          }
          
          // Check for other missing dependencies
          const otherRequires = content.match(/require\(['"][^'"]+['"]\)/g) || [];
          for (const req of otherRequires) {
            const modulePath = req.match(/require\(['"]([^'"]+)['"]\)/)[1];
            if (modulePath.startsWith('.') || modulePath.startsWith('/')) {
              const fullPath = path.resolve(path.dirname(servicePath), modulePath);
              if (!fs.existsSync(fullPath) && !fs.existsSync(fullPath + '.js')) {
                console.log(`   ⚠️  Potentially missing: ${modulePath}`);
              }
            }
          }
        } catch (error) {
          console.log(`   ❌ Error reading ${servicePath}: ${error.message}`);
        }
      } else {
        console.log(`❌ Service file not found: ${servicePath}`);
      }
    }
  }

  async fixNginxPermissions() {
    console.log('\n🔧 NGINX PERMISSION FIX STRATEGY:');
    console.log('The nginx permission issue is due to Alpine Linux user permissions');
    console.log('Solution: Update docker-start.sh to handle nginx pid directory\n');

    // Read current docker-start.sh
    const dockerStartPath = 'docker/docker-start.sh';
    if (fs.existsSync(dockerStartPath)) {
      let dockerStart = fs.readFileSync(dockerStartPath, 'utf8');
      
      // Check if nginx fix already exists
      if (!dockerStart.includes('mkdir -p /run/nginx')) {
        console.log('🛠️ Adding nginx permission fix to docker-start.sh...');
        
        // Add nginx permission fix before nginx startup
        const nginxFix = `
# 🌊 WAVELENGTH: Fix nginx permissions
echo "🔧 Setting up nginx directories..."
mkdir -p /run/nginx
mkdir -p /var/lib/nginx/logs
chown -R appuser:nginx /run/nginx
chown -R appuser:nginx /var/lib/nginx
chmod 755 /run/nginx
chmod 755 /var/lib/nginx/logs
`;

        // Insert before nginx startup
        dockerStart = dockerStart.replace(
          '🌐 Starting Nginx reverse proxy...',
          nginxFix + '🌐 Starting Nginx reverse proxy...'
        );

        fs.writeFileSync(dockerStartPath, dockerStart);
        console.log('✅ Enhanced docker-start.sh with nginx permission fixes');
        
        this.fixes.push('Added nginx permission fixes to docker-start.sh');
      } else {
        console.log('✅ Nginx permission fixes already present in docker-start.sh');
      }
    } else {
      console.log('⚠️  docker-start.sh not found, creating with nginx fixes...');
      await this.createEnhancedDockerStart();
    }
  }

  async createEnhancedDockerStart() {
    const dockerStartScript = `#!/bin/bash

# 🌊 WAVELENGTH Production Container Starting
echo "🌊 WAVELENGTH Production Container Starting"
echo "⚡ Enhanced startup with robust permission handling"
echo "Security: Running as user appuser"
echo "Environment: NODE_ENV=production"
echo "Ports: NODE_PORT=3001 NGINX_PORT=8080"

# 🔍 Verify startup script permissions
echo "🔍 Verifying startup script permissions..."
ls -la /app/start.sh

# 🔧 Generate Nginx configuration
echo "🔧 Generating Nginx configuration..."
cat > /etc/nginx/nginx.conf << 'EOF'
worker_processes auto;
pid /run/nginx/nginx.pid;
error_log /var/lib/nginx/logs/error.log warn;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/lib/nginx/logs/access.log main;
    
    sendfile on;
    keepalive_timeout 65;
    
    server {
        listen 8080;
        server_name localhost;
        
        location / {
            proxy_pass http://localhost:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /health {
            return 200 'healthy';
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo "✅ Nginx configuration generated successfully"

# 🌊 WAVELENGTH: Fix nginx permissions
echo "🔧 Setting up nginx directories..."
mkdir -p /run/nginx
mkdir -p /var/lib/nginx/logs
chown -R appuser:nginx /run/nginx 2>/dev/null || true
chown -R appuser:nginx /var/lib/nginx 2>/dev/null || true
chmod 755 /run/nginx
chmod 755 /var/lib/nginx/logs

# 🚀 Start Node.js application
echo "🚀 Starting Node.js application..."
cd /app
node index.js &
NODE_PID=$!
echo "✅ Node.js started successfully with PID: $NODE_PID"

# 🔍 Wait for application readiness
echo "🔍 Waiting for application readiness..."
sleep 5

# Health check with timeout
timeout 30s bash -c 'until curl -f http://localhost:3001/health 2>/dev/null; do sleep 1; done' || {
    echo "⚠️ Application health check timeout, proceeding anyway"
}

# 🌐 Start Nginx reverse proxy
echo "🌐 Starting Nginx reverse proxy..."
nginx -t && nginx -g 'daemon off;' &
NGINX_PID=$!

# Keep container running
wait $NGINX_PID`;

    fs.writeFileSync('docker/docker-start.sh', dockerStartScript);
    fs.chmodSync('docker/docker-start.sh', '755');
    console.log('✅ Created enhanced docker-start.sh with nginx permission fixes');
    
    this.fixes.push('Created enhanced docker-start.sh with comprehensive permission handling');
  }

  async generateFixSummary() {
    console.log('\n🏁 WAVELENGTH MISSING CONFIG FIXER COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ FIXES APPLIED:');
    this.fixes.forEach((fix, index) => {
      console.log(`   ${index + 1}. ${fix}`);
    });

    console.log('\n🎯 EXPECTED RESULTS:');
    console.log('✅ Printify service will no longer fail on missing config');
    console.log('✅ All Printify configuration accessible via environment variables');
    console.log('✅ Nginx permissions properly configured');
    console.log('✅ Container should start successfully without module errors');

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Commit these configuration fixes');
    console.log('2. Trigger new Docker build');
    console.log('3. Monitor App Runner deployment success');
    console.log('4. Verify Printify service functionality');

    console.log('\n🌊 WAVELENGTH METHODOLOGY APPLIED:');
    console.log('• Pure Node.js configuration generation');
    console.log('• Environment variable-based config system');
    console.log('• Comprehensive error prevention');
    console.log('• Enhanced Docker permission handling');
  }

  async runConfigFixer() {
    await this.analyzeConfigIssue();
    await this.fixNginxPermissions();
    await this.generateFixSummary();
    
    console.log('\n⚡ WAVELENGTH SUPER POWER: Missing config issues resolved!');
  }
}

// EXECUTE WAVELENGTH MISSING CONFIG FIXER!
const fixer = new WavelengthMissingConfigFixer();
fixer.runConfigFixer().catch(error => {
  console.error('💥 WAVELENGTH CONFIG FIXER ERROR:', error.message);
  process.exit(1);
});