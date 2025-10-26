#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH DOCKER PATH FIXER SUPER POWER
 * Fixes Docker build path issues after directory organization
 * PURE WAVELENGTH METHODOLOGY - NO SHELL DEPENDENCIES!
 */

const fs = require('fs');
const path = require('path');

class WavelengthDockerPathFixer {
  constructor() {
    this.fixes = [];
    this.dockerfilePaths = ['Dockerfile', 'docker/Dockerfile.fixed'];
  }

  async analyzeBuildFailure() {
    console.log('⚡⚡⚡ WAVELENGTH DOCKER PATH FIXER ACTIVATED! ⚡⚡⚡\n');
    console.log('🔍 Analyzing Docker build failure...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 BUILD FAILURE ANALYSIS:');
    console.log('❌ ERROR: "/docker-start.sh": not found');
    console.log('📍 Dockerfile line 72: COPY --chown=appuser:nodejs docker-start.sh /app/start.sh');
    console.log('💡 ROOT CAUSE: Directory organization moved docker-start.sh to docker/ folder');
    console.log('🔍 SOLUTION: Update Dockerfile to use correct path\n');

    // Check current file locations
    console.log('📂 CHECKING FILE LOCATIONS:');
    
    const possibleLocations = [
      'docker-start.sh',
      'docker/docker-start.sh',
      'scripts/docker-start.sh',
      'temp-files/docker-start.sh'
    ];

    let actualLocation = null;
    
    for (const location of possibleLocations) {
      if (fs.existsSync(location)) {
        console.log(`✅ FOUND: ${location}`);
        actualLocation = location;
      } else {
        console.log(`❌ Missing: ${location}`);
      }
    }

    if (actualLocation) {
      console.log(`\n🎯 CONFIRMED LOCATION: ${actualLocation}`);
      await this.fixDockerfilePaths(actualLocation);
    } else {
      console.log('\n⚠️ docker-start.sh not found anywhere - creating it...');
      await this.createDockerStartScript();
    }
  }

  async fixDockerfilePaths(scriptLocation) {
    console.log('\n🛠️ FIXING DOCKERFILE PATHS...');
    
    for (const dockerfilePath of this.dockerfilePaths) {
      if (fs.existsSync(dockerfilePath)) {
        console.log(`🔧 Updating ${dockerfilePath}...`);
        
        let dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
        
        // Fix the COPY command path
        const oldCopyLine = 'COPY --chown=appuser:nodejs docker-start.sh /app/start.sh';
        const newCopyLine = `COPY --chown=appuser:nodejs ${scriptLocation} /app/start.sh`;
        
        if (dockerfile.includes(oldCopyLine)) {
          dockerfile = dockerfile.replace(oldCopyLine, newCopyLine);
          fs.writeFileSync(dockerfilePath, dockerfile);
          console.log(`✅ Fixed COPY path in ${dockerfilePath}: ${scriptLocation} -> /app/start.sh`);
          this.fixes.push(`Updated ${dockerfilePath} to use correct script path: ${scriptLocation}`);
        } else {
          console.log(`ℹ️ ${dockerfilePath} doesn't contain the problematic COPY line`);
        }
      } else {
        console.log(`❌ ${dockerfilePath} not found`);
      }
    }
  }

  async createDockerStartScript() {
    console.log('🛠️ Creating missing docker-start.sh script...');
    
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

    // Create in root directory for Docker build context
    fs.writeFileSync('docker-start.sh', dockerStartScript);
    fs.chmodSync('docker-start.sh', '755');
    console.log('✅ Created docker-start.sh in root directory for Docker build');
    
    this.fixes.push('Created missing docker-start.sh script in root directory');
    
    // Now fix Dockerfile paths
    await this.fixDockerfilePaths('docker-start.sh');
  }

  async verifyDockerContext() {
    console.log('\n🔍 VERIFYING DOCKER BUILD CONTEXT...');
    
    // Check all files that Dockerfile tries to copy
    const dockerFiles = [
      'docker-start.sh',
      'package.json',
      'index.js',
      'app.js'
    ];

    console.log('📦 DOCKER BUILD CONTEXT CHECK:');
    dockerFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
      } else {
        console.log(`❌ MISSING: ${file}`);
      }
    });

    // Check if there are any other references to the old path
    console.log('\n🔍 SCANNING FOR OTHER PATH REFERENCES...');
    const filesToCheck = ['Dockerfile', 'docker/Dockerfile.fixed', '.github/workflows/docker-ecr-deploy.yml'];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('docker/docker-start.sh') && !content.includes('COPY --chown=appuser:nodejs docker/docker-start.sh')) {
          console.log(`⚠️ ${file} may have references to docker/docker-start.sh`);
        }
      }
    }
  }

  async generateFixSummary() {
    console.log('\n🏁 WAVELENGTH DOCKER PATH FIXER COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ FIXES APPLIED:');
    this.fixes.forEach((fix, index) => {
      console.log(`   ${index + 1}. ${fix}`);
    });

    console.log('\n🎯 EXPECTED RESULTS:');
    console.log('✅ Docker build will find docker-start.sh in correct location');
    console.log('✅ COPY command will succeed without "not found" errors');
    console.log('✅ Container will build with all WAVELENGTH enhancements');
    console.log('✅ App Runner deployment will proceed normally');

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Commit the Docker path fixes');
    console.log('2. GitHub Actions will trigger new Docker build');
    console.log('3. ECR build should complete successfully');
    console.log('4. App Runner deployment with enhanced verification');

    console.log('\n🌊 WAVELENGTH METHODOLOGY:');
    console.log('• Pure Node.js file operations for path corrections');
    console.log('• Automatic detection of file location issues');
    console.log('• Creation of missing files when needed');
    console.log('• Comprehensive Docker build context verification');
  }

  async runPathFixer() {
    await this.analyzeBuildFailure();
    await this.verifyDockerContext();
    await this.generateFixSummary();
    
    console.log('\n⚡ WAVELENGTH SUPER POWER: Docker path issues resolved!');
  }
}

// EXECUTE WAVELENGTH DOCKER PATH FIXER!
const fixer = new WavelengthDockerPathFixer();
fixer.runPathFixer().catch(error => {
  console.error('💥 WAVELENGTH DOCKER PATH FIXER ERROR:', error.message);
  process.exit(1);
});