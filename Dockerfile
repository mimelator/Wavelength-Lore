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

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Security: Install minimal system dependencies
RUN apk add --no-cache nginx gettext && \
    rm -rf /var/cache/apk/*

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

# Create production startup script (BEFORE switching to non-root user)
RUN echo '#!/bin/sh\n\
echo "🚀 Production Container Starting"\n\
echo "Security: Running as user $(whoami)"\n\
echo "Environment: NODE_ENV=${NODE_ENV}"\n\
echo "Ports: NODE_PORT=${NODE_PORT} NGINX_PORT=${NGINX_PORT}"\n\
\n\
# Generate nginx config\n\
envsubst '"'"'$NGINX_PORT $NODE_PORT'"'"' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf\n\
sudo cp /tmp/nginx.conf /etc/nginx/nginx.conf\n\
\n\
# Start Node.js application\n\
echo "Starting Node.js application..."\n\
node index.js &\n\
NODE_PID=$!\n\
echo "✅ Node.js started with PID: $NODE_PID"\n\
\n\
# Wait for application to be ready\n\
sleep 3\n\
\n\
# Start Nginx\n\
echo "Starting Nginx reverse proxy..."\n\
sudo nginx -g "daemon off;"\n\
' > /app/start.sh && chmod +x /app/start.sh && chown appuser:nodejs /app/start.sh

# Security: Switch to non-root user (AFTER creating start script)
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["/app/start.sh"]