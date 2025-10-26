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
    mkdir -p /etc/sudoers.d && \
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

# WAVELENGTH ENHANCED: Copy startup script from external file (much more reliable)
COPY --chown=appuser:nodejs docker/docker-start.sh /app/start.sh
RUN chmod +x /app/start.sh && \
    echo "🌊 WAVELENGTH: Enhanced startup script copied with permissions:" && \
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