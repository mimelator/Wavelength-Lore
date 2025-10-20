# Use a Node.js base image with latest security patches
FROM node:20-bookworm-slim

# Set the working directory
WORKDIR /app

# Install Nginx first (separate layer for better caching)
RUN apt-get update && apt-get install -y nginx gettext-base && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies (production + dev)
# Not using --only=production to ensure no runtime deps are missing
RUN npm ci || npm install --no-cache

# Copy Nginx configuration template
COPY config/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy the application code
COPY . .

# Expose the ports for Nginx
EXPOSE 8080

# Set default environment variables for port configuration
ENV NODE_PORT=3001
ENV NGINX_PORT=8080
ENV NODE_ENV=production

# Create startup script that starts Node.js in background, then Nginx in foreground
RUN echo '#!/bin/sh\n\
echo "=== Container Starting ==="\n\
echo "Environment: NODE_ENV=${NODE_ENV}"\n\
echo "Ports: NODE_PORT=${NODE_PORT} NGINX_PORT=${NGINX_PORT} PORT=${PORT}"\n\
echo "Generating nginx config..."\n\
envsubst '"'"'$NGINX_PORT $NODE_PORT'"'"' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf\n\
echo "Starting Node.js application in background..."\n\
node index.js &\n\
NODE_PID=$!\n\
echo "Node.js started with PID: $NODE_PID"\n\
echo "Waiting 3 seconds for Node.js to be ready..."\n\
sleep 3\n\
echo "Starting Nginx..."\n\
nginx -g "daemon off;"\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]