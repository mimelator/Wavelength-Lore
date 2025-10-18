#!/bin/bash

# Production Server 502 Diagnostic Script
# Run this script on your production server to diagnose the 502 Bad Gateway error

echo "🔍 Wavelength Lore Production Diagnostic"
echo "========================================"
echo ""

# 1. Check if processes are running
echo "📊 Process Status:"
echo "=================="

echo "🔍 Checking Node.js processes..."
NODE_PROCESSES=$(ps aux | grep "node index.js" | grep -v grep | wc -l)
if [ $NODE_PROCESSES -gt 0 ]; then
    echo "✅ Node.js application is running ($NODE_PROCESSES processes)"
    ps aux | grep "node index.js" | grep -v grep | head -3
else
    echo "❌ CRITICAL: Node.js application is NOT running"
    echo "   This is likely the cause of your 502 error!"
fi

echo ""
echo "🔍 Checking Nginx processes..."
NGINX_PROCESSES=$(ps aux | grep nginx | grep -v grep | wc -l)
if [ $NGINX_PROCESSES -gt 0 ]; then
    echo "✅ Nginx is running ($NGINX_PROCESSES processes)"
else
    echo "❌ CRITICAL: Nginx is NOT running"
fi

echo ""

# 2. Check port connectivity
echo "🔌 Port Connectivity:"
echo "==================="

echo "🔍 Checking port 3001 (Node.js)..."
if nc -z localhost 3001 2>/dev/null; then
    echo "✅ Port 3001 is open and responding"
else
    echo "❌ CRITICAL: Port 3001 is not accessible"
    echo "   Your Node.js app should be listening on this port"
fi

echo "🔍 Checking port 8080 (Nginx)..."
if nc -z localhost 8080 2>/dev/null; then
    echo "✅ Port 8080 is open and responding"
else
    echo "❌ WARNING: Port 8080 is not accessible"
fi

echo ""

# 3. Check HTTP responses
echo "🌐 HTTP Response Test:"
echo "====================="

echo "🔍 Testing Node.js app directly (port 3001)..."
if curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost:3001 2>/dev/null; then
    echo " ✅"
else
    echo " ❌ Cannot reach Node.js application"
fi

echo ""
echo "🔍 Testing Nginx proxy (port 8080)..."
if curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost:8080 2>/dev/null; then
    echo " ✅"
else
    echo " ❌ Cannot reach Nginx proxy"
fi

echo ""

# 4. Check logs
echo "📋 Recent Logs:"
echo "==============="

echo "🔍 Last 10 lines of application logs (if using PM2 or systemd)..."
if command -v pm2 >/dev/null 2>&1; then
    echo "📊 PM2 status:"
    pm2 status 2>/dev/null || echo "No PM2 processes found"
    echo ""
    echo "📋 PM2 logs (last 20 lines):"
    pm2 logs --lines 20 2>/dev/null || echo "No PM2 logs available"
elif systemctl is-active --quiet wavelength-lore 2>/dev/null; then
    echo "📋 Systemd service logs:"
    sudo journalctl -u wavelength-lore --lines=10 --no-pager
else
    echo "ℹ️  No PM2 or systemd service detected"
fi

echo ""

# 5. Check Nginx logs
echo "🔍 Nginx error logs (last 10 lines)..."
if [ -f /var/log/nginx/error.log ]; then
    sudo tail -10 /var/log/nginx/error.log
else
    echo "❌ Nginx error log not found at /var/log/nginx/error.log"
fi

echo ""

# 6. Check environment and configuration
echo "⚙️  Configuration Check:"
echo "========================"

echo "🔍 Environment variables..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "🔑 Environment variables (showing only names):"
    grep "^[A-Z]" .env | cut -d'=' -f1 | sed 's/^/   - /'
else
    echo "❌ .env file not found"
fi

echo ""
echo "🔍 Nginx configuration..."
if [ -f /etc/nginx/nginx.conf ]; then
    echo "✅ Nginx config exists"
    echo "🔍 Checking if config mentions port 3001..."
    if grep -q "3001" /etc/nginx/nginx.conf; then
        echo "✅ Found port 3001 in Nginx config"
    else
        echo "❌ Port 3001 not found in Nginx config"
    fi
else
    echo "❌ Nginx config not found at /etc/nginx/nginx.conf"
fi

echo ""

# 7. Summary and recommendations
echo "🎯 DIAGNOSIS SUMMARY:"
echo "===================="

if [ $NODE_PROCESSES -eq 0 ]; then
    echo "❌ PRIMARY ISSUE: Node.js application is not running"
    echo ""
    echo "🛠️  IMMEDIATE FIXES:"
    echo "   1. Start your Node.js application:"
    echo "      cd /path/to/your/app"
    echo "      npm start"
    echo "      # OR"
    echo "      node index.js"
    echo ""
    echo "   2. Check for startup errors:"
    echo "      node index.js 2>&1 | tee startup.log"
    echo ""
    echo "   3. If using Docker:"
    echo "      docker ps -a  # Check container status"
    echo "      docker logs <container-name>  # Check logs"
    echo "      docker restart <container-name>  # Restart if needed"
    echo ""
elif ! nc -z localhost 3001 2>/dev/null; then
    echo "❌ PRIMARY ISSUE: Node.js app is running but not accessible on port 3001"
    echo ""
    echo "🛠️  IMMEDIATE FIXES:"
    echo "   1. Check if the app is listening on the correct port"
    echo "   2. Verify firewall rules"
    echo "   3. Check environment variables (PORT=3001)"
    echo ""
elif [ $NGINX_PROCESSES -eq 0 ]; then
    echo "❌ ISSUE: Nginx is not running"
    echo ""
    echo "🛠️  IMMEDIATE FIXES:"
    echo "   sudo systemctl start nginx"
    echo "   sudo systemctl enable nginx"
    echo ""
else
    echo "✅ Both services appear to be running"
    echo "🔍 The issue might be:"
    echo "   - Network connectivity between Nginx and Node.js"
    echo "   - Nginx configuration errors"
    echo "   - Resource constraints (memory, CPU)"
    echo "   - Application errors under load"
    echo ""
    echo "🛠️  NEXT STEPS:"
    echo "   1. Check detailed logs above"
    echo "   2. Test the application directly: curl -v http://localhost:3001"
    echo "   3. Check Nginx config: sudo nginx -t"
    echo "   4. Monitor resource usage: htop or top"
fi

echo ""
echo "📞 FOR ADDITIONAL HELP:"
echo "======================"
echo "1. Run: node debug/production-diagnostic.js (from your app directory)"
echo "2. Check container logs: docker logs <container-id>"
echo "3. Monitor real-time logs: tail -f /var/log/nginx/error.log"
echo "4. Test connectivity: curl -v http://localhost:3001"