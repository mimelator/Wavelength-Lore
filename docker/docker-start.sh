#!/bin/bash
echo "🌊 WAVELENGTH Production Container Starting"
echo "⚡ Enhanced startup with robust permission handling"
echo "Security: Running as user $(whoami)"
echo "Environment: NODE_ENV=${NODE_ENV}"
echo "Ports: NODE_PORT=${NODE_PORT} NGINX_PORT=${NGINX_PORT}"

# Verify script permissions
echo "🔍 Verifying startup script permissions..."
ls -la /app/start.sh

# Generate nginx config with enhanced error handling
echo "🔧 Generating Nginx configuration..."
if [ -f /etc/nginx/nginx.conf.template ]; then
    envsubst '$NGINX_PORT $NODE_PORT' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf
    if sudo cp /tmp/nginx.conf /etc/nginx/nginx.conf; then
        echo "✅ Nginx configuration generated successfully"
    else
        echo "❌ Failed to copy Nginx configuration"
        exit 1
    fi
else
    echo "❌ Nginx template not found!"
    exit 1
fi

# Start Node.js application with enhanced monitoring
echo "🚀 Starting Node.js application..."
cd /app
node index.js &
NODE_PID=$!
echo "✅ Node.js started successfully with PID: $NODE_PID"

# Enhanced application readiness check
echo "🔍 Waiting for application readiness..."
for i in 1 2 3 4 5; do
    sleep 1
    if curl -s http://localhost:${NODE_PORT}/health >/dev/null 2>&1; then
        echo "✅ Application is ready after ${i} seconds"
        break
    fi
    if [ $i -eq 5 ]; then
        echo "⚠️ Application health check timeout, proceeding anyway"
    fi
done

# 🌊 WAVELENGTH: Fix nginx permissions
echo "🔧 Setting up nginx directories..."
mkdir -p /run/nginx
mkdir -p /var/lib/nginx/logs
chown -R appuser:nginx /run/nginx 2>/dev/null || true
chown -R appuser:nginx /var/lib/nginx 2>/dev/null || true
chmod 755 /run/nginx
chmod 755 /var/lib/nginx/logs

# Start Nginx with enhanced error handling
echo "🌐 Starting Nginx reverse proxy..."
if nginx -t; then
    echo "✅ Nginx configuration valid"
    nginx -g 'daemon off;' &
    NGINX_PID=$!
    echo "✅ Nginx started with PID: $NGINX_PID"
    
    # Keep container running
    wait $NGINX_PID
else
    echo "❌ Nginx configuration invalid"
    exit 1
fi