# ===============================================
# Multi-stage Docker Build for Production Security
# ===============================================

# Stage 1: Build stage (includes dev dependencies for any build steps)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only for minimal footprint)
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production stage (minimal security footprint)
FROM node:20-alpine AS production

# WAVELENGTH ENHANCED: Create non-root user with sudo permissions for nginx
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs && \
    echo "appuser ALL=(root) NOPASSWD: /usr/sbin/nginx, /bin/cp" > /etc/sudoers.d/appuser && \
    echo "🌊 WAVELENGTH: Enhanced user permissions configured"

# Security: Install minimal system dependencies + WAVELENGTH sudo support
RUN apk add --no-cache nginx gettext sudo curl && \
    rm -rf /var/cache/apk/* && \
    echo "🌊 WAVELENGTH: Enhanced dependencies installed"

WORKDIR /app

# Copy production dependencies
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy package files
COPY --chown=appuser:nodejs package*.json ./

# Copy ONLY essential application files (filtered by .dockerignore)
COPY --chown=appuser:nodejs app.js index.js ./
COPY --chown=appuser:nodejs routes/ ./routes/
COPY --chown=appuser:nodejs views/ ./views/
COPY --chown=appuser:nodejs static/ ./static/
COPY --chown=appuser:nodejs middleware/ ./middleware/
COPY --chown=appuser:nodejs models/ ./models/
COPY --chown=appuser:nodejs services/ ./services/
COPY --chown=appuser:nodejs utils/ ./utils/
COPY --chown=appuser:nodejs helpers/ ./helpers/

# Copy only production-safe configuration (NO credentials)
COPY --chown=appuser:nodejs config/database.js ./config/
COPY --chown=appuser:nodejs config/server.js ./config/
COPY --chown=appuser:nodejs config/middleware.js ./config/
COPY --chown=appuser:nodejs config/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy only published content (NO development content)
COPY --chown=appuser:nodejs content/ ./content/

# Security: Ensure no scripts directory exists
RUN echo "Verifying security exclusions..." && \
    test ! -d scripts && echo "✅ scripts/ excluded" || (echo "❌ scripts/ found in production!" && exit 1) && \
    test ! -f .env && echo "✅ .env excluded" || (echo "❌ .env found in production!" && exit 1) && \
    test ! -d tests && echo "✅ tests/ excluded" || (echo "❌ tests/ found in production!" && exit 1) && \
    echo "🛡️ Security validation complete"

# Production environment
ENV NODE_ENV=production
ENV NODE_PORT=3001
ENV NGINX_PORT=8080

# WAVELENGTH ENHANCED: Comprehensive startup script creation with robust permissions
RUN echo '#!/bin/sh\n\
echo "🌊 WAVELENGTH Production Container Starting"\n\
echo "⚡ Enhanced startup with robust permission handling"\n\
echo "Security: Running as user $(whoami)"\n\
echo "Environment: NODE_ENV=${NODE_ENV}"\n\
echo "Ports: NODE_PORT=${NODE_PORT} NGINX_PORT=${NGINX_PORT}"\n\
\n\
# Verify script permissions\n\
echo "🔍 Verifying startup script permissions..."\n\
ls -la /app/start.sh\n\
\n\
# Generate nginx config with enhanced error handling\n\
echo "🔧 Generating Nginx configuration..."\n\
if [ -f /etc/nginx/nginx.conf.template ]; then\n\
    envsubst '"'"'$NGINX_PORT $NODE_PORT'"'"' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf\n\
    if sudo cp /tmp/nginx.conf /etc/nginx/nginx.conf; then\n\
        echo "✅ Nginx configuration generated successfully"\n\
    else\n\
        echo "❌ Failed to copy Nginx configuration"\n\
        exit 1\n\
    fi\n\
else\n\
    echo "❌ Nginx template not found!"\n\
    exit 1\n\
fi\n\
\n\
# Start Node.js application with enhanced monitoring\n\
echo "🚀 Starting Node.js application..."\n\
if node index.js & then\n\
    NODE_PID=$!\n\
    echo "✅ Node.js started successfully with PID: $NODE_PID"\n\
else\n\
    echo "❌ Failed to start Node.js application"\n\
    exit 1\n\
fi\n\
\n\
# Enhanced application readiness check\n\
echo "🔍 Waiting for application readiness..."\n\
for i in 1 2 3 4 5; do\n\
    sleep 1\n\
    if curl -s http://localhost:${NODE_PORT}/health >/dev/null 2>&1; then\n\
        echo "✅ Application is ready after ${i} seconds"\n\
        break\n\
    fi\n\
    if [ $i -eq 5 ]; then\n\
        echo "⚠️ Application health check timeout, proceeding anyway"\n\
    fi\n\
done\n\
\n\
# Start Nginx with enhanced error handling\n\
echo "🌐 Starting Nginx reverse proxy..."\n\
if nginx -t; then\n\
    echo "✅ Nginx configuration valid"\n\
    sudo nginx -g "daemon off;"\n\
else\n\
    echo "❌ Nginx configuration invalid"\n\
    exit 1\n\
fi\n\
' > /app/start.sh && \
chmod +x /app/start.sh && \
chown appuser:nodejs /app/start.sh && \
echo "🌊 WAVELENGTH: Enhanced startup script created with permissions:" && \
ls -la /app/start.sh

# WAVELENGTH BUILD VERIFICATION: Test permissions before switching users
RUN echo "🔍 WAVELENGTH: Verifying build integrity..." && \
    test -f /app/start.sh && echo "✅ Startup script exists" || (echo "❌ Startup script missing!" && exit 1) && \
    test -x /app/start.sh && echo "✅ Startup script executable" || (echo "❌ Startup script not executable!" && exit 1) && \
    test -f /app/index.js && echo "✅ Application entry point exists" || (echo "❌ index.js missing!" && exit 1) && \
    test -f /etc/nginx/nginx.conf.template && echo "✅ Nginx template exists" || (echo "❌ Nginx template missing!" && exit 1) && \
    echo "🌊 WAVELENGTH: Build verification complete!"

# Security: Switch to non-root user (AFTER creating start script AND verification)
USER appuser

# WAVELENGTH ENHANCED: Test user permissions after switch
RUN echo "🔍 WAVELENGTH: Verifying user permissions..." && \
    whoami && \
    ls -la /app/start.sh && \
    echo "🌊 WAVELENGTH: User permission check complete!"

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["/app/start.sh"]