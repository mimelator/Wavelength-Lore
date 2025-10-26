#!/bin/bash

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
wait $NGINX_PID